// Whether the developer link to every mode shows in Settings on a released build: kept in this browser only, off unless switched on from the page itself (decision 132). A build run locally always shows it

// Key the choice is stored under (app-specific, as setup rule S1 asks)
const KEY = "voicelab-dev-tools";

// Whether the link shows (off when nothing is saved or storage is blocked)
export function readDevTools(): boolean {
  // Storage can be blocked (private browsing), so guard the read
  try {
    // On only when switched on
    return localStorage.getItem(KEY) === "on";
  } catch {
    // Blocked storage: off
    return false;
  }
}

// Show or hide the link
export function saveDevTools(on: boolean): void {
  // Storage can be blocked, so guard the write
  try {
    // On: remember it
    if (on) localStorage.setItem(KEY, "on");
    // Off, the default, needs nothing stored
    else localStorage.removeItem(KEY);
  } catch {
    // Nothing to do: the choice lasts until the page closes at best
  }
}
