// What the phone can hear in a told story by itself (decision 92): someone's words reported, specific details, a turn, "and then", a start in the action, a feeling, and an ending on the point. Rough guesses from the words the speech service caught, which usually come without punctuation

// Load the feeling words small talk already listens for
import { feelingWords } from "@/core/smallTalk";
// Load the record types
import type { StoryFocus, StoryRaw, StoryShape } from "@/data/records";

// What the checks found, with the words that showed each
export interface StoryChecks {
  // The words that reported someone's speech, or null
  dialogue: string | null;
  // Up to five specific details (numbers, names, places, times), in order
  details: string[];
  // The word or phrase that turned the story, or null
  turn: string | null;
  // How many times "and then" was said
  andThen: number;
  // Whether the first sentence started in the action (null when nothing was said)
  startsInAction: boolean | null;
  // The lead-in the story opened with, when it did
  preamble: string | null;
  // The first feeling word, or null (a story feeling word wins over a general one)
  feeling: string | null;
  // The words in the last sentence that state a point or a change, or null
  endsOnPoint: string | null;
}

// The most details kept
const MAX_DETAILS = 5;
// Without punctuation, the first this many words stand in for the first sentence
const OPENING_WORDS = 12;
// Without punctuation, the last this many words stand in for the last sentence
const CLOSING_WORDS = 15;

// Lead-ins that come before the story instead of the story itself
const PREAMBLES = ["so basically", "basically", "this one time", "one time", "let me tell you", "i'm going to tell you", "i am going to tell you", "i'm gonna tell you", "i want to tell you", "i'll tell you about", "i will tell you about", "this is a story about", "my story is about", "the story is about", "this story is about", "so this is about", "once upon a time", "where do i start", "where do i begin", "so the story is"];

// Sounds and words that may come before the first real word without counting against the opening
const OPENING_FILLERS = ["um", "uh", "er", "erm", "so", "okay", "ok", "well", "right", "like", "yeah", "alright"];

// Words that report what someone said ("she said", "I asked")
const SPEECH_VERBS = ["said", "says", "asked", "asks", "told", "tells", "yelled", "shouted", "whispered", "replied", "answered", "screamed", "texted", "goes", "went"];

// Words after "goes" or "went" that make it a movement, not speech ("he went home")
const MOVEMENT = ["to", "into", "home", "back", "out", "up", "down", "in", "over", "off", "away", "on", "round", "around", "through", "for", "with", "and", "there", "outside", "inside", "past", "along"];

// Words and phrases that turn a story
const TURNS = ["all of a sudden", "out of nowhere", "turns out", "turned out", "that's when", "that was when", "so then", "suddenly", "until", "except", "instead", "but", "however", "only to"];

// Words and phrases that state a point or a change at the end
const POINTS = ["i learned", "i learnt", "i realised", "i realized", "taught me", "it made me", "made me realise", "made me realize", "since then", "ever since", "from then on", "these days", "now i", "i still", "i'll never", "i will never", "never again", "i always", "the point is", "the lesson", "that's why", "that is why", "and that's how", "that's how", "changed", "i never", "i've never", "now when", "to this day", "which is why", "so now"];

// Endings that trail off rather than land
const TRAILING = ["so yeah", "and yeah", "yeah", "anyway", "that's it", "that's about it", "that's the story", "i guess", "or something", "and stuff", "whatever"];

// Story feeling words beyond small talk's own list
const STORY_FEELINGS = ["scared", "terrified", "embarrassed", "mortified", "relieved", "nervous", "anxious", "furious", "angry", "upset", "sad", "lonely", "shocked", "stunned", "panicked", "panicking", "ashamed", "jealous", "confused", "frustrated", "delighted", "overwhelmed", "heartbroken", "speechless", "giddy", "calm", "worried"];

// Number words that make a detail ("one" is left out: it is mostly "one of", "the one")
const NUMBER_WORDS = ["two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "fifteen", "twenty", "thirty", "forty", "fifty", "hundred", "thousand", "million", "half", "dozen", "first", "second", "third"];

// Time words that make a detail
const TIME_WORDS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "january", "february", "march", "april", "june", "july", "august", "september", "october", "november", "december", "midnight", "noon", "o'clock", "am", "pm"];

// The words of some text, lower case, letters, digits and apostrophes only, curly apostrophes made straight
export function wordsOf(text: string): string[] {
  // Split on spaces, tidy each piece, and drop empty ones
  return text.replace(/[‘’]/g, "'").split(/\s+/).map((word) => word.toLowerCase().replace(/[^a-z0-9':]/g, "").replace(/^'+|'+$/g, "")).filter((word) => word !== "");
}

// The phrase that comes first among some words, as whole words ("but" never matches "butter"); the longer one when two start at the same place
function findPhrase(words: ReadonlyArray<string>, phrases: ReadonlyArray<string>): string | null {
  // The words as one padded line
  const line = ` ${words.join(" ")} `;
  // Each phrase that appears, with where
  const found = phrases.map((phrase) => ({ phrase, at: line.indexOf(` ${phrase} `) })).filter((item) => item.at >= 0);
  // The earliest, then the longest
  found.sort((a, b) => a.at - b.at || b.phrase.length - a.phrase.length);
  // Its words, or none
  return found[0]?.phrase ?? null;
}

// The sentences of a transcript: split on full stops, question and exclamation marks when there are any (empty pieces dropped)
function sentences(transcript: string): string[] {
  // Split after each mark, keep the pieces with words
  return transcript.split(/(?<=[.!?])\s+/).map((piece) => piece.trim()).filter((piece) => wordsOf(piece).length > 0);
}

// Whether the transcript has any sentence marks to go by
function punctuated(transcript: string): boolean {
  // At least one mark followed by more words
  return /[.!?]\s+\S/.test(transcript.trim());
}

// The first sentence's words: the first marked sentence, or the first dozen words
export function openingWords(transcript: string): string[] {
  // By sentence when marked, otherwise by count
  return punctuated(transcript) ? wordsOf(sentences(transcript)[0] ?? "") : wordsOf(transcript).slice(0, OPENING_WORDS);
}

// The last sentence's words: the last marked sentence, or the last fifteen words
export function closingWords(transcript: string): string[] {
  // By sentence when marked, otherwise by count
  return punctuated(transcript) ? wordsOf(sentences(transcript).at(-1) ?? "") : wordsOf(transcript).slice(-CLOSING_WORDS);
}

// The words that reported someone's speech: a quote mark, "was like", or a speaker and a speech word ("she goes", "I said"), or null
export function dialogueIn(transcript: string): string | null {
  // A quoted line in the text itself
  const quoted = /[“"]([^”"]{2,})[”"]/.exec(transcript);
  // Shown as the quote
  if (quoted) return `“${quoted[1]!.trim()}”`;
  // The words
  const words = wordsOf(transcript);
  // Each place in turn
  for (let index = 0; index < words.length; index += 1) {
    // This word, the one before and the one after
    const [before, word, after] = [words[index - 1] ?? "", words[index]!, words[index + 1] ?? ""];
    // "I was like", "she's like", "they were all"
    if ((word === "like" || word === "all") && ["was", "were", "is", "i'm", "she's", "he's", "they're", "we're"].includes(before)) return ["was", "were", "is"].includes(before) && index >= 2 ? `${words[index - 2]} ${before} ${word}` : `${before} ${word}`;
    // Only speech words from here
    if (!SPEECH_VERBS.includes(word)) continue;
    // "goes" and "went" only after a speaker, and not when they lead somewhere ("he went home")
    // ("went camping" and "goes shopping" are going somewhere too: a word ending in "ing" after it is an outing, decision 93)
    if ((word === "goes" || word === "went") && (!["i", "he", "she", "they", "we", "you"].includes(before) || MOVEMENT.includes(after) || after === "" || after.endsWith("ing"))) continue;
    // "told" and "tells" only with someone told ("told me", "told her")
    if ((word === "told" || word === "tells") && !["me", "him", "her", "them", "us", "you", "everyone"].includes(after)) continue;
    // Shown as who was told ("told me"), or the speaker and the word ("she said")
    return word === "told" || word === "tells" ? `${word} ${after}` : before ? `${before} ${word}` : word;
  }
  // None heard
  return null;
}

// The specific details: numbers, time words, and names or places (capitalised mid-sentence words), in order, without repeats, at most five
export function detailsIn(transcript: string): string[] {
  // The raw pieces, so capitals can be seen
  const pieces = transcript.replace(/[‘’]/g, "'").split(/\s+/).filter(Boolean);
  // Found so far
  const found: string[] = [];
  // Each piece
  pieces.forEach((piece, index) => {
    // The bare word, keeping its case
    const bare = piece.replace(/[^A-Za-z0-9':-]/g, "").replace(/^-+|-+$/g, "").replace(/^'+|'+$/g, "").replace(/'s$/, "");
    // Lower case
    const lower = bare.toLowerCase();
    // Nothing left
    if (bare === "") return;
    // Whether the piece before ended a sentence (so a capital there is just the start)
    const sentenceStart = index === 0 || /[.!?]["”]?$/.test(pieces[index - 1]!);
    // A number, a number word, a time word, or a capitalised word that is not the first of a sentence nor "I"
    const detail = /\d/.test(bare) || NUMBER_WORDS.includes(lower) || TIME_WORDS.includes(lower) || (!sentenceStart && /^[A-Z][a-z]/.test(bare) && !["I", "I'm", "I've", "I'd", "I'll", "OK", "Okay"].includes(bare));
    // Kept once
    if (detail && !found.some((item) => item.toLowerCase() === lower)) found.push(bare);
  });
  // The first five
  return found.slice(0, MAX_DETAILS);
}

// The word or phrase that turned the story, or null
export function turnIn(transcript: string): string | null {
  // The first turn found
  return findPhrase(wordsOf(transcript), TURNS);
}

// How many times "and then" was said
export function andThenCount(transcript: string): number {
  // Every "and then", as whole words
  return (` ${wordsOf(transcript).join(" ")} `.match(/ and then /g) ?? []).length;
}

// The lead-in the story opened with, or null when it started in the action (or nothing was said)
export function preambleIn(transcript: string): string | null {
  // The opening words with the fillers in front taken off
  const opening = [...openingWords(transcript)];
  // Drop leading fillers ("um so", "okay well"), but never all of a lead-in phrase such as "so basically"
  while (opening.length > 1 && OPENING_FILLERS.includes(opening[0]!) && !PREAMBLES.some((phrase) => ` ${opening.join(" ")} `.startsWith(` ${phrase} `))) opening.shift();
  // The opening as one padded line
  const line = ` ${opening.join(" ")} `;
  // A lead-in right at the start
  return PREAMBLES.filter((phrase) => line.startsWith(` ${phrase} `)).sort((a, b) => b.length - a.length)[0] ?? null;
}

// The words in the last sentence that state a point or a change, or null (a story that trails off with "so yeah" has none)
export function pointIn(transcript: string): string | null {
  // The last sentence's words
  const closing = closingWords(transcript);
  // A point or change there
  return findPhrase(closing, POINTS);
}

// Whether the very end trails off ("so yeah", "anyway")
export function trailsOff(transcript: string): boolean {
  // The last three words
  const end = ` ${wordsOf(transcript).slice(-3).join(" ")} `;
  // One of the trailing endings, at the very end
  return TRAILING.some((phrase) => end.endsWith(` ${phrase} `));
}

// Every feeling word heard, story feeling words first, then small talk's, each once (decision 93 uses all of them to leave out any a guided story's facts already said)
export function feelingsIn(transcript: string): string[] {
  // The story's own feeling words, in order, then small talk's, leaving out "love", which in a story is as often a name for someone ("don't worry, love")
  const found = [...wordsOf(transcript).filter((word) => STORY_FEELINGS.includes(word)), ...feelingWords(transcript).filter((word) => word !== "love")];
  // Each once
  return [...new Set(found)];
}

// The first feeling word, or null (a story feeling word wins over a general one)
export function feelingIn(transcript: string): string | null {
  // The first of them
  return feelingsIn(transcript)[0] ?? null;
}

// Every check on a story
export function storyChecks(transcript: string): StoryChecks {
  // Whether anything was said
  const said = wordsOf(transcript).length > 0;
  // The lead-in, if any
  const preamble = said ? preambleIn(transcript) : null;
  // All of them
  return { dialogue: dialogueIn(transcript), details: detailsIn(transcript), turn: turnIn(transcript), andThen: andThenCount(transcript), startsInAction: said ? preamble === null : null, preamble, feeling: feelingIn(transcript), endsOnPoint: pointIn(transcript) };
}

// The checks as the analysis keeps them, so the story measures can be worked out again without the transcript
export function storyRaw(transcript: string): StoryRaw {
  // The checks
  const checks = storyChecks(transcript);
  // As yes-or-no and counts
  return { dialogue: checks.dialogue !== null, details: checks.details.length, turn: checks.turn !== null, andThen: checks.andThen, startsInAction: checks.startsInAction, feeling: checks.feeling !== null, endsOnPoint: checks.endsOnPoint !== null };
}

// One line of "What I heard"
export interface HeardLine {
  // Which check
  id: "action" | "dialogue" | "details" | "turn" | "feeling" | "point";
  // Its name
  name: string;
  // Whether it was heard
  heard: boolean;
  // What showed it, or what to try when it was not heard
  note: string;
}

// "What I heard": the checks as a short checklist, in story order
export function heardList(checks: StoryChecks): HeardLine[] {
  // One line each
  return [
    // The opening
    { id: "action", name: "Started in the action", heard: checks.startsInAction === true, note: checks.preamble ? `Opened with “${checks.preamble}”.` : checks.startsInAction ? "No lead-in." : "Open on the moment things start." },
    // Dialogue
    { id: "dialogue", name: "Someone’s words", heard: checks.dialogue !== null, note: checks.dialogue ? (checks.dialogue.startsWith("“") ? checks.dialogue : `“${checks.dialogue}”`) : "Say one line the way they said it." },
    // Details
    { id: "details", name: "Specific details", heard: checks.details.length > 0, note: checks.details.length > 0 ? checks.details.map((detail) => `“${detail}”`).join(", ") : "A name, a number or a place." },
    // The turn
    { id: "turn", name: "A turn", heard: checks.turn !== null, note: checks.turn ? `“${checks.turn}”` : "A “but” or a moment things changed." },
    // A feeling
    { id: "feeling", name: "A feeling", heard: checks.feeling !== null, note: checks.feeling ? `“${checks.feeling}”` : "How it felt, in a word." },
    // The ending
    { id: "point", name: "Ended on the point", heard: checks.endsOnPoint !== null, note: checks.endsOnPoint ? `“${checks.endsOnPoint}”` : "Finish on what changed or what it meant." },
  ];
}

// The change and cue for each missing check, in the order they are worth fixing (shared with guided stories, decision 93)
export const STORY_FIXES: Readonly<Record<HeardLine["id"], { change: string; retryCue: string }>> = {
  // A lead-in
  action: { change: "Start in the middle. The lead-in spends your first seconds before anything happens.", retryCue: "Open with the moment things start moving." },
  // No turn
  turn: { change: "Give it a turn. Without a “but”, a story is a list of things that happened.", retryCue: "Find the “but” in the middle, and lean on it." },
  // No details
  details: { change: "Add one specific detail: a name, a number, a place. Specific is what a listener can picture.", retryCue: "Name one thing exactly." },
  // No dialogue
  dialogue: { change: "Add one line of what someone said, in their words. Dialogue puts the listener in the room.", retryCue: "Say one line the way they said it." },
  // No point
  point: { change: "End on the point. Say what changed or what it meant, then stop.", retryCue: "Finish with “and since then…” or “that’s when I realised…”." },
  // No feeling
  feeling: { change: "Say how it felt. One feeling word turns events into your story.", retryCue: "Name the feeling at the moment it turned." },
};

// Which check each focus works on
export const FOCUS_CHECK: Partial<Record<StoryFocus, HeardLine["id"]>> = { middle: "action", dialogue: "dialogue", detail: "details", point: "point" };

// One change for a story from the phone's checks (for when the coach is not set up): the chosen focus first when it was missed, then "and then" in place of a turn, then the first missing check in order
export function storyChange(transcript: string, durationSec: number, take: { shape?: StoryShape; focus?: StoryFocus | null; length?: "short" | "full" } = {}): { change: string; retryCue: string } {
  // The checks
  const checks = storyChecks(transcript);
  // The checklist
  const lines = heardList(checks);
  // Whether a check was heard
  const heard = (id: HeardLine["id"]) => lines.find((line) => line.id === id)?.heard ?? false;
  // Hardly anything said
  if (wordsOf(transcript).length < 15) return { change: "Say a little more. Even a small story needs a moment, a turn and an ending.", retryCue: "Tell it as if a friend just asked, “What happened?”" };
  // The focus chosen for this telling
  const focusCheck = take.focus ? FOCUS_CHECK[take.focus] : undefined;
  // Missed: that comes first
  if (focusCheck && !heard(focusCheck)) return STORY_FIXES[focusCheck];
  // Under a minute was the focus and it ran over
  if (take.focus === "minute" && durationSec > 60) return { change: `Cut to the moment: that ran ${Math.round(durationSec)} seconds. Drop the set-up and land it in a minute.`, retryCue: "Start at the moment it turned." };
  // A string of "and then" with no turn, or the "but and so" shape with any "and then"
  if (checks.andThen >= 2 || (take.shape === "but-therefore" && checks.andThen >= 1)) return { change: `Swap “and then” for “but” or “so”: it came ${checks.andThen === 1 ? "once" : `${checks.andThen} times`}. Cause and effect pulls a listener along; a list does not.`, retryCue: "Link each beat with “but” or “so”." };
  // The first missing check, in order of worth
  const missing = (["action", "turn", "details", "dialogue", "point", "feeling"] as const).find((id) => !heard(id));
  // One to fix
  if (missing) return STORY_FIXES[missing];
  // Everything heard
  return { change: "Every beat was there. Now slow down at the turn: give the moment itself a few more seconds.", retryCue: "Pause just before the turn." };
}
