// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the live reading tools being checked
import { followReading, readingTokens, scriptWords, scrollGuide, stampFirstRead, stampSpoken, type ReadingToken } from "@/core/liveReading";

// The words of a token list, with their word numbers, for short checks
const wordsOf = (tokens: ReadingToken[]) => tokens.flatMap((token) => (token.kind === "text" && token.word !== null ? [`${token.word}:${token.text}`] : []));

// Group the checks about splitting a script into words that can be lit up
describe("readingTokens", () => {
  // Words are numbered in order; pause marks become pause tokens; stressed words keep their style
  it("numbers the words and keeps pause marks and stress", () => {
    // A text with a pause mark and a stressed word
    const tokens = readingTokens("One two / three *four* five");
    // Confirm the numbered words, one pause, and the stressed word
    expect([wordsOf(tokens), tokens.filter((token) => token.kind === "pause").length, tokens.find((token) => token.kind === "text" && token.text === "four")]).toEqual([["0:One", "1:two", "2:three", "3:four", "4:five"], 1, { kind: "text", text: "four", style: "stress", word: 3 }]);
  });

  // Stage directions in brackets are shown but not expected to be read
  it("does not number words in stage directions", () => {
    // A text with a direction
    const tokens = readingTokens("Hello [smile] there");
    // Confirm only the spoken words are numbered
    expect(wordsOf(tokens)).toEqual(["0:Hello", "1:there"]);
  });

  // A dash between words splits them, as the reading check does
  it("splits words joined by a dash", () => {
    // Confirm two words
    expect(wordsOf(readingTokens("dedicate—we can"))).toEqual(["0:dedicate—", "1:we", "2:can"]);
  });

  // The words to listen for are the numbered words, normalised
  it("lists the words to listen for in lower case without punctuation", () => {
    // Confirm the normalised words
    expect(scriptWords(readingTokens("Four score, and *seven* [pause] years."))).toEqual(["four", "score", "and", "seven", "years"]);
  });
});

// Group the checks about following a reader through the script
describe("followReading", () => {
  // The opening of the Gettysburg Address, for most checks
  const EXPECTED = ["four", "score", "and", "seven", "years", "ago", "our", "fathers", "brought", "forth"];

  // Words read in order move the place along
  it("moves along as words are read", () => {
    // Confirm three words read and the place at the fourth
    expect(followReading(EXPECTED, "Four score and")).toEqual({ read: [true, true, true, false, false, false, false, false, false, false], next: 3 });
  });

  // A skipped word is passed over without stopping
  it("passes over a skipped word", () => {
    // Confirm "score" is not read but the place moves on
    expect(followReading(EXPECTED, "four and seven").read.slice(0, 4)).toEqual([true, false, true, true]);
  });

  // Fillers and added words do not move the place
  it("ignores fillers and added words", () => {
    // Confirm the place after "score"
    expect(followReading(EXPECTED, "um four uh score").next).toBe(2);
  });

  // A common word far ahead does not make the place jump
  it("does not jump to a lone word far ahead", () => {
    // Twenty words, with "the" only at the end
    const expected = [...Array.from({ length: 19 }, (_, index) => `w${index}`), "the"];
    // Confirm the place stays near the start
    expect(followReading(expected, "w0 w1 the").next).toBe(2);
  });

  // After skipping a whole line, two words in a row find the place again
  it("finds the place again after a skipped line", () => {
    // Twenty distinct words
    const expected = Array.from({ length: 20 }, (_, index) => `w${index}`);
    // Read the first two, skip to the fifteenth
    expect(followReading(expected, "w0 w1 w14 w15").next).toBe(16);
  });
});

// Group the checks about noting when words were first heard
describe("word times", () => {
  // A script word keeps the time it was first read, even if a later guess drops and re-adds it
  it("keeps the first time each script word was read", () => {
    // First update at 1.0 seconds: two words read
    const first = stampFirstRead([null, null, null], [true, true, false], 1);
    // Later at 2.5 seconds: the first word dropped, the third read
    expect(stampFirstRead(first, [false, true, true], 2.5)).toEqual([1, 1, 2.5]);
  });

  // Spoken word positions keep the time they first appeared, and only grow
  it("keeps the time each spoken word first appeared", () => {
    // Two words at 0.5 seconds, then four at 1.2
    expect(stampSpoken(stampSpoken([], 2, 0.5), 4, 1.2)).toEqual([0.5, 0.5, 1.2, 1.2]);
  });

  // The scroll guide moves on at about 2.3 words a second of speaking, never more than 30 words ahead, and stays within the text
  it("moves the scroll guide on at a reading pace, within limits", () => {
    // Two seconds, a long time, the end of the text, and an empty text
    expect([scrollGuide(10, 2, 200), scrollGuide(10, 60, 200), scrollGuide(195, 10, 200), scrollGuide(0, 5, 0)]).toEqual([14, 40, 199, 0]);
  });
});
