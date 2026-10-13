// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the sentence builders being checked
import { formatRate, streakSentence } from "@/core/copy";

// Group the checks about the streak sentence on Home
describe("streakSentence", () => {
  // No streak, no sentence
  it("is empty with no streak", () => {
    // Confirm nothing is said
    expect(streakSentence(0)).toBe("");
  });

  // The first day is named plainly
  it("names the first day", () => {
    // Confirm the wording
    expect(streakSentence(1)).toBe("First day.");
  });

  // Small numbers are written as words, like a printed page
  it("writes small numbers as words", () => {
    // Confirm the wording for four days
    expect(streakSentence(4)).toBe("Fourth day running.");
  });

  // Large numbers use digits
  it("uses digits after ten", () => {
    // Confirm the wording for 23 days
    expect(streakSentence(23)).toBe("Day 23 running.");
  });
});

// Group the checks about how rates are written
describe("formatRate", () => {
  // Rates show one decimal place
  it("shows one decimal place", () => {
    // Confirm rounding
    expect(formatRate(4.25)).toBe("4.3");
    // Confirm a whole number keeps its decimal
    expect(formatRate(3)).toBe("3.0");
  });
});
