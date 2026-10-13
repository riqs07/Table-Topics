// How long recordings run, and how the timer is shown

// Load the session kind type
import type { SessionMode } from "@/data/records";

// The length to aim for, in seconds
export function targetSeconds(mode: SessionMode): number {
  // Warm-ups are 30 seconds; full sessions about a minute
  return mode === "warmup" ? 30 : 60;
}

// The point at which recording stops by itself, in seconds
export function maxSeconds(mode: SessionMode): number {
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
