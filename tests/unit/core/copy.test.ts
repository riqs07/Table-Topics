// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the sentence builders being checked
import { dayLabel, formatRate, progressSentence, streakSentence } from "@/core/copy";

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

// Group the checks about the progress sentence on History
describe("progressSentence", () => {
  // Fewer fillers is said plainly
  it("describes a fall", () => {
    // Confirm the wording
    expect(progressSentence({ baselineDate: new Date(2026, 9, 2).toISOString(), baseline: 6, latest: 2.4, percentChange: -60 })).toBe("Since your first recording on 2 October, fillers fell from 6.0 to 2.4 a minute.");
  });

  // More fillers is said just as plainly, without alarm
  it("describes a rise", () => {
    // Confirm the wording
    expect(progressSentence({ baselineDate: new Date(2026, 9, 2).toISOString(), baseline: 3, latest: 3.6, percentChange: 20 })).toBe("Since your first recording on 2 October, fillers went from 3.0 to 3.6 a minute.");
  });

  // A tiny change counts as holding steady
  it("describes no real change", () => {
    // Confirm the wording
    expect(progressSentence({ baselineDate: new Date(2026, 9, 2).toISOString(), baseline: 3, latest: 3.1, percentChange: 3 })).toBe("Since your first recording on 2 October, fillers have held at about 3.0 a minute.");
  });
});

// Group the checks about day labels in the history list
describe("dayLabel", () => {
  // A fixed "now": Tuesday 13 October 2026
  const now = new Date(2026, 9, 13, 18);

  // Today and yesterday are named
  it("names today and yesterday", () => {
    // Confirm today
    expect(dayLabel(new Date(2026, 9, 13, 8), now)).toBe("Today");
    // Confirm yesterday
    expect(dayLabel(new Date(2026, 9, 12, 8), now)).toBe("Yesterday");
  });

  // Days earlier this week use a short weekday
  it("uses the weekday within the last week", () => {
    // Confirm Friday 9 October
    expect(dayLabel(new Date(2026, 9, 9, 8), now)).toBe("Fri");
  });

  // Older days use day and month
  it("uses day and month for older days", () => {
    // Confirm 2 October
    expect(dayLabel(new Date(2026, 9, 2, 8), now)).toBe("2 Oct");
  });
});
