// Small talk: what the phone can check in an answer, a follow-up question or a reply to a story by itself, how much of the recipe strip to show, and one change without the coach

// Load the units, their beats and the prompt lookup
import { beatsFor, findSmallTalk, unitOf, type BeatId, type UnitId } from "@/content/smallTalk";
// Load the word tidier shared with the reading checks
import { normalize } from "@/core/readAlong";
// Load the clock and the small-talk windows
import { formatClock, smallTalkWindow } from "@/core/recordingRules";
// Load the change type shared with the other modes
import type { LocalChange } from "@/core/localChange";
// Load the record type
import type { SessionRecord } from "@/data/records";

// Openings that close the topic when nothing follows them
const DEAD_ENDS = ["not much", "nothing much", "nothing really", "not a lot", "good", "fine", "okay", "ok", "pretty good", "pretty chill", "same old", "the usual", "it was good", "it was fine", "it was okay", "busy"];

// An answer this short after a dead-end opening has nothing else in it
const DEAD_END_WORDS = 15;

// Words that say how something felt
const FEELING_WORDS = ["fun", "loved", "love", "enjoyed", "proud", "relaxing", "relaxed", "excited", "exciting", "surprised", "surprising", "obsessed", "glad", "happy", "amazing", "great", "nice", "lovely", "fantastic", "awesome", "beautiful", "peaceful", "hilarious", "funny", "scary", "nervous", "stressful", "exhausting", "tired", "grateful", "thrilled", "satisfying", "refreshing", "cool", "wonderful", "felt", "feel"];

// Phrases that hand the conversation back, looked for near the end
const HAND_BACKS = ["what about you", "how about you", "and you", "how was yours", "how was your", "what did you", "did you", "have you", "are you", "do you", "what are you", "how are you", "you up to", "your weekend", "you been"];

// The hand-back must come in this many final words
const HAND_BACK_WORDS = 12;

// The words of a transcript, tidied
function words(transcript: string): string[] {
  // Split, tidy, and drop empty pieces
  return transcript.split(/\s+/).map(normalize).filter((word) => word !== "");
}

// Whether the answer opens with a dead end and says little else ("Good, not much.")
export function deadEndOpening(transcript: string): boolean {
  // The tidied words
  const said = words(transcript);
  // The opening, as one phrase
  const opening = said.join(" ");
  // A dead-end opening, and not much after it
  return said.length < DEAD_END_WORDS && DEAD_ENDS.some((phrase) => opening === phrase || opening.startsWith(`${phrase} `));
}

// The feeling words in the answer, in order, without repeats
export function feelingWords(transcript: string): string[] {
  // Each distinct feeling word
  return [...new Set(words(transcript).filter((word) => FEELING_WORDS.includes(word)))];
}

// The hand-back phrase near the end of the answer, if any
export function handBack(transcript: string): string | null {
  // The last few words, as one phrase
  const ending = ` ${words(transcript).slice(-HAND_BACK_WORDS).join(" ")} `;
  // The first phrase found there
  return HAND_BACKS.find((phrase) => ending.includes(` ${phrase} `)) ?? null;
}

// Whether the answer was too short, inside the window, or too long (the window depends on the prompt's unit)
export function answerLength(durationSec: number, promptId = ""): "short" | "ok" | "long" {
  // The window
  const window = smallTalkWindow(promptId);
  // Under the window, over it, or inside
  return durationSec < window.start ? "short" : durationSec > window.end ? "long" : "ok";
}

// Words that start an open question
const OPEN_STARTERS = ["what", "what's", "whats", "how", "how's", "hows", "why", "where", "when", "which", "who", "tell"];
// Words that start a yes-or-no question
const CLOSED_STARTERS = ["did", "do", "does", "is", "are", "was", "were", "have", "has", "can", "could", "will", "would", "isn't", "didn't", "don't"];

// Words that follow a yes-or-no starter when it really starts a question ("did you", "is it"), so "that is great" is not taken for one
const QUESTION_SUBJECTS = ["you", "it", "they", "he", "she", "we", "there", "that", "this", "your", "the", "anyone", "everyone"];

// Where the first question starts in a list of words: an open question word, or a yes-or-no word followed by its subject (-1 if none)
function questionStart(said: ReadonlyArray<string>): number {
  // The first place that starts a question
  return said.findIndex((word, index) => OPEN_STARTERS.includes(word) || (CLOSED_STARTERS.includes(word) && QUESTION_SUBJECTS.includes(said[index + 1] ?? "")));
}

// Whether the question asked is open or yes-or-no, from the first question heard (none if there is no question)
export function questionKind(transcript: string): "open" | "closed" | null {
  // The words
  const said = words(transcript);
  // Where the first question starts
  const start = questionStart(said);
  // Its kind
  return start === -1 ? null : OPEN_STARTERS.includes(said[start]!) ? "open" : "closed";
}

// Short and common words, never counted as picking up what someone said
const COMMON = ["that", "this", "with", "what", "what's", "have", "been", "just", "from", "they", "them", "there", "their", "were", "when", "where", "which", "would", "could", "should", "about", "really", "like", "went", "into", "some", "then", "than", "your", "because", "after", "before", "even", "only", "over", "also", "very", "much", "last", "next", "good", "nice", "cool", "make", "made", "doing", "does", "know", "think", "sounds", "must", "feel", "felt", "going", "finally", "myself", "didn't", "wasn't", "it's", "that's", "i've", "i'd", "we're", "you're", "week", "time", "thing", "things", "said", "tell", "told", "here"];

// The first letters compared, so "painting" matches "paint" and "breads" matches "bread"
const STEM = 5;

// The words of something said that are worth picking up (four letters or more, not common)
function contentWords(text: string): string[] {
  // Tidied, long enough, not common
  return words(text).filter((word) => word.length >= 4 && !COMMON.includes(word));
}

// The words of what they said that come back in the reply (without repeats), so the reply picked up their detail
export function sharedWords(transcript: string, said: string): string[] {
  // Their words, by their first letters
  const theirs = contentWords(said).map((word) => word.slice(0, STEM));
  // The reply's words that match one of theirs
  return [...new Set(contentWords(transcript).filter((word) => theirs.includes(word.slice(0, STEM))))];
}

// Words about yourself
const FIRST_PERSON = ["i", "i'm", "im", "i've", "ive", "i'd", "id", "i'll", "me", "my", "mine", "myself"];

// Whether a follow-up stayed about them: nothing about yourself after the question starts (“Oh, I love that, what kind?” is fine; “How far do you go? I do ten k” is not)
export function staysOnThem(transcript: string): boolean {
  // The words
  const said = words(transcript);
  // Where the question starts (the whole reply if no question is heard)
  const start = Math.max(0, questionStart(said));
  // Nothing about yourself from there on
  return !said.slice(start).some((word) => FIRST_PERSON.includes(word));
}

// A follow-up longer than this is more than one short question
const ONE_QUESTION_WORDS = 25;

// Whether a follow-up is one short question
export function isOneQuestion(transcript: string): boolean {
  // Short enough
  return words(transcript).length <= ONE_QUESTION_WORDS;
}

// Reactions that show a story landed, looked for near the start of a reply
const REACTIONS = ["no way", "oh no", "oh my", "wow", "whoa", "seriously", "really", "amazing", "incredible", "unbelievable", "oh", "aw", "aww", "ah", "yikes", "ouch", "wait", "what", "crazy", "wild", "brilliant", "ha", "haha", "classic", "stop", "oof"];

// A reaction must come in this many first words
const REACTION_WORDS = 6;

// The reaction near the start of a reply, if any
export function reaction(transcript: string): string | null {
  // The first few words, as one phrase
  const opening = ` ${words(transcript).slice(0, REACTION_WORDS).join(" ")} `;
  // The first reaction found there
  return REACTIONS.find((phrase) => opening.includes(` ${phrase} `)) ?? null;
}

// Words that name how something felt for them, as well as the general feeling words
const THEIR_FEELINGS = ["frustrating", "frustrated", "hard", "awful", "sad", "lonely", "relief", "relieved", "embarrassing", "embarrassed", "annoying", "annoyed", "sweet", "kind", "lucky", "terrible", "horrible", "miss", "scared", "stressed", "weird", "strange", "special", "touching", "upset", "worried", "brutal", "heartbreaking"];

// Phrases that say how it must have felt
const FEELING_PHRASES = ["must have been", "must be", "must've been", "you must", "sounds like", "that sounds", "i bet", "how did you feel", "how did that feel", "you felt"];

// The words in a reply that name how it felt for them: "must have been" phrases first, then feeling words, without repeats
export function theirFeelingWords(transcript: string): string[] {
  // The reply as one phrase
  const said = ` ${words(transcript).join(" ")} `;
  // The phrases found
  const phrases = FEELING_PHRASES.filter((phrase) => said.includes(` ${phrase} `));
  // And the feeling words
  return [...new Set([...phrases, ...words(transcript).filter((word) => FEELING_WORDS.includes(word) || THEIR_FEELINGS.includes(word))])];
}

// Whether a reply names how it felt for them
export function namesTheirFeeling(transcript: string): boolean {
  // Any feeling phrase or word
  return theirFeelingWords(transcript).length > 0;
}

// Phrases that move the talk to your own story
const SHIFTS = ["me too", "same here", "that happened to me", "happened to me", "reminds me", "i once", "one time i", "when i was", "i remember", "i had a", "i had the", "my own", "the same thing"];

// The phrase that moved the talk to you, if any
export function shiftPhrase(transcript: string): string | null {
  // The reply as one phrase
  const said = ` ${words(transcript).join(" ")} `;
  // The first shift found
  return SHIFTS.find((phrase) => said.includes(` ${phrase} `)) ?? null;
}

// A reply with more words about yourself than this has moved to you
const FIRST_PERSON_LIMIT = 2;

// Whether a reply stayed on their story
export function staysOnStory(transcript: string): boolean {
  // No shift phrase, and few words about yourself
  return shiftPhrase(transcript) === null && words(transcript).filter((word) => FIRST_PERSON.includes(word)).length <= FIRST_PERSON_LIMIT;
}

// Phrases that bring in a downside, cheer them up too quickly, or give advice before it is asked for
const BUTS = ["you should", "you could", "have you thought", "have you tried", "why don't you", "why dont you", "maybe you should", "at least", "look on the bright side", "it could be worse", "don't worry", "dont worry", "everything happens", "the downside", "be careful", "make sure you"];

// The "but" phrase in a reply to news, if any
export function butPhrase(transcript: string): string | null {
  // The reply as one phrase
  const said = ` ${words(transcript).join(" ")} `;
  // The first one found
  return BUTS.find((phrase) => said.includes(` ${phrase} `)) ?? null;
}

// A reply to a story should pick up at least this many of its words
const STORY_WORDS = 2;

// What the phone hears for each beat, by itself (the moment and hook of an answer are for the user or the coach to judge)
function phoneFinds(session: SessionRecord, beat: BeatId): boolean {
  // What was said to them
  const said = findSmallTalk(session.promptId)?.question ?? "";
  // Each beat's check
  switch (beat) {
    // Answering
    case "feeling":
      return feelingWords(session.transcript).length > 0;
    case "hand-back":
      return handBack(session.transcript) !== null;
    case "moment":
    case "hook":
      return false;
    // Asking
    case "open":
      return questionKind(session.transcript) === "open";
    case "their-detail":
      return sharedWords(session.transcript, said).length > 0;
    case "about-them":
      return staysOnThem(session.transcript);
    case "one-question":
      return isOneQuestion(session.transcript) && questionKind(session.transcript) !== null;
    // Listening
    case "react":
      return reaction(session.transcript) !== null;
    case "their-words":
      return sharedWords(session.transcript, said).length >= STORY_WORDS;
    case "their-feeling":
      return namesTheirFeeling(session.transcript);
    case "stay":
      return staysOnStory(session.transcript);
    // News (React and Stay are checked as for listening)
    case "ask-moment":
      return questionKind(session.transcript) !== null;
    case "no-buts":
      return butPhrase(session.transcript) === null;
  }
}

// Whether an answer showed a beat: the coach's reading when there is one; otherwise the user's own tick when they listened back, or the phone's check
export function beatFound(session: SessionRecord, beat: BeatId): boolean {
  // The coach's notes on an answer, if they have arrived
  const coach = session.feedback?.smallTalk;
  // The coach decides when it has answered
  if (coach) return beat === "moment" ? coach.moment !== "" : beat === "hook" ? coach.hooks.length > 0 : beat === "feeling" ? coach.feeling !== "" : coach.handBack !== "";
  // The coach's notes on a follow-up or a reply
  const connection = session.feedback?.connection;
  // The coach decides there too
  if (connection) return connection.found.some((item) => item.beat === beat);
  // Ticked by the user
  const ticked = !!session.selfReview && !session.selfReview.skipped && session.selfReview.tags.includes(beat);
  // Either
  return ticked || phoneFinds(session, beat);
}

// How much help the strip gives for each beat
export interface StripLevel {
  // The unit whose beats it shows
  unit: UnitId;
  // Per beat: the reminder in full, or just the word once it is a habit
  beats: Partial<Record<BeatId, "full" | "word">>;
  // Whether the strip is hidden altogether (every beat a habit)
  hidden: boolean;
}

// The recent answers looked at
const RECENT = 5;
// A beat found in this many of them is a habit
const HABIT = 3;

// The strip's level for a unit from the user's small-talk answers (newest first): fading as each beat becomes a habit
export function stripLevel(answers: ReadonlyArray<SessionRecord>, unit: UnitId = "answering"): StripLevel {
  // The most recent answers in this unit
  const recent = answers.filter((answer) => unitOf(answer.promptId) === unit).slice(0, RECENT);
  // The unit's beats
  const beats = beatsFor(unit);
  // Each beat's level
  const levels = Object.fromEntries(beats.map((beat) => [beat.id, recent.filter((answer) => beatFound(answer, beat.id)).length >= HABIT ? "word" : "full"])) as Partial<Record<BeatId, "full" | "word">>;
  // Hidden once every beat is a habit
  return { unit, beats: levels, hidden: beats.every((beat) => levels[beat.id] === "word") };
}

// One change for a follow-up question, from the phone's checks, in order: no question, more than one, yes-or-no, not about their detail, turned to you
function askingChange(session: SessionRecord): LocalChange {
  // What they said
  const said = findSmallTalk(session.promptId)?.question ?? "";
  // No question heard
  if (questionKind(session.transcript) === null) return { change: "Ask a question. A comment is friendly, but a question is what keeps them talking.", retryCue: "Start with “What” or “How” and ask about what they said." };
  // Too long
  if (!isOneQuestion(session.transcript)) return { change: "Just one short question. A long one, or several, is hard to answer.", retryCue: "Ask one question in a single breath, then stop." };
  // Yes-or-no
  if (questionKind(session.transcript) === "closed") return { change: "Make it open. A question that starts with did, is or do gets a yes; what, how or why gets a story.", retryCue: "Start with “What” or “How”." };
  // Not about their words
  if (sharedWords(session.transcript, said).length === 0) return { change: `Pick up their detail. They said “${said}”: ask about something in it.`, retryCue: "Use one of their words in your question." };
  // About you
  if (!staysOnThem(session.transcript)) return { change: "Keep it on them. Once you have asked, let them answer before you share your own.", retryCue: "Ask, then stop and listen." };
  // All there
  return { change: "Open, about their detail, and about them: that is a good follow-up. In a real conversation, listen to their answer and ask one more.", retryCue: "Ask about the most interesting word they used." };
}

// One change for a reply to a story, in order: turned to you, no reaction, none of their words, no feeling
function listeningChange(session: SessionRecord): LocalChange {
  // What they said
  const story = findSmallTalk(session.promptId)?.question ?? "";
  // Moved to you
  if (!staysOnStory(session.transcript)) return { change: `Stay with their story. ${shiftPhrase(session.transcript) ? `“${shiftPhrase(session.transcript)}”` : "Talking about yourself"} moves the talk to you before they have finished.`, retryCue: "Ask what happened next instead of telling your own." };
  // No reaction
  if (reaction(session.transcript) === null) return { change: "React first. A quick “No way!” or “Oh no” shows it landed before you say anything else.", retryCue: "Open with a real reaction to the moment." };
  // None of their words
  if (sharedWords(session.transcript, story).length < STORY_WORDS) return { change: "Mention something from their story, so they know you heard it.", retryCue: "Repeat the most surprising detail back, as a question." };
  // No feeling
  if (!namesTheirFeeling(session.transcript)) return { change: "Say how it must have felt for them. The facts are theirs; naming the feeling shows you understood.", retryCue: "Add “That must have been…” and name the feeling." };
  // All there
  return { change: "A reaction, their details, the feeling, and it stayed on them: that is how a good listener sounds. Next, ask what happened after.", retryCue: "End with “And then what?”" };
}

// One change for a response to news, in order: turned to you, no reaction, a downside or advice, no question
function newsChange(session: SessionRecord): LocalChange {
  // Moved to you
  if (!staysOnStory(session.transcript)) return { change: `Stay with their news. ${shiftPhrase(session.transcript) ? `“${shiftPhrase(session.transcript)}”` : "Talking about yourself"} takes the spotlight just as they step into it.`, retryCue: "Ask about their news before saying anything about yours." };
  // No reaction
  if (reaction(session.transcript) === null) return { change: "React first. A real “No way!” or “Oh no” shows it landed before anything else.", retryCue: "Open with a real reaction to their news." };
  // A downside or advice
  if (butPhrase(session.transcript)) return { change: `Hold the “${butPhrase(session.transcript)}” for now. A downside reads as doubt, and advice before understanding makes people feel less heard.`, retryCue: "React and ask; save any advice until they ask for it." };
  // No question
  if (questionKind(session.transcript) === null) return { change: "Ask about it. A question about the moment, or how they are, shows you want to hear more.", retryCue: "End with “How did it feel?” or “How are you doing with it?”" };
  // All there
  return { change: "A real reaction, a question, and it stayed on them: that is how good news gets shared and bad news gets heard. Next, ask one more question about it.", retryCue: "Ask one more thing about the moment." };
}

// One change for a small-talk response: for an answer, from the phone's checks, in order: a dead end, too short, no feeling, no hand-back, too long; otherwise a look at the moment and hook, which only the user or the coach can judge
export function smallTalkChange(session: SessionRecord): LocalChange {
  // The prompt's unit
  const unit = unitOf(session.promptId);
  // A follow-up question
  if (unit === "asking") return askingChange(session);
  // A reply to a story
  if (unit === "listening") return listeningChange(session);
  // A response to news
  if (unit === "news") return newsChange(session);
  // A dead end
  if (deadEndOpening(session.transcript)) return { change: "Do not stop at “good”: that leaves them nothing to ask about. Even a quiet day has one thing worth telling.", retryCue: "Pick one thing that happened, however small, and say it first." };
  // The length
  const length = answerLength(session.durationSec, session.promptId);
  // Too short
  if (length === "short") return { change: `A little more: you spoke for ${formatClock(session.durationSec)}. Give them a detail they could ask about.`, retryCue: "Add one specific detail: a name, a place, or a number." };
  // No feeling
  if (feelingWords(session.transcript).length === 0) return { change: "Say how it felt. The facts were there; one line on why it mattered makes it sound like you.", retryCue: "After the moment, add how it felt: fun, relaxing, a bit of a surprise." };
  // No hand-back
  if (handBack(session.transcript) === null) return { change: "Hand it back. End with a question so it becomes a conversation, not a report.", retryCue: "Finish with a real question, like “Did you get up to anything good?”" };
  // Too long
  if (length === "long") return { change: `Shorter is friendlier: you spoke for ${formatClock(session.durationSec)}. Small talk is a quick back-and-forth.`, retryCue: "Tell one moment, then hand it back within about thirty seconds." };
  // Feeling and hand-back were heard; the moment and the hook are for the user (or the coach) to judge
  return { change: "There was a feeling and a question back. Now check the start: was there one thing that happened, with a detail they could ask about, like a name, a place or a number?", retryCue: "Open with one specific thing that happened." };
}

// How many of its unit's four beats an answer showed
export function beatCount(session: SessionRecord): number {
  // Count the beats found
  return beatsFor(unitOf(session.promptId)).filter((beat) => beatFound(session, beat.id)).length;
}
