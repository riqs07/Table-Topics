// The tiny copy of a take's fingerprint kept on its session (decision 115): its shape, its sizes, the check that a stored value can be drawn, and its stretches for drawing. No imports, so History's download stays small

// How many places the tiny copy has
export const MINI_BINS = 32;
// The tiny copy's loudness steps (0 is silence)
export const MINI_LEVELS = 9;

// The tiny copy kept on the session
export interface MiniFingerprint {
  // The copy's version, so a later shape can be told apart
  v: 1;
  // Loudness in each of 32 equal parts of the take, 0 (silent) to 9
  bins: number[];
  // The parts in which pause words were said
  ums: number[];
}

// Whether a stored value is a tiny copy this version can draw (a damaged or later one is ignored)
export function isMiniFingerprint(value: unknown): value is MiniFingerprint {
  // The shape
  const mini = value as Partial<MiniFingerprint> | null;
  // Version 1, 32 small whole numbers and a list of places
  return typeof mini === "object" && mini !== null && mini.v === 1 && Array.isArray(mini.bins) && mini.bins.length === MINI_BINS && mini.bins.every((bin) => Number.isInteger(bin) && bin >= 0 && bin <= MINI_LEVELS) && Array.isArray(mini.ums) && mini.ums.every((bin) => Number.isInteger(bin) && bin >= 0 && bin < MINI_BINS);
}

// The tiny copy's stretches for drawing: runs of spoken parts, each with its average level 0 to 1
export function miniStretches(mini: MiniFingerprint): Array<{ from: number; to: number; level: number }> {
  // The runs
  const runs: Array<{ from: number; to: number; level: number }> = [];
  // The run being built: its first part and its levels
  let current: { from: number; levels: number[] } | null = null;
  // Each part, with one past the end to close the last run
  [...mini.bins, 0].forEach((bin, index) => {
    // Speech: start or grow a run
    if (bin > 0) {
      // Start
      current ??= { from: index, levels: [] };
      // Grow
      current.levels.push(bin);
      // Next
      return;
    }
    // Silence closes a run
    if (current) runs.push({ from: current.from, to: index - 1, level: current.levels.reduce((sum, level) => sum + level, 0) / current.levels.length / MINI_LEVELS });
    // None now
    current = null;
  });
  // Hand them back
  return runs;
}
