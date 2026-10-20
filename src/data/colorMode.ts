// Light, dark, or follow the device: kept in this browser only, like the welcome flag (not part of the data export; decision 60); follows the device unless something else was chosen (decision 89, which reverses decision 70's light default)

// Key the choice is stored under (app-specific, as setup rule S1 asks)
const KEY = "voicelab-color-mode";

// The three choices
export type ColorMode = "system" | "light" | "dark";

// Every choice, in the order Settings shows them (the default first)
export const COLOR_MODES: ReadonlyArray<{ id: ColorMode; name: string }> = [
  // Follow the phone or computer (the default)
  { id: "system", name: "Auto" },
  // Always light
  { id: "light", name: "Light" },
  // Always dark
  { id: "dark", name: "Dark" },
];

// Whether a stored value is one of the choices
function isColorMode(value: string | null): value is ColorMode {
  // Only the three known words count
  return value === "system" || value === "light" || value === "dark";
}

// The saved choice (follow the device when nothing is saved or storage is blocked)
export function readColorMode(): ColorMode {
  // Storage can be blocked (private browsing), so guard the read
  try {
    // The stored word
    const stored = localStorage.getItem(KEY);
    // Use it if it is a known choice
    return isColorMode(stored) ? stored : "system";
  } catch {
    // Blocked storage: follow the device
    return "system";
  }
}

// Show a choice on the page: the theme CSS reads data-mode on the page root (none means light, "system" follows the device)
export function applyColorMode(mode: ColorMode): void {
  // The page root
  const root = document.documentElement;
  // Light: no attribute, so the light colours apply whatever the device prefers
  if (mode === "light") root.removeAttribute("data-mode");
  // Otherwise dark, or follow the device
  else root.setAttribute("data-mode", mode);
}

// Save a choice and show it straight away
export function saveColorMode(mode: ColorMode): void {
  // Show it first, so it works even if storage is blocked
  applyColorMode(mode);
  // Storage can be blocked, so guard the write
  try {
    // Following the device, the default, needs nothing stored
    if (mode === "system") localStorage.removeItem(KEY);
    // Otherwise remember the word
    else localStorage.setItem(KEY, mode);
  } catch {
    // The choice still holds until the page closes
  }
}

// The mode the page is drawn with before any script runs: follow the device (the early script below changes it for a saved choice)
export const DEFAULT_PAGE_MODE = "system";

// A tiny script for the page head that applies the saved choice before anything is drawn, so a light or dark choice never flashes the other first; anything else follows the device
export const COLOR_MODE_SCRIPT = `try{var m=localStorage.getItem(${JSON.stringify(KEY)});var r=document.documentElement;if(m==="light")r.removeAttribute("data-mode");else r.setAttribute("data-mode",m==="dark"?"dark":"system")}catch(e){document.documentElement.setAttribute("data-mode","system")}`;
