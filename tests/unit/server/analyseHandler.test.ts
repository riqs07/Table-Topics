// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the handler being checked
import { createAnalyseHandler, withTimeLimit, type AnalyseDeps } from "@/server/analyseHandler";
// Load the service types
import type { Transcriber, TranscriptResult } from "@/server/transcriber";
import type { VoiceWorker, WorkerReply } from "@/server/voiceWorker";
import type { AnalysisSettings } from "@/server/env";
// Load the counters
import { MemoryCounterStore, type CounterStore } from "@/server/rateLimit";
// Load the upload cap
import { ANALYSE_MAX_BYTES } from "@/core/requestLimits";

// The passphrase the fake server expects
const SECRET = "a long passphrase for testing";
// Both services set up
const BOTH: AnalysisSettings = { assemblyAiKey: "aai-test", voiceWorker: { url: "https://w.example", secret: "a long worker secret for testing" }, problems: [] };
// Nothing set up
const NEITHER: AnalysisSettings = { assemblyAiKey: null, voiceWorker: null, problems: ["VOICE_WORKER_URL is set but VOICE_WORKER_SECRET is not."] };
// A transcript as the service returns it
const HEARD: TranscriptResult = { text: "Um, hi there.", words: [{ text: "Um,", start: 100, end: 300, confidence: 0.8 }, { text: "hi", start: 700, end: 900, confidence: 0.95 }, { text: "there.", start: 950, end: 1300, confidence: 0.9 }] };
// Voice findings as the worker returns them
const MEASURED: WorkerReply = { version: "1", praat_version: "6.1.38", jitter_local_pct: 1.2, shimmer_local_db: 0.5, hnr_db: 14.2, alpha_ratio_db: -18.4, hammarberg_db: 24.1, creak_pct: 6.5, syllables: 12, speech_rate_sps: 4, articulation_rate_sps: 4.4, f0: { median_hz: 130, p10_hz: 100, p90_hz: 180, range_st: 10.2, sd_st: 3.1 }, emotion: null };

// A fake service that answers, fails, or never answers (rule T2), and notes what it was given
function fakeTranscriber(behaviour: TranscriptResult | Error | "never"): Transcriber & { sizes: number[] } {
  // What it was given
  const sizes: number[] = [];
  // The fake
  return { sizes, transcribe: (audio) => { sizes.push(audio.byteLength); return behaviour === "never" ? new Promise(() => {}) : behaviour instanceof Error ? Promise.reject(behaviour) : Promise.resolve(behaviour); } };
}

// A fake worker that answers, fails, or never answers, and notes the kinds it was given
function fakeWorker(behaviour: WorkerReply | Error | "never"): VoiceWorker & { kinds: string[] } {
  // What it was given
  const kinds: string[] = [];
  // The fake
  return { kinds, analyse: (_audio, kind) => { kinds.push(kind); return behaviour === "never" ? new Promise(() => {}) : behaviour instanceof Error ? Promise.reject(behaviour) : Promise.resolve(behaviour); } };
}

// The handler's dependencies, with fakes
function deps(options: { settings?: AnalysisSettings; transcriber?: Transcriber; worker?: VoiceWorker; store?: CounterStore; perDay?: number; logs?: string[] } = {}): AnalyseDeps {
  // A store shared by every call of this handler
  const store = options.store ?? new MemoryCounterStore();
  // Everything the handler needs
  return {
    // The passphrase setting
    readAccessSecret: () => SECRET,
    // Server settings
    readEnv: () => ({ anthropicApiKey: "sk-test", accessSecret: SECRET, counterStore: null }),
    // Which services are set up
    readAnalysisSettings: () => options.settings ?? BOTH,
    // The services
    makeTranscriber: () => options.transcriber ?? fakeTranscriber(HEARD),
    // (the worker)
    makeVoiceWorker: () => options.worker ?? fakeWorker(MEASURED),
    // Counters
    makeCounterStore: () => store,
    // Limits
    limits: { perMinute: 10, perDay: options.perDay ?? 100, scope: "analyse" },
    // A fixed clock
    now: () => new Date("2026-10-21T12:00:00.000Z"),
    // A short time limit, so "never answers" ends quickly
    timeoutMs: 30,
    // Logs kept
    log: (line) => void options.logs?.push(line),
  };
}

// A request carrying audio
function upload(options: { bytes?: number; passphrase?: string | null; kind?: string; duration?: string | null; length?: string } = {}): Request {
  // The headers
  const headers: Record<string, string> = { "content-type": options.kind ?? "audio/webm;codecs=opus" };
  // The passphrase
  if (options.passphrase !== null) headers["x-voicelab-passphrase"] = options.passphrase ?? SECRET;
  // The length
  if (options.duration !== null) headers["x-voicelab-duration"] = options.duration ?? "62";
  // A declared size, when a test sets one
  if (options.length) headers["content-length"] = options.length;
  // The request
  return new Request("http://localhost/api/analyse", { method: "POST", headers, body: new Uint8Array(options.bytes ?? 1000) });
}

// Group the checks about the deeper-analysis route (decision 91)
describe("analyse route", () => {
  // Both parts come back, in the kept shapes, with nothing to report missing
  it("sends the audio to both services at once and returns both results", async () => {
    // The fakes
    const [transcriber, worker] = [fakeTranscriber(HEARD), fakeWorker(MEASURED)];
    // Asked
    const response = await createAnalyseHandler(deps({ transcriber, worker })).POST(upload());
    // The reply
    const body = await response.json();
    // Status, the transcript in seconds with cleaned words, the voice renamed, what each service was given, and no caching
    expect([response.status, body.transcript.words[0], body.transcript.engine, body.voice.hnrDb, body.voice.engine, body.failures, transcriber.sizes, worker.kinds, response.headers.get("cache-control")]).toEqual([200, { text: "Um,", w: "um", s: 0.1, e: 0.3, conf: 0.8 }, "assemblyai-universal-3-pro", 14.2, "voice-worker-1", {}, [1000], ["audio/webm"], "no-store"]);
  });

  // No keys: the route says it is not set up, naming what is wrong
  it("says deeper analysis is not set up when neither service is", async () => {
    // Asked
    const response = await createAnalyseHandler(deps({ settings: NEITHER })).POST(upload());
    // Refused plainly
    expect([response.status, await response.json()]).toEqual([503, { error: "Deeper analysis isn't set up on the server.", code: "not-set-up", problems: NEITHER.problems }]);
  });

  // Only the transcript set up: the voice is reported as not set up, not failed
  it("runs only the part that is set up", async () => {
    // Asked
    const response = await createAnalyseHandler(deps({ settings: { ...BOTH, voiceWorker: null } })).POST(upload());
    // The reply
    const body = await response.json();
    // A transcript, no voice, and why
    expect([response.status, body.transcript !== null, body.voice, body.failures]).toEqual([200, true, null, { voice: "not-set-up" }]);
  });

  // The worker down: the transcript still comes back, and the failure is logged by its reason only
  it("still returns the transcript when the worker is down", async () => {
    // Logs
    const logs: string[] = [];
    // Asked
    const response = await createAnalyseHandler(deps({ worker: fakeWorker(new Error("The voice worker answered 503.")), logs })).POST(upload());
    // The reply
    const body = await response.json();
    // Partial, and why
    expect([response.status, body.transcript !== null, body.voice, body.failures, logs]).toEqual([200, true, null, { voice: "failed" }, ["Deeper analysis: the voice worker failed (The voice worker answered 503.)."]]);
  });

  // The transcriber failing: the voice still comes back
  it("still returns the voice when the transcription fails", async () => {
    // Asked
    const response = await createAnalyseHandler(deps({ transcriber: fakeTranscriber(new Error("AssemblyAI answered 500 to POST /v2/upload.")) })).POST(upload());
    // The reply
    const body = await response.json();
    // Partial, and why
    expect([response.status, body.transcript, body.voice !== null, body.failures]).toEqual([200, null, true, { transcript: "failed" }]);
  });

  // A service that never answers is given up on at the time limit (rule T2)
  it("gives up on a part that never answers", async () => {
    // Asked
    const response = await createAnalyseHandler(deps({ transcriber: fakeTranscriber("never") })).POST(upload());
    // The reply
    const body = await response.json();
    // The voice, and the transcript timed out
    expect([response.status, body.voice !== null, body.failures]).toEqual([200, true, { transcript: "timeout" }]);
  });

  // Both failing: a failure the app shows quietly
  it("fails when neither part comes back", async () => {
    // Asked
    const response = await createAnalyseHandler(deps({ transcriber: fakeTranscriber(new Error("down")), worker: fakeWorker("never") })).POST(upload());
    // Refused with both reasons
    expect([response.status, await response.json()]).toEqual([502, { error: "Deeper analysis didn't work this time.", failures: { transcript: "failed", voice: "timeout" } }]);
  });

  // Over the cap, by its declared size or by what actually arrives
  it("refuses audio over the size cap, declared or not", async () => {
    // A transcriber that must never be reached
    const transcriber = fakeTranscriber(HEARD);
    // Declared too big, and sent too big without a declared size
    const [declared, streamed] = await Promise.all([createAnalyseHandler(deps({ transcriber })).POST(upload({ length: String(ANALYSE_MAX_BYTES + 1) })), createAnalyseHandler(deps({ transcriber })).POST(upload({ bytes: ANALYSE_MAX_BYTES + 1 }))]);
    // Both refused, nothing sent on
    expect([declared.status, streamed.status, (await streamed.json()).code, transcriber.sizes]).toEqual([413, 413, "too-large", []]);
  });

  // A wrong passphrase is refused before anything else
  it("refuses a wrong or missing passphrase", async () => {
    // A handler
    const handler = createAnalyseHandler(deps());
    // Wrong and missing
    const [wrong, missing] = await Promise.all([handler.POST(upload({ passphrase: "not the passphrase at all" })), handler.POST(upload({ passphrase: null }))]);
    // Both refused
    expect([wrong.status, missing.status]).toEqual([401, 401]);
  });

  // Over the day's limit: refused with a wait, and the services are not called
  it("refuses a call over the day's limit", async () => {
    // A transcriber that notes calls
    const transcriber = fakeTranscriber(HEARD);
    // A handler allowing one a day
    const handler = createAnalyseHandler(deps({ perDay: 1, transcriber }));
    // Two calls
    const first = await handler.POST(upload());
    // (the second)
    const second = await handler.POST(upload());
    // The second refused, with its reason and a wait; only the first reached the service
    expect([first.status, second.status, (await second.json()).error, Number(second.headers.get("retry-after")) > 0, transcriber.sizes.length]).toEqual([200, 429, "Today's deeper-analysis limit is reached.", true, 1]);
  });

  // A refused body costs nothing: the counter is not touched
  it("does not count a call refused for its body", async () => {
    // A handler allowing one a day
    const handler = createAnalyseHandler(deps({ perDay: 1 }));
    // A bad call, then a good one
    const bad = await handler.POST(upload({ kind: "text/plain" }));
    // (good)
    const good = await handler.POST(upload());
    // The good one still goes through
    expect([bad.status, good.status]).toEqual([415, 200]);
  });

  // A missing or impossible length is refused
  it("refuses a missing or impossible length", async () => {
    // A handler
    const handler = createAnalyseHandler(deps());
    // Missing, zero, and longer than any session
    const statuses = await Promise.all([upload({ duration: null }), upload({ duration: "0" }), upload({ duration: "1801" })].map(async (request) => (await handler.POST(request)).status));
    // All refused
    expect(statuses).toEqual([400, 400, 400]);
  });

  // An empty upload is refused
  it("refuses an empty recording", async () => {
    // Nothing sent
    expect((await createAnalyseHandler(deps()).POST(upload({ bytes: 0 }))).status).toBe(400);
  });

  // The counter store down: refused rather than run without limits
  it("refuses when the usage counter cannot be reached", async () => {
    // A store that fails only on counting calls (passphrase checks read it first)
    const store: CounterStore = { read: async () => 0, increment: async (key) => { if (key.startsWith("analyse:")) throw new Error("down"); return 1; } };
    // Asked
    const response = await createAnalyseHandler(deps({ store })).POST(upload());
    // Paused
    expect([response.status, (await response.json()).error]).toEqual([503, "Deeper analysis is paused because the usage counter is unavailable."]);
  });

  // GET says which parts are set up, behind the passphrase, and costs nothing
  it("says which parts are set up", async () => {
    // A handler allowing no calls at all
    const handler = createAnalyseHandler(deps({ settings: { ...BOTH, voiceWorker: null, problems: ["VOICE_WORKER_SECRET must be at least 16 characters long."] }, perDay: 0 }));
    // Asked with and without the passphrase
    const [allowed, refused] = await Promise.all([handler.GET(new Request("http://localhost/api/analyse", { headers: { "x-voicelab-passphrase": SECRET } })), handler.GET(new Request("http://localhost/api/analyse"))]);
    // The parts, and a refusal without the passphrase
    expect([allowed.status, await allowed.json(), refused.status]).toEqual([200, { transcription: true, voice: false, problems: ["VOICE_WORKER_SECRET must be at least 16 characters long."] }, 401]);
  });
});

// Group the checks about the time limit helper
describe("withTimeLimit", () => {
  // A part that finishes, fails, or never answers
  it("reports a result, a failure, or a timeout", async () => {
    // The three
    const outcomes = await Promise.all([withTimeLimit(async () => 7, 50), withTimeLimit(async () => { throw new Error("boom"); }, 50), withTimeLimit(() => new Promise(() => {}), 10)]);
    // As expected
    expect(outcomes).toEqual([{ ok: true, value: 7 }, { ok: false, reason: "failed", message: "boom" }, { ok: false, reason: "timeout", message: "took longer than 0 s" }]);
  });

  // The part is told to stop when the time is up
  it("aborts the part's signal at the time limit", async () => {
    // The signal the part was given
    let given: AbortSignal | null = null;
    // A part that waits forever
    await withTimeLimit((signal) => { given = signal; return new Promise(() => {}); }, 10);
    // Stopped
    expect((given as AbortSignal | null)?.aborted).toBe(true);
  });
});
