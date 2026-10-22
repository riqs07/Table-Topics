// The app's quiet work after a page has loaded (decisions 98, 99 and 115): move older records to the current layout, tidy old recordings and readings, make tiny fingerprints for older takes, then send any feedback still waiting. Loaded on its own, after the page, so its code (the coach request, the analysis engine and its checks) is not part of every page's download.

// Load the layout move
import { migrate } from "@/data/migrations";
// Load the recording upkeep
import { tidyRecordings } from "@/data/housekeeping";
// Load the fingerprint backfill (decision 115)
import { backfillFingerprints } from "@/data/fingerprints";
// Load the waiting-feedback sender
import { sendPendingFeedback, type FeedbackOptions } from "@/data/feedbackClient";
// Load the repository type
import type { Repository } from "@/data/repository";

// Say in the console why a step could not finish (the next start tries again)
function warn(step: string, error: unknown): void {
  // The browser's reason
  console.warn(`${step} could not finish: ${error instanceof Error ? error.message : String(error)}`);
}

// Run the upkeep, then send waiting feedback; each step's failure is said in the console and never stops the next
export async function runBackgroundWork(repository: Repository, options: FeedbackOptions & { now?: Date }): Promise<void> {
  // When it runs
  const now = options.now ?? new Date();
  // The layout move first, so the upkeep sees every take's readings where it looks for them
  await migrate(repository, { now }).catch((error: unknown) => warn("Moving older records", error));
  // Old recordings and readings
  await tidyRecordings(repository, now).catch((error: unknown) => warn("Tidying old recordings", error));
  // Tiny fingerprints for older takes, for History (decision 115)
  await backfillFingerprints(repository).catch((error: unknown) => warn("Drawing older takes' shapes", error));
  // Waiting feedback
  await sendPendingFeedback(repository, options).catch((error: unknown) => warn("Sending waiting feedback", error));
}

// Send waiting feedback only (when the connection comes back)
export async function sendWaitingFeedback(repository: Repository, options: FeedbackOptions): Promise<void> {
  // Sent, a failure said in the console
  await sendPendingFeedback(repository, options).catch((error: unknown) => warn("Sending waiting feedback", error));
}
