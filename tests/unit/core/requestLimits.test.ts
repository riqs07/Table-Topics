// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the limits being checked
import { LONGEST_RECORDING_SECONDS, TRANSCRIPT_MAX_CHARS, withinDuration, withinLimit } from "@/core/requestLimits";
// Load the longest each kind of session runs
import { maxSeconds } from "@/core/recordingRules";

// Group the checks about the limits shared by the app and its server (decision 86)
describe("request limits", () => {
  // The server takes the longest recording any session allows, and a fast talk of that length
  it("covers the longest session", () => {
    // The rehearsal's limit, and room for about 6,000 words of six characters
    expect([LONGEST_RECORDING_SECONDS, LONGEST_RECORDING_SECONDS >= maxSeconds("rehearse"), TRANSCRIPT_MAX_CHARS >= 6000 * 6]).toEqual([1800, true, true]);
  });

  // Text is cut at the last whole word that fits, and short text is left alone
  it("cuts text at a whole word", () => {
    // Cut, cut with no spaces, and left alone
    expect([withinLimit("one two three", 9), withinLimit("abcdefgh", 4), withinLimit("short", 10)]).toEqual(["one two", "abcd", "short"]);
  });

  // A length past the longest is brought down to it
  it("keeps a length within the longest", () => {
    // Over, and under
    expect([withinDuration(2400), withinDuration(95)]).toEqual([1800, 95]);
  });
});
