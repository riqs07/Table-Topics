// Sample records for tests, so each test only spells out what it cares about

// Load the record types
import type { FullSession, TalkRecord } from "@/data/records";

// Build a complete session record (with any readings a test gives), overriding any fields a test needs
export function makeSession(overrides: Partial<FullSession> = {}): FullSession {
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
    // A full session (not a warm-up)
    mode: "standard",
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

// Build a saved talk for Rehearse my talk, overriding any fields a test needs
export function makeTalk(overrides: Partial<TalkRecord> = {}): TalkRecord {
  // Start from sensible defaults and apply the overrides
  return {
    // Unique id
    id: "talk-1",
    // Title shown in lists
    title: "Team update",
    // The words of the talk
    body: "Good morning everyone. This quarter we shipped three things. First, the new sign-up page. Second, faster search. Third, the mobile app. Thank you.",
    // A five-minute goal
    goalMinutes: 5,
    // When it was saved
    createdAt: "2026-10-12T15:00:00.000Z",
    // Apply the test's changes
    ...overrides,
  };
}

// Loudness and pitch readings for a take of five two-second phrases with 0.8-second silences between them (decision 81): rising phrases end higher than they start, lively ones move across a wide range
export function voiceReadings(shape: "rising" | "lively"): { loudness: number[]; pitch: (number | null)[] } {
  // One phrase's pitch readings
  const phrase = Array.from({ length: 20 }, (_, index) => (shape === "rising" ? (index >= 17 ? 240 : 200) : [150, 200, 260, 300, 180][index % 5]!));
  // The silence between phrases
  const gap = Array(8).fill(null) as null[];
  // Five phrases with gaps
  const pitch = [phrase, gap, phrase, gap, phrase, gap, phrase, gap, phrase].flat();
  // Speech where there is pitch, quiet between
  return { loudness: pitch.map((reading) => (reading === null ? 0.01 : 0.2)), pitch };
}
