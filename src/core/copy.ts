// Small sentence builders for the script-page screens, which write numbers into prose

// Load the calendar-day helper
import { daysBetween } from "@/core/dates";
// Load the progress type
import type { BaselineProgress } from "@/core/progress";

// Ordinal words for the first ten days, as a printed page would write them
const ORDINALS = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"];

// The streak as a short sentence for Home
export function streakSentence(days: number): string {
  // No streak, nothing to say
  if (days <= 0) return "";
  // The first day stands alone
  if (days === 1) return "First day.";
  // Days two to ten as words
  if (days <= ORDINALS.length) return `${ORDINALS[days - 1]} day running.`;
  // Longer streaks in digits
  return `Day ${days} running.`;
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
