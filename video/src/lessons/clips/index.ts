// Every lesson clip (decision 147), course by course, and finding one by id

// Load the clip type
import type { LessonClipDef } from "../types";
// Load each course's clips
import { STOP_FREEZING_CLIPS } from "./stopFreezing";
import { EXPLAIN_IT_SIMPLY_CLIPS } from "./explainItSimply";
import { READY_BY_THE_DAY_CLIPS } from "./readyByTheDay";
import { STORIES_THAT_LAND_CLIPS } from "./storiesThatLand";
import { BEYOND_GOOD_YOU_CLIPS } from "./beyondGoodYou";
import { VOICE_LEAN_IN_CLIPS } from "./voiceLeanIn";

// All of them, in the courses' order
export const LESSON_CLIPS: ReadonlyArray<LessonClipDef> = [...STOP_FREEZING_CLIPS, ...EXPLAIN_IT_SIMPLY_CLIPS, ...READY_BY_THE_DAY_CLIPS, ...STORIES_THAT_LAND_CLIPS, ...BEYOND_GOOD_YOU_CLIPS, ...VOICE_LEAN_IN_CLIPS];

// A clip by its id, or a clear stop
export function findClip(id: string): LessonClipDef {
  // The match
  const clip = LESSON_CLIPS.find((item) => item.id === id);
  // Stop with a message when missing
  if (!clip) throw new Error(`No lesson clip "${id}"`);
  // Found
  return clip;
}

// The words a clip's voice reads: each line on its own, with its delivery tag
export function voicePrompt(clip: LessonClipDef): string {
  // Lines with a blank line between, so the voice pauses
  return clip.lines.map((line) => `${line.tag ? `${line.tag} ` : ""}${line.text}`).join("\n\n");
}
