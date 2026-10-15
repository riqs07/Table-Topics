// How long recordings run, and how the timer is shown

// Load the session kind type
import type { SessionMode } from "@/data/records";

// The length to aim for, in seconds (for a Table Topic, the top of the 1:00 to 2:00 window)
export function targetSeconds(mode: SessionMode): number {
  // A Table Topic aims for one to two minutes (Toastmasters contest rules)
  if (mode === "talk") return TOPIC_WINDOW_END;
  // A Record Response aims for three minutes
  if (mode === "response") return 180;
  // An openings and closings drill aims for 45 seconds
  if (mode === "bookend") return 45;
  // A Q&A answer aims for a minute
  if (mode === "qa") return 60;
  // Warm-ups are 30 seconds; full sessions about a minute
  return mode === "warmup" ? 30 : 60;
}

// The point at which recording stops by itself, in seconds
export function maxSeconds(mode: SessionMode): number {
  // A Table Topic runs to 3:00 so going over the 2:30 limit can be seen
  if (mode === "talk") return 180;
  // A Record Response may run a minute past its goal
  if (mode === "response") return 240;
  // Reading aloud, the pause drill, and lessons: enough for any passage at a slow pace
  if (mode === "read" || mode === "pause" || mode === "lesson") return 600;
  // A rehearsal: long enough for most real talks
  if (mode === "rehearse") return 1800;
  // An openings and closings drill stops at a minute
  if (mode === "bookend") return 60;
  // A Q&A answer stops at two minutes
  if (mode === "qa") return 120;
  // Warm-ups stop at 30 seconds; full sessions at three minutes
  return mode === "warmup" ? 30 : 180;
}

// Expected time to read a text aloud, in seconds: about 140 words a minute, at least one minute
export function readingSeconds(text: string): number {
  // Count the words
  const words = text.split(/\s+/).filter((word) => word !== "").length;
  // Time at 140 words a minute, rounded, never under a minute
  return Math.max(60, Math.round((words / 140) * 60));
}

// Show seconds as a clock, such as "0:42" or "1:01"
export function formatClock(seconds: number): string {
  // Whole seconds elapsed
  const whole = Math.floor(seconds);
  // Minutes, and seconds padded to two digits
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

// Milliseconds between loudness readings while recording (also the timer and meter refresh)
export const LOUDNESS_TICK_MS = 100;

// The shortest recording kept, in seconds (shorter clips give unreliable rates)
export const MIN_SECONDS = 10;

// Seconds between seeing the prompt and recording: a short countdown for a Table Topic, time to prepare for a Record Response
export function thinkSeconds(mode: SessionMode): number {
  // A Table Topic gives very little waiting time
  if (mode === "talk") return 10;
  // A Record Response gives two minutes, which can be cut short
  if (mode === "response") return 120;
  // The older kinds start straight away
  return 0;
}

// How long before a Record Response's goal its light turns yellow, in seconds
const RESPONSE_YELLOW_LEAD = 45;

// How long before an openings and closings drill's or a Q&A answer's goal its light turns yellow, in seconds
const BOOKEND_YELLOW_LEAD = 15;

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

// The timing light for a moment in a session (Table Topics, Record Responses, and rehearsals with a goal have one)
export function timeSignal(mode: SessionMode, seconds: number, goalSeconds?: number): TimeSignal {
  // A rehearsal without a goal has no light
  if (mode === "rehearse" && !goalSeconds) return "none";
  // An openings and closings drill or a Q&A answer: yellow for the last 15 seconds before the goal, red past it
  if (mode === "bookend" || mode === "qa") return seconds > targetSeconds(mode) ? "red" : seconds >= targetSeconds(mode) - BOOKEND_YELLOW_LEAD ? "yellow" : "none";
  // A Record Response or a rehearsal: yellow in the last stretch before the goal, red past it
  if (mode === "response" || mode === "rehearse") {
    // The goal: the rehearsal's own, or the Record Response's
    const goal = goalSeconds ?? targetSeconds(mode);
    // Past the goal
    if (seconds > goal) return "red";
    // Close to the goal
    if (seconds >= goal - RESPONSE_YELLOW_LEAD) return "yellow";
    // Otherwise off
    return "none";
  }
  // Only a Table Topic has the full set of lights
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

// One plain sentence on the timing: for a Table Topic, whether it would qualify; otherwise, how it compared with the goal (a rehearsal passes its own goal)
export function timingSentence(mode: SessionMode, durationSec: number, goalSeconds?: number): string {
  // Whole seconds, as the timer would record them
  const seconds = Math.round(durationSec);
  // The length as a clock
  const clock = formatClock(seconds);
  // Anything but a Table Topic compares with its goal
  if (mode !== "talk") {
    // The goal: a rehearsal's own, or this kind's
    const goal = goalSeconds ?? targetSeconds(mode);
    // How far over (negative means under)
    const difference = seconds - goal;
    // The shared opening
    const opening = `${clock} against a ${formatClock(goal)} goal`;
    // Right on time
    if (difference === 0) return `${opening}, right on time.`;
    // Over, or under
    return difference > 0 ? `${opening}, ${difference} seconds over.` : `${opening}, ${-difference} seconds to spare.`;
  }
  // Under the minimum
  if (seconds < TOPIC_WINDOW_START) return `${clock}, under the ${formatClock(TOPIC_WINDOW_START)} minimum. In a contest this would not qualify.`;
  // Inside the window
  if (seconds <= TOPIC_WINDOW_END) return `${clock}, inside the ${formatClock(TOPIC_WINDOW_START)} to ${formatClock(TOPIC_WINDOW_END)} window.`;
  // In the grace after red
  if (seconds <= TOPIC_LIMIT) return `${clock}, past ${formatClock(TOPIC_WINDOW_END)} but inside the ${TOPIC_LIMIT - TOPIC_WINDOW_END}-second grace.`;
  // Over the limit
  return `${clock}, over ${formatClock(TOPIC_LIMIT)}. In a contest this would not qualify.`;
}
