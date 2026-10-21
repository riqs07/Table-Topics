// Storytelling (decision 92): the bank of story prompts, the optional story shapes, the one-focus drills, and the two lengths. Light, everyday and personal: never a prompt that asks for something painful

// Load the story choice types kept on a session
import type { StoryBeat, StoryFocus, StoryLength, StoryShape } from "@/data/records";

// A group of prompts in the bank
export type StoryGroupId = "wrong" | "win" | "first" | "person" | "place" | "surprise" | "lesson" | "funny";

// One group, with its plain name
export interface StoryGroup {
  // Stable id
  id: StoryGroupId;
  // Its name on the page
  name: string;
}

// The groups, in the order the page shows them
export const STORY_GROUPS: ReadonlyArray<StoryGroup> = [
  // Small mishaps
  { id: "wrong", name: "A time something went wrong" },
  // Small wins
  { id: "win", name: "A small win" },
  // Firsts
  { id: "first", name: "A first time" },
  // People
  { id: "person", name: "Someone who changed your mind" },
  // Places
  { id: "place", name: "A place" },
  // Surprises
  { id: "surprise", name: "A surprise" },
  // Lessons
  { id: "lesson", name: "Something you learned" },
  // Funny ones
  { id: "funny", name: "Something funny" },
];

// One story prompt
export interface StoryPrompt {
  // Stable id, also the story's id once told (and the session's prompt id)
  id: string;
  // Its group
  group: StoryGroupId;
  // The prompt as shown
  text: string;
  // A short title for the library
  title: string;
}

// The prompts, five a group
export const STORY_PROMPTS: ReadonlyArray<StoryPrompt> = [
  // A time something went wrong
  { id: "sp01", group: "wrong", text: "Tell me about a time a plan fell apart at the last minute.", title: "The plan that fell apart" },
  { id: "sp02", group: "wrong", text: "Tell me about a time you got lost, or took a wrong turn.", title: "The wrong turn" },
  { id: "sp03", group: "wrong", text: "Tell me about a time a recipe or a repair did not go to plan.", title: "The recipe that went wrong" },
  { id: "sp04", group: "wrong", text: "Tell me about a time you were running late for something that mattered.", title: "Running late" },
  { id: "sp05", group: "wrong", text: "Tell me about a time the weather changed your day.", title: "The weather won" },
  // A small win
  { id: "sp06", group: "win", text: "Tell me about a small win you were quietly proud of.", title: "A quiet win" },
  { id: "sp07", group: "win", text: "Tell me about a time you finally fixed something that had bugged you for ages.", title: "Finally fixed it" },
  { id: "sp08", group: "win", text: "Tell me about a time you helped someone and it worked.", title: "The help that worked" },
  { id: "sp09", group: "win", text: "Tell me about a time you got better at something you used to find hard.", title: "Getting better at it" },
  { id: "sp10", group: "win", text: "Tell me about a time you said yes to something and were glad you did.", title: "The yes I was glad of" },
  // A first time
  { id: "sp11", group: "first", text: "Tell me about the first time you tried a food you now love.", title: "The first taste" },
  { id: "sp12", group: "first", text: "Tell me about your first day at a job or a new school.", title: "My first day" },
  { id: "sp13", group: "first", text: "Tell me about the first time you did something on your own.", title: "On my own for the first time" },
  { id: "sp14", group: "first", text: "Tell me about the first time you travelled somewhere new.", title: "Somewhere new" },
  { id: "sp15", group: "first", text: "Tell me about the first thing you ever made or built.", title: "The first thing I made" },
  // Someone who changed your mind
  { id: "sp16", group: "person", text: "Tell me about someone who changed your mind about something.", title: "The person who changed my mind" },
  { id: "sp17", group: "person", text: "Tell me about a stranger who made your day better.", title: "The kind stranger" },
  { id: "sp18", group: "person", text: "Tell me about a teacher or coach who saw something in you.", title: "The teacher who noticed" },
  { id: "sp19", group: "person", text: "Tell me about a friend you met in an unlikely way.", title: "How we met" },
  { id: "sp20", group: "person", text: "Tell me about a piece of advice someone gave you that stuck.", title: "The advice that stuck" },
  // A place
  { id: "sp21", group: "place", text: "Tell me about a place you go to think.", title: "Where I go to think" },
  { id: "sp22", group: "place", text: "Tell me about a café, shop or corner you love, and why.", title: "My favourite corner" },
  { id: "sp23", group: "place", text: "Tell me about a place from when you were small.", title: "A place from childhood" },
  { id: "sp24", group: "place", text: "Tell me about a view that stopped you for a moment.", title: "The view" },
  { id: "sp25", group: "place", text: "Tell me about a room or a home that felt like yours.", title: "A room of my own" },
  // A surprise
  { id: "sp26", group: "surprise", text: "Tell me about a time something turned out better than you expected.", title: "Better than expected" },
  { id: "sp27", group: "surprise", text: "Tell me about a surprise, given or received.", title: "The surprise" },
  { id: "sp28", group: "surprise", text: "Tell me about a time you found out something about yourself.", title: "What I found out" },
  { id: "sp29", group: "surprise", text: "Tell me about a coincidence you still think about.", title: "The coincidence" },
  { id: "sp30", group: "surprise", text: "Tell me about a time a small choice led somewhere unexpected.", title: "A small choice" },
  // Something you learned
  { id: "sp31", group: "lesson", text: "Tell me about a mistake that taught you something useful.", title: "The useful mistake" },
  { id: "sp32", group: "lesson", text: "Tell me about a time you changed how you do something.", title: "Doing it differently" },
  { id: "sp33", group: "lesson", text: "Tell me about something a child or a pet taught you.", title: "What they taught me" },
  { id: "sp34", group: "lesson", text: "Tell me about a time you were wrong, and glad to be.", title: "Glad to be wrong" },
  { id: "sp35", group: "lesson", text: "Tell me about a habit you picked up and how it started.", title: "How the habit started" },
  // Something funny
  { id: "sp36", group: "funny", text: "Tell me about a time you laughed so hard you could not stop.", title: "The laugh I couldn't stop" },
  { id: "sp37", group: "funny", text: "Tell me about a mix-up with a name, a word or an order.", title: "The mix-up" },
  { id: "sp38", group: "funny", text: "Tell me about a time an animal stole the show.", title: "The animal that stole the show" },
  { id: "sp39", group: "funny", text: "Tell me about a gift that did not go as planned.", title: "The gift" },
  { id: "sp40", group: "funny", text: "Tell me about a time you said the wrong thing at the right moment.", title: "The wrong thing to say" },
];

// The prompt id of a story seeded by one of the user's moment notes: "moment-" and the note's session id
export const MOMENT_SEED_PREFIX = "moment-";

// The story id for a moment note
export function momentSeedId(momentSessionId: string): string {
  // The prefix and the note's id
  return `${MOMENT_SEED_PREFIX}${momentSessionId}`;
}

// The moment note's session id inside a story id, or null when the story came from the bank
export function momentIdOf(storyId: string): string | null {
  // Only moment seeds carry one
  return storyId.startsWith(MOMENT_SEED_PREFIX) ? storyId.slice(MOMENT_SEED_PREFIX.length) : null;
}

// Look up a prompt from the bank by id
export function findStoryPrompt(id: string): StoryPrompt | undefined {
  // The matching prompt
  return STORY_PROMPTS.find((prompt) => prompt.id === id);
}

// Whether an id names a story seed: a prompt from the bank, or a moment note
export function isStorySeed(id: string): boolean {
  // Either kind
  return findStoryPrompt(id) !== undefined || (momentIdOf(id) ?? "") !== "";
}

// Calendar days since a fixed start, for taking prompts in turn
function dayNumber(day: Date): number {
  // Whole days since 1 January 2026, by the local calendar
  return Math.round((new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime() - new Date(2026, 0, 1).getTime()) / 86_400_000);
}

// Today's story prompt: one a day, stepping through the groups so neighbouring days differ (an offset gives the next one along)
export function storyPromptForDay(day: Date, offset = 0): StoryPrompt {
  // Position in the bank, kept positive; a stride of 7 is coprime with 40, so every prompt comes up before any repeats
  const index = ((((dayNumber(day) + offset) * 7) % STORY_PROMPTS.length) + STORY_PROMPTS.length) % STORY_PROMPTS.length;
  // The prompt
  return STORY_PROMPTS[index]!;
}

// One story shape: a light structure shown as a small card while planning
export interface StoryShapeInfo {
  // Stable id
  id: StoryShape;
  // Its plain name
  name: string;
  // One line on what it is
  blurb: string;
  // The beats, in order
  beats: ReadonlyArray<string>;
}

// The shapes, Classic first (the default)
export const STORY_SHAPES: ReadonlyArray<StoryShapeInfo> = [
  // The classic arc (Labov's parts of a told story, in plain words)
  { id: "classic", name: "Classic", blurb: "The shape most told stories take.", beats: ["Where and who", "What went wrong", "The turn", "How it ended", "What it meant"] },
  // Cause and effect rather than a list (the "but / therefore" rule)
  { id: "but-therefore", name: "But and so", blurb: "Link each beat with “but” or “so”, never “and then”.", beats: ["What you wanted", "But…", "So…", "But…", "So, in the end…"] },
  // A change over time
  { id: "then-now", name: "Then and now", blurb: "How it was, the moment it changed, how it is now.", beats: ["How it was before", "The moment it changed", "How it is now"] },
  // One moment, told slowly
  { id: "small-moment", name: "One small moment", blurb: "A few seconds, slowed right down.", beats: ["Where you were, in one line", "The moment: what you saw, heard, said", "What it meant to you"] },
];

// One focus for this telling: one thing to try, from the story drills
export interface StoryFocusInfo {
  // Stable id
  id: StoryFocus;
  // Its plain name
  name: string;
  // How to do it, in one line
  tip: string;
}

// The focuses
export const STORY_FOCUSES: ReadonlyArray<StoryFocusInfo> = [
  // Start in the action
  { id: "middle", name: "Start in the middle", tip: "Skip the set-up. Open on the moment things start moving." },
  // Dialogue
  { id: "dialogue", name: "Add one line of what someone said", tip: "Say their exact words: “She said, ‘You’re on in five.’”" },
  // A concrete detail
  { id: "detail", name: "One vivid detail", tip: "A name, a number, a colour or a sound they can picture." },
  // End on the point
  { id: "point", name: "End on the point", tip: "Finish on what changed or what it meant. Then stop." },
  // Short
  { id: "minute", name: "Under a minute", tip: "Cut to the moment that matters and land it in a minute." },
];

// One length to tell it in
export interface StoryLengthInfo {
  // Stable id
  id: StoryLength;
  // Its name
  name: string;
  // How long, in words
  detail: string;
}

// The two lengths
export const STORY_LENGTHS: ReadonlyArray<StoryLengthInfo> = [
  // About a minute
  { id: "short", name: "Short", detail: "about 1 min" },
  // Two to three minutes
  { id: "full", name: "Full", detail: "2 to 3 min" },
];

// Look up a shape, falling back to Classic
export function findStoryShape(id: string | null | undefined): StoryShapeInfo {
  // The match, or the first
  return STORY_SHAPES.find((shape) => shape.id === id) ?? STORY_SHAPES[0]!;
}

// Look up a focus, or null for none
export function findStoryFocus(id: string | null | undefined): StoryFocusInfo | null {
  // The match, or none
  return STORY_FOCUSES.find((focus) => focus.id === id) ?? null;
}

// Whether a value names a shape
export function isStoryShape(value: unknown): value is StoryShape {
  // One of the listed ids
  return STORY_SHAPES.some((shape) => shape.id === value);
}

// Whether a value names a focus
export function isStoryFocus(value: unknown): value is StoryFocus {
  // One of the listed ids
  return STORY_FOCUSES.some((focus) => focus.id === value);
}

// Whether a value names a length
export function isStoryLength(value: unknown): value is StoryLength {
  // One of the two
  return value === "short" || value === "full";
}

// A short title from a moment note's words: the first eight, with an ellipsis when cut
export function momentTitle(transcript: string): string {
  // The words
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  // Nothing caught
  if (words.length === 0) return "A moment";
  // The first eight, marked when cut
  return words.length > 8 ? `${words.slice(0, 8).join(" ")}…` : words.join(" ");
}

// The beats the story coach listens for, in plain names (decision 92)
export const STORY_BEAT_NAMES: Readonly<Record<StoryBeat, string>> = { setting: "Where and who", stakes: "What was at stake", turn: "The turn", ending: "How it ended", meaning: "What it meant" };
