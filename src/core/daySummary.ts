// What Today says about the day's practice: time spoken, each step's own note, and the days practised this week (never a filler count)

// Load the calendar-day helpers
import { addDays, dayKey, startOfDay } from "@/core/dates";
// Load the record type
import type { SessionRecord } from "@/data/records";

// Day counts as words, for "Fourth day this week"
const ORDINALS = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh"];

// A length of time in words: "45 seconds", "1 minute", "3 minutes 20"
export function spokenTime(seconds: number): string {
  // Whole seconds
  const total = Math.max(0, Math.round(seconds));
  // Under a minute: seconds only
  if (total < 60) return `${total} ${total === 1 ? "second" : "seconds"}`;
  // Whole minutes
  const minutes = Math.floor(total / 60);
  // Seconds left over
  const rest = total % 60;
  // Minutes, then any seconds after them
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}${rest > 0 ? ` ${rest}` : ""}`;
}

// The day's opening line: how long the user spoke today
export function spokenSentence(today: ReadonlyArray<SessionRecord>): string {
  // Every session's length added up
  const seconds = today.reduce((total, session) => total + session.durationSec, 0);
  // The sentence
  return `You spoke for ${spokenTime(seconds)} today.`;
}

// A done step's line: the user's own note, or how long they spoke
export function stepNote(session: SessionRecord): string {
  // Their note on what to change, or else on what worked, or else the length
  return session.selfReview?.change || session.selfReview?.worked || `You spoke for ${spokenTime(session.durationSec)}.`;
}

// Which day of this week (from Monday) today's practice is: "Fourth day this week."
export function weekSentence(sessions: ReadonlyArray<SessionRecord>, now: Date): string {
  // Monday of this week (getDay counts Sunday as 0)
  const monday = addDays(startOfDay(now), -((now.getDay() + 6) % 7));
  // Days this week with a session
  const days = new Set(sessions.filter((session) => new Date(session.createdAt) >= monday).map((session) => dayKey(new Date(session.createdAt)))).size;
  // In words, up to the seventh
  return `${ORDINALS[Math.min(Math.max(days, 1), 7) - 1]} day this week.`;
}
