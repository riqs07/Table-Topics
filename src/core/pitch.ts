// Pitch: how high the voice is, worked out on the device from short slices of the microphone signal, and what a run of readings shows (decision 80)

// Lowest voice pitch looked for, in hertz (below a deep speaking voice)
export const PITCH_MIN_HZ = 70;
// Highest voice pitch looked for, in hertz (above a high speaking voice)
export const PITCH_MAX_HZ = 500;
// Quietest slice worth reading (root mean square), so room noise gives no pitch
const MIN_RMS = 0.01;
// How clearly a slice must repeat itself to count as voiced (lower is stricter)
const THRESHOLD = 0.15;
// A reading this many steps (semitones) away from its neighbours is a slip, such as a jump of an octave, and is dropped
const SLIP_STEPS = 7;
// A change at the end of at least this many steps counts as falling or rising
const END_STEPS = 1.5;
// Fewest voiced readings for a range
const MIN_FOR_RANGE = 5;
// Fewest voiced readings for an ending
const MIN_FOR_END = 6;
// Readings at the end that make up the ending
const END_READINGS = 3;

// The pitch of one slice of sound, in hertz, or null when it is silent or unvoiced (the YIN method: find the shortest delay at which the slice best repeats itself)
export function detectPitch(samples: ArrayLike<number>, sampleRate: number): number | null {
  // A sample, treating anything missing as silence
  const at = (index: number) => samples[index] ?? 0;
  // How loud the slice is
  let energy = 0;
  // Add up the squares
  for (let index = 0; index < samples.length; index++) energy += at(index) ** 2;
  // Too quiet to read
  if (Math.sqrt(energy / Math.max(1, samples.length)) < MIN_RMS) return null;
  // The window compared against itself: half the slice
  const size = Math.floor(samples.length / 2);
  // Shortest and longest delays worth trying, from the highest and lowest pitch
  const [shortest, longest] = [Math.max(2, Math.floor(sampleRate / PITCH_MAX_HZ)), Math.min(size - 1, Math.ceil(sampleRate / PITCH_MIN_HZ))];
  // A slice too short for the lowest pitch
  if (longest <= shortest) return null;
  // How different the slice is from itself at each delay, scaled by the running average (so the measure starts at 1)
  const scaled = new Float64Array(longest + 2);
  // Nothing differs at no delay
  scaled[0] = 1;
  // The running total of differences
  let running = 0;
  // Each delay
  for (let lag = 1; lag <= longest + 1; lag++) {
    // The difference at this delay
    let difference = 0;
    // Over the window
    for (let index = 0; index < size; index++) difference += (at(index) - at(index + lag)) ** 2;
    // Add it to the running total
    running += difference;
    // Scale it
    scaled[lag] = running === 0 ? 1 : (difference * lag) / running;
  }
  // The first delay that repeats clearly enough, moved on to the bottom of its dip
  let best = -1;
  // Search from the shortest delay
  for (let lag = shortest; lag <= longest; lag++) {
    // Not clear enough yet
    if ((scaled[lag] ?? 1) >= THRESHOLD) continue;
    // Walk down to the bottom of the dip
    while (lag + 1 <= longest && (scaled[lag + 1] ?? 1) < (scaled[lag] ?? 1)) lag += 1;
    // Keep it
    best = lag;
    // Done
    break;
  }
  // Nothing repeats: unvoiced (a breath, a hiss, noise)
  if (best === -1) return null;
  // The values either side, to place the dip between samples
  const [before, middle, after] = [scaled[best - 1] ?? 1, scaled[best] ?? 1, scaled[best + 1] ?? 1];
  // The curve through the three points
  const bend = before - 2 * middle + after;
  // The dip's true position, a fraction of a sample from the best delay
  const shift = bend === 0 ? 0 : (before - after) / (2 * bend);
  // The pitch
  const hertz = sampleRate / (best + shift);
  // Only pitches a speaking voice can have, to one decimal
  return hertz >= PITCH_MIN_HZ && hertz <= PITCH_MAX_HZ ? Math.round(hertz * 10) / 10 : null;
}

// The middle of a list of numbers
export function median(values: ReadonlyArray<number>): number {
  // In order
  const sorted = [...values].sort((a, b) => a - b);
  // The middle one (or the average of the two in the middle)
  const middle = Math.floor(sorted.length / 2);
  // Hand it back
  return sorted.length % 2 === 1 ? (sorted[middle] ?? 0) : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

// A value at a share of the way through a sorted list
function percentile(sorted: ReadonlyArray<number>, share: number): number {
  // The nearest place
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(share * (sorted.length - 1))))] ?? 0;
}

// The speaker's usual pitch across some readings: the middle of the voiced ones, or null when there are none
export function usualPitch(readings: ReadonlyArray<number | null>): number | null {
  // The voiced readings
  const voiced = readings.filter((reading): reading is number => reading !== null);
  // Their middle
  return voiced.length > 0 ? median(voiced) : null;
}

// Readings as steps (semitones) above or below the speaker's usual pitch, with slips such as octave jumps dropped (null where unvoiced)
export function toSteps(readings: ReadonlyArray<number | null>, usual: number): (number | null)[] {
  // Each reading in steps
  const steps = readings.map((reading) => (reading === null ? null : 12 * Math.log2(reading / usual)));
  // The voiced ones, for judging slips
  const voiced = steps.filter((step): step is number => step !== null);
  // Their middle
  const middle = voiced.length > 0 ? median(voiced) : 0;
  // Drop readings far from the middle (a detector slip, not the voice)
  return steps.map((step) => (step === null || Math.abs(step - middle) > SLIP_STEPS ? null : Math.round(step * 10) / 10));
}

// How a take ended
export type PitchEnd = "fall" | "level" | "rise";

// What a run of pitch readings shows
export interface PitchSummary {
  // How many readings were voiced
  voiced: number;
  // The range from low to high, in whole steps (the 10th to the 90th percentile), or null with too few readings
  rangeSteps: number | null;
  // How it ended, or null with too few readings
  end: PitchEnd | null;
}

// Sum up a take's pitch readings, against the speaker's usual pitch (their own across the drill, so every voice reads the same way)
export function summarizePitch(readings: ReadonlyArray<number | null>, usual: number | null = usualPitch(readings)): PitchSummary {
  // No voice at all
  if (usual === null) return { voiced: 0, rangeSteps: null, end: null };
  // The voiced readings in steps, slips dropped
  const steps = toSteps(readings, usual).filter((step): step is number => step !== null);
  // In order of height, for the range
  const sorted = [...steps].sort((a, b) => a - b);
  // The range
  const rangeSteps = steps.length >= MIN_FOR_RANGE ? Math.round(percentile(sorted, 0.9) - percentile(sorted, 0.1)) : null;
  // How it ended (null with too few readings)
  return { voiced: steps.length, rangeSteps, end: endOfSteps(steps) };
}

// How a run of voiced readings in steps ended: the last few against the middle of the rest, falling or rising by at least END_STEPS, otherwise level (null with too few readings); shared by a whole take and each phrase (pitch in your words)
export function endOfSteps(steps: ReadonlyArray<number>): PitchEnd | null {
  // Too few for an ending
  if (steps.length < MIN_FOR_END) return null;
  // The last few readings against the rest
  const change = steps.slice(-END_READINGS).reduce((sum, step) => sum + step, 0) / END_READINGS - median(steps.slice(0, -END_READINGS));
  // Falling, rising, or level
  return change <= -END_STEPS ? "fall" : change >= END_STEPS ? "rise" : "level";
}

// Fewer readings for drawing a long take: each group's middle voiced reading, or null when under a third of the group was voiced
export function thinReadings(readings: ReadonlyArray<number | null>, most: number): (number | null)[] {
  // Short enough already
  if (readings.length <= most) return [...readings];
  // Readings per group
  const size = Math.ceil(readings.length / most);
  // The thinned readings
  const thinned: (number | null)[] = [];
  // Each group
  for (let start = 0; start < readings.length; start += size) {
    // Its voiced readings
    const voiced = readings.slice(start, start + size).filter((reading): reading is number => reading !== null);
    // Their middle, when enough were voiced
    thinned.push(voiced.length * 3 >= size ? median(voiced) : null);
  }
  // Hand them back
  return thinned;
}
