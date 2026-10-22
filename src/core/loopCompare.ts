// Comparing the three rounds of a 4/3/2 loop (decision 118): each round's numbers, the small table and the one line on what changed past the noise (decision 103). Loaded only with the last round's results. Pure

// Load the pause finder, for pauses a minute
import { findPauses } from "@/core/pauses";
// Load the story checks, for how many a round heard
import { heardList, storyChecks } from "@/core/storyChecks";
// Load the noise rules a change must clear (decision 103)
import { fixedThreshold, PACE_NOISE, PAUSE_WORD_NOISE } from "@/core/changeNoise";
// Load the clock format and the spacing of the readings
import { formatClock, LOUDNESS_TICK_MS } from "@/core/recordingRules";
// Load the record type
import type { FullSession } from "@/data/records";

// One round's numbers for the table
export interface RoundNumbers {
  // Which round
  round: number;
  // Overall pace, words a minute
  pace: number;
  // Pause words a minute
  pauseWords: number;
  // Pauses a minute, or null without loudness readings
  pauses: number | null;
  // Story checks heard, or null for a prepared speech
  storyChecks: number | null;
  // The length
  durationSec: number;
  // The target
  targetSec: number;
}

// The numbers of each round
export function roundNumbers(rounds: ReadonlyArray<FullSession>): RoundNumbers[] {
  // Each round
  return rounds.map((session, index) => {
    // Pauses, when loudness was kept
    const pauses = session.loudness && session.loudness.length > 0 && session.durationSec > 0 ? Math.round((findPauses(session.loudness, LOUDNESS_TICK_MS).count / session.durationSec) * 60 * 10) / 10 : null;
    // Its numbers
    return { round: session.loop?.round ?? index + 1, pace: Math.round(session.wordsPerMinute), pauseWords: Math.round(session.fillersPerMinute * 10) / 10, pauses, storyChecks: session.mode === "story" ? heardList(storyChecks(session.transcript)).filter((line) => line.heard).length : null, durationSec: Math.round(session.durationSec), targetSec: session.loop?.targetSec ?? 0 };
  });
}

// One row of the comparison table: its name and a value per round
export interface LoopRow {
  // The measure's name
  label: string;
  // Each round's value, as shown
  values: string[];
}

// The comparison table: pace, pause words, pauses, story checks where it is a story, and time against target
export function loopTable(numbers: ReadonlyArray<RoundNumbers>, options: { pauseWords?: boolean } = {}): LoopRow[] {
  // A number, or a dash
  const shown = (value: number | null) => (value === null ? "–" : String(value));
  // The rows
  return [
    // Overall pace
    { label: "pace a min", values: numbers.map((round) => String(round.pace)) },
    // Pause words, unless they are hidden (decision 79)
    ...(options.pauseWords === false ? [] : [{ label: "pause words a min", values: numbers.map((round) => String(round.pauseWords)) }]),
    // Pauses
    { label: "pauses a min", values: numbers.map((round) => shown(round.pauses)) },
    // Story checks, for a story
    ...(numbers.some((round) => round.storyChecks !== null) ? [{ label: "story checks", values: numbers.map((round) => shown(round.storyChecks)) }] : []),
    // Time against the round's target
    { label: "time / target", values: numbers.map((round) => `${formatClock(round.durationSec)} / ${formatClock(round.targetSec)}`) },
  ];
}

// The one line on what changed from the first round to the third: pace and pause words, each only when the move clears that measure's noise (decision 103), in neutral words
export function loopChangeLine(numbers: ReadonlyArray<RoundNumbers>, options: { pauseWords?: boolean } = {}): string {
  // The first and last rounds
  const [first, last] = [numbers[0], numbers.at(-1)];
  // Not whole
  if (!first || !last || first === last) return "Tell all three rounds to compare them.";
  // The pace change, when it clears the noise
  const pace = Math.abs(last.pace - first.pace) > fixedThreshold(PACE_NOISE, first.pace) ? `your pace went from ${first.pace} to ${last.pace} a minute` : null;
  // The pause-word change, when it clears the noise and pause words are shown
  const words = options.pauseWords !== false && Math.abs(last.pauseWords - first.pauseWords) > fixedThreshold(PAUSE_WORD_NOISE, first.pauseWords) ? `pause words from ${first.pauseWords} to ${last.pauseWords} a minute` : null;
  // The changes said
  const changes = [pace, words].filter((change): change is string => change !== null);
  // Nothing cleared the noise
  if (changes.length === 0) return options.pauseWords === false ? "From round 1 to round 3, your pace stayed about the same." : "From round 1 to round 3, your pace and pause words stayed about the same.";
  // The changes, joined
  return `From round 1 to round 3, ${changes.join(", and ")}.`;
}
