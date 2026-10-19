// "Your week" on Today (decision 78): pause words a minute over the last three weeks and exactly one suggestion, once there are three sessions

// Load the calendar-day helpers
import { addDays, startOfDay } from "@/core/dates";
// Load the filter for sessions that count toward progress
import { fullSessions } from "@/core/progress";
// Load the pause drills, for a suggestion
import { PAUSE_DRILLS } from "@/content/prompts";
// Load the session record type
import type { SessionRecord } from "@/data/records";

// Sessions needed before the card shows
export const YOUR_WEEK_FROM = 3;
// The smallest change in fillers a minute worth mentioning (as on a retry)
const NOTICEABLE = 0.2;

// One week's number
export interface WeekNumber {
  // Such as "This week"
  label: string;
  // Fillers a minute across the week's first tries, or null with none
  value: number | null;
}

// The one suggestion, with a place to act on it when there is one
export interface WeekSuggestion {
  // What to do
  text: string;
  // Where to do it, or null when it is done from a result
  href: string | null;
  // The link's words
  action: string | null;
}

// Everything the card shows
export interface YourWeek {
  // Three weeks, oldest first, each the seven days ending on the same weekday (empty when pause words are hidden)
  weeks: WeekNumber[];
  // Exactly one suggestion
  suggestion: WeekSuggestion;
}

// The card's content, or null before there are enough sessions
export function yourWeek(sessions: ReadonlyArray<SessionRecord>, now: Date, options: { pauseWords?: boolean } = {}): YourWeek | null {
  // Not enough yet
  if (sessions.length < YOUR_WEEK_FROM) return null;
  // Tomorrow at midnight: each week is the seven days before an end
  const end = addDays(startOfDay(now), 1);
  // First tries of full sessions, the ones progress uses
  const counted = fullSessions(sessions).filter((session) => session.retryOf === null);
  // The average over a week ending some weeks back
  const week = (back: number): number | null => {
    // The week's last moment and first
    const [to, from] = [addDays(end, -7 * back), addDays(end, -7 * (back + 1))];
    // Its rates
    const rates = counted.filter((session) => new Date(session.createdAt) >= from && new Date(session.createdAt) < to).map((session) => session.fillersPerMinute);
    // Their average, or nothing
    return rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : null;
  };
  // Oldest first (none when pause words are hidden; decision 79)
  const weeks = options.pauseWords === false ? [] : [{ label: "Two weeks ago", value: week(2) }, { label: "Last week", value: week(1) }, { label: "This week", value: week(0) }];
  // Whether there was a second try in the last seven days
  const retried = sessions.some((session) => session.retryOf !== null && new Date(session.createdAt) >= addDays(end, -7));
  // The numbers to compare
  const [last, current] = [weeks[1]?.value ?? null, weeks[2]?.value ?? null];
  // One suggestion: from the trend when there is one, otherwise a second take, otherwise something new
  const suggestion: WeekSuggestion =
    last !== null && current !== null && current <= last - NOTICEABLE
      ? { text: "Fewer pause words than last week. Keep the pause where an um would go.", href: null, action: null }
      : last !== null && current !== null && current >= last + NOTICEABLE
        ? { text: "A few more pause words than last week. A pause drill helps you rest on silence.", href: `/session?mode=pause&prompt=${PAUSE_DRILLS[0]?.id ?? ""}`, action: "Try a pause drill" }
        : !retried
          ? { text: "Try a second take once this week: doing the one change straight away is what makes it stick.", href: null, action: null }
          : { text: "A steady week. Try something new: a short speech you plan yourself.", href: "/practice/outline", action: "Plan a short speech" };
  // The card
  return { weeks, suggestion };
}
