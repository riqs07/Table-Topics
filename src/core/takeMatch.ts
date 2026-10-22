// Last try and this try (decision 111): where the same words are said twice (a second try, a story told again, a check-in part), the two takes' words are matched, each phrase of this take is paired with the phrase of the last take that shares most of its words, and the last take's curve is drawn under this one's words. A headline is given only when a change clears the noise (decision 103)

// Load the shared pitch-range threshold and the rule that applies it (decision 103)
import { fixedThreshold, PITCH_RANGE_NOISE } from "@/core/changeNoise";
// Load the word matcher
import { matchWords } from "@/core/wordMatch";
// Load the phrase types and the placement of a moment across a row
import { bare, type Phrase, type WordSlot, xForTime, yForStep } from "@/core/pitchPhrases";

// A phrase pair shares at least this share of the shorter phrase's words
const MIN_SHARE = 0.5;
// And at least this many words
const MIN_SHARED = 2;

// One phrase of this take with its partner in the last take
export interface PhrasePair {
  // The last take's phrase
  before: Phrase;
  // This take's phrase
  after: Phrase;
  // Matched words: positions within each phrase's words
  words: Array<[number, number]>;
}

// Pair this take's phrases with the last take's by the words they share
export function pairPhrases(before: ReadonlyArray<Phrase>, after: ReadonlyArray<Phrase>): PhrasePair[] {
  // Every word of each take, with its phrase and place
  const flat = (phrases: ReadonlyArray<Phrase>) => phrases.flatMap((phrase) => phrase.words.map((word, place) => ({ w: word.w, phrase: phrase.index, place })));
  // Both takes' words
  const [wordsBefore, wordsAfter] = [flat(before), flat(after)];
  // Matched across the whole takes, in order
  const matched = matchWords(wordsBefore.map((word) => word.w), wordsAfter.map((word) => word.w));
  // The pairs, one per phrase of this take at most
  return after.flatMap((phrase): PhrasePair[] => {
    // Its matched words, by the last take's phrase
    const byPhrase = new Map<number, Array<[number, number]>>();
    // Each match landing in this phrase
    for (const [a, b] of matched) {
      // Only this phrase's
      if (wordsAfter[b]!.phrase !== phrase.index) continue;
      // The last take's phrase it came from
      const from = wordsBefore[a]!.phrase;
      // Grouped
      byPhrase.set(from, [...(byPhrase.get(from) ?? []), [wordsBefore[a]!.place, wordsAfter[b]!.place]]);
    }
    // The phrase sharing most
    const best = [...byPhrase.entries()].sort((x, y) => y[1].length - x[1].length)[0];
    // None
    if (!best) return [];
    // The last take's phrase
    const partner = before.find((item) => item.index === best[0])!;
    // Enough shared to be the same phrase
    const enough = best[1].length >= MIN_SHARED && best[1].length >= MIN_SHARE * Math.min(partner.words.length, phrase.words.length);
    // The pair, when it is one
    return enough ? [{ before: partner, after: phrase, words: best[1] }] : [];
  });
}

// The last take's curve drawn across this take's row of words: each of its readings placed by where its matched words sit in this row, inside the matched stretch only
export function overlayPoints(pair: PhrasePair, tickMs: number, slots: ReadonlyArray<WordSlot>, rowWords: ReadonlyArray<{ start: number; end: number }>): Array<{ x: number; y: number } | null> {
  // The matched words in this row, as anchors: the last take's times against this row's places
  const anchors = pair.words.flatMap(([a, b]) => {
    // This row's slot for the word, if it is in this row
    const slot = slots.find((item) => item.index === b);
    // Not in this row
    if (!slot) return [];
    // The last take's word
    const word = pair.before.words[a]!;
    // Its start and end placed at the slot's edges
    return [{ t: word.start, x: xForTime(rowWords[b]!.start, slots, rowWords) }, { t: word.end, x: xForTime(rowWords[b]!.end, slots, rowWords) }];
  }).sort((x, y) => x.t - y.t);
  // Too few anchors to place anything
  if (anchors.length < 2) return [];
  // The stretch of the last take covered
  const [from, to] = [anchors[0]!.t, anchors.at(-1)!.t];
  // Seconds per reading
  const tick = tickMs / 1000;
  // Each reading of the last take's phrase inside the stretch
  return pair.before.steps.flatMap((step, place) => {
    // Its moment
    const seconds = (pair.before.firstTick + place) * tick;
    // Outside the matched stretch
    if (seconds < from - 1e-9 || seconds > to + 1e-9) return [];
    // A gap
    if (step === null) return [null];
    // The pair of anchors around it
    const after = anchors.findIndex((anchor) => anchor.t >= seconds);
    // The two ends
    const [left, right] = [anchors[Math.max(0, after - 1)]!, anchors[Math.max(0, after)]!];
    // Placed on the line between them
    const x = right.t === left.t ? right.x : left.x + ((seconds - left.t) / (right.t - left.t)) * (right.x - left.x);
    // The point
    return [{ x: Math.round(x * 10) / 10, y: yForStep(step) }];
  });
}

// A clear change between the two takes, in one plain sentence, or null when nothing cleared the noise
export function changeHeadline(pairs: ReadonlyArray<PhrasePair>, ranges: { before: number | null; after: number | null }): string | null {
  // A statement's ending that flipped from rising to falling (each side past the end rule's margin, so at least three steps apart)
  if (pairs.some((pair) => !pair.after.question && pair.before.ending === "rose" && pair.after.ending === "fell")) return "Your ending used to rise. Now it falls.";
  // One that flipped the other way, said plainly
  if (pairs.some((pair) => !pair.after.question && pair.before.ending === "fell" && pair.after.ending === "rose")) return "Your ending used to fall. Now it rises.";
  // The range, when both were measured and the move clears the noise
  if (ranges.before !== null && ranges.after !== null && Math.abs(ranges.after - ranges.before) > fixedThreshold(PITCH_RANGE_NOISE, ranges.before)) return ranges.after > ranges.before ? `Your pitch moved more this time: ${ranges.after} steps, up from ${ranges.before}.` : `Your pitch moved less this time: ${ranges.after} steps, down from ${ranges.before}.`;
  // Nothing clear
  return null;
}

// The pairs worth showing first: a flipped ending, then the biggest change in where the peak landed, then in order
export function pairsToShow(pairs: ReadonlyArray<PhrasePair>, most = 3): PhrasePair[] {
  // A score for how much changed
  const score = (pair: PhrasePair) => (pair.before.ending !== pair.after.ending && pair.before.ending !== null && pair.after.ending !== null ? 2 : 0) + (pair.before.top && pair.after.top && bare(pair.before.top.text) !== bare(pair.after.top.text) ? 1 : 0);
  // Highest score first, then in order of this take
  return [...pairs].sort((a, b) => score(b) - score(a) || a.after.index - b.after.index).slice(0, most);
}
