// Pauses: found from the loudness readings taken ten times a second while recording, on the device

// What the pauses in a recording looked like
export interface PauseSummary {
  // Silences of at least PAUSE_MIN_SECONDS between the first and last word
  count: number;
  // Average pause length in seconds, to two decimals
  averageSeconds: number;
  // Longest pause in seconds, to two decimals
  longestSeconds: number;
  // Whole-number percent of the time from first word to last that was spent speaking
  speakingPercent: number;
}

// The shortest silence that counts as a pause, in seconds (shorter gaps are breaths between words)
const PAUSE_MIN_SECONDS = 0.6;
// Quietest level that can ever count as speech, so room noise is never mistaken for it
const FLOOR = 0.02;
// Silence is anything under this share of the speaker's own typical loudness
const SHARE_OF_SPEECH = 0.3;

// Round to two decimals
function round2(value: number): number {
  // Shift, round, shift back
  return Math.round(value * 100) / 100;
}

// The loudness below which a reading is silence, judged against the speaker's own typical loudness (the 80th percentile reading)
export function speechThreshold(levels: ReadonlyArray<number>): number {
  // The readings in order
  const sorted = [...levels].sort((a, b) => a - b);
  // The reading at the 80th percentile
  const typical = sorted[Math.floor(0.8 * Math.max(0, sorted.length - 1))] ?? 0;
  // Below this is silence
  return Math.max(FLOOR, typical * SHARE_OF_SPEECH);
}

// Which readings are speech, judged against the speaker's own typical loudness
function speechMask(levels: ReadonlyArray<number>): boolean[] {
  // Below this is silence
  const threshold = speechThreshold(levels);
  // Mark each reading
  return levels.map((level) => level >= threshold);
}

// Seconds of silence before the first word (all of it, if nothing was said)
export function leadingSilenceSeconds(levels: ReadonlyArray<number>, tickMs: number): number {
  // The first speech reading
  const first = speechMask(levels).indexOf(true);
  // Convert readings to seconds, to two decimals
  return round2(((first === -1 ? levels.length : first) * tickMs) / 1000);
}

// One stretch of speech between pauses: where it starts and ends (reading positions, the end included) and its speech readings
export interface SpeechStretch {
  // The first speech reading
  start: number;
  // The last speech reading
  end: number;
  // The speech readings in it (short silences inside left out)
  levels: number[];
}

// The stretches of speech between pauses of at least PAUSE_MIN_SECONDS (used for fading ends and, with pitch, for how each phrase ended; decision 81)
export function speechStretches(levels: ReadonlyArray<number>, tickMs: number): SpeechStretch[] {
  // Which readings are speech
  const speaking = speechMask(levels);
  // Readings that make a pause
  const pauseTicks = Math.round((PAUSE_MIN_SECONDS * 1000) / tickMs);
  // The stretches found
  const stretches: SpeechStretch[] = [];
  // The stretch being collected
  let current: SpeechStretch | null = null;
  // Silent readings since the last speech
  let silent = 0;
  // Walk every reading
  levels.forEach((level, index) => {
    // Silence is counted
    if (!speaking[index]) {
      // One more silent reading
      silent += 1;
      // Next reading
      return;
    }
    // A long enough silence before this speech closes the previous stretch
    if (silent >= pauseTicks && current) {
      // Keep it
      stretches.push(current);
      // Start afresh
      current = null;
    }
    // The stretch this reading joins
    current ??= { start: index, end: index, levels: [] };
    // Add the reading
    current.levels.push(level);
    // It now ends here
    current.end = index;
    // Reset the silence count
    silent = 0;
  });
  // Close the last stretch
  if (current) stretches.push(current);
  // Hand them back
  return stretches;
}

// Stretches of speech (between pauses) whose last 0.3 seconds are much quieter than the stretch as a whole
export function fadingEnds(levels: ReadonlyArray<number>, tickMs: number): { stretches: number; faded: number } {
  // Readings at the end of a stretch that are compared
  const endTicks = Math.max(1, Math.round(300 / tickMs));
  // Shortest stretch worth judging: one second
  const minTicks = Math.round(1000 / tickMs);
  // Average of a list of readings
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  // Only stretches long enough to judge
  const judged = speechStretches(levels, tickMs).map((stretch) => stretch.levels).filter((stretch) => stretch.length >= minTicks);
  // A stretch fades when its end is under 60% of its own average
  const faded = judged.filter((stretch) => mean(stretch.slice(-endTicks)) < 0.6 * mean(stretch)).length;
  // Hand back the counts
  return { stretches: judged.length, faded };
}

// Find the pauses in a list of loudness readings taken every tickMs milliseconds
export function findPauses(levels: ReadonlyArray<number>, tickMs: number): PauseSummary {
  // Which readings are speech
  const speaking = speechMask(levels);
  // First and last speech readings
  const first = speaking.indexOf(true);
  // (last)
  const last = speaking.lastIndexOf(true);
  // No speech at all
  if (first === -1) return { count: 0, averageSeconds: 0, longestSeconds: 0, speakingPercent: 0 };
  // Lengths of silent runs between the first and last word, in readings
  const runs: number[] = [];
  // Length of the current silent run
  let silent = 0;
  // Walk the readings between first and last word
  for (let index = first; index <= last; index++) {
    // Speech ends a silent run
    if (speaking[index]) {
      // Keep the run if there was one
      if (silent > 0) runs.push(silent);
      // Start again
      silent = 0;
    }
    // Silence extends it
    else silent += 1;
  }
  // Readings needed for a pause
  const minTicks = Math.round((PAUSE_MIN_SECONDS * 1000) / tickMs);
  // Pauses, in seconds
  const pauses = runs.filter((length) => length >= minTicks).map((length) => (length * tickMs) / 1000);
  // Speech readings from first word to last
  const speechTicks = speaking.slice(first, last + 1).filter(Boolean).length;
  // Hand back the summary
  return {
    // How many
    count: pauses.length,
    // Average length
    averageSeconds: pauses.length ? round2(pauses.reduce((sum, length) => sum + length, 0) / pauses.length) : 0,
    // Longest
    longestSeconds: pauses.length ? round2(Math.max(...pauses)) : 0,
    // Share of time spent speaking
    speakingPercent: Math.round((speechTicks / (last - first + 1)) * 100),
  };
}

// For a pause drill: the pauses taken against the marks in the passage
export function pauseDrillSentence(taken: number, marks: number): string {
  // The marks, said the same way every time
  const ending = `the passage has ${marks} pause marks.`;
  // None
  if (taken === 0) return `You did not pause; ${ending}`;
  // One
  if (taken === 1) return `You paused once; ${ending}`;
  // Several
  return `You paused ${taken} times; ${ending}`;
}

