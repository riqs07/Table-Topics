// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { alignFromDevice, alignFromScript, alignFromServer, alignFromText, cleanWord, voicedSpans } from "@/core/wordAlign";
// Load the made-up takes
import { makeTake, ZOO_PHRASES } from "../../support/pitchTake";

// The zoo story, made up so every word's true time is known
const take = makeTake(ZOO_PHRASES);

// Group the checks on placing words in time (decision 111)
describe("word alignment", () => {
  // The deeper analysis's words keep their exact times and punctuation
  it("keeps the service's exact times", () => {
    // Placed
    const placed = alignFromServer(take.serverWords);
    // Exact, punctuated, and the same times
    expect([placed.precision, placed.punctuated, placed.words[2]]).toEqual(["exact", true, { text: "Saturday", w: "saturday", start: take.serverWords[2]!.s, end: take.serverWords[2]!.e, ref: 2 }]);
  });

  // The phone's first-heard times run late; moved back by the estimated lag and snapped to the voice, they land within a word of the truth
  it("places the phone's words roughly, correcting the lag", () => {
    // Placed from the phone's times and the loudness
    const placed = alignFromDevice(take.transcript, take.spokenTimes, take.loudness, 100);
    // How far each start is from the truth
    const errors = placed.words.map((word) => Math.abs(word.start - take.serverWords[word.ref]!.s));
    // Rough, every word placed, and each start within a third of a second (most exactly)
    expect([placed.precision, placed.words.length, Math.max(...errors) <= 0.31, errors.filter((error) => error < 0.05).length >= 30]).toEqual(["rough", 40, true, true]);
  });

  // The first word after a pause is placed where its voice starts, not in the silence before it
  it("snaps a word after a pause to the voice", () => {
    // Placed
    const placed = alignFromDevice(take.transcript, take.spokenTimes, take.loudness, 100);
    // "Then", after the 1.1-second pause
    const then = placed.words.find((word) => word.w === "then")!;
    // At its true start
    expect(then.start).toBeCloseTo(take.serverWords[then.ref]!.s, 1);
  });

  // Without loudness, the usual lag is used and nothing is snapped
  it("uses the usual lag without loudness", () => {
    // Placed with no loudness
    const placed = alignFromDevice("hello there", [1.2, 1.6], [], 100);
    // Each word a word's time before its stamp, then moved back by 0.6 seconds
    expect(placed.words.map((word) => word.start)).toEqual([0.3, 0.7]);
  });

  // A reading places only the script words that were read, keeping their numbers in the script
  it("places a script's read words by number", () => {
    // Three words, the middle one never read
    const placed = alignFromScript(["Ask", "not", "what."], [1, null, 1.6], [], 100);
    // Two words, numbered as in the script, punctuated
    expect([placed.words.map((word) => [word.text, word.ref]), placed.punctuated]).toEqual([[["Ask", 0], ["what.", 2]], true]);
  });

  // A short line with no times is spread across the voiced time by word length
  it("spreads a line without times over the voice", () => {
    // Half a second of quiet, a second of voice, then quiet
    const levels = [...Array(5).fill(0.01), ...Array(10).fill(0.2), ...Array(5).fill(0.01)];
    // Placed
    const placed = alignFromText("We did it.", levels, 100, 2);
    // From the voice's start to its end, in order
    expect(placed.words.map((word) => [word.w, word.start, word.end])).toEqual([["we", 0.5, 0.83], ["did", 0.83, 1.17], ["it", 1.17, 1.5]]);
  });

  // Where the voice was, with short silences joined over
  it("finds the voiced stretches", () => {
    // Voice, one quiet reading, voice, a long silence, voice
    const levels = [0.2, 0.2, 0.01, 0.2, 0.01, 0.01, 0.01, 0.01, 0.2, 0.2];
    // Two stretches
    expect(voicedSpans(levels, 100)).toEqual([{ start: 0, end: 0.4 }, { start: 0.8, end: 1 }]);
  });

  // Words are cleaned the way the analysis cleans them
  it("cleans words", () => {
    // Punctuation, capitals and curly apostrophes
    expect(["Saturday,", "Don’t", "“me.”"].map(cleanWord)).toEqual(["saturday", "don't", "me"]);
  });
});
