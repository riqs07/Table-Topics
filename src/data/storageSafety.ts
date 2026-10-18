// The browser side of keeping practice safe: persistent storage, how the app is running, and when a copy was last saved (kept in this browser only; decision 64)

// Load the day helpers
import { daysBetween, dayKey } from "@/core/dates";
// Load the facts the reminder rule needs
import type { SafetyFacts } from "@/core/storageSafety";

// Key for the day of the last export (app-specific, as setup rule S1 asks)
const EXPORT_KEY = "voicelab-last-export";
// Key for the day a reminder was last put aside
const DISMISS_KEY = "voicelab-safety-dismissed";

// Ask the browser not to clear the app's data when space runs low (true if granted, null where it cannot be asked)
export async function requestPersistentStorage(): Promise<boolean | null> {
  // Not every browser can be asked
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return null;
  // Asking can fail in private windows
  try {
    // Already promised: nothing to ask
    if (await navigator.storage.persisted()) return true;
    // Ask
    return await navigator.storage.persist();
  } catch {
    // Treat as unknown
    return null;
  }
}

// Whether the browser has promised to keep the data (null where it cannot say)
export async function readPersisted(): Promise<boolean | null> {
  // Not every browser can say
  if (typeof navigator === "undefined" || !navigator.storage?.persisted) return null;
  // Reading can fail in private windows
  try {
    // The answer
    return await navigator.storage.persisted();
  } catch {
    // Unknown
    return null;
  }
}

// Whether the app runs from the Home Screen or as an installed app
export function isInstalled(): boolean {
  // Safari on an iPhone marks a Home Screen app this way
  const homeScreen = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  // Other browsers report the display mode
  return homeScreen || (typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches);
}

// Whether this is Safari (or any browser, which all use Safari's engine) on an iPhone or iPad
export function isIosSafari(): boolean {
  // iPhones and older iPads name themselves
  const named = /iPhone|iPad|iPod/.test(navigator.userAgent);
  // Newer iPads say "Macintosh" but have a touch screen
  const ipad = /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
  // Either one
  return named || ipad;
}

// Days since the day saved under a key (null if none, or storage is blocked)
function daysSince(key: string, now: Date): number | null {
  // Storage can be blocked, so guard the read
  try {
    // The saved day
    const saved = localStorage.getItem(key);
    // Count from it, if it is a real day
    return saved && !Number.isNaN(new Date(`${saved}T12:00:00`).getTime()) ? daysBetween(new Date(`${saved}T12:00:00`), now) : null;
  } catch {
    // Blocked storage: unknown
    return null;
  }
}

// Remember today under a key
function rememberToday(key: string, now: Date): void {
  // Storage can be blocked, so guard the write
  try {
    // Save the day
    localStorage.setItem(key, dayKey(now));
  } catch {
    // Nothing more can be done
  }
}

// Days since the last export (null if never)
export function daysSinceExport(now: Date): number | null {
  // Read the day
  return daysSince(EXPORT_KEY, now);
}

// Note that a copy was just saved
export function markExported(now: Date): void {
  // Save the day
  rememberToday(EXPORT_KEY, now);
}

// Note that a reminder was put aside
export function markNudgeDismissed(now: Date): void {
  // Save the day
  rememberToday(DISMISS_KEY, now);
}

// Everything the reminder rule needs, read from this browser
export async function readSafetyFacts(sessionCount: number, now: Date): Promise<SafetyFacts> {
  // Gather the answers
  return { persisted: await readPersisted(), installed: isInstalled(), iosSafari: isIosSafari(), sessionCount, daysSinceExport: daysSinceExport(now), daysSinceDismissed: daysSince(DISMISS_KEY, now) };
}
