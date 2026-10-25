// What a conversation showed, from its turns alone (decision 83): how much of the talking was yours, how many questions you asked, and how many picked up something the other person said. Speech recognition adds no punctuation, so questions are spotted by how they start; the coach reads the conversation itself for anything finer

// Load the small-talk unit type, for the skill a situation practises
import type { UnitId } from "@/content/smallTalk";
// Load the saved turn type
import type { ConversationTurn } from "@/data/records";
// Load the goal type (decision 127)
import type { ConversationGoal } from "@/content/conversations";

// Above this share of the words, you did most of the talking
const MOST_OF_IT = 0.65;
// Below this share, you held back
const HELD_BACK = 0.3;
// Words a question can start with, once a leading "so", "and" or "oh" is set aside
const QUESTION_STARTS = ["what", "how", "why", "where", "when", "who", "which", "do", "did", "does", "are", "is", "was", "were", "have", "has", "can", "could", "would", "will", "any", "anything", "tell"];
// Small words set aside before looking at how a question starts
const LEAD_INS = new Set(["so", "and", "but", "oh", "wow", "okay", "ok", "well", "wait", "really", "no", "way", "yeah", "hmm"]);
// A question word followed by a helping verb, anywhere in a turn: how a question sounds after a reaction ("wow what was it like")
const MID_QUESTION = /\b(what|how|why|where|when|who|which) (did|do|does|was|were|is|are|has|have|had|will|would|could|can|made|makes)\b/;
// Common words that do not count as picking up a detail
const COMMON = new Set(["that", "this", "with", "have", "what", "your", "about", "just", "been", "really", "they", "them", "there", "were", "from", "when", "would", "could", "like", "know", "then", "than", "into", "it's", "i've", "i'm", "don't", "didn't", "that's", "much", "some", "very", "good", "nice", "yeah", "okay", "well", "time", "think", "feel", "made", "make", "going", "doing", "thing", "things"]);

// What a conversation showed
export interface ConversationMeasures {
  // Your share of the words, from 0 to 1, or null when nothing was said
  share: number | null;
  // Your turns that asked a question
  questions: number;
  // Of those, the ones that picked up a word the other person had just said
  followUps: number;
  // Your turns
  turns: number;
}

// The words of a text, lower case, without punctuation
function words(text: string): string[] {
  // Split on anything that is not a letter or an apostrophe
  return text.toLowerCase().replace(/[’]/g, "'").split(/[^a-z']+/).filter(Boolean);
}

// Whether a turn asks a question: a question mark, or a clause starting with a question word
export function asksQuestion(text: string): boolean {
  // A question mark settles it
  if (text.includes("?")) return true;
  // Each clause, split at punctuation (recognition rarely adds any, so usually the whole turn)
  return text.split(/[.!;]/).some((clause) => {
    // Its words
    const all = words(clause);
    // Hands a question back ("and you", "what about you")
    if (/\b(what|how) about you\b|\band you$/.test(all.join(" "))) return true;
    // A question after a reaction, with no punctuation to split them ("no way congratulations how did you find out")
    if (MID_QUESTION.test(all.join(" "))) return true;
    // Past any lead-in words
    const rest = [...all];
    // Skip the lead-ins
    while (rest.length > 1 && LEAD_INS.has(rest[0]!)) rest.shift();
    // Starts like a question
    return QUESTION_STARTS.includes(rest[0] ?? "");
  });
}

// Whether a question picks up a word the other person had just said (four letters or more, and not a common word)
function picksUp(question: string, theirs: string): boolean {
  // Their words worth picking up
  const said = new Set(words(theirs).filter((word) => word.length >= 4 && !COMMON.has(word)));
  // Any of them in the question
  return words(question).some((word) => said.has(word));
}

// Measure a conversation from its turns
export function measureConversation(turns: ReadonlyArray<ConversationTurn>): ConversationMeasures {
  // Your words and theirs
  const yours = turns.filter((turn) => turn.who === "you").reduce((sum, turn) => sum + words(turn.text).length, 0);
  // Theirs
  const theirs = turns.filter((turn) => turn.who === "them").reduce((sum, turn) => sum + words(turn.text).length, 0);
  // Counts
  let questions = 0;
  // Follow-ups among them
  let followUps = 0;
  // What they said last, before each of your turns
  let lastTheirs = "";
  // Each turn in order
  for (const turn of turns) {
    // Theirs: remember it
    if (turn.who === "them") lastTheirs = `${lastTheirs} ${turn.text}`;
    // Yours: count a question, and whether it picks up their words
    else {
      // A question
      if (asksQuestion(turn.text)) {
        // Counted
        questions += 1;
        // Picking up their words
        if (picksUp(turn.text, lastTheirs)) followUps += 1;
      }
      // Start afresh for the next turn
      lastTheirs = "";
    }
  }
  // The measures
  return { share: yours + theirs > 0 ? Math.round((yours / (yours + theirs)) * 100) / 100 : null, questions, followUps, turns: turns.filter((turn) => turn.who === "you").length };
}

// One change and a cue from the numbers alone, for when the coach is not set up or cannot be reached
export function localConversationNote(name: string, unit: UnitId, measures: ConversationMeasures): { change: string; retryCue: string } {
  // Your share as a percentage
  const percent = measures.share === null ? 0 : Math.round(measures.share * 100);
  // Most of the talking
  if (measures.share !== null && measures.share > MOST_OF_IT) return { change: `You did ${percent}% of the talking. Leave more room for ${name}: ask one question, then listen.`, retryCue: `After you answer, ask ${name} something back.` };
  // No questions where asking is the skill
  if (measures.questions === 0 && unit !== "answering") return { change: `You did not ask ${name} anything. Try one open question: what, how or why.`, retryCue: `Ask ${name} one question that starts with what or how.` };
  // Questions, but none picked up what was said
  if (measures.questions > 0 && measures.followUps === 0 && unit !== "answering") return { change: `Your questions did not pick up anything ${name} said. Use a detail from their last line.`, retryCue: `Listen for one detail, then ask about it.` };
  // Holding back
  if (measures.share !== null && measures.share < HELD_BACK) return { change: `You did ${percent}% of the talking. Give a little more of yourself: one detail ${name} could ask about.`, retryCue: "Add one detail to each answer." };
  // A good balance
  return { change: `A good balance: you did ${percent}% of the talking and asked ${measures.questions} ${measures.questions === 1 ? "question" : "questions"}.`, retryCue: `Try it again with ${name}, and go one step deeper.` };
}

// The results headline: how much of the talking was yours and how many questions you asked, or that nothing was heard
export function conversationHeadline(measures: ConversationMeasures): string {
  // Nothing heard from you
  if (measures.share === null || measures.turns === 0) return "Nothing was heard from you this time.";
  // Questions, in words
  const questions = `${measures.questions} ${measures.questions === 1 ? "question" : "questions"}`;
  // The share and the questions
  return `You did ${Math.round(measures.share * 100)}% of the talking and asked ${questions}.`;
}

// How far a conversation got towards its goal (decision 127)
export function goalProgress(goal: ConversationGoal, measures: ConversationMeasures): { done: number; target: number; met: boolean } {
  // What is counted
  const done = goal.kind === "questions" ? measures.questions : measures.followUps;
  // Against the target
  return { done, target: goal.target, met: done >= goal.target };
}

// The results headline from the goal: how many of the target, in plain words (decision 127)
export function goalHeadline(goal: ConversationGoal, measures: ConversationMeasures): string {
  // Nothing heard from you
  if (measures.share === null || measures.turns === 0) return "Nothing was heard from you this time.";
  // The count
  const { done, target } = goalProgress(goal, measures);
  // What it counts
  const what = goal.kind === "questions" ? "questions back" : target === 1 ? "follow-up question" : "follow-up questions";
  // The line, capped at the target
  return `${Math.min(done, target)} of ${target} ${what}.`;
}
