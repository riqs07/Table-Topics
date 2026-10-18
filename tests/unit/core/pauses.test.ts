// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the pause finder being checked
import { fadingEnds, findPauses, leadingSilenceSeconds, pauseDrillSentence } from "@/core/pauses";

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

// Group the checks about the pause drill sentence
describe("pauseDrillSentence", () => {
  // The pauses taken against the marks in the passage
  it("compares the pauses taken with the marks", () => {
    // Confirm none, one, and several
    expect([pauseDrillSentence(0, 5), pauseDrillSentence(1, 5), pauseDrillSentence(4, 5)]).toEqual(["You did not pause; the passage has 5 pause marks.", "You paused once; the passage has 5 pause marks.", "You paused 4 times; the passage has 5 pause marks."]);
  });
});

// Group the checks about the silence before the first word, and endings that fade
describe("opening silence and fading endings", () => {
  // Time before the first speech reading
  it("measures the silence before the first word", () => {
    // 1.2 seconds of quiet, then speech
    expect(leadingSilenceSeconds([...run(0.01, 12), ...run(0.3, 20)], 100)).toBe(1.2);
  });

  // A stretch fades when its last 0.3 seconds are much quieter than the stretch as a whole; very short stretches are ignored
  it("counts stretches of speech whose ends fade", () => {
    // A fading stretch, a pause, a steady stretch, a pause, a stretch too short to judge
    const levels = [...run(0.3, 17), ...run(0.12, 3), ...run(0.01, 10), ...run(0.3, 20), ...run(0.01, 10), ...run(0.3, 5)];
    // Confirm two judged, one faded
    expect(fadingEnds(levels, 100)).toEqual({ stretches: 2, faded: 1 });
  });
});
