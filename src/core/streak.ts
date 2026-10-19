// The practice run, forgiving by design (decision 78): days practised in the last seven lead, two rest days a week never break a run, two days in a row after a longer gap win it back, and a broken run is never shown

// Load the calendar-day helpers
import { addDays, dayKey, startOfDay } from "@/core/dates";

// Rest days a week (Monday to Sunday) that keep a run going
export const REST_DAYS_A_WEEK = 2;
// The longest gap, in missed days, that two days of practice in a row afterwards can win back
export const WIN_BACK_GAP_DAYS = 7;

// Where practice stands
export interface PracticeRun {
  // Days with practice in the last seven, today included
  lastSeven: number;
  // Practice days in the current run (rest days keep it going but do not add to it)
  runDays: number;
  // Whether today is the first day ever with practice
  firstDay: boolean;
  // Whether there was ever any practice
  any: boolean;
}

// Monday of a day's week, as text, to tell weeks apart
function weekOf(day: Date): string {
  // Back to Monday (getDay counts Sunday as 0)
  return dayKey(addDays(day, -((day.getDay() + 6) % 7)));
}

// Work out the run from the times of every practice (sessions and missions)
export function practiceRun(times: ReadonlyArray<Date>, now: Date): PracticeRun {
  // The distinct days with practice
  const practised = new Set(times.map(dayKey));
  // Today at midnight
  const today = startOfDay(now);
  // Days practised in the last seven
  const lastSeven = Array.from({ length: 7 }, (_, index) => addDays(today, -index)).filter((day) => practised.has(dayKey(day))).length;
  // The first day with practice, if any
  const first = times.length > 0 ? startOfDay(new Date(Math.min(...times.map((time) => time.getTime())))) : null;
  // Nothing yet
  if (!first) return { lastSeven: 0, runDays: 0, firstDay: false, any: false };
  // Practice days in the current run
  let run = 0;
  // Rest days used this week
  let rested = 0;
  // The week being counted
  let week = weekOf(first);
  // Missed days in a row
  let gap = 0;
  // A run broken by too many missed days, held in case it is won back
  let held: number | null = null;
  // The first practice day after that break
  let back: string | null = null;
  // Each day from the first practice to today
  for (let day = first; day <= today; day = addDays(day, 1)) {
    // A new week brings two new rest days
    if (weekOf(day) !== week) {
      // This week
      week = weekOf(day);
      // None used yet
      rested = 0;
    }
    // A day with practice
    if (practised.has(dayKey(day))) {
      // The day after the first one back from a break: the run is won back, with both days
      if (held !== null && back === dayKey(addDays(day, -1))) {
        // The old run, the day back, and today
        run = held + run + 1;
        // Nothing held any more
        held = null;
        // Nor waiting
        back = null;
      } else {
        // The first day back after a break starts the wait for a second
        if (held !== null && back === null) back = dayKey(day);
        // Count the day
        run += 1;
      }
      // The gap is over
      gap = 0;
      // Next day
      continue;
    }
    // Today without practice yet is not missed
    if (dayKey(day) === dayKey(today)) continue;
    // A missed day
    gap += 1;
    // One back but not two in a row, or too long away: the held run is let go
    if (back !== null || gap > WIN_BACK_GAP_DAYS) {
      // Let it go
      held = null;
      // Stop waiting
      back = null;
    }
    // A rest day, while there are some left this week
    if (rested < REST_DAYS_A_WEEK) {
      // Use one
      rested += 1;
      // Next day
      continue;
    }
    // Too many: the run breaks (held, in case two days in a row win it back)
    if (run > 0) held = run;
    // A new run starts from nothing, with this week's rest days fresh
    run = 0;
    // Fresh rest days
    rested = 0;
  }
  // Everything the page shows
  return { lastSeven, runDays: run, firstDay: practised.has(dayKey(today)) && practised.size === 1, any: true };
}
