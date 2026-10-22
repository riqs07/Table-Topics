// When each word was said, for drawing pitch under the words (decision 111). The deeper analysis's words carry exact start and end times; without it the phone's word times are when a word was first heard, which runs late, so they are moved back by an estimated lag and snapped to where the loudness says the voice was. The result says which it is, so the page can say "rough" quietly

// Load the speech threshold, to find where the voice was
import { speechThreshold } from "@/core/pauses";
// Load the record type for the server's words
import type { ServerWord } from "@/data/records";

// How sure the times are: from the transcription service, or worked out on the phone
export type AlignPrecision = "exact" | "rough";

// One word placed in time
export interface AlignedWord {
  // The word as shown (with any punctuation the service gave it)
  text: string;
  // The word cleaned to lower-case letters and apostrophes
  w: string;
  // When it started, in seconds
  start: number;
  // When it ended, in seconds
  end: number;
  // Its position in the list it came from (the transcript's pieces, the script's numbered words, or the server's words)
  ref: number;
}

// A take's words placed in time
export interface Alignment {
  // The words, in order
  words: AlignedWord[];
  // Exact (the service's times) or rough (worked out on the phone)
  precision: AlignPrecision;
  // Whether the words carry punctuation, so phrases can be split on it
  punctuated: boolean;
}

// One stretch where the voice was, in seconds
export interface VoicedSpan {
  // Start
  start: number;
  // End
  end: number;
}

// The usual lag between saying a word and the phone first showing it, when it cannot be measured, in seconds
export const DEFAULT_LAG = 0.6;
// The most the lag is taken to be, in seconds
const MOST_LAG = 1.5;
// Silences shorter than this inside the voice are joined over, in seconds
const JOIN_GAP = 0.15;
// How far forward a word may be moved to reach the voice, in seconds
const SNAP_REACH = 0.8;
// Shortest time a word is given, in seconds
const MIN_WORD = 0.08;
// Length given to a last word when nothing says where it ended, in seconds
const LAST_WORD = 0.4;
// Time a word heard alone is taken to last, before its first-heard time, in seconds
const WORD_TIME = 0.3;

// A word cleaned the way the analysis cleans it
export function cleanWord(piece: string): string {
  // Lower case, curly apostrophes straightened, everything but letters and apostrophes dropped
  return piece.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9']+/g, "");
}

// Where the voice was, from the loudness readings: stretches at or above the speaker's own speech level, short silences inside joined over
export function voicedSpans(levels: ReadonlyArray<number>, tickMs: number): VoicedSpan[] {
  // Nothing recorded
  if (levels.length === 0) return [];
  // Below this is silence
  const threshold = speechThreshold(levels);
  // Seconds per reading
  const tick = tickMs / 1000;
  // The stretches found
  const spans: VoicedSpan[] = [];
  // Walk the readings
  levels.forEach((level, index) => {
    // Silence adds nothing
    if (level < threshold) return;
    // The stretch so far
    const last = spans.at(-1);
    // Close to the last one: extend it
    if (last && index * tick - last.end <= JOIN_GAP + 1e-9) last.end = (index + 1) * tick;
    // Otherwise a new stretch
    else spans.push({ start: index * tick, end: (index + 1) * tick });
  });
  // Rounded to a hundredth
  return spans.map((span) => ({ start: Math.round(span.start * 100) / 100, end: Math.round(span.end * 100) / 100 }));
}

// The deeper analysis's words, with their exact times
export function alignFromServer(words: ReadonlyArray<ServerWord>): Alignment {
  // Each word that has letters, in order
  const placed = words.map((word, ref) => ({ text: word.text.trim(), w: word.w, start: word.s, end: Math.max(word.e, word.s + MIN_WORD), ref })).filter((word) => word.text !== "");
  // Exact and punctuated
  return { words: placed, precision: "exact", punctuated: true };
}

// The span that holds a moment, or the first span after it within reach, or null
function spanFor(spans: ReadonlyArray<VoicedSpan>, seconds: number): VoicedSpan | null {
  // The span it sits in, or the next one close enough
  return spans.find((span) => seconds >= span.start - 1e-9 && seconds < span.end) ?? spans.find((span) => span.start > seconds && span.start - seconds <= SNAP_REACH) ?? null;
}

// Rough start times from first-heard stamps: a stamp comes just after its words were said, so words stamped together are spread over the time before it (about a word's time each, never before the stamp before)
function spreadStamps(stamps: ReadonlyArray<number>): number[] {
  // The starts
  const starts: number[] = [];
  // Walk the groups of equal stamps
  let index = 0;
  // Each group
  while (index < stamps.length) {
    // The group's stamp
    const stamp = stamps[index]!;
    // How many words share it
    let count = 1;
    // Count them
    while (index + count < stamps.length && stamps[index + count] === stamp) count += 1;
    // When the group's words began: a word's time per word before the stamp, but not before the stamp before (after a pause the words were said just before their stamp)
    const from = Math.max(index > 0 ? stamps[index - 1]! : -Infinity, stamp - WORD_TIME * count);
    // Each word an equal share of the time between
    for (let place = 0; place < count; place++) starts.push(from + ((stamp - from) * place) / count);
    // Next group
    index += count;
  }
  // Hand them back
  return starts;
}

// Place words with first-heard stamps (null where a word was never heard): moved back by the lag, then each start snapped forward to the voice, each end where the next word starts or its voice stops
function placeHeard(entries: ReadonlyArray<{ text: string; ref: number; stamp: number }>, levels: ReadonlyArray<number>, tickMs: number): AlignedWord[] {
  // Nothing to place
  if (entries.length === 0) return [];
  // Where the voice was
  const spans = voicedSpans(levels, tickMs);
  // Rough starts from the stamps
  const spread = spreadStamps(entries.map((entry) => entry.stamp));
  // The lag: how far the first word's rough start sits after the voice first starts (a usual amount without loudness)
  const lag = spans.length > 0 ? Math.min(MOST_LAG, Math.max(0, spread[0]! - spans[0]!.start)) : DEFAULT_LAG;
  // Starts moved back by the lag, never before the take began
  const moved = spread.map((start) => Math.max(0, start - lag));
  // Snapped forward to the voice where it fell in a silence, and kept in order
  const starts: number[] = [];
  // Each start
  moved.forEach((start, index) => {
    // The span it belongs to
    const span = spans.length > 0 ? spanFor(spans, start) : null;
    // Snapped to the span's start when it fell before it
    const snapped = span && start < span.start ? span.start : start;
    // Never before the word before it (plus a sliver)
    starts.push(index > 0 ? Math.max(snapped, starts[index - 1]! + MIN_WORD) : snapped);
  });
  // Each word with its end
  return entries.map((entry, index) => {
    // Its start
    const start = Math.round(starts[index]! * 100) / 100;
    // The next word's start, if any
    const next = starts[index + 1];
    // The span its voice is in
    const span = spans.length > 0 ? spanFor(spans, start) : null;
    // Ends at the next word, or earlier where its voice stopped before that
    const end = Math.max(start + MIN_WORD, Math.min(next ?? Infinity, span ? span.end : start + LAST_WORD));
    // The word
    return { text: entry.text, w: cleanWord(entry.text), start, end: Math.round(end * 100) / 100, ref: entry.ref };
  });
}

// The phone's transcript with its first-heard word times (one time per space-separated piece, as saved), rough
export function alignFromDevice(transcript: string, spokenTimes: ReadonlyArray<number>, levels: ReadonlyArray<number>, tickMs: number): Alignment {
  // The pieces, as the times were counted
  const pieces = transcript.split(/\s+/).filter((piece) => piece !== "");
  // Each piece with a time
  const entries = pieces.flatMap((text, ref) => (typeof spokenTimes[ref] === "number" && cleanWord(text) !== "" ? [{ text, ref, stamp: spokenTimes[ref]! }] : []));
  // Placed
  return { words: placeHeard(entries, levels, tickMs), precision: "rough", punctuated: false };
}

// A known script's words with the time each was first read (null where never read), for Read aloud and lessons: only the words read are placed, rough
export function alignFromScript(words: ReadonlyArray<string>, scriptTimes: ReadonlyArray<number | null>, levels: ReadonlyArray<number>, tickMs: number): Alignment {
  // Each read word with its time, keeping its number in the script
  const entries = words.flatMap((text, ref) => (typeof scriptTimes[ref] === "number" ? [{ text, ref, stamp: scriptTimes[ref]! }] : []));
  // Placed (a script carries its own punctuation, so phrases can split on it)
  return { words: placeHeard(entries, levels, tickMs), precision: "rough", punctuated: words.some((word) => /[.,;:?!]$/.test(word)) };
}

// About how long a word takes to say, by its vowel groups (at least one)
function syllables(word: string): number {
  // Groups of vowels
  return Math.max(1, (cleanWord(word).match(/[aeiouy]+/g) ?? []).length);
}

// A short line said with no word times (a voice drill's take): its words spread across the voiced time in proportion to their length, rough
export function alignFromText(text: string, levels: ReadonlyArray<number>, tickMs: number, durationSec: number): Alignment {
  // The words
  const words = text.split(/\s+/).filter((piece) => cleanWord(piece) !== "");
  // Where the voice was, or the whole take when the loudness says nothing
  const spans = voicedSpans(levels, tickMs);
  // The voiced time (the whole take without loudness)
  const voiced = spans.length > 0 ? spans : [{ start: 0, end: Math.max(durationSec, 0.1) }];
  // Total voiced seconds
  const total = voiced.reduce((sum, span) => sum + span.end - span.start, 0);
  // Total weight
  const weight = words.reduce((sum, word) => sum + syllables(word), 0);
  // Turn a share of the voiced time into a moment
  const at = (share: number): number => {
    // Seconds of voice to go
    let left = share * total;
    // Walk the spans
    for (const span of voiced) {
      // Inside this one
      if (left <= span.end - span.start + 1e-9) return span.start + left;
      // Past it
      left -= span.end - span.start;
    }
    // The very end
    return voiced.at(-1)!.end;
  };
  // Running weight
  let before = 0;
  // Each word
  const placed = words.map((word, ref) => {
    // Its share of the time
    const [from, to] = [before / weight, (before + syllables(word)) / weight];
    // Move on
    before += syllables(word);
    // Placed
    return { text: word, w: cleanWord(word), start: Math.round(at(from) * 100) / 100, end: Math.round(at(to) * 100) / 100, ref };
  });
  // Rough, with the line's own punctuation
  return { words: placed, precision: "rough", punctuated: true };
}
