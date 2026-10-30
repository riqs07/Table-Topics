// Interview ready's 15-second short (decision 155)

// Load the short type
import type { Short } from "../shorts";

// The short (9 phrases in the voice: a pause after "And", and one after "Say what you did")
export const INTERVIEW_READY_SHORT: Short | null = {
  id: "interview-ready",
  title: "Interview ready",
  tile: "interview-ready",
  strap: "5 short lessons · practise out loud",
  lines: [
    // The interview coming up
    { text: "Got a job interview coming up?", mood: "wow", ground: "art-sky", bubble: "?" },
    // The blank (the voice pauses after "And")
    { text: "And “tell me about yourself” leaves you blank?", mood: "worried", ground: "art-plum", bubble: "…", span: 2 },
    // Lesson 1
    { text: "Start from one moment, not your CV.", mood: "ready", ground: "art-leaf", tile: { name: "tell-me-about-yourself", label: "Lesson 1 · Tell me about yourself" } },
    // Lesson 2
    { text: "Tell it in four beats.", mood: "ready", ground: "art-sky", tile: { name: "star-answer", label: "Lesson 2 · The STAR answer" } },
    // Lesson 3 (the voice pauses after "Say what you did")
    { text: "Say what you did, with a number.", mood: "happy", ground: "art-sun", tile: { name: "own-it", label: "Lesson 3 · Own it" }, span: 2 },
    // The course
    { text: "Interview ready.", mood: "happy", ground: "art-plum", tile: { name: "interview-ready", label: "The course" } },
    // The close
    { text: "Walk in with your stories ready.", mood: "happy", ground: "art-bloom" },
  ],
};
