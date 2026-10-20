// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the limits being checked
import { LONGEST_RECORDING_SECONDS, NOTE_MAX_CHARS, REQUEST_TEXT_MAX_CHARS, TRANSCRIPT_MAX_CHARS, requestTextLength, transcriptRoom, withinDuration, withinLimit } from "@/core/requestLimits";
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

  // Every text part is counted toward the total (decision 87)
  it("counts every piece of text in a request", () => {
    // One character in each place text can go
    expect(requestTextLength({ transcript: "a", previousChange: "b", question: "c", outline: { topic: "d", points: ["e", "f"] }, notes: { worked: "g", change: "h", tags: ["i"] }, conversation: { turns: [{ text: "j" }, {}] } })).toBe(10);
  });

  // The total fits the longest rehearsal with full notes and a previous change, and the transcript gives way when the rest is large
  it("fits the longest rehearsal and makes the transcript give way to the rest", () => {
    // A fast 30-minute rehearsal, full notes and the longest previous change
    const longest = 6000 * 6 + 2 * NOTE_MAX_CHARS + 1_000;
    // Room for the transcript beside nothing, and beside 20,000 characters of turns
    const rooms = [transcriptRoom({}), transcriptRoom({ conversation: { turns: Array.from({ length: 20 }, () => ({ text: "x".repeat(1_000) })) } })];
    // Confirm the longest fits, and the room shrinks to what is left
    expect([longest <= REQUEST_TEXT_MAX_CHARS, rooms]).toEqual([true, [TRANSCRIPT_MAX_CHARS, REQUEST_TEXT_MAX_CHARS - 20_000]]);
  });
});
