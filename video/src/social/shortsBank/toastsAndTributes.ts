// Toasts and tributes's 15-second short (decision 155): the dread of being asked to say a few words, three of the lessons, and the course

// Load the short type
import type { Short } from "../shorts";

// The short (7 phrases)
export const TOASTS_AND_TRIBUTES_SHORT: Short | null = {
  id: "toasts-and-tributes",
  title: "Toasts and tributes",
  tile: "toasts-and-tributes",
  strap: "5 short lessons · practise out loud",
  lines: [
    // The dread
    { text: "Asked to give a toast, and dreading it?", mood: "worried", ground: "art-plum", bubble: "…" },
    // The course
    { text: "Toasts and tributes makes it simple.", mood: "ready", ground: "art-sky", tile: { name: "toasts-and-tributes", label: "The course" } },
    // Lesson 1
    { text: "Tell one story about them,", mood: "ready", ground: "art-leaf", tile: { name: "one-story-one-quality", label: "Lesson 1 · One story, one quality" } },
    // Lesson 3
    { text: "keep it short and sweet,", mood: "ready", ground: "art-sky", tile: { name: "short-and-sweet", label: "Lesson 3 · Short and sweet" } },
    // Lesson 4
    { text: "and raise the glass.", mood: "happy", ground: "art-sun", tile: { name: "raise-the-glass", label: "Lesson 4 · Raise the glass" } },
    // Five lessons
    { text: "Five short lessons.", mood: "happy", ground: "art-bloom", tile: { name: "toasts-and-tributes", label: "The course" } },
    // Out loud
    { text: "Out loud.", mood: "happy", ground: "art-bloom", tile: { name: "toasts-and-tributes", label: "The course" } },
  ],
};
