// Missions: small real-world tries, easiest first, each with one safety habit to drop and the card behind it (see documents/plan-research-applied.md, stage 1)

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
}

// The missions, easiest first
export const MISSIONS: ReadonlyArray<Mission> = [
  // Level 1
  { id: "m01", level: 1, move: "Follow up", task: "Ask one follow-up question about something someone tells you today.", why: "People who ask more follow-ups are liked more, and nobody predicts it (strong evidence).", drop: "Don't plan your next line while they talk. Listen for one detail.", cardId: "talk-follow-ups" },
  // Level 1
  { id: "m02", level: 1, move: "React", task: "When someone tells you a story, react to it before you say anything else: “No way!” or “Oh no.”", why: "Specific reactions make storytellers tell their stories better (strong evidence).", drop: "Don't wait for your turn. Let the reaction come first.", cardId: "talk-co-narrators" },
  // Level 1
  { id: "m03", level: 1, move: "Give a detail", task: "When someone asks how you are, give one real detail instead of “good”.", why: "A detail gives them something to ask about, and follow-ups are where liking grows.", drop: "Don't stop at “fine”. Say one small thing that happened.", cardId: "story-hook" },
  // Level 1
  { id: "m04", level: 1, move: "Thank", task: "Thank someone today for something specific they did.", why: "Thanks with a reason made people see the thanker as warmer (moderate evidence).", drop: "Don't shrink it with “no big deal”. Say what it meant.", cardId: "warm-thanks" },
  // Level 2
  { id: "m05", level: 2, move: "Compliment", task: "Give one specific compliment you would normally keep to yourself.", why: "People underestimate how good a compliment makes others feel, and overestimate the awkwardness (moderate evidence).", drop: "Don't soften it with a joke or a “but”.", cardId: "warm-compliment" },
  // Level 2
  { id: "m06", level: 2, move: "Stay with them", task: "Ask two follow-up questions before you share anything about yourself.", why: "Turning the talk to yourself too soon makes questions feel insincere (strong evidence).", drop: "Don't wait to tell your own version of their story.", cardId: "talk-boomerask" },
  // Level 2
  { id: "m07", level: 2, move: "Good news", task: "When someone shares good news, react and ask about the moment: “When did you hear?”", why: "Enthusiastic, curious replies to good news go with more trust and closeness (moderate evidence).", drop: "Don't point out a downside or bring up your own news.", cardId: "warm-good-news" },
  // Level 2
  { id: "m08", level: 2, move: "Listen first", task: "When someone shares a problem, ask one question before giving any advice.", why: "Listening made people feel more understood than advice did (moderate evidence).", drop: "Don't fix it straight away.", cardId: "warm-advice" },
  // Level 2
  { id: "m09", level: 2, move: "End well", task: "End one conversation on a high point, while it is still good.", why: "Conversations almost never end when both people want them to (moderate evidence).", drop: "Don't wait for the awkward pause.", cardId: "talk-endings" },
  // Level 3
  { id: "m10", level: 3, move: "Go deeper", task: "Ask one deeper question, like “What's the best part of it?” or “What got you into that?”", why: "Deeper talk with strangers goes better than people expect (moderate to strong evidence).", drop: "Don't retreat to safe topics when it goes quiet.", cardId: "talk-deeper" },
  // Level 3
  { id: "m11", level: 3, move: "Share", task: "Share one honest opinion about something, then ask for theirs.", why: "We like people who open up to us, and back-and-forth sharing builds closeness (strong evidence).", drop: "Don't hedge it until it says nothing.", cardId: "warm-share" },
  // Level 3
  { id: "m12", level: 3, move: "Admit it", task: "Admit one small mistake, or ask someone for help with something.", why: "Others judge our small admissions more kindly than we do (moderate evidence).", drop: "Don't over-explain or apologise twice.", cardId: null },
  // Level 3
  { id: "m13", level: 3, move: "Start one", task: "Start a short conversation with someone you don't usually talk to.", why: "People like us more than we think after talking (strong evidence), and most such chats go fine.", drop: "Don't script your exit before you begin.", cardId: "talk-liking-gap" },
  // Level 3
  { id: "m14", level: 3, move: "Remember a name", task: "Learn one new name and use it when you say goodbye.", why: "Using a name is about remembering, not a trick to be liked; that claim has no support.", drop: "Don't let it slip past. Repeat it once when you hear it.", cardId: "talk-names" },
];

// A mission by id
export function findMission(id: string): Mission | undefined {
  // Looked up
  return MISSIONS.find((mission) => mission.id === id);
}

// The 1 to 5 scale's words, for predictions and outcomes
export const SCALE_WORDS: Readonly<Record<number, string>> = { 1: "Badly", 2: "Awkward", 3: "Okay", 4: "Well", 5: "Very well" };
