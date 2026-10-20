// Asks the feedback route for a session's coach feedback, saves it, and sends waiting sessions later (milestones 7 and 10)

// Load the passphrase header name
import { PASSPHRASE_HEADER } from "@/config/headers";
// Load the repository type
import type { Repository } from "@/data/repository";
// Load the voice numbers and the usual range (decision 81)
import { coachVoice, usualRange } from "@/core/voiceFeedback";
// Load the small-talk unit lookup, to leave out few-second replies
import { unitOf } from "@/content/smallTalk";

// What happened when feedback was requested
export type FeedbackOutcome =
  // Feedback saved
  | "done"
  // The coach declined; no point retrying
  | "declined"
  // The session's data was refused as invalid; no point retrying
  | "invalid"
  // The passphrase is missing or wrong; ask the user
  | "needs-passphrase"
  // The server is missing a setting; tell the user
  | "not-set-up"
  // Offline, rate limited, or a temporary failure; try again later
  | "retry-later"
  // The user lets the coach read their notes, and has not written them yet; ask after they do
  | "awaiting-notes";

// Outcomes that will block every other waiting session too, so sending stops
const BLOCKING: ReadonlyArray<FeedbackOutcome> = ["needs-passphrase", "not-set-up", "retry-later"];

// What a request needs
export interface FeedbackOptions {
  // The passphrase for the AI routes ("" if not set)
  passphrase: string;
  // Network function (the real fetch in the app, a fake in tests)
  fetchFn?: typeof fetch;
}

// What happened, with the server's own reason when it gave one (it names settings, never their values)
export interface FeedbackDetail {
  // What happened
  outcome: FeedbackOutcome;
  // The server's explanation, if any
  reason: string | null;
}

// Ask for one session's feedback and save the result
export async function requestFeedback(repository: Repository, sessionId: string, options: FeedbackOptions): Promise<FeedbackOutcome> {
  // The outcome alone
  return (await requestFeedbackDetail(repository, sessionId, options)).outcome;
}

// Read the server's reason from an error reply, if it sent one: its message, and a detail it adds while developing
async function serverReason(response: Response): Promise<{ error: string | null; detail: string | null }> {
  // The reply may not be JSON
  try {
    // Read the error text and detail
    const body = (await response.json()) as { error?: unknown; detail?: unknown };
    // Keep each only if it is text
    return { error: typeof body.error === "string" ? body.error : null, detail: typeof body.detail === "string" ? body.detail : null };
  } catch {
    // No readable reason
    return { error: null, detail: null };
  }
}

// Ask for one session's feedback and save the result, keeping the server's reason when there is one
export async function requestFeedbackDetail(repository: Repository, sessionId: string, { passphrase, fetchFn = fetch }: FeedbackOptions): Promise<FeedbackDetail> {
  // A plain outcome with no reason
  const plain = (outcome: FeedbackOutcome): FeedbackDetail => ({ outcome, reason: null });
  // Without a passphrase, ask for it before sending anything
  if (!passphrase) return plain("needs-passphrase");
  // Load the session
  const session = await repository.getSession(sessionId);
  // A missing session cannot be sent
  if (!session) return plain("invalid");
  // The settings: whether the coach may read the user's notes, and whether the user stammers
  const settings = await repository.getSettings(new Date());
  // Whether the coach may read the user's notes
  const shareNotes = settings.shareNotes === true;
  // Wait for notes the coach is allowed to read
  if (shareNotes && session.selfReview === null) return plain("awaiting-notes");
  // The notes to send: only when allowed, written, and not skipped
  const review = shareNotes && session.selfReview && !session.selfReview.skipped && (session.selfReview.worked || session.selfReview.change || session.selfReview.tags.length > 0) ? session.selfReview : null;
  // On a retry, find the fix given last time
  const original = session.retryOf ? await repository.getSession(session.retryOf) : undefined;
  // The voice numbers, against the speaker's usual range from their latest earlier recordings (decision 81; not for a few-second reply)
  const voice = session.mode === "smalltalk" && unitOf(session.promptId) !== "answering" ? null : coachVoice(session, usualRange((await repository.listSessions()).filter((other) => other.id !== session.id && other.createdAt < session.createdAt && other.pitch).slice(0, 20)));
  // Send the request, treating a network failure as "try later"
  let response: Response;
  // Try the network
  try {
    // Post the session to the feedback route
    response = await fetchFn("/api/feedback", {
      // A POST request
      method: "POST",
      // JSON body and the passphrase header
      headers: { "content-type": "application/json", [PASSPHRASE_HEADER]: passphrase },
      // The session details the coach needs
      body: JSON.stringify({ transcript: session.transcript, durationSec: session.durationSec, focusId: session.focus, previousChange: original?.feedback?.change ?? null, mode: session.mode, promptId: session.promptId, ...(session.question ? { question: session.question } : {}), ...(session.outline ? { outline: session.outline } : {}), ...(review ? { notes: { worked: review.worked, change: review.change, tags: review.tags } } : {}), ...(settings.stammer ? { stammer: true } : {}), ...(voice ? { voice } : {}) }),
    });
  } catch {
    // Offline or unreachable: the session waits
    return plain("retry-later");
  }
  // Success: save the feedback on the session
  if (response.ok) {
    // Read the feedback from the reply
    const { feedback } = (await response.json()) as { feedback: NonNullable<typeof session.feedback> };
    // Save it on the session as it is now (the user may have saved notes while the coach was thinking), and mark it done
    await repository.saveSession({ ...((await repository.getSession(sessionId)) ?? session), feedback, feedbackStatus: "done" });
    // Report success
    return plain("done");
  }
  // The coach declined, or the data was refused: stop trying for this session
  if (response.status === 422 || response.status === 400) {
    // Mark the session as it is now as failed, so it is not sent again
    await repository.saveSession({ ...((await repository.getSession(sessionId)) ?? session), feedbackStatus: "failed" });
    // Say which, with the server's reason
    return { outcome: response.status === 422 ? "declined" : "invalid", reason: (await serverReason(response)).error };
  }
  // Wrong or missing passphrase
  if (response.status === 401) return { outcome: "needs-passphrase", reason: (await serverReason(response)).error };
  // The server is missing a setting, and says which
  if (response.status === 500) return { outcome: "not-set-up", reason: (await serverReason(response)).error };
  // Anything else (rate limit, coach failure, counter store down) is temporary; the detail, sent only while developing, says why
  return { outcome: "retry-later", reason: (await serverReason(response)).detail };
}

// Send every session still waiting for feedback, oldest first, stopping at the first blocking outcome
export async function sendPendingFeedback(repository: Repository, options: FeedbackOptions): Promise<{ sent: number; stoppedBy: FeedbackOutcome | null; reason: string | null }> {
  // Find waiting sessions, oldest first (the list comes newest first)
  const pending = (await repository.listSessions()).filter((session) => session.feedbackStatus === "pending").reverse();
  // Count successes
  let sent = 0;
  // Send each in turn
  for (const session of pending) {
    // Ask for its feedback
    const { outcome, reason } = await requestFeedbackDetail(repository, session.id, options);
    // Count it if it worked
    if (outcome === "done") sent += 1;
    // Stop if the same problem would block the rest
    if (BLOCKING.includes(outcome)) return { sent, stoppedBy: outcome, reason };
  }
  // Everything waiting was tried
  return { sent, stoppedBy: null, reason: null };
}
