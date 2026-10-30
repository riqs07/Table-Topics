// The six course shorts (decision 145): a 15-second vertical video for each course, its phrases in the order spoken (the voiceover in public/courses/<id>.mp3, split at its pauses by scripts/prepare.mjs, must give as many phrases as the lines cover; the video stops with a clear message otherwise), what the blob feels, the background, and what pops in on each phrase

// Load the tile names
import type { CourseTileName } from "@/components/scenes/CourseTile";
// Load the talking blob's moods
import type { Mood } from "./TalkingBlob";
// Load the second course for each focus area's shorts (decision 155)
import { INTERVIEW_READY_SHORT } from "./shortsBank/interviewReady";
import { TOASTS_AND_TRIBUTES_SHORT } from "./shortsBank/toastsAndTributes";
import { LISTEN_LIKE_YOU_MEAN_IT_SHORT } from "./shortsBank/listenLikeYouMeanIt";
import { TELL_IT_AGAIN_SHORT } from "./shortsBank/tellItAgain";
import { KNOW_YOUR_VOICE_SHORT } from "./shortsBank/knowYourVoice";
import { THE_TOUGH_QUESTION_SHORT } from "./shortsBank/theToughQuestion";


// The colour roles a background can be
export type Ground = "art-sky" | "art-plum" | "art-sun" | "art-leaf" | "art-bloom" | "art-coral";

// One spoken phrase
export interface ShortLine {
  // Its words, as shown in the captions
  text: string;
  // The blob's mood while it is said
  mood: Mood;
  // The background (moved to another colour when it matches the tile shown)
  ground: Ground;
  // A tile shown on it, with a label above it (optional)
  tile?: { name: CourseTileName; label: string };
  // A cream speech bubble shown on it, with a word or sign (optional)
  bubble?: string;
  // How many of the voiceover's phrases it covers, when the voice paused inside it (1 when missing)
  span?: number;
}

// One course's short
export interface Short {
  // The course's id, which names its voiceover and its composition
  id: string;
  // The course's name, for the top line and the end card
  title: string;
  // The course's tile, for the end card
  tile: CourseTileName;
  // The end card's line under the name
  strap: string;
  // The phrases
  lines: ReadonlyArray<ShortLine>;
}

// The shorts, in the courses' order
const FIRST_SHORTS: ReadonlyArray<Short> = [
  // Stop freezing (7 phrases)
  {
    id: "stop-freezing",
    title: "Stop freezing",
    tile: "stop-freezing",
    strap: "6 short lessons · practise out loud",
    lines: [
      // The surprise
      { text: "Someone asks you something out of the blue.", mood: "wow", ground: "art-sky", bubble: "?" },
      // The blank
      { text: "And your mind goes blank.", mood: "worried", ground: "art-plum", bubble: "…" },
      // Lesson 1
      { text: "Stop freezing teaches you to buy a beat,", mood: "ready", ground: "art-sun", tile: { name: "buy-a-beat", label: "Lesson 1 · Buy a beat" } },
      // Lesson 2
      { text: "say your point first,", mood: "ready", ground: "art-sky", tile: { name: "point-first", label: "Lesson 2 · Point first" } },
      // Lesson 4
      { text: "and land it.", mood: "happy", ground: "art-leaf", tile: { name: "land-it", label: "Lesson 4 · Land it" } },
      // The course
      { text: "Six short lessons.", mood: "happy", ground: "art-sun", tile: { name: "stop-freezing", label: "The course" } },
      // Out loud
      { text: "Out loud.", mood: "happy", ground: "art-sun", tile: { name: "stop-freezing", label: "The course" } },
    ],
  },
  // Explain it simply (7 phrases)
  {
    id: "explain-it-simply",
    title: "Explain it simply",
    tile: "explain-it-simply",
    strap: "6 short lessons · for speaking at work",
    lines: [
      // The rambling update
      { text: "Ever given an update that just kept going?", mood: "worried", ground: "art-plum", bubble: "…and…" },
      // The course
      { text: "Explain it simply shows you how.", mood: "ready", ground: "art-sky", tile: { name: "explain-it-simply", label: "The course" } },
      // Lesson 1
      { text: "Lead with the bottom line.", mood: "ready", ground: "art-sun", tile: { name: "bottom-line", label: "Lesson 1 · Bottom line first" } },
      // Lesson 3
      { text: "Use plain words.", mood: "ready", ground: "art-leaf", tile: { name: "plain-words", label: "Lesson 3 · Explain it to a friend" } },
      // Lesson 6
      { text: "Pitch an idea in a minute.", mood: "happy", ground: "art-plum", tile: { name: "pitch-it", label: "Lesson 6 · Pitch an idea" } },
      // The close
      { text: "Say it once.", mood: "happy", ground: "art-bloom" },
      // (clearly)
      { text: "Clearly.", mood: "happy", ground: "art-bloom" },
    ],
  },
  // Ready by the day (6 phrases)
  {
    id: "ready-by-the-day",
    title: "Ready by the day",
    tile: "ready-by-the-day",
    strap: "6 short lessons · for a talk on a set date",
    lines: [
      // The date
      { text: "Got a toast or a talk coming up?", mood: "wow", ground: "art-sky", bubble: "14" },
      // The course
      { text: "Ready by the day gets you there.", mood: "ready", ground: "art-plum", tile: { name: "ready-by-the-day", label: "The course" } },
      // Lesson 1
      { text: "One clear message.", mood: "ready", ground: "art-leaf", tile: { name: "one-message", label: "Lesson 1 · One message" } },
      // Lesson 2
      { text: "An opening that grabs them.", mood: "wow", ground: "art-sun", tile: { name: "open-strong", label: "Lesson 2 · Open strong" } },
      // Lesson 4
      { text: "A talk you know by heart.", mood: "ready", ground: "art-bloom", tile: { name: "memory-ladder", label: "Lesson 4 · Off the page" } },
      // The close
      { text: "Walk in ready.", mood: "happy", ground: "art-coral" },
    ],
  },
  // Stories that land (6 phrases)
  {
    id: "stories-that-land",
    title: "Stories that land",
    tile: "stories-that-land",
    strap: "6 short lessons · for telling stories",
    lines: [
      // The drift
      { text: "Ever told a story and watched them drift off?", mood: "worried", ground: "art-sky", bubble: "zzz" },
      // The course
      { text: "Stories that land fixes that.", mood: "ready", ground: "art-sun", tile: { name: "stories-that-land", label: "The course" } },
      // Lesson 2
      { text: "Start in the middle.", mood: "ready", ground: "art-leaf", tile: { name: "start-in-the-middle", label: "Lesson 2 · Start in the middle" } },
      // Lesson 3
      { text: "Join it up with but and so.", mood: "ready", ground: "art-plum", tile: { name: "but-and-so", label: "Lesson 3 · But, and so" } },
      // Lesson 5
      { text: "End on the point.", mood: "happy", ground: "art-sun", tile: { name: "end-on-the-point", label: "Lesson 5 · End on the point" } },
      // The close
      { text: "And watch them lean in.", mood: "happy", ground: "art-coral" },
    ],
  },
  // Beyond "good, you?" (8 phrases in the voice: a pause inside "Good, you?", and the sigh on its own)
  {
    id: "beyond-good-you",
    title: "Beyond “good, you?”",
    tile: "beyond-good-you",
    strap: "6 short lessons · for small talk and conversations",
    lines: [
      // The question
      { text: "How was your weekend?", mood: "ready", ground: "art-sky", bubble: "?" },
      // The dead end
      { text: "Good, you?", mood: "worried", ground: "art-plum", bubble: "good", span: 2 },
      // The sigh
      { text: "(sigh)", mood: "closed", ground: "art-plum" },
      // The stop
      { text: "And the chat stops there.", mood: "worried", ground: "art-plum" },
      // Lesson 1
      { text: "Learn to answer with a hook.", mood: "ready", ground: "art-sun", tile: { name: "answer-with-a-hook", label: "Lesson 1 · Answer with a hook" } },
      // Lesson 2
      { text: "Ask the second question.", mood: "ready", ground: "art-leaf", tile: { name: "second-question", label: "Lesson 2 · Ask the second question" } },
      // Lesson 3
      { text: "And really listen.", mood: "happy", ground: "art-coral", tile: { name: "listen-out-loud", label: "Lesson 3 · Listen out loud" } },
    ],
  },
  // A voice they lean in for (8 phrases in the voice: a pause inside the course's name)
  {
    id: "voice-lean-in",
    title: "A voice they lean in for",
    tile: "voice-lean-in",
    strap: "7 short lessons · for how you sound",
    lines: [
      // The hook
      { text: "Got something worth saying?", mood: "wow", ground: "art-plum", bubble: "!" },
      // The course
      { text: "Give it a voice they lean in for.", mood: "happy", ground: "art-sun", tile: { name: "voice-lean-in", label: "The course" }, span: 2 },
      // Lesson 1
      { text: "Breathe low.", mood: "closed", ground: "art-leaf", tile: { name: "breath-first", label: "Lesson 1 · Breath first" } },
      // Lesson 3
      { text: "Pause on purpose.", mood: "ready", ground: "art-sun", tile: { name: "pace-and-pauses", label: "Lesson 3 · Pace and pauses" } },
      // Lesson 4
      { text: "Let your key word land.", mood: "happy", ground: "art-sky", tile: { name: "key-word", label: "Lesson 4 · Stress the key word" } },
      // The close
      { text: "Seven short lessons.", mood: "happy", ground: "art-bloom" },
      // (out loud)
      { text: "Out loud.", mood: "happy", ground: "art-bloom" },
    ],
  },
];

// The shorts, in the courses' order: the first six, then the second course for each focus area (decision 155), each in its own file
export const SHORTS: ReadonlyArray<Short> = [...FIRST_SHORTS, ...[INTERVIEW_READY_SHORT, TOASTS_AND_TRIBUTES_SHORT, LISTEN_LIKE_YOU_MEAN_IT_SHORT, TELL_IT_AGAIN_SHORT, KNOW_YOUR_VOICE_SHORT, THE_TOUGH_QUESTION_SHORT].filter((short): short is Short => short !== null)];
