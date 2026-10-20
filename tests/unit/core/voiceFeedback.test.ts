// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the rules being checked
import { rangeOf, usualRange, voiceReport } from "@/core/voiceFeedback";
// Load the one-change picker, which can pick a voice change
import { localChange } from "@/core/localChange";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// One phrase: its loudness and pitch readings, ten a second
interface Phrase {
  // Loudness readings
  levels: number[];
  // Pitch readings
  pitches: (number | null)[];
}

// A phrase of a given length, with pitch and loudness worked out per reading
function phrase(readings: number, pitch: (index: number) => number, level: (index: number) => number = () => 0.2): Phrase {
  // Each reading's position
  const places = Array.from({ length: readings }, (_, index) => index);
  // The readings
  return { levels: places.map(level), pitches: places.map(pitch) };
}

// A recording of phrases with 0.8-second silences between them, as a session
function recording(phrases: Phrase[], extra: Parameters<typeof makeSession>[0] = {}) {
  // The silence between phrases
  const gap: Phrase = { levels: Array(8).fill(0.01), pitches: Array(8).fill(null) };
  // Joined with gaps
  const all = phrases.flatMap((item, index) => (index === 0 ? [item] : [gap, item]));
  // The session
  return makeSession({ loudness: all.flatMap((item) => item.levels), pitch: all.flatMap((item) => item.pitches), durationSec: Math.round(all.reduce((sum, item) => sum + item.levels.length, 0) / 10), wordsPerMinute: 140, fillersPerMinute: 0, ...extra });
}

// A steady phrase at one pitch
const steady = (hz: number, readings = 20) => phrase(readings, () => hz);
// A phrase that ends higher than it started
const rising = phrase(20, (index) => (index >= 17 ? 240 : 200));
// A phrase that moves across a wide range
const lively = phrase(20, (index) => [150, 200, 260, 300, 180][index % 5]!);

// Group the checks about the voice report (decision 81)
describe("voiceReport", () => {
  // A flat pitch is named, with what to try
  it("names a flat pitch", () => {
    // Five steady phrases at one pitch
    const report = voiceReport(recording(Array.from({ length: 5 }, () => steady(200))), null);
    // Flat first, the endings level so not mentioned, and the strong phrase ends after
    expect([report.pitch?.rangeSteps, report.lines.map((line) => line.text)]).toEqual([0, ["Fairly flat: your pitch moved across 0 steps. Lift the key word in each sentence.", "You kept your strength to the end of every phrase."]]);
  });

  // Mostly rising endings are named first
  it("names phrases that end rising", () => {
    // Five phrases ending higher
    const report = voiceReport(recording(Array.from({ length: 5 }, () => rising)), null);
    // The endings line leads
    expect([report.pitch?.ends, report.lines[0]?.text]).toEqual([{ fall: 0, level: 0, rise: 5 }, "5 of 5 phrases ended rising, which can sound unsure. Land your statements low."]);
  });

  // Low endings count as a strength only when few phrases rose; two rising of five is already worth working on
  it("weighs falling against rising endings", () => {
    // A phrase ending lower than it started
    const falling = phrase(20, (index) => (index >= 17 ? 160 : 200));
    // Four falling and one rising, then three falling and two rising
    const [mostly, mixed] = [voiceReport(recording([falling, falling, falling, falling, rising]), null), voiceReport(recording([falling, falling, falling, rising, rising]), null)];
    // A strength, then something to work on
    expect([mostly.lines.find((line) => line.kind === "ends")?.text, mixed.lines.find((line) => line.kind === "ends")?.text]).toEqual(["4 of 5 phrases ended low, which sounds sure.", "2 of 5 phrases ended rising, which can sound unsure. Land your statements low."]);
  });

  // A wide range is lively, and compared with the speaker's usual
  it("compares the range with the speaker's usual", () => {
    // Five lively phrases, against a usual of 3
    const report = voiceReport(recording(Array.from({ length: 5 }, () => lively)), 3);
    // Lively, and livelier than usual
    expect(report.lines.find((line) => line.kind === "range")?.text).toMatch(/^Lively: your pitch moved across \d+ steps, livelier than your usual 3\.$/);
  });

  // Without the browser's levelling, a drop in the last third is named; with it (or unknown), it is not trusted
  it("names a volume drop only when the levelling was off", () => {
    // Six three-second phrases at full strength, then three much quieter (over 30 seconds in all), with some pitch movement
    const phrases = [...Array.from({ length: 6 }, () => phrase(30, (index) => [150, 200, 260, 300, 180][index % 5]!)), ...Array.from({ length: 3 }, () => phrase(30, (index) => [150, 200, 260, 300, 180][index % 5]!, () => 0.07))];
    // Unlevelled, then levelled
    const [off, on] = [voiceReport(recording(phrases, { autoGain: false }), null), voiceReport(recording(phrases, { autoGain: true }), null)];
    // Named only for the unlevelled one
    expect([off.volume?.lastThird, off.lines.some((line) => line.kind === "drop"), on.volume?.lastThird, on.lines.some((line) => line.kind === "drop")]).toEqual(["clear-down", true, null, false]);
  });

  // A very even volume across phrases is named, without the levelling
  it("names a very even volume", () => {
    // Five lively phrases at the same level, unlevelled
    const report = voiceReport(recording(Array.from({ length: 5 }, () => lively), { autoGain: false }), null);
    // Even
    expect([report.volume?.spreadDb, report.lines.some((line) => line.kind === "even")]).toEqual([0, true]);
  });

  // Fading phrase ends are named, but not when fluency is not judged ("I stammer")
  it("names fading ends unless fluency is left alone", () => {
    // Phrases whose last few readings drop away
    const fading = Array.from({ length: 5 }, () => phrase(20, (index) => [150, 200, 260, 300, 180][index % 5]!, (index) => (index >= 17 ? 0.06 : 0.2)));
    // Judged, then left alone
    const [judged, alone] = [voiceReport(recording(fading), null), voiceReport(recording(fading), null, { fluency: false })];
    // Named only when judged
    expect([judged.lines.find((line) => line.kind === "fading")?.text, alone.lines.some((line) => line.kind === "fading")]).toEqual(["5 of 5 phrases faded at the end. Land the last word.", false]);
  });

  // Older recordings without pitch show only what loudness can tell
  it("leaves out the pitch for older recordings", () => {
    // A recording with loudness but no pitch
    const report = voiceReport({ ...recording(Array.from({ length: 5 }, () => steady(200))), pitch: undefined }, null);
    // No pitch
    expect([report.pitch, report.lines.some((line) => line.kind === "range" || line.kind === "ends")]).toEqual([null, false]);
  });
});

// Group the checks about the usual range
describe("usualRange", () => {
  // The middle of earlier ranges, from three recordings on
  it("takes the middle of three or more earlier ranges", () => {
    // Two flat recordings and one lively one
    const earlier = [recording(Array.from({ length: 5 }, () => steady(200))), recording(Array.from({ length: 5 }, () => steady(200))), recording(Array.from({ length: 5 }, () => lively))];
    // Too few with two; the middle with three
    expect([usualRange(earlier.slice(0, 2)), usualRange(earlier), rangeOf(earlier[0]!)]).toEqual([null, 0, 0]);
  });
});

// Group the checks about the one change picking the voice
describe("localChange and the voice", () => {
  // With nothing else standing out, rising endings become the one change
  it("picks rising endings when nothing else stands out", () => {
    // Five rising phrases at a comfortable pace with pauses
    const change = localChange(recording(Array.from({ length: 5 }, () => rising)));
    // The endings, with a cue, marked as a voice change
    expect([change.change, change.retryCue, change.voiceKind]).toEqual(["5 of 5 phrases ended rising, which can sound unsure. Land your statements low.", "End each statement low, as if it were a full stop.", "ends"]);
  });
});
