// The end-of-day moment (storyboard "Day done"): your blob, big and laughing, with confetti around it that flies out once the first time the day shows done (decision 69); with reduced motion, or after the first showing, the confetti simply rests where it lands

// Load the cast, for your blob
import { Cast } from "@/components/scenes/Cast";
// Load the type for inline custom properties
import type { CSSProperties } from "react";

// The confetti's colours, in turn (the tile grounds)
const CONFETTI_COLOURS = ["bg-art-sun", "bg-art-leaf", "bg-art-bloom", "bg-art-plum", "bg-art-sky", "bg-art-coral"] as const;

// Where each piece rests, as an angle round the blob (degrees, 0 to the right) and a distance from its centre (pixels), spread unevenly so it reads as thrown
const PIECES: ReadonlyArray<{ angle: number; distance: number }> = [
  { angle: -150, distance: 112 },
  { angle: -105, distance: 118 },
  { angle: -40, distance: 120 },
  { angle: -10, distance: 104 },
  { angle: 25, distance: 118 },
  { angle: 150, distance: 104 },
  { angle: 200, distance: 120 },
  { angle: 60, distance: 96 },
];

// One piece's look: colour, size and where it flies to
interface Piece {
  // Its key
  id: number;
  // Its colour class
  colour: string;
  // Its look, with the flight offset as custom properties the animation reads
  style: CSSProperties;
}

// Work out every piece
const CONFETTI: Piece[] = PIECES.map(({ angle, distance }, index) => {
  // The angle in radians
  const turn = (angle * Math.PI) / 180;
  // Where it rests
  const [dx, dy] = [Math.round(Math.cos(turn) * distance), Math.round(Math.sin(turn) * distance)];
  // Long and short pieces in turn
  const [width, height] = index % 2 ? [10, 14] : [14, 9];
  // Put it together
  return {
    // Its key
    id: index,
    // Its colour
    colour: CONFETTI_COLOURS[index % CONFETTI_COLOURS.length] ?? "bg-art-sun",
    // Its look: centred on the blob, with its resting place and a little turn
    style: { width, height, marginTop: -height / 2, marginLeft: -width / 2, animationDelay: `${450 + (index % 4) * 50}ms`, "--dx": `${dx}px`, "--dy": `${dy}px`, "--turn": `${(index % 3) * 25 - 20}deg`, transform: `translate(${dx}px, ${dy}px) rotate(${(index % 3) * 25 - 20}deg)` } as CSSProperties,
  };
});

// Draw the moment; the confetti flies only on the first showing of the day
export function DoneBurst({ celebrate }: { celebrate: boolean }) {
  // A square stage the blob sits in, centred
  return (
    <div aria-hidden="true" className="relative mx-auto flex size-56 items-center justify-center md:size-64">
      {/* The confetti, resting round the blob (flying out the first time, when motion is welcome) */}
      {CONFETTI.map((piece) => <span key={piece.id} data-confetti className={`absolute top-1/2 left-1/2 rounded-[3px] ${piece.colour} ${celebrate ? "motion-safe:animate-confetti" : ""}`} style={piece.style} />)}
      {/* Your blob, laughing, popping in the first time */}
      <span data-done-face className={`relative flex ${celebrate ? "motion-safe:animate-pop" : ""}`} style={celebrate ? { animationDelay: "300ms" } : undefined}>
        {/* The blob itself */}
        <Cast who="you" face="happy" className="size-40 md:size-44" />
      </span>
    </div>
  );
}
