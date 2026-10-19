// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the sentence builders being checked
import { dayLabel, formatRate, progressSentence, streakLines } from "@/core/copy";

// Group the checks about the practice run lines on Today (decision 78)
describe("streakLines", () => {
  // A run as the page gets it
  const run = (lastSeven: number, runDays: number, firstDay = false, any = true) => ({ lastSeven, runDays, firstDay, any });
  // Nothing before the first practice, the first day plainly, and a welcome after time away
  it("says nothing, then the first day, then welcomes back", () => {
    // Confirm the three
    expect([streakLines(run(0, 0, false, false)), streakLines(run(1, 1, true)), streakLines(run(0, 0))]).toEqual([[], ["First day."], ["Welcome back."]]);
  });

  // Days in the last seven lead; the run joins them from a week of practice
  it("leads with the last seven days and adds the run from day 7", () => {
    // Confirm before and after a week
    expect([streakLines(run(4, 6)), streakLines(run(5, 12))]).toEqual([["4 of the last 7 days."], ["5 of the last 7 days.", "12 practice days and counting."]]);
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
