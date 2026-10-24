// Every chart, for a week of testing (decision 124): the flow ribbon's stops and pauses, the pace stretch, the voice line's phrase and points, loudness shapes and fades, sentence endings, today against your usual, emphasis, the voice range and progress on the focus, each with the case where it draws nothing
import { describe, expect, it } from "vitest";
// Load the pieces
import { emphasis, flowRibbon, focusProgress, loudShapes, paceStretch, paceStretchLine, sentenceEndings, shapeWorthDrawing, usualRows, voiceLine, voiceLinePhrase, voiceRange, EMPHASIS_WORDS, VOICE_LINE_POINTS } from "@/core/chartTrial";
import { pitchWords } from "@/core/pitchPhrases";
import { alignFromServer } from "@/core/wordAlign";
// Load the made-up takes
import { makeTake, ZOO_PHRASES } from "../../support/pitchTake";
import { makeSession } from "../../support/fixtures";
// Load the types
import type { PaceLens } from "@/core/lenses/paceLens";

// Loudness readings ten a second: speech at a level for some seconds, then silence for some, in turn
function levels(parts: ReadonlyArray<[number, number]>): number[] {
  // Each part's readings
  return parts.flatMap(([seconds, level]) => Array.from({ length: Math.round(seconds * 10) }, () => level));
}

// The zoo story's phrases, from the service's exact words
function zooPhrases() {
  // The take, gliding like a voice
  const take = makeTake(ZOO_PHRASES, { glide: true });
  // Its phrases
  return pitchWords({ pitch: take.pitch, alignment: alignFromServer(take.serverWords), tickMs: 100 })!.phrases;
}

describe("the flow ribbon", () => {
  // Gaps under a second are left as speech
  it("joins speech across short gaps, marks long stops, and marks pauses between thoughts as good ones", () => {
    // Speech, a 0.7 s gap, speech, a 2 s stop, speech, a 1.2 s pause between thoughts, speech
    const ribbon = flowRibbon(levels([[2, 0.3], [0.7, 0.01], [2, 0.3], [2, 0.01], [2, 0.3], [1.2, 0.01], [2, 0.3]]), 100, [{ start: 9.1, end: 10.2 }])!;
    // The pieces
    expect(ribbon.pieces.map((piece) => [piece.kind, piece.start, piece.end])).toEqual([["speech", 0, 4.7], ["stop", 4.7, 6.7], ["speech", 6.7, 8.7], ["pause", 8.7, 9.9], ["speech", 9.9, 11.9]]);
    // The counts and the line
    expect([ribbon.counts, ribbon.line]).toEqual([{ stops: 1, pauses: 1 }, "One long stop (1.5 seconds or more) that wasn’t between thoughts."]);
  });

  // A silence between one and 1.5 seconds that was not between thoughts is left unmarked
  it("leaves an ordinary silence unmarked, and says so when there were no long stops", () => {
    // Speech, a 1.2 s silence, speech
    const ribbon = flowRibbon(levels([[2, 0.3], [1.2, 0.01], [2, 0.3]]), 100, [])!;
    // A gap, not a stop
    expect([ribbon.pieces.map((piece) => piece.kind), ribbon.line]).toEqual([["speech", "gap", "speech"], "No long stops."]);
  });

  // Nothing said
  it("draws nothing for silence", () => {
    // All quiet
    expect(flowRibbon(levels([[3, 0]]), 100, [])).toBeNull();
  });
});

describe("the pace stretch", () => {
  // A lens with a band of 120 to 160
  const lens = (wpms: number[]): PaceLens => ({ phrases: [], line: wpms.map((wpm, t) => ({ t, wpm })), band: { low: 120, high: 160, usual: true }, summary: "" });

  // The longest run outside
  it("finds the longest run outside the band and words it", () => {
    // One second fast, then three seconds slow
    const stretch = paceStretch(lens([140, 170, 140, 100, 100, 100, 140]));
    // The slow run
    expect([stretch, paceStretchLine(stretch)]).toEqual([{ side: "slow", from: 3, to: 5 }, "Slowest around 0:03."]);
    // A fast run, later
    expect(paceStretchLine(paceStretch(lens(Array.from({ length: 80 }, (_, t) => (t > 70 ? 180 : 140)))))).toBe("Rushed most around 1:11.");
  });

  // Inside throughout
  it("says when the pace stayed inside", () => {
    // All usual
    expect([paceStretch(lens([140, 150, 130])), paceStretchLine(null)]).toEqual([null, "You stayed inside your usual pace."]);
  });
});

describe("the voice line", () => {
  // The rising statement is chosen
  it("draws the statement that rose, simplified to a few points, with its words in place", () => {
    // The zoo story
    const phrases = zooPhrases();
    // The phrase chosen
    const phrase = voiceLinePhrase(phrases)!;
    // "Then the gorilla just stared at me." rose
    expect([phrase.risingStatement, phrase.words.at(-1)!.text]).toEqual([true, "me."]);
    // Its line
    const line = voiceLine(phrase)!;
    // A few points, rising at the end, words from 0 along
    expect([line.points.length, line.points.at(-1)!.step > line.points[0]!.step + 2, line.words[0]!.x, line.words.at(-1)!.x < 1]).toEqual([VOICE_LINE_POINTS, true, 0, true]);
  });

  // Without a rising statement, the longest phrase with an ending
  it("falls back to the longest phrase with an ending, and draws nothing without phrases", () => {
    // The story without its rising phrase
    const phrases = zooPhrases().filter((phrase) => !phrase.risingStatement);
    // The longest with an ending
    expect(voiceLinePhrase(phrases)!.words.length).toBe(Math.max(...phrases.filter((phrase) => phrase.ending !== null).map((phrase) => phrase.words.length)));
    // None
    expect(voiceLinePhrase([])).toBeNull();
  });
});

describe("the loudness shapes", () => {
  // One stretch fades
  it("marks a stretch whose last moment drops well below its own average", () => {
    // A steady stretch, then one that drops to a whisper at the end
    const shapes = loudShapes(levels([[2, 0.3], [1, 0.01], [1.7, 0.3], [0.4, 0.12], [1, 0.01]]), 100)!;
    // Two shapes, the second faded
    expect([shapes.shapes.map((shape) => shape.faded), shapes.line]).toEqual([[false, true], "Your last words got quieter in 1 of 2 stretches."]);
    // Scaled to the loudest
    expect(Math.max(...shapes.shapes.flatMap((shape) => shape.points))).toBe(1);
  });

  // Held
  it("says when the volume held, and draws nothing without a second of speech", () => {
    // Steady
    expect(loudShapes(levels([[2, 0.3]]), 100)!.line).toBe("Your volume held to the end of each stretch.");
    // Too short
    expect(loudShapes(levels([[0.5, 0.3], [2, 0]]), 100)).toBeNull();
  });
});

describe("the sentence endings", () => {
  // The zoo story's endings
  it("lists each phrase's ending and counts the falls and rising statements", () => {
    // The endings
    const found = sentenceEndings(zooPhrases())!;
    // "me" rose as a statement
    expect(found.endings.filter((ending) => ending.risingStatement).map((ending) => ending.last)).toEqual(["me"]);
    // The line counts them
    expect(found.line).toMatch(/^\d of \d fell at the end\. One statement rose like a question\.$/);
  });

  // No phrases
  it("draws nothing without phrases", () => {
    // None
    expect(sentenceEndings([])).toBeNull();
  });
});

describe("today against your usual", () => {
  // Earlier Rapid Fire takes at 140 words a minute
  const earlier = Array.from({ length: 6 }, (_, index) => makeSession({ id: `e${index}`, mode: "talk", createdAt: `2026-10-1${index}T09:00:00.000Z`, wordsPerMinute: 140 + index, pitchRange: 8, fillersPerMinute: 2, durationSec: 60 }));

  // Faster than usual
  it("places today against the usual band of the same kind of take, with neutral words", () => {
    // A fast take today
    const today = makeSession({ id: "today", mode: "talk", createdAt: "2026-10-20T09:00:00.000Z", wordsPerMinute: 190, pitchRange: 8, fillersPerMinute: 2, durationSec: 60 });
    // The rows
    const rows = usualRows([...earlier, today], today, true);
    // Pace is outside, the rest inside
    expect(rows.map((row) => [row.name, row.words, row.outside])).toEqual([["Pace", "faster than usual", true], ["Voice movement", "usual", false], ["Pause words", "usual", false], ["Length", "usual", false]]);
    // The dot fits on the bar
    expect(rows[0]!.to).toBeGreaterThan(190);
  });

  // Pause words hidden, other kinds, too few
  it("leaves out pause words when hidden, and draws nothing with too few takes of the kind", () => {
    // Today
    const today = makeSession({ id: "today", mode: "talk", createdAt: "2026-10-20T09:00:00.000Z", wordsPerMinute: 140, pitchRange: 8, durationSec: 60 });
    // No pause words row
    expect(usualRows([...earlier, today], today, false).map((row) => row.name)).not.toContain("Pause words");
    // A reading has no earlier readings
    expect(usualRows([...earlier, today], { ...today, mode: "read" }, true)).toEqual([]);
    // Four earlier takes are too few
    expect(usualRows([...earlier.slice(0, 4), today], today, true)).toEqual([]);
  });
});

describe("emphasis", () => {
  // The story's tops
  it("weights each phrase's top word most and names the highest ones", () => {
    // The zoo story
    const found = emphasis(zooPhrases())!;
    // "stole" is the highest top
    expect(found.line).toMatch(/^You leaned most on “stole”/);
    // Tops weigh 3, small words 0
    expect([found.words.find((word) => word.text === "stole")!.weight, found.words.find((word) => word.text === "the")!.weight]).toEqual([3, 0]);
  });

  // A long take is cut short
  it("shows at most its word limit, and nothing without phrases", () => {
    // The story told eight times
    const take = makeTake(Array.from({ length: 8 }, () => ZOO_PHRASES).flat(), { glide: true });
    // Its emphasis
    const found = emphasis(pitchWords({ pitch: take.pitch, alignment: alignFromServer(take.serverWords), tickMs: 100 })!.phrases)!;
    // Cut short
    expect([found.words.length, found.more]).toEqual([EMPHASIS_WORDS, true]);
    // Nothing
    expect(emphasis([])).toBeNull();
  });
});

describe("the voice range and the shape's length rule", () => {
  // Against the usual
  it("words today's range against the usual, and draws nothing without both", () => {
    // Half
    expect(voiceRange(4, 8)!.line).toBe("Your voice moved about half as much as usual. It may have sounded flatter.");
    // Three quarters
    expect(voiceRange(5.5, 8)!.line).toBe("Your voice moved about three quarters as much as usual. It may have sounded flatter.");
    // More
    expect(voiceRange(11, 8)!.line).toBe("Your voice moved more than usual. It may have sounded livelier.");
    // About the same
    expect(voiceRange(8.5, 8)!.line).toBe("Your voice moved about as much as usual.");
    // Missing either
    expect([voiceRange(undefined, 8), voiceRange(8, null)]).toEqual([null, null]);
  });

  // Thirty seconds
  it("draws the shape of the take from 30 seconds", () => {
    // Under and at
    expect([shapeWorthDrawing(29), shapeWorthDrawing(30)]).toEqual([false, true]);
  });
});

describe("progress on the focus", () => {
  // Pause words falling
  it("lines up the focus's number over the latest takes, with where you started", () => {
    // Twelve takes, pause words falling from 6 to 0.5
    const takes = Array.from({ length: 12 }, (_, index) => makeSession({ id: `p${index}`, mode: "talk", focus: "cut-fillers", createdAt: `2026-10-${String(index + 10).padStart(2, "0")}T09:00:00.000Z`, fillersPerMinute: Math.max(0.5, 6 - index * 0.5) }));
    // The progress on the last
    const progress = focusProgress(takes, takes.at(-1)!)!;
    // Ten values, ending on this take, the band from the first takes
    expect([progress.values.length, progress.values.at(-1), progress.start.low > 3, progress.line]).toEqual([10, 0.5, true, "Pause words a minute: 5.0 → 0.5 over your last 10 takes."]);
  });

  // No focus number: pace; too few takes: nothing
  it("uses pace when the focus has no number, and draws nothing with too few takes", () => {
    // Three takes with a focus that has no number
    const takes = Array.from({ length: 3 }, (_, index) => makeSession({ id: `q${index}`, mode: "talk", focus: "openings", createdAt: `2026-10-1${index}T09:00:00.000Z`, wordsPerMinute: 130 + index }));
    // Pace
    expect(focusProgress(takes, takes.at(-1)!)!.unit).toBe("words a minute");
    // Two are too few
    expect(focusProgress(takes.slice(0, 2), takes[1]!)).toBeNull();
  });
});
