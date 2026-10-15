// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the pause finder being checked
import { findPauses, pauseSentence } from "@/core/pauses";

// A run of the same loudness reading, one per tenth of a second
const run = (level: number, ticks: number) => Array<number>(ticks).fill(level);

// Group the checks about finding pauses in the loudness readings
describe("findPauses", () => {
  // A one-second silence between speech is a pause; a short gap and the silence before and after are not
  it("counts silences of at least 0.6 seconds between speech", () => {
    // Quiet start, speech, 1 s pause, speech, 0.4 s gap, speech, quiet end
    const levels = [...run(0.01, 5), ...run(0.3, 20), ...run(0.01, 10), ...run(0.3, 20), ...run(0.01, 4), ...run(0.3, 20), ...run(0.01, 30)];
    // Find the pauses
    const result = findPauses(levels, 100);
    // Confirm one pause of one second, and speaking 81% of the time from first word to last
    expect(result).toEqual({ count: 1, averageSeconds: 1, longestSeconds: 1, speakingPercent: 81 });
  });

  // Nothing but silence: no pauses and no speaking
  it("handles silence", () => {
    // Confirm the empty result
    expect(findPauses(run(0.01, 50), 100)).toEqual({ count: 0, averageSeconds: 0, longestSeconds: 0, speakingPercent: 0 });
  });

  // The threshold follows the speaker's own loudness, so a quiet speaker still has pauses found
  it("adapts to a quiet speaker", () => {
    // Quiet speech at 0.06 with a 2-second gap at 0.005
    const levels = [...run(0.06, 30), ...run(0.005, 20), ...run(0.06, 30)];
    // Confirm the pause is found
    expect(findPauses(levels, 100).count).toBe(1);
  });
});

// Group the checks about the pause sentence
describe("pauseSentence", () => {
  // Plain wording, singular and plural
  it("says the pauses plainly", () => {
    // Confirm both forms
    expect([pauseSentence({ count: 1, averageSeconds: 1, longestSeconds: 1, speakingPercent: 81 }), pauseSentence({ count: 6, averageSeconds: 1.25, longestSeconds: 3, speakingPercent: 74 })]).toEqual(["1 pause, 1.0 seconds long; speaking 81% of the time.", "6 pauses, 1.3 seconds on average; speaking 74% of the time."]);
  });
});
