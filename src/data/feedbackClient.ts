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

// Ask for one session's feedback and save the result
export async function requestFeedback(repository: Repository, sessionId: string, { passphrase, fetchFn = fetch }: FeedbackOptions): Promise<FeedbackOutcome> {
  // Without a passphrase, ask for it before sending anything
  if (!passphrase) return "needs-passphrase";
  // Load the session
  const session = await repository.getSession(sessionId);
  // A missing session cannot be sent
  if (!session) return "invalid";
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
      body: JSON.stringify({ transcript: session.transcript, durationSec: session.durationSec, focusId: session.focus, previousChange: original?.feedback?.change ?? null, mode: session.mode }),
    });
  } catch {
    // Offline or unreachable: the session waits
    return "retry-later";
  }
  // Success: save the feedback on the session
  if (response.ok) {
    // Read the feedback from the reply
    const { feedback } = (await response.json()) as { feedback: NonNullable<typeof session.feedback> };
    // Save it and mark the session done
    await repository.saveSession({ ...session, feedback, feedbackStatus: "done" });
    // Report success
    return "done";
  }
  // The coach declined, or the data was refused: stop trying for this session
  if (response.status === 422 || response.status === 400) {
    // Mark the session as failed so it is not sent again
    await repository.saveSession({ ...session, feedbackStatus: "failed" });
    // Say which
    return response.status === 422 ? "declined" : "invalid";
  }
  // Wrong or missing passphrase
  if (response.status === 401) return "needs-passphrase";
  // The server is missing a setting
  if (response.status === 500) return "not-set-up";
  // Anything else (rate limit, coach failure, counter store down) is temporary
  return "retry-later";
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
