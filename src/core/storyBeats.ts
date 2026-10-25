// A story's beats as the coach heard them, for its results (decision 126): how many came through, a headline for the telling (against the one before, on a retelling), and the row that compares two tellings. Pure

// Load the record types
import type { SessionRecord, TemplateBeatNote } from "@/data/records";

// How a telling's beats came across
export interface BeatCounts {
  // Came through clearly
  strong: number;
  // There, but thin
  weak: number;
  // Not there
  missing: number;
  // All the template's beats
  total: number;
}

// The coach's beats for a telling, or null when it has none yet (or was reviewed before templates)
export function templateBeatsOf(session: Pick<SessionRecord, "feedback">): TemplateBeatNote[] | null {
  // The beats, when there are any
  const beats = session.feedback?.story?.templateBeats;
  // Only a non-empty list
  return beats && beats.length > 0 ? beats : null;
}

// The counts for some beats
export function beatCounts(beats: ReadonlyArray<TemplateBeatNote>): BeatCounts {
  // How many of a status
  const count = (status: TemplateBeatNote["status"]) => beats.filter((beat) => beat.status === status).length;
  // All four
  return { strong: count("strong"), weak: count("weak"), missing: count("missing"), total: beats.length };
}

// One number for a telling: a strong beat counts one, a weak one half
function beatScore(counts: BeatCounts): number {
  // Strong plus half the weak
  return counts.strong + counts.weak / 2;
}

// The headline for a telling: against the telling before when both have beats, otherwise how many came through
export function storyHeadline(session: Pick<SessionRecord, "feedback">, original: Pick<SessionRecord, "feedback"> | null): string {
  // This telling's beats
  const beats = templateBeatsOf(session);
  // None yet: a plain name
  if (!beats) return original ? "Told again." : "Your story.";
  // Its counts
  const now = beatCounts(beats);
  // The telling before's beats
  const before = original ? templateBeatsOf(original) : null;
  // A retelling with both: better, the same or not this time
  if (before) {
    // Both scores
    const [was, is] = [beatScore(beatCounts(before)), beatScore(now)];
    // The line
    return is > was ? "It landed better than last time." : is === was ? "About the same as last time." : "Not quite as clear as last time.";
  }
  // Every beat clear
  if (now.strong === now.total) return "Every beat came through.";
  // How many
  return `${now.strong} of ${now.total} beats came through clearly.`;
}

// The row comparing two tellings' beats, or null unless both have them
export function beatsCompareRow(before: Pick<SessionRecord, "feedback">, after: Pick<SessionRecord, "feedback">): { label: string; before: string; after: string } | null {
  // Both tellings' beats
  const [was, is] = [templateBeatsOf(before), templateBeatsOf(after)];
  // Not both
  if (!was || !is) return null;
  // How many came through clearly, each against its template
  const words = (beats: ReadonlyArray<TemplateBeatNote>) => `${beatCounts(beats).strong} of ${beats.length}`;
  // The row
  return { label: "beats clear", before: words(was), after: words(is) };
}
