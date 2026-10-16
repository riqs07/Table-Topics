// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the filler counter being checked
import { countFillers, countScriptFillers, markFillers } from "@/core/fillers";

// Group the checks about counting filler words
describe("countFillers", () => {
  // A transcript with no fillers should count zero
  it("counts zero when there are no fillers", () => {
    // Count fillers in a clean sentence
    const result = countFillers("I went to the store and bought bread.");
    // Confirm nothing was counted
    expect(result.total).toBe(0);
  });

  // Hesitation sounds are the headline fillers
  it("counts um and uh regardless of capitals or punctuation", () => {
    // Count fillers in a sentence with mixed capitals and commas
    const result = countFillers("Um, I think, uh, we should UM go.");
    // Confirm all three were counted
    expect(result.total).toBe(3);
    // Confirm the per-filler tally groups them by their standard spelling
    expect(result.byFiller).toEqual({ um: 2, uh: 1 });
  });

  // Speech engines spell drawn-out sounds with extra letters
  it("treats stretched spellings like ummm and uhhh as the same filler", () => {
    // Count fillers spelled with extra letters
    const result = countFillers("Ummm uhhh hmmm erm");
    // Confirm each stretched spelling maps to its standard form
    expect(result.byFiller).toEqual({ um: 1, uh: 1, hmm: 1, er: 1 });
  });

  // Fillers that are more than one word must match as a phrase
  it("counts multi-word fillers like 'you know' and 'kind of'", () => {
    // Count fillers in a sentence with phrase fillers
    const result = countFillers("It was, you know, kind of hard. You know?");
    // Confirm each phrase was counted the right number of times
    expect(result.byFiller).toEqual({ "you know": 2, "kind of": 1 });
  });

  // A filler hidden inside a longer word must not count
  it("does not count fillers that are only part of a longer word", () => {
    // Count fillers in words that contain filler letters
    const result = countFillers("The umbrella was humming and likeable.");
    // Confirm nothing was counted
    expect(result.total).toBe(0);
  });

  // "like" counts, as chosen at checkpoint C7
  it("counts 'like' as a filler", () => {
    // Count fillers in a sentence that uses "like" as filler
    const result = countFillers("It was like big like huge");
    // Confirm both uses were counted
    expect(result.byFiller).toEqual({ like: 2 });
  });

  // C7 (2026-10-13): every common filler counts, including crutch words and hedging phrases
  it("counts the full filler list chosen at C7", () => {
    // A sentence full of crutch words and hedges
    const result = countFillers("So, well, I guess it was just really okay, you know what I mean? Mm.");
    // Confirm each was counted once, with the longest phrase winning
    expect(result.byFiller).toEqual({ so: 1, well: 1, "i guess": 1, just: 1, really: 1, okay: 1, "you know what i mean": 1, mm: 1 });
  });

  // Crutch words in their ordinary sense do not count (decision 29 trims the C7 list)
  it("does not count crutch words used in their ordinary sense", () => {
    // Ordinary uses of really, like, so, just and well
    const result = countFillers("I really like it. It was so good that we stayed, just as we planned, and it went well.");
    // Confirm nothing was counted
    expect(result.total).toBe(0);
  });

  // A crutch word counts at the start of a sentence, next to another filler, or doubled
  it("counts crutch words where they act as fillers", () => {
    // Start of speech, after a sound, at a new sentence, and doubled
    const result = countFillers("So we left. Um so then. Well, it was like like a dream");
    // Confirm each
    expect(result.byFiller).toEqual({ so: 2, um: 1, well: 1, like: 2 });
  });

  // "like" counts unless it follows a word that makes it a verb or a comparison
  it("tells filler like from the verb", () => {
    // Confirm "I like" and "feels like" are not counted but "was like" is
    expect([countFillers("I like it").total, countFillers("it feels like home").total, countFillers("it was like huge").total]).toEqual([0, 0, 1]);
  });

  // Empty input happens when nothing was heard
  it("handles an empty transcript", () => {
    // Count fillers in an empty string
    const result = countFillers("");
    // Confirm the result is empty and zero
    expect(result).toEqual({ total: 0, byFiller: {} });
  });
});

// Group the checks about marking fillers inside a transcript for display
describe("markFillers", () => {
  // The pieces join back to exactly the original text
  it("keeps the original text, split into marked and unmarked pieces", () => {
    // A transcript with two fillers
    const text = "Um, I think, you know, it went fine.";
    // Split it
    const pieces = markFillers(text);
    // Confirm nothing was lost or changed
    expect(pieces.map((piece) => piece.text).join("")).toBe(text);
    // Confirm the marked pieces
    expect(pieces.filter((piece) => piece.filler).map((piece) => piece.text)).toEqual(["Um", "you know"]);
  });

  // Marking follows the same rules as counting: ordinary uses stay unmarked
  it("does not mark crutch words used in their ordinary sense", () => {
    // Confirm nothing is marked
    expect(markFillers("I really like it, so much").some((piece) => piece.filler)).toBe(false);
  });

  // Words that only contain filler letters are not marked
  it("does not mark parts of longer words", () => {
    // Confirm nothing is marked in "umbrella"
    expect(markFillers("The umbrella").some((piece) => piece.filler)).toBe(false);
  });
});

// Group the checks about fillers in a reading of a known text
describe("countScriptFillers", () => {
  // Words that are part of the text never count, even crutch words
  it("does not count crutch words that are in the text", () => {
    // Read exactly as written
    expect(countScriptFillers("conceived and so dedicated, can long endure", "conceived and so dedicated can long endure")).toBe(0);
  });

  // Words added to the text count if they are fillers, crutch words included
  it("counts fillers added to the text", () => {
    // An added "um" and an added "so"
    expect(countScriptFillers("Four score and seven years ago", "um four score and so seven years ago")).toBe(2);
  });
});
