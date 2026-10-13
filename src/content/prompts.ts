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

// Easier prompts for 30-second warm-ups. DRAFT: approved at checkpoint C13 with the main prompts
export const WARMUP_PROMPTS: ReadonlyArray<Prompt> = [
  // Warm-up 1
  { id: "w001", text: "Describe what you can see right now." },
  // Warm-up 2
  { id: "w002", text: "What did you have for breakfast?" },
  // Warm-up 3
  { id: "w003", text: "Name three things you did yesterday." },
  // Warm-up 4
  { id: "w004", text: "What is the weather like where you are?" },
  // Warm-up 5
  { id: "w005", text: "Describe the last thing that made you smile." },
  // Warm-up 6
  { id: "w006", text: "What is your favorite snack, and why?" },
  // Warm-up 7
  { id: "w007", text: "Describe the shoes you are wearing." },
  // Warm-up 8
  { id: "w008", text: "What is one thing on your to-do list today?" },
  // Warm-up 9
  { id: "w009", text: "Tell me about the last place you walked to." },
  // Warm-up 10
  { id: "w010", text: "What sound can you hear right now?" },
  // Warm-up 11
  { id: "w011", text: "Describe your favorite mug or cup." },
  // Warm-up 12
  { id: "w012", text: "What is the last song you listened to?" },
  // Warm-up 13
  { id: "w013", text: "Name a color you like and where you see it." },
  // Warm-up 14
  { id: "w014", text: "What would you cook tonight if you could?" },
  // Warm-up 15
  { id: "w015", text: "Describe the room you are in." },
  // Warm-up 16
  { id: "w016", text: "What is one small thing you are looking forward to?" },
  // Warm-up 17
  { id: "w017", text: "Tell me about a plant, pet, or tree you know." },
  // Warm-up 18
  { id: "w018", text: "What did you do last Saturday?" },
  // Warm-up 19
  { id: "w019", text: "Describe your route to work or school." },
  // Warm-up 20
  { id: "w020", text: "What is your favorite time of day?" },
  // Warm-up 21
  { id: "w021", text: "What is something you bought recently?" },
  // Warm-up 22
  { id: "w022", text: "Describe a smell you like." },
  // Warm-up 23
  { id: "w023", text: "What app do you open first each morning?" },
  // Warm-up 24
  { id: "w024", text: "Tell me about the last film or show you watched." },
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

// Pick from a list for a given day, stepping so neighboring days get unrelated items; offset moves along the list
function pickForDay(list: ReadonlyArray<Prompt>, day: Date, offset: number): Prompt {
  // Count calendar days since the start of the rotation
  const dayNumber = daysBetween(START, day);
  // Number of items
  const count = list.length;
  // Step through the list, wrapping around, and keep the result positive
  const index = (((dayNumber * stride(count) + offset) % count) + count) % count;
  // Look up the item (always present because the index is in range)
  return list[index] as Prompt;
}

// The prompt for a given day; "choose another" asks for the next one along with offset 1, 2, ...
export function promptForDay(day: Date, offset = 0): Prompt {
  // Pick from the full prompts
  return pickForDay(PROMPTS, day, offset);
}

// The warm-up prompt for a given day
export function warmupPromptForDay(day: Date, offset = 0): Prompt {
  // Pick from the warm-up prompts
  return pickForDay(WARMUP_PROMPTS, day, offset);
}

// Find any prompt (full or warm-up) by its saved id
export function findPrompt(id: string): Prompt | undefined {
  // Look in both lists
  return [...PROMPTS, ...WARMUP_PROMPTS].find((prompt) => prompt.id === id);
}
