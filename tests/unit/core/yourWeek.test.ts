// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { yourWeek } from "@/core/yourWeek";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// Tuesday 13 October 2026, mid-morning
const NOW = new Date(2026, 9, 13, 10);
// A Table Topic some days back with a filler rate
const take = (daysBack: number, rate: number, extra = {}) => makeSession({ id: `t${daysBack}-${rate}`, mode: "talk", fillersPerMinute: rate, createdAt: new Date(2026, 9, 13 - daysBack, 9).toISOString(), ...extra });

// Group the checks about "Your week" (decision 78)
describe("yourWeek", () => {
  // Nothing before three sessions
  it("waits for three sessions", () => {
    // Confirm
    expect(yourWeek([take(1, 3), take(2, 3)], NOW)).toBeNull();
  });

  // Three weeks of first tries, oldest first; readings and retries are left out
  it("averages first tries for each of three weeks", () => {
    // Two weeks ago, last week (two takes and a reading), and this week (a take and its retry)
    const week = yourWeek([take(15, 5), take(8, 4), take(9, 2), take(9, 9, { mode: "read" }), take(1, 3), take(0, 1, { retryOf: "t1-3" })], NOW);
    // Confirm the three numbers
    expect(week?.weeks.map((item) => item.value)).toEqual([5, 3, 3]);
  });

  // Exactly one suggestion: from the trend when it moved, else a second take, else something new
  it("makes one suggestion", () => {
    // Fewer fillers this week
    const down = yourWeek([take(8, 4), take(9, 4), take(1, 2)], NOW)?.suggestion.text;
    // More fillers this week, with a pause drill to try
    const up = yourWeek([take(8, 2), take(9, 2), take(1, 4)], NOW)?.suggestion;
    // Steady, with no second try this week
    const steady = yourWeek([take(8, 3), take(9, 3), take(1, 3)], NOW)?.suggestion.text;
    // Steady, with a second try this week
    const tried = yourWeek([take(8, 3), take(9, 3), take(1, 3), take(0, 3, { retryOf: "t1-3" })], NOW)?.suggestion.action;
    // Confirm each
    expect([down?.startsWith("Fewer fillers"), up?.action, up?.href?.startsWith("/session?mode=pause"), steady?.startsWith("Try a second take"), tried]).toEqual([true, "Try a pause drill", true, true, "Plan a short speech"]);
  });
});
