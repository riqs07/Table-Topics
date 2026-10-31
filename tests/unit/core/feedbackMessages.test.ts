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
    [0, "needs-passphrase", "Feedback needs the coach passphrase (Settings, then Coach)."],
    // Partly sent, then offline
    [1, "retry-later", "Feedback arrived for 1 session. The coach could not be reached; it will try again later."],
    // Server not set up
    [0, "not-set-up", "The coach is not set up on the server yet. Settings, then Coach, says what is missing."],
  ] as const)("describes %i sent, stopped by %s", (sent, stoppedBy, expected) => {
    // Confirm the sentence
    expect(sendResultMessage(sent, stoppedBy)).toBe(expected);
  });

  // When the server gave a reason, it is added so the cause can be seen
  it("adds the server's reason when there is one", () => {
    // Confirm the reason is appended
    expect(sendResultMessage(0, "retry-later", "401 authentication_error: invalid x-api-key")).toBe("The coach could not be reached; it will try again later. Reason: 401 authentication_error: invalid x-api-key");
  });
});
