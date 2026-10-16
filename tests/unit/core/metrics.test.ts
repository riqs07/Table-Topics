// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the session measurements being checked
import { countWords, fillersPerMinute, wordsPerMinute } from "@/core/metrics";

// Group the checks about counting words
describe("countWords", () => {
  // Words are separated by spaces and punctuation is ignored
  it("counts words and ignores punctuation", () => {
    // Confirm a punctuated sentence has five words
    expect(countWords("Hello, world! This is me.")).toBe(5);
  });

  // Contractions are one word, not two
  it("counts a contraction as one word", () => {
    // Confirm "don't" and "I'm" each count once
    expect(countWords("I'm sure we don't know")).toBe(5);
  });

  // Nothing said means no words
  it("returns zero for an empty or blank transcript", () => {
    // Confirm empty text has no words
    expect(countWords("")).toBe(0);
    // Confirm whitespace-only text has no words
    expect(countWords("   ")).toBe(0);
  });
});

// Group the checks about speaking speed
describe("wordsPerMinute", () => {
  // 150 words in 60 seconds is 150 per minute
  it("divides words by minutes spoken", () => {
    // Build a transcript of 150 words
    const transcript = Array.from({ length: 150 }, () => "word").join(" ");
    // Confirm the speed for one minute
    expect(wordsPerMinute(transcript, 60)).toBe(150);
    // Confirm the speed for ninety seconds
    expect(wordsPerMinute(transcript, 90)).toBe(100);
  });

  // A zero-length session cannot have a speed
  it("returns zero when the duration is zero or negative", () => {
    // Confirm zero seconds gives zero
    expect(wordsPerMinute("some words", 0)).toBe(0);
    // Confirm a negative duration gives zero
    expect(wordsPerMinute("some words", -5)).toBe(0);
  });
});

// Group the checks about filler rate
describe("fillersPerMinute", () => {
  // Four fillers (um, so, uh, um) in thirty seconds is eight per minute
  it("divides fillers by minutes spoken", () => {
    // Confirm the filler rate for half a minute
    expect(fillersPerMinute("um so uh yes um", 30)).toBe(8);
  });

  // A zero-length session cannot have a rate
  it("returns zero when the duration is zero", () => {
    // Confirm zero seconds gives zero
    expect(fillersPerMinute("um uh", 0)).toBe(0);
  });
});

// Group the checks about the filler rate of a reading
describe("fillersPerMinute with a known text", () => {
  // Only words added to the text count
  it("counts only fillers added to the text", () => {
    // "so" is in the text; the added "um" is not
    expect(fillersPerMinute("um conceived and so dedicated", 30, "conceived and so dedicated")).toBe(2);
  });
});
