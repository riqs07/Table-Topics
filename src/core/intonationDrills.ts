// The two intonation drills (decision 117): "Same sentence, different stress" (did each take's highest pitch land on its own target word, judged as planned stress, decision 111) and "Exaggerate, then dial back" (how much of the exaggerated pitch range the natural take kept, with decision 103's noise rule for "not much wider"). A drill take keeps no word times, so its known words are spread over the voiced time, as the stress drill does. Pure

// Load the word placement from a line's own text
import { alignFromText } from "@/core/wordAlign";
// Load the pitch in the words
import { pitchWords, bare, type PitchWords } from "@/core/pitchPhrases";
// Load the planned-stress rows and verdicts
import { judgeStress, stressRows, type StressResult } from "@/core/plannedStress";
// Load the starring of a line's key word
import { markWord } from "@/core/stressMarks";
// Load the script's words as numbered
import { scriptTexts } from "@/core/takePitch";
// Load the shared noise rule for a pitch range change (decision 103)
import { fixedThreshold, PITCH_RANGE_NOISE } from "@/core/changeNoise";
// Load the spacing of the readings
import { LOUDNESS_TICK_MS } from "@/core/recordingRules";

// What one take needs: its length, loudness and pitch readings
export interface IntonationTake {
  // How long it ran, in seconds
  durationSec: number;
  // Loudness readings, ten a second
  levels: ReadonlyArray<number>;
  // Pitch readings, ten a second, in hertz or null
  pitches: ReadonlyArray<number | null>;
}

// One take of a line with its key word judged as planned stress: the pitch in its words and the verdict, or null with too little voice. A drill line is a single short clause, so a near-level take has no clear peak: it is not counted as landing on the key word, and its line says so (decision 117)
export function drillStress(take: IntonationTake, text: string, stress: string): { pitch: PitchWords; judged: StressResult | null; level: boolean } | null {
  // The line with its key word starred
  const marked = markWord(text, stress);
  // Its words spread over the voice
  const alignment = alignFromText(scriptTexts(marked).join(" "), take.levels, LOUDNESS_TICK_MS, take.durationSec);
  // The pitch in them
  const pitch = pitchWords({ pitch: take.pitches, alignment, tickMs: LOUDNESS_TICK_MS });
  // Too little voice
  if (!pitch) return null;
  // Judged
  const judged = judgeStress(stressRows(marked), pitch)[0] ?? null;
  // The heard words' pitches
  const steps = judged ? judged.words.flatMap((word) => (word.step === null ? [] : [word.step])) : [];
  // Level: judged, but spanning too little to have a peak
  const level = judged !== null && judged.hit !== null && Math.max(...steps) - Math.min(...steps) < LEVEL_SPAN_STEPS;
  // The verdict, a level take said plainly and not counted as a hit
  return { pitch, judged: judged && level ? { ...judged, hit: false, line: { tone: "plain", text: `No clear peak: the line stayed level. Lift “${bare(stress)}”.` } } : judged, level };
}

// One take's verdict for "Same sentence, different stress": whether the peak landed on the target, and the word it landed on
export interface ShiftVerdict {
  // The target word
  target: string;
  // Landed on the target, missed, or could not be judged
  hit: boolean | null;
  // The word the peak landed on, when judged
  peak: string | null;
  // The line stayed level, so there was no clear peak to land anywhere (counted as not on the target)
  level?: boolean;
}

// A take whose words span less than this many steps has no clear peak: a near-level line would otherwise "land" on any target within half a step of its top
export const LEVEL_SPAN_STEPS = 1.5;

// Judge one take: did its highest pitch land on the target word?
export function shiftVerdict(take: IntonationTake, text: string, target: string): ShiftVerdict {
  // The planned-stress verdict
  const stressed = drillStress(take, text, target);
  // (the clause's)
  const result = stressed?.judged ?? null;
  // Too little voice
  if (!stressed || !result || result.hit === null) return { target, hit: null, peak: null };
  // A level line: no clear peak, so not on the target
  if (stressed.level) return { target, hit: false, peak: null, level: true };
  // The verdict and the peak's word
  return { target, hit: result.hit, peak: result.highest ? bare(result.highest.text) : null };
}

// The headline and one line per take for "Same sentence, different stress"
export function shiftFindings(verdicts: ReadonlyArray<ShiftVerdict>): { headline: string; lines: string[] } {
  // The takes that could be judged
  const judged = verdicts.filter((verdict) => verdict.hit !== null);
  // The headline: how many got the peak on their target
  const headline = judged.length === 0 ? "Not enough voice to read the pitch." : `${judged.filter((verdict) => verdict.hit).length} of ${judged.length} ${judged.length === 1 ? "take" : "takes"} got the peak on the target word.`;
  // A line per take
  const lines = verdicts.map((verdict) => (verdict.hit === null ? "Too little voice to check the target word." : verdict.level ? "No clear peak." : verdict.hit ? `Peak on “${verdict.target}”, the target.` : `Peak on “${verdict.peak ?? "another word"}”, not “${verdict.target}”.`));
  // Both
  return { headline, lines };
}

// Shares of the exaggerated range, with their words, for "kept half of the exaggerated range"
const SHARE_WORDS: ReadonlyArray<{ share: number; words: string }> = [
  // A quarter
  { share: 0.25, words: "a quarter" },
  // A third
  { share: 1 / 3, words: "a third" },
  // Half
  { share: 0.5, words: "half" },
  // Two thirds
  { share: 2 / 3, words: "two thirds" },
  // Three quarters
  { share: 0.75, words: "three quarters" },
  // Nearly all
  { share: 0.9, words: "nearly all" },
];

// Below this share the natural take kept very little
const VERY_LITTLE = 0.18;

// A share in words: the nearest of the plain fractions
export function shareWords(share: number): string {
  // Very little
  if (share < VERY_LITTLE) return "very little";
  // The nearest plain fraction
  return [...SHARE_WORDS].sort((a, b) => Math.abs(a.share - share) - Math.abs(b.share - share))[0]!.words;
}

// The one line for "Exaggerate, then dial back", from the three takes' ranges in steps (flat, exaggerated, natural; null when unread)
export function dialBackLine(ranges: { flat: number | null; exaggerated: number | null; natural: number | null }): string {
  // The two that matter
  const { flat, exaggerated, natural } = ranges;
  // Not readable
  if (exaggerated === null || natural === null || exaggerated <= 0) return "Not enough voice to read the pitch.";
  // The exaggerated take was not clearly wider than the flat one (decision 103's fixed amount for a pitch range)
  if (flat !== null && exaggerated - flat <= fixedThreshold(PITCH_RANGE_NOISE, flat)) return `Your exaggerated take ranged ${exaggerated} steps, about the same as the flat one. Go much bigger on the second take.`;
  // As wide or wider
  if (natural >= exaggerated) return `Your natural take was as wide as the exaggerated one: ${natural} steps.`;
  // The share kept
  return `Your natural take kept ${shareWords(natural / exaggerated)} of the exaggerated range (${natural} of ${exaggerated} steps).`;
}
