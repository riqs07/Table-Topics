// Whether the space bar starts and stops recording: kept in this browser only, on unless switched off, since a single-key shortcut can be pressed by accident (WCAG 2.1.4; decision 79)

// Key the choice is stored under (app-specific, as setup rule S1 asks)
const KEY = "voicelab-space-shortcut";

// Whether the space bar shortcut is on (on when nothing is saved or storage is blocked)
export function readSpaceShortcut(): boolean {
  // Storage can be blocked (private browsing), so guard the read
  try {
    // Off only when switched off
    return localStorage.getItem(KEY) !== "off";
  } catch {
    // Blocked storage: on
    return true;
  }
}

// Switch the shortcut on or off
export function saveSpaceShortcut(on: boolean): void {
  // Storage can be blocked, so guard the write
  try {
    // On, the default, needs nothing stored
    if (on) localStorage.removeItem(KEY);
    // Off: remember it
    else localStorage.setItem(KEY, "off");
  } catch {
    // Nothing to do: the choice lasts until the page closes at best
  }
}
