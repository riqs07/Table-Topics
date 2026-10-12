// The showing-up streak: consecutive days with at least one completed session

// Load the calendar-day helpers
import { addDays, dayKey, startOfDay } from "@/core/dates";

// Count consecutive practice days ending today, or yesterday if today has no session yet
export function currentStreak(sessionTimes: ReadonlyArray<Date>, now: Date): number {
  // Collect the distinct calendar days that have a session
  const practiced = new Set(sessionTimes.map(dayKey));
  // Begin at today
  let day = startOfDay(now);
  // If today has no session yet, the streak can still be alive from yesterday
  if (!practiced.has(dayKey(day))) day = addDays(day, -1);
  // Start the count at zero
  let streak = 0;
  // Step back one day at a time while each day has a session
  while (practiced.has(dayKey(day))) {
    // Count this day
    streak += 1;
    // Move to the day before
    day = addDays(day, -1);
  }
  // Report the number of consecutive days
  return streak;
}
