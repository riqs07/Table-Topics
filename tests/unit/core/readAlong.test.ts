// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the reading check being checked
import { alignReading, countPauseMarks } from "@/core/readAlong";

// A short passage to read
const TEXT = "Four score and seven years ago, our fathers brought forth a new nation.";

// Group the checks about comparing what was read with the text
describe("alignReading", () => {
  // A perfect reading: every word heard, nothing extra
  it("marks every word as read when the reading matches", () => {
    // Compare (punctuation and capitals do not matter)
    const result = alignReading(TEXT, "four score and seven years ago our fathers brought forth a new nation");
    // Confirm the percentage and that nothing was missed or added
    expect([result.percentRead, result.missed, result.extra, result.repeated]).toEqual([100, 0, 0, 0]);
  });

  // Skipped words are marked on the text
  it("marks skipped words", () => {
    // "seven" and "brought forth" were not heard
    const result = alignReading(TEXT, "four score and years ago our fathers a new nation");
    // Confirm which words were missed
    expect(result.words.filter((word) => !word.read).map((word) => word.text)).toEqual(["seven", "brought", "forth"]);
    // Confirm the counts (10 of 13 read, rounded down)
    expect([result.missed, result.percentRead]).toEqual([3, 76]);
  });

  // Saying a word twice counts as a repeat, and fillers count as extra
  it("counts repeated words and fillers as extra", () => {
    // "our our" repeated, plus "um"
    const result = alignReading(TEXT, "four score and um seven years ago our our fathers brought forth a new nation");
    // Confirm the extras and repeats
    expect([result.extra, result.repeated, result.missed]).toEqual([2, 1, 0]);
  });

  // The words keep their original spelling and punctuation for display
  it("keeps the original words for display", () => {
    // Compare
    const result = alignReading(TEXT, "four score");
    // Confirm the display text of the sixth word
    expect(result.words[5]?.text).toBe("ago,");
  });

  // Stopping early leaves the rest as unread
  it("treats the unread end as missed", () => {
    // Only the first four words
    const result = alignReading(TEXT, "four score and seven");
    // Confirm the count of read words
    expect(result.words.filter((word) => word.read).length).toBe(4);
  });

  // Pause marks are not words: they are counted, and ignored when lining up the reading
  it("counts pause marks and ignores them when checking the reading", () => {
    // A marked text
    const marked = "Four score / and seven years ago, / our fathers brought forth / a new nation.";
    // Confirm the count and a perfect reading
    expect([countPauseMarks(marked), alignReading(marked, "four score and seven years ago our fathers brought forth a new nation").percentRead]).toEqual([3, 100]);
  });
});
