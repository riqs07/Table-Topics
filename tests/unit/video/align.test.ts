// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked: the lesson clips' word timing (decision 147)
import { alignLines, shareStretches, syllables } from "../../../video/src/lessons/align";

// Group the checks about timing a clip's lines and words from its voice
describe("lesson clip timing", () => {
  // Syllables are counted from groups of vowels, a silent final e left out, at least one
  it("counts syllables roughly", () => {
    // Confirm a few words, a number and a sign
    expect([syllables("story"), syllables("moments"), syllables("line"), syllables("“Keep"), syllables("14"), syllables("…")]).toEqual([2, 2, 1, 1, 1, 1]);
  });

  // Each line starts after a long pause, not after a comma's, even when the voice is slow on a short line
  it("starts each line after a long pause", () => {
    // Two lines: the first paused at its comma (0.3 s), then a long pause (0.6 s) before the second, which is spoken slowly
    const stretches = [{ start: 0, end: 1 }, { start: 1.3, end: 2.2 }, { start: 2.8, end: 4.4 }];
    // Confirm the second line starts at the third stretch, not the second
    expect(shareStretches([10, 4], stretches)).toEqual([0, 2.8]);
  });

  // With fewer pauses than lines, there is no sharing out
  it("gives up sharing when there are fewer pauses than lines", () => {
    // Confirm none
    expect(shareStretches([3, 3, 3], [{ start: 0, end: 2 }, { start: 2.5, end: 4 }])).toBeNull();
  });

  // Every word gets a start inside its line, in order, the first at the line's start
  it("times every word inside its line", () => {
    // Two lines over two stretches
    const { lineStarts, words } = alignLines(["Most people do.", "But not you."], [{ start: 0, end: 1 }, { start: 1.6, end: 2.6 }]);
    // The second line's words
    const second = words.filter((word) => word.line === 1).map((word) => word.start);
    // Confirm the line starts, the first word on its line's start, and the words in order inside the line
    expect([lineStarts, second[0], second.every((start, index) => index === 0 || start > second[index - 1]!), second.at(-1)! < 2.6]).toEqual([[0, 1.6], 1.6, true, true]);
  });
});
