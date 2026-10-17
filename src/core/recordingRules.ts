// How long recordings run, and how the timer is shown

// Load the session kind type
import type { SessionMode } from "@/data/records";

// The length to aim for, in seconds (for a Table Topic, the top of the 1:00 to 2:00 window)
export function targetSeconds(mode: SessionMode): number {
  // A Table Topic aims for one to two minutes (Toastmasters contest rules)
  if (mode === "talk") return TOPIC_WINDOW_END;
  // A prepared speech aims for two to four minutes (the top of its window)
  if (mode === "response") return SPEECH_WINDOW.end;
  // An openings and closings drill aims for 45 seconds
  if (mode === "bookend") return 45;
  // A Q&A answer aims for a minute
  if (mode === "qa") return 60;
  // A small-talk answer aims for the top of its window
  if (mode === "smalltalk") return SMALL_TALK_WINDOW.end;
  // A moment note is a few sentences
  if (mode === "moment") return 30;
  // Warm-ups are 30 seconds; full sessions about a minute
  return mode === "warmup" ? 30 : 60;
}

// The point at which recording stops by itself, in seconds
export function maxSeconds(mode: SessionMode): number {
  // A Table Topic runs to 3:00 so going over the 2:30 limit can be seen
  if (mode === "talk") return 180;
  // A prepared speech runs to 5:00 so going over the 4:30 limit can be seen
  if (mode === "response") return 300;
  // Reading aloud, the pause drill, and lessons: enough for any passage at a slow pace
  if (mode === "read" || mode === "pause" || mode === "lesson") return 600;
  // A rehearsal: long enough for most real talks
  if (mode === "rehearse") return 1800;
  // An openings and closings drill stops at a minute
  if (mode === "bookend") return 60;
  // A Q&A answer stops at two minutes
  if (mode === "qa") return 120;
  // A small-talk answer or a moment note stops by itself at one minute
  if (mode === "smalltalk" || mode === "moment") return 60;
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

// A speaking window with Toastmasters-style lights: green when the minimum is met, yellow, red at the top, and a grace before the limit (seconds)
export interface SpeakingWindow {
  // Green: the shortest that counts
  start: number;
  // Yellow: start wrapping up
  yellow: number;
  // Red: the top of the window
  end: number;
  // The longest that still counts
  limit: number;
}

// A Table Topic: 1 to 2 minutes, 30 seconds of grace
export const TOPIC_WINDOW: SpeakingWindow = { start: TOPIC_WINDOW_START, yellow: TOPIC_YELLOW, end: TOPIC_WINDOW_END, limit: TOPIC_LIMIT };

// A prepared speech: 2 to 4 minutes, 30 seconds of grace
export const SPEECH_WINDOW: SpeakingWindow = { start: 120, yellow: 180, end: 240, limit: 270 };
// Small talk: green at 0:20, yellow at 0:35, red at 0:45, no grace (it stops by itself at 1:00)
export const SMALL_TALK_WINDOW: SpeakingWindow = { start: 20, yellow: 35, end: 45, limit: 45 };

// The window for a kind of session, if it has one
export function speakingWindow(mode: SessionMode): SpeakingWindow | null {
  // Table Topics, prepared speeches and small-talk answers
  return mode === "talk" ? TOPIC_WINDOW : mode === "response" ? SPEECH_WINDOW : mode === "smalltalk" ? SMALL_TALK_WINDOW : null;
}

// The timing light: off, green, yellow, red, or past the limit (still red)
export type TimeSignal = "none" | "green" | "yellow" | "red" | "overtime";

// The timing light for a moment in a session (Table Topics, Record Responses, and rehearsals with a goal have one)
export function timeSignal(mode: SessionMode, seconds: number, goalSeconds?: number): TimeSignal {
  // A rehearsal without a goal has no light
  if (mode === "rehearse" && !goalSeconds) return "none";
  // An openings and closings drill or a Q&A answer: yellow for the last 15 seconds before the goal, red past it
  if (mode === "bookend" || mode === "qa") return seconds > targetSeconds(mode) ? "red" : seconds >= targetSeconds(mode) - BOOKEND_YELLOW_LEAD ? "yellow" : "none";
  // A rehearsal with a goal: yellow in the last stretch before it, red past it
  if (mode === "rehearse") {
    // The rehearsal's own goal
    const goal = goalSeconds ?? targetSeconds(mode);
    // Past the goal
    if (seconds > goal) return "red";
    // Close to the goal
    if (seconds >= goal - RESPONSE_YELLOW_LEAD) return "yellow";
    // Otherwise off
    return "none";
  }
  // Only a Table Topic and a prepared speech have the full set of lights
  const window = speakingWindow(mode);
  // No window, no light
  if (!window) return "none";
  // Past the limit
  if (seconds > window.limit) return "overtime";
  // Red from the top of the window
  if (seconds >= window.end) return "red";
  // Yellow from the middle
  if (seconds >= window.yellow) return "yellow";
  // Green once the minimum is met
  if (seconds >= window.start) return "green";
  // Otherwise off
  return "none";
}

// One plain sentence on the timing: for a Table Topic, whether it would qualify; otherwise, how it compared with the goal (a rehearsal passes its own goal)
export function timingSentence(mode: SessionMode, durationSec: number, goalSeconds?: number): string {
  // Whole seconds, as the timer would record them
  const seconds = Math.round(durationSec);
  // The length as a clock
  const clock = formatClock(seconds);
  // The window, for a Table Topic or a prepared speech
  const window = speakingWindow(mode);
  // Anything else compares with its goal
  if (!window) {
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
  // What a contest would say, for a Table Topic only
  const contest = mode === "talk" ? " In a contest this would not qualify." : "";
  // Under the minimum
  if (seconds < window.start) return `${clock}, under the ${formatClock(window.start)} minimum.${contest}`;
  // Inside the window
  if (seconds <= window.end) return `${clock}, inside the ${formatClock(window.start)} to ${formatClock(window.end)} window.`;
  // In the grace after red
  if (seconds <= window.limit) return `${clock}, past ${formatClock(window.end)} but inside the ${window.limit - window.end}-second grace.`;
  // Over the limit
  return `${clock}, over ${formatClock(window.limit)}.${contest}`;
}
