// A take's fingerprint (decision 115): the whole take as one strip of speech stretches (taller where louder), with ticks where pause words were said, dots at the pitch peaks and marks under pauses that split a sentence, and one plain headline from a few rules. A tiny copy (32 loudness levels and the pause words' places) is kept on the session when it is saved, so History can draw each take's shape without reading its readings (decisions 98 and 99). Pure

// Load the speech threshold
import { speechThreshold } from "@/core/pauses";
// Load the pause-word marker
import { fillerPieces } from "@/core/fillers";
// Load the phone's usual word-time lag
import { DEFAULT_LAG } from "@/core/wordAlign";
// Load the spacing of the readings
import { LOUDNESS_TICK_MS } from "@/core/recordingRules";
// Load the tiny copy's shape and sizes
import { MINI_BINS, MINI_LEVELS, type MiniFingerprint } from "@/core/miniFingerprint";

// The silence that splits two stretches on the strip, in seconds
const SPLIT_SECONDS = 0.3;
// A longer split for a take that would otherwise have too many stretches to draw
const LONG_SPLIT_SECONDS = 0.6;
// The most stretches drawn before the longer split is used
const MOST_STRETCHES = 48;
// Shortest stretch kept, in seconds (a cough or a click is shorter)
const SHORTEST = 0.2;
// The last stretch counts as quieter when it is under this share of the take's usual stretch
const QUIETER_END = 0.75;
// The most pause words kept in the tiny copy
const MINI_UMS = 16;

// One stretch of speech on the strip
export interface StripStretch {
  // When it started, in seconds
  start: number;
  // When it ended, in seconds
  end: number;
  // How loud it was against the take's loudest stretch, 0 to 1
  level: number;
}

// The whole fingerprint
export interface Fingerprint {
  // The take's length, in seconds
  duration: number;
  // The stretches of speech
  stretches: StripStretch[];
  // When pause words were said, in seconds
  ums: number[];
  // When the pitch peaks came, in seconds
  peaks: number[];
  // Pauses that split a sentence: start and end, in seconds
  midPauses: Array<{ start: number; end: number }>;
  // The plain headline
  headline: string;
  // A second line, when the volume fell away at the end (or null)
  note: string | null;
}

// The stretches of speech in some loudness readings, split at silences of at least some seconds
function stretchesAt(levels: ReadonlyArray<number>, tickMs: number, split: number): Array<{ start: number; end: number; mean: number }> {
  // Below this is silence
  const threshold = speechThreshold(levels);
  // Seconds per reading
  const tick = tickMs / 1000;
  // Readings that make a split
  const splitTicks = Math.max(1, Math.round(split / tick));
  // The stretches
  const found: Array<{ start: number; end: number; sum: number; count: number }> = [];
  // Silent readings since the last speech
  let silent = Infinity;
  // Walk the readings
  levels.forEach((level, index) => {
    // Silence is counted
    if (level < threshold) {
      // One more
      silent += 1;
      // Next
      return;
    }
    // The stretch it joins, or a new one after a split
    const last = found.at(-1);
    // A new stretch
    if (!last || silent >= splitTicks) found.push({ start: index * tick, end: (index + 1) * tick, sum: level, count: 1 });
    // Or this one grows
    else {
      // To here
      last.end = (index + 1) * tick;
      // With its loudness
      last.sum += level;
      // Counted
      last.count += 1;
    }
    // No silence now
    silent = 0;
  });
  // Long enough ones, with their average loudness
  return found.filter((stretch) => stretch.end - stretch.start >= SHORTEST - 1e-9).map((stretch) => ({ start: Math.round(stretch.start * 10) / 10, end: Math.round(stretch.end * 10) / 10, mean: stretch.sum / stretch.count }));
}

// The strip's stretches: split at short silences, or longer ones on a take with too many
export function stripStretches(levels: ReadonlyArray<number>, tickMs: number): StripStretch[] {
  // Split at short silences first
  let raw = stretchesAt(levels, tickMs, SPLIT_SECONDS);
  // Too many to draw: split only at longer ones
  if (raw.length > MOST_STRETCHES) raw = stretchesAt(levels, tickMs, LONG_SPLIT_SECONDS);
  // The loudest
  const loudest = Math.max(0, ...raw.map((stretch) => stretch.mean));
  // Each against it
  return raw.map((stretch) => ({ start: stretch.start, end: stretch.end, level: loudest > 0 ? Math.round((stretch.mean / loudest) * 100) / 100 : 0 }));
}

// Which third of the take a moment falls in, in words
function thirdName(at: number, duration: number): string {
  // The share of the way through
  const share = duration > 0 ? at / duration : 0;
  // The start
  if (share < 1 / 3) return "at the start";
  // The end
  if (share > 2 / 3) return "near the end";
  // The middle
  return "in the middle";
}

// The headline: how the pauses went, then where the pause words came (two parts at most), in plain words
export function fingerprintHeadline(input: { betweenPauses: number; midPauses: number; ums: ReadonlyArray<number>; duration: number }): string {
  // The parts
  const parts: string[] = [];
  // The pauses: split sentences, calm, or few
  if (input.midPauses >= 2) parts.push(`${input.midPauses} pauses split a sentence`);
  // (one)
  else if (input.midPauses === 1 && input.betweenPauses >= 2) parts.push("pauses between thoughts, one mid-sentence");
  // (calm)
  else if (input.betweenPauses >= 3) parts.push("pauses between thoughts");
  // (few)
  else parts.push(input.duration >= 30 ? "few pauses" : "a short take");
  // The pause words: none, or where most came
  if (input.ums.length === 0) parts.push("no pause words");
  // A handful: where they bunched
  else {
    // How many in each third
    const thirds = [0, 0, 0];
    // Count each
    for (const at of input.ums) thirds[Math.min(2, Math.floor((at / Math.max(1, input.duration)) * 3))]! += 1;
    // The busiest third
    const most = Math.max(...thirds);
    // Bunched when one third has more than half of them
    if (input.ums.length >= 3 && most * 2 > input.ums.length) parts.push(`pause words bunched ${thirdName(((thirds.indexOf(most) + 0.5) / 3) * input.duration, input.duration)}`);
    // Otherwise how many
    else parts.push(`${input.ums.length} pause ${input.ums.length === 1 ? "word" : "words"}`);
  }
  // Joined, the first letter capitalised, with a full stop
  const line = parts.join(", ");
  // Hand it back
  return `${line.charAt(0).toUpperCase()}${line.slice(1)}.`;
}

// The whole fingerprint of a take
export function takeFingerprint(input: { levels: ReadonlyArray<number>; tickMs: number; duration: number; ums: ReadonlyArray<number>; peaks: ReadonlyArray<number>; midPauses: ReadonlyArray<{ start: number; end: number }>; betweenPauses: number }): Fingerprint | null {
  // The stretches
  const stretches = stripStretches(input.levels, input.tickMs);
  // Nothing said
  if (stretches.length === 0) return null;
  // The usual stretch loudness (the middle one)
  const sorted = stretches.map((stretch) => stretch.level).sort((a, b) => a - b);
  // Its middle
  const usual = sorted[Math.floor(sorted.length / 2)]!;
  // The last stretch, when there are a few
  const last = stretches.length >= 3 ? stretches.at(-1)! : null;
  // Whether the volume fell away at the end
  const fell = last !== null && last.level < usual * QUIETER_END;
  // The fingerprint
  return {
    // Its length
    duration: Math.max(input.duration, stretches.at(-1)!.end),
    // The stretches
    stretches,
    // The pause words
    ums: [...input.ums],
    // The peaks
    peaks: [...input.peaks],
    // The split sentences
    midPauses: [...input.midPauses],
    // The headline
    headline: fingerprintHeadline({ betweenPauses: input.betweenPauses, midPauses: input.midPauses.length, ums: input.ums, duration: input.duration }),
    // The volume at the end
    note: fell ? "The last stretch is lighter: your volume dropped as you finished." : null,
  };
}

// The tiny copy for History: the loudness of speech in 32 equal parts (0 silent, 1 to 9 by loudness against the loudest part) and the parts with pause words; null for a take with no readings
export function miniFingerprint(levels: ReadonlyArray<number>, tickMs: number, umTimes: ReadonlyArray<number>): MiniFingerprint | null {
  // Nothing recorded
  if (levels.length < MINI_BINS) return null;
  // Below this is silence
  const threshold = speechThreshold(levels);
  // Readings per part
  const per = levels.length / MINI_BINS;
  // Each part's speech loudness (0 when mostly silent)
  const raw = Array.from({ length: MINI_BINS }, (_, bin) => {
    // Its readings
    const part = levels.slice(Math.floor(bin * per), Math.max(Math.floor(bin * per) + 1, Math.floor((bin + 1) * per)));
    // The speech among them
    const speech = part.filter((level) => level >= threshold);
    // Mostly silent: nothing
    if (speech.length * 2 < part.length) return 0;
    // The speech's average
    return speech.reduce((sum, level) => sum + level, 0) / speech.length;
  });
  // The loudest part
  const loudest = Math.max(0, ...raw);
  // Nothing said
  if (loudest === 0) return null;
  // Seconds per part
  const binSeconds = (levels.length * tickMs) / 1000 / MINI_BINS;
  // The parts with pause words, each once
  const ums = [...new Set(umTimes.map((at) => Math.min(MINI_BINS - 1, Math.max(0, Math.floor(at / binSeconds)))))].slice(0, MINI_UMS);
  // The copy
  return { v: 1, bins: raw.map((value) => (value === 0 ? 0 : Math.max(1, Math.round((value / loudest) * MINI_LEVELS)))), ums };
}

// The tiny copy for a saved take, from its loudness and the pause words in its transcript (each placed at its first-heard time less the phone's usual lag; decision 111); null when there is nothing to draw
export function sessionMiniFingerprint(session: { loudness?: ReadonlyArray<number>; transcript: string; spokenTimes?: ReadonlyArray<number> }): MiniFingerprint | null {
  // Which pieces of the transcript are pause words
  const flags = fillerPieces(session.transcript);
  // Their moments, where a time was saved, a pause-word phrase once
  const ums = flags.flatMap((filler, index) => (filler && !flags[index - 1] && typeof session.spokenTimes?.[index] === "number" ? [Math.max(0, session.spokenTimes[index]! - DEFAULT_LAG)] : []));
  // The copy
  return miniFingerprint(session.loudness ?? [], LOUDNESS_TICK_MS, ums);
}
