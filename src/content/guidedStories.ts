// Guided stories (decision 93): a second kind of story seed beside the open prompts. Each gives a few plain facts, written flat on purpose, and a few nudges toward what to add; the user invents the rest and makes it a story. Light and everyday, never painful

// Load the story focus type kept on a session
import type { StoryFocus } from "@/data/records";

// How hard a guided story feels: just the facts, or the facts with a twist to land
export type GuidedLevel = "easier" | "harder";

// One level, with its plain name and a line on what it asks
export interface GuidedLevelInfo {
  // Stable id
  id: GuidedLevel;
  // Its name on the page
  name: string;
  // One line on what it asks
  blurb: string;
}

// The levels, in the order the page shows them
export const GUIDED_LEVELS: ReadonlyArray<GuidedLevelInfo> = [
  // Just the facts
  { id: "easier", name: "Just the facts", blurb: "A few plain facts. Add the rest." },
  // With a twist
  { id: "harder", name: "With a twist", blurb: "The facts end on a twist. Make it land." },
];

// One guided story
export interface GuidedStory {
  // Stable id ("gs" and two digits), also the story's id once told (and each telling's prompt id)
  id: string;
  // Its title, shown on the card and in the library
  title: string;
  // Three to five plain facts, flat on purpose
  facts: ReadonlyArray<string>;
  // A twist to build to, for the harder ones
  twist?: string;
  // Two or three nudges toward what to add
  nudges: ReadonlyArray<string>;
  // The focus it starts with (the user can change it)
  focus: StoryFocus;
}

// The guided stories: twelve with just the facts, then twelve with a twist
export const GUIDED_STORIES: ReadonlyArray<GuidedStory> = [
  // Just the facts
  { id: "gs01", title: "The bad haircut", facts: ["You went for a haircut.", "You wanted a little off the top.", "The barber took a lot off.", "You had a party that night."], nudges: ["What did you say when you saw the mirror?", "What did your friends say?", "What did you do about it?"], focus: "dialogue" },
  { id: "gs02", title: "The cooking disaster", facts: ["You cooked dinner for friends.", "You tried a new recipe.", "Something burned.", "You ordered pizza."], nudges: ["What were you making?", "When did you notice the smell?", "What did your friends say?"], focus: "middle" },
  { id: "gs03", title: "The missed train", facts: ["You were going to see a friend.", "You ran for the train.", "The doors closed.", "You took the next one."], nudges: ["What held you up?", "What did you see through the window?", "Was the wait worth it?"], focus: "middle" },
  { id: "gs04", title: "The first day", facts: ["It was your first day at a new job.", "You got there early.", "You forgot someone's name.", "You had lunch with the team."], nudges: ["Whose name was it?", "How did you cover it?", "What was the best part of the day?"], focus: "dialogue" },
  { id: "gs05", title: "The lost phone", facts: ["You lost your phone.", "You looked everywhere.", "It was in the fridge."], nudges: ["Where did you look first?", "How did it get in the fridge?", "Who found it?"], focus: "detail" },
  { id: "gs06", title: "The camping trip", facts: ["You went camping with friends.", "It rained all night.", "The tent leaked.", "In the morning the sun came out."], nudges: ["Who got the wettest?", "What did you eat?", "What do you remember most?"], focus: "detail" },
  { id: "gs07", title: "Moving house", facts: ["You moved to a new home.", "A friend helped you carry boxes.", "The sofa would not fit through the door.", "You ate dinner on the floor."], nudges: ["How did you get the sofa in?", "What did your friend say?", "How did the first night feel?"], focus: "dialogue" },
  { id: "gs08", title: "The great escape", facts: ["Your dog got out of the garden.", "You ran down the street after it.", "A neighbour helped.", "You found it at the park."], nudges: ["What was the dog chasing?", "What did your neighbour shout?", "What did you do when you got home?"], focus: "middle" },
  { id: "gs09", title: "The job interview", facts: ["You had a job interview.", "You arrived on time.", "They had a question you did not expect.", "You got the job."], nudges: ["What was the question?", "What did you say?", "How did you hear the news?"], focus: "dialogue" },
  { id: "gs10", title: "The birthday cake", facts: ["You baked a cake for a friend's birthday.", "It came out lopsided.", "You covered it in icing.", "Everyone ate it."], nudges: ["What went wrong in the oven?", "Did anyone notice?", "What did your friend say?"], focus: "detail" },
  { id: "gs11", title: "A day at the beach", facts: ["You went to the beach.", "You built a sandcastle.", "A wave knocked it down.", "You bought an ice cream."], nudges: ["Who were you with?", "What did the castle look like?", "How did the day end?"], focus: "point" },
  { id: "gs12", title: "The driving lesson", facts: ["You had your first driving lesson.", "You stalled the car.", "The instructor stayed calm.", "You drove round the block."], nudges: ["Where did you stall?", "What did the instructor say?", "How did you feel at the end?"], focus: "dialogue" },
  // With a twist
  { id: "gs13", title: "A day at the zoo", facts: ["You went to the zoo.", "You got a hot dog.", "You saw a gorilla."], twist: "The gorilla was staring right at you.", nudges: ["What went wrong with the hot dog?", "What did the gorilla do?", "How did it end?"], focus: "middle" },
  { id: "gs14", title: "The wedding rings", facts: ["Your friend got married.", "You were in charge of the rings.", "The ceremony started."], twist: "The rings were not in your pocket.", nudges: ["Where were they?", "What did you whisper?", "How did it end?"], focus: "middle" },
  { id: "gs15", title: "The wrong order", facts: ["You went to a restaurant.", "You ordered the pasta.", "The waiter brought something else."], twist: "You ate it anyway, and it was the best meal of the year.", nudges: ["What came instead?", "What did you say to the waiter?", "Did you ever order it again?"], focus: "point" },
  { id: "gs16", title: "The surprise party", facts: ["You planned a surprise party for a friend.", "Everyone hid in the dark.", "The door opened."], twist: "It was the wrong person.", nudges: ["Who walked in?", "What did everyone shout?", "Where was your friend?"], focus: "dialogue" },
  { id: "gs17", title: "Stuck in the lift", facts: ["You got into a lift at work.", "Your manager got in too.", "The lift stopped between floors."], twist: "You were holding a very large cake.", nudges: ["Why the cake?", "What did you talk about?", "What happened to the cake?"], focus: "detail" },
  { id: "gs18", title: "The window seat", facts: ["You were flying home.", "You had the window seat.", "A small child sat next to you."], twist: "By the end of the flight, they were teaching you a card game.", nudges: ["What was the game?", "What did the child say?", "How did you say goodbye?"], focus: "dialogue" },
  { id: "gs19", title: "The missing suitcase", facts: ["You flew somewhere on holiday.", "Your suitcase did not arrive.", "You bought clothes at a market."], twist: "The suitcase turned up on your last day.", nudges: ["What did you buy?", "What did you wear?", "What did you miss most from the suitcase?"], focus: "point" },
  { id: "gs20", title: "The last minute", facts: ["You played in a friendly football match.", "You were in goal.", "It was the last minute."], twist: "You had never played in goal before.", nudges: ["How did you end up in goal?", "What happened with the last shot?", "What did your team say?"], focus: "middle" },
  { id: "gs21", title: "Locked out", facts: ["You went to put the bin out.", "The door closed behind you.", "You were in your slippers."], twist: "Your keys were on the kitchen table, where you could see them.", nudges: ["Who did you call?", "What did a neighbour say?", "How did you get back in?"], focus: "detail" },
  { id: "gs22", title: "The talent show", facts: ["Your office held a talent show.", "A colleague signed you up.", "You had a week to get ready."], twist: "You had never sung in public before.", nudges: ["What did you choose to sing?", "What happened on stage?", "What did people say after?"], focus: "middle" },
  { id: "gs23", title: "The first date", facts: ["You went on a first date.", "You picked a restaurant you liked.", "It was closed."], twist: "You ended up eating chips on a park bench, and it was perfect.", nudges: ["Where did you go instead?", "What did you talk about?", "What did they say at the end?"], focus: "point" },
  { id: "gs24", title: "The garden visitor", facts: ["You were reading in the garden.", "You heard a noise in the bushes.", "You went to look."], twist: "It was a hedgehog with a crisp packet on its head.", nudges: ["What did you think it was?", "What did you do?", "Who did you tell?"], focus: "detail" },
];

// How hard a guided story feels: a twist makes it harder
export function guidedLevel(story: GuidedStory): GuidedLevel {
  // Harder with a twist, easier without
  return story.twist ? "harder" : "easier";
}

// Look up a guided story by id
export function findGuidedStory(id: string): GuidedStory | undefined {
  // The matching story
  return GUIDED_STORIES.find((story) => story.id === id);
}

// Every fact the telling should keep: the plain facts, then the twist when there is one
export function factsOf(story: GuidedStory): string[] {
  // The facts, with the twist last
  return story.twist ? [...story.facts, story.twist] : [...story.facts];
}

// Calendar days since a fixed start, for taking guided stories in turn
function dayNumber(day: Date): number {
  // Whole days since 1 January 2026, by the local calendar
  return Math.round((new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime() - new Date(2026, 0, 1).getTime()) / 86_400_000);
}

// The guided story for a day: a stride of 5 is coprime with 24, so every one comes up before any repeats
export function guidedStoryForDay(day: Date): GuidedStory {
  // Position in the list, kept positive
  const index = (((dayNumber(day) * 5) % GUIDED_STORIES.length) + GUIDED_STORIES.length) % GUIDED_STORIES.length;
  // The story
  return GUIDED_STORIES[index]!;
}
