// Which small-talk unit a prompt belongs to, from its id alone (decision 99), so the feedback sender, the save step and the timing rules do not load every small-talk question to find out. A test checks it against the questions and lessons in smallTalk.ts

// The seven units: answering a question, asking a follow-up, listening to a story, responding to news, reading the room, starting and ending, and going deeper (decision 95)
export type UnitId = "answering" | "asking" | "listening" | "news" | "room" | "starting" | "deeper";

// Each unit's id beginnings: its drills', then its lessons' (st01 and stl1 are answering, sa01 and sal1 asking, and so on)
const PREFIXES: ReadonlyArray<[RegExp, UnitId]> = [
  // Answering a question
  [/^stl?\d+$/, "answering"],
  // Asking a follow-up
  [/^sal?\d+$/, "asking"],
  // Listening to a story
  [/^s(ls|ll)\d+$/, "listening"],
  // Responding to news
  [/^snl?\d+$/, "news"],
  // Reading the room
  [/^srl?\d+$/, "room"],
  // Starting and ending
  [/^sel?\d+$/, "starting"],
  // Going deeper
  [/^sdl?\d+$/, "deeper"],
];

// The unit a prompt belongs to (answering when it is not known)
export function unitOf(promptId: string): UnitId {
  // The first unit whose id beginning matches, or answering
  return PREFIXES.find(([pattern]) => pattern.test(promptId))?.[1] ?? "answering";
}
