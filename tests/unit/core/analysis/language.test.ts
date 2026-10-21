// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the language and vocabulary measures being checked
import { contentWordCounts, countIntensifiers, countPhrases, countRepairs, countTagQuestions, languageMeasures, mattr, openingSignals, pronounRate, weakEnding, wordLength } from "@/core/analysis/language";
// Load the word lists
import { HEDGES, VAGUE_WORDS } from "@/core/analysis/lexicon";
// Load the statistics helpers being checked too
import { coefficientOfVariation, median, quantile, robustSpread } from "@/core/analysis/stats";

// Split text into lower-case words for the checks
const words = (text: string) => text.toLowerCase().split(/\s+/).filter(Boolean);

// Group the checks about the statistics helpers
describe("stats", () => {
  // Medians, odd and even, and empty
  it("takes the middle of a list", () => {
    // Odd, even and empty
    expect([median([3, 1, 2]), median([4, 1, 3, 2]), median([])]).toEqual([2, 2.5, null]);
  });

  // The robust spread ignores one wild value
  it("gives a spread that one outlier cannot swing", () => {
    // Five ordinary values and one wild one
    expect(robustSpread([10, 11, 9, 10, 10, 100])).toBeCloseTo(1.4826 * 0.5, 4);
  });

  // Percentiles interpolate, and the spread over the average is the coefficient of variation
  it("reads percentiles and the coefficient of variation", () => {
    // The 90th percentile of 1..11 is 10, and a flat list varies by nothing
    expect([quantile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 0.9), coefficientOfVariation([2, 2, 2]), coefficientOfVariation([0, 0])]).toEqual([10, 0, null]);
  });
});

// Group the checks about the word-list counts
describe("word-list counts", () => {
  // Longest phrases win and are counted once
  it("counts hedges without counting a phrase's parts twice", () => {
    // "I think maybe" is one hedge, "kind of" another, "just" a third
    expect(countPhrases(words("I think maybe we should just go it was kind of late"), HEDGES)).toBe(3);
  });

  // Vague words include phrases such as "a lot"
  it("counts vague words and phrases", () => {
    // stuff, a lot, good
    expect(countPhrases(words("we did stuff and a lot of it was good"), VAGUE_WORDS)).toBe(3);
  });

  // "so" pushes a word up only in the middle of a clause
  it("counts intensifiers, leaving out a clause-opening so", () => {
    // "so I" opens a clause; "so good", "really" and "very" push words up
    expect(countIntensifiers(words("so I went and it was so good really very good"))).toBe(3);
  });

  // Tag questions close a statement
  it("counts tag questions only where a statement closes", () => {
    // "isn't it" before the end, "right" at the very end; the "right" in the middle is not a tag
    expect(countTagQuestions(words("turn right here it is lovely isn't it and we agree right"), new Set())).toBe(2);
  });

  // A pause after a one-word tag counts it
  it("counts a one-word tag before a pause", () => {
    // "okay" at position 4 is followed by a pause
    expect(countTagQuestions(words("we start at nine okay then we go"), new Set([4]))).toBe(1);
  });
});

// Group the checks about word variety and word length
describe("vocabulary", () => {
  // Every word different gives 1; one word repeated gives a low ratio
  it("measures word variety over 50-word windows", () => {
    // Sixty different words, and sixty of the same word
    const different = Array.from({ length: 60 }, (_, index) => `word${String.fromCharCode(97 + (index % 26))}${index}`);
    // Confirm the two extremes and a short take's plain ratio
    expect([mattr(different), mattr(Array(60).fill("same"))?.toFixed(4), mattr(words("one two two three three three four four four four")), mattr(words("too short"))]).toEqual([1, "0.0200", 0.4, null]);
  });

  // Letters only, and the share of long words
  it("measures word length and long words", () => {
    // "it's" has three letters; "wonderful" is long
    expect(wordLength(words("it's a wonderful day"))).toEqual({ mean: (3 + 1 + 9 + 3) / 4, longShare: 0.25 });
  });

  // Content words leave out small, common and hesitation words
  it("counts content words without stop words", () => {
    // Only "garden" and "tomatoes" are content words here
    expect(contentWordCounts(words("um I think the garden had so many tomatoes in the garden"))).toEqual({ garden: 2, tomatoes: 1 });
  });
});

// Group the checks about repeats, openings, closings and pronouns
describe("repeats, openings, closings, pronouns", () => {
  // Repeated words and pairs, but not hesitation sounds
  it("counts repeats and restarts", () => {
    // "I I", "the the", and "we were we were"; "um um" is a pause word, not a repeat
    expect(countRepairs(words("I I went to the the shop um um and we were we were late"))).toBe(3);
  });

  // An opening on "so" or "um", and pause words in the first ten words
  it("reads the opening", () => {
    // A filler start and a clean one
    expect([openingSignals(words("so um basically the answer is yes")), openingSignals(words("The answer is yes")), openingSignals([])]).toEqual([{ startsWithFiller: 1, first10Fillers: 3 }, { startsWithFiller: 0, first10Fillers: 0 }, null]);
  });

  // A trailing ending, a clean one, and nothing said
  it("reads the closing", () => {
    // "and yeah", a pause word last, a clean ending, and nothing
    expect([weakEnding(words("that was my weekend and yeah")), weakEnding(words("so that is why um")), weakEnding(words("that is why it matters")), weakEnding([])]).toEqual([1, 1, 0, null]);
  });

  // Pronouns per 100 words, leaving out the "you" of "you know"
  it("counts pronouns per 100 words", () => {
    // Ten words: I, my (2 of 10) and you once ("you know" left out)
    const said = words("I told my team you know that you were right");
    // Confirm the three rates
    expect([pronounRate(said, "i"), pronounRate(said, "we"), pronounRate(said, "you")]).toEqual([20, 0, 10]);
  });

  // Every measure is present, even with no words
  it("returns every measure, empty for no words", () => {
    // Nothing said
    const measures = languageMeasures([], new Set());
    // Confirm the keys and that they are empty
    expect([Object.keys(measures).length, Object.values(measures).every((value) => value === null)]).toEqual([13, true]);
  });
});
