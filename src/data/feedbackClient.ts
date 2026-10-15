// Asks the feedback route for a session's coach feedback, saves it, and sends waiting sessions later (milestones 7 and 10)

// Load the passphrase header name
import { PASSPHRASE_HEADER } from "@/config/headers";
// Load the repository type
import type { Repository } from "@/data/repository";

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
  | "retry-later";

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

// Read the server's reason from an error reply, if it sent one
async function serverReason(response: Response): Promise<string | null> {
  // The reply may not be JSON
  try {
    // Read the error text
    const body = (await response.json()) as { error?: unknown };
    // Keep it only if it is text
    return typeof body.error === "string" ? body.error : null;
  } catch {
    // No readable reason
    return null;
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
  // On a retry, find the fix given last time
  const original = session.retryOf ? await repository.getSession(session.retryOf) : undefined;
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
      body: JSON.stringify({ transcript: session.transcript, durationSec: session.durationSec, focusId: session.focus, previousChange: original?.feedback?.change ?? null, mode: session.mode, promptId: session.promptId }),
    });
  } catch {
    // Offline or unreachable: the session waits
    return plain("retry-later");
  }
  // Success: save the feedback on the session
  if (response.ok) {
    // Read the feedback from the reply
    const { feedback } = (await response.json()) as { feedback: NonNullable<typeof session.feedback> };
    // Save it and mark the session done
    await repository.saveSession({ ...session, feedback, feedbackStatus: "done" });
    // Report success
    return plain("done");
  }
  // The coach declined, or the data was refused: stop trying for this session
  if (response.status === 422 || response.status === 400) {
    // Mark the session as failed so it is not sent again
    await repository.saveSession({ ...session, feedbackStatus: "failed" });
    // Say which, with the server's reason
    return { outcome: response.status === 422 ? "declined" : "invalid", reason: await serverReason(response) };
  }
  // Wrong or missing passphrase
  if (response.status === 401) return { outcome: "needs-passphrase", reason: await serverReason(response) };
  // The server is missing a setting, and says which
  if (response.status === 500) return { outcome: "not-set-up", reason: await serverReason(response) };
  // Anything else (rate limit, coach failure, counter store down) is temporary
  return { outcome: "retry-later", reason: await serverReason(response) };
}

// Send every session still waiting for feedback, oldest first, stopping at the first blocking outcome
export async function sendPendingFeedback(repository: Repository, options: FeedbackOptions): Promise<{ sent: number; stoppedBy: FeedbackOutcome | null }> {
  // Find waiting sessions, oldest first (the list comes newest first)
  const pending = (await repository.listSessions()).filter((session) => session.feedbackStatus === "pending").reverse();
  // Count successes
  let sent = 0;
  // Send each in turn
  for (const session of pending) {
    // Ask for its feedback
    const outcome = await requestFeedback(repository, session.id, options);
    // Count it if it worked
    if (outcome === "done") sent += 1;
    // Stop if the same problem would block the rest
    if (BLOCKING.includes(outcome)) return { sent, stoppedBy: outcome };
  }
  // Everything waiting was tried
  return { sent, stoppedBy: null };
}
