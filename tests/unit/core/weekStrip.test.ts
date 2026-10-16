// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the week strip being checked
import { weekStrip } from "@/core/weekStrip";

// Tuesday 13 October 2026, mid-morning
const NOW = new Date(2026, 9, 13, 10);

// Group the checks about the seven-day strip on Today
describe("weekStrip", () => {
  // Seven days, oldest first, ending today
  it("gives the last seven days ending today", () => {
    // The strip
    const days = weekStrip([], NOW);
    // Confirm the names, first and last, and that only the last is today
    expect([days.length, days[0]?.name, days[6]?.name, days.filter((day) => day.isToday).length, days[6]?.isToday]).toEqual([7, "Wednesday", "Tuesday", 1, true]);
  });

  // Each day has a one-letter label
  it("labels each day with one letter", () => {
    // Confirm the letters from Wednesday to Tuesday
    expect(weekStrip([], NOW).map((day) => day.letter).join("")).toBe("WTFSSMT");
  });

  // A day with a session is marked as practised, whatever the time
  it("marks the days with a session", () => {
    // Sessions late yesterday and early today, and one eight days ago (outside the strip)
    const times = [new Date(2026, 9, 12, 23, 50), new Date(2026, 9, 13, 0, 5), new Date(2026, 9, 5, 12)];
    // Confirm only the last two days are marked
    expect(weekStrip(times, NOW).map((day) => day.practised)).toEqual([false, false, false, false, false, true, true]);
  });
});
