// The seven-day strip on Today: which of the last seven days had practice

// Load the calendar-day helpers
import { addDays, dayKey, startOfDay } from "@/core/dates";

// One day in the strip
export interface StripDay {
  // The day as "2026-10-12", for keys
  key: string;
  // One letter, such as "M"
  letter: string;
  // The full name, such as "Monday", for screen readers
  name: string;
  // Whether there was a session that day
  practised: boolean;
  // Whether it is today
  isToday: boolean;
}

// Day names, from Sunday (as the date tools count them)
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// The last seven days, oldest first and ending today, each marked if it had a session
export function weekStrip(sessionTimes: ReadonlyArray<Date>, now: Date): StripDay[] {
  // The days that had a session
  const practised = new Set(sessionTimes.map(dayKey));
  // Today at midnight
  const today = startOfDay(now);
  // Six days ago up to today
  return Array.from({ length: 7 }, (_, index) => {
    // This day
    const day = addDays(today, index - 6);
    // Its name
    const name = DAY_NAMES[day.getDay()] ?? "";
    // Everything the strip shows about it
    return { key: dayKey(day), letter: name.charAt(0), name, practised: practised.has(dayKey(day)), isToday: index === 6 };
  });
}
