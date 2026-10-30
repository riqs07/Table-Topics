// Which course tile stands for a course or one of its lessons (decision 142); one with none keeps its icon or plain heading

// Load the tile names
import type { CourseTileName } from "@/components/scenes/CourseTile";
// Load the second course for each focus area's lesson tiles (decision 155)
import { INTERVIEW_READY_LESSON_TILES } from "@/components/scenes/tiles/interviewReady";
import { TOASTS_AND_TRIBUTES_LESSON_TILES } from "@/components/scenes/tiles/toastsAndTributes";
import { LISTEN_LIKE_YOU_MEAN_IT_LESSON_TILES } from "@/components/scenes/tiles/listenLikeYouMeanIt";
import { TELL_IT_AGAIN_LESSON_TILES } from "@/components/scenes/tiles/tellItAgain";
import { KNOW_YOUR_VOICE_LESSON_TILES } from "@/components/scenes/tiles/knowYourVoice";
import { THE_TOUGH_QUESTION_LESSON_TILES } from "@/components/scenes/tiles/theToughQuestion";


// Each course's tile, by course id
const COURSE_TILES: Readonly<Record<string, CourseTileName>> = {
  // Stop freezing: breaking out of the ice
  "stop-freezing": "stop-freezing",
  // The other five (decision 145): each course's own tile
  "explain-it-simply": "explain-it-simply",
  // (a talk coming up)
  "ready-by-the-day": "ready-by-the-day",
  // (telling stories)
  "stories-that-land": "stories-that-land",
  // (small talk and conversations)
  "beyond-good-you": "beyond-good-you",
  // (how I sound)
  "voice-lean-in": "voice-lean-in",
  // The second course for each focus area (decision 155): each course's tile has its id
  "interview-ready": "interview-ready" as CourseTileName,
  "toasts-and-tributes": "toasts-and-tributes" as CourseTileName,
  "listen-like-you-mean-it": "listen-like-you-mean-it" as CourseTileName,
  "tell-it-again": "tell-it-again" as CourseTileName,
  "know-your-voice": "know-your-voice" as CourseTileName,
  "the-tough-question": "the-tough-question" as CourseTileName,
};

// Each lesson's tile, by course id and lesson id
const LESSON_TILES: Readonly<Record<string, CourseTileName>> = {
  // Buy a beat: a breath and a pause
  "stop-freezing/beat": "buy-a-beat",
  // Point first: the arrow in the bullseye
  "stop-freezing/point": "point-first",
  // Point, reason, example: three steps
  "stop-freezing/pre": "point-reason-example",
  // Land it: down on the target
  "stop-freezing/land": "land-it",
  // The run: all of it, at a run
  "stop-freezing/run": "the-run",
  // stop-freezing's lessons (decision 145)
  "stop-freezing/back": "back-on-track",
  // explain-it-simply's lessons (decision 145)
  "explain-it-simply/bottom": "bottom-line",
  "explain-it-simply/update": "done-next-need",
  "explain-it-simply/simple": "plain-words",
  "explain-it-simply/meetings": "speak-up",
  "explain-it-simply/dontknow": "dont-know-yet",
  "explain-it-simply/run": "pitch-it",
  // ready-by-the-day's lessons (decision 145)
  "ready-by-the-day/message": "one-message",
  "ready-by-the-day/open": "open-strong",
  "ready-by-the-day/close": "close-on-purpose",
  "ready-by-the-day/ladder": "memory-ladder",
  "ready-by-the-day/nerves": "nerves-on-the-day",
  "ready-by-the-day/dress": "dress-rehearsal",
  // stories-that-land's lessons (decision 145)
  "stories-that-land/find": "small-moments",
  "stories-that-land/middle": "start-in-the-middle",
  "stories-that-land/turns": "but-and-so",
  "stories-that-land/alive": "bring-it-to-life",
  "stories-that-land/point": "end-on-the-point",
  "stories-that-land/run": "tell-it-shorter",
  // beyond-good-you's lessons (decision 145)
  "beyond-good-you/hook": "answer-with-a-hook",
  "beyond-good-you/ask": "second-question",
  "beyond-good-you/listen": "listen-out-loud",
  "beyond-good-you/deeper": "one-level-deeper",
  "beyond-good-you/edges": "start-and-leave",
  "beyond-good-you/run": "whole-conversation",
  // voice-lean-in's lessons (decision 145)
  "voice-lean-in/breath": "breath-first",
  "voice-lean-in/clear": "clear-sounds",
  "voice-lean-in/pace": "pace-and-pauses",
  "voice-lean-in/stress": "key-word",
  "voice-lean-in/low": "land-it-low",
  "voice-lean-in/room": "fill-the-room",
  "voice-lean-in/run": "speech-run",
  // The second course for each focus area's lessons (decision 155), from their tile files
  ...(INTERVIEW_READY_LESSON_TILES as Readonly<Record<string, CourseTileName>>),
  ...(TOASTS_AND_TRIBUTES_LESSON_TILES as Readonly<Record<string, CourseTileName>>),
  ...(LISTEN_LIKE_YOU_MEAN_IT_LESSON_TILES as Readonly<Record<string, CourseTileName>>),
  ...(TELL_IT_AGAIN_LESSON_TILES as Readonly<Record<string, CourseTileName>>),
  ...(KNOW_YOUR_VOICE_LESSON_TILES as Readonly<Record<string, CourseTileName>>),
  ...(THE_TOUGH_QUESTION_LESSON_TILES as Readonly<Record<string, CourseTileName>>),
};

// A course's tile, or none
export function courseTile(courseId: string): CourseTileName | null {
  // Looked up by id
  return COURSE_TILES[courseId] ?? null;
}

// A lesson's tile, or none
export function lessonTile(courseId: string, lessonId: string): CourseTileName | null {
  // Looked up by both ids
  return LESSON_TILES[`${courseId}/${lessonId}`] ?? null;
}
