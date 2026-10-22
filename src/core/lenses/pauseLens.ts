// The pauses-and-ums lens (decision 115): each pause in the words with its length and place (between thoughts, or mid-sentence), the pause words in place, three counts, and up to two notes from the pause placement (one thing to change, one that worked). A pause is placed by the service's punctuation when deeper analysis ran, otherwise by the same word-list rule as the analysis (decision 90). Pure

// Load the word lists the analysis places pauses by (decision 90)
import { CLAUSE_STARTERS, SENTENCE_ENDERS } from "@/core/analysis/lexicon";
// Load the clause-end rule for punctuated words
import { endsClauseText } from "@/core/pitchPhrases";
// Load the words' type
import type { LensText, LensWord } from "@/core/lenses/lensWords";

// The shortest silence between two words that counts as a pause, in seconds (the analysis's own, decision 90)
export const LENS_PAUSE_SECONDS = 0.25;
// A pause between thoughts at least this long counts as calm, in seconds
const CALM_SECONDS = 0.5;
// Fewest calm pauses between thoughts before that is said as a strength
const CALM_COUNT = 3;
// A pause before a peak this close (in words) is a beat for effect, not a split sentence
const BEAT_REACH = 2;
// A run of talk this long without a pause between thoughts is worth saying, in seconds
const LONG_RUN_SECONDS = 25;
// Pause words at least this many make "let the silence stand" worth saying, when most pauses were filled
const MANY_FILLERS = 3;
// Words that surely start a new clause, for suggesting where a pause belongs (stricter than the placement list, which also has "my", "this" and "there")
const SURE_STARTERS: ReadonlySet<string> = new Set(["and", "but", "so", "because", "then", "when", "while", "if", "since", "after", "before", "until", "which", "who", "although", "though", "however", "i", "we", "you", "they", "he", "she", "i'm", "we're", "you're", "they're"]);

// Where a pause sits
export type PauseKind = "between" | "mid";

// One pause in the words
export interface PauseMark {
  // The word it follows (its place in the words)
  after: number;
  // How long, in seconds, to a tenth
  seconds: number;
  // Between thoughts or mid-sentence
  kind: PauseKind;
  // A mid-sentence pause right before a pitch peak: a beat for effect, not a split (shown calm, and not counted as mid-sentence)
  beat?: boolean;
}

// One note under the words
export interface LensNote {
  // Something to change, or something that worked
  tone: "work" | "good";
  // The first part, in bold
  lead: string;
  // The rest
  rest: string;
}

// The lens's findings
export interface PauseLens {
  // Every pause, in order
  marks: PauseMark[];
  // The three counts
  counts: { between: number; mid: number; fillers: number };
  // Up to two notes: one to change first, then one that worked
  notes: LensNote[];
}

// A word without its punctuation, for quoting
function bare(text: string): string {
  // Leading and trailing punctuation dropped
  return text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}'’]+$/gu, "");
}

// The place of the nearest word at or before a place that is not a pause word, or -1
function spokenBefore(words: ReadonlyArray<LensWord>, index: number): number {
  // Walk back
  for (let place = index; place >= 0; place--) if (!words[place]!.filler) return place;
  // None
  return -1;
}

// The place of the nearest word at or after a place that is not a pause word, or -1
function spokenAfter(words: ReadonlyArray<LensWord>, index: number): number {
  // Walk on
  for (let place = index; place < words.length; place++) if (!words[place]!.filler) return place;
  // None
  return -1;
}

// Whether a pause after a word sits between thoughts: the punctuation before it when there is some, otherwise the word-list rule on the word after it
function between(text: LensText, after: number): boolean {
  // The last real word before it
  const before = spokenBefore(text.words, after);
  // At the very start: between
  if (before === -1) return true;
  // Punctuated: by the mark after that word
  if (text.punctuated) return endsClauseText(text.words[before]!.text);
  // The first real word after it
  const next = spokenAfter(text.words, after + 1);
  // Otherwise: the word after the pause usually starts a clause, or the word before usually ends a statement
  return (next !== -1 && CLAUSE_STARTERS.has(text.words[next]!.w)) || SENTENCE_ENDERS.has(text.words[before]!.w);
}

// The pauses in a take's words, each placed
export function pauseMarks(text: LensText): PauseMark[] {
  // Untimed words have no pauses to show
  if (!text.timed) return [];
  // The pauses found
  const marks: PauseMark[] = [];
  // Each gap between two words
  for (let index = 0; index + 1 < text.words.length; index++) {
    // The gap
    const gap = (text.words[index + 1]!.start ?? 0) - (text.words[index]!.end ?? 0);
    // Too short to be a pause
    if (gap < LENS_PAUSE_SECONDS - 1e-9) continue;
    // Kept, placed
    marks.push({ after: index, seconds: Math.round(gap * 10) / 10, kind: between(text, index) ? "between" : "mid" });
  }
  // Hand them back
  return marks;
}

// How many pause words were said (a phrase such as "you know" once)
export function fillerCount(words: ReadonlyArray<LensWord>): number {
  // Each pause word that does not follow another
  return words.filter((word, index) => word.filler && !words[index - 1]?.filler).length;
}

// The next word after a place that ends a thought, or null: where a pause would sit between thoughts (without punctuation, only before a word that starts a clause; the looser "ends a statement" rule would suggest "right" in "stole it right out")
function nextBoundary(text: LensText, from: number): number | null {
  // Walk on
  for (let index = from; index + 1 < text.words.length; index++) {
    // A pause word is never the place
    if (text.words[index]!.filler) continue;
    // Punctuated: by its mark
    if (text.punctuated ? endsClauseText(text.words[index]!.text) : SURE_STARTERS.has(text.words[spokenAfter(text.words, index + 1)]?.w ?? "")) return index;
  }
  // None before the end
  return null;
}

// The lens for a take
export function pauseLens(text: LensText, peaks: ReadonlySet<number> = new Set()): PauseLens {
  // Beats before a peak (a pause just before the highest word of a phrase reads as suspense, not a split)
  const beat = (mark: PauseMark) => mark.kind === "mid" && [...peaks].some((peak) => peak > mark.after && peak - mark.after <= BEAT_REACH);
  // The pauses, beats marked
  const marks = pauseMarks(text).map((mark) => (beat(mark) ? { ...mark, beat: true } : mark));
  // The three counts
  const counts = { between: marks.filter((mark) => mark.kind === "between").length, mid: marks.filter((mark) => mark.kind === "mid" && !mark.beat).length, fillers: fillerCount(text.words) };
  // The notes
  const notes: LensNote[] = [];
  // A mid-sentence pause that was not a beat
  const split = marks.find((mark) => mark.kind === "mid" && !mark.beat);
  // The word before it and where the thought ended
  if (split) {
    // The word it followed
    const word = bare(text.words[spokenBefore(text.words, split.after)]?.text ?? text.words[split.after]!.text);
    // The end of that thought
    const end = nextBoundary(text, split.after + 1);
    // The note, with a better place when there is one
    notes.push({ tone: "work", lead: `The pause after “${word}” split the sentence.`, rest: end !== null ? ` Hold it until the thought ends, after “${bare(text.words[end]!.text)}”.` : " Hold it until the thought ends." });
  }
  // Otherwise many pause words in place of silence
  else if (counts.fillers >= MANY_FILLERS && counts.fillers > counts.between) notes.push({ tone: "work", lead: `${counts.fillers} pause words, ${counts.between} silent ${counts.between === 1 ? "pause" : "pauses"}.`, rest: " Where an “um” came, try a breath of silence instead." });
  // Otherwise a long run without a pause between thoughts
  else {
    // The longest run of talk between pauses between thoughts
    const run = longestRun(text, marks);
    // Worth saying
    if (run >= LONG_RUN_SECONDS) notes.push({ tone: "work", lead: `${Math.round(run)} seconds went by without a pause between thoughts.`, rest: " Stop for a breath at the end of each idea." });
  }
  // Calm pauses between thoughts
  const calm = marks.filter((mark) => mark.kind === "between" && mark.seconds >= CALM_SECONDS);
  // A beat before a peak
  const beats = marks.filter((mark) => mark.beat);
  // The strength: a beat before a key word, or calm pauses between thoughts
  if (beats.length > 0) notes.push({ tone: "good", lead: `A beat of silence before “${bare(text.words[[...peaks].find((peak) => peak > beats[0]!.after)!]!.text)}”.`, rest: " A pause right before the word that matters makes people listen for it." });
  // (calm)
  else if (calm.length >= CALM_COUNT) notes.push({ tone: "good", lead: `${calm.length} pauses between thoughts were half a second or longer.`, rest: " Pauses there give listeners time to take in each idea." });
  // One of each at most, the change first
  return { marks, counts, notes: [...notes.filter((note) => note.tone === "work").slice(0, 1), ...notes.filter((note) => note.tone === "good").slice(0, 1)] };
}

// The longest stretch of talk between pauses between thoughts (from the first word, to the last), in seconds
function longestRun(text: LensText, marks: ReadonlyArray<PauseMark>): number {
  // The first and last moments
  const [first, last] = [text.words[0]?.start ?? 0, text.words.at(-1)?.end ?? 0];
  // The cuts: each pause between thoughts, its start and end
  const cuts = marks.filter((mark) => mark.kind === "between").map((mark) => ({ from: text.words[mark.after]!.end ?? 0, to: text.words[mark.after + 1]!.start ?? 0 }));
  // The runs between the cuts
  let longest = 0;
  // Where the current run started
  let from = first;
  // Each cut closes a run
  for (const cut of cuts) {
    // This run
    longest = Math.max(longest, cut.from - from);
    // The next starts after the cut
    from = cut.to;
  }
  // The last run
  return Math.max(longest, last - from);
}
