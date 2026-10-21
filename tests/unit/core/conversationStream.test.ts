// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the helpers being checked
import { decodeEvent, encodeEvent, firstPiece, firstSentenceEnd, readStreamed, restAfter, splitLines } from "@/core/conversationStream";
// Load the line tidier
import { cleanLine } from "@/core/conversationTurn";

// Group the checks about reading the writer's streamed text (decision 102)
describe("readStreamed", () => {
  // The header is read once its line is complete; until then nothing is known
  it("reads the goodbye header, then the line", () => {
    // Each stage of arrival
    expect([readStreamed("good"), readStreamed("goodbye: n"), readStreamed("goodbye: no\nOh hi"), readStreamed("Goodbye: YES\nSee you!")]).toEqual([
      { ready: false, goodbye: false, body: "" },
      { ready: false, goodbye: false, body: "" },
      { ready: true, goodbye: false, body: "Oh hi" },
      { ready: true, goodbye: true, body: "See you!" },
    ]);
  });

  // A reply without the header is a line that does not say goodbye
  it("reads a line without a header", () => {
    // No header
    expect(readStreamed("Oh hi! I'm Maya.")).toEqual({ ready: true, goodbye: false, body: "Oh hi! I'm Maya." });
  });
});

// Group the checks about cutting the first sentence
describe("firstSentenceEnd", () => {
  // Cut once the sentence is complete and more follows; directions and very short sentences are not cut
  it("finds the first sentence once more text follows", () => {
    // Each case
    expect([firstSentenceEnd("Oh hi there, I'm Maya."), firstSentenceEnd("Oh hi there, I'm Maya. I"), firstSentenceEnd("Oh. Hi there, I'm Maya. So"), firstSentenceEnd("[laughs. softly] No way, really? Tell me")]).toEqual([null, 22, 23, 32]);
  });
});

// Group the checks about the pieces said
describe("firstPiece and restAfter", () => {
  // The first piece keeps only allowed directions; the rest is the whole line after it, checked with the whole line
  it("splits a line into two pieces with the same checks as a whole line", () => {
    // The body
    const body = "[laughs] No way, you climb? [winks] I tried once and fell off.";
    // The first piece
    const first = firstPiece(body, firstSentenceEnd(body)!)!;
    // The rest
    const rest = restAfter(cleanLine(body), first);
    // The directions kept or dropped, and the words to show
    expect([first, rest]).toEqual([{ spoken: "[laughs] No way, you climb?", shown: "No way, you climb?" }, { spoken: "I tried once and fell off.", shown: "I tried once and fell off." }]);
  });

  // A whole line over the length limit is cut at a sentence, so the rest stops there too
  it("keeps the length limit across the pieces", () => {
    // A long line
    const body = `Well that is lovely. ${"I really do think so. ".repeat(20)}`;
    // The pieces
    const first = firstPiece(body, firstSentenceEnd(body)!)!;
    // The rest
    const rest = restAfter(cleanLine(body), first)!;
    // Together within the limit
    expect([`${first.spoken} ${rest.spoken}`.length <= 280, rest.spoken.endsWith(".")]).toEqual([true, true]);
  });

  // A first sentence over the limit is not said alone; a piece of only directions is not said
  it("refuses pieces that should not be said alone", () => {
    // A long first sentence
    const long = `${"word ".repeat(70)}end. More`;
    // Each case
    expect([firstPiece(long, long.indexOf(".") + 1), firstPiece("[sighs] [pause] . more", 16), restAfter({ spoken: "Hi there you.", shown: "Hi there you." }, { spoken: "Something else.", shown: "Something else." })]).toEqual([null, null, null]);
  });
});

// Group the checks about the stream's lines
describe("stream events", () => {
  // Events go out one per line and come back the same; a part line waits for the rest; junk is ignored
  it("encodes and decodes events across chunk boundaries", () => {
    // Two events
    const text = encodeEvent({ type: "segment", index: 0, text: "Hi.", audio: null }) + encodeEvent({ type: "done", text: "Hi.", goodbye: false });
    // Split mid-way
    const first = splitLines(text.slice(0, 20));
    // Then the rest
    const second = splitLines(first.rest + text.slice(20));
    // Read back
    expect([first.lines, second.lines.map(decodeEvent), second.rest, decodeEvent("{\"type\":\"other\"}"), decodeEvent("not json")]).toEqual([[], [{ type: "segment", index: 0, text: "Hi.", audio: null }, { type: "done", text: "Hi.", goodbye: false }], "", null, null]);
  });
});
