// Every chart, for a week of testing (decision 124): what each of the round-two charts draws from one take (a voice line, a flow ribbon, a pace stretch, loudness shapes, sentence endings, today against your usual, emphasis in the words, the shape of the take, the voice range and progress on the focus). Each works only from what the take really has, and says nothing rather than guess. Pure, so every rule is tested

// Load the speech stretches the pauses come from
import { speechStretches } from "@/core/pauses";
// Load the middle and spread of a list
import { median, robustSpread } from "@/core/analysis/stats";
// Load the families of practice, so "usual" compares like with like
import { familyOf } from "@/core/analysis/families";
// Load the number for a focus
import { measureFor } from "@/core/focusMeasure";
// Load the bare word, for quoting
import { bare, type Phrase, type PhraseEnd } from "@/core/pitchPhrases";
// Load the pace lens's types
import type { PaceLens } from "@/core/lenses/paceLens";
// Load the record types
import type { SessionRecord } from "@/data/records";

// Silences shorter than this are never shown on the flow ribbon (decision 124: small gaps between words are left alone)
export const SHOWN_GAP_SECONDS = 1;
// Silences at least this long are long stops
export const LONG_STOP_SECONDS = 1.5;
// Points the voice line is simplified to, so it shows only movement a listener would hear
export const VOICE_LINE_POINTS = 8;
// Points each loudness shape is drawn with
export const SHAPE_POINTS = 12;
// Fewest earlier takes before "your usual" is drawn
export const USUAL_MIN_TAKES = 5;
// Earlier takes "your usual" is worked out from (the latest ones)
export const USUAL_TAKES = 10;
// Takes the progress line shows
export const PROGRESS_TAKES = 10;
// Fewest takes before a progress line is drawn
export const PROGRESS_MIN_TAKES = 3;
// Takes the "where you started" band is worked out from
const START_TAKES = 5;
// Seconds of speech before the shape of the take is drawn
export const SHAPE_MIN_SECONDS = 30;
// Words the emphasis chart shows at most
export const EMPHASIS_WORDS = 80;

// One piece of the flow ribbon, in seconds
export interface FlowPiece {
  // Speech, a long stop, a pause between thoughts, or a silence too ordinary to mark
  kind: "speech" | "stop" | "pause" | "gap";
  // When it starts
  start: number;
  // When it ends
  end: number;
}

// The flow ribbon
export interface FlowRibbon {
  // The pieces, in order
  pieces: FlowPiece[];
  // From the first speech to the last, in seconds
  from: number;
  // (end)
  to: number;
  // How many long stops and marked pauses
  counts: { stops: number; pauses: number };
  // One plain line
  line: string;
}

// The flow ribbon from the loudness readings, with the pauses that sat between thoughts (from the words) marked as good ones
export function flowRibbon(levels: ReadonlyArray<number>, tickMs: number, betweenThoughts: ReadonlyArray<{ start: number; end: number }>): FlowRibbon | null {
  // The stretches of speech
  const stretches = speechStretches(levels, tickMs);
  // Nothing said
  if (stretches.length === 0) return null;
  // Seconds for a reading
  const at = (tick: number) => Math.round(((tick * tickMs) / 1000) * 10) / 10;
  // The pieces built
  const pieces: FlowPiece[] = [];
  // Walk the stretches
  stretches.forEach((stretch) => {
    // Its start and end in seconds
    const [start, end] = [at(stretch.start), at(stretch.end + 1)];
    // The silence before it, when there is one
    const before = pieces.at(-1);
    // Too short to show: the speech before simply carries on
    if (before && start - before.end < SHOWN_GAP_SECONDS) {
      // Stretched to here
      before.end = end;
      // Next stretch
      return;
    }
    // A silence worth showing: whether a pause between thoughts falls inside it
    if (before) {
      // The silence
      const silence = { start: before.end, end: start };
      // Between thoughts when a word pause overlaps it
      const between = betweenThoughts.some((pause) => pause.start < silence.end + 0.3 && pause.end > silence.start - 0.3);
      // A long stop, a good pause, or an ordinary one
      pieces.push({ kind: between ? "pause" : silence.end - silence.start >= LONG_STOP_SECONDS ? "stop" : "gap", ...silence });
    }
    // The speech
    pieces.push({ kind: "speech", start, end });
  });
  // The counts
  const counts = { stops: pieces.filter((piece) => piece.kind === "stop").length, pauses: pieces.filter((piece) => piece.kind === "pause").length };
  // One line
  const line = counts.stops === 0 ? (counts.pauses > 0 ? `No long stops, and ${counts.pauses === 1 ? "a pause" : `${counts.pauses} pauses`} between thoughts.` : "No long stops.") : `${counts.stops === 1 ? "One long stop" : `${counts.stops} long stops`} (${LONG_STOP_SECONDS} seconds or more) that ${counts.stops === 1 ? "wasn’t" : "weren’t"} between thoughts.`;
  // The ribbon
  return { pieces, from: pieces[0]!.start, to: pieces.at(-1)!.end, counts, line };
}

// The longest stretch of the pace line outside the band
export interface PaceStretch {
  // Faster or slower than the band
  side: "fast" | "slow";
  // When it starts, in seconds
  from: number;
  // When it ends
  to: number;
}

// The longest run of the pace line outside its band, or null when it stayed inside
export function paceStretch(lens: PaceLens): PaceStretch | null {
  // The best run so far
  let best: PaceStretch | null = null;
  // The run being walked
  let run: PaceStretch | null = null;
  // Walk the points
  for (const point of lens.line) {
    // Which side
    const side: PaceStretch["side"] | null = point.wpm > lens.band.high ? "fast" : point.wpm < lens.band.low ? "slow" : null;
    // Inside, or the other side: the run ends
    if (side === null || (run !== null && run.side !== side)) run = null;
    // Outside: start or carry the run
    if (side !== null) run = run === null ? { side, from: point.t, to: point.t } : { side, from: run.from, to: point.t };
    // Longer than the best: keep it
    if (run !== null && (best === null || run.to - run.from > best.to - best.from)) best = run;
  }
  // The longest
  return best;
}

// The pace stretch in words, at its time
export function paceStretchLine(stretch: PaceStretch | null): string {
  // Stayed inside
  if (!stretch) return "You stayed inside your usual pace.";
  // Where
  const when = `${Math.floor(stretch.from / 60)}:${String(Math.floor(stretch.from % 60)).padStart(2, "0")}`;
  // The line
  return stretch.side === "fast" ? `Rushed most around ${when}.` : `Slowest around ${when}.`;
}

// The simplified voice line for one phrase
export interface VoiceLine {
  // The phrase it is drawn from
  phrase: Phrase;
  // The points across the phrase, 0 to 1 along it, in steps around the usual pitch
  points: Array<{ x: number; step: number }>;
  // Each word's place along the phrase, 0 to 1
  words: Array<{ text: string; x: number }>;
}

// The phrase worth drawing: the first statement that rose, else the longest phrase with a clear ending
export function voiceLinePhrase(phrases: ReadonlyArray<Phrase>): Phrase | null {
  // A statement that rose
  const rising = phrases.find((phrase) => phrase.risingStatement);
  // Otherwise the phrase with the most words and an ending
  return rising ?? [...phrases].filter((phrase) => phrase.ending !== null).sort((a, b) => b.words.length - a.words.length)[0] ?? null;
}

// The phrase's line, simplified to a few points (each the middle of its share of the voiced readings)
export function voiceLine(phrase: Phrase): VoiceLine | null {
  // The voiced readings, with their places
  const voiced = phrase.curve.flatMap((step, index) => (step === null ? [] : [{ index, step }]));
  // Too few
  if (voiced.length < VOICE_LINE_POINTS) return null;
  // The span in readings
  const span = Math.max(1, phrase.curve.length - 1);
  // One point per share
  const points = Array.from({ length: VOICE_LINE_POINTS }, (_, share) => {
    // This share's readings
    const part = voiced.slice(Math.floor((share * voiced.length) / VOICE_LINE_POINTS), Math.floor(((share + 1) * voiced.length) / VOICE_LINE_POINTS));
    // Its middle place and middle step
    return { x: part[Math.floor(part.length / 2)]!.index / span, step: median(part.map((reading) => reading.step)) ?? 0 };
  });
  // The phrase's length in seconds
  const length = Math.max(0.1, phrase.end - phrase.start);
  // Each word's place
  const words = phrase.words.map((word) => ({ text: word.text, x: Math.min(1, Math.max(0, (word.start - phrase.start) / length)) }));
  // The line
  return { phrase, points, words };
}

// One loudness shape: a stretch of speech
export interface LoudShape {
  // When it starts and ends, in seconds
  start: number;
  // (end)
  end: number;
  // Its loudness through the stretch, 0 to 1 against the take's loudest part
  points: number[];
  // Whether its last moment was much quieter than the rest of it
  faded: boolean;
}

// The loudness shapes
export interface LoudShapes {
  // One per stretch of a second or more
  shapes: LoudShape[];
  // How many faded
  faded: number;
  // One plain line
  line: string;
}

// The loudness shapes of a take (the same fading rule as the analysis's fading ends: the last 0.3 seconds under 60% of the stretch's own average)
export function loudShapes(levels: ReadonlyArray<number>, tickMs: number): LoudShapes | null {
  // Readings at the end that are compared
  const endTicks = Math.max(1, Math.round(300 / tickMs));
  // Shortest stretch worth judging: one second
  const minTicks = Math.round(1000 / tickMs);
  // The average of some readings
  const mean = (values: ReadonlyArray<number>) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  // The stretches long enough to judge
  const judged = speechStretches(levels, tickMs).filter((stretch) => stretch.levels.length >= minTicks);
  // Nothing to draw
  if (judged.length === 0) return null;
  // Each stretch's points before scaling
  const raw = judged.map((stretch) => Array.from({ length: SHAPE_POINTS }, (_, share) => mean(stretch.levels.slice(Math.floor((share * stretch.levels.length) / SHAPE_POINTS), Math.max(Math.floor((share * stretch.levels.length) / SHAPE_POINTS) + 1, Math.floor(((share + 1) * stretch.levels.length) / SHAPE_POINTS))))));
  // The loudest point of the take
  const loudest = Math.max(1e-6, ...raw.flat());
  // The shapes
  const shapes = judged.map((stretch, index) => ({ start: (stretch.start * tickMs) / 1000, end: ((stretch.end + 1) * tickMs) / 1000, points: raw[index]!.map((value) => Math.round((value / loudest) * 100) / 100), faded: mean(stretch.levels.slice(-endTicks)) < 0.6 * mean(stretch.levels) }));
  // How many faded
  const faded = shapes.filter((shape) => shape.faded).length;
  // The line
  const line = faded === 0 ? "Your volume held to the end of each stretch." : `Your last words got quieter in ${faded} of ${shapes.length} ${shapes.length === 1 ? "stretch" : "stretches"}.`;
  // The shapes
  return { shapes, faded, line };
}

// One sentence ending
export interface Ending {
  // When the phrase starts and ends, for playing it
  start: number;
  // (end)
  end: number;
  // Its last word, bare
  last: string;
  // How it ended
  ending: PhraseEnd;
  // A statement that rose (can sound unsure)
  risingStatement: boolean;
}

// The endings
export interface Endings {
  // Each phrase's ending, in order
  endings: Ending[];
  // One plain line
  line: string;
}

// The sentence endings of a take's phrases (only phrases whose ending could be read)
export function sentenceEndings(phrases: ReadonlyArray<Phrase>): Endings | null {
  // Each ending
  const endings = phrases.flatMap((phrase) => (phrase.ending === null ? [] : [{ start: phrase.start, end: phrase.end, last: bare(phrase.words.at(-1)?.text ?? ""), ending: phrase.ending, risingStatement: phrase.risingStatement }]));
  // Nothing to show
  if (endings.length === 0) return null;
  // How many fell, and how many statements rose
  const [fell, rose] = [endings.filter((ending) => ending.ending === "fell").length, endings.filter((ending) => ending.risingStatement).length];
  // The line
  const line = `${fell} of ${endings.length} fell at the end.${rose > 0 ? ` ${rose === 1 ? "One statement" : `${rose} statements`} rose like a question.` : ""}`;
  // The endings
  return { endings, line };
}

// One row of "today against your usual"
export interface UsualRow {
  // Its name
  name: string;
  // The band, low to high
  low: number;
  // (high)
  high: number;
  // This take's value
  value: number;
  // Where the bar starts and ends, so the band and the dot fit
  from: number;
  // (end)
  to: number;
  // Neutral words for where it sits (never better or worse, decision 103)
  words: string;
  // Whether it sits outside the band
  outside: boolean;
}

// The measures compared, each read from a take, with its neutral words
const USUAL_MEASURES: ReadonlyArray<{ name: string; read: (take: SessionRecord) => number | null; above: string; below: string; words?: boolean }> = [
  // Pace
  { name: "Pace", read: (take) => (take.wordsPerMinute > 0 ? take.wordsPerMinute : null), above: "faster than usual", below: "slower than usual" },
  // Voice movement
  { name: "Voice movement", read: (take) => take.pitchRange ?? null, above: "more than usual", below: "less than usual" },
  // Pause words (only when they are counted)
  { name: "Pause words", read: (take) => take.fillersPerMinute, above: "more than usual", below: "fewer than usual", words: true },
  // Length
  { name: "Length", read: (take) => (take.durationSec > 0 ? take.durationSec : null), above: "longer than usual", below: "shorter than usual" },
];

// Today's take against the speaker's usual for takes of the same family (the latest ten before it, five at least)
export function usualRows(sessions: ReadonlyArray<SessionRecord>, take: SessionRecord, pauseWords: boolean): UsualRow[] {
  // The family
  const family = familyOf(take.mode);
  // No family, nothing to compare with
  if (family === null) return [];
  // The earlier takes of the family, latest last
  const earlier = sessions.filter((session) => session.id !== take.id && session.createdAt < take.createdAt && familyOf(session.mode) === family).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-USUAL_TAKES);
  // Each measure
  return USUAL_MEASURES.filter((measure) => pauseWords || !measure.words).flatMap((measure) => {
    // Its earlier values
    const values = earlier.map(measure.read).filter((value): value is number => value !== null);
    // This take's
    const value = measure.read(take);
    // Too few, or nothing today
    if (values.length < USUAL_MIN_TAKES || value === null) return [];
    // The usual and its half-band (never thinner than 8% of the usual, so a steady speaker's band can be seen)
    const [usual, half] = [median(values)!, Math.max(robustSpread(values) ?? 0, Math.abs(median(values)!) * 0.08, 0.01)];
    // The band
    const [low, high] = [usual - half, usual + half];
    // The bar's ends, with room
    const [min, max] = [Math.min(low, value), Math.max(high, value)];
    // (room)
    const pad = (max - min) * 0.2 || 1;
    // The row
    return [{ name: measure.name, low, high, value, from: Math.max(0, min - pad), to: max + pad, words: value > high ? measure.above : value < low ? measure.below : "usual", outside: value > high || value < low }];
  });
}

// One word of the emphasis chart
export interface EmphasisWord {
  // As said
  text: string;
  // How hard it was leaned on: 0 (small word) to 3 (its phrase's top)
  weight: 0 | 1 | 2 | 3;
  // When it started, for playing
  start: number;
}

// The emphasis chart
export interface Emphasis {
  // The words, the first EMPHASIS_WORDS
  words: EmphasisWord[];
  // Whether more were said than shown
  more: boolean;
  // One plain line
  line: string;
}

// How hard each word was leaned on, from its phrase's peaks (each phrase's top is its highest pitch on a meaningful word)
export function emphasis(phrases: ReadonlyArray<Phrase>): Emphasis | null {
  // Every word with its weight
  const all = phrases.flatMap((phrase) => phrase.words.map((word) => ({ text: word.text, start: word.start, weight: (word === phrase.top ? 3 : word.peak ? 2 : word.content ? 1 : 0) as EmphasisWord["weight"] })));
  // Nothing said
  if (all.length === 0) return null;
  // The tops, highest steps first, distinct
  const tops = [...new Set(phrases.filter((phrase) => phrase.top && phrase.top.content).sort((a, b) => (b.top!.step ?? 0) - (a.top!.step ?? 0)).map((phrase) => bare(phrase.top!.text).toLowerCase()))].slice(0, 3);
  // The words quoted
  const quoted = tops.map((word) => `“${word}”`);
  // The line
  const line = quoted.length === 0 ? "No word stood out above the rest." : `You leaned most on ${quoted.length === 1 ? quoted[0] : `${quoted.slice(0, -1).join(", ")} and ${quoted.at(-1)}`}.`;
  // The chart
  return { words: all.slice(0, EMPHASIS_WORDS), more: all.length > EMPHASIS_WORDS, line };
}

// The voice range against the usual
export interface VoiceRange {
  // Today's range, in steps
  today: number;
  // The usual range, in steps
  usual: number;
  // Neutral words
  line: string;
}

// Today's range against the usual one (a fifth either way is "about your usual")
export function voiceRange(today: number | null | undefined, usual: number | null): VoiceRange | null {
  // Nothing to compare
  if (today === null || today === undefined || usual === null || usual <= 0) return null;
  // The share
  const share = today / usual;
  // The line
  const line = share < 0.8 ? `Your voice moved about ${share < 0.6 ? "half" : "three quarters"} as much as usual. It may have sounded flatter.` : share > 1.2 ? "Your voice moved more than usual. It may have sounded livelier." : "Your voice moved about as much as usual.";
  // The range
  return { today, usual, line };
}

// The progress line on a focus
export interface FocusProgress {
  // What is measured
  unit: string;
  // The values, oldest first, the last one this take
  values: number[];
  // The "where you started" band (the first takes' middle and spread)
  start: { low: number; high: number };
  // Numbers as written
  format: (value: number) => string;
  // One plain line
  line: string;
}

// The latest takes' values for the focus's number (pace when the focus has none), up to this take
export function focusProgress(sessions: ReadonlyArray<SessionRecord>, take: SessionRecord): FocusProgress | null {
  // The focus's number, or pace
  const measure = measureFor(take.focus) ?? measureFor("pace")!;
  // The family
  const family = familyOf(take.mode);
  // Takes of the family up to this one, oldest first
  const takes = sessions.filter((session) => (session.id === take.id || session.createdAt < take.createdAt) && familyOf(session.mode) === family).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  // Make sure this take is in
  if (!takes.some((session) => session.id === take.id)) takes.push(take);
  // Their values
  const all = takes.map((session) => measure.read(session)).filter((value): value is number => value !== null);
  // Too few
  if (all.length < PROGRESS_MIN_TAKES) return null;
  // The first takes, for the band
  const first = all.slice(0, START_TAKES);
  // Its middle and half-width
  const [middle, half] = [median(first)!, Math.max(robustSpread(first) ?? 0, Math.abs(median(first)!) * 0.08)];
  // The latest values
  const values = all.slice(-PROGRESS_TAKES);
  // The line
  const line = `${measure.unit[0]!.toUpperCase()}${measure.unit.slice(1)}: ${measure.format(values[0]!)} → ${measure.format(values.at(-1)!)} over your last ${values.length} takes.`;
  // The progress
  return { unit: measure.unit, values, start: { low: middle - half, high: middle + half }, format: measure.format, line };
}

// Whether the shape of the take is worth drawing for a length
export function shapeWorthDrawing(seconds: number): boolean {
  // Long enough to have a start, middle and end
  return seconds >= SHAPE_MIN_SECONDS;
}
