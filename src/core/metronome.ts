// The metronome for reading aloud: its tempo rules and when each beat falls (decision 128)

// The tempo it starts at, in beats a minute (the user's choice: a calm reading pace)
export const DEFAULT_TEMPO = 82;
// The slowest tempo offered
export const MIN_TEMPO = 40;
// The fastest tempo offered
export const MAX_TEMPO = 160;

// Keep a tempo whole and inside the range, falling back to the default for anything that is not a number
export function clampTempo(tempo: number): number {
  // Not a number (a broken saved value): the default
  if (!Number.isFinite(tempo)) return DEFAULT_TEMPO;
  // Whole beats, between the slowest and the fastest
  return Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, Math.round(tempo)));
}

// Seconds from one beat to the next at a tempo
export function beatSeconds(tempo: number): number {
  // A minute shared between the beats
  return 60 / clampTempo(tempo);
}

// The beats to play before a moment: every beat from the next one up to (not including) the end of the look-ahead, and when the beat after them falls
export function beatsDue(nextBeat: number, until: number, gap: number): { beats: number[]; next: number } {
  // The beats found
  const beats: number[] = [];
  // Start at the next beat
  let at = nextBeat;
  // Take every beat that falls before the end of the look-ahead
  while (at < until) {
    // This one
    beats.push(at);
    // On to the one after
    at += gap;
  }
  // The beats, and where the next look starts
  return { beats, next: at };
}
