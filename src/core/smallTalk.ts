// Small talk: what the phone can check by itself in an answer, a follow-up question, a reply to a story or to news, a moment read in the room, an opener and goodbye, or an upgraded question; how much of the recipe strip to show; and one change without the coach

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

// The first of a list of phrases found in a stretch of words, if any (each phrase matched as whole words)
function firstPhrase(said: ReadonlyArray<string>, phrases: ReadonlyArray<string>): string | null {
  // The words as one phrase, padded so a match is whole words
  const text = ` ${said.join(" ")} `;
  // The first phrase found
  return phrases.find((phrase) => text.includes(` ${phrase} `)) ?? null;
}

// Phrases that say what you noticed in them (reading the room, decision 95)
const NOTICED = ["i noticed", "i notice", "i can tell", "i can see", "you seem", "seems like", "you look", "looks like", "sounds like", "you lit up", "you light up", "lit up", "light up", "you've gone", "youve gone", "you went quiet", "you're quiet", "youre quiet", "gone quiet", "a bit quiet", "your face", "you brightened", "you perked up", "perked up", "i get the feeling", "i get the sense", "i sense", "you mentioned", "when you mentioned", "when you talk about", "you've been", "you keep"];

// The phrase that names what was noticed, if any
export function noticedPhrase(transcript: string): string | null {
  // The first one found
  return firstPhrase(words(transcript), NOTICED);
}

// Phrases that make leaving easy (reading the room and its missions, decision 95)
const OUTS = ["no worries", "no pressure", "if you need to go", "if you need to", "if you have to go", "if you've got to go", "i'll let you", "ill let you", "let you go", "let you get", "another time", "some other time", "catch you later", "don't let me keep you", "dont let me keep you", "i won't keep you", "i wont keep you", "talk later", "pick this up", "not a good time", "bad time", "go ahead", "i don't mind", "i dont mind", "head off"];

// Phrases that invite more of what lit them up, or give them room to think
const MORE = ["tell me more", "more about", "what else", "go on", "keep going", "say more", "i'd love to hear", "id love to hear", "i want to hear", "go back", "take your time", "no rush"];

// The phrase that follows their lead (an easy out, or more of their topic), if any
export function leadPhrase(transcript: string): string | null {
  // The words
  const said = words(transcript);
  // An out first, then an invitation to say more
  return firstPhrase(said, OUTS) ?? firstPhrase(said, MORE);
}

// Phrases that ask for reassurance or put the change on them
const GUILT = ["am i boring", "boring you", "are you even", "you're not listening", "youre not listening", "you aren't listening", "you arent listening", "you don't seem interested", "you dont seem interested", "did i say something", "is it me", "what's wrong with you", "whats wrong with you", "why are you being", "you seem bored", "that's rude", "thats rude", "sorry i'm boring", "sorry im boring"];

// The guilt or reassurance phrase in a reply, if any
export function guiltPhrase(transcript: string): string | null {
  // The first one found
  return firstPhrase(words(transcript), GUILT);
}

// The goodbye is taken to start at the first goodbye phrase from this word on (so "Great to meet you" at the very start stays part of the opener)
const GOODBYE_FROM = 3;

// Whether a phrase starts at a place in a list of words
function phraseAt(said: ReadonlyArray<string>, index: number, phrase: string): boolean {
  // The phrase's own words
  const parts = phrase.split(" ");
  // Every word in place
  return parts.every((part, offset) => said[index + offset] === part);
}

// An opener-and-goodbye split in two: the goodbye starts at the first goodbye phrase (what you enjoyed, a reason or a wish) from the fourth word on; with none, it is all opener
function splitEnds(said: ReadonlyArray<string>): { opening: string[]; closing: string[] } {
  // Every goodbye phrase
  const markers = [...APPRECIATION, ...REASONS, ...WISHES];
  // The first place one starts
  const start = said.findIndex((_, index) => index >= GOODBYE_FROM && markers.some((phrase) => phraseAt(said, index, phrase)));
  // The two parts (all opener when no goodbye is heard)
  return start === -1 ? { opening: [...said], closing: [] } : { opening: said.slice(0, start), closing: said.slice(start) };
}

// The opening part of an opener-and-goodbye
function openingPart(said: ReadonlyArray<string>): string[] {
  // Before the goodbye
  return splitEnds(said).opening;
}

// The closing part: from the goodbye on
function closingPart(said: ReadonlyArray<string>): string[] {
  // The goodbye
  return splitEnds(said).closing;
}

// Phrases that point at the shared moment, as well as the situation's own words
const AROUND = ["this place", "in here", "around here", "out here", "this weather", "today", "this morning", "tonight", "this queue", "this line", "the queue", "the line", "the food", "the music", "the coffee", "this is my first", "first time here", "been here before", "one of these"];

// The words of an opener that point at something around them: words from the situation, or a phrase about the shared moment
export function aroundWords(transcript: string, situation: string): string[] {
  // The opening part
  const opening = openingPart(words(transcript));
  // The situation's words picked up there
  const shared = sharedWords(opening.join(" "), situation);
  // A shared-moment phrase, when no words from the situation were used
  const phrase = shared.length > 0 ? null : firstPhrase(opening, AROUND);
  // Either
  return phrase ? [phrase] : shared;
}

// Whether the opening part asks a question
export function openerAsks(transcript: string): boolean {
  // A question starts in the opening part
  return questionStart(openingPart(words(transcript))) !== -1;
}

// Phrases that say what you enjoyed, looked for in the goodbye
const APPRECIATION = ["great talking", "nice talking", "lovely talking", "good talking", "great chatting", "nice chatting", "lovely chatting", "good chatting", "fun chatting", "great chat", "nice chat", "lovely chat", "good chat", "nice to meet", "great to meet", "lovely to meet", "good to meet", "nice meeting", "great meeting", "lovely meeting", "enjoyed", "loved hearing", "loved talking", "thanks for", "thank you for", "glad we", "so glad", "was fun", "was great", "really nice"];

// The appreciation in the goodbye, if any
export function appreciation(transcript: string): string | null {
  // Looked for in the closing part
  return firstPhrase(closingPart(words(transcript)), APPRECIATION);
}

// Phrases that give a reason to go
const REASONS = ["i'll let you", "ill let you", "let you get", "let you go", "i should", "i need to", "i've got to", "ive got to", "i have to", "i'd better", "id better", "i better", "i must", "i'm going to", "im going to", "i'm off", "im off", "i'm gonna", "im gonna", "gotta", "head off", "get back", "grab a", "grab some", "catch my", "before i"];

// Phrases that wish them well
const WISHES = ["good luck", "enjoy", "see you", "take care", "have a good", "have a great", "have a lovely", "have a nice", "have fun", "catch you", "talk soon", "speak soon", "all the best", "hope it", "hope you", "bye", "goodbye", "best of luck"];

// The reason to go and the warm wish in the goodbye (null for each one missing)
export function sendOff(transcript: string): { reason: string | null; wish: string | null } {
  // The closing part
  const closing = closingPart(words(transcript));
  // Each, looked for there
  return { reason: firstPhrase(closing, REASONS), wish: firstPhrase(closing, WISHES) };
}

// Phrases that ask about meaning rather than facts: what they enjoy, chose, found hard or hope for
const DEPTH = ["best part", "best thing", "best moment", "favourite", "favorite", "most", "hardest", "toughest", "surprised", "surprise", "what got you", "got you into", "get into", "what made you", "made you", "why", "love about", "like about", "enjoy", "excited", "proud", "looking forward", "if you could", "changed", "learned", "learnt", "mean to you", "matter", "miss", "wish", "dream", "keeps you", "drew you", "brought you", "on your mind", "stand out", "stood out", "memorable", "highlight", "feel", "felt"];

// Words that put the question on them
const YOU = ["you", "your", "you're", "youre", "you've", "youve", "yours"];

// The phrase that makes a question invite a real answer, if it is also about them
export function depthPhrase(transcript: string): string | null {
  // The words
  const said = words(transcript);
  // About them, with a phrase about meaning
  return said.some((word) => YOU.includes(word)) ? firstPhrase(said, DEPTH) : null;
}

// A reply to a story should pick up at least this many of its words
const STORY_WORDS = 2;

// What the phone hears for each beat, by itself (the moment and hook of an answer are for the user or the coach to judge)
function phoneFinds(session: SessionRecord, beat: BeatId): boolean {
  // What was said to them
  const said = findSmallTalk(session.promptId)?.question ?? "";
  // Whether anything was said at all (a beat that is about leaving something out is not found in silence)
  const spoke = words(session.transcript).length > 0;
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
      return spoke && staysOnThem(session.transcript);
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
      return spoke && staysOnStory(session.transcript);
    // News (React and Stay are checked as for listening)
    case "ask-moment":
      return questionKind(session.transcript) !== null;
    case "no-buts":
      return spoke && butPhrase(session.transcript) === null;
    // Reading the room (decision 95)
    case "noticed":
      return noticedPhrase(session.transcript) !== null;
    case "check":
      return questionKind(session.transcript) !== null;
    case "follow":
      return leadPhrase(session.transcript) !== null;
    case "no-blame":
      return spoke && guiltPhrase(session.transcript) === null;
    // Starting and ending
    case "around":
      return aroundWords(session.transcript, said).length > 0;
    case "ask-in":
      return openerAsks(session.transcript);
    case "thanks":
      return appreciation(session.transcript) !== null;
    case "send-off": {
      // A reason and a wish, both in the goodbye
      const parts = sendOff(session.transcript);
      // Both there
      return parts.reason !== null && parts.wish !== null;
    }
    // Going deeper (Open, About them and Just one are checked as in asking)
    case "depth":
      return depthPhrase(session.transcript) !== null;
  }
}

// The words that showed a beat, from the phone's own checks (empty when only the user or the coach can say)
export function phoneQuotes(session: SessionRecord, beat: BeatId): string[] {
  // What was said to them, or the moment, situation or flat question
  const said = findSmallTalk(session.promptId)?.question ?? "";
  // The transcript
  const transcript = session.transcript;
  // Not-null phrases as a list
  const listed = (...phrases: Array<string | null>): string[] => phrases.filter((phrase): phrase is string => phrase !== null);
  // Each beat's evidence
  switch (beat) {
    // The feeling words
    case "feeling":
      return feelingWords(transcript);
    // The question back
    case "hand-back":
      return listed(handBack(transcript));
    // The reaction
    case "react":
      return listed(reaction(transcript));
    // Their words, picked up
    case "their-detail":
    case "their-words":
      return sharedWords(transcript, said);
    // How it felt for them
    case "their-feeling":
      return theirFeelingWords(transcript);
    // The open question's first word, as said
    case "open":
      return questionKind(transcript) === "open" ? listed(transcript.split(/\s+/).find((word) => /^(what|how|why|where|when|which|who|tell)/i.test(word)) ?? null) : [];
    // What was noticed
    case "noticed":
      return listed(noticedPhrase(transcript));
    // The out, or the invitation to say more
    case "follow":
      return listed(leadPhrase(transcript));
    // What around them the opener used
    case "around":
      return aroundWords(transcript, said);
    // What they enjoyed
    case "thanks":
      return listed(appreciation(transcript));
    // The reason and the wish
    case "send-off":
      return listed(sendOff(transcript).reason, sendOff(transcript).wish);
    // What made the question deeper
    case "depth":
      return listed(depthPhrase(transcript));
    // The rest only the user can say
    default:
      return [];
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

// One change for a moment read in the room, in order: guilt or reassurance, nothing noticed, no question, nothing that follows their lead (decision 95)
function roomChange(session: SessionRecord): LocalChange {
  // Nothing said
  if (words(session.transcript).length === 0) return { change: "Say something out loud, even one short line. The point is to practise saying it.", retryCue: "Start with what you noticed: “You seem…”" };
  // Guilt or a call for reassurance
  if (guiltPhrase(session.transcript)) return { change: `Leave out “${guiltPhrase(session.transcript)}”. It asks them to reassure you; a light line makes it easy for them to be honest.`, retryCue: "Name what you noticed, kindly, then ask." };
  // Nothing noticed
  if (noticedPhrase(session.transcript) === null) return { change: "Say what you noticed, kindly: “You lit up just then” or “You've gone a bit quiet.” Naming the change shows you're paying attention.", retryCue: "Start with “You seem…” or “I noticed…”." };
  // No question
  if (questionKind(session.transcript) === null) return { change: "Treat it as a question, not an answer. You can't tell what a change means, so ask.", retryCue: "Add a short question: “Do you need to go?” or “What's it like?”" };
  // Nothing that follows their lead
  if (leadPhrase(session.transcript) === null) return { change: "Follow their lead: more of what lit them up (“Tell me more”), or an easy way out (“No worries if you need to go”).", retryCue: "End with an easy out, or an invitation to say more." };
  // All there
  return { change: "You named the change, asked, and followed their lead, without guilt. That is reading the room. In real life, watch what happens next and adjust again.", retryCue: "Try it with a different moment." };
}

// One change for an opener and a goodbye, in order: no easy question, nothing around you, no warm word, no reason, no wish (decision 95)
function startingChange(session: SessionRecord): LocalChange {
  // The situation
  const situation = findSmallTalk(session.promptId)?.question ?? "";
  // The goodbye's parts
  const parts = sendOff(session.transcript);
  // Nothing said
  if (words(session.transcript).length === 0) return { change: "Say both out loud: an opener, then a goodbye. Short is fine.", retryCue: "Open on something you can both see." };
  // No easy question in the opener
  if (!openerAsks(session.transcript)) return { change: "Ask an easy question in your opener, about here and now. A question gives them an easy way in.", retryCue: "Add “Have you been here before?” or something like it." };
  // Nothing around you
  if (aroundWords(session.transcript, situation).length === 0) return { change: "Open on something you can both see or share: the place, the queue, the food. It asks nothing personal yet.", retryCue: "Start with a line about something right in front of you." };
  // No warm word
  if (appreciation(session.transcript) === null) return { change: "Before you go, say what you enjoyed: “Great talking with you.” It ends on a high point.", retryCue: "Add one line on what you liked about the chat." };
  // No reason
  if (parts.reason === null) return { change: "Give a reason to go: “I'll let you get on” or “I'd better grab a seat.” It makes leaving feel natural, not abrupt.", retryCue: "Add “I'll let you…” before your goodbye." };
  // No wish
  if (parts.wish === null) return { change: "End with a warm wish: “Good luck with the move” or “Enjoy the rest of the party.”", retryCue: "Finish with a wish about their day or plans." };
  // All there
  return { change: "An easy opener about the moment, and a warm goodbye with a reason and a wish. In real life, leave while it's still good.", retryCue: "Try a situation you'll actually be in this week." };
}

// One change for an upgraded question, in order: no question, more than one, yes-or-no, still about facts, turned to you (decision 95)
function deeperChange(session: SessionRecord): LocalChange {
  // No question heard
  if (questionKind(session.transcript) === null) return { change: "Ask it as a question. Start with what, how or why.", retryCue: "Try “What's the best part of…?”" };
  // Too long
  if (!isOneQuestion(session.transcript)) return { change: "Just one question. A long one, or several, is hard to answer.", retryCue: "Ask one question in a single breath, then stop." };
  // Yes-or-no
  if (questionKind(session.transcript) === "closed") return { change: "Make it open. Did, is or do gets a yes; what, how or why invites a real answer.", retryCue: "Start with “What” or “How”." };
  // Still about facts
  if (depthPhrase(session.transcript) === null) return { change: "Ask about meaning, not facts: what they enjoy, why they chose it, or what surprised them.", retryCue: "Try “What's the best part of…?” or “What got you into…?”" };
  // About you
  if (!staysOnThem(session.transcript)) return { change: "Keep the question on them. Share a little first if you like, then ask and stop.", retryCue: "Ask, then listen." };
  // All there
  return { change: "Open, about what matters to them, and one question: that invites a real answer. Most people enjoy these more than you'd expect.", retryCue: "Ask it of someone this week." };
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
  // A moment read in the room
  if (unit === "room") return roomChange(session);
  // An opener and a goodbye
  if (unit === "starting") return startingChange(session);
  // An upgraded question
  if (unit === "deeper") return deeperChange(session);
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
