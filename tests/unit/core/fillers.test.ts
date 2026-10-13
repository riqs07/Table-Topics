// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the filler counter being checked
import { countFillers, markFillers } from "@/core/fillers";

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
    const result = countFillers("Ummm well uhhh hmmm erm");
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

  // "like" is counted for now; the approved list is decided at checkpoint C7
  it("counts 'like' as a filler in the default list", () => {
    // Count fillers in a sentence that uses "like" as filler
    const result = countFillers("It was like really like big");
    // Confirm both uses were counted
    expect(result.byFiller).toEqual({ like: 2 });
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
    const text = "Um, so I think, you know, it went well.";
    // Split it
    const pieces = markFillers(text);
    // Confirm nothing was lost or changed
    expect(pieces.map((piece) => piece.text).join("")).toBe(text);
    // Confirm the marked pieces
    expect(pieces.filter((piece) => piece.filler).map((piece) => piece.text)).toEqual(["Um", "you know"]);
  });

  // Words that only contain filler letters are not marked
  it("does not mark parts of longer words", () => {
    // Confirm nothing is marked in "umbrella"
    expect(markFillers("The umbrella").some((piece) => piece.filler)).toBe(false);
  });
});
