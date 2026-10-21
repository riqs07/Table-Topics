// POST /api/analyse and GET /api/analyse (decision 91): the deeper analysis of one take. POST checks the passphrase, then that something is set up, then the audio's kind, length and size, then the call limits; then it sends the audio to the transcription service and the voice worker at the same time, each allowed to fail on its own, and sends back what came back. Nothing is stored here. GET says which parts are set up, for the Settings screen, and costs nothing

// Load the shared checks
import { checkAccess, countCall, reply, type GuardDeps } from "@/server/guard";
// Load the settings reader's type
import type { AnalysisSettings } from "@/server/env";
// Load the transcriber type
import type { Transcriber } from "@/server/transcriber";
// Load the voice worker type
import type { VoiceWorker } from "@/server/voiceWorker";
// Load the size limits shared with the app
import { ANALYSE_AUDIO_TYPES, ANALYSE_MAX_BYTES, LONGEST_RECORDING_SECONDS } from "@/core/requestLimits";
// Load the conversions into the shapes kept on the phone
import { toServerTranscript, toServerVoice } from "@/core/analysis/server";
// Load the transcription engine name
import { TRANSCRIPTION_ENGINE } from "@/config/models";
// Load how long each part may take
import { ANALYSE_TIMEOUT_MS } from "@/config/limits";
// Load the kept shapes
import type { ServerTranscript, ServerVoice } from "@/data/records";

// Load the header carrying the take's length (shared with the app)
import { DURATION_HEADER } from "@/config/headers";

// What the route needs beyond the shared checks
export interface AnalyseDeps extends GuardDeps {
  // Read which services are set up
  readAnalysisSettings(): AnalysisSettings;
  // Make the transcriber with its key
  makeTranscriber(apiKey: string): Transcriber;
  // Make the voice worker client
  makeVoiceWorker(worker: { url: string; secret: string }): VoiceWorker;
  // How long each part may take, in milliseconds (shorter in tests)
  timeoutMs?: number;
}

// Why a part has nothing to send back
export type PartFailure = "not-set-up" | "failed" | "timeout";

// The reply for a take: each part, or null with the reason
export interface AnalyseReply {
  // The verbatim transcript
  transcript: ServerTranscript | null;
  // The voice findings
  voice: ServerVoice | null;
  // Why a part is missing
  failures: { transcript?: PartFailure; voice?: PartFailure };
}

// The refusal when nothing is set up: the app shows it on the take and in Settings
export const NOT_SET_UP = "Deeper analysis isn't set up on the server.";

// The outcome of one part
type Outcome<T> = { ok: true; value: T } | { ok: false; reason: "failed" | "timeout"; message: string };

// Run one part with a time limit; it is told to stop when the time is up, and is given up on even if it does not
export async function withTimeLimit<T>(job: (signal: AbortSignal) => Promise<T>, ms: number): Promise<Outcome<T>> {
  // The stop signal
  const controller = new AbortController();
  // The timer
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Settles as "timeout" when the time is up
  const timeUp = new Promise<"timeout">((resolve) => {
    // Stop the part and give up on it
    timer = setTimeout(() => {
      // Tell the part to stop
      controller.abort(new Error("time limit"));
      // Report it
      resolve("timeout");
    }, ms);
  });
  // Whichever comes first
  try {
    // The part or the timer
    const result = await Promise.race([job(controller.signal).then((value) => ({ value })), timeUp]);
    // The timer won
    if (result === "timeout") return { ok: false, reason: "timeout", message: `took longer than ${Math.round(ms / 1000)} s` };
    // The part finished
    return { ok: true, value: result.value };
  } catch (error) {
    // Stopped by the timer, or failed on its own
    return controller.signal.aborted ? { ok: false, reason: "timeout", message: `took longer than ${Math.round(ms / 1000)} s` } : { ok: false, reason: "failed", message: error instanceof Error ? error.message : String(error) };
  } finally {
    // Never leave the timer running
    clearTimeout(timer);
  }
}

// Read the request's audio, at most the cap; null when it is over (counted as it arrives, so a missing or false length cannot get more through)
async function readCapped(request: Request, cap: number): Promise<ArrayBuffer | null> {
  // No body at all
  if (!request.body) return new ArrayBuffer(0);
  // The pieces so far
  const pieces: Uint8Array[] = [];
  // Their total
  let total = 0;
  // The reader
  const reader = request.body.getReader();
  // Until the end
  for (;;) {
    // The next piece
    const { done, value } = await reader.read();
    // The end
    if (done) break;
    // Count it
    total += value.byteLength;
    // Over the cap: stop reading
    if (total > cap) {
      // Let the rest go
      await reader.cancel().catch(() => undefined);
      // Too big
      return null;
    }
    // Keep it
    pieces.push(value);
  }
  // All the pieces in one buffer
  const joined = new Uint8Array(total);
  // Where the next piece goes
  let offset = 0;
  // Copy each
  for (const piece of pieces) {
    // In place
    joined.set(piece, offset);
    // Move on
    offset += piece.byteLength;
  }
  // The audio
  return joined.buffer;
}

// Build the handlers for /api/analyse
export function createAnalyseHandler(deps: AnalyseDeps) {
  // The time limit for each part
  const timeoutMs = deps.timeoutMs ?? ANALYSE_TIMEOUT_MS;
  // Where failures are noted
  const log = deps.log ?? ((line: string) => console.error(line));

  // POST: analyse one take
  async function POST(request: Request): Promise<Response> {
    // The passphrase and the app's settings first, so strangers learn nothing
    const access = await checkAccess(request, deps);
    // Refused there
    if ("refusal" in access) return access.refusal;
    // Which services are set up
    const settings = deps.readAnalysisSettings();
    // Neither: say so, with what is wrong in words (never values)
    if (!settings.assemblyAiKey && !settings.voiceWorker) return reply(503, { error: NOT_SET_UP, code: "not-set-up", problems: settings.problems });
    // The kind of audio, without its parameters
    const kind = (request.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
    // Not audio the route takes
    if (!ANALYSE_AUDIO_TYPES.includes(kind)) return reply(415, { error: "The recording's format is not one the route takes." });
    // The take's length
    const duration = Number(request.headers.get(DURATION_HEADER));
    // Missing, or longer than any session records
    if (!Number.isFinite(duration) || duration <= 0 || duration > LONGEST_RECORDING_SECONDS) return reply(400, { error: "The recording's length is missing or out of range." });
    // The size the caller says, refused before reading when over the cap
    const declared = Number(request.headers.get("content-length") ?? "0");
    // Too big
    if (declared > ANALYSE_MAX_BYTES) return reply(413, { error: "The recording is too large for deeper analysis.", code: "too-large" });
    // The audio, counted as it arrives
    const audio = await readCapped(request, ANALYSE_MAX_BYTES);
    // Too big after all
    if (audio === null) return reply(413, { error: "The recording is too large for deeper analysis.", code: "too-large" });
    // Empty
    if (audio.byteLength === 0) return reply(400, { error: "The recording was empty." });
    // Count the call last, so a refused request costs nothing
    const over = await countCall(deps, "Deeper analysis is paused because the usage counter is unavailable.", "Today's deeper-analysis limit is reached.");
    // Over the limits
    if (over) return over;

    // Both parts at once, each with its own time limit
    const [heard, measured] = await Promise.all([
      // The transcript, when its key is set
      settings.assemblyAiKey ? withTimeLimit((signal) => deps.makeTranscriber(settings.assemblyAiKey!).transcribe(audio, signal), timeoutMs) : null,
      // The voice, when the worker is set up
      settings.voiceWorker ? withTimeLimit((signal) => deps.makeVoiceWorker(settings.voiceWorker!).analyse(audio, kind, signal), timeoutMs) : null,
    ]);
    // When it finished
    const at = deps.now().toISOString();
    // The reply
    const body: AnalyseReply = { transcript: null, voice: null, failures: {} };
    // The transcript, or why not
    if (heard === null) body.failures.transcript = "not-set-up";
    // (it came)
    else if (heard.ok) body.transcript = toServerTranscript(heard.value.text, heard.value.words, TRANSCRIPTION_ENGINE, at);
    // (it failed: noted, by status and reason only)
    else {
      // Why
      body.failures.transcript = heard.reason;
      // Noted
      log(`Deeper analysis: the transcription failed (${heard.message}).`);
    }
    // The voice, or why not
    if (measured === null) body.failures.voice = "not-set-up";
    // (it came)
    else if (measured.ok) body.voice = toServerVoice(measured.value, at);
    // (it failed)
    else {
      // Why
      body.failures.voice = measured.reason;
      // Noted
      log(`Deeper analysis: the voice worker failed (${measured.message}).`);
    }
    // Nothing came back: a failure the app shows quietly on the take
    if (!body.transcript && !body.voice) return reply(502, { error: "Deeper analysis didn't work this time.", failures: body.failures }, { "cache-control": "no-store" });
    // Whatever came back
    return reply(200, body, { "cache-control": "no-store" });
  }

  // GET: which parts are set up (for Settings), behind the passphrase, free
  async function GET(request: Request): Promise<Response> {
    // The passphrase and the app's settings
    const access = await checkAccess(request, deps);
    // Refused there
    if ("refusal" in access) return access.refusal;
    // Which services are set up
    const settings = deps.readAnalysisSettings();
    // Each part, and what is wrong in words
    return reply(200, { transcription: settings.assemblyAiKey !== null, voice: settings.voiceWorker !== null, problems: settings.problems }, { "cache-control": "no-store" });
  }

  // Both handlers
  return { POST, GET };
}
