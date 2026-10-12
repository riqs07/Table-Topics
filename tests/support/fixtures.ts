// Sample records for tests, so each test only spells out what it cares about

// Load the record types
import type { SessionRecord } from "@/data/records";

// Build a complete session record, overriding any fields a test needs
export function makeSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  // Start from sensible defaults and apply the overrides
  return {
    // Unique id
    id: "session-1",
    // When it was recorded
    createdAt: "2026-10-12T15:00:00.000Z",
    // Which prompt was used
    promptId: "prompt-1",
    // Not the first-ever session
    isBaseline: false,
    // Not a retry
    retryOf: null,
    // One minute long
    durationSec: 60,
    // What was said
    transcript: "um I think it went well",
    // Speaking speed
    wordsPerMinute: 6,
    // Filler rate
    fillersPerMinute: 1,
    // Weekly focus at the time
    focus: "cut-fillers",
    // No feedback yet
    feedback: null,
    // Waiting for feedback
    feedbackStatus: "pending",
    // No saved audio
    audioKey: null,
    // Apply the test's changes
    ...overrides,
  };
}
