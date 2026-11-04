// The cast on their own (UI rewrite): the shaded blob (you) or Sage (the coach, in the accent green), as a standalone drawing for headers, speech bubbles and the side rail

// Load the class joiner-free pieces: the shaded body and the face names
import { Body } from "@/components/scenes/tiles/parts";
// Load the face names
import type { FaceName } from "@/components/scenes/Scene";

// Who is drawn: you (the warm blob) or Sage (the coach)
export type BuddyWho = "you" | "sage";

// One character, sized by the class given; it bobs gently unless still
export function Buddy({ who = "you", face = "ready", still = false, className = "size-16" }: { who?: BuddyWho; face?: FaceName; still?: boolean; className?: string }) {
  // The drawing, hidden from screen readers (the words beside it carry the meaning)
  return (
    <svg aria-hidden="true" data-buddy={who} data-motion={still ? "still" : "loop"} viewBox="-115 -115 230 230" className={`vl-scene flex-none overflow-visible ${className}`}>
      {/* Sage is settled: a little wider and lower than the blob (see documents/design/characters/sage.md) */}
      <g className={still ? "" : "s-move b-bob"} transform={who === "sage" ? "translate(0 4) scale(1.04 0.98)" : undefined}>
        {/* The shaded body with its face */}
        <Body x={0} y={0} r={100} face={face} accent={who === "sage"} />
      </g>
    </svg>
  );
}
