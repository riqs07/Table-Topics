// Your best moment (decision 115): a rule-based pick of three to six seconds of a long take worth hearing again. A window of whole phrases scores for a beat of silence right before a pitch peak on a word that carries meaning, for that peak standing clearly above its phrase, and for a line that ends low and does not fade; any pause word in it rules it out. Nothing is shown unless a window scores at least 3, so a take with no good moment shows none: the pick never invents one. Pure

// Load the phrase types and the bare-word helper
import { bare, type Phrase } from "@/core/pitchPhrases";

// The shortest window, in seconds
export const MOMENT_SHORTEST = 3;
// The longest window, in seconds
export const MOMENT_LONGEST = 6;
// A gap before a word at least this long is a beat, in seconds
const BEAT_SECONDS = 0.4;
// A peak this many steps above its phrase's middle stands out clearly
const CLEAR_PEAK = 3;
// The score a window needs to be shown
export const MOMENT_THRESHOLD = 3;
// Lead-in before the window's first word, in seconds
const LEAD = 0.2;
// Room after its last word, in seconds
const TAIL = 0.3;
// The end of a line fades when its last 0.3 seconds are under this share of the line's own loudness
const FADE_SHARE = 0.6;

// The picked moment
export interface BestMoment {
  // When to play from, in seconds
  start: number;
  // When to stop, in seconds
  end: number;
  // The words, with "…" where the beat was
  words: string;
  // One plain line on why it was picked
  why: string;
  // Its score (3 or more)
  score: number;
}

// The middle of some numbers
function middleOf(values: ReadonlyArray<number>): number {
  // In order
  const sorted = [...values].sort((a, b) => a - b);
  // The middle one (0 for none)
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

// Whether a line's end faded, from the loudness readings
function faded(levels: ReadonlyArray<number>, tickMs: number, start: number, end: number): boolean {
  // Its readings
  const own = levels.slice(Math.floor((start * 1000) / tickMs), Math.ceil((end * 1000) / tickMs));
  // Too few to judge
  if (own.length < 6) return false;
  // Its last 0.3 seconds
  const tail = own.slice(-Math.max(1, Math.round(300 / tickMs)));
  // The averages
  const [all, last] = [own.reduce((sum, level) => sum + level, 0) / own.length, tail.reduce((sum, level) => sum + level, 0) / tail.length];
  // Faded when the end is much quieter
  return last < all * FADE_SHARE;
}

// Score one window of phrases; null when ruled out
function scoreWindow(phrases: ReadonlyArray<Phrase>, fillers: ReadonlyArray<number>, levels: ReadonlyArray<number>, tickMs: number): { score: number; beatWord: string | null; peakWord: string | null; landed: boolean; beatAfter: number | null } | null {
  // Its time
  const [start, end] = [phrases[0]!.start, phrases.at(-1)!.end];
  // Any pause word inside rules it out
  if (fillers.some((at) => at >= start - 0.05 && at <= end + 0.05)) return null;
  // Every word in it, in order
  const words = phrases.flatMap((phrase) => phrase.words);
  // The best peak: the highest clear peak on a word that carries meaning
  let peak: { word: string; place: number; above: number } | null = null;
  // Each phrase's top
  for (const phrase of phrases) {
    // Its middle pitch
    const centre = middleOf(phrase.steps.filter((step): step is number => step !== null));
    // Its top word
    const top = phrase.top;
    // A clear peak on a meaningful word, higher than any so far
    if (top && top.content && top.step !== null && top.step - centre >= CLEAR_PEAK && (!peak || top.step - centre > peak.above)) peak = { word: bare(top.text), place: words.indexOf(top), above: top.step - centre };
  }
  // A beat right before the peak (within the window: the gap from the word before it)
  const beatGap = peak && peak.place > 0 ? words[peak.place]!.start - words[peak.place - 1]!.end : 0;
  // Whether there was a beat
  const beat = peak !== null && beatGap >= BEAT_SECONDS;
  // The last line ended low and did not fade
  const last = phrases.at(-1)!;
  // (landed)
  const landed = last.ending === "fell" && !last.risingStatement && !faded(levels, tickMs, last.start, last.end);
  // The score: a beat before the peak counts double
  const score = (beat ? 2 : 0) + (peak ? 1 : 0) + (landed ? 1 : 0);
  // The parts
  return { score, beatWord: beat ? peak!.word : null, peakWord: peak?.word ?? null, landed, beatAfter: beat ? peak!.place - 1 : null };
}

// The plain line on why
function whyLine(parts: { beatWord: string | null; peakWord: string | null; landed: boolean }): string {
  // The pieces
  const pieces: string[] = [];
  // A beat, with the peak there
  if (parts.beatWord) pieces.push(`A beat of silence, then your highest pitch on “${parts.beatWord}”`);
  // A peak alone
  else if (parts.peakWord) pieces.push(`Your highest pitch landed on “${parts.peakWord}”`);
  // The ending
  if (parts.landed) pieces.push("the line ended low, without fading");
  // No pause words, always true of a picked moment
  pieces.push("no pause words");
  // Joined
  return `${pieces.slice(0, -1).join(", ")}, and ${pieces.at(-1)}.`;
}

// Pick the best moment of a take, or null when nothing scores well enough
export function bestMoment(input: { phrases: ReadonlyArray<Phrase>; fillers: ReadonlyArray<number>; levels: ReadonlyArray<number>; tickMs: number }): BestMoment | null {
  // The best so far
  let best: BestMoment | null = null;
  // Each first phrase
  for (let from = 0; from < input.phrases.length; from++) {
    // Each run of phrases from it
    for (let to = from; to < input.phrases.length; to++) {
      // The run
      const run = input.phrases.slice(from, to + 1);
      // Its length
      const length = run.at(-1)!.end - run[0]!.start;
      // Too long: no longer runs from here
      if (length > MOMENT_LONGEST) break;
      // Too short: add another phrase
      if (length < MOMENT_SHORTEST) continue;
      // Scored
      const scored = scoreWindow(run, input.fillers, input.levels, input.tickMs);
      // Ruled out, or not good enough, or no better than the best
      if (!scored || scored.score < MOMENT_THRESHOLD || (best && scored.score <= best.score)) continue;
      // The words, with "…" after the word before the beat
      const words = run.flatMap((phrase) => phrase.words);
      // As text
      const text = words.map((word, index) => `${word.text}${scored.beatAfter === index ? "…" : ""}`).join(" ");
      // Kept
      best = { start: Math.max(0, Math.round((run[0]!.start - LEAD) * 10) / 10), end: Math.round((run.at(-1)!.end + TAIL) * 10) / 10, words: text, why: whyLine(scored), score: scored.score };
    }
  }
  // The pick, or nothing
  return best;
}
