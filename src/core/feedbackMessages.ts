// Plain sentences describing the result of sending waiting feedback

// Load the outcome type
import type { FeedbackOutcome } from "@/data/feedbackClient";

// "1 session", "2 sessions"
function sessions(n: number): string {
  // Add an s unless there is exactly one
  return `${n} session${n === 1 ? "" : "s"}`;
}

// Describe what happened when waiting feedback was sent
export function sendResultMessage(sent: number, stoppedBy: FeedbackOutcome | null, serverReason: string | null = null): string {
  // What arrived
  const arrived = sent > 0 ? `Feedback arrived for ${sessions(sent)}.` : "";
  // Why sending stopped, if it did
  const reason =
    // No passphrase, or a wrong one
    stoppedBy === "needs-passphrase" ? "Add the right passphrase to get feedback."
    // The server is missing a setting
    : stoppedBy === "not-set-up" ? "The server is missing a setting (see documents/setup-requirements.md)."
    // Offline or busy
    : stoppedBy === "retry-later" ? "The coach could not be reached; it will try again later."
    // Nothing stopped it
    : "";
  // Join the two parts, or say there was nothing to send
  return [arrived, reason, serverReason ? `Reason: ${serverReason}` : ""].filter(Boolean).join(" ") || "Nothing was waiting.";
}
