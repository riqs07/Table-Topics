// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the rules being checked
import { grantFor, liveMonth, minutesUsed, refundFor } from "@/core/liveBudget";

// Group the checks on the live budget's rules (decision 119)
describe("live budget", () => {
  // The month is the UTC month
  it("names the month in UTC", () => {
    // Late on the 31st in UTC, and just after midnight
    expect([liveMonth(new Date(Date.UTC(2026, 9, 31, 23, 59))), liveMonth(new Date(Date.UTC(2026, 10, 1, 0, 1)))]).toEqual(["2026-10", "2026-11"]);
  });

  // Used is reserved less returned, never negative
  it("works out the minutes used", () => {
    // Usual, and returned more than reserved (a crossed month)
    expect([minutesUsed(20, 6), minutesUsed(2, 5)]).toEqual([14, 0]);
  });

  // The cap when plenty is left; the minutes left otherwise; nothing under a minute
  it("grants the cap or the minutes left", () => {
    // Plenty, two left, half a minute left, none
    expect([grantFor(0, 150, 300), grantFor(148, 150, 300), grantFor(149.5, 150, 300), grantFor(150, 150, 300)]).toEqual([{ seconds: 300, minutes: 5 }, { seconds: 120, minutes: 2 }, null, null]);
  });

  // Each started minute counts; never more back than reserved, never negative
  it("hands back the minutes not used", () => {
    // Unused, 70 s, 301 s, a negative report
    expect([refundFor(5, 0), refundFor(5, 70), refundFor(5, 301), refundFor(5, -10), refundFor(0, 10)]).toEqual([5, 3, 0, 5, 0]);
  });
});
