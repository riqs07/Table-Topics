// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { takeVerdict, takeWords } from "@/core/takeWords";
// Load how often loudness is read, to build readings
import { LOUDNESS_TICK_MS } from "@/core/recordingRules";

// Loudness readings: voice where a word is said, silence elsewhere, for words at the given times (each about 0.4 seconds long)
function levelsFor(starts: ReadonlyArray<number>, seconds: number): number[] {
  // One reading per tick
  return Array.from({ length: Math.round((seconds * 1000) / LOUDNESS_TICK_MS) }, (_, index) => {
    // The reading's time
    const at = (index * LOUDNESS_TICK_MS) / 1000;
    // Loud inside a word
    return starts.some((start) => at >= start && at < start + 0.4) ? 0.6 : 0;
  });
}

// Group the checks on what was said, word by word (the result's "What you said", second pass)
describe("takeWords", () => {
  // Pause words are marked by piece, punctuation and all
  it("marks the pause words", () => {
    // Confirm "Um," and "like" are marked
    expect(takeWords({ transcript: "Um, I went home like early" }).map((word) => [word.text, word.filler])).toEqual([["Um,", true], ["I", false], ["went", false], ["home", false], ["like", true], ["early", false]]);
  });

  // With word times, a long enough silence between two words is a real pause after the first
  it("finds real pauses between words from their times", () => {
    // Four words, with a long gap after the second
    const starts = [0.5, 1, 3, 3.5];
    // Confirm the pause after "home" only
    expect(takeWords({ transcript: "I went home again", spokenTimes: starts, loudness: levelsFor(starts, 5) }).map((word) => word.pauseAfter)).toEqual([false, true, false, false]);
  });

  // Without word times there are no pauses to place
  it("places no pauses without word times", () => {
    // Confirm none
    expect(takeWords({ transcript: "I went home" }).some((word) => word.pauseAfter)).toBe(false);
  });
});

// Group the checks on a take's verdict
describe("takeVerdict", () => {
  // Rough when the timing missed or pause words were many (only when shown); good otherwise
  it("calls a take rough only from the numbers the change is picked from", () => {
    // Confirm each
    expect([takeVerdict({ fillersPerMinute: 1 }, {}, { pauseWords: true }), takeVerdict({ fillersPerMinute: 1 }, { aboutTiming: true }, { pauseWords: true }), takeVerdict({ fillersPerMinute: 6 }, {}, { pauseWords: true }), takeVerdict({ fillersPerMinute: 6 }, {}, { pauseWords: false })]).toEqual(["good", "rough", "rough", "good"]);
  });
});
