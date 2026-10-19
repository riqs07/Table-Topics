// Which warm-up routine and which voice drill come next (decision 80)

// Load the calendar-day helper
import { daysBetween } from "@/core/dates";
// Load the voice content
import { SHADOW_PASSAGES, VOICE_DRILLS, WARMUP_MOVES, type ShadowPassage, type VoiceDrill, type VoiceDrillKind, type WarmupMove } from "@/content/voice";

// The voice modes today's practice takes in turn, in the delivery group (pause drills keep their own turn there)
export const VOICE_ROTATION = ["warmup", "clear", "volume", "pitch", "tone", "shadow"] as const;

// One of them
export type VoicePick = (typeof VOICE_ROTATION)[number];

// Days since a fixed start, so routines change each day and stay the same all day
function dayNumber(day: Date): number {
  // Days since 1 January 2026 (negative before it, which the turns allow for)
  return daysBetween(new Date(2026, 0, 1), day);
}

// Take an item in turn, keeping the place positive
function inTurn<T>(list: ReadonlyArray<T>, place: number): T {
  // Wrap round
  return list[((place % list.length) + list.length) % list.length]!;
}

// A day's warm-up routine: one breath or body move, one face and mouth move, and one thing to say aloud, mixed differently each day ("another routine" moves the offset on)
export function warmupRoutine(day: Date, offset = 0): WarmupMove[] {
  // The day's place, moved on by any offset
  const place = dayNumber(day) + offset;
  // The three sets
  const [breath, mouth, say] = (["breath", "mouth", "say"] as const).map((set) => WARMUP_MOVES.filter((move) => move.set === set));
  // One from each, each set turning at its own pace so the mix changes
  return [inTurn(breath!, place), inTurn(mouth!, place * 2 + 1), inTurn(say!, place * 4 + 2)];
}

// The drill of a kind to do next: the one done least often, the first of those in order
export function nextVoiceDrill(kind: VoiceDrillKind, counts: ReadonlyMap<string, number>): VoiceDrill {
  // The drills of that kind
  const drills = VOICE_DRILLS.filter((drill) => drill.kind === kind);
  // The fewest times any was done
  const fewest = Math.min(...drills.map((drill) => counts.get(drill.id) ?? 0));
  // The first done that few times
  return drills.find((drill) => (counts.get(drill.id) ?? 0) === fewest) ?? drills[0]!;
}

// The passage to shadow next: the one done least often, the first of those in order
export function nextShadowPassage(counts: ReadonlyMap<string, number>): ShadowPassage {
  // The fewest times any was done
  const fewest = Math.min(...SHADOW_PASSAGES.map((passage) => counts.get(passage.id) ?? 0));
  // The first done that few times
  return SHADOW_PASSAGES.find((passage) => (counts.get(passage.id) ?? 0) === fewest) ?? SHADOW_PASSAGES[0]!;
}
