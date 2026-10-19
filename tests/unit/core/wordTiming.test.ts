// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the timing findings being checked
import { markPauses, marksPaused, pauseLengthsLine, marksSentence, paceAcross } from "@/core/wordTiming";
// Load the script splitter
import { readingTokens } from "@/core/liveReading";

// Word times for a reading at a given number of words a minute between two moments
const evenly = (count: number, from: number, to: number) => Array.from({ length: count }, (_, index) => from + ((to - from) * index) / count);

// Group the checks about pace from start to finish
describe("paceAcross", () => {
  // An even pace is called steady
  it("calls an even pace steady", () => {
    // 140 words over 60 seconds
    expect(paceAcross(evenly(140, 0, 60))).toEqual({ start: 140, end: 140, sentence: "A steady pace: about 140 words a minute from start to finish." });
  });

  // Speeding up is named, with the numbers at each end
  it("names speeding up", () => {
    // 40 words in the first 20 seconds, 50 in the middle, 60 in the last
    const times = [...evenly(40, 0, 20), ...evenly(50, 20, 40), ...evenly(60, 40, 60)];
    // Confirm the sentence
    expect(paceAcross(times)?.sentence).toBe("You sped up: 120 words a minute at the start, 180 by the end.");
  });

  // Slowing down is named too
  it("names slowing down", () => {
    // 60 words, then 50, then 40
    const times = [...evenly(60, 0, 20), ...evenly(50, 20, 40), ...evenly(40, 40, 60)];
    // Confirm the sentence
    expect(paceAcross(times)?.sentence).toBe("You slowed down: 180 words a minute at the start, 120 by the end.");
  });

  // Too few words or too short a time says nothing
  it("says nothing about a very short take", () => {
    // Confirm nothing for 10 words or 10 seconds
    expect([paceAcross(evenly(10, 0, 30)), paceAcross(evenly(40, 0, 10))]).toEqual([null, null]);
  });
});

// Group the checks about pausing at the marks of a pause drill
describe("marksPaused", () => {
  // A gap of at least 0.8 seconds across a mark counts as a pause there
  it("counts the marks with a pause and names the ones without", () => {
    // Two marks
    const tokens = readingTokens("a b / c d / e f");
    // A long gap at the first mark, a short one at the second
    const result = marksPaused(tokens, [0, 0.3, 1.5, 1.8, 2.0, 2.3]);
    // Confirm one of two, missed after "d"
    expect([result, marksSentence(result)]).toEqual([{ taken: 1, total: 2, missedAfter: ["d"] }, "You paused at 1 of the 2 marks. No pause after “d”."]);
  });

  // Marks next to words that were never heard are left out of the count
  it("leaves out marks it cannot judge", () => {
    // The word after the mark was not heard
    expect(marksPaused(readingTokens("a / b"), [0, null])).toEqual({ taken: 0, total: 0, missedAfter: [] });
  });

  // Every mark paused reads plainly
  it("says so when every mark had a pause", () => {
    // Confirm the sentence
    expect(marksSentence({ taken: 3, total: 3, missedAfter: [] })).toBe("You paused at all 3 marks.");
  });
});

// Group the checks about pause lengths at the marks (decision 80)
describe("markPauses", () => {
  // Each mark's gap from the word before to the word after, or null when one was not heard
  it("measures the gap at each mark", () => {
    // Three words with a mark after each of the first two
    const tokens = readingTokens("one / two / three");
    // Times: the second mark's next word never heard
    const gaps = markPauses(tokens, [0, 1.4, null]);
    // Confirm
    expect(gaps).toEqual([{ after: "one", seconds: 1.4 }, { after: "two", seconds: null }]);
  });
});


// Group the checks about the pause-length line
describe("pauseLengthsLine", () => {
  // How many were one to two seconds, with the most useful nudge
  it("counts the pauses in the target", () => {
    // Short ones, long ones, all good, none measured
    expect([pauseLengthsLine([{ seconds: 0.4 }, { seconds: 1.5 }, { seconds: null }]), pauseLengthsLine([{ seconds: 3.2 }, { seconds: 1.2 }]), pauseLengthsLine([{ seconds: 1 }, { seconds: 2 }]), pauseLengthsLine([{ seconds: null }])]).toEqual([
      "1 of 2 pauses were one to two seconds. Hold the short ones a beat longer.",
      "1 of 2 pauses were one to two seconds. Keep the long ones under two seconds.",
      "2 of 2 pauses were one to two seconds.",
      "The pause lengths could not be measured.",
    ]);
  });
});
