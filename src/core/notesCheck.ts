// Your notes against the numbers: where your own judgement matched what was measured, where it did not, and what you missed

// Load the pause and fading measures
import { fadingEnds, findPauses } from "@/core/pauses";
// Load the rate formatter
import { formatRate } from "@/core/copy";
// Load the loudness reading interval
import { LOUDNESS_TICK_MS } from "@/core/recordingRules";
// Load the session record type
import type { FullSession } from "@/data/records";

// One comparison: whether the note matched, differed from, or missed what was measured
export interface NoteCheck {
  // Matched, differed, or a measured problem not noted
  kind: "matched" | "differed" | "missed";
  // The sentence to show
  text: string;
}

// Words a minute above which a talk sounds fast, and below which it sounds slow
export const FAST = 170;
// (slow)
export const SLOW = 110;
// Fillers a minute from which they are noticeable, and below which they are few
export const MANY_FILLERS = 3;
// (few)
const FEW_FILLERS = 1;
// Share of phrase endings that fade before trailing off counts
export const FADING = 0.4;
// Fewest phrase endings to judge fading
export const MIN_ENDINGS = 3;

// The comfortable pace, said the same way everywhere
const COMFORTABLE = "a comfortable pace is about 120 to 160";

// Compare a session's tags with its numbers
export function compareNotes(session: FullSession): NoteCheck[] {
  // The tags the user chose (none if they skipped or there are no notes)
  const tags = new Set(session.selfReview && !session.selfReview.skipped ? session.selfReview.tags : []);
  // No notes, nothing to compare
  if (!session.selfReview || session.selfReview.skipped) return [];
  // The checks found
  const checks: NoteCheck[] = [];
  // Speed, whole
  const speed = Math.round(session.wordsPerMinute);
  // Fillers, as shown
  const fillers = formatRate(session.fillersPerMinute);
  // Pauses and fading, when loudness was recorded
  const levels = session.loudness && session.loudness.length > 0 ? session.loudness : null;
  // The pauses
  const pauses = levels ? findPauses(levels, LOUDNESS_TICK_MS) : null;
  // The phrase endings
  const endings = levels ? fadingEnds(levels, LOUDNESS_TICK_MS) : null;
  // Whether most endings faded
  const trailing = endings !== null && endings.stretches >= MIN_ENDINGS && endings.faded / endings.stretches >= FADING;

  // Too fast
  if (tags.has("too-fast")) checks.push(speed > FAST ? { kind: "matched", text: `You said too fast, and it was: ${speed} words a minute (${COMFORTABLE}).` } : { kind: "differed", text: `You said too fast, but it measured ${speed} words a minute (${COMFORTABLE}). Speed often feels faster from the inside.` });
  // Too slow
  if (tags.has("too-slow")) checks.push(speed < SLOW ? { kind: "matched", text: `You said too slow, and it was: ${speed} words a minute (${COMFORTABLE}).` } : { kind: "differed", text: `You said too slow, but it measured ${speed} words a minute (${COMFORTABLE}).` });
  // Good pace
  if (tags.has("good-pace")) checks.push(speed >= SLOW && speed <= FAST ? { kind: "matched", text: `You said good pace, and it was: ${speed} words a minute.` } : { kind: "differed", text: `You said good pace, but it measured ${speed} words a minute (${COMFORTABLE}).` });
  // A fast pace not noted
  if (!tags.has("too-fast") && !tags.has("good-pace") && speed > FAST) checks.push({ kind: "missed", text: `You did not mention pace: it measured ${speed} words a minute, on the fast side.` });

  // Fillers
  if (tags.has("fillers")) checks.push(session.fillersPerMinute >= FEW_FILLERS ? { kind: "matched", text: `You said pause words, and there were: ${fillers} a minute.` } : { kind: "differed", text: `You said pause words, but only ${fillers} a minute were counted.` });
  // Many fillers not noted
  else if (session.fillersPerMinute >= MANY_FILLERS) checks.push({ kind: "missed", text: `You did not mention pause words: ${fillers} a minute were counted.` });

  // Pauses, when they could be measured
  if (pauses) {
    // Not enough pauses
    if (tags.has("no-pauses")) checks.push(pauses.count <= 1 ? { kind: "matched", text: `You said not enough pauses, and there ${pauses.count === 1 ? "was only one" : "were none"} longer than 0.6 seconds.` } : { kind: "differed", text: `You said not enough pauses, but there were ${pauses.count} longer than 0.6 seconds.` });
    // Good pauses
    if (tags.has("good-pauses")) checks.push(pauses.count >= 2 ? { kind: "matched", text: `You said good pauses, and there were ${pauses.count}.` } : { kind: "differed", text: `You said good pauses, but there ${pauses.count === 1 ? "was only one" : "were none"} longer than 0.6 seconds.` });
  }

  // Trailing off, when it could be measured
  if (endings && endings.stretches >= MIN_ENDINGS) {
    // Noted
    if (tags.has("trailed-off")) checks.push(trailing ? { kind: "matched", text: `You said you trailed off, and ${endings.faded} of ${endings.stretches} phrases faded at the end.` } : { kind: "differed", text: `You said you trailed off, but only ${endings.faded} of ${endings.stretches} phrases faded at the end.` });
    // Not noted
    else if (trailing) checks.push({ kind: "missed", text: `You did not mention trailing off: ${endings.faded} of ${endings.stretches} phrases faded at the end.` });
  }
  // Hand them back
  return checks;
}
