// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the wording being checked
import { spokenSentence, spokenTime, stepNote, weekSentence } from "@/core/daySummary";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// A fixed "now": Thursday 15 October 2026, evening
const NOW = new Date(2026, 9, 15, 19);

// Group the checks about the day's summary
describe("daySummary", () => {
  // Lengths read as people say them
  it("says a length of time in words", () => {
    // Confirm seconds, a whole minute, and minutes with seconds
    expect([spokenTime(45), spokenTime(1), spokenTime(60), spokenTime(200.4)]).toEqual(["45 seconds", "1 second", "1 minute", "3 minutes 20"]);
  });

  // The day leads with the time spoken, added up
  it("adds up the time spoken today", () => {
    // Two sessions
    const today = [makeSession({ id: "a", durationSec: 75 }), makeSession({ id: "b", durationSec: 125 })];
    // Confirm the sentence
    expect(spokenSentence(today)).toBe("You spoke for 3 minutes 20 today.");
  });

  // Regression (decision 86): a conversation's length includes the persona talking, so only your own turns count as time you spoke
  it("counts only your own turns in a conversation", () => {
    // A three-minute conversation where you spoke for 50 seconds, and a 30-second take
    const today = [makeSession({ id: "c", mode: "conversation", durationSec: 180, conversation: { scenarioId: "party", twist: 0, turns: [{ who: "them", text: "Hi!", seconds: 40 }, { who: "you", text: "Hello", seconds: 20 }, { who: "them", text: "And you?", seconds: 90 }, { who: "you", text: "Me too", seconds: 30 }] } }), makeSession({ id: "t", durationSec: 30 })];
    // The day's line and the conversation's step line
    expect([spokenSentence(today), stepNote(today[0]!)]).toEqual(["You spoke for 1 minute 20 today.", "You spoke for 50 seconds."]);
  });

  // A step's line is the user's own note, or a neutral fact, never a filler count
  it("uses the user's note, or how long they spoke", () => {
    // A note on what to change, a note on what worked, and no notes
    const notes = [
      stepNote(makeSession({ selfReview: { worked: "Calm start", change: "Slow down", tags: [], skipped: false, savedAt: NOW.toISOString() } })),
      stepNote(makeSession({ selfReview: { worked: "Calm start", change: "", tags: [], skipped: false, savedAt: NOW.toISOString() } })),
      stepNote(makeSession({ durationSec: 64, fillersPerMinute: 6, selfReview: null })),
    ];
    // Confirm each
    expect(notes).toEqual(["Slow down", "Calm start", "You spoke for 1 minute 4."]);
  });

  // The days practised this week count from Monday
  it("counts the days practised this week from Monday", () => {
    // Sunday (last week), Monday, Tuesday twice, and today
    const sessions = [new Date(2026, 9, 11, 9), new Date(2026, 9, 12, 9), new Date(2026, 9, 13, 9), new Date(2026, 9, 13, 18), new Date(2026, 9, 15, 9)].map((day, index) => makeSession({ id: `s${index}`, createdAt: day.toISOString() }));
    // Confirm the third day (Monday, Tuesday, Thursday)
    expect(weekSentence(sessions, NOW)).toBe("Third day this week.");
  });
});
