// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the week calculator being checked
import { practiceWeek } from "@/core/practiceWeek";

// Build a local date in October 2026
const oct = (day: number, hour = 12) => new Date(2026, 9, day, hour);

// Group the checks about which practice week it is
describe("practiceWeek", () => {
  // Before any session, this is week zero starting today
  it("starts today for a new user", () => {
    // Confirm week zero beginning at today's midnight
    expect(practiceWeek(null, oct(12, 15))).toEqual({ weekNumber: 0, weekStart: oct(12, 0) });
  });

  // Weeks count from the first session's day
  it("counts whole weeks from the first session", () => {
    // Confirm 9 days later is week 1, which began on day 7
    expect(practiceWeek(oct(1, 18), oct(10, 9))).toEqual({ weekNumber: 1, weekStart: oct(8, 0) });
  });
});
