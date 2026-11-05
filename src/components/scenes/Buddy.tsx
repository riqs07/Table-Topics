// The blob (you) or Sage on their own, for headers, speech bubbles and the side rail: a thin wrapper over the cast (Cast.tsx), kept so the first pass's call sites read the same

// Load the cast
import { Cast, type SageMood } from "@/components/scenes/Cast";
// Load the face names
import type { FaceName } from "@/components/scenes/Scene";

// Who is drawn: you (the warm blob) or Sage (the coach)
export type BuddyWho = "you" | "sage";

// The blob's faces, read as Sage's nearest mood
const SAGE_FOR: Partial<Record<FaceName, SageMood>> = { happy: "proud", wow: "encouraging", up: "encouraging", wonder: "curious", side: "curious", puff: "breathe", flat: "thinking", sing: "encouraging" };

// One character, sized by the class given; it breathes gently unless still
export function Buddy({ who = "you", face = "ready", mood, still = false, className = "size-16" }: { who?: BuddyWho; face?: FaceName; mood?: SageMood; still?: boolean; className?: string }) {
  // Drawn by the cast
  return <Cast who={who} face={face} mood={mood ?? SAGE_FOR[face] ?? "calm"} still={still} className={className} />;
}
