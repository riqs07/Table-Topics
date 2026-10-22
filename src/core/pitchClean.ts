// Pitch readings made ready to draw against words (decision 111): slips folded back, jitter smoothed, tiny gaps filled, then turned into steps around the speaker's usual pitch and drawn as a smooth path. Pure, so every rule is tested on made-up readings

// Load the middle-of-a-list helper and the usual-pitch rule
import { median, usualPitch } from "@/core/pitch";

// Readings on each side looked at when judging an octave slip
const OCTAVE_SIDE = 5;
// A reading this many times its neighbours' middle (or this share of it) is an octave slip and is folded back
const OCTAVE_HIGH = { low: 1.8, high: 2.25 } as const;
// (and the share for a reading an octave too low)
const OCTAVE_LOW = { low: 0.44, high: 0.56 } as const;
// Readings on each side in the median filter (five readings, half a second, in all)
const MEDIAN_SIDE = 2;
// Longest gap filled in, in milliseconds (shorter than about 150 ms: one missing reading at ten a second)
export const FILL_GAP_MS = 150;

// One point of a curve: across (any unit) and up (higher pitch is a bigger number)
export interface CurvePoint {
  // Across the picture
  x: number;
  // Up in steps (the drawing turns it into pixels)
  y: number;
}

// Fold back octave slips: a reading about twice (or half) the middle of its voiced neighbours is the detector catching an overtone, so it is halved (or doubled)
export function foldOctaves(readings: ReadonlyArray<number | null>): (number | null)[] {
  // Each reading against its neighbours
  return readings.map((reading, index) => {
    // Nothing to fold
    if (reading === null) return null;
    // The voiced neighbours on both sides, not the reading itself
    const around = [...readings.slice(Math.max(0, index - OCTAVE_SIDE), index), ...readings.slice(index + 1, index + 1 + OCTAVE_SIDE)].filter((value): value is number => value !== null);
    // Too few neighbours to judge by
    if (around.length < 2) return reading;
    // How far it sits from them
    const ratio = reading / median(around);
    // An octave too high: halve it
    if (ratio >= OCTAVE_HIGH.low && ratio <= OCTAVE_HIGH.high) return reading / 2;
    // An octave too low: double it
    if (ratio >= OCTAVE_LOW.low && ratio <= OCTAVE_LOW.high) return reading * 2;
    // Otherwise as read
    return reading;
  });
}

// A running median over the voiced readings, so one jumpy reading cannot make a spike; unvoiced readings stay unvoiced
export function medianFilter(readings: ReadonlyArray<number | null>, side = MEDIAN_SIDE): (number | null)[] {
  // Each reading
  return readings.map((reading, index) => {
    // Silence stays silence
    if (reading === null) return null;
    // The voiced readings in the window
    const window = readings.slice(Math.max(0, index - side), index + side + 1).filter((value): value is number => value !== null);
    // Their middle
    return median(window);
  });
}

// Drop voiced runs of a single reading: a lone reading between silences is a click or noise, not a voice
export function dropLoneReadings(readings: ReadonlyArray<number | null>): (number | null)[] {
  // Each reading, kept only with a voiced neighbour
  return readings.map((reading, index) => (reading !== null && (readings[index - 1] ?? null) === null && (readings[index + 1] ?? null) === null ? null : reading));
}

// Fill gaps of at most a few readings between voiced readings by a straight line; longer gaps stay as breaks (the voice really stopped)
export function fillShortGaps(readings: ReadonlyArray<number | null>, tickMs: number, longestMs = FILL_GAP_MS): (number | null)[] {
  // The most readings a filled gap can have
  const most = Math.floor(longestMs / tickMs);
  // A copy to fill
  const filled = [...readings];
  // The last voiced reading seen
  let last = -1;
  // Walk the readings
  readings.forEach((reading, index) => {
    // Only voiced readings close a gap
    if (reading === null) return;
    // The gap behind it
    const gap = index - last - 1;
    // A short gap after an earlier voiced reading: fill it
    if (last >= 0 && gap > 0 && gap <= most) {
      // The reading before the gap
      const before = readings[last] as number;
      // Each missing reading on the line between them
      for (let step = 1; step <= gap; step++) filled[last + step] = before + ((reading - before) * step) / (gap + 1);
    }
    // This is now the last voiced reading
    last = index;
  });
  // Hand them back
  return filled;
}

// The whole cleaning, in order: lone readings dropped, octave slips folded, a running median, then short gaps filled
export function cleanPitch(readings: ReadonlyArray<number | null>, tickMs: number): (number | null)[] {
  // Each step feeds the next
  return fillShortGaps(medianFilter(foldOctaves(dropLoneReadings(readings))), tickMs);
}

// Readings as steps (semitones) above or below a usual pitch, to a tenth (null where unvoiced)
export function semitonesFrom(readings: ReadonlyArray<number | null>, usualHz: number): (number | null)[] {
  // Each reading
  return readings.map((reading) => (reading === null || reading <= 0 ? null : Math.round(12 * Math.log2(reading / usualHz) * 10) / 10));
}

// A take's readings cleaned and in steps around its own usual pitch, with that pitch (null when nothing was voiced)
export function cleanSteps(readings: ReadonlyArray<number | null>, tickMs: number): { steps: (number | null)[]; usualHz: number | null } {
  // Cleaned
  const cleaned = cleanPitch(readings, tickMs);
  // The usual pitch of what is left
  const usualHz = usualPitch(cleaned);
  // In steps, or nothing
  return { steps: usualHz === null ? cleaned.map(() => null) : semitonesFrom(cleaned, usualHz), usualHz };
}

// The spread of the smoothing for drawing, in readings (0.2 s at ten readings a second)
const DRAW_SIGMA = 2;
// Readings on each side the smoothing reaches
const DRAW_SIDE = 5;

// The cleaned readings smoothed for drawing (decision 114): a gentle bell-shaped average over each reading's voiced neighbours within the same voiced run, so a curve flows like a voice instead of stepping from word to word; breaks stay breaks. Word pitches and peaks keep using the cleaned readings, not these
export function smoothForDrawing(steps: ReadonlyArray<number | null>, sigma = DRAW_SIGMA, side = DRAW_SIDE): (number | null)[] {
  // The weight at each distance
  const weights = Array.from({ length: side + 1 }, (_, distance) => Math.exp(-(distance * distance) / (2 * sigma * sigma)));
  // Each reading
  return steps.map((step, index) => {
    // A break stays a break
    if (step === null) return null;
    // The running totals
    let [sum, weight] = [step * weights[0]!, weights[0]!];
    // Outwards on both sides, stopping at a break
    for (const direction of [-1, 1]) {
      // Each distance
      for (let distance = 1; distance <= side; distance++) {
        // The neighbour
        const near = steps[index + direction * distance];
        // A break or the edge ends this side
        if (near === null || near === undefined) break;
        // Added with its weight
        sum += near * weights[distance]!;
        // (and its weight)
        weight += weights[distance]!;
      }
    }
    // The average, to a tenth
    return Math.round((sum / weight) * 10) / 10;
  });
}

// A number to one decimal, for short path text
function short(value: number): string {
  // Rounded, without a trailing ".0"
  return String(Math.round(value * 10) / 10);
}

// A smooth path through runs of points (a Catmull-Rom spline as cubic Béziers), broken where a point is missing; a run of one point is a dot. The points are already in picture units
export function smoothPath(points: ReadonlyArray<CurvePoint | null>): string {
  // The runs of points without a gap
  const runs: CurvePoint[][] = [];
  // The run being built
  let run: CurvePoint[] = [];
  // Walk the points
  for (const point of points) {
    // A gap closes the run
    if (point === null) {
      // Keep it when it has a point
      if (run.length > 0) runs.push(run);
      // Start afresh
      run = [];
      // Next point
      continue;
    }
    // Add the point
    run.push(point);
  }
  // The last run
  if (run.length > 0) runs.push(run);
  // Each run as path text
  return runs.map((line) => {
    // The first point
    const first = line[0]!;
    // A single point: a dot drawn by the round line end
    if (line.length === 1) return `M${short(first.x)} ${short(first.y)}h0.1`;
    // Start at the first point
    const parts = [`M${short(first.x)} ${short(first.y)}`];
    // Each piece between two points, bent by the points either side
    for (let index = 0; index < line.length - 1; index++) {
      // The point before, the two ends, and the point after (the ends repeat at the edges)
      const [before, from, to, after] = [line[index - 1] ?? line[index]!, line[index]!, line[index + 1]!, line[index + 2] ?? line[index + 1]!];
      // The two handles
      const [one, two] = [{ x: from.x + (to.x - before.x) / 6, y: from.y + (to.y - before.y) / 6 }, { x: to.x - (after.x - from.x) / 6, y: to.y - (after.y - from.y) / 6 }];
      // The curve piece
      parts.push(`C${short(one.x)} ${short(one.y)} ${short(two.x)} ${short(two.y)} ${short(to.x)} ${short(to.y)}`);
    }
    // The run's text
    return parts.join("");
  }).join("");
}
