// Which week of practice it is, counted from the first session; drives the weekly challenge

// Load the calendar-day helpers
import { addDays, daysBetween, startOfDay } from "@/core/dates";

// A practice week
export interface PracticeWeek {
  // 0 for the first week, 1 for the second, ...
  weekNumber: number;
  // Midnight on the day this week began
  weekStart: Date;
}

// Work out the current practice week from the first session's time (or null for a new user)
export function practiceWeek(firstSessionAt: Date | null, now: Date): PracticeWeek {
  // A new user's first week starts today
  const start = startOfDay(firstSessionAt ?? now);
  // Count whole weeks since the start, never negative
  const weekNumber = Math.max(0, Math.floor(daysBetween(start, now) / 7));
  // Hand back the week and the day it began
  return { weekNumber, weekStart: addDays(start, weekNumber * 7) };
}
