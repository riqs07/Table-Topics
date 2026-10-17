// Whether the microphone has been explained before the browser's own question (kept in this browser only; not part of the data export)

// Key the flag is stored under (app-specific, as setup rule S1 asks)
const KEY = "voicelab-mic-explained";

// Whether the explanation was shown here before (blocked storage counts as shown, so it never nags)
export function readMicExplained(): boolean {
  // Storage can be blocked (private browsing), so guard the read
  try {
    // Any value means shown
    return localStorage.getItem(KEY) !== null;
  } catch {
    // Blocked storage: do not show it
    return true;
  }
}

// Remember that the explanation was shown
export function markMicExplained(): void {
  // Storage can be blocked, so guard the write
  try {
    // Save the flag
    localStorage.setItem(KEY, "yes");
  } catch {
    // Nothing more can be done if storage is blocked
  }
}
