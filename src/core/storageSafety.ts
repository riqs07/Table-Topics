// Keeping practice safe on the device: which one reminder to show, if any (decision 64)

// The one reminder Today can show: add to the Home Screen (iPhone Safari), save a copy, or nothing
export type SafetyNudge = "install" | "export" | null;

// What is known about this device and its data
export interface SafetyFacts {
  // Whether the browser has promised not to clear the data (null when it cannot say)
  persisted: boolean | null;
  // Whether the app runs from the Home Screen or as an installed app
  installed: boolean;
  // Whether this is Safari on an iPhone or iPad, which clears the data of sites not used for a while
  iosSafari: boolean;
  // How many sessions are saved
  sessionCount: number;
  // Days since the last export (null if never)
  daysSinceExport: number | null;
  // Days since a reminder was last put aside (null if never)
  daysSinceDismissed: number | null;
}

// No reminders until there is some practice worth keeping
export const NUDGE_AFTER_SESSIONS = 3;
// Ask for a fresh copy this often
export const EXPORT_EVERY_DAYS = 30;
// Without any copy, ask once there are this many sessions
export const FIRST_EXPORT_AFTER_SESSIONS = 10;
// After "Not now", stay quiet this long
export const QUIET_DAYS = 14;

// Pick the reminder: adding to the Home Screen comes first where Safari may clear the data, then a copy now and then
export function safetyNudge(facts: SafetyFacts): SafetyNudge {
  // Too early to bother
  if (facts.sessionCount < NUDGE_AFTER_SESSIONS) return null;
  // Put aside recently
  if (facts.daysSinceDismissed !== null && facts.daysSinceDismissed < QUIET_DAYS) return null;
  // Safari on an iPhone, not added to the Home Screen and not protected
  if (facts.iosSafari && !facts.installed && facts.persisted !== true) return "install";
  // No copy yet, and enough to lose
  if (facts.daysSinceExport === null) return facts.sessionCount >= FIRST_EXPORT_AFTER_SESSIONS ? "export" : null;
  // The last copy is old
  return facts.daysSinceExport >= EXPORT_EVERY_DAYS ? "export" : null;
}

// How long ago the last copy was, in a few words
export function lastCopyText(daysSinceExport: number | null): string {
  // Never
  if (daysSinceExport === null) return "No copy saved yet";
  // Today
  if (daysSinceExport <= 0) return "Last copy saved today";
  // Yesterday
  if (daysSinceExport === 1) return "Last copy saved yesterday";
  // Some days ago
  return `Last copy saved ${daysSinceExport} days ago`;
}
