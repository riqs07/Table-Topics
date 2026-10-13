// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the sample data builder being checked
import { sampleSessions } from "@/data/sampleData";

// A fixed "now"
const NOW = new Date(2026, 9, 13, 18);

// Group the checks about sample sessions used to preview screens
describe("sampleSessions", () => {
  // Build the sample once
  const sessions = sampleSessions(NOW);

  // There is exactly one first recording, and it is the oldest
  it("has one baseline, the oldest session", () => {
    // Find baselines
    const baselines = sessions.filter((session) => session.isBaseline);
    // Confirm there is one
    expect(baselines).toHaveLength(1);
    // Confirm it is the oldest
    expect(baselines[0]!.createdAt).toBe([...sessions].map((session) => session.createdAt).sort()[0]);
  });

  // Every retry points at a session in the sample, made earlier
  it("links each retry to an earlier session", () => {
    // Check every retry
    for (const retry of sessions.filter((session) => session.retryOf)) {
      // Find its first try
      const original = sessions.find((session) => session.id === retry.retryOf);
      // Confirm it exists and came first
      expect(original && original.createdAt < retry.createdAt).toBe(true);
    }
  });

  // Every session has finished feedback, so the feedback screen can be previewed
  it("includes feedback on every session", () => {
    // Confirm all are done with feedback
    expect(sessions.every((session) => session.feedbackStatus === "done" && session.feedback)).toBe(true);
  });

  // Nothing is in the future
  it("is all in the past", () => {
    // Confirm every time is before now
    expect(sessions.every((session) => new Date(session.createdAt) <= NOW)).toBe(true);
  });
});
