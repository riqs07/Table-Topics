// Timing tones: a soft tone (and a short buzz where the phone allows) when the light changes; kept in this browser only, like the light and dark choice, and off unless chosen (decision 77)

// Key the choice is stored under (app-specific, as setup rule S1 asks)
const KEY = "voicelab-timing-tones";

// Whether timing tones are on (off when nothing is saved or storage is blocked)
export function readTimingTones(): boolean {
  // Storage can be blocked (private browsing), so guard the read
  try {
    // On only when switched on
    return localStorage.getItem(KEY) === "on";
  } catch {
    // Blocked storage: off
    return false;
  }
}

// Switch timing tones on or off
export function saveTimingTones(on: boolean): void {
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
