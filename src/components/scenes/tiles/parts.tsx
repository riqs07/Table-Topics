// The pieces every course tile is drawn from (decisions 142 and 145): the shaded blob, the sparkle, and what a tile is (its ground, its lean and its drawing). Each course's tiles live in their own file beside this one

// Load React's node type
import type { ReactNode } from "react";
// Load the blob's outline and its faces from the scenes
import { BLOB, Face, type FaceName } from "@/components/scenes/Scene";

// One tile: its ground colour (an art role's fill class), how far it leans (3° to 5°, left or right), and its drawing on the 200 square, given the id of the clip that keeps background shapes inside the tile
export interface TileDef {
  // The ground's fill class
  fill: string;
  // The lean in degrees
  tilt: number;
  // The drawing
  draw: (clip: string) => ReactNode;
}

// The blob (or, with accent, a second person in the accent colour) with its shaded side and a highlight, at a place and size (r is its radius in the tile's 200 units), with one of the scene faces or, for a face drawn elsewhere (the talking blob in the videos), its own features in the blob's 100 units
export function Body({ x, y, r, face, accent = false, children }: { x: number; y: number; r: number; face?: FaceName; accent?: boolean; children?: ReactNode }) {
  // Drawn in the blob's own units, then placed
  return (
    <g transform={`translate(${x} ${y}) scale(${r / 100})`}>
      {/* The shaded body: the warm blob's shade, or (for a second person, decision 145) the accent darkened */}
      {accent ? <><path className="fill-accent" d={BLOB} /><path className="fill-on-warm opacity-25" d={BLOB} /></> : <path className="fill-warm-shade" d={BLOB} />}
      {/* The lit body over it, nudged up and left, so the shade shows as a crescent at the lower right */}
      <path className={accent ? "fill-accent" : "fill-warm"} transform="translate(-9 -8) scale(0.93)" d={BLOB} />
      {/* A highlight at the upper left */}
      <ellipse className={`fill-art-cream ${accent ? "opacity-30" : "opacity-50"}`} cx="-50" cy="-54" rx="20" ry="12" transform="rotate(-35 -50 -54)" />
      {/* The face */}
      <g className={accent ? "text-accent-ink" : "text-on-warm"}>
        {/* Its features: the features given, or the scene face named */}
        {children ?? (face && <Face face={face} />)}
      </g>
    </g>
  );
}

// A four-pointed sparkle that twinkles, at a place and size
export function Twinkle({ x, y, size = 10, delay = 0, className = "fill-art-cream" }: { x: number; y: number; size?: number; delay?: number; className?: string }) {
  // The star, centred on its place
  return <path className={`s-move t-twinkle ${className}`} style={{ animationDelay: `${delay}s` }} d={`M${x} ${y - size}l${size * 0.24} ${size * 0.76} ${size * 0.76} ${size * 0.24}-${size * 0.76} ${size * 0.24}-${size * 0.24} ${size * 0.76}-${size * 0.24}-${size * 0.76}-${size * 0.76}-${size * 0.24} ${size * 0.76}-${size * 0.24}z`} />;
}
