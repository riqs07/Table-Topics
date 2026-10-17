// Small talk: what the phone can check in an answer by itself, how much of the recipe strip to show, and one change without the coach

// Load the recipe's beats
import { BEATS, type BeatId } from "@/content/smallTalk";
// Load the word tidier shared with the reading checks
import { normalize } from "@/core/readAlong";
// Load the clock and the small-talk window
import { SMALL_TALK_WINDOW, formatClock } from "@/core/recordingRules";
// Load the change type shared with the other modes
import type { LocalChange } from "@/core/localChange";
// Load the record type
import type { SessionRecord } from "@/data/records";

// Openings that close the topic when nothing follows them
const DEAD_ENDS = ["not much", "nothing much", "nothing really", "not a lot", "good", "fine", "okay", "ok", "pretty good", "pretty chill", "same old", "the usual", "it was good", "it was fine", "it was okay", "busy"];

// An answer this short after a dead-end opening has nothing else in it
const DEAD_END_WORDS = 15;

// Words that say how something felt
const FEELING_WORDS = ["fun", "loved", "love", "enjoyed", "proud", "relaxing", "relaxed", "excited", "exciting", "surprised", "surprising", "obsessed", "glad", "happy", "amazing", "great", "nice", "lovely", "fantastic", "awesome", "beautiful", "peaceful", "hilarious", "funny", "scary", "nervous", "stressful", "exhausting", "tired", "grateful", "thrilled", "satisfying", "refreshing", "cool", "wonderful", "felt", "feel"];

// Phrases that hand the conversation back, looked for near the end
const HAND_BACKS = ["what about you", "how about you", "and you", "how was yours", "how was your", "what did you", "did you", "have you", "are you", "do you", "what are you", "how are you", "you up to", "your weekend", "you been"];

// The hand-back must come in this many final words
const HAND_BACK_WORDS = 12;

// The words of a transcript, tidied
function words(transcript: string): string[] {
  // Split, tidy, and drop empty pieces
  return transcript.split(/\s+/).map(normalize).filter((word) => word !== "");
}

// Whether the answer opens with a dead end and says little else ("Good, not much.")
export function deadEndOpening(transcript: string): boolean {
  // The tidied words
  const said = words(transcript);
  // The opening, as one phrase
  const opening = said.join(" ");
  // A dead-end opening, and not much after it
  return said.length < DEAD_END_WORDS && DEAD_ENDS.some((phrase) => opening === phrase || opening.startsWith(`${phrase} `));
}

// The feeling words in the answer, in order, without repeats
export function feelingWords(transcript: string): string[] {
  // Each distinct feeling word
  return [...new Set(words(transcript).filter((word) => FEELING_WORDS.includes(word)))];
}

// The hand-back phrase near the end of the answer, if any
export function handBack(transcript: string): string | null {
  // The last few words, as one phrase
  const ending = ` ${words(transcript).slice(-HAND_BACK_WORDS).join(" ")} `;
  // The first phrase found there
  return HAND_BACKS.find((phrase) => ending.includes(` ${phrase} `)) ?? null;
}

// Whether the answer was too short, inside the window, or too long
export function answerLength(durationSec: number): "short" | "ok" | "long" {
  // Under the window, over it, or inside
  return durationSec < SMALL_TALK_WINDOW.start ? "short" : durationSec > SMALL_TALK_WINDOW.end ? "long" : "ok";
}

// Whether an answer showed a beat: the user's own tick when they listened back, or (for feeling and the hand-back) the phone's check
export function beatFound(session: SessionRecord, beat: BeatId): boolean {
  // Ticked by the user
  const ticked = !!session.selfReview && !session.selfReview.skipped && session.selfReview.tags.includes(beat);
  // Found by the phone
  const checked = beat === "feeling" ? feelingWords(session.transcript).length > 0 : beat === "hand-back" ? handBack(session.transcript) !== null : false;
  // Either
  return ticked || checked;
}

// How much help the strip gives for each beat
export interface StripLevel {
  // Per beat: the reminder in full, or just the word once it is a habit
  beats: Record<BeatId, "full" | "word">;
  // Whether the strip is hidden altogether (every beat a habit)
  hidden: boolean;
}

// The recent answers looked at
const RECENT = 5;
// A beat found in this many of them is a habit
const HABIT = 3;

// The strip's level from the user's answers (newest first): fading as each beat becomes a habit
export function stripLevel(answers: ReadonlyArray<SessionRecord>): StripLevel {
  // The most recent answers
  const recent = answers.slice(0, RECENT);
  // Each beat's level
  const beats = Object.fromEntries(BEATS.map((beat) => [beat.id, recent.filter((answer) => beatFound(answer, beat.id)).length >= HABIT ? "word" : "full"])) as Record<BeatId, "full" | "word">;
  // Hidden once every beat is a habit
  return { beats, hidden: BEATS.every((beat) => beats[beat.id] === "word") };
}

// One change for a small-talk answer, from the phone's checks, in order: a dead end, too short, no feeling, no hand-back, too long; otherwise one more hook
export function smallTalkChange(session: SessionRecord): LocalChange {
  // A dead end
  if (deadEndOpening(session.transcript)) return { change: "Do not stop at “good”: that leaves them nothing to ask about. Even a quiet day has one thing worth telling.", retryCue: "Pick one thing that happened, however small, and say it first." };
  // The length
  const length = answerLength(session.durationSec);
  // Too short
  if (length === "short") return { change: `A little more: you spoke for ${formatClock(session.durationSec)}. Give them a detail they could ask about.`, retryCue: "Add one specific detail: a name, a place, or a number." };
  // No feeling
  if (feelingWords(session.transcript).length === 0) return { change: "Say how it felt. The facts were there; one line on why it mattered makes it sound like you.", retryCue: "After the moment, add how it felt: fun, relaxing, a bit of a surprise." };
  // No hand-back
  if (handBack(session.transcript) === null) return { change: "Hand it back. End with a question so it becomes a conversation, not a report.", retryCue: "Finish with a real question, like “Did you get up to anything good?”" };
  // Too long
  if (length === "long") return { change: `Shorter is friendlier: you spoke for ${formatClock(session.durationSec)}. Small talk is a quick back-and-forth.`, retryCue: "Tell one moment, then hand it back within about thirty seconds." };
  // All there: one more hook
  return { change: "That had the shape of a good answer. Next time, make the detail more specific: names, places and numbers are the easiest hooks to grab.", retryCue: "Swap one general word for a specific one." };
}
