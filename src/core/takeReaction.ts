// What the blob says on the results page (decision 141): one short line picked from what the take measured, in this order: a personal best for pause words, the first recording, landing inside the time window, else a plain word. Pure, and never about anything said while recording

// Load the session type
import type { SessionMode, SessionRecord } from "@/data/records";
// Load the time windows and the clock format
import { formatClock, takeWindow } from "@/core/recordingRules";

// The kinds of take a personal best counts across: speaking from a prompt, where pause words a minute mean the same thing
const SPEAKING: ReadonlyArray<SessionMode> = ["talk", "response", "free", "story"];
// The shortest take that counts, in seconds (a few words give a wild rate)
export const BEST_MIN_SECONDS = 30;
// How many earlier takes there must be before a best means anything
export const BEST_MIN_EARLIER = 3;

// The reaction: its kind (which sets the blob's mood) and its line, with the before and after for a best
export type TakeReaction =
  | { kind: "best"; line: string; before: string; after: string }
  | { kind: "first"; line: string }
  | { kind: "window"; line: string }
  | { kind: "done"; line: string };

// A rate with one decimal, without a trailing ".0"
function rate(value: number): string {
  // Rounded to one place
  return String(Math.round(value * 10) / 10);
}

// The reaction to a take, given every session (its own is skipped) and whether pause-word counts are shown at all
export function takeReaction(take: SessionRecord, all: ReadonlyArray<SessionRecord>, pauseWordsShown: boolean): TakeReaction {
  // Whether the take counts towards a best
  const counts = (session: SessionRecord) => SPEAKING.includes(session.mode) && session.durationSec >= BEST_MIN_SECONDS && Number.isFinite(session.fillersPerMinute);
  // The earlier takes that count
  const earlier = all.filter((session) => session.id !== take.id && session.createdAt < take.createdAt && counts(session));
  // A personal best: fewer pause words a minute than every earlier take, by a visible margin, once there are enough to compare
  if (pauseWordsShown && counts(take) && earlier.length >= BEST_MIN_EARLIER) {
    // The best before
    const before = Math.min(...earlier.map((session) => session.fillersPerMinute));
    // A clear improvement, as shown to one decimal
    if (rate(take.fillersPerMinute) !== rate(before) && take.fillersPerMinute < before) return { kind: "best", line: "Your fewest pause words yet.", before: rate(before), after: rate(take.fillersPerMinute) };
  }
  // The first recording, which later ones are measured against
  if (take.isBaseline) return { kind: "first", line: "Your first one! That’s the hardest one done." };
  // The take's time window, if its kind has one
  const window = takeWindow(take);
  // Whole seconds, as the timer showed them
  const seconds = Math.round(take.durationSec);
  // Inside it
  if (window && seconds >= window.start && seconds <= window.end) return { kind: "window", line: `Nice one. ${formatClock(seconds)}, right in the window.` };
  // Anything else: a plain word, the one change below doing the work
  return { kind: "done", line: "One more in the bank. Here’s one thing to try." };
}
