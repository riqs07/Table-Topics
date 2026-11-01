// The tough question's 15-second short (decision 155)

// Load the short type
import type { Short } from "../shorts";

// The short (8 phrases)
export const THE_TOUGH_QUESTION_SHORT: Short | null = {
  id: "the-tough-question",
  title: "The tough question",
  tile: "the-tough-question",
  strap: "5 short lessons · practise out loud",
  lines: [
    // The sharp question
    { text: "Ever been thrown by a tough question?", mood: "worried", ground: "art-plum", bubble: "?!" },
    // The ramble
    { text: "Your mind races, and you ramble.", mood: "worried", ground: "art-coral", bubble: "…" },
    // Lesson 1
    { text: "The tough question teaches you to say it back,", mood: "ready", ground: "art-sun", tile: { name: "say-it-back", label: "Lesson 1 · Say it back" } },
    // Lesson 2
    { text: "find the doubt behind it,", mood: "ready", ground: "art-leaf", tile: { name: "find-the-doubt", label: "Lesson 2 · Find the doubt" } },
    // Lesson 5 (the voice pauses at its comma)
    { text: "and answer short, then stop.", mood: "happy", ground: "art-sky", tile: { name: "short-then-stop", label: "Lesson 5 · Short, then stop" }, span: 2 },
    // The course
    { text: "Five short lessons.", mood: "happy", ground: "art-sun", tile: { name: "the-tough-question", label: "The course" } },
    // Out loud
    { text: "Out loud.", mood: "happy", ground: "art-sun", tile: { name: "the-tough-question", label: "The course" } },
  ],
};
