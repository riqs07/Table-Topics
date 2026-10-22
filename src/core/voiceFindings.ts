// What a voice drill's takes showed: each take measured, then one plain line per take and a headline (decision 80). Only what can be measured honestly: levels against the speaker's own first take (the microphone is not calibrated), pitch against their own usual pitch, and words the speech service caught

// Load the word check from reading aloud
import { alignReading } from "@/core/readAlong";
// Load the loudness rules
import { fadingEnds, speechThreshold } from "@/core/pauses";
// Load the pitch rules
import { summarizePitch, usualPitch, type PitchEnd } from "@/core/pitch";
// Load the spacing of the readings
import { LOUDNESS_TICK_MS } from "@/core/recordingRules";
// Load the drill type
import type { VoiceDrill } from "@/content/voice";
// Load the two intonation drills' verdicts (decision 117)
import { dialBackLine, shiftFindings, shiftVerdict } from "@/core/intonationDrills";

// One recorded take, as the drill screen collects it
export interface TakeRecording {
  // How long it ran, in seconds
  durationSec: number;
  // Loudness readings, ten a second (0 to 1)
  levels: number[];
  // Pitch readings, ten a second, in hertz or null where unvoiced
  pitches: (number | null)[];
  // What the speech service heard (empty when it was not listening)
  transcript: string;
}

// One take, measured
export interface TakeMeasure {
  // Typical loudness while speaking (0 to 1; only comparable with the speaker's own other takes)
  level: number;
  // The pitch range in steps, or null with too little voice
  rangeSteps: number | null;
  // How the take ended, or null with too little voice
  end: PitchEnd | null;
  // Whether it faded at the end, or null when it could not be judged
  faded: boolean | null;
  // How long it ran, in seconds
  durationSec: number;
  // Words of the text the speech service did not catch
  missed: string[];
}

// A change in level between two takes, in words
export type LevelStep = "clear-up" | "small-up" | "same" | "small-down" | "clear-down";

// The typical loudness while speaking: the average of the readings loud enough to be speech, or 0 with none
export function speechLevel(levels: ReadonlyArray<number>): number {
  // The line between speech and silence, from the speaker's own readings
  const threshold = speechThreshold(levels);
  // The speech readings
  const speech = levels.filter((level) => level >= threshold && level > 0);
  // Their average
  return speech.length > 0 ? speech.reduce((sum, level) => sum + level, 0) / speech.length : 0;
}

// How one level compares with another: 3 decibels is a clear step, 1 a small one
export function levelStep(from: number, to: number): LevelStep {
  // Nothing to compare
  if (from <= 0 || to <= 0) return "same";
  // The change in decibels
  const change = 20 * Math.log10(to / from);
  // In words
  return change >= 3 ? "clear-up" : change >= 1 ? "small-up" : change > -1 ? "same" : change > -3 ? "small-down" : "clear-down";
}

// A level change as a phrase
const STEP_WORDS: Readonly<Record<LevelStep, string>> = { "clear-up": "a clear step up", "small-up": "a small step up", same: "about the same level", "small-down": "a little quieter", "clear-down": "a clear drop" };

// The same change in a few words, for side-by-side takes
const STEP_SHORT: Readonly<Record<LevelStep, string>> = { "clear-up": "louder", "small-up": "a little louder", same: "same level", "small-down": "a little quieter", "clear-down": "quieter" };

// Capitalize the first letter
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// A word of the text without its punctuation, for naming it
const bare = (word: string) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}'’]+$/gu, "");

// Measure one take of a line, against the speaker's usual pitch across the drill (words: check which words of the text were caught, even when nothing was heard)
export function measureTake(take: TakeRecording, text: string, usual: number | null, words = false): TakeMeasure {
  // The pitch
  const pitch = summarizePitch(take.pitches, usual);
  // The endings
  const ends = fadingEnds(take.levels, LOUDNESS_TICK_MS);
  // Words not caught, when they are being checked
  const missed = words ? alignReading(text, take.transcript).words.filter((word) => !word.read).map((word) => bare(word.text)).filter((word) => word !== "") : [];
  // Everything measured
  return { level: speechLevel(take.levels), rangeSteps: pitch.rangeSteps, end: pitch.end, faded: ends.stretches > 0 ? ends.faded > 0 : null, durationSec: take.durationSec, missed };
}

// How an ending reads
const END_WORDS: Readonly<Record<PitchEnd, string>> = { fall: "falling", level: "level", rise: "rising" };

// A drill's findings: each take measured, a line for each, and a headline
export interface DrillFindings {
  // The headline
  headline: string;
  // One line per take
  lines: string[];
  // The measures, for drawing bars and lines
  measures: TakeMeasure[];
}

// Work out a drill's findings from its takes
export function drillFindings(drill: VoiceDrill, takes: ReadonlyArray<TakeRecording>): DrillFindings {
  // The speaker's usual pitch across every take, so takes compare with each other
  const usual = usualPitch(takes.flatMap((take) => take.pitches));
  // Each take measured against its own text
  const measures = takes.map((take, index) => measureTake(take, drill.takes[index]?.text ?? "", usual, drill.measure === "words"));
  // Too little voice to read the pitch
  const noPitch = "Not enough voice to read the pitch.";
  // Clear sounds: words that were hard to catch
  if (drill.measure === "words") {
    // Every missed word
    const missed = measures.flatMap((measure) => measure.missed);
    // The headline and lines
    return { headline: missed.length === 0 ? "Every word came through." : `${missed.length} ${missed.length === 1 ? "word was" : "words were"} hard to catch.`, lines: measures.map((measure) => (measure.missed.length === 0 ? "Every word caught." : `Hard to catch: ${measure.missed.join(", ")}.`)), measures };
  }
  // Three rooms: each take against the one before
  if (drill.measure === "steps") {
    // The steps between takes
    const steps = measures.slice(1).map((measure, index) => levelStep(measures[index]!.level, measure.level));
    // The headline: every step a clear jump, or not yet
    const headline = steps.every((step) => step === "clear-up") ? "Three clear levels." : "Make each step a clear jump up.";
    // The first take is the start; each other one is a step
    return { headline, lines: measures.map((_, index) => (index === 0 ? "Your starting level." : `${capital(STEP_WORDS[steps[index - 1]!])} from the last take.`)), measures };
  }
  // To the last word: whether each take faded
  if (drill.measure === "endings") {
    // The takes that could be judged
    const judged = measures.filter((measure) => measure.faded !== null);
    // The headline
    const headline = judged.length === 0 ? "Too quiet to measure. Try again a little closer to the phone." : `${judged.filter((measure) => !measure.faded).length} of ${judged.length} kept their strength to the last word.`;
    // A line per take
    return { headline, lines: measures.map((measure) => (measure.faded === null ? "Too quiet to measure." : measure.faded ? "Faded at the end." : "Strong to the last word.")), measures };
  }
  // Drop for effect: the second take against the first
  if (drill.measure === "drop") {
    // The change
    const step = levelStep(measures[0]?.level ?? 0, measures[1]?.level ?? 0);
    // The headline
    const headline = step === "clear-down" ? "A clear drop. That quiet line will make people lean in." : step === "small-down" ? "A small drop. Go quieter still, keeping every word clear." : "About the same level. Drop further for the quiet line.";
    // A line per take
    return { headline, lines: measures.map((_, index) => (index === 0 ? "Your normal level." : `${capital(STEP_WORDS[step])} from your normal level.`)), measures };
  }
  // Statement or question, land it low: how each take ended against how it should
  if (drill.measure === "ends") {
    // The takes with an ending and an aim
    const judged = measures.map((measure, index) => ({ end: measure.end, expect: drill.takes[index]?.expect })).filter((item) => item.end !== null && item.expect);
    // The headline
    const headline = judged.length === 0 ? noPitch : `${judged.filter((item) => item.end === item.expect).length} of ${judged.length} ended the way you aimed.`;
    // A line per take
    const lines = measures.map((measure, index) => {
      // How it should end
      const expect = drill.takes[index]?.expect;
      // Not readable
      if (measure.end === null) return noPitch;
      // As aimed, or what to aim for
      return expect === undefined ? `Ended ${END_WORDS[measure.end]}.` : measure.end === expect ? `Ended ${END_WORDS[measure.end]}, as aimed.` : `Ended ${END_WORDS[measure.end]}. Aim for a clear ${expect === "fall" ? "drop" : "lift"} on the last word.`;
    });
    // Everything
    return { headline, lines, measures };
  }
  // Stretch the range: the normal take against the overdone one
  if (drill.measure === "range") {
    // The two ranges
    const [overdone, normal] = [measures[0]?.rangeSteps ?? null, measures[1]?.rangeSteps ?? null];
    // The headline
    const headline = overdone === null || normal === null ? noPitch : `Your normal take ranged ${normal} steps, after ${overdone} with too much melody.`;
    // A line per take
    return { headline, lines: measures.map((measure) => (measure.rangeSteps === null ? noPitch : `Range: ${measure.rangeSteps} steps.`)), measures };
  }
  // Same sentence, different stress: whether each take's peak landed on its own target (decision 117)
  if (drill.measure === "shift") return { ...shiftFindings(takes.map((take, index) => shiftVerdict(take, drill.takes[index]?.text ?? "", drill.takes[index]?.stress ?? ""))), measures };
  // Exaggerate, then dial back: each take's range, and how much of the exaggerated range the natural take kept (decision 117)
  if (drill.measure === "dialback") return { headline: dialBackLine({ flat: measures[0]?.rangeSteps ?? null, exaggerated: measures[1]?.rangeSteps ?? null, natural: measures[2]?.rangeSteps ?? null }), lines: measures.map((measure) => (measure.rangeSteps === null ? noPitch : `Range: ${measure.rangeSteps} steps.`)), measures };
  // Stress the key word: judged by guessing, with each take's range as a hint
  if (drill.measure === "stress") return { headline: "Which word did you stress? Play the guessing game to find out.", lines: measures.map((measure) => (measure.rangeSteps === null ? noPitch : `Range: ${measure.rangeSteps} steps.`)), measures };
  // Tone: what changed between the feelings, then a guessing game
  const lines = measures.map((measure, index) => {
    // The range, or that it could not be read
    const range = measure.rangeSteps === null ? "pitch not read" : `range ${measure.rangeSteps} steps`;
    // The level against the first take
    const level = index === 0 ? "" : ` · ${STEP_SHORT[levelStep(measures[0]!.level, measure.level)]}`;
    // The length
    return `${capital(range)}${level} · ${measure.durationSec.toFixed(1)} s`;
  });
  // The headline
  return { headline: "Did they sound different? See what changed, then play the guessing game.", lines, measures };
}

// How a shadowed take's pace compares with the model's
export type PaceMatch = "slower" | "same" | "faster";

// The pace against the model: within a quarter either way is the same pace (null when the model's length is not known)
export function paceMatch(youSec: number, modelSec: number | null): PaceMatch | null {
  // No model length to compare with (the phone's voice can finish without saying how long it took)
  if (modelSec === null || modelSec < 0.5 || youSec <= 0) return null;
  // Your length against the model's
  const ratio = youSec / modelSec;
  // In words
  return ratio > 1.25 ? "slower" : ratio < 0.8 ? "faster" : "same";
}

// How each pace match reads
const PACE_WORDS: Readonly<Record<PaceMatch, string>> = { slower: "Slower than the model", same: "About the model’s pace", faster: "Faster than the model" };

// One line for a shadowed take: the pace against the model, then the words (when they were checked)
export function shadowLine(measure: TakeMeasure, modelSec: number | null, wordsChecked: boolean): string {
  // The pace
  const match = paceMatch(measure.durationSec, modelSec);
  // In words, with both lengths
  const pace = match === null ? `Took ${measure.durationSec.toFixed(1)} s.` : `${PACE_WORDS[match]} (${measure.durationSec.toFixed(1)} s against ${modelSec!.toFixed(1)} s).`;
  // The words
  const words = !wordsChecked ? "" : measure.missed.length === 0 ? " Every word caught." : ` Hard to catch: ${measure.missed.join(", ")}.`;
  // Together
  return `${pace}${words}`;
}

// The headline for a shadowing session: how many takes matched the model's pace, when it could be judged
export function shadowHeadline(matches: ReadonlyArray<PaceMatch | null>): string {
  // The takes that could be judged
  const judged = matches.filter((match): match is PaceMatch => match !== null);
  // None: just what was done
  if (judged.length === 0) return `You shadowed ${matches.length} ${matches.length === 1 ? "take" : "takes"}.`;
  // How many matched
  const same = judged.filter((match) => match === "same").length;
  // The count
  return `${same} of ${judged.length} at the model’s pace.`;
}
