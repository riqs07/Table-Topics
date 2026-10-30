// Stories that land's lesson clips (decision 147): one per lesson, played in the lesson's first part

// Load the clip type
import type { LessonClipDef } from "../types";

// The clips, in lesson order
export const STORIES_THAT_LAND_CLIPS: ReadonlyArray<LessonClipDef> = [
  // Lesson 1, You have stories: small moments count, with the blob's own from this morning
  {
    id: "stories-that-land-find",
    partId: "sl-find-1",
    label: "Stories that land · Lesson 1",
    tile: "small-moments",
    title: "Small moments count",
    lines: [
      { text: "Think nothing interesting ever happens to you?", mood: "up", tag: "[curious]" },
      { text: "Most people do.", mood: "ready", tag: "[warm]" },
      { text: "But good stories aren’t big events.", mood: "ready" },
      { text: "They’re small moments, when something changed.", mood: "happy", tag: "[thoughtful]" },
      { text: "Here’s one of mine from this morning.", mood: "happy", tag: "[cheerful]" },
      { text: "I was at the bus stop, soaking wet, with no change.", mood: "worried", tag: "[playful]" },
      { text: "The driver just waved me on and said, “Keep it, love.”", mood: "wow" },
      { text: "Tiny. But I smiled all day.", mood: "happy" },
      { text: "So today, notice three kinds.", mood: "ready", tag: "[warm]" },
      { text: "A surprise.", mood: "wow" },
      { text: "A small win.", mood: "happy" },
      { text: "And a line someone said.", mood: "ready" },
      { text: "Tonight, write one of them down. Just one line.", mood: "closed", tag: "[calm]" },
      { text: "Do that for a week, and you’ll have more stories than you can tell.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The doubt
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // Not big events
      { from: 2, to: 2, ground: "art-plum", visual: { kind: "struck", text: "BIG EVENT" } },
      // Small moments
      { from: 3, to: 3, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's own moment
      { from: 4, to: 7, ground: "art-bloom", visual: { kind: "example", title: "My moment", quote: "Soaking wet, no change. “Keep it, love.”" } },
      // The three kinds
      { from: 8, to: 11, ground: "art-sun", visual: { kind: "cards", items: [{ sign: "!", label: "A surprise", at: 9 }, { sign: "tick", label: "A small win", at: 10 }, { sign: "“ ”", label: "Something said", at: 11 }] } },
      // One line tonight, then a week of them
      { from: 12, to: 13, ground: "art-coral", visual: { kind: "list", title: "Tonight", items: [{ label: "Mon", text: "Bus driver: “Keep it, love.”", at: 12 }, ...["Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => ({ label, at: 13 }))] } },
    ],
    close: { heading: "Today, notice", items: [{ sign: "!", label: "A surprise" }, { sign: "tick", label: "A small win" }, { sign: "“ ”", label: "Something said" }], action: "Tonight: write one line" },
  },
];
