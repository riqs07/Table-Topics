// The last day whose finished practice was marked with the small completion moment (kept in this browser only; not part of the data export)

// Key the day is stored under (app-specific, as setup rule S1 asks)
const KEY = "voicelab-day-celebrated";

// Whether today's finish has been marked already, remembering it if not (blocked storage counts as marked, so it never repeats)
export function firstFinishToday(day: string): boolean {
  // Storage can be blocked (private browsing), so guard the read and write
  try {
    // Already marked today
    if (localStorage.getItem(KEY) === day) return false;
    // Remember today
    localStorage.setItem(KEY, day);
    // The first time
    return true;
  } catch {
    // Blocked storage: no moment, rather than one on every visit
    return false;
  }
}
