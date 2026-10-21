// A guided story's telling set against its plain facts (decision 93): what the user added beyond the facts (a feeling, someone's words, a turn, specific details, a point at the end) and, as a rough check, which facts went missing. Pure, from the words the speech service caught

// Load the guided stories, to look one up by id
import { factsOf, findGuidedStory } from "@/content/guidedStories";
// Load the story checks this builds on
import { STORY_FIXES, storyChange, andThenCount, dialogueIn, detailsIn, feelingsIn, pointIn, preambleIn, turnIn, wordsOf } from "@/core/storyChecks";
// Load the record types
import type { StoryFocus, StoryShape } from "@/data/records";

// Words that carry no content of their own, so a fact is matched on the words that do ("You saw a gorilla." is matched on "gorilla")
const STOP_WORDS = new Set(["a", "an", "the", "and", "or", "but", "so", "if", "of", "to", "in", "on", "at", "for", "with", "from", "by", "into", "onto", "round", "through", "up", "down", "out", "off", "over", "after", "about", "too", "very", "just", "all", "some", "any", "not", "no", "yes", "i", "me", "my", "you", "your", "yours", "we", "us", "our", "they", "them", "their", "he", "him", "his", "she", "her", "it", "its", "this", "that", "these", "those", "there", "then", "was", "were", "is", "are", "am", "be", "been", "being", "had", "has", "have", "got", "get", "gets", "went", "go", "goes", "did", "do", "does", "done", "saw", "see", "would", "could", "should", "will", "can", "one", "next", "someone", "something", "everyone", "anyway", "where", "what", "who", "how", "when", "while", "again"]);

// Words that paint a picture without being a name or a number: colours, sizes, sounds, smells and textures (for guided stories, whose details are rarely names)
const VIVID_WORDS = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "black", "white", "grey", "gray", "brown", "golden", "silver", "huge", "giant", "enormous", "massive", "tiny", "little", "tall", "loud", "quiet", "silent", "smell", "smelled", "smelt", "stink", "stank", "sticky", "soggy", "soaked", "wet", "muddy", "freezing", "boiling", "crispy", "burnt", "smoke", "smoky", "shiny", "sparkly", "fluffy", "hairy", "slippery", "crunchy", "squeaky", "screech", "crash", "bang", "thud", "splash", "beeping", "ringing"];

// The most new details listed
const MAX_DETAILS = 5;

// A word cut to a rough stem, so "burned" meets "burn" and "boxes" meets "box" (both sides use the same rule, so it only has to be consistent)
export function stem(word: string): string {
  // Lower case, curly apostrophes straight, a trailing "'s" dropped, letters and digits only
  let base = word.toLowerCase().replace(/[‘’]/g, "'").replace(/'s$/, "").replace(/[^a-z0-9]/g, "");
  // "lorries" to "lorry"
  if (base.length > 4 && base.endsWith("ies")) base = `${base.slice(0, -3)}y`;
  // "running" to "runn"
  else if (base.length > 5 && base.endsWith("ing")) base = base.slice(0, -3);
  // "burned" to "burn"
  else if (base.length > 4 && base.endsWith("ed")) base = base.slice(0, -2);
  // "doors" to "door", but never "glass"
  else if (base.length > 3 && base.endsWith("s") && !base.endsWith("ss")) base = base.slice(0, -1);
  // "cake" and "cak(ed)" meet at "cak"
  if (base.length > 3 && base.endsWith("e")) base = base.slice(0, -1);
  // "runn" and "stopp" to "run" and "stop"
  if (base.length > 3 && base.at(-1) === base.at(-2) && !"aeiou".includes(base.at(-1)!)) base = base.slice(0, -1);
  // The stem
  return base;
}

// The content words of a fact, each as its stem, in order and once each (words of two letters or fewer and the stop words are left out)
export function contentStems(text: string): string[] {
  // The words that carry meaning
  const words = wordsOf(text).filter((word) => word.length > 2 && !STOP_WORDS.has(word.replace(/'.*$/, "")));
  // As stems, once each
  return [...new Set(words.map(stem))];
}

// The stems of everything said, plus each pair of neighbouring words run together, so "hotdog" said meets "hot dog" in a fact
function heardStems(transcript: string): Set<string> {
  // The words said
  const words = wordsOf(transcript);
  // Each word's stem
  const stems = new Set(words.map(stem));
  // Each neighbouring pair run together
  words.slice(1).forEach((word, index) => stems.add(stem(`${words[index]}${word}`)));
  // All of them
  return stems;
}

// One fact, and whether the telling kept it
export interface FactCheck {
  // The fact as given
  fact: string;
  // Whether at least half its content words were heard (a fact with none counts as kept)
  heard: boolean;
  // Its content words not heard, as they appear in the fact
  notHeard: string[];
}

// Each fact, and whether the telling kept it: heard when at least half its content words (by stem) were said, a fact's words run together counting too ("hot dog" and "hotdog")
export function factChecks(facts: ReadonlyArray<string>, transcript: string): FactCheck[] {
  // Everything said, as stems
  const said = heardStems(transcript);
  // One check per fact
  return facts.map((fact) => {
    // The fact's content words as written
    const words = wordsOf(fact).filter((word) => word.length > 2 && !STOP_WORDS.has(word.replace(/'.*$/, "")));
    // Whether each was heard, alone or run together with its neighbour
    const heard = words.map((word, index) => said.has(stem(word)) || (index > 0 && said.has(stem(`${words[index - 1]}${word}`))) || (index < words.length - 1 && said.has(stem(`${word}${words[index + 1]}`))));
    // How many were heard
    const count = heard.filter(Boolean).length;
    // Kept when at least half were heard (or there were none to hear)
    return { fact, heard: words.length === 0 || count * 2 >= words.length, notHeard: [...new Set(words.filter((_, index) => !heard[index]))] };
  });
}

// One thing the user could add beyond the facts
export interface AddedLine {
  // Which
  id: "feeling" | "dialogue" | "turn" | "details" | "point";
  // Its name
  name: string;
  // Whether the telling added it
  added: boolean;
  // What showed it, or what to try when it was not added
  note: string;
}

// Whether a found phrase was already in the facts, word for word (so it is not something the user added)
function inFacts(phrase: string, factStems: ReadonlySet<string>): boolean {
  // Every content word of it is a fact's word
  const stems = wordsOf(phrase).map(stem);
  // Only when there are words to compare
  return stems.length > 0 && stems.every((item) => factStems.has(item));
}

// The specific details the user added: names, numbers, places and times, then colours, sizes, sounds and textures, none of them already in the facts, at most five
export function newDetails(transcript: string, facts: ReadonlyArray<string>): string[] {
  // The facts' words, as stems
  const factStems = new Set(facts.flatMap((fact) => wordsOf(fact).map(stem)));
  // Names, numbers, places and times (the story checks keep the first five)
  const named = detailsIn(transcript);
  // Picture words, in the order said
  const vivid = wordsOf(transcript).filter((word) => VIVID_WORDS.includes(word));
  // Each once, leaving out words the facts already had
  const found: string[] = [];
  // Each candidate in turn
  for (const word of [...named, ...vivid]) if (!factStems.has(stem(word)) && !found.some((item) => item.toLowerCase() === word.toLowerCase())) found.push(word);
  // The first five
  return found.slice(0, MAX_DETAILS);
}

// What the telling added beyond the facts: a feeling, someone's words, a turn, specific details and a point at the end, each with what showed it (anything the facts already said does not count)
export function addedList(transcript: string, facts: ReadonlyArray<string>): AddedLine[] {
  // The facts' words, as stems
  const factStems = new Set(facts.flatMap((fact) => wordsOf(fact).map(stem)));
  // A feeling the facts did not give
  const feeling = feelingsIn(transcript).find((word) => !factStems.has(stem(word))) ?? null;
  // Someone's words
  const dialogue = dialogueIn(transcript);
  // A turn the facts did not give
  const turn = turnIn(transcript);
  // New details
  const details = newDetails(transcript, facts);
  // A point at the end
  const point = pointIn(transcript);
  // The five lines
  return [
    // A feeling
    { id: "feeling", name: "A feeling", added: feeling !== null, note: feeling ? `“${feeling}”` : "How did it feel? One word turns facts into your story." },
    // Someone's words
    { id: "dialogue", name: "Someone’s words", added: dialogue !== null && !inFacts(dialogue, factStems), note: dialogue && !inFacts(dialogue, factStems) ? (dialogue.startsWith("“") ? dialogue : `“${dialogue}”`) : "Give someone a line, in their words." },
    // A turn
    { id: "turn", name: "A turn", added: turn !== null && !inFacts(turn, factStems), note: turn && !inFacts(turn, factStems) ? `“${turn}”` : "A “but”, or the moment it changed." },
    // New details
    { id: "details", name: "Details of your own", added: details.length > 0, note: details.length > 0 ? details.map((detail) => `“${detail}”`).join(", ") : "A name, a number, a colour or a sound the facts don’t give." },
    // A point at the end
    { id: "point", name: "A point at the end", added: point !== null && !inFacts(point, factStems), note: point && !inFacts(point, factStems) ? `“${point}”` : "End on what it meant, or what you’d do now." },
  ];
}

// A guided telling set against its facts
export interface GuidedComparison {
  // What was added beyond the facts
  added: AddedLine[];
  // How many of the five were added
  addedCount: number;
  // Each fact, kept or not
  facts: FactCheck[];
  // How many facts were kept
  factsHeard: number;
}

// The whole comparison for one telling
export function compareWithFacts(facts: ReadonlyArray<string>, transcript: string): GuidedComparison {
  // What was added
  const added = addedList(transcript, facts);
  // Which facts were kept
  const checks = factChecks(facts, transcript);
  // Both, with their counts
  return { added, addedCount: added.filter((line) => line.added).length, facts: checks, factsHeard: checks.filter((check) => check.heard).length };
}

// The added line each focus works on ("Start in the middle" is checked by the opening instead)
const FOCUS_ADDED: Partial<Record<StoryFocus, AddedLine["id"]>> = { dialogue: "dialogue", detail: "details", point: "point" };

// The change for each thing not added, worded for facts that need bringing to life
const ADD_FIXES: Readonly<Record<AddedLine["id"], { change: string; retryCue: string }>> = {
  // No turn
  turn: { change: "Give the facts a turn. Find the moment it went wrong, or right, and lean on it with a “but”.", retryCue: "Find the “but” and slow down there." },
  // No new details
  details: { change: "Add a detail the facts don’t give: a name, a number, a colour, a sound. That is what makes it yours.", retryCue: "Add one thing they can picture." },
  // No dialogue
  dialogue: { change: STORY_FIXES.dialogue.change, retryCue: STORY_FIXES.dialogue.retryCue },
  // No feeling
  feeling: { change: "Say how it felt. The facts are flat on purpose: one feeling word makes them a story.", retryCue: "Name the feeling at the moment it turned." },
  // No point
  point: { change: "End on a point. Say what it meant, or what you do differently now, then stop.", retryCue: "Finish with “and since then…”." },
};

// One change for a guided telling from the phone's checks (for when the coach is not set up): too little said, then the chosen focus, then a missing fact, then "and then", then the first thing not added
export function guidedChange(transcript: string, facts: ReadonlyArray<string>, durationSec: number, take: { shape?: StoryShape; focus?: StoryFocus | null } = {}): { change: string; retryCue: string } {
  // Hardly anything said
  if (wordsOf(transcript).length < 15) return { change: "Say a little more. Tell every fact, and add one thing of your own between them.", retryCue: "Tell it as if a friend just asked, “What happened?”" };
  // The comparison
  const comparison = compareWithFacts(facts, transcript);
  // Whether an added line was heard
  const added = (id: AddedLine["id"]) => comparison.added.find((line) => line.id === id)?.added ?? false;
  // "Start in the middle" missed: a lead-in came first
  if (take.focus === "middle" && preambleIn(transcript) !== null) return STORY_FIXES.action;
  // The focus's own line, when missed
  const focusLine = take.focus ? FOCUS_ADDED[take.focus] : undefined;
  // That comes first
  if (focusLine && !added(focusLine)) return ADD_FIXES[focusLine];
  // Under a minute was the focus and it ran over
  if (take.focus === "minute" && durationSec > 60) return { change: `Cut to the moment: that ran ${Math.round(durationSec)} seconds. Keep the facts, drop the set-up, and land it in a minute.`, retryCue: "Start at the moment it turned." };
  // The first fact not heard
  const lost = comparison.facts.find((check) => !check.heard);
  // Keep the facts in
  if (lost) return { change: `Keep every fact in. I didn’t hear “${lost.fact}” Bend the facts as you like, but tell them all.`, retryCue: "Run through the facts once before you start." };
  // "And then" in place of a turn
  const andThen = andThenCount(transcript);
  // A string of them, or any in the "but and so" shape
  if (andThen >= 2 || (take.shape === "but-therefore" && andThen >= 1)) return { change: `Swap “and then” for “but” or “so”: it came ${andThen === 1 ? "once" : `${andThen} times`}. The facts are a list; “but” and “so” make them a story.`, retryCue: "Link each fact with “but” or “so”." };
  // The first thing not added, in order of worth
  const missing = (["turn", "details", "dialogue", "feeling", "point"] as const).find((id) => !added(id));
  // One to add
  if (missing) return ADD_FIXES[missing];
  // Everything there
  return { change: "You brought every fact to life. Now slow down at the turn: give the moment itself a few more seconds.", retryCue: "Pause just before the turn." };
}

// What the analysis keeps of a guided telling, so its measures can be worked out again: how many of the five were added, and how many facts were kept of how many
export function guidedRaw(transcript: string, facts: ReadonlyArray<string>): { added: number; factsHeard: number; facts: number } {
  // The comparison
  const comparison = compareWithFacts(facts, transcript);
  // The counts
  return { added: comparison.addedCount, factsHeard: comparison.factsHeard, facts: facts.length };
}

// The change from the phone's checks for any telling: a guided story's, set against its facts, or an open story's (decision 93)
export function tellingChange(promptId: string, transcript: string, durationSec: number, take: { shape?: StoryShape; focus?: StoryFocus | null; length?: "short" | "full" } = {}): { change: string; retryCue: string } {
  // The guided story, if it was one
  const guided = findGuidedStory(promptId);
  // Set against its facts, or the open story's checks
  return guided ? guidedChange(transcript, factsOf(guided), durationSec, take) : storyChange(transcript, durationSec, take);
}
