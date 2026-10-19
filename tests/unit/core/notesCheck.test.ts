// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the comparison being checked
import { compareNotes } from "@/core/notesCheck";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// Notes with the given tags
const notes = (...tags: string[]) => ({ selfReview: { worked: "", change: "", tags, skipped: false, savedAt: "2026-10-16T10:00:00.000Z" } });

// Group the checks about notes against the numbers
describe("compareNotes", () => {
  // No notes, or a skip, means nothing to compare
  it("says nothing without notes", () => {
    // Confirm for no notes and a skip
    expect([compareNotes(makeSession()), compareNotes(makeSession({ selfReview: { worked: "", change: "", tags: ["fillers"], skipped: true, savedAt: "" } }))]).toEqual([[], []]);
  });

  // A note that matches the numbers says so
  it("agrees when you were right about speed", () => {
    // Tagged too fast at 182 words a minute
    expect(compareNotes(makeSession({ wordsPerMinute: 182, fillersPerMinute: 0, ...notes("too-fast") }))).toEqual([{ kind: "matched", text: "You said too fast, and it was: 182 words a minute (a comfortable pace is about 120 to 160)." }]);
  });

  // A note the numbers do not bear out says so, kindly
  it("differs when the numbers say otherwise", () => {
    // Tagged too fast at 135 words a minute
    expect(compareNotes(makeSession({ wordsPerMinute: 135, fillersPerMinute: 0, ...notes("too-fast") }))[0]?.kind).toBe("differed");
  });

  // A measured problem you did not mention is pointed out
  it("points out many fillers you did not mention", () => {
    // Tagged only a good pace, with 4.2 pause words a minute
    expect(compareNotes(makeSession({ wordsPerMinute: 140, fillersPerMinute: 4.2, ...notes("good-pace") }))).toEqual([
      { kind: "matched", text: "You said good pace, and it was: 140 words a minute." },
      { kind: "missed", text: "You did not mention pause words: 4.2 a minute were counted." },
    ]);
  });

  // Pauses are compared only when loudness was recorded
  it("compares pauses with the loudness readings", () => {
    // Steady speech with no silences
    const loudness = new Array<number>(300).fill(0.5);
    // Confirm the match
    expect(compareNotes(makeSession({ wordsPerMinute: 140, fillersPerMinute: 0, loudness, ...notes("no-pauses") }))[0]).toEqual({ kind: "matched", text: "You said not enough pauses, and there were none longer than 0.6 seconds." });
  });
});
