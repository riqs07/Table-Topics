// How long recordings run, and how the timer is shown

// Load the session kind type
import type { SessionMode } from "@/data/records";

// The length to aim for, in seconds (for a Table Topic, the top of the 1:00 to 2:00 window)
export function targetSeconds(mode: SessionMode): number {
  // A Table Topic aims for one to two minutes (Toastmasters contest rules)
  if (mode === "talk") return TOPIC_WINDOW_END;
  // Warm-ups are 30 seconds; full sessions about a minute
  return mode === "warmup" ? 30 : 60;
}

// The point at which recording stops by itself, in seconds
export function maxSeconds(mode: SessionMode): number {
  // A Table Topic runs to 3:00 so going over the 2:30 limit can be seen
  if (mode === "talk") return 180;
  // Warm-ups stop at 30 seconds; full sessions at three minutes
  return mode === "warmup" ? 30 : 180;
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

// Longest thinking time before a Table Topic, in seconds (Toastmasters gives none; this is a practice aid and can be cut short)
export const THINK_SECONDS = 45;

// Toastmasters Table Topics timing: the shortest answer that qualifies (green light), in seconds
export const TOPIC_WINDOW_START = 60;
// The yellow light, in seconds
const TOPIC_YELLOW = 90;
// The top of the window (red light, which stays on), in seconds
export const TOPIC_WINDOW_END = 120;
// The longest answer that still qualifies (30 seconds of grace after red), in seconds
export const TOPIC_LIMIT = 150;

// The timing light: off, green, yellow, red, or past the limit (still red)
export type TimeSignal = "none" | "green" | "yellow" | "red" | "overtime";

// The timing light for a moment in a session (only Table Topics have one)
export function timeSignal(mode: SessionMode, seconds: number): TimeSignal {
  // Only a Table Topic has a light
  if (mode !== "talk") return "none";
  // Past the 2:30 limit
  if (seconds > TOPIC_LIMIT) return "overtime";
  // Red from 2:00
  if (seconds >= TOPIC_WINDOW_END) return "red";
  // Yellow from 1:30
  if (seconds >= TOPIC_YELLOW) return "yellow";
  // Green from 1:00
  if (seconds >= TOPIC_WINDOW_START) return "green";
  // Otherwise off
  return "none";
}

// One plain sentence on whether a Table Topic's length would qualify in a contest
export function timingSentence(durationSec: number): string {
  // Whole seconds, as the timer would record them
  const seconds = Math.round(durationSec);
  // The length as a clock
  const clock = formatClock(seconds);
  // Under the minimum
  if (seconds < TOPIC_WINDOW_START) return `${clock}, under the ${formatClock(TOPIC_WINDOW_START)} minimum. In a contest this would not qualify.`;
  // Inside the window
  if (seconds <= TOPIC_WINDOW_END) return `${clock}, inside the ${formatClock(TOPIC_WINDOW_START)} to ${formatClock(TOPIC_WINDOW_END)} window.`;
  // In the grace after red
  if (seconds <= TOPIC_LIMIT) return `${clock}, past ${formatClock(TOPIC_WINDOW_END)} but inside the ${TOPIC_LIMIT - TOPIC_WINDOW_END}-second grace.`;
  // Over the limit
  return `${clock}, over ${formatClock(TOPIC_LIMIT)}. In a contest this would not qualify.`;
}
