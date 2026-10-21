// The weekly check-in's content (decision 100): the passage read aloud and the pitch, the same every week, and two matched pools of twelve, a story and a surprise question, taken in turn so neither repeats for twelve weeks. Light and everyday: never a prompt that asks for something painful

// Load the passage and prompt shapes (types only, so this file can be loaded by the prompt and story lists without a loop)
import type { Passage, Prompt } from "@/content/prompts";
// Load the story prompt shape
import type { StoryPrompt } from "@/content/stories";
// Load the short-speech plan shape, which the pitch is recorded as
import type { Outline } from "@/core/outline";

// The passage read aloud every week: written for the app, about 120 words (45 to 60 seconds), with a statement, a list, a question, an exclamation, someone's words and numbers, so pace, pauses and pitch all have something to show
export const CHECK_IN_PASSAGE: Passage = {
  // Its id, the same every week, so every reading of it is the same text
  id: "ci-read",
  // A passage written for practice
  kind: "practice",
  // Its title
  title: "The Saturday walk",
  // Where it is from
  source: "Weekly check-in passage",
  // The title, as the prompt text in History
  text: "The Saturday walk",
  // The words
  body: "Every Saturday I take the same walk to the market. It is not far, about twenty minutes, but I never hurry. Why would I? The baker waves from her door. The man at the flower stall calls out the price of tulips, as if I might have forgotten since last week. Some days it rains; some days the sun is so bright that I have to squint. Once, a small brown dog followed me all the way home! I stopped, knelt down, and asked him, “Where do you think you’re going?” He did not answer, of course. Walks like this remind me that small things, done again and again, add up to something. So next Saturday, I will go again.",
};

// The pitch's prompt id, the same every week
export const CHECK_IN_PITCH_ID = "ci-pitch";

// The two-minute pitch about yourself, recorded as a short speech with a two-minute goal and its light (the points are a guide, not a script)
export const CHECK_IN_PITCH: Outline = {
  // What to talk about
  topic: "Your two-minute pitch: who you are and what you do.",
  // Three points to cover
  points: ["Who you are, in one line", "What you do, and who it helps", "What you’d like to do next"],
  // Two minutes
  goalMinutes: 2,
};

// The story pool: twelve light, everyday prompts of about the same weight, each easy to answer from anyone's life in a minute or so
export const CHECK_IN_STORIES: ReadonlyArray<StoryPrompt> = [
  // A meal
  { id: "cis01", group: "place", text: "Tell us about a meal you still remember.", title: "A meal you remember" },
  // Getting lost
  { id: "cis02", group: "wrong", text: "Tell us about a time you got lost, and how you found your way.", title: "The time you got lost" },
  // A stranger's kindness
  { id: "cis03", group: "person", text: "Tell us about a small kindness from a stranger.", title: "A stranger’s kindness" },
  // Plans that changed
  { id: "cis04", group: "wrong", text: "Tell us about a plan that changed at the last minute, and what happened instead.", title: "The plan that changed" },
  // Something made
  { id: "cis05", group: "win", text: "Tell us about something you made with your own hands.", title: "Something you made" },
  // Laughing
  { id: "cis06", group: "funny", text: "Tell us about a time you laughed until it hurt.", title: "Laughing until it hurt" },
  // A trip
  { id: "cis07", group: "surprise", text: "Tell us about a trip, near or far, that surprised you.", title: "A trip that surprised you" },
  // A first try
  { id: "cis08", group: "first", text: "Tell us about the first time you tried something new.", title: "The first time you tried it" },
  // Being new
  { id: "cis09", group: "first", text: "Tell us about a time you were the new person somewhere.", title: "Being the new person" },
  // An object
  { id: "cis10", group: "lesson", text: "Tell us about something you own that has a story behind it.", title: "Something with a story" },
  // Helping a friend
  { id: "cis11", group: "person", text: "Tell us about a time you helped a friend with something.", title: "Helping a friend" },
  // The weather
  { id: "cis12", group: "surprise", text: "Tell us about a day the weather changed your plans.", title: "When the weather changed plans" },
];

// The surprise question pool: twelve Rapid Fire questions of about the same difficulty, quick to grasp and easy to answer for a minute or two
export const CHECK_IN_QUESTIONS: ReadonlyArray<Prompt> = [
  // Your town
  { id: "ciq01", text: "What is one thing you would change about your town?" },
  // A skill overnight
  { id: "ciq02", text: "If you could master one skill overnight, which would it be?" },
  // Advice
  { id: "ciq03", text: "What is the best piece of advice you have been given?" },
  // A good weekend
  { id: "ciq04", text: "What makes a good weekend?" },
  // An invention
  { id: "ciq05", text: "Which invention could you not live without?" },
  // A time capsule
  { id: "ciq06", text: "What would you put in a time capsule?" },
  // Cheering up
  { id: "ciq07", text: "What is a small thing that always cheers you up?" },
  // A day in a job
  { id: "ciq08", text: "What job would you like to try for a day?" },
  // School
  { id: "ciq09", text: "What is the most useful thing you learned at school?" },
  // A day out
  { id: "ciq10", text: "Where would you go for a perfect day out?" },
  // A habit
  { id: "ciq11", text: "What is a habit you are glad you have?" },
  // A season
  { id: "ciq12", text: "Which season suits you best, and why?" },
];

// Where a check-in number lands in a pool of a given size: the first check-in takes the first item, and each one after takes the next, wrapping round, so no item repeats until the pool has been used up
export function poolIndex(week: number, size: number): number {
  // Counted from zero, kept positive for any number
  return ((((Math.floor(week) - 1) % size) + size) % size);
}

// A check-in's story prompt by its number
export function checkInStory(week: number): StoryPrompt {
  // Taken in turn
  return CHECK_IN_STORIES[poolIndex(week, CHECK_IN_STORIES.length)]!;
}

// A check-in's surprise question by its number
export function checkInQuestion(week: number): Prompt {
  // Taken in turn
  return CHECK_IN_QUESTIONS[poolIndex(week, CHECK_IN_QUESTIONS.length)]!;
}

// Find a check-in story prompt by id
export function findCheckInStory(id: string): StoryPrompt | undefined {
  // The matching prompt
  return CHECK_IN_STORIES.find((prompt) => prompt.id === id);
}
