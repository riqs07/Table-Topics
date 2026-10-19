// Small sentence builders for the script-page screens, which write numbers into prose

// Load the calendar-day helper
import { daysBetween } from "@/core/dates";
// Load the progress type
import type { BaselineProgress } from "@/core/progress";
// Load the practice run type
import type { PracticeRun } from "@/core/streak";

// The practice run as one or two short lines for Today (decision 78): days in the last seven first; the run itself only from a week of practice; never a broken run
export function streakLines(run: PracticeRun): string[] {
  // Nothing yet, nothing to say
  if (!run.any) return [];
  // The very first day stands alone
  if (run.firstDay) return ["First day."];
  // Back after more than a week: a welcome, not a zero
  if (run.lastSeven === 0) return ["Welcome back."];
  // Days in the last seven, and the run once it is a week of practice
  return [`${run.lastSeven} of the last 7 days.`, ...(run.runDays >= 7 ? [`${run.runDays} practice days and counting.`] : [])];
}

// A per-minute rate written with one decimal place
export function formatRate(rate: number): string {
  // Round to one decimal place
  return rate.toFixed(1);
}


// Short weekday names, Sunday first (fixed so the result does not depend on the device's language)
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Short month names
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Full month names
const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// Smallest change in fillers per minute worth describing as a change
const NOTICEABLE = 0.2;

// The progress since the first recording, as one plain sentence
export function progressSentence(progress: BaselineProgress): string {
  // The first recording's date, written like "2 October"
  const date = new Date(progress.baselineDate);
  // Start of the sentence
  const opening = `Since your first recording on ${date.getDate()} ${FULL_MONTHS[date.getMonth()]}, fillers`;
  // Work out the change
  const difference = progress.latest - progress.baseline;
  // A tiny change is described as holding steady
  if (Math.abs(difference) < NOTICEABLE) return `${opening} have held at about ${formatRate(progress.baseline)} a minute.`;
  // A fall, or any rise, is stated plainly
  return `${opening} ${difference < 0 ? "fell" : "went"} from ${formatRate(progress.baseline)} to ${formatRate(progress.latest)} a minute.`;
}

// A short label for when a session happened, relative to now
export function dayLabel(when: Date, now: Date): string {
  // Count calendar days back from today
  const daysAgo = daysBetween(when, now);
  // Today
  if (daysAgo <= 0) return "Today";
  // Yesterday
  if (daysAgo === 1) return "Yesterday";
  // Within the last week, the weekday
  if (daysAgo < 7) return WEEKDAYS[when.getDay()] as string;
  // Otherwise day and short month
  return `${when.getDate()} ${MONTHS[when.getMonth()]}`;
}
