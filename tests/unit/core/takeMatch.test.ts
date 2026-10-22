// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { changeHeadline, overlayPoints, pairPhrases, pairsToShow } from "@/core/takeMatch";
import { matchWords } from "@/core/wordMatch";
// Load the phrase builder and word placement
import { pitchWords, type PitchWords } from "@/core/pitchPhrases";
import { alignFromServer } from "@/core/wordAlign";
// Load the made-up takes
import { makeTake, ZOO_AGAIN_PHRASES, ZOO_PHRASES } from "../../support/pitchTake";

// Work a made-up take out from its exact words
const worked = (phrases: typeof ZOO_PHRASES) => {
  // The take
  const take = makeTake(phrases);
  // Its phrases
  return pitchWords({ pitch: take.pitch, alignment: alignFromServer(take.serverWords), tickMs: 100 }) as PitchWords;
};
// The first telling, and the telling again with "me" falling
const [before, after] = [worked(ZOO_PHRASES), worked(ZOO_AGAIN_PHRASES)];

// Group the checks on matching two takes' words (decision 111)
describe("matchWords", () => {
  // The longest run of words both share, in order
  it("matches the shared words in order", () => {
    // A word added, one dropped and one changed
    expect(matchWords(["so", "the", "dog", "ran", "home"], ["the", "big", "dog", "ran", "back", "home"])).toEqual([[1, 0], [2, 2], [3, 3], [4, 5]]);
  });

  // Empty words never match
  it("never matches empty words", () => {
    // Two empty words
    expect(matchWords(["", "a"], ["", "a"])).toEqual([[1, 1]]);
  });

  // Very long takes are matched in pieces and still line up
  it("matches very long takes in pieces", () => {
    // Two thousand numbered words, one dropped near the start
    const words = Array.from({ length: 2000 }, (_, index) => `w${index}`);
    // Matched
    const pairs = matchWords(words, words.filter((_, index) => index !== 3));
    // Nearly every word matched, all in order
    expect([pairs.length > 1990, pairs.every(([a, b], index) => index === 0 || (a > pairs[index - 1]![0] && b > pairs[index - 1]![1]))]).toEqual([true, true]);
  });
});

// Group the checks on pairing phrases and drawing the last take under this one
describe("last try and this try", () => {
  // Each phrase pairs with the phrase sharing its words
  it("pairs phrases by shared words", () => {
    // Paired
    const pairs = pairPhrases(before.phrases, after.phrases);
    // Each of the five with its own
    expect(pairs.map((pair) => [pair.before.index, pair.after.index, pair.words.length])).toEqual([[0, 0, 8], [1, 1, 5], [2, 2, 10], [3, 3, 7], [4, 4, 10]]);
  });

  // A different phrase shares too little to pair
  it("does not pair phrases that share too little", () => {
    // A take saying something else
    const other = worked([{ words: [{ text: "Completely", step: 0 }, { text: "different", step: 2 }, { text: "words", step: 0 }, { text: "here.", step: 0, to: -3 }], pauseAfter: 0.5 }]);
    // No pairs
    expect(pairPhrases(before.phrases, other.phrases)).toEqual([]);
  });

  // The ending that flipped is the headline, said plainly
  it("gives a headline only for a clear change", () => {
    // Paired
    const pairs = pairPhrases(before.phrases, after.phrases);
    // Rose, now falls
    expect(changeHeadline(pairs, { before: 6, after: 6 })).toBe("Your ending used to rise. Now it falls.");
    // The same take twice: nothing clear
    expect(changeHeadline(pairPhrases(before.phrases, before.phrases), { before: 6, after: 6 })).toBeNull();
  });

  // The pitch range counts only beyond its usual wobble (decision 103: the bigger of 0.15 of it or one step)
  it("uses the noise-aware range threshold", () => {
    // Same endings
    const same = pairPhrases(before.phrases, before.phrases);
    // One step from five is noise; three steps is a change
    expect([changeHeadline(same, { before: 5, after: 6 }), changeHeadline(same, { before: 5, after: 8 }), changeHeadline(same, { before: 8, after: 5 })]).toEqual([null, "Your pitch moved more this time: 8 steps, up from 5.", "Your pitch moved less this time: 5 steps, down from 8."]);
    // Nothing measured on one side
    expect(changeHeadline(same, { before: null, after: 9 })).toBeNull();
  });

  // The phrase with the change comes first
  it("shows the changed phrase first", () => {
    // Ordered
    expect(pairsToShow(pairPhrases(before.phrases, after.phrases), 2).map((pair) => pair.after.index)).toEqual([3, 0]);
  });

  // The last take's curve is drawn across this take's words, only over the matched stretch
  it("draws the last take under this take's words", () => {
    // The changed phrase
    const pair = pairPhrases(before.phrases, after.phrases)[3]!;
    // This take's words laid out one per 40 pixels
    const slots = pair.after.words.map((_, index) => ({ index, left: index * 40, width: 32 }));
    // The last take's points
    const points = overlayPoints(pair, 100, slots, pair.after.words).filter((point): point is { x: number; y: number } => point !== null);
    // Inside the row, rising at its end (the last take rose)
    expect([points.length > 20, points[0]!.x >= 0, points.at(-1)!.x <= 6 * 40 + 32, points.at(-1)!.y < points[0]!.y]).toEqual([true, true, true, true]);
  });
});
