// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the run calculator being checked
import { practiceRun } from "@/core/streak";

// A local date in October 2026 at a given hour (the 12th is a Monday)
const oct = (day: number, hour = 12) => new Date(2026, 9, day, hour);
// Practice on each of these October days
const on = (...days: number[]) => days.map((day) => oct(day, 9));

// Group the checks about the forgiving practice run (decision 78)
describe("practiceRun", () => {
  // Nothing yet
  it("is empty with no practice", () => {
    // Confirm
    expect(practiceRun([], oct(12))).toEqual({ lastSeven: 0, runDays: 0, firstDay: false, any: false });
  });

  // Several sessions on the first day count once, and mark the first day
  it("counts days, and knows the first day", () => {
    // Confirm
    expect(practiceRun([oct(12, 8), oct(12, 9), oct(12, 21)], oct(12, 22))).toEqual({ lastSeven: 1, runDays: 1, firstDay: true, any: true });
  });

  // Today without practice yet is not a missed day
  it("keeps the run through today until it ends", () => {
    // Monday to Wednesday, checked on Thursday morning
    expect(practiceRun(on(12, 13, 14), oct(15, 8)).runDays).toBe(3);
  });

  // Two rest days a week keep a run going
  it("keeps a run through two rest days a week", () => {
    // Monday, Tuesday, (rest Wednesday, Thursday), Friday, Saturday
    expect(practiceRun(on(12, 13, 16, 17), oct(17, 20))).toMatchObject({ lastSeven: 4, runDays: 4 });
  });

  // A third missed day in one week breaks it, and the new run starts small
  it("breaks on a third missed day in a week", () => {
    // Monday, then nothing until Friday (Tuesday, Wednesday, Thursday missed)
    expect(practiceRun(on(12, 16), oct(16, 20)).runDays).toBe(1);
  });

  // The rest days come back each Monday
  it("gives two new rest days each week", () => {
    // Week one: Mon, Tue, Wed, Thu, Fri (rest Sat, Sun); week two: Mon, Tue (rest Wed, Thu), Fri
    expect(practiceRun(on(12, 13, 14, 15, 16, 19, 20, 23), oct(23, 20)).runDays).toBe(8);
  });

  // Missed days across a weekend use each week's own rest days, so a four-day gap there is no break
  it("spreads rest days across the weeks they fall in", () => {
    // Monday to Friday, then Saturday to Tuesday missed, then Wednesday
    expect(practiceRun(on(12, 13, 14, 15, 16, 21), oct(21, 20)).runDays).toBe(6);
  });

  // After a longer gap, two days in a row win the run back, with both days added
  it("wins a run back with two days in a row", () => {
    // Monday to Friday, rest at the weekend, Monday, then Tuesday to Thursday missed (a break), then Friday and Saturday
    const days = on(12, 13, 14, 15, 16, 19, 23, 24);
    // Confirm only Friday counts on Friday, and everything on Saturday
    expect([practiceRun(days.slice(0, 7), oct(23, 20)).runDays, practiceRun(days, oct(24, 20)).runDays]).toEqual([1, 8]);
  });

  // One day back, then another miss, lets the old run go
  it("lets the old run go without two days in a row", () => {
    // The same break, Friday, a miss on Saturday, then Sunday
    expect(practiceRun(on(12, 13, 14, 15, 16, 19, 23, 25), oct(25, 20)).runDays).toBe(2);
  });

  // Too long away, and the run starts again
  it("does not win back a run after more than a week away", () => {
    // Five days, then nothing for nine days, then two days in a row
    expect(practiceRun(on(12, 13, 14, 15, 16, 26, 27), oct(27, 20))).toMatchObject({ lastSeven: 2, runDays: 2 });
  });
});
