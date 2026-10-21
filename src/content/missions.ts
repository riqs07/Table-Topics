// Missions: small real-world tries, easiest first, each with one safety habit to drop and the card behind it (see documents/plan-research-applied.md, stage 1); each belongs to the Connect unit it practises (decision 95)

// Load the unit id type
import type { UnitId } from "@/content/smallTalk";

// One mission
export interface Mission {
  // Stable id, stored with each try
  id: string;
  // How big a step it is: 1 easy, 2 a stretch, 3 bold
  level: 1 | 2 | 3;
  // The move it practises, in a word or two
  move: string;
  // What to try today
  task: string;
  // Why it works, in one line (with how solid the evidence is)
  why: string;
  // One safety habit to drop while trying it
  drop: string;
  // The Learn card behind it, if there is one
  cardId: string | null;
  // The Connect unit it practises, if one does (its page lists it; decision 95)
  unit: UnitId | null;
  // The debrief's question about what you noticed, when this mission has its own (otherwise "What did you notice about them?")
  notice?: string;
}

// The missions, easiest first
export const MISSIONS: ReadonlyArray<Mission> = [
  // Level 1
  { id: "m01", level: 1, move: "Follow up", task: "Ask one follow-up question about something someone tells you today.", why: "People who ask more follow-ups are liked more, and nobody predicts it (strong evidence).", drop: "Don't plan your next line while they talk. Listen for one detail.", cardId: "talk-follow-ups", unit: "asking" },
  // Level 1
  { id: "m02", level: 1, move: "React", task: "When someone tells you a story, react to it before you say anything else: “No way!” or “Oh no.”", why: "Specific reactions make storytellers tell their stories better (strong evidence).", drop: "Don't wait for your turn. Let the reaction come first.", cardId: "talk-co-narrators", unit: "listening" },
  // Level 1
  { id: "m03", level: 1, move: "Give a detail", task: "When someone asks how you are, give one real detail instead of “good”.", why: "A detail gives them something to ask about, and follow-ups are where liking grows.", drop: "Don't stop at “fine”. Say one small thing that happened.", cardId: "story-hook", unit: "answering" },
  // Level 1
  { id: "m04", level: 1, move: "Thank", task: "Thank someone today for something specific they did.", why: "Thanks with a reason made people see the thanker as warmer (moderate evidence).", drop: "Don't shrink it with “no big deal”. Say what it meant.", cardId: "warm-thanks", unit: null },
  // Level 1 (decision 95)
  { id: "m15", level: 1, move: "Notice what lights them up", task: "Notice one thing that made someone light up today, and ask one more question about it.", why: "A change tells you more than any single signal, and follow-ups on what people care about make them like you more (moderate to strong evidence).", drop: "Don't steer back to your own topic.", cardId: "body-changes", unit: "room", notice: "What made them light up, and how could you tell?" },
  // Level 1 (decision 95)
  { id: "m18", level: 1, move: "Say hello", task: "Say hello to a neighbour, and add one line about something you can both see.", why: "In a week of talk-to-a-stranger missions, most chats went fine with the first person tried, and worry fell (moderate evidence).", drop: "Don't wait for them to speak first.", cardId: "practise-doing", unit: "starting", notice: "How did they respond, compared with what you expected?" },
  // Level 2
  { id: "m05", level: 2, move: "Compliment", task: "Give one specific compliment you would normally keep to yourself.", why: "People underestimate how good a compliment makes others feel, and overestimate the awkwardness (moderate evidence).", drop: "Don't soften it with a joke or a “but”.", cardId: "warm-compliment", unit: null },
  // Level 2
  { id: "m06", level: 2, move: "Stay with them", task: "Ask two follow-up questions before you share anything about yourself.", why: "Turning the talk to yourself too soon makes questions feel insincere (strong evidence).", drop: "Don't wait to tell your own version of their story.", cardId: "talk-boomerask", unit: "asking" },
  // Level 2
  { id: "m07", level: 2, move: "Good news", task: "When someone shares good news, react and ask about the moment: “When did you hear?”", why: "Enthusiastic, curious replies to good news go with more trust and closeness (moderate evidence).", drop: "Don't point out a downside or bring up your own news.", cardId: "warm-good-news", unit: "news" },
  // Level 2
  { id: "m08", level: 2, move: "Listen first", task: "When someone shares a problem, ask one question before giving any advice.", why: "Listening made people feel more understood than advice did (moderate evidence).", drop: "Don't fix it straight away.", cardId: "warm-advice", unit: "listening" },
  // Level 2
  { id: "m09", level: 2, move: "End well", task: "End one conversation on a high point, while it is still good.", why: "Conversations almost never end when both people want them to (moderate evidence).", drop: "Don't wait for the awkward pause.", cardId: "talk-endings", unit: "starting" },
  // Level 2 (decision 95)
  { id: "m16", level: 2, move: "Wrap up kindly", task: "Notice one sign someone wanted to go, and wrap up warmly.", why: "People can't tell when the other wants to stop, so an easy out is a kindness (moderate evidence).", drop: "Don't push on to finish your story.", cardId: "talk-endings", unit: "room", notice: "What was the sign, and how did they take the wrap-up?" },
  // Level 3
  { id: "m10", level: 3, move: "Go deeper", task: "Ask one deeper question, like “What's the best part of it?” or “What got you into that?”", why: "Deeper talk with strangers goes better than people expect (moderate to strong evidence).", drop: "Don't retreat to safe topics when it goes quiet.", cardId: "talk-deeper", unit: "deeper" },
  // Level 3
  { id: "m11", level: 3, move: "Share", task: "Share one honest opinion about something, then ask for theirs.", why: "We like people who open up to us, and back-and-forth sharing builds closeness (strong evidence).", drop: "Don't hedge it until it says nothing.", cardId: "warm-share", unit: "deeper" },
  // Level 3
  { id: "m12", level: 3, move: "Admit it", task: "Admit one small mistake, or ask someone for help with something.", why: "Others judge our small admissions more kindly than we do (moderate evidence).", drop: "Don't over-explain or apologise twice.", cardId: null, unit: null },
  // Level 3
  { id: "m13", level: 3, move: "Start one", task: "Start a short conversation with someone you don't usually talk to.", why: "People like us more than we think after talking (strong evidence), and most such chats go fine.", drop: "Don't script your exit before you begin.", cardId: "talk-liking-gap", unit: "starting" },
  // Level 3
  { id: "m14", level: 3, move: "Remember a name", task: "Learn one new name and use it when you say goodbye.", why: "Using a name is about remembering, not a trick to be liked; that claim has no support.", drop: "Don't let it slip past. Repeat it once when you hear it.", cardId: "talk-names", unit: "starting" },
  // Level 3 (decision 95)
  { id: "m17", level: 3, move: "Match their energy", task: "For one conversation, match the other person's energy: calmer with someone quiet, livelier with someone excited.", why: "Rapport starts with attention and warmth; copying gestures on purpose did nothing in a careful test, so match the mood, not the moves (moderate evidence).", drop: "Don't copy their gestures. Follow the mood.", cardId: "body-mirroring", unit: "room", notice: "What was their energy, and what changed when you met it?" },
  // Level 3 (decision 95)
  { id: "m19", level: 3, move: "Deeper with a friend", task: "Ask a friend a deeper question than usual, like “What's been on your mind lately?”", why: "Deeper talk goes better than people expect, with strangers and friends alike (moderate to strong evidence).", drop: "Don't rush to fill the pause after you ask.", cardId: "talk-deeper", unit: "deeper", notice: "How did they answer, and how did it feel afterwards?" },
];

// A mission by id
export function findMission(id: string): Mission | undefined {
  // Looked up
  return MISSIONS.find((mission) => mission.id === id);
}

// How big a step each level is, in a word or two (shown on a unit's page; decision 95)
export const LEVEL_WORDS: Readonly<Record<Mission["level"], string>> = { 1: "Easy", 2: "A stretch", 3: "Bold" };

// The 1 to 5 scale's words, for predictions and outcomes
export const SCALE_WORDS: Readonly<Record<number, string>> = { 1: "Badly", 2: "Awkward", 3: "Okay", 4: "Well", 5: "Very well" };
