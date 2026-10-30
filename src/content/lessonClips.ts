// The lesson clips (decision 147), by the course part each plays in: its video and still in public/lessons, its title, and its words for reading instead. Written by video/scripts/export-clips.ts from video/src/lessons/clips; do not edit by hand

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
  // Stories that land · Lesson 1: Small moments count
  "sl-find-1": { src: "/lessons/stories-that-land-find.mp4", poster: "/lessons/stories-that-land-find-poster.jpg", title: "Small moments count", transcript: "Think nothing interesting ever happens to you? Most people do. But good stories aren’t big events. They’re small moments, when something changed. Here’s one of mine from this morning. I was at the bus stop, soaking wet, with no change. The driver just waved me on and said, “Keep it, love.” Tiny. But I smiled all day. So today, notice three kinds. A surprise. A small win. And a line someone said. Tonight, write one of them down. Just one line. Do that for a week, and you’ll have more stories than you can tell." },
};
