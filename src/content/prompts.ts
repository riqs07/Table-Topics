// The daily prompt library. DRAFT: approved at checkpoint C13 before shipping

// Load the calendar-day helpers
import { daysBetween } from "@/core/dates";

// One daily prompt
export interface Prompt {
  // Stable id stored with each session
  id: string;
  // The prompt as shown to the user
  text: string;
}

// Every prompt; ids never change once used, so old sessions keep their prompt
export const PROMPTS: ReadonlyArray<Prompt> = [
  // Prompt 1
  { id: "p001", text: "Describe a small thing that made your week better." },
  // Prompt 2
  { id: "p002", text: "Tell me about a place you love going to." },
  // Prompt 3
  { id: "p003", text: "What is something you changed your mind about?" },
  // Prompt 4
  { id: "p004", text: "Describe your last really good meal." },
  // Prompt 5
  { id: "p005", text: "What is a skill you would like to learn, and why?" },
  // Prompt 6
  { id: "p006", text: "Walk me through your ideal morning." },
  // Prompt 7
  { id: "p007", text: "Tell me about a song you never skip." },
  // Prompt 8
  { id: "p008", text: "What is a piece of advice that stuck with you?" },
  // Prompt 9
  { id: "p009", text: "Describe someone who made you laugh recently." },
  // Prompt 10
  { id: "p010", text: "What is a small habit that helps you?" },
  // Prompt 11
  { id: "p011", text: "Tell me about a trip you would take tomorrow if you could." },
  // Prompt 12
  { id: "p012", text: "What is something you are quietly proud of?" },
  // Prompt 13
  { id: "p013", text: "Describe your favorite room and what is in it." },
  // Prompt 14
  { id: "p014", text: "What would you teach a class on?" },
  // Prompt 15
  { id: "p015", text: "Tell me about a book, film or show you would recommend." },
  // Prompt 16
  { id: "p016", text: "What does a good weekend look like for you?" },
  // Prompt 17
  { id: "p017", text: "Describe a problem you solved this month." },
  // Prompt 18
  { id: "p018", text: "What is something you are looking forward to?" },
  // Prompt 19
  { id: "p019", text: "Tell me about your first job." },
  // Prompt 20
  { id: "p020", text: "What is a smell or sound that brings back a memory?" },
  // Prompt 21
  { id: "p021", text: "Explain how to make something you cook often." },
  // Prompt 22
  { id: "p022", text: "What is one thing you would change about your town?" },
  // Prompt 23
  { id: "p023", text: "Describe a time you tried something new." },
  // Prompt 24
  { id: "p024", text: "What makes a good friend, in your view?" },
  // Prompt 25
  { id: "p025", text: "Tell me about an object you have kept for years." },
  // Prompt 26
  { id: "p026", text: "What is a question you wish people asked you more?" },
  // Prompt 27
  { id: "p027", text: "Describe the view from a window you know well." },
  // Prompt 28
  { id: "p028", text: "What is the best gift you have given?" },
  // Prompt 29
  { id: "p029", text: "Tell me about a time you got lost." },
  // Prompt 30
  { id: "p030", text: "What is something you do differently from most people?" },
  // Prompt 31
  { id: "p031", text: "Describe a perfect rainy day." },
  // Prompt 32
  { id: "p032", text: "What is a rule you think should exist?" },
  // Prompt 33
  { id: "p033", text: "Tell me about a person you admire and why." },
  // Prompt 34
  { id: "p034", text: "What did you want to be when you were ten?" },
  // Prompt 35
  { id: "p035", text: "Describe something you made with your hands." },
  // Prompt 36
  { id: "p036", text: "What would you do with a free afternoon today?" },
];

// Day the rotation counts from
const START = new Date(2026, 0, 1);

// Greatest common divisor, used to pick a step that visits every prompt
function gcd(a: number, b: number): number {
  // Euclid's method
  return b === 0 ? a : gcd(b, a % b);
}

// A step through the list that shares no factor with its length, so every prompt comes up before any repeats
function stride(count: number): number {
  // Start at 7 so neighboring days get unrelated prompts
  let step = 7;
  // Move up until the step shares no factor with the count
  while (gcd(step, count) !== 1) step += 1;
  // Hand back the step
  return step;
}

// The prompt for a given day; "choose another" asks for the next one along with offset 1, 2, ...
export function promptForDay(day: Date, offset = 0): Prompt {
  // Count calendar days since the start of the rotation
  const dayNumber = daysBetween(START, day);
  // Number of prompts
  const count = PROMPTS.length;
  // Step through the list, wrapping around, and keep the result positive
  const index = (((dayNumber * stride(count) + offset) % count) + count) % count;
  // Look up the prompt (always present because the index is in range)
  return PROMPTS[index] as Prompt;
}
