// The metronome choice for reading aloud: on or off, and its tempo; kept in this browser only, like the timing tones, and off unless chosen (decision 128)

// Load the tempo rules
import { DEFAULT_TEMPO, clampTempo } from "@/core/metronome";

// Key the choice is stored under (app-specific, as setup rule S1 asks)
const KEY = "voicelab-metronome";

// The metronome choice
export interface MetronomeChoice {
  // Whether it ticks while reading
  on: boolean;
  // Beats a minute
  tempo: number;
}

// The choice with nothing saved: off, at the default tempo
export const DEFAULT_METRONOME: MetronomeChoice = { on: false, tempo: DEFAULT_TEMPO };

// Read the saved choice (the default when nothing is saved, the value is broken, or storage is blocked)
export function readMetronome(): MetronomeChoice {
  // Storage can be blocked (private browsing), and the value may be from an older or another app, so guard the read
  try {
    // The saved text
    const saved = localStorage.getItem(KEY);
    // Nothing saved: the default
    if (saved === null) return DEFAULT_METRONOME;
    // Read it
    const value: unknown = JSON.parse(saved);
    // Not an object: the default
    if (typeof value !== "object" || value === null) return DEFAULT_METRONOME;
    // The parts, whatever shape they are
    const { on, tempo } = value as { on?: unknown; tempo?: unknown };
    // On only when saved as on; a tempo only when it is a number, kept in range
    return { on: on === true, tempo: typeof tempo === "number" ? clampTempo(tempo) : DEFAULT_TEMPO };
  } catch {
    // Blocked storage or broken text: the default
    return DEFAULT_METRONOME;
  }
}

// Save the choice
export function saveMetronome(choice: MetronomeChoice): void {
  // Storage can be blocked, so guard the write
  try {
    // Store both parts, the tempo kept in range
    localStorage.setItem(KEY, JSON.stringify({ on: choice.on, tempo: clampTempo(choice.tempo) }));
  } catch {
    // Nothing to do: the choice lasts until the page closes at best
  }
}
