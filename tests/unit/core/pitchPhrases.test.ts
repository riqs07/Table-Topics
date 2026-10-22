// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { curveLines, describePhrase, highestPoint, isContentWord, layoutWords, stretchPoints, phraseNote, pitchSummary, pitchWords, rowPoints, splitPhrases, textLift, xForTime, yForStep, type PitchWords } from "@/core/pitchPhrases";
// Load the word placement
import { alignFromDevice, alignFromServer, type AlignedWord } from "@/core/wordAlign";
// Load the made-up takes
import { makeTake, ZOO_PHRASES } from "../../support/pitchTake";

// The zoo story with exact word times
const take = makeTake(ZOO_PHRASES);
// Worked out from the service's words
const exact = pitchWords({ pitch: take.pitch, alignment: alignFromServer(take.serverWords), tickMs: 100 }) as PitchWords;
// And from the phone's own times
const rough = pitchWords({ pitch: take.pitch, alignment: alignFromDevice(take.transcript, take.spokenTimes, take.loudness, 100), tickMs: 100 }) as PitchWords;

// A word at a time, for splitting checks
const word = (text: string, start: number, end: number): AlignedWord => ({ text, w: text.toLowerCase().replace(/[^a-z']/g, ""), start, end, ref: 0 });

// Group the checks on phrases (decision 111)
describe("phrases", () => {
  // With punctuation, phrases end at the service's clause marks
  it("splits on punctuation when the words have it", () => {
    // Five phrases, as said
    expect(exact.phrases.map((phrase) => phrase.words.map((item) => item.text).join(" "))).toEqual(["So last Saturday I went to the zoo.", "I bought a hot dog,", "and a seagull stole it right out of my hand.", "Then the gorilla just stared at me.", "Since then I always eat before I see the gorilla."]);
  });

  // Without punctuation, phrases end at pauses of 300 ms or more
  it("splits on pauses without punctuation", () => {
    // The same five phrases from the phone's words
    expect([rough.precision, rough.phrases.map((phrase) => phrase.words.length)]).toEqual(["rough", [8, 5, 10, 7, 10]]);
    // A short gap does not split, a 0.3 s gap does
    expect(splitPhrases([word("one", 0, 0.3), word("two", 0.4, 0.7), word("three", 1, 1.3)], false).map((phrase) => phrase.length)).toEqual([2, 1]);
  });

  // A long run with no pause is split at a clause word near its middle
  it("splits long phrases at a clause word", () => {
    // Fourteen words, "because" in the middle
    const words = "we kept going all the way to the end because nobody wanted to stop".split(" ").map((text, index) => word(text, index * 0.3, index * 0.3 + 0.3));
    // Two parts, cut before "because"
    expect(splitPhrases(words, false).map((phrase) => phrase[0]!.text)).toEqual(["we", "because"]);
  });

  // Each phrase's ending is read as fell, held or rose with the take's own rule
  it("reads each phrase's ending", () => {
    // Fell, held (the comma), fell, rose, held
    expect(exact.phrases.map((phrase) => phrase.ending)).toEqual(["fell", "held", "fell", "rose", "held"]);
  });

  // A statement that rises is marked; a question that rises is not
  it("marks rising statements but not questions", () => {
    // Only "me." rises as a statement
    expect(exact.phrases.map((phrase) => phrase.risingStatement)).toEqual([false, false, false, true, false]);
    // A question rising
    const asked = makeTake([{ words: [{ text: "Did" , step: 0 }, { text: "you", step: 0 }, { text: "finish", step: 0 }, { text: "it?", step: 1, to: 5 }], pauseAfter: 0.3 }]);
    // Worked out
    const question = pitchWords({ pitch: asked.pitch, alignment: alignFromServer(asked.serverWords), tickMs: 100 })!;
    // Rose, but a question
    expect([question.phrases[0]!.ending, question.phrases[0]!.question, question.phrases[0]!.risingStatement]).toEqual(["rose", true, false]);
  });

  // Each word's pitch is the middle of its readings; the peak is in the top band of its phrase
  it("gives each word its pitch and finds the peaks", () => {
    // The peak words
    expect(exact.phrases.map((phrase) => phrase.words.filter((item) => item.peak).map((item) => item.text))).toEqual([["Saturday"], ["hot"], ["stole"], ["me."], []]);
    // "stole" sits about six steps up
    expect(exact.phrases[2]!.words[3]!.step).toBeGreaterThan(5);
  });

  // A phrase that stays within two steps and neither rises nor falls is flat
  it("marks flat phrases", () => {
    // Only the last
    expect(exact.phrases.map((phrase) => phrase.flat)).toEqual([false, false, false, false, true]);
  });

  // The pause before each phrase is measured
  it("measures the pauses between phrases", () => {
    // As made
    expect(exact.phrases.map((phrase) => phrase.pauseBefore)).toEqual([null, 0.8, 0.3, 1.1, 0.6]);
  });

  // Too little voice: nothing is drawn
  it("draws nothing for a whisper or a silent take", () => {
    // Three voiced readings only
    expect(pitchWords({ pitch: [null, 200, 200, 200, null], alignment: alignFromServer(take.serverWords.slice(0, 1)), tickMs: 100 })).toBeNull();
  });

  // One word is one phrase, with no peak (a peak needs other words to stand above)
  it("handles a single word", () => {
    // One long word, said slowly so there is enough voice
    const said = makeTake([{ words: [{ text: "Absolutely.", step: 0, to: -3 }], pauseAfter: 0.5 }]);
    // Worked out, the word stretched over twice the readings
    const result = pitchWords({ pitch: said.pitch.flatMap((reading) => [reading, reading]), alignment: { ...alignFromServer(said.serverWords), words: alignFromServer(said.serverWords).words.map((item) => ({ ...item, start: item.start * 2, end: item.end * 2 })) }, tickMs: 100 })!;
    // One phrase, one word, no peak
    expect([result.phrases.length, result.phrases[0]!.words.length, result.phrases[0]!.top]).toEqual([1, 1, null]);
  });

  // No words: no phrases, but the readings are still there for a plain curve
  it("handles no words", () => {
    // Worked out with no words
    const result = pitchWords({ pitch: take.pitch, alignment: { words: [], precision: "rough", punctuated: false }, tickMs: 100 })!;
    // No phrases, the readings kept
    expect([result.phrases.length, result.steps.length]).toEqual([0, take.pitch.length]);
  });
});

// Group the checks on what is said about the phrases
describe("phrase notes and summary", () => {
  // Notes only where useful: a clear peak on a key word, a rising statement, a flat phrase
  it("writes a note only where useful", () => {
    // One per phrase, or none
    expect(exact.phrases.map((phrase) => phraseNote(phrase)?.text ?? null)).toEqual(["Your highest point landed on “Saturday”, a key word.", null, "Your highest point landed on “stole”, a key word.", "Went up at the end of a statement, so it sounds like a question. Try letting “me” drop.", "Fairly flat. Lift one word, like “gorilla”."]);
  });

  // Each curve has a plain description for screen readers
  it("describes each curve", () => {
    // In order
    expect(exact.phrases.map(describePhrase)).toEqual(["Pitch rises on “Saturday”, then falls at the end.", "Pitch rises on “hot”, then holds level at the end, like a comma.", "Pitch rises on “stole”, then falls at the end.", "Pitch rises at the end.", "Pitch stays almost flat through the phrase."]);
  });

  // Up to three plain lines, things to work on first
  it("sums up in up to three lines", () => {
    // The lines as text
    const lines = pitchSummary(exact.phrases).map((line) => [line.kind, line.tone, line.parts.map((part) => (part.strong ? `*${part.text}*` : part.text)).join("")]);
    // Rising, flat, then the peaks
    expect(lines).toEqual([["rising", "work", "“me” went up at the end of a statement, so it sounds unsure."], ["flat", "flat", "The last line stayed flat, shown in grey. Lift one word to end with energy."], ["peaks", "good", "Your peaks landed on *Saturday*, *hot* and *stole*: words that carry the meaning."]]);
  });

  // Mostly low endings with none rising is a strength
  it("says when statements end low", () => {
    // Four phrases that fall
    const falling = makeTake(Array.from({ length: 4 }, () => ({ words: [{ text: "We", step: 0 }, { text: "start", step: 3 }, { text: "today.", step: 0, to: -4 }], pauseAfter: 0.5 })));
    // Worked out
    const result = pitchWords({ pitch: falling.pitch, alignment: alignFromServer(falling.serverWords), tickMs: 100 })!;
    // The strength is said
    expect(pitchSummary(result.phrases).map((line) => line.kind)).toContain("ends");
  });

  // Content words carry meaning; small words and sounds do not
  it("tells content words from small words", () => {
    // Checked
    expect(["stole", "the", "um", "gorilla", "i"].map(isContentWord)).toEqual([true, false, false, true, false]);
  });
});

// Group the checks on laying words out under a curve
describe("layout", () => {
  // Words that fit share a row; spare room follows how long each word took; a long phrase wraps
  it("lays words out in rows without overlap", () => {
    // Each letter 8 pixels
    const measure = (text: string) => text.length * 8;
    // Three words, the middle one long in time
    const words = [{ text: "and", start: 0, end: 0.2 }, { text: "stole", start: 0.2, end: 1.2 }, { text: "it", start: 1.2, end: 1.4 }];
    // Wide enough for all
    const rows = layoutWords(words, 200, measure);
    // One row; "stole" gets most of the spare room
    expect(rows).toEqual([{ slots: [{ index: 0, left: 0, width: 39.7 }, { index: 1, left: 44.7, width: 118.6 }, { index: 2, left: 168.3, width: 31.7 }] }]);
    // Too narrow: wrapped
    expect(layoutWords(words, 60, measure).map((row) => row.slots.map((slot) => slot.index))).toEqual([[0], [1], [2]]);
  });

  // A moment maps across the row through each word's slot
  it("places moments across a row", () => {
    // Two words side by side
    const words = [{ start: 0, end: 1 }, { start: 1.5, end: 2 }];
    // Their slots
    const slots = [{ index: 0, left: 0, width: 100 }, { index: 1, left: 110, width: 50 }];
    // Half way through the first, in the gap, and past the end
    expect([xForTime(0.5, slots, words), xForTime(1.25, slots, words), xForTime(9, slots, words)]).toEqual([50, 105, 160]);
  });

  // Points follow the readings, with gaps where there was no voice, and stay inside the picture
  it("turns readings into points", () => {
    // One word over three readings, the middle one silent
    const points = rowPoints([0, null, 20], 100, [{ index: 0, left: 0, width: 100 }], [{ start: 0, end: 0.2 }]);
    // A point, a gap, a point held inside the picture
    expect(points).toEqual([{ x: 0, y: 34 }, null, { x: 100, y: 4 }]);
    // Up is higher pitch
    expect(yForStep(2)).toBeLessThan(yForStep(0));
  });

  // Words lift a little in the text view, never so far the lines run into each other
  it("lifts words gently in the text", () => {
    // Up, on the line, and the limits
    expect([textLift(3), textLift(null), textLift(20), textLift(-20)]).toEqual([-6, 0, -12, 8]);
  });
});

// Group the checks on rows ready to draw
describe("curve lines", () => {
  // Words in rows, each with its stretch of curve, and the highest point found
  it("lays a phrase out with its curve", () => {
    // The zoo story's third phrase
    const phrase = exact.phrases[2]!;
    // Laid out at 200 pixels, each letter 9 pixels
    const lines = curveLines(phrase.words, exact.steps, 100, 200, (text) => text.length * 9);
    // More than one row, every word placed once, and the top of the curve over "stole"
    const top = highestPoint(lines.flatMap((line) => line.points));
    // The row with "stole"
    const row = lines.find((line) => line.slots.some((slot) => phrase.words[slot.index]!.text === "stole"))!;
    // Its slot
    const slot = row.slots.find((item) => phrase.words[item.index]!.text === "stole")!;
    // Checked
    expect([lines.length > 1, lines.flatMap((line) => line.slots).length, row.points.some((point) => point !== null && point.y === top!.y), top!.x >= slot.left && top!.x <= slot.left + slot.width]).toEqual([true, 10, true, true]);
    // No points: no highest
    expect(highestPoint([null])).toBeNull();
  });
});

// Group the checks on stretching another voice across a row
describe("stretchPoints", () => {
  // Readings spread evenly over the stretch, only those inside the row kept
  it("spreads another voice's readings across the row", () => {
    // Five readings over two seconds, against a row of the first second
    const points = stretchPoints([0, 1, null, 3, 4], 0, 2, [{ index: 0, left: 0, width: 100 }], [{ start: 0, end: 1 }]);
    // The first three: at 0, 0.5 and 1 second
    expect(points).toEqual([{ x: 0, y: 34 }, { x: 50, y: 29.5 }, null]);
    // Too few readings
    expect(stretchPoints([1], 0, 1, [{ index: 0, left: 0, width: 10 }], [{ start: 0, end: 1 }])).toEqual([]);
  });
});
