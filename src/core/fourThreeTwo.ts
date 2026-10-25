// The 4/3/2 loop (decision 118), after Paul Nation's fluency activity: the same content told three times in one sitting, each time in less time (4:00, then 3:00, then 2:00 for a prepared speech; scaled down for a story). Each round is its own session, linked by the loop's id; after the third, the rounds are compared with the charts that already exist. Pure

// Load the clock format
import { formatClock } from "@/core/recordingRules";
// Load the story set-up as address parts (decision 126)
import { storyTakeQuery } from "@/content/stories";
// Load the record types
import type { SessionMode, SessionRecord, StoryLength, StoryTake } from "@/data/records";

// Rounds in a loop
export const LOOP_ROUNDS = 3;

// The kinds a loop is offered for
export type LoopMode = "response" | "story";

// Whether a kind of session can be told three times
export function isLoopMode(mode: SessionMode): mode is LoopMode {
  // A prepared speech or a story
  return mode === "response" || mode === "story";
}

// Each round's target in seconds: Nation's 4:00, 3:00, 2:00 for a prepared speech (its own 2:00 to 4:00 window); a full story, whose red light is 3:00, keeps the same 4:3:2 ratio from there (3:00, 2:15, 1:30); a short story starts a little past its 1:15 red light, as the first telling is the loose one (2:00, 1:30, 1:00)
export const LOOP_TARGETS: Readonly<Record<"response" | StoryLength, readonly [number, number, number]>> = {
  // A prepared speech
  response: [240, 180, 120],
  // A full story
  full: [180, 135, 90],
  // A short story
  short: [120, 90, 60],
};

// The three targets for a kind of session and, for a story, its length
export function loopTargets(mode: LoopMode, length: StoryLength = "full"): readonly [number, number, number] {
  // The prepared speech's, or the story length's
  return mode === "response" ? LOOP_TARGETS.response : LOOP_TARGETS[length];
}

// One round's target (round counted from 1)
export function roundTarget(mode: LoopMode, length: StoryLength, round: number): number {
  // Within the three rounds
  return loopTargets(mode, length)[Math.min(Math.max(round, 1), LOOP_ROUNDS) - 1]!;
}

// The three targets as words, such as "4:00, then 3:00, then 2:00"
export function targetWords(mode: LoopMode, length: StoryLength = "full"): string {
  // Each as a clock
  return loopTargets(mode, length).map(formatClock).join(", then ");
}

// The address of a round: the same prompt and set-up, the loop ("new" before the first round is saved) and the round, and any retry and plan step
export function loopHref(take: { mode: LoopMode; promptId: string; story?: StoryTake | null; retryOf?: string | null; planStep?: number | null }, loopId: string, round: number): string {
  // The story's set-up, when a story
  const story = take.mode === "story" && take.story ? storyTakeQuery(take.story) : "";
  // The parts together
  return `/session?mode=${take.mode}&prompt=${encodeURIComponent(take.promptId)}${story}${take.retryOf ? `&retryOf=${encodeURIComponent(take.retryOf)}` : ""}&loop=${encodeURIComponent(loopId)}&round=${round}${take.planStep ? `&plan=${take.planStep}` : ""}`;
}

// A loop's rounds among the sessions, in round order (one per round; a repeated round keeps its latest)
export function loopRounds<T extends SessionRecord>(sessions: ReadonlyArray<T>, loopId: string): T[] {
  // The latest session for each round
  const byRound = new Map<number, T>();
  // Each session of the loop
  for (const session of sessions) {
    // Not this loop
    if (session.loop?.id !== loopId) continue;
    // The one already kept for its round
    const kept = byRound.get(session.loop.round);
    // Keep the later one
    if (!kept || kept.createdAt < session.createdAt) byRound.set(session.loop.round, session);
  }
  // In round order
  return [...byRound.entries()].sort((a, b) => a[0] - b[0]).map(([, session]) => session);
}

// Whether a loop's rounds are whole: rounds 1, 2 and 3, all of the same prompt and kind
export function loopComplete(rounds: ReadonlyArray<SessionRecord>): boolean {
  // Three, numbered 1 to 3, sharing the prompt and kind
  return rounds.length === LOOP_ROUNDS && rounds.every((round, index) => round.loop?.round === index + 1 && round.promptId === rounds[0]!.promptId && round.mode === rounds[0]!.mode);
}
