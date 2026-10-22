// A conversation's timing (decision 141): how quickly you replied, who cut whom short, how long you both talked at once, and your listening sounds, from the times saved on each turn. Pure. Works in every turn mode (tap, automatic, live, phone call); most precise live, where the turns' times come from the speech service rather than the start and stop of a recording

// Load the listening-sound check
import { onlyListening } from "@/core/liveStreaming";
// Load the record types
import type { ConversationTimingRaw, ConversationTurn } from "@/data/records";

// Talking over the other person by at least this long counts as cutting in, in seconds (less is the normal handover)
const OVERLAP_CUT_IN = 0.3;
// The fewest reply gaps that make a median worth stating
const MIN_GAPS = 2;
// The fewest reply gaps before the median is said with confidence
const CONFIDENT_GAPS = 3;
// Overlap below this, in seconds, is too little to mention
const NOTABLE_OVERLAP = 0.5;

// A turn with both of its times
type TimedTurn = ConversationTurn & { at: number; end: number };

// Whether a turn has both of its times
function timed(turn: ConversationTurn): turn is TimedTurn {
  // Both are numbers, in order
  return typeof turn.at === "number" && typeof turn.end === "number" && Number.isFinite(turn.at) && Number.isFinite(turn.end) && turn.end >= turn.at;
}

// Whether a conversation's turns all have their times (only then are the timing measures worked out; older conversations have none)
export function isTimed(turns: ReadonlyArray<ConversationTurn>): boolean {
  // At least two turns, each timed
  return turns.length >= 2 && turns.every(timed);
}

// Whether a turn of yours was only a listening sound
export function isBackchannel(turn: ConversationTurn): boolean {
  // Yours, with words, all of them listening sounds
  return turn.who === "you" && turn.text.trim() !== "" && onlyListening(turn.text);
}

// The middle value
function median(values: ReadonlyArray<number>): number {
  // Sorted
  const sorted = [...values].sort((a, b) => a - b);
  // The middle
  const middle = Math.floor(sorted.length / 2);
  // One middle value, or the mean of two
  return sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

// Round to a tenth
function tenth(value: number): number {
  // To one place
  return Math.round(value * 10) / 10;
}

// The timing measures of a conversation
export function conversationTiming(turns: ReadonlyArray<ConversationTurn>): ConversationTimingRaw {
  // Listening sounds need no times
  const backchannels = turns.filter(isBackchannel).length;
  // Without times, only those
  if (!isTimed(turns)) return { replyGapMedian: null, interruptionsByYou: null, interruptionsReceived: null, overlapSeconds: null, backchannels };
  // Every turn timed
  const all = turns as ReadonlyArray<TimedTurn>;
  // Gaps before your replies
  const gaps: number[] = [];
  // Counts
  let byYou = 0;
  // (theirs)
  let received = 0;
  // Talking at once
  let overlap = 0;
  // Each handover from one turn to the next
  for (let index = 1; index < all.length; index += 1) {
    // The turn before, and this one
    const [before, turn] = [all[index - 1]!, all[index]!];
    // Talking at once over the handover
    const together = Math.max(0, before.end - turn.at);
    // Added up
    overlap += together;
    // A handover between the two of you
    if (before.who === turn.who) continue;
    // Cut short: marked, or talked over by more than a normal handover
    const cutIn = before.cut === true || together >= OVERLAP_CUT_IN;
    // You cut them short (a listening sound over them is not cutting in)
    if (cutIn && turn.who === "you" && !isBackchannel(turn)) byYou += 1;
    // They cut you short
    if (cutIn && turn.who === "them") received += 1;
    // Your reply after their line, unless it was only a listening sound: from their last sound to your first
    if (turn.who === "you" && !isBackchannel(turn)) gaps.push(Math.max(0, turn.at - before.end));
  }
  // The measures
  return { replyGapMedian: gaps.length >= MIN_GAPS ? tenth(median(gaps)) : null, interruptionsByYou: byYou, interruptionsReceived: received, overlapSeconds: tenth(overlap), backchannels };
}

// One timing finding for the results, with whether it is sure enough to show first (decision 115's focus-first rule: only confident findings surface; the rest wait behind "See more")
export interface TimingFinding {
  // Which measure
  id: "reply_gap" | "interruptions_by_you" | "interruptions_received" | "overlap" | "backchannels";
  // One plain line
  line: string;
  // Sure enough to show first
  confident: boolean;
}

// The timing findings of a conversation, confident first; live turns make the gaps and listening sounds trustworthy (the browser's speech recognition drops most "mm-hm"s, and a tapped turn's start is the tap)
export function timingFindings(turns: ReadonlyArray<ConversationTurn>, name: string, live: boolean): TimingFinding[] {
  // The measures
  const timing = conversationTiming(turns);
  // The findings
  const findings: TimingFinding[] = [];
  // Your interruptions: recorded events, so always sure
  if (timing.interruptionsByYou !== null && timing.interruptionsByYou > 0) findings.push({ id: "interruptions_by_you", line: `You cut in on ${name} ${times(timing.interruptionsByYou)}.`, confident: true });
  // Theirs
  if (timing.interruptionsReceived !== null && timing.interruptionsReceived > 0) findings.push({ id: "interruptions_received", line: `${name} cut in on you ${times(timing.interruptionsReceived)}.`, confident: true });
  // Talking at once
  if (timing.overlapSeconds !== null) findings.push({ id: "overlap", line: timing.overlapSeconds > 0 ? `You talked at the same time for ${timing.overlapSeconds} seconds in all.` : "You never talked at the same time.", confident: timing.overlapSeconds >= NOTABLE_OVERLAP });
  // The reply gap
  if (timing.replyGapMedian !== null) findings.push({ id: "reply_gap", line: `You usually replied ${timing.replyGapMedian} seconds after ${name} finished.`, confident: live && gapsCounted(turns) >= CONFIDENT_GAPS });
  // Listening sounds
  findings.push({ id: "backchannels", line: timing.backchannels > 0 ? `You made ${timing.backchannels} listening ${timing.backchannels === 1 ? "sound" : "sounds"} (“mm-hm”, “right”).` : "No listening sounds were heard.", confident: live && timing.backchannels > 0 });
  // Confident first, otherwise in order
  return [...findings.filter((finding) => finding.confident), ...findings.filter((finding) => !finding.confident)];
}

// How many reply gaps were measured
function gapsCounted(turns: ReadonlyArray<ConversationTurn>): number {
  // Your replies after one of their lines, both timed, not listening sounds
  return turns.filter((turn, index) => index > 0 && turn.who === "you" && turns[index - 1]!.who === "them" && timed(turn) && timed(turns[index - 1]!) && !isBackchannel(turn)).length;
}

// "once", "twice", "3 times"
function times(count: number): string {
  // In words for the first two
  return count === 1 ? "once" : count === 2 ? "twice" : `${count} times`;
}

// Where the microphone heard speech in a turn, from its loudness readings: the first and last reading well above the quietest, in seconds from the start of the recording, or null when nothing stood out (a turn of silence)
export function speechSpan(levels: ReadonlyArray<number>, tickMs: number): { first: number; last: number } | null {
  // Nothing recorded
  if (levels.length === 0) return null;
  // The room: the quietest reading
  const floor = Math.max(0.002, Math.min(...levels));
  // Speech: three times the room (the same rule as decision 101's)
  const loud = (level: number) => level >= floor * 3;
  // The first and last loud reading
  const first = levels.findIndex(loud);
  // (last)
  const last = levels.length - 1 - [...levels].reverse().findIndex(loud);
  // None
  if (first < 0) return null;
  // As seconds, the last reading's end included
  return { first: tenth((first * tickMs) / 1000), last: tenth(((last + 1) * tickMs) / 1000) };
}
