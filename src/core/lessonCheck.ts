// What each skill-path lesson checks afterwards, as plain sentences

// Load the lesson type
import type { Lesson } from "@/content/lessons";
// Load the filler marker
import { markFillers } from "@/core/fillers";
// Load the pause and loudness measures
import { fadingEnds, findPauses, leadingSilenceSeconds, pauseDrillSentence } from "@/core/pauses";
// Load the reading check and the pause-mark counter
import { alignReading, countPauseMarks } from "@/core/readAlong";
// Load the loudness reading interval
import { LOUDNESS_TICK_MS } from "@/core/recordingRules";
// Load the session record type
import type { SessionRecord } from "@/data/records";

// The pace to stay under when reading numbers and names, in words a minute
const SLOW_PACE = 140;
// Seconds of silence that count as a proper opening pause
const OPENING_PAUSE = 1;
// How long the speaker waited before the first word, as a sentence (shared with the openings drill)
export function openingPauseSentence(loudness: ReadonlyArray<number>): string {
  // Seconds before the first word
  const seconds = leadingSilenceSeconds(loudness, LOUDNESS_TICK_MS);
  // Enough, or not
  return seconds >= OPENING_PAUSE ? `You waited ${seconds.toFixed(1)} seconds before your first word. Good.` : `You started after ${seconds.toFixed(1)} seconds. Try waiting a full breath.`;
}

// How many of the last words count as the closing
export const CLOSING_WORDS = 20;
// Seconds of silence that count as stopping on purpose in the blank-recovery lesson
const RECOVERY_PAUSE = 2;

// A lesson's result: a headline for its own skill and a detail line on the reading
export interface LessonResult {
  // One sentence about the lesson's skill
  headline: string;
  // How much of the text was read
  detail: string;
}

// Remove the stress marks from a lesson text before comparing it with what was heard
function plainText(body: string): string {
  // Drop the asterisks around stressed words and any [bracketed instruction]
  return body.replace(/\*/g, "").replace(/\[[^\]]*\]/g, " ");
}

// The sentence for the lesson's own skill
function skillSentence(lesson: Lesson, session: SessionRecord, percentRead: number): string {
  // Loudness readings, if recorded
  const loudness = session.loudness ?? [];
  // Checks that need loudness say so plainly when it is missing
  const noLoudness = "Loudness was not recorded, so this could not be measured.";
  // One sentence per kind of check
  switch (lesson.check) {
    // The silence before the first word
    case "opening-pause": {
      // Needs loudness
      if (!loudness.length) return noLoudness;
      // How long the pause before the first word was
      return openingPauseSentence(loudness);
    }
    // Words heard clearly
    case "clear-words":
      // The share of the text heard
      return `You read ${percentRead}% of the words clearly.`;
    // Pace under the target
    case "slow-pace": {
      // Whole words a minute
      const pace = Math.round(session.wordsPerMinute);
      // Unhurried, or too fast
      return pace <= SLOW_PACE ? `${pace} words a minute: unhurried, as it should be.` : `${pace} words a minute. Aim for under ${SLOW_PACE} on numbers and names.`;
    }
    // Pauses against the marks
    case "marked-pauses":
      // Needs loudness
      return loudness.length ? pauseDrillSentence(findPauses(loudness, LOUDNESS_TICK_MS).count, countPauseMarks(lesson.body)) : noLoudness;
    // Endings that faded
    case "ending": {
      // Needs loudness
      if (!loudness.length) return noLoudness;
      // Count them
      const { stretches, faded } = fadingEnds(loudness, LOUDNESS_TICK_MS);
      // None, or how many
      return faded === 0 ? "None of your sentences faded at the end." : `${faded} of ${stretches} stretches faded at the end.`;
    }
    // Fillers in the closing words
    case "clean-close": {
      // The last words, with fillers marked
      const closing = markFillers(session.transcript.split(/\s+/).slice(-CLOSING_WORDS).join(" ")).filter((piece) => piece.filler).map((piece) => piece.text.toLowerCase());
      // Clean, or which fillers
      return closing.length === 0 ? "No pause words in your closing." : `Pause words crept into your closing: ${closing.join(", ")}.`;
    }
    // Recovering from a blank: a deliberate stop, then carrying on
    case "recovery": {
      // Needs loudness
      if (!loudness.length) return noLoudness;
      // The longest pause between words (every counted pause has speech after it)
      const longest = findPauses(loudness, LOUDNESS_TICK_MS).longestSeconds;
      // A real stop and a restart, or not yet
      return longest >= RECOVERY_PAUSE ? `You stopped for ${longest.toFixed(1)} seconds and carried on. That is the recovery.` : `Your longest pause was ${longest.toFixed(1)} seconds. Stop for a full three seconds where the text says, then carry on.`;
    }
    // Judgement lessons wait for the coach
    case "coach":
      // Plain note
      return "Your coach comments on this one once feedback is set up.";
  }
}

// The result of a lesson session
export function lessonResult(lesson: Lesson, session: SessionRecord): LessonResult {
  // How much of the text was heard
  const { percentRead } = alignReading(plainText(lesson.body), session.transcript);
  // The headline for the skill, and the reading detail
  return { headline: skillSentence(lesson, session, percentRead), detail: `You read ${percentRead}% of the words.` };
}
