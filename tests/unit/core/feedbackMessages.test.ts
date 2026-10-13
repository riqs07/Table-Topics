// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the message builder being checked
import { sendResultMessage } from "@/core/feedbackMessages";

// Group the checks about describing a send
describe("sendResultMessage", () => {
  // Each result reads as a plain sentence
  it.each([
    // Everything sent
    [2, null, "Feedback arrived for 2 sessions."],
    // Nothing waiting
    [0, null, "Nothing was waiting."],
    // Missing passphrase
    [0, "needs-passphrase", "Add the right passphrase to get feedback."],
    // Partly sent, then offline
    [1, "retry-later", "Feedback arrived for 1 session. The coach could not be reached; it will try again later."],
    // Server not set up
    [0, "not-set-up", "The server is missing a setting (see documents/setup-requirements.md)."],
  ] as const)("describes %i sent, stopped by %s", (sent, stoppedBy, expected) => {
    // Confirm the sentence
    expect(sendResultMessage(sent, stoppedBy)).toBe(expected);
  });
});
