// Where a take's deeper analysis stands, in words (decision 91): the quiet note shown on the take's page for each outcome, and the outcome read from the route's reply. Pure, so every path is tested without a network

// Load the status type
import type { DeepStatus } from "@/data/records";

// Every outcome a take can have, with its quiet note (empty when there is nothing to say)
export const DEEP_NOTES = {
  // Sent, waiting for the reply
  running: "Deeper analysis is under way. Its measures join “See all measures for this take” when it is done.",
  // Everything set up came back
  done: "",
  // The voice came back, the transcript did not
  "no-transcript": "Deeper analysis measured your voice, but the transcription didn’t work this time.",
  // The transcript came back, the voice did not
  "no-voice": "Deeper analysis transcribed this take, but the voice analysis didn’t work this time.",
  // Nothing came back
  failed: "Deeper analysis didn’t work this time, so this take keeps the phone’s measures.",
  // The server has neither service set up
  "not-set-up": "Deeper analysis isn’t set up on the server yet, so this take keeps the phone’s measures.",
  // Offline or the server could not be reached (not queued: decision 91 chose skipping as the simpler option)
  offline: "This take wasn’t sent for deeper analysis because the app couldn’t reach the server. It keeps the phone’s measures.",
  // Over the upload cap
  "too-large": "This take is too long to send for deeper analysis (about 16 minutes at most). It keeps the phone’s measures.",
  // No passphrase saved on this device
  "needs-passphrase": "Deeper analysis needs the coach passphrase in Settings. This take keeps the phone’s measures.",
  // The passphrase was refused
  "wrong-passphrase": "The server didn’t accept the passphrase, so this take wasn’t analysed further.",
  // Over the day's or the minute's limit
  limited: "The deeper-analysis limit is reached for now. This take keeps the phone’s measures.",
} as const;

// One outcome
export type DeepOutcome = keyof typeof DEEP_NOTES;

// The status kept for an outcome
export function deepStatus(outcome: DeepOutcome, at: string): DeepStatus {
  // How it stands: under way, done, done in part, never sent, or failed
  const status: DeepStatus["status"] = outcome === "running" ? "running" : outcome === "done" ? "done" : outcome === "no-transcript" || outcome === "no-voice" ? "partial" : outcome === "failed" ? "failed" : "skipped";
  // With its note
  return { status, note: DEEP_NOTES[outcome], at };
}

// The route's reply on success: which parts came back, and why any did not
export interface DeepReplyParts {
  // Whether a transcript came back
  transcript: boolean;
  // Whether voice findings came back
  voice: boolean;
  // Why a part is missing ("not-set-up" is not a failure: that part is simply not used)
  failures: { transcript?: string; voice?: string };
}

// The outcome of a successful reply: done when every part that is set up came back, otherwise which part failed
export function outcomeOfParts(parts: DeepReplyParts): DeepOutcome {
  // The transcript failed (not merely not set up)
  if (!parts.transcript && parts.failures.transcript !== "not-set-up") return "no-transcript";
  // The voice failed
  if (!parts.voice && parts.failures.voice !== "not-set-up") return "no-voice";
  // Everything that is set up came back
  return "done";
}

// The outcome of a refusal or failure, by its status and code
export function outcomeOfRefusal(status: number, code: unknown): DeepOutcome {
  // Nothing set up
  if (code === "not-set-up") return "not-set-up";
  // Too big
  if (status === 413) return "too-large";
  // Wrong passphrase
  if (status === 401) return "wrong-passphrase";
  // Over a limit
  if (status === 429) return "limited";
  // Anything else
  return "failed";
}

// A running status this old is treated as lost (the app was closed mid-upload), so the take's page stops saying it is under way
export const RUNNING_STALE_MS = 10 * 60_000;

// The note to show for a take's status now (a running status that is too old reads as a failure)
export function noteFor(deep: DeepStatus | undefined, now: Date): string {
  // Nothing sent
  if (!deep) return "";
  // Lost mid-upload
  if (deep.status === "running" && now.getTime() - new Date(deep.at).getTime() > RUNNING_STALE_MS) return DEEP_NOTES.failed;
  // Its own note
  return deep.note;
}
