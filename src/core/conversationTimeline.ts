// A conversation's timeline (decision 115): your turns and theirs in two lanes, each as long as it took, your questions marked, your share of the talking, and one plain line on the turns' lengths. Pure

// Load the question check and the measures
import { asksQuestion, measureConversation } from "@/core/conversationMeasures";
// Load the record type
import type { ConversationTurn } from "@/data/records";

// A turn that ran this many times your usual turn, and at least this long, is said
const LONG_TURN_TIMES = 2;
// (seconds)
const LONG_TURN_SECONDS = 20;

// One turn on the timeline
export interface TimelineTurn {
  // Who spoke
  who: "you" | "them";
  // When it started, in seconds from the first turn
  start: number;
  // How long it took, in seconds
  seconds: number;
  // Whether it asked a question (yours only)
  question: boolean;
}

// The timeline
export interface ConversationTimeline {
  // Every turn
  turns: TimelineTurn[];
  // The whole length, in seconds
  total: number;
  // Your share of the words, as a whole percent, or null
  share: number | null;
  // One plain line
  line: string;
}

// An ordinal for a turn number: 1st, 2nd, 3rd, 4th
function ordinal(count: number): string {
  // The usual endings
  return `${count}${count % 10 === 1 && count % 100 !== 11 ? "st" : count % 10 === 2 && count % 100 !== 12 ? "nd" : count % 10 === 3 && count % 100 !== 13 ? "rd" : "th"}`;
}

// The timeline of a conversation, or null without turns
export function conversationTimeline(turns: ReadonlyArray<ConversationTurn>): ConversationTimeline | null {
  // Nothing to draw
  if (turns.length === 0) return null;
  // The running clock
  let clock = 0;
  // Each turn placed
  const placed = turns.map((turn) => {
    // Its place
    const item: TimelineTurn = { who: turn.who, start: clock, seconds: Math.max(0.5, turn.seconds), question: turn.who === "you" && asksQuestion(turn.text) };
    // Move on
    clock += item.seconds;
    // Hand it back
    return item;
  });
  // The measures, for the share
  const measures = measureConversation(turns);
  // Your turns
  const yours = placed.filter((turn) => turn.who === "you");
  // Their lengths in order
  const sorted = yours.map((turn) => turn.seconds).sort((a, b) => a - b);
  // Your usual turn
  const usual = sorted[Math.floor(sorted.length / 2)] ?? 0;
  // Your longest turn
  const longest = yours.reduce<TimelineTurn | null>((best, turn) => (!best || turn.seconds > best.seconds ? turn : best), null);
  // The share as a percent
  const share = measures.share === null ? null : Math.round(measures.share * 100);
  // The line: one turn that ran long, or how the turns compared
  const line = longest && yours.length >= 3 && longest.seconds >= LONG_TURN_SECONDS && longest.seconds >= usual * LONG_TURN_TIMES ? `Your ${ordinal(yours.indexOf(longest) + 1)} turn ran longest, ${Math.round(longest.seconds)} seconds. Hand it back sooner with a question.` : yours.length === 0 ? "Nothing was heard from you this time." : `Your turns were ${Math.round(usual)} seconds or so each.`;
  // The timeline
  return { turns: placed, total: clock, share, line };
}
