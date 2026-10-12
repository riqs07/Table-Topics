// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the streak calculator being checked
import { currentStreak } from "@/core/streak";

// Build a local date for a day in October 2026 at a given hour
const oct = (day: number, hour = 12) => new Date(2026, 9, day, hour);

// Group the checks about the showing-up streak
describe("currentStreak", () => {
  // A new user has no streak
  it("is zero with no sessions", () => {
    // Confirm an empty history gives zero
    expect(currentStreak([], oct(12))).toBe(0);
  });

  // Practicing today starts a streak of one
  it("is one after a single session today", () => {
    // Confirm one session today counts as one day
    expect(currentStreak([oct(12, 9)], oct(12, 20))).toBe(1);
  });

  // Several sessions on one day still count as one day
  it("counts days, not sessions", () => {
    // Confirm three sessions today count as one day
    expect(currentStreak([oct(12, 8), oct(12, 9), oct(12, 21)], oct(12, 22))).toBe(1);
  });

  // Consecutive days add up
  it("counts consecutive days ending today", () => {
    // Confirm sessions on the 10th, 11th and 12th make three days
    expect(currentStreak([oct(10), oct(11), oct(12)], oct(12, 18))).toBe(3);
  });

  // The streak stays alive until the end of today if yesterday was practiced
  it("keeps the streak when the last session was yesterday", () => {
    // Confirm sessions on the 10th and 11th still count on the 12th
    expect(currentStreak([oct(10), oct(11)], oct(12, 8))).toBe(2);
  });

  // Missing a full day ends the streak
  it("is zero when the last session was two or more days ago", () => {
    // Confirm a session on the 10th has lapsed by the 12th
    expect(currentStreak([oct(10)], oct(12))).toBe(0);
  });

  // A gap in the past only limits how far back the streak reaches
  it("stops counting at the first gap", () => {
    // Confirm the 8th does not count because the 9th was missed
    expect(currentStreak([oct(7), oct(8), oct(10), oct(11), oct(12)], oct(12))).toBe(3);
  });

  // Order of the history must not matter
  it("does not depend on the order of sessions", () => {
    // Confirm shuffled dates give the same answer
    expect(currentStreak([oct(12), oct(10), oct(11)], oct(12))).toBe(3);
  });

  // Days are calendar days, so late night and early morning are different days
  it("treats just before and just after midnight as different days", () => {
    // Confirm 23:30 on the 11th and 00:30 on the 12th make two days
    expect(currentStreak([new Date(2026, 9, 11, 23, 30), new Date(2026, 9, 12, 0, 30)], oct(12))).toBe(2);
  });

  // Month boundaries must not break the count
  it("counts across the end of a month", () => {
    // Confirm September 30 and October 1 are consecutive
    expect(currentStreak([new Date(2026, 8, 30, 12), oct(1)], oct(1, 18))).toBe(2);
  });
});
