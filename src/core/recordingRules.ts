// How long recordings run, and how the timer is shown

// Load the session kind and story length types
import type { SessionMode, StoryLength } from "@/data/records";
// Load the small-talk unit lookup (asking and listening are shorter than answering)
import { unitOf } from "@/content/smallTalk";

// The length to aim for, in seconds (for a Table Topic, the top of the 1:00 to 2:00 window)
export function targetSeconds(mode: SessionMode, promptId = "", storyLength: StoryLength = "full"): number {
  // A Table Topic aims for one to two minutes (Toastmasters contest rules)
  if (mode === "talk") return TOPIC_WINDOW_END;
  // A story aims for the top of its length's window (decision 92)
  if (mode === "story") return STORY_WINDOWS[storyLength].end;
  // A prepared speech aims for two to four minutes (the top of its window)
  if (mode === "response") return SPEECH_WINDOW.end;
  // An openings and closings drill aims for 45 seconds
  if (mode === "bookend") return 45;
  // A Q&A answer aims for a minute
  if (mode === "qa") return 60;
  // A small-talk answer aims for the top of its window
  if (mode === "smalltalk") return smallTalkWindow(promptId).end;
  // A moment note is a few sentences
  if (mode === "moment") return 30;
  // Free talk has no goal; two minutes is a good stretch (decision 73)
  if (mode === "free") return 120;
  // A short speech uses its own length (passed as the goal); two minutes without one
  if (mode === "outline") return 120;
  // Warm-ups are 30 seconds; full sessions about a minute
  return mode === "warmup" ? 30 : 60;
}

// The point at which recording stops by itself, in seconds
export function maxSeconds(mode: SessionMode, promptId = "", storyLength: StoryLength = "full"): number {
  // A Table Topic runs to 3:00 so going over the 2:30 limit can be seen
  if (mode === "talk") return 180;
  // A story runs half a minute past its limit, so going over can be seen (2:00 for a short one, 4:00 for a full one; decision 92)
  if (mode === "story") return STORY_WINDOWS[storyLength].limit + 30;
  // A prepared speech runs to 5:00 so going over the 4:30 limit can be seen
  if (mode === "response") return 300;
  // Reading aloud, the pause drill, and lessons: enough for any passage at a slow pace
  if (mode === "read" || mode === "pause" || mode === "lesson") return 600;
  // A rehearsal: long enough for most real talks
  if (mode === "rehearse") return 1800;
  // Free talk: as long as you like, up to ten minutes; a short speech up to ten too (its longest goal is five)
  if (mode === "free" || mode === "outline") return 600;
  // An openings and closings drill stops at a minute
  if (mode === "bookend") return 60;
  // A Q&A answer stops at two minutes
  if (mode === "qa") return 120;
  // A follow-up question stops by itself at half a minute
  if (mode === "smalltalk" && unitOf(promptId) === "asking") return 30;
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

// The shortest follow-up question or reply kept, in seconds
const MIN_REPLY_SECONDS = 2;

// The shortest recording kept for a kind of session: a follow-up question or a reply to a story can be a few seconds
export function minSeconds(mode: SessionMode, promptId = ""): number {
  // Small talk's asking and listening are short by design
  if (mode === "smalltalk" && unitOf(promptId) !== "answering") return MIN_REPLY_SECONDS;
  // Everything else
  return MIN_SECONDS;
}

// Seconds between seeing the prompt and recording: a short countdown for a Table Topic, time to prepare for a Record Response
export function thinkSeconds(mode: SessionMode): number {
  // A Table Topic gives very little waiting time
  if (mode === "talk") return 10;
  // A Record Response gives two minutes, which can be cut short
  if (mode === "response") return 120;
  // A story gives up to a minute to plan, which can be cut short (decision 92)
  if (mode === "story") return 60;
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
// A follow-up question: a few seconds, red at 0:12
export const ASKING_WINDOW: SpeakingWindow = { start: 2, yellow: 8, end: 12, limit: 12 };
// A reply to a story: green at 0:05, red at 0:30
export const LISTENING_WINDOW: SpeakingWindow = { start: 5, yellow: 20, end: 30, limit: 30 };
// A response to news: green at 0:03, red at 0:20
export const NEWS_WINDOW: SpeakingWindow = { start: 3, yellow: 15, end: 20, limit: 20 };

// A story: a short one is about a minute (green 0:45, yellow 1:00, red 1:15, 15 seconds of grace); a full one two to three minutes (green 2:00, yellow 2:30, red 3:00, 30 seconds of grace; decision 92)
export const STORY_WINDOWS: Readonly<Record<StoryLength, SpeakingWindow>> = { short: { start: 45, yellow: 60, end: 75, limit: 90 }, full: { start: 120, yellow: 150, end: 180, limit: 210 } };

// The window for a small-talk prompt, by its unit
export function smallTalkWindow(promptId: string): SpeakingWindow {
  // The prompt's unit
  const unit = unitOf(promptId);
  // Its window
  return unit === "asking" ? ASKING_WINDOW : unit === "listening" ? LISTENING_WINDOW : unit === "news" ? NEWS_WINDOW : SMALL_TALK_WINDOW;
}

// The window for a kind of session (and, for small talk, its prompt), if it has one
export function speakingWindow(mode: SessionMode, promptId = "", storyLength: StoryLength = "full"): SpeakingWindow | null {
  // Table Topics, prepared speeches, small-talk answers and stories
  return mode === "talk" ? TOPIC_WINDOW : mode === "response" ? SPEECH_WINDOW : mode === "smalltalk" ? smallTalkWindow(promptId) : mode === "story" ? STORY_WINDOWS[storyLength] : null;
}

// The timing light: off, green, yellow, red, or past the limit (still red)
export type TimeSignal = "none" | "green" | "yellow" | "red" | "overtime";

// The timing light for a moment in a session (Table Topics, Record Responses, and rehearsals with a goal have one)
export function timeSignal(mode: SessionMode, seconds: number, goalSeconds?: number, promptId = "", storyLength: StoryLength = "full"): TimeSignal {
  // A rehearsal without a goal, or free talk, has no light
  if ((mode === "rehearse" && !goalSeconds) || mode === "free") return "none";
  // An openings and closings drill or a Q&A answer: yellow for the last 15 seconds before the goal, red past it
  if (mode === "bookend" || mode === "qa") return seconds > targetSeconds(mode) ? "red" : seconds >= targetSeconds(mode) - BOOKEND_YELLOW_LEAD ? "yellow" : "none";
  // A rehearsal or a short speech with a goal: yellow in the last stretch before it, red past it
  if (mode === "rehearse" || mode === "outline") {
    // The rehearsal's own goal
    const goal = goalSeconds ?? targetSeconds(mode);
    // Past the goal
    if (seconds > goal) return "red";
    // Close to the goal
    if (seconds >= goal - RESPONSE_YELLOW_LEAD) return "yellow";
    // Otherwise off
    return "none";
  }
  // Only a Table Topic, a prepared speech, small talk and a story have the full set of lights
  const window = speakingWindow(mode, promptId, storyLength);
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

// A timing cue without looking: one soft tone, or two (decision 77)
export type TimingCue = "one" | "two";

// The cue when the light changes: one tone when it first lights (green, or yellow for a light with no green), two at red; nothing otherwise
export function timingCue(previous: TimeSignal, next: TimeSignal): TimingCue | null {
  // No change, no cue
  if (previous === next) return null;
  // Red: time to finish
  if (next === "red") return "two";
  // Green, or a first yellow straight from off (a prepared speech, a drill or a rehearsal): the light is on
  if (next === "green" || (next === "yellow" && previous === "none")) return "one";
  // Anything else (yellow after green, past the limit) stays quiet
  return null;
}

// One plain sentence on the timing: for a Table Topic over the limit, that it would not qualify; otherwise, how it compared with the goal (a rehearsal passes its own goal)
export function timingSentence(mode: SessionMode, durationSec: number, goalSeconds?: number, promptId = "", storyLength: StoryLength = "full"): string {
  // Whole seconds, as the timer would record them
  const seconds = Math.round(durationSec);
  // The length as a clock
  const clock = formatClock(seconds);
  // The window, for a Table Topic, a prepared speech, small talk or a story
  const window = speakingWindow(mode, promptId, storyLength);
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
  // What a contest would say, for a Table Topic over the limit only (a short take is practice, not a disqualification; decision 89)
  const contest = mode === "talk" ? " In a contest this would not qualify." : "";
  // Under the minimum
  if (seconds < window.start) return `${clock}, under the ${formatClock(window.start)} minimum.`;
  // Inside the window
  if (seconds <= window.end) return `${clock}, inside the ${formatClock(window.start)} to ${formatClock(window.end)} window.`;
  // In the grace after red
  if (seconds <= window.limit) return `${clock}, past ${formatClock(window.end)} but inside the ${window.limit - window.end}-second grace.`;
  // Over the limit
  return `${clock}, over ${formatClock(window.limit)}.${contest}`;
}
