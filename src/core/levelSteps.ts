// Comparing loudness between takes (decision 80): a take's typical speaking level, and the step between two levels in decibels. Kept apart from the drills' findings so the voice report can use it without loading them

// Load the speech-or-silence threshold
import { speechThreshold } from "@/core/pauses";

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

