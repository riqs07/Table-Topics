// The pieces every course tile is drawn from (decisions 142 and 145): the shaded blob, the sparkle, and what a tile is (its ground, its lean and its drawing). Each course's tiles live in their own file beside this one. The richer look (light, depth, grain) comes from art/light.tsx

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
  // The land behind the drawing (the Illustration Study's depth): rolling hills, a far one lighter and a near one deeper (the default), or none for a drawing with its own floor or sky
  land?: "hills" | "none";
}

// Where each open-eyed face's eyes sit, in the blob's 100 units, for the catchlights of the lit look (the faces with closed or arched eyes have none)
const EYES: Partial<Record<FaceName, { x: number; y: number }>> = {
  // Looking ahead
  ready: { x: -24, y: -36 },
  // Looking right
  side: { x: -14, y: -36 },
  // Looking left
  "side-left": { x: -32, y: -36 },
  // Round, surprised
  wow: { x: -24, y: -38 },
  // Open, a little deflated
  flat: { x: -24, y: -34 },
};

// Shown only inside a lit drawing (one that sets --vl-art-on; see art/light.tsx)
const ONLY_LIT = { opacity: "var(--vl-art-on, 0)" };

// The blob (or, with accent, a second person in the accent colour) with its shaded side and a highlight, at a place and size (r is its radius in the tile's 200 units), with one of the scene faces or, for a face drawn elsewhere (the talking blob in the videos), its own features in the blob's 100 units. Inside a lit drawing (a course tile, a mode tile, a course header) it also gets the Illustration Study's look: a body light from the upper left, a rim light at the lower right, cheeks, catchlights in its eyes and a soft contact shadow on the ground (shadow={false} for a blob in the air); look="flat" keeps it flat even there
export function Body({ x, y, r, face, accent = false, shadow = true, look = "auto", children }: { x: number; y: number; r: number; face?: FaceName; accent?: boolean; shadow?: boolean; look?: "auto" | "flat"; children?: ReactNode }) {
  // Whether the lit details may show (they still need a lit drawing around them)
  const lit = look === "auto";
  // Its eyes, for the catchlights
  const eyes = face ? EYES[face] : undefined;
  // Drawn in the blob's own units, then placed
  return (
    <g transform={`translate(${x} ${y}) scale(${r / 100})`}>
      {/* The contact shadow on the ground under it */}
      {lit && shadow && <ellipse className="fill-on-warm" style={ONLY_LIT} cx="0" cy="96" rx="94" ry="16" fillOpacity={0.2} />}
      {/* The shaded body: the warm blob's shade, or (for a second person, decision 145) the accent darkened */}
      {accent ? <><path className="fill-accent" d={BLOB} /><path className="fill-on-warm opacity-25" d={BLOB} /></> : <path className="fill-warm-shade" d={BLOB} />}
      {/* The lit body over it, nudged up and left, so the shade shows as a crescent at the lower right */}
      <path className={accent ? "fill-accent" : "fill-warm"} transform="translate(-9 -8) scale(0.93)" d={BLOB} />
      {/* The body light: a soft gradient from the upper left over the whole body (none outside a lit drawing) */}
      {lit && <path style={{ fill: accent ? "var(--vl-art-lit-accent, none)" : "var(--vl-art-lit, none)" }} d={BLOB} />}
      {/* The rim light: a thin bright edge at the lower right, where light from behind catches it */}
      {lit && <path className="stroke-art-cream" style={ONLY_LIT} fill="none" strokeWidth={5} strokeLinecap="round" strokeOpacity={0.4} d="M97 20C90 56 58 84 12 88" />}
      {/* A highlight at the upper left */}
      <ellipse className={`fill-art-cream ${accent ? "opacity-30" : "opacity-50"}`} cx="-50" cy="-54" rx="20" ry="12" transform="rotate(-35 -50 -54)" />
      {/* Cheeks, when it wears one of the scene faces */}
      {lit && !children && (
        <g className="fill-art-coral" style={ONLY_LIT}>
          {/* The left */}
          <ellipse cx="-46" cy="-8" rx="14" ry="8" fillOpacity={0.4} />
          {/* The right */}
          <ellipse cx="46" cy="-8" rx="14" ry="8" fillOpacity={0.4} />
        </g>
      )}
      {/* The face */}
      <g className={accent ? "text-accent-ink" : "text-on-warm"}>
        {/* Its features: the features given, or the scene face named */}
        {children ?? (face && <Face face={face} />)}
      </g>
      {/* A catchlight in each open eye, blinking with it */}
      {lit && eyes && (
        <g className="fill-art-cream" style={ONLY_LIT}>
          {/* The left */}
          <circle className="s-blink" cx={eyes.x + 4} cy={eyes.y - 5} r="3.6" />
          {/* The right */}
          <circle className="s-blink" cx={eyes.x + 52} cy={eyes.y - 5} r="3.6" />
        </g>
      )}
    </g>
  );
}

// A four-pointed sparkle that twinkles, at a place and size
export function Twinkle({ x, y, size = 10, delay = 0, className = "fill-art-cream" }: { x: number; y: number; size?: number; delay?: number; className?: string }) {
  // The star, centred on its place
  return <path className={`s-move t-twinkle ${className}`} style={{ animationDelay: `${delay}s` }} d={`M${x} ${y - size}l${size * 0.24} ${size * 0.76} ${size * 0.76} ${size * 0.24}-${size * 0.76} ${size * 0.24}-${size * 0.24} ${size * 0.76}-${size * 0.24}-${size * 0.76}-${size * 0.76}-${size * 0.24} ${size * 0.76}-${size * 0.24}z`} />;
}
