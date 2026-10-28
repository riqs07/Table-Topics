// Whether a story's template shows while telling it: on for a beginner who wants the beats in view, off for someone who tells without them; kept in this browser only, like the metronome, and on unless switched off (decision 130)

// Key the choice is stored under (app-specific, as setup rule S1 asks)
const KEY = "voicelab-story-template";

// Whether the template shows while telling (on when nothing is saved or storage is blocked)
export function readStoryTemplateShown(): boolean {
  // Storage can be blocked (private browsing), so guard the read
  try {
    // Off only when switched off
    return localStorage.getItem(KEY) !== "off";
  } catch {
    // Blocked storage: on
    return true;
  }
}

// Show or hide the template while telling
export function saveStoryTemplateShown(shown: boolean): void {
  // Storage can be blocked, so guard the write
  try {
    // Off: remember it
    if (!shown) localStorage.setItem(KEY, "off");
    // On, the default, needs nothing stored
    else localStorage.removeItem(KEY);
  } catch {
    // Nothing to do: the choice lasts until the page closes at best
  }
}
