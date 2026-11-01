// Know your voice's 15-second short (decision 155)

// Load the short type
import type { Short } from "../shorts";

// The short (7 phrases)
export const KNOW_YOUR_VOICE_SHORT: Short | null = {
  id: "know-your-voice",
  title: "Know your voice",
  tile: "know-your-voice",
  strap: "5 short lessons · practise out loud",
  lines: [
    // The hook
    { text: "Ever wondered how you really sound?", mood: "wow", ground: "art-sky", bubble: "?" },
    // The problem
    { text: "“Speak better” doesn’t say what to change.", mood: "worried", ground: "art-plum", bubble: "…" },
    // Lesson 1
    { text: "Know your voice shows where your pauses fall,", mood: "ready", ground: "art-sun", tile: { name: "pause-map", label: "Lesson 1 · Where your pauses fall" } },
    // Lesson 3
    { text: "how far your pitch moves,", mood: "ready", ground: "art-sky", tile: { name: "pitch-span", label: "Lesson 3 · Your pitch range" } },
    // Lesson 5
    { text: "and how to check one change at a time.", mood: "happy", ground: "art-leaf", tile: { name: "takes-side-by-side", label: "Lesson 5 · Then and now" } },
    // The course
    { text: "Five short lessons.", mood: "happy", ground: "art-sun", tile: { name: "know-your-voice", label: "The course" } },
    // Out loud
    { text: "Out loud.", mood: "happy", ground: "art-sun", tile: { name: "know-your-voice", label: "The course" } },
  ],
};
