// A conversation's timeline (decision 115): your turns and theirs in two lanes, each as long as it took, your questions marked, your share of the talking, and one plain line on the turns' lengths. With the turns' saved times (decision 141) each turn sits where it really was, so the gaps, the stretches where you both talked and the moments one of you cut in show too. Pure

// Load the question check and the measures
import { asksQuestion, measureConversation } from "@/core/conversationMeasures";
// Load the timing check (decision 141)
import { isBackchannel, isTimed } from "@/core/conversationTiming";
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
  // Whether it was only a listening sound (yours only; decision 141)
  backchannel: boolean;
}

// A stretch where both of you talked at once (decision 141)
export interface TimelineOverlap {
  // When it started, in seconds from the first turn
  start: number;
  // How long, in seconds
  seconds: number;
}

// A moment one of you cut the other short (decision 141)
export interface TimelineCut {
  // When, in seconds from the first turn
  at: number;
  // Who cut in
  by: "you" | "them";
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
  // Whether the turns sat at their real times (decision 141; spaced end to end otherwise)
  timed: boolean;
  // Stretches where both talked at once (none without times)
  overlaps: TimelineOverlap[];
  // Moments one cut the other short
  cuts: TimelineCut[];
}

// Round to a hundredth of a second (times are saved to a tenth; this keeps sums tidy)
function hundredth(value: number): number {
  // To two places
  return Math.round(value * 100) / 100;
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
  // With every turn's times, each sits where it was, from the first turn's start
  const timed = isTimed(turns);
  // Where time starts
  const origin = timed ? Math.min(...turns.map((turn) => turn.at!)) : 0;
  // The running clock, when spacing them end to end
  let clock = 0;
  // Each turn placed
  const placed = turns.map((turn) => {
    // Its place: its real time, or after the one before
    const item: TimelineTurn = timed ? { who: turn.who, start: hundredth(turn.at! - origin), seconds: Math.max(0.5, hundredth(turn.end! - turn.at!)), question: turn.who === "you" && asksQuestion(turn.text), backchannel: isBackchannel(turn) } : { who: turn.who, start: clock, seconds: Math.max(0.5, turn.seconds), question: turn.who === "you" && asksQuestion(turn.text), backchannel: isBackchannel(turn) };
    // Move on
    clock += item.seconds;
    // Hand it back
    return item;
  });
  // Where both talked at once, and who cut in: only with times
  const overlaps: TimelineOverlap[] = [];
  // (cuts)
  const cuts: TimelineCut[] = [];
  // Each handover
  for (let index = 1; timed && index < turns.length; index += 1) {
    // The turn before, and this one
    const [before, turn] = [turns[index - 1]!, turns[index]!];
    // Talking at once
    const together = before.end! - turn.at!;
    // Kept when there was some
    if (together > 0) overlaps.push({ start: hundredth(turn.at! - origin), seconds: hundredth(Math.min(together, turn.end! - turn.at!)) });
    // A cut-in between the two of you: marked, or more than a normal handover (a listening sound is not one)
    if (before.who !== turn.who && (before.cut === true || together >= 0.3) && !isBackchannel(turn)) cuts.push({ at: hundredth(before.end! - origin), by: turn.who });
  }
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
  // The timeline: its whole length is the latest end
  return { turns: placed, total: Math.max(...placed.map((turn) => turn.start + turn.seconds)), share, line, timed, overlaps, cuts };
}
