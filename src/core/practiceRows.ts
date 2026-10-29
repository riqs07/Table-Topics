// What the Practice page shows at once (decision 108): each group's few most relevant rows, the rest one tap away under "See all"; and the voice group's rows in the order they most need doing

// Load the voice content: the drills and shadowing passages, to count each mode
import { SHADOW_PASSAGES, VOICE_DRILLS } from "@/content/voice";
// Load the word lists and pause drills, counted with clear sounds and pausing
import { PAUSE_DRILLS, TRICKY_WORDS } from "@/content/prompts";
// Load the rule for which item comes next
import { nextToPractise } from "@/core/skillNext";
// Load the practice groups' ids
import type { PracticeGroupId } from "@/core/practiceFocus";

// How many rows a group shows at once, and one more for a group the user picked as their focus
export const ROWS_SHOWN = 3;

// A group's rows split into those shown and those under "See all" (a focus group shows one more)
export function splitRows<Row>(rows: ReadonlyArray<Row>, focus: boolean): { shown: Row[]; more: Row[] } {
  // How many to show
  const count = ROWS_SHOWN + (focus ? 1 : 0);
  // The first few, then the rest
  return { shown: rows.slice(0, count), more: rows.slice(count) };
}

// The voice modes on Practice, apart from the warm-up (clear sounds holds the tricky-word lists too)
export type VoiceRowId = "clear" | "volume" | "pitch" | "tone" | "pausing" | "shadowing";

// Each mode's ids, in its usual order on the page
const VOICE_ROW_IDS: Readonly<Record<VoiceRowId, ReadonlyArray<string>>> = {
  // Clear sounds: its drills, then the word lists
  clear: [...VOICE_DRILLS.filter((drill) => drill.kind === "clear").map((drill) => drill.id), ...TRICKY_WORDS.map((list) => list.id)],
  // Volume
  volume: VOICE_DRILLS.filter((drill) => drill.kind === "volume").map((drill) => drill.id),
  // Pitch and stress
  pitch: VOICE_DRILLS.filter((drill) => drill.kind === "pitch").map((drill) => drill.id),
  // Tone
  tone: VOICE_DRILLS.filter((drill) => drill.kind === "tone").map((drill) => drill.id),
  // Pausing: the pause drills
  pausing: PAUSE_DRILLS.map((drill) => drill.id),
  // Shadowing
  shadowing: SHADOW_PASSAGES.map((passage) => passage.id),
};

// The modes in their usual order
export const VOICE_ROWS: ReadonlyArray<VoiceRowId> = ["clear", "volume", "pitch", "tone", "pausing", "shadowing"];

// The voice modes, the one done least first (the usual order on a tie), so the rows shown are what is next
export function voiceRowsByNeed(counts: ReadonlyMap<string, number>): VoiceRowId[] {
  // How many times each mode was done
  const done = (id: VoiceRowId) => VOICE_ROW_IDS[id].reduce((sum, item) => sum + (counts.get(item) ?? 0), 0);
  // Sorted by that, keeping the usual order on a tie (the sort is stable)
  return [...VOICE_ROWS].sort((a, b) => done(a) - done(b));
}

// Clear sounds' next item, over its drills and the tricky-word lists together (one row and one fold since decision 108): its id and where it starts
export function nextClearSound(counts: ReadonlyMap<string, number>): { id: string; href: string } {
  // The next id (the list is never empty)
  const id = nextToPractise(VOICE_ROW_IDS.clear, counts) ?? VOICE_ROW_IDS.clear[0]!;
  // A word list is read aloud; a drill opens its own page
  return { id, href: TRICKY_WORDS.some((list) => list.id === id) ? `/session?mode=read&prompt=${id}` : `/voice/drill?id=${id}` };
}

// Which of the main ways stands for each practice group, for the big card at the top of Practice (decision 135)
export const FEATURED_BY_GROUP: Readonly<Record<PracticeGroupId, string>> = {
  // Thinking on my feet, speaking at work, a talk coming up
  "on-the-spot": "Rapid Fire",
  // Telling stories
  "stories": "Tell a story",
  // Small talk and conversations
  "conversation": "Talk with someone",
  // How I sound
  "voice": "Read aloud",
};

// The main ways split into the one shown big and the rest, in their usual order: the first focus group's way when there is one (marked as the focus), otherwise the first way
export function featureFirst<Row extends { name: string }>(rows: ReadonlyArray<Row>, groups: ReadonlyArray<PracticeGroupId>): { featured: Row; rest: Row[]; forFocus: boolean } | null {
  // Nothing to show
  if (rows.length === 0) return null;
  // The focus groups' ways that are on the list, first group first
  const picked = groups.map((group) => rows.find((row) => row.name === FEATURED_BY_GROUP[group])).find((row) => row !== undefined);
  // That one, or the first
  const featured = picked ?? rows[0]!;
  // It, the others, and whether it came from the focus
  return { featured, rest: rows.filter((row) => row !== featured), forFocus: picked !== undefined };
}
