// Whether this browser has seen the welcome question (kept in this browser only; not part of the data export)

// Key the flag is stored under (app-specific, as setup rule S1 asks)
const KEY = "voicelab-welcome-seen";

// Whether the welcome was answered or skipped here before (blocked storage counts as seen, so it never nags)
export function readWelcomeSeen(): boolean {
  // Storage can be blocked (private browsing), so guard the read
  try {
    // Any value means seen
    return localStorage.getItem(KEY) !== null;
  } catch {
    // Blocked storage: do not show it
    return true;
  }
}

// Remember that the welcome was answered or skipped
export function markWelcomeSeen(): void {
  // Storage can be blocked, so guard the write
  try {
    // Save the flag
    localStorage.setItem(KEY, "yes");
  } catch {
    // Nothing more can be done if storage is blocked
  }
}
