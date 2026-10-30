// Writes the app's list of lesson clips (decision 147), src/content/lessonClips.ts, from the clips in video/src/lessons/clips that have been rendered into public/lessons: each one's video, still, title and words, by the course part it plays in. Run from the app's folder: npx tsx video/scripts/export-clips.ts

// Load Node's file tools
import { existsSync, writeFileSync } from "node:fs";
// Load the clips
import { LESSON_CLIPS } from "../src/lessons/clips";

// The clips rendered into the app
const ready = LESSON_CLIPS.filter((clip) => existsSync(`public/lessons/${clip.id}.mp4`) && existsSync(`public/lessons/${clip.id}-poster.jpg`));
// Each as a line of the file, with a comment
const entries = ready.map((clip) => `  // ${clip.label}: ${clip.title}\n  ${JSON.stringify(clip.partId)}: { src: ${JSON.stringify(`/lessons/${clip.id}.mp4`)}, poster: ${JSON.stringify(`/lessons/${clip.id}-poster.jpg`)}, title: ${JSON.stringify(clip.title)}, transcript: ${JSON.stringify(clip.lines.map((line) => line.text).join(" "))} },`);
// The file
const file = `// The lesson clips (decision 147), by the course part each plays in: its video and still in public/lessons, its title, and its words for reading instead. Written by video/scripts/export-clips.ts from video/src/lessons/clips; do not edit by hand

// One clip
export interface LessonClipFile {
  // The video
  src: string;
  // The still shown before it plays
  poster: string;
  // Its name
  title: string;
  // Its words
  transcript: string;
}

// The clips, by course part
export const LESSON_CLIP_FILES: Readonly<Record<string, LessonClipFile>> = {
${entries.join("\n")}
};
`;
// Saved
writeFileSync("src/content/lessonClips.ts", file);
// Said
console.log(`Wrote ${ready.length} lesson clips to src/content/lessonClips.ts.`);
