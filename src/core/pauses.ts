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

// Find the pauses in a list of loudness readings taken every tickMs milliseconds
export function findPauses(levels: ReadonlyArray<number>, tickMs: number): PauseSummary {
  // The speaker's typical loudness: the 80th percentile reading
  const sorted = [...levels].sort((a, b) => a - b);
  // (the reading at that position)
  const typical = sorted[Math.floor(0.8 * Math.max(0, sorted.length - 1))] ?? 0;
  // Below this is silence
  const threshold = Math.max(FLOOR, typical * SHARE_OF_SPEECH);
  // Which readings are speech
  const speaking = levels.map((level) => level >= threshold);
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

// One plain sentence about the pauses
export function pauseSentence(summary: PauseSummary): string {
  // The speaking share, said the same way every time
  const speaking = `speaking ${summary.speakingPercent}% of the time.`;
  // No pauses
  if (summary.count === 0) return `No pauses longer than ${PAUSE_MIN_SECONDS} seconds; ${speaking}`;
  // One pause
  if (summary.count === 1) return `1 pause, ${summary.averageSeconds.toFixed(1)} seconds long; ${speaking}`;
  // Several
  return `${summary.count} pauses, ${summary.averageSeconds.toFixed(1)} seconds on average; ${speaking}`;
}
