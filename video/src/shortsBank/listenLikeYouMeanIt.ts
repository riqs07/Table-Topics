// Listen like you mean it's 15-second short (decision 155)

// Load the short type
import type { Short } from "../shorts";

// The short (7 phrases)
export const LISTEN_LIKE_YOU_MEAN_IT_SHORT: Short | null = {
  id: "listen-like-you-mean-it",
  title: "Listen like you mean it",
  tile: "listen-like-you-mean-it",
  strap: "5 short lessons · practise out loud",
  lines: [
    // Waiting for your turn
    { text: "Ever caught yourself just waiting for your turn to talk?", mood: "worried", ground: "art-sky", bubble: "…" },
    // Jumping to advice
    { text: "Or jumping straight to advice?", mood: "worried", ground: "art-plum", bubble: "!" },
    // Lesson 1
    { text: "Listen like you mean it teaches you to react to the moment,", mood: "ready", ground: "art-sun", tile: { name: "react-to-the-moment", label: "Lesson 1 · React to the moment" } },
    // Lesson 3
    { text: "stay on their story,", mood: "ready", ground: "art-sky", tile: { name: "stay-on-their-story", label: "Lesson 3 · Stay on their story" } },
    // Lesson 4
    { text: "and hold the advice.", mood: "happy", ground: "art-leaf", tile: { name: "hold-the-advice", label: "Lesson 4 · Hold the advice" } },
    // The course
    { text: "Five short lessons.", mood: "happy", ground: "art-sun", tile: { name: "listen-like-you-mean-it", label: "The course" } },
    // Out loud
    { text: "Out loud.", mood: "happy", ground: "art-sun", tile: { name: "listen-like-you-mean-it", label: "The course" } },
  ],
};
