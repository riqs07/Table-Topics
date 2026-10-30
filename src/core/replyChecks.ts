// What the phone checks in a spoken reply, for Scenes' last turn and Active listening (decisions 149 and 150): each check built on the small-talk checks, with the words that showed it

// Load the small-talk checks
import { butPhrase, deadEndOpening, feelingWords, handBack, questionKind, reaction, sharedWords, shiftPhrase, staysOnStory, theirFeelingWords } from "@/core/smallTalk";
// Load the word tidier shared with the reading checks
import { normalize } from "@/core/readAlong";

// The checks a reply can get
export type ReplyCheckId = "react" | "their-words" | "their-feeling" | "question" | "open-question" | "stays" | "no-advice" | "hand-back" | "no-dead-end" | "own-feeling";

// One check's result
export interface ReplyCheck {
  // Which check
  id: ReplyCheckId;
  // Whether the reply did it
  passed: boolean;
  // What it looks for, as shown
  label: string;
  // The words that showed it, or what got in the way (none when there is nothing to quote)
  evidence: string | null;
}

// Each check's name, as shown
const LABELS: Readonly<Record<ReplyCheckId, string>> = {
  // A reaction near the start
  "react": "A real reaction",
  // Their words, picked up
  "their-words": "Picked up their words",
  // How it felt for them
  "their-feeling": "Named how it felt for them",
  // Any question
  "question": "Asked them something",
  // An open question
  "open-question": "An open question",
  // On their story, not yours
  "stays": "Stayed on them",
  // No advice, no "at least", no but
  "no-advice": "No advice or “at least”",
  // Handed the turn back
  "hand-back": "Handed it back",
  // More than "not much"
  "no-dead-end": "Gave them something to pick up",
  // Your own feeling, when answering
  "own-feeling": "Said how you feel",
};

// Quote a list of words as a phrase
function quote(words: ReadonlyArray<string>): string {
  // The first three, in quotes
  return words.slice(0, 3).map((word) => `“${word}”`).join(", ");
}

// Check one thing in a reply ("said" is what they said that the reply answers)
export function replyCheck(id: ReplyCheckId, transcript: string, said: string): ReplyCheck {
  // Nothing said passes nothing, not even the checks for what a reply leaves out (staying on them, no advice)
  if (transcript.trim() === "") return { id, label: LABELS[id], passed: false, evidence: null };
  // The result, by check
  const result = ((): { passed: boolean; evidence: string | null } => {
    // Each check
    switch (id) {
      // A reaction near the start
      case "react": {
        // The reaction heard
        const heard = reaction(transcript);
        // Passed with it quoted
        return { passed: heard !== null, evidence: heard ? quote([heard]) : null };
      }
      // Their words, picked up
      case "their-words": {
        // The words shared
        const shared = sharedWords(transcript, said);
        // Passed with a few quoted
        return { passed: shared.length > 0, evidence: shared.length > 0 ? quote(shared) : null };
      }
      // How it felt for them
      case "their-feeling": {
        // The feeling words and phrases
        const named = theirFeelingWords(transcript);
        // Passed with them quoted
        return { passed: named.length > 0, evidence: named.length > 0 ? quote(named) : null };
      }
      // Any question
      case "question": {
        // The kind heard
        const kind = questionKind(transcript);
        // Passed when there is one
        return { passed: kind !== null, evidence: null };
      }
      // An open question
      case "open-question": {
        // The kind heard
        const kind = questionKind(transcript);
        // Passed when open, with a note when only yes-or-no
        return { passed: kind === "open", evidence: kind === "closed" ? "A yes-or-no question: try “what” or “how”" : null };
      }
      // On their story, not yours
      case "stays": {
        // The phrase that moved it to you
        const shift = shiftPhrase(transcript);
        // Passed when it stayed, with the shift quoted otherwise
        return { passed: staysOnStory(transcript), evidence: shift ? quote([shift]) : null };
      }
      // No advice, no "at least", no but
      case "no-advice": {
        // The phrase heard
        const but = butPhrase(transcript);
        // Passed when none, with it quoted otherwise
        return { passed: but === null, evidence: but ? quote([but]) : null };
      }
      // Handed the turn back
      case "hand-back": {
        // The phrase heard
        const back = handBack(transcript);
        // Passed with it quoted
        return { passed: back !== null, evidence: back ? quote([back]) : null };
      }
      // More than "not much"
      case "no-dead-end":
        // Passed unless the reply is a dead end, or nothing at all
        return { passed: transcript.trim() !== "" && !deadEndOpening(transcript), evidence: null };
      // Your own feeling, when answering
      case "own-feeling": {
        // The feeling words
        const feelings = feelingWords(transcript);
        // Passed with them quoted
        return { passed: feelings.length > 0, evidence: feelings.length > 0 ? quote(feelings) : null };
      }
    }
  })();
  // With its id and name
  return { id, label: LABELS[id], ...result };
}

// Check a reply for several things in turn
export function replyChecks(ids: ReadonlyArray<ReplyCheckId>, transcript: string, said: string): ReplyCheck[] {
  // Each, in the order given
  return ids.map((id) => replyCheck(id, transcript, said));
}

// Whether most checks passed: at least half, rounded up (an empty reply passes none)
export function mostPassed(checks: ReadonlyArray<ReplyCheck>): boolean {
  // How many passed, against half the checks rounded up
  return checks.length > 0 && checks.filter((check) => check.passed).length >= Math.ceil(checks.length / 2);
}

// The first letters compared for a single word, so "clapped" matches "clap" and "framing" matches "frame"
const STEM = 5;

// The words of a text, tidied
export function tidyWords(text: string): string[] {
  // Split, tidy, and drop empty pieces
  return text.split(/\s+/).map(normalize).filter((word) => word !== "");
}

// Whether a reply contains one of a list of words or phrases: a phrase as whole words in order, a single word by its first letters (a short word or a number must match whole)
export function mentions(transcript: string, terms: ReadonlyArray<string>): string | null {
  // The reply's words
  const said = tidyWords(transcript);
  // The reply as one phrase, for phrases
  const joined = ` ${said.join(" ")} `;
  // The first term found
  return terms.find((term) => {
    // The term's own words
    const parts = tidyWords(term);
    // A phrase: its words in order
    if (parts.length > 1) return joined.includes(` ${parts.join(" ")} `);
    // A single word
    const word = parts[0] ?? "";
    // Nothing to match
    if (word === "") return false;
    // Short words and numbers match whole; longer ones by their first letters
    return word.length < STEM || /\d/.test(word) ? said.includes(word) : said.some((heard) => heard.startsWith(word.slice(0, STEM)) && heard.length >= Math.min(word.length, STEM));
  }) ?? null;
}
