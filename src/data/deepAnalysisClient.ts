// Sends a saved take's audio for deeper analysis and keeps what comes back (decision 91): only when "Send my recordings for deeper analysis" is on, once per take, right after it is saved. Never throws: the take and its phone measures are what matter, and every outcome is kept as a quiet note on the take. Offline takes are skipped, not queued (the simpler option, decision 91). Also asks the server which parts are set up, for Settings

// Load the header names
import { DURATION_HEADER, PASSPHRASE_HEADER } from "@/config/headers";
// Load the upload cap shared with the server
import { ANALYSE_MAX_BYTES } from "@/core/requestLimits";
// Load the analysis builders
import { isAnalysed, withDeepStatus, withServerAnalysis } from "@/core/analysis/analysis";
// Load the analysis to add to, with its words rebuilt while the take keeps them (decision 98)
import { workingAnalysis } from "@/data/analyses";
// Load the reader for the server's reply
import { readServerAnalysis } from "@/core/analysis/server";
// Load the outcomes and their notes
import { deepStatus, outcomeOfParts, outcomeOfRefusal, type DeepOutcome } from "@/core/analysis/deep";
// Load the record types
import type { AnalysisRecord, DeepStatus, SessionRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// How long the app waits for the route before giving up (a little over the route's own five minutes)
const CLIENT_TIMEOUT_MS = 330_000;

// What a request needs
export interface DeepOptions {
  // The passphrase for the server routes ("" if not set)
  passphrase: string;
  // The current moment
  now: Date;
  // Network function (the real fetch in the app, a fake in tests)
  fetchFn?: typeof fetch;
  // Whether the device says it is online (the browser's answer by default)
  online?: () => boolean;
}

// Whether the browser says it is online (true where it cannot say)
function browserOnline(): boolean {
  // Only in a browser
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

// Save a status on the take's latest analysis (read again first, so a rubric that arrived meanwhile is kept)
async function saveStatus(repository: Repository, session: SessionRecord, outcome: DeepOutcome, now: Date): Promise<DeepStatus> {
  // The status
  const status = deepStatus(outcome, now.toISOString());
  // The latest analysis, or a fresh one
  const analysis = await workingAnalysis(repository, session, now);
  // Saved with it
  await repository.saveAnalysis(withDeepStatus(analysis, status));
  // Handed back
  return status;
}

// Send one take for deeper analysis when the setting is on, and keep the result; hands back the take's new status, or null when nothing was to be done
export async function requestDeepAnalysis(repository: Repository, session: SessionRecord, { passphrase, now, fetchFn = fetch, online = browserOnline }: DeepOptions): Promise<DeepStatus | null> {
  // Every step can fail; none may stop the take
  try {
    // The setting, off unless chosen
    if ((await repository.getSettings(now)).deepAnalysis !== true) return null;
    // Kinds that are not analysed, and takes without audio (conversations keep none)
    if (!isAnalysed(session.mode) || !session.audioKey) return null;
    // The audio
    const audio = await repository.getAudio(session.audioKey);
    // Gone already
    if (!audio) return null;
    // No passphrase: nothing is sent
    if (!passphrase) return saveStatus(repository, session, "needs-passphrase", now);
    // Too big to upload
    if (audio.size > ANALYSE_MAX_BYTES) return saveStatus(repository, session, "too-large", now);
    // Offline: skipped, not queued
    if (!online()) return saveStatus(repository, session, "offline", now);
    // Under way
    await saveStatus(repository, session, "running", now);
    // The reply
    let response: Response;
    // Try the network
    try {
      // Post the audio as it is, with its kind and length
      response = await fetchFn("/api/analyse", { method: "POST", headers: { "content-type": audio.type || "audio/webm", [PASSPHRASE_HEADER]: passphrase, [DURATION_HEADER]: String(session.durationSec) }, body: audio, signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS) });
    } catch {
      // Offline or unreachable
      return saveStatus(repository, session, "offline", now);
    }
    // The reply's body, if readable
    const body = (await response.json().catch(() => ({}))) as { code?: unknown; transcript?: unknown; voice?: unknown; failures?: { transcript?: string; voice?: string } };
    // A refusal or failure
    if (!response.ok) return saveStatus(repository, session, outcomeOfRefusal(response.status, body.code), now);
    // The parts, checked
    const server = readServerAnalysis({ transcript: body.transcript ?? null, voice: body.voice ?? null });
    // A reply of the wrong shape
    if (!server || (!server.transcript && !server.voice)) return saveStatus(repository, session, "failed", now);
    // The outcome
    const status = deepStatus(outcomeOfParts({ transcript: server.transcript !== null, voice: server.voice !== null, failures: body.failures ?? {} }), now.toISOString());
    // The latest analysis, read again so nothing saved meanwhile is lost
    const latest: AnalysisRecord = await workingAnalysis(repository, session, now);
    // Saved with the server's measures merged in
    await repository.saveAnalysis(withServerAnalysis(latest, server, status));
    // Handed back
    return status;
  } catch (error) {
    // Said in the console
    console.warn(`Deeper analysis of a take could not be finished: ${error instanceof Error ? error.message : String(error)}`);
    // Kept as a failure when it can be
    return saveStatus(repository, session, "failed", now).catch(() => null);
  }
}

// What the server says about deeper analysis, for Settings
export type DeepSetup =
  // Both parts set up
  | { state: "ready"; problems: string[] }
  // One part set up
  | { state: "partial"; transcription: boolean; voice: boolean; problems: string[] }
  // Neither set up
  | { state: "not-set-up"; problems: string[] }
  // No passphrase on this device, the passphrase refused, or the server not reachable
  | { state: "needs-passphrase" | "wrong-passphrase" | "unreachable" };

// Ask the server which parts of deeper analysis are set up (free: it counts against no limit)
export async function checkDeepSetup(passphrase: string, fetchFn: typeof fetch = fetch): Promise<DeepSetup> {
  // Without a passphrase nothing is asked
  if (!passphrase) return { state: "needs-passphrase" };
  // The reply
  let response: Response;
  // Try the network
  try {
    // Ask
    response = await fetchFn("/api/analyse", { method: "GET", headers: { [PASSPHRASE_HEADER]: passphrase } });
  } catch {
    // Offline or unreachable
    return { state: "unreachable" };
  }
  // Refused
  if (response.status === 401) return { state: "wrong-passphrase" };
  // Any other failure
  if (!response.ok) return { state: "unreachable" };
  // What it said
  const body = (await response.json().catch(() => ({}))) as { transcription?: unknown; voice?: unknown; problems?: unknown };
  // Each part
  const [transcription, voice] = [body.transcription === true, body.voice === true];
  // What is wrong, in words
  const problems = Array.isArray(body.problems) ? body.problems.filter((problem): problem is string => typeof problem === "string") : [];
  // Both, one, or neither
  return transcription && voice ? { state: "ready", problems } : transcription || voice ? { state: "partial", transcription, voice, problems } : { state: "not-set-up", problems };
}
