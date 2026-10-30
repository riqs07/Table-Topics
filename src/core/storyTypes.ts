// The stories you'll need (decision 152): the two or three things the phone checks for each kind, with the words that showed them; one goal at a time, so never a long list

// Load the word helpers shared with the story checks
import { closingWords, feelingIn, openingWords, wordsOf } from "@/core/storyChecks";
// Load the phrase matcher shared with the spoken-reply checks
import { mentions } from "@/core/replyChecks";
// Load the template type
import type { StoryTemplate } from "@/data/records";

// One check on a story of a kind
export interface TypeCheck {
  // Which check
  id: string;
  // What it looks for, as shown
  label: string;
  // Whether the telling did it
  passed: boolean;
  // The words that showed it, or a short note on what was missing
  evidence: string | null;
}

// Openings that start from one moment rather than a list ("When I was twelve…")
const MOMENT_STARTS = ["when i was", "one day", "i remember", "years ago", "back when", "the first time", "growing up", "as a kid", "as a child", "last year", "one morning", "one night", "the day", "it was", "i was"];
// Words that link the moment to now
const NOW_LINKS = ["now", "today", "that's why", "which is why", "ever since", "since then", "these days", "still", "that's what", "and that's", "so now"];
// A reason given ("because", "so I")
const REASONS = ["because", "that's why", "which is why", "so i", "it taught me", "i realised", "i realized", "i learned", "i learnt"];
// Words that show a measurable result
const NUMBER_WORDS = ["two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "twelve", "fifteen", "twenty", "thirty", "forty", "fifty", "hundred", "thousand", "million", "half", "double", "twice", "percent", "per cent", "doubled", "halved", "tripled"];
// Endings that say what you would keep, or learned
const KEEP_WORDS = ["learned", "learnt", "taught me", "now i", "next time", "since then", "i'd do", "i would do", "i always", "i still", "i keep", "lesson", "i realised", "i realized", "from then on"];
// Endings that raise a glass
const RAISES = ["raise", "raise your", "here's to", "heres to", "cheers", "join me", "glasses", "a toast", "toast to"];
// Words that say what someone is like
const QUALITY_WORDS = ["kind", "kindest", "generous", "brave", "funny", "funniest", "patient", "loyal", "always", "never once", "the first to", "the kind of", "the sort of", "that's", "who never", "who always", "thoughtful", "honest", "calm", "warm", "special", "best"];
// Words that show one moment told: a time, a place or someone's words
const MOMENT_MARKS = ["one day", "one time", "the time", "the day", "first day", "last day", "that day", "i remember", "when we", "when i", "that night", "that morning", "once", "said", "says", "told me", "asked me", "goes"];
// Phrases that name a choice made
const CHOICES = ["i decided", "i chose", "i said no", "i said yes", "i said we", "i wouldn't", "i won't", "i told", "i refused", "i turned down", "i picked", "i had to choose", "i went with", "i spoke up", "i owned up", "i admitted", "i stood up", "i walked away", "i kept"];
// Words that say what it cost
const COSTS = ["cost", "lost", "gave up", "give up", "risk", "risked", "hard", "harder", "awkward", "price", "missed", "less money", "unpopular", "paid", "sacrifice", "angry", "upset", "meant"];
// Words that say why it mattered
const MATTERED = ["because", "worth it", "i'd do it again", "i would do it again", "mattered", "matters", "that's why", "trust", "proud", "the right thing", "i realised", "i realized", "i learned"];

// One check: passed when one of the phrases is in the words given, quoting it
function phraseCheck(id: string, label: string, words: ReadonlyArray<string>, phrases: ReadonlyArray<string>, missing: string): TypeCheck {
  // The first phrase found
  const found = mentions(words.join(" "), phrases);
  // Passed with it quoted, or the note on what was missing
  return { id, label, passed: found !== null, evidence: found ? `“${found}”` : missing };
}

// How often "I" and "we" were said, for an interview answer
function iAndWe(transcript: string): { i: number; we: number } {
  // The words
  const words = wordsOf(transcript);
  // The two counts
  return { i: words.filter((word) => word === "i" || word.startsWith("i'")).length, we: words.filter((word) => word === "we" || word.startsWith("we'")).length };
}

// The checks for a story told with one of the four kinds you'll need; none for the everyday templates (their beats and the story checks cover them)
export function typeChecks(template: StoryTemplate | undefined, transcript: string): TypeCheck[] {
  // Nothing said: nothing to check
  if (transcript.trim() === "") return [];
  // The words, the opening and the ending
  const words = wordsOf(transcript);
  // (opening)
  const opening = openingWords(transcript);
  // (ending)
  const ending = closingWords(transcript);
  // By kind
  switch (template) {
    // Who I am: from a moment, linked to now, with a feeling or a reason
    case "who-i-am": {
      // A feeling, if one was heard
      const feeling = feelingIn(transcript);
      // The reason, if one was given
      const reason = mentions(transcript, REASONS);
      // The three
      return [
        phraseCheck("moment", "Starts from a moment, not a list", opening, MOMENT_STARTS, "Try opening on one moment: “When I was…”"),
        phraseCheck("now", "Links it to who you are now", ending, NOW_LINKS, "End on how it led to now"),
        { id: "why", label: "A feeling or a reason", passed: feeling !== null || reason !== null, evidence: feeling ? `“${feeling}”` : reason ? `“${reason}”` : "Say why it stuck with you" },
      ];
    }
    // An interview answer: says "I", a measurable result, ends on what you'd keep
    case "interview": {
      // "I" and "we"
      const counts = iAndWe(transcript);
      // A digit or a number word
      const number = /\d/.test(transcript) ? (/\d[\d,.%]*/.exec(transcript)?.[0] ?? "") : mentions(transcript, NUMBER_WORDS);
      // The three
      return [
        { id: "i", label: "Says what you did", passed: counts.i >= 2 && counts.i >= counts.we, evidence: `“I” ${counts.i} times, “we” ${counts.we}` },
        { id: "number", label: "A result you can measure", passed: number !== null && number !== "", evidence: number ? `“${number}”` : "Give a number: how many, how much, how fast" },
        phraseCheck("keep", "Ends on what you'd keep", wordsOf(transcript).slice(-25), KEEP_WORDS, "Close with what you learned or would do again"),
      ];
    }
    // A toast: one moment with them, what they are like, a raised glass
    case "toast":
      // The three
      return [
        phraseCheck("moment", "One moment with them, told", words, MOMENT_MARKS, "Tell one moment: “The day we…”"),
        phraseCheck("quality", "Says what makes them who they are", words, QUALITY_WORDS, "Name the one thing the story shows about them"),
        phraseCheck("raise", "Ends by raising a glass", wordsOf(transcript).slice(-20), RAISES, "Finish with “please raise your glasses: to…”"),
      ];
    // A choice I made: the choice, its cost, why it mattered
    case "choice":
      // The three
      return [
        phraseCheck("choice", "Names the choice", words, CHOICES, "Say it plainly: “I decided…”"),
        phraseCheck("cost", "Says what it cost", words, COSTS, "Say what it cost you: money, time, an awkward moment"),
        phraseCheck("why", "Says why it mattered", words, MATTERED, "Say why you'd make the same choice"),
      ];
    // The everyday templates
    default:
      // None
      return [];
  }
}
