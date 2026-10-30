// Tell it again, better's 15-second short (decision 155): a good story told flat, the course, three of its lessons, and the close

// Load the short type
import type { Short } from "../shorts";

// The short (8 phrases)
export const TELL_IT_AGAIN_SHORT: Short | null = {
  id: "tell-it-again",
  title: "Tell it again, better",
  tile: "tell-it-again",
  strap: "5 short lessons · practise out loud",
  lines: [
    // The flat story
    { text: "Got a good story that comes out flat?", mood: "worried", ground: "art-sky", bubble: "…" },
    // The course (the voice pauses after "again", so it covers two phrases)
    { text: "Tell it again, better.", mood: "ready", ground: "art-sun", tile: { name: "tell-it-again", label: "The course" }, span: 2 },
    // Lesson 2
    { text: "Start close to the change.", mood: "ready", ground: "art-leaf", tile: { name: "close-to-the-change", label: "Lesson 2 · Start close to the change" } },
    // Lesson 3
    { text: "Slow down the moment.", mood: "ready", ground: "art-plum", tile: { name: "slow-the-moment", label: "Lesson 3 · Slow down the moment" } },
    // Lesson 5
    { text: "End on what it meant.", mood: "happy", ground: "art-sun", tile: { name: "what-it-meant", label: "Lesson 5 · End on what it meant" } },
    // The close
    { text: "Then tell it again.", mood: "happy", ground: "art-bloom" },
    // (better)
    { text: "Better every time.", mood: "happy", ground: "art-coral" },
  ],
};
