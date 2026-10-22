// Pitch in your words (decision 111): a take's words placed in time are split into phrases, each word gets its pitch (the middle of the readings while it was said), the highest words of each phrase are its peaks, and each phrase's ending is read as fell, held or rose with the same rule as a whole take. Pure, so the views only draw what this works out

// Load the end rule shared with the whole-take summary
import { endOfSteps } from "@/core/pitch";
// Load the cleaning
import { cleanSteps } from "@/core/pitchClean";
// Load the word lists: small words that rarely carry the meaning, and words that start a clause
import { CLAUSE_STARTERS, STOP_WORDS } from "@/core/analysis/lexicon";
// Load the word placement types
import type { AlignPrecision, AlignedWord, Alignment } from "@/core/wordAlign";

// A gap between words this long splits a phrase when there is no punctuation, in seconds
export const PHRASE_PAUSE = 0.3;
// With punctuation, only a gap this long splits a phrase without it, in seconds
const LONG_PAUSE = 1;
// Most words in a phrase before it is split at a clause word near its middle
const MOST_WORDS = 12;
// Fewest voiced readings before pitch is drawn under the words at all (a second of voice)
export const MIN_VOICED_READINGS = 10;
// A peak sits at least this many steps above its phrase's middle
const PEAK_ABOVE = 1.5;
// And within this many steps of the phrase's highest word
const PEAK_BAND = 0.75;
// A phrase whose readings span less than this many steps, and that neither rose nor fell at its end, is flat
const FLAT_STEPS = 2;
// Fewest words for a phrase to be called flat
const FLAT_WORDS = 3;
// A clear peak, worth a note, sits this many steps above its phrase's middle
const CLEAR_PEAK = 3;
// Words that open a question when there is no punctuation to say so
const QUESTION_STARTS: ReadonlySet<string> = new Set(["do", "does", "did", "is", "are", "was", "were", "can", "could", "would", "will", "should", "what", "why", "how", "who", "where", "which", "isn't", "aren't", "don't", "didn't"]);
// Punctuation that ends a clause (with any closing quote or bracket after it)
const CLAUSE_END = /[.,;:?!…—–]["'”’)\]]*$/;

// How a phrase ended
export type PhraseEnd = "fell" | "held" | "rose";

// One word of a phrase, with its pitch
export interface PhraseWord extends AlignedWord {
  // The middle of its readings in steps around the usual pitch, or null when none were voiced
  step: number | null;
  // Whether it is one of its phrase's peaks
  peak: boolean;
  // Whether it is a word that usually carries meaning (not a small word such as "the")
  content: boolean;
}

// One phrase
export interface Phrase {
  // Its place among the phrases, from 0
  index: number;
  // Its words
  words: PhraseWord[];
  // When its first word starts, in seconds
  start: number;
  // When its last word ends, in seconds
  end: number;
  // The reading position its curve starts at
  firstTick: number;
  // Its cleaned readings in steps, from firstTick on (null where unvoiced)
  steps: (number | null)[];
  // How it ended, or null with too few voiced readings
  ending: PhraseEnd | null;
  // The steps between its low and high readings (10th to 90th percentile), or null with too few
  rangeSteps: number | null;
  // Whether it stayed flat
  flat: boolean;
  // Whether it is a question (a rising end is right for one)
  question: boolean;
  // A statement that went up at the end, which can sound unsure
  risingStatement: boolean;
  // Its highest peak word, or null
  top: PhraseWord | null;
  // Seconds of quiet since the phrase before, or null for the first
  pauseBefore: number | null;
}

// A take's pitch in its words
export interface PitchWords {
  // The phrases, in order
  phrases: Phrase[];
  // How sure the word times are
  precision: AlignPrecision;
  // The whole take's cleaned readings in steps
  steps: (number | null)[];
  // The take's usual pitch in hertz
  usualHz: number;
  // Milliseconds between readings
  tickMs: number;
}

// The middle of some numbers (none for an empty list)
function middle(values: ReadonlyArray<number>): number | null {
  // In order
  const sorted = [...values].sort((a, b) => a - b);
  // Nothing to take the middle of
  if (sorted.length === 0) return null;
  // The middle one, or the average of the two in the middle
  const half = Math.floor(sorted.length / 2);
  // Hand it back
  return sorted.length % 2 === 1 ? sorted[half]! : (sorted[half - 1]! + sorted[half]!) / 2;
}

// A share of the way through a sorted list
function percentile(sorted: ReadonlyArray<number>, share: number): number {
  // The nearest place
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(share * (sorted.length - 1))))] ?? 0;
}

// Whether a word usually carries meaning
export function isContentWord(w: string): boolean {
  // Not a small word, and not a hesitation sound
  return w.length > 1 && !STOP_WORDS.has(w) && !/^(u+m+|u+h+|e+r+|a+h+|h+m+|m+)$/.test(w);
}

// Split placed words into phrases: on clause punctuation when there is some, otherwise on pauses; long runs are split at a clause word near their middle
export function splitPhrases(words: ReadonlyArray<AlignedWord>, punctuated: boolean): AlignedWord[][] {
  // The phrases found
  const phrases: AlignedWord[][] = [];
  // The phrase being built
  let current: AlignedWord[] = [];
  // Each word
  words.forEach((word, index) => {
    // Add it
    current.push(word);
    // The next word
    const next = words[index + 1];
    // The quiet before the next word
    const gap = next ? next.start - word.end : Infinity;
    // Whether the phrase ends here
    const ends = !next || (punctuated ? CLAUSE_END.test(word.text) || gap >= LONG_PAUSE : gap >= PHRASE_PAUSE);
    // Close it
    if (ends) {
      // Keep it
      phrases.push(current);
      // Start afresh
      current = [];
    }
  });
  // Long phrases split until short enough
  return phrases.flatMap(splitLong);
}

// Split a run of more than MOST_WORDS words at the clause word nearest its middle (or the middle itself), again until each part is short enough
function splitLong(phrase: AlignedWord[]): AlignedWord[][] {
  // Short enough
  if (phrase.length <= MOST_WORDS) return [phrase];
  // The middle
  const half = Math.floor(phrase.length / 2);
  // Clause words that leave at least three words either side, nearest the middle first
  const starts = phrase.map((word, index) => ({ word, index })).filter(({ word, index }) => index >= 3 && index <= phrase.length - 3 && CLAUSE_STARTERS.has(word.w)).sort((a, b) => Math.abs(a.index - half) - Math.abs(b.index - half));
  // Where to cut
  const cut = starts[0]?.index ?? half;
  // Both halves, split again if needed
  return [...splitLong(phrase.slice(0, cut)), ...splitLong(phrase.slice(cut))];
}

// The readings in steps that fall within a stretch of time (positions from..to inclusive)
function ticksBetween(start: number, end: number, tickMs: number): { from: number; to: number } {
  // Seconds per reading
  const tick = tickMs / 1000;
  // The first and last reading inside
  return { from: Math.max(0, Math.floor(start / tick + 1e-9)), to: Math.max(0, Math.ceil(end / tick - 1e-9)) };
}

// Work out the pitch of each word and each phrase's shape, or null when too little voice was heard to draw it
export function pitchWords(input: { pitch: ReadonlyArray<number | null>; alignment: Alignment; tickMs: number }): PitchWords | null {
  // Cleaned readings in steps around the take's own usual pitch
  const { steps, usualHz } = cleanSteps(input.pitch, input.tickMs);
  // Too little voice
  if (usualHz === null || steps.filter((step) => step !== null).length < MIN_VOICED_READINGS) return null;
  // The phrases' words
  const groups = splitPhrases(input.alignment.words, input.alignment.punctuated);
  // Each phrase worked out
  const phrases = groups.map((group, index): Phrase => {
    // Its time
    const [start, end] = [group[0]!.start, group.at(-1)!.end];
    // Its readings
    const { from, to } = ticksBetween(start, end, input.tickMs);
    // In steps
    const own = steps.slice(from, to + 1);
    // The voiced ones
    const voiced = own.filter((step): step is number => step !== null);
    // In order of height
    const sorted = [...voiced].sort((a, b) => a - b);
    // Its middle
    const centre = middle(voiced);
    // Each word's pitch: the middle of its own readings
    const pitched = group.map((word) => {
      // The word's readings
      const span = ticksBetween(word.start, word.end, input.tickMs);
      // Their middle
      const step = middle(steps.slice(span.from, Math.max(span.from + 1, span.to)).filter((value): value is number => value !== null));
      // With its pitch, rounded to a tenth
      return { ...word, step: step === null ? null : Math.round(step * 10) / 10, peak: false, content: isContentWord(word.w) };
    });
    // The highest word's pitch
    const highest = Math.max(-Infinity, ...pitched.map((word) => word.step ?? -Infinity));
    // Peaks: near the highest and clearly above the middle
    const words = pitched.map((word) => ({ ...word, peak: centre !== null && word.step !== null && pitched.length > 1 && word.step >= highest - PEAK_BAND && word.step - centre >= PEAK_ABOVE }));
    // The highest peak
    const top = words.filter((word) => word.peak).sort((a, b) => (b.step ?? 0) - (a.step ?? 0))[0] ?? null;
    // How it ended
    const shape = endOfSteps(voiced);
    // In the words the views use
    const ending: PhraseEnd | null = shape === "fall" ? "fell" : shape === "rise" ? "rose" : shape === "level" ? "held" : null;
    // Its range, with enough readings
    const rangeSteps = sorted.length >= 5 ? Math.round((percentile(sorted, 0.9) - percentile(sorted, 0.1)) * 10) / 10 : null;
    // A question by its mark, or by its first word when there is no punctuation
    const question = /\?["'”’)\]]*$/.test(group.at(-1)!.text) || (!input.alignment.punctuated && QUESTION_STARTS.has(group[0]!.w));
    // The phrase before, for the pause
    const before = groups[index - 1];
    // The phrase
    return { index, words, start, end, firstTick: from, steps: own, ending, rangeSteps, flat: rangeSteps !== null && rangeSteps < FLAT_STEPS && group.length >= FLAT_WORDS && ending !== "rose" && ending !== "fell", question, risingStatement: ending === "rose" && !question, top, pauseBefore: before ? Math.max(0, Math.round((start - before.at(-1)!.end) * 10) / 10) : null };
  });
  // Hand it back
  return { phrases, precision: input.alignment.precision, steps, usualHz, tickMs: input.tickMs };
}

// A word without its punctuation, for quoting
export function bare(text: string): string {
  // Trailing and leading punctuation dropped
  return text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}'’]+$/gu, "");
}

// A note on one phrase, only where useful: a statement that rose, a flat phrase, or a clear peak on a word that carries meaning
export interface PhraseNote {
  // Something to work on, or something that went well
  tone: "work" | "good";
  // The words
  text: string;
}

// The note for a phrase, or null when there is nothing worth saying
export function phraseNote(phrase: Phrase): PhraseNote | null {
  // The last word, bare
  const last = bare(phrase.words.at(-1)?.text ?? "");
  // A statement that rose
  if (phrase.risingStatement) return { tone: "work", text: `Went up at the end of a statement, so it sounds like a question. Try letting “${last}” drop.` };
  // A flat phrase: suggest its longest meaningful word
  if (phrase.flat) {
    // The word to lift
    const lift = [...phrase.words].filter((word) => word.content).sort((a, b) => b.w.length - a.w.length)[0];
    // The note
    return { tone: "work", text: lift ? `Fairly flat. Lift one word, like “${bare(lift.text)}”.` : "Fairly flat. Lift one word." };
  }
  // A clear peak on a meaningful word
  const centre = middle(phrase.steps.filter((step): step is number => step !== null)) ?? 0;
  // Worth a note
  if (phrase.top && phrase.top.content && (phrase.top.step ?? 0) - centre >= CLEAR_PEAK) return { tone: "good", text: `Your highest point landed on “${bare(phrase.top.text)}”, a key word.` };
  // Nothing to say
  return null;
}

// What a phrase's curve shows, for screen readers
export function describePhrase(phrase: Phrase): string {
  // A flat phrase
  if (phrase.flat) return "Pitch stays almost flat through the phrase.";
  // How it ended, in words
  const ending = phrase.ending === "fell" ? "falls at the end" : phrase.ending === "rose" ? "rises at the end" : phrase.ending === "held" ? "holds level at the end, like a comma" : "";
  // With a peak before the last word
  if (phrase.top && phrase.top !== phrase.words.at(-1)) return `Pitch rises on “${bare(phrase.top.text)}”${ending ? `, then ${ending}` : ""}.`;
  // Only the ending
  return ending ? `Pitch ${ending}.` : "Your pitch through this phrase.";
}

// One piece of a summary line, some in bold
export interface LinePart {
  // The words
  text: string;
  // Shown in bold
  strong?: boolean;
}

// One plain summary line under the words
export interface PitchLine {
  // What it is about
  kind: "peaks" | "rising" | "flat" | "ends";
  // Something to work on, something that went well, or a plain note (the flat phrases are shown in grey)
  tone: "work" | "good" | "flat";
  // The words
  parts: LinePart[];
}

// Names joined in plain English, each in bold: "a", "a and b", "a, b and c"
function namesList(names: ReadonlyArray<string>): LinePart[] {
  // Each name in bold, with the joining words between
  return names.flatMap((name, index): LinePart[] => [...(index === 0 ? [] : [{ text: index === names.length - 1 ? " and " : ", " }]), { text: name, strong: true }]);
}

// Fewest phrases with a readable ending before the share falling low is said
const MIN_ENDINGS = 4;

// Up to three plain lines on the take's pitch in its words: where the peaks landed, statements that rose, and flat phrases (things to work on first)
export function pitchSummary(phrases: ReadonlyArray<Phrase>): PitchLine[] {
  // The lines
  const lines: PitchLine[] = [];
  // Statements that rose
  const rising = phrases.filter((phrase) => phrase.risingStatement);
  // One: name its last word
  if (rising.length === 1) lines.push({ kind: "rising", tone: "work", parts: [{ text: `“${bare(rising[0]!.words.at(-1)!.text)}” went up at the end of a statement, so it sounds unsure.` }] });
  // More: count them
  else if (rising.length > 1) lines.push({ kind: "rising", tone: "work", parts: [{ text: `${rising.length} statements went up at the end, which can sound unsure. Land them low.` }] });
  // Flat phrases
  const flat = phrases.filter((phrase) => phrase.flat);
  // Only the last one: it is the ending
  if (flat.length === 1 && flat[0] === phrases.at(-1) && phrases.length > 1) lines.push({ kind: "flat", tone: "flat", parts: [{ text: "The last line stayed flat, shown in grey. Lift one word to end with energy." }] });
  // One elsewhere
  else if (flat.length === 1) lines.push({ kind: "flat", tone: "flat", parts: [{ text: "One phrase stayed flat, shown in grey. Lift one word to give it energy." }] });
  // Several
  else if (flat.length > 1) lines.push({ kind: "flat", tone: "flat", parts: [{ text: `${flat.length} phrases stayed flat, shown in grey. Lift one word in each.` }] });
  // The peaks, one per phrase
  const tops = phrases.flatMap((phrase) => (phrase.top ? [phrase.top] : []));
  // On words that carry meaning
  const meaningful = tops.filter((word) => word.content);
  // Mostly on meaningful words: name up to three
  if (tops.length >= 2 && meaningful.length * 2 >= tops.length) lines.push({ kind: "peaks", tone: "good", parts: [{ text: "Your peaks landed on " }, ...namesList([...new Set(meaningful.map((word) => bare(word.text)))].slice(0, 3)), { text: ": words that carry the meaning." }] });
  // Mostly on small words
  else if (tops.length >= 2) lines.push({ kind: "peaks", tone: "work", parts: [{ text: "Your peaks often landed on small words such as " }, ...namesList([...new Set(tops.filter((word) => !word.content).map((word) => bare(word.text).toLowerCase()))].slice(0, 2)), { text: ". Lift the word that matters instead." }] });
  // No rising statements and mostly low endings: a strength
  const judged = phrases.filter((phrase) => phrase.ending !== null && !phrase.question);
  // Worth saying
  if (rising.length === 0 && judged.length >= MIN_ENDINGS && judged.filter((phrase) => phrase.ending === "fell").length / judged.length >= 0.6) lines.push({ kind: "ends", tone: "good", parts: [{ text: `${judged.filter((phrase) => phrase.ending === "fell").length} of ${judged.length} statements ended low, which sounds sure.` }] });
  // Things to work on first, three at most
  return [...lines.filter((line) => line.tone !== "good"), ...lines.filter((line) => line.tone === "good")].slice(0, 3);
}

// Where a word sits in a row of words under a curve: from the left, and its width, in pixels
export interface WordSlot {
  // The word's place in the list given
  index: number;
  // From the left edge
  left: number;
  // Its width (its text, plus its share of the spare room)
  width: number;
}

// One row of words under its own stretch of curve
export interface WordRow {
  // The words in it
  slots: WordSlot[];
}

// The gap between words in a row, in pixels
export const WORD_GAP = 5;

// Lay words out in rows under a curve: as many as fit in each row by their text (a peak measured in bold), then the spare room shared out by how long each word took, so the curve keeps its timing without words overlapping
export function layoutWords(words: ReadonlyArray<{ text: string; start: number; end: number; peak?: boolean }>, width: number, measure: (text: string, bold: boolean) => number): WordRow[] {
  // The rows
  const rows: WordRow[] = [];
  // The words in the row being filled, with their text widths
  let row: Array<{ index: number; text: number }> = [];
  // The row's width so far
  let used = 0;
  // Close a row: share out its spare room
  const close = () => {
    // Nothing to close
    if (row.length === 0) return;
    // The spare room
    const spare = Math.max(0, width - used);
    // How long each word took (a sliver at least)
    const durations = row.map((entry) => Math.max(0.05, words[entry.index]!.end - words[entry.index]!.start));
    // In all
    const total = durations.reduce((sum, value) => sum + value, 0);
    // From the left
    let left = 0;
    // Each slot
    const slots = row.map((entry, place) => {
      // Its width: its text and its share of the spare room
      const slotWidth = entry.text + (spare * durations[place]!) / total;
      // The slot
      const slot = { index: entry.index, left: Math.round(left * 10) / 10, width: Math.round(slotWidth * 10) / 10 };
      // Move on past it and the gap
      left += slotWidth + WORD_GAP;
      // Hand it back
      return slot;
    });
    // Keep the row
    rows.push({ slots });
    // Start afresh
    row = [];
    // Nothing used
    used = 0;
  };
  // Each word
  words.forEach((word, index) => {
    // Its text width (a peak is drawn in bold)
    const text = Math.ceil(measure(word.text, word.peak === true));
    // The room it needs here
    const needs = (row.length > 0 ? WORD_GAP : 0) + text;
    // No room: a new row
    if (row.length > 0 && used + needs > width) close();
    // Add it
    row.push({ index, text });
    // Room used
    used += (row.length > 1 ? WORD_GAP : 0) + text;
  });
  // The last row
  close();
  // Hand them back
  return rows;
}

// Where a moment sits across a row: on the straight line through each word's start and end at its slot's edges, held at the row's ends
export function xForTime(seconds: number, slots: ReadonlyArray<WordSlot>, words: ReadonlyArray<{ start: number; end: number }>): number {
  // The anchors: each word's start at its left edge, its end at its right edge
  const anchors = slots.flatMap((slot) => [{ t: words[slot.index]!.start, x: slot.left }, { t: words[slot.index]!.end, x: slot.left + slot.width }]);
  // Nothing to place against
  if (anchors.length === 0) return 0;
  // Each pair of anchors, from the last, so a moment on a boundary between two words belongs to the later word (a reading at a word's start is that word's)
  for (let index = anchors.length - 1; index >= 1; index--) {
    // The pair
    const [from, to] = [anchors[index - 1]!, anchors[index]!];
    // Not reached yet
    if (seconds < from.t) continue;
    // Past its end, or a pair at one moment: its end; otherwise on the line between
    return seconds >= to.t || to.t === from.t ? to.x : from.x + ((seconds - from.t) / (to.t - from.t)) * (to.x - from.x);
  }
  // Before the first
  return anchors[0]!.x;
}

// The height of a curve's picture, in pixels
export const CURVE_HEIGHT = 64;
// Where the usual pitch sits down the picture, in pixels
export const USUAL_Y = 34;
// Pixels per step (seven steps reach the top of the picture)
const STEP_PIXELS = 4.5;

// How far down the picture a pitch in steps sits (higher pitch is higher up), kept inside the picture
export function yForStep(step: number): number {
  // Up from the usual line, held inside the picture
  return Math.round(Math.min(CURVE_HEIGHT - 4, Math.max(4, USUAL_Y - step * STEP_PIXELS)) * 10) / 10;
}

// The curve points for one row of words: each reading inside the row's time, placed across by its moment and up by its pitch (null where unvoiced, so the curve breaks)
export function rowPoints(steps: ReadonlyArray<number | null>, tickMs: number, slots: ReadonlyArray<WordSlot>, words: ReadonlyArray<{ start: number; end: number }>): Array<{ x: number; y: number } | null> {
  // The row's time
  const [start, end] = [words[slots[0]!.index]!.start, words[slots.at(-1)!.index]!.end];
  // Its readings
  const { from, to } = ticksBetween(start, end, tickMs);
  // Each reading as a point
  const points: Array<{ x: number; y: number } | null> = [];
  // Walk them
  for (let tick = from; tick <= to && tick < steps.length; tick++) {
    // Its pitch
    const step = steps[tick] ?? null;
    // A gap, or a point
    points.push(step === null ? null : { x: Math.round(xForTime((tick * tickMs) / 1000, slots, words) * 10) / 10, y: yForStep(step) });
  }
  // Hand them back
  return points;
}

// How far each word sits up or down in the text view, in pixels (up is negative, as the page draws it), kept small so lines stay readable
export function textLift(step: number | null): number {
  // No pitch: on the line
  if (step === null) return 0;
  // Two pixels a step, at most twelve up or eight down
  return Math.round(Math.max(-12, Math.min(8, -step * 2)));
}

// One row of a phrase ready to draw: where its words sit and its curve's points
export interface CurveLine {
  // The words' places
  slots: WordSlot[];
  // The curve's points (null where unvoiced)
  points: Array<{ x: number; y: number } | null>;
}

// A run of words laid out in rows of the given width, each with its stretch of the take's curve
export function curveLines(words: ReadonlyArray<{ text: string; start: number; end: number; peak?: boolean }>, steps: ReadonlyArray<number | null>, tickMs: number, width: number, measure: (text: string, bold: boolean) => number): CurveLine[] {
  // Each row with its points
  return layoutWords(words, width, measure).map((row) => ({ slots: row.slots, points: rowPoints(steps, tickMs, row.slots, words) }));
}

// The highest point of some curve points, or null without any
export function highestPoint(points: ReadonlyArray<{ x: number; y: number } | null>): { x: number; y: number } | null {
  // The point nearest the top (the smallest distance down)
  return points.reduce<{ x: number; y: number } | null>((best, point) => (point && (!best || point.y < best.y) ? point : best), null);
}

// Another voice's readings stretched across a stretch of this row's time (the model voice in shadowing): reading i of n sits at from + (to − from) × i ÷ (n − 1), and only those inside the row's own time are kept
export function stretchPoints(steps: ReadonlyArray<number | null>, from: number, to: number, slots: ReadonlyArray<WordSlot>, words: ReadonlyArray<{ start: number; end: number }>): Array<{ x: number; y: number } | null> {
  // Too few to stretch, or nothing to place against
  if (steps.length < 2 || slots.length === 0) return [];
  // The row's own time
  const [rowStart, rowEnd] = [words[slots[0]!.index]!.start, words[slots.at(-1)!.index]!.end];
  // Each reading at its stretched moment, inside the row
  return steps.flatMap((step, index) => {
    // Its moment
    const seconds = from + ((to - from) * index) / (steps.length - 1);
    // Outside this row
    if (seconds < rowStart - 1e-9 || seconds > rowEnd + 1e-9) return [];
    // A gap, or a point
    return [step === null ? null : { x: Math.round(xForTime(seconds, slots, words) * 10) / 10, y: yForStep(step) }];
  });
}
