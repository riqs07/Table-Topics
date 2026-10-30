// What a lesson clip is made of (decision 147): its words, phrase by phrase, the beats that picture them, the blob's own example, and the closing card. Every clip is data; LessonClip.tsx draws any of them

// Load the tile names
import type { CourseTileName } from "@/components/scenes/CourseTile";
// Load the talking blob's moods
import type { Mood } from "../TalkingBlob";

// The colour roles a background can be (never the same as the lesson tile's ground while the tile is shown)
export type Ground = "art-sky" | "art-plum" | "art-sun" | "art-leaf" | "art-bloom" | "art-coral";

// A sign on a card: a few characters in the display face, or "tick" for a drawn tick
export type Sign = string;

// One spoken line: its words (as captioned), the blob's mood, and an optional delivery tag for the voice, such as "[warm]"
export interface ClipLine {
  // The words
  text: string;
  // The blob's mood
  mood: Mood;
  // How the voice says it (sent to the voice, not shown)
  tag?: string;
}

// What a beat shows, beside or above the talking blob
export type Visual =
  // A speech bubble with a word or sign, the blob centre stage
  | { kind: "bubble"; text: string }
  // The lesson's own tile
  | { kind: "tile" }
  // A burst with words in it, struck through a moment in (the thing not to do)
  | { kind: "struck"; text: string }
  // The weaker way, then the better way below it from a line on, the weaker one struck through then
  | { kind: "contrast"; instead: string; tryThis: string; tryAt: number }
  // Two or three cards turning over, each on its line
  | { kind: "cards"; items: ReadonlyArray<{ sign: Sign; label: string; at: number }> }
  // Numbered steps lifting in, each on its line
  | { kind: "steps"; items: ReadonlyArray<{ label: string; at: number }> }
  // A page of short lines writing themselves in, each from its line (a line with no words is drawn as a bar)
  | { kind: "list"; title?: string; items: ReadonlyArray<{ label: string; text?: string; at: number }> }
  // The blob's own example: a card headed with a title, the key words writing themselves in while the blob tells it
  | { kind: "example"; title: string; quote: string };

// One beat: a run of lines with one picture and one background
export interface ClipBeat {
  // Its first line, by number from 0
  from: number;
  // Its last line
  to: number;
  // Its background
  ground: Ground;
  // Its picture
  visual: Visual;
}

// One lesson clip
export interface LessonClipDef {
  // Its id, which names its voiceover, its video and its composition (the course id and the lesson id)
  id: string;
  // The course part it plays in (the lesson's first part)
  partId: string;
  // The label at the top, such as "Stories that land · Lesson 1"
  label: string;
  // The lesson's tile
  tile: CourseTileName;
  // The lesson's name, for the player
  title: string;
  // The lines, in the order spoken
  lines: ReadonlyArray<ClipLine>;
  // The beats, covering every line in order
  beats: ReadonlyArray<ClipBeat>;
  // The closing card: a heading, two or three things with their signs, and one thing to do
  close: { heading: string; items: ReadonlyArray<{ sign: Sign; label: string }>; action: string };
}
