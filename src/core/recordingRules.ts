// How long recordings run, and how the timer is shown

// Load the session kind type
import type { SessionMode } from "@/data/records";

// The length to aim for, in seconds
export function targetSeconds(mode: SessionMode): number {
  // A talk aims for three minutes
  if (mode === "talk") return 180;
  // Warm-ups are 30 seconds; full sessions about a minute
  return mode === "warmup" ? 30 : 60;
}

// The point at which recording stops by itself, in seconds
export function maxSeconds(mode: SessionMode): number {
  // A talk may run a minute over its goal before it stops, so going over can be seen
  if (mode === "talk") return 240;
  // Warm-ups stop at 30 seconds; full sessions at three minutes
  return mode === "warmup" ? 30 : 180;
}

// Longest thinking time before a talk, in seconds (it can be cut short)
export const THINK_SECONDS = 45;

// How long before the goal the light turns yellow, in seconds
const CAUTION_LEAD_SECONDS = 45;

// The timing light: off, yellow near the goal, or red past it
export type TimeSignal = "none" | "caution" | "over";

// The timing light for a moment in a session (only talks have one)
export function timeSignal(mode: SessionMode, seconds: number): TimeSignal {
  // Only a talk has a light
  if (mode !== "talk") return "none";
  // The goal
  const goal = targetSeconds(mode);
  // Past the goal: red
  if (seconds > goal) return "over";
  // Within the last stretch before the goal: yellow
  if (seconds >= goal - CAUTION_LEAD_SECONDS) return "caution";
  // Otherwise off
  return "none";
}

// One plain sentence on how a talk's length compared with its goal
export function timingSentence(durationSec: number): string {
  // The goal
  const goal = targetSeconds("talk");
  // Whole seconds over (negative means under)
  const difference = Math.round(durationSec) - goal;
  // Both times as clocks
  const opening = `${formatClock(durationSec)} against a ${formatClock(goal)} goal`;
  // Right on time
  if (difference === 0) return `${opening}, right on time.`;
  // Over
  if (difference > 0) return `${opening}, ${difference} seconds over.`;
  // Under
  return `${opening}, ${-difference} seconds to spare.`;
}

// Show seconds as a clock, such as "0:42" or "1:01"
export function formatClock(seconds: number): string {
  // Whole seconds elapsed
  const whole = Math.floor(seconds);
  // Minutes, and seconds padded to two digits
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

// The shortest recording kept, in seconds (shorter clips give unreliable rates)
export const MIN_SECONDS = 10;
