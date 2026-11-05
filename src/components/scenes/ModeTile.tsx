// Mode tiles (UI rewrite): a picture-book tile for a kind of practice, a section or a Today step. The same family as the course tiles, in the same lit frame (a tilted ground lit from the upper left, land, grain, the lit blob, one prop, a sparkle), but built from a ground, a prop and a face, so any card can have one without a new drawing

// Load the shaded body and the sparkle shared with the course tiles
import { Body, Twinkle } from "@/components/scenes/tiles/parts";
// Load the face names
import type { FaceName, SceneMotion, SceneName } from "@/components/scenes/Scene";
// Load React's node type and its tool for a unique id
import { useId, type ReactNode } from "react";
// Load the lit frame shared with the course tiles
import { TileFrame } from "@/components/scenes/art/TileFrame";

// The six tile grounds
export type TileGround = "sky" | "sun" | "bloom" | "leaf" | "plum" | "coral";

// The props a mode tile can hold, each telling one idea in a glance
export type TileProp = "bolt" | "fire" | "chat" | "waves" | "pause" | "target" | "cal" | "glass" | "ear" | "q" | "book" | "three" | "flag" | "loop" | "star" | "mic" | "door";

// Each ground's fill class
const GROUND_FILL: Record<TileGround, string> = {
  // Blue
  sky: "fill-art-sky",
  // Yellow
  sun: "fill-art-sun",
  // Pink
  bloom: "fill-art-bloom",
  // Green
  leaf: "fill-art-leaf",
  // Purple
  plum: "fill-art-plum",
  // Coral
  coral: "fill-art-coral",
};

// Each ground's soft tint behind a card's art, as a background class
export const GROUND_TINT: Record<TileGround, string> = {
  // Blue
  sky: "bg-art-sky/25",
  // Yellow
  sun: "bg-art-sun/30",
  // Pink
  bloom: "bg-art-bloom/25",
  // Green
  leaf: "bg-art-leaf/30",
  // Purple
  plum: "bg-art-plum/25",
  // Coral
  coral: "bg-art-coral/25",
};

// Each prop, drawn in the tile's upper right on the 200 square
const PROPS: Record<TileProp, ReactNode> = {
  // A lightning bolt: on the spot
  bolt: <path className="fill-art-sun stroke-art-cream" strokeWidth="5" strokeLinejoin="round" d="M150 46 L122 100 h22 l-10 46 34 -60 h-22 z" />,
  // A campfire: stories
  fire: <><path className="fill-art-sun" d="M150 58c14 18 24 30 24 46a24 24 0 0 1-48 0c0-12 8-20 12-28 4 10 8 12 12 12 0-10-4-20 0-30z" /><path className="stroke-art-cream" strokeWidth="7" strokeLinecap="round" d="M128 132h44" /></>,
  // A speech bubble: conversations
  chat: <><rect className="fill-art-cream" x="114" y="40" width="68" height="48" rx="16" /><path className="fill-art-cream" d="M130 86l-6 16 18-14z" /><circle className="fill-art-bloom" cx="134" cy="64" r="5" /><circle className="fill-art-bloom" cx="148" cy="64" r="5" /><circle className="fill-art-bloom" cx="162" cy="64" r="5" /></>,
  // Sound waves: your voice
  waves: <path className="stroke-art-cream" strokeWidth="8" fill="none" strokeLinecap="round" d="M132 70q14 24 0 48M148 58q22 36 0 72M164 46q30 48 0 96" />,
  // A pause sign: pausing
  pause: <><rect className="fill-art-cream" x="130" y="54" width="15" height="50" rx="6" /><rect className="fill-art-cream" x="153" y="54" width="15" height="50" rx="6" /></>,
  // A bullseye: point first
  target: <><circle className="fill-art-cream" cx="150" cy="70" r="30" /><circle className="fill-art-coral" cx="150" cy="70" r="19" /><circle className="fill-art-cream" cx="150" cy="70" r="8" /></>,
  // A calendar page: the weekly check-in
  cal: <><rect className="fill-art-cream" x="120" y="42" width="60" height="56" rx="10" /><rect className="fill-art-coral" x="120" y="42" width="60" height="16" rx="8" /><path className="stroke-art-coral" strokeWidth="6" strokeLinecap="round" d="M136 76h28M136 88h18" /></>,
  // A raised glass: toasts
  glass: <><path className="fill-art-cream" d="M136 46h32l-4 34a12 12 0 0 1-24 0z" /><rect className="fill-art-cream" x="149" y="92" width="6" height="26" /><rect className="fill-art-cream" x="138" y="116" width="28" height="6" rx="3" /><path className="fill-art-sun" d="M140 58h24l-2 20a10 10 0 0 1-20 0z" /></>,
  // An ear: listening
  ear: <path className="stroke-art-cream" strokeWidth="9" fill="none" strokeLinecap="round" d="M134 96c0-34 44-40 44-8 0 18-16 18-16 32 0 10-14 12-18 4" />,
  // A question mark: a surprise question
  q: <><circle className="fill-art-cream" cx="150" cy="68" r="30" /><path className="stroke-art-coral" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" d="M140 60a10 10 0 1 1 14 9c-3 2-4 4-4 8" /><circle className="fill-art-coral" cx="150" cy="88" r="4.5" /></>,
  // An open book: reading and quick reads
  book: <><path className="fill-art-cream" d="M118 60q16 -8 32 0q16 -8 32 0v52q-16 -8 -32 0q-16 -8 -32 0z" /><path className="stroke-art-plum" strokeWidth="4" d="M150 60v52" /></>,
  // Three dots: three points, a prepared speech
  three: <><circle className="fill-art-cream" cx="120" cy="70" r="12" /><circle className="fill-art-cream" cx="146" cy="70" r="12" /><circle className="fill-art-cream" cx="172" cy="70" r="12" /></>,
  // A flag: the end of a course, a goal
  flag: <><path className="stroke-art-cream" strokeWidth="6" strokeLinecap="round" d="M134 120V44" /><path className="fill-art-cream" d="M137 46h40l-9 14 9 14h-40z" /></>,
  // A loop arrow: try again, a random pick
  loop: <><path className="stroke-art-cream" strokeWidth="9" fill="none" strokeLinecap="round" d="M126 70a24 24 0 1 1 24 24" /><path className="fill-art-cream" d="M140 84l12 10-14 8z" /></>,
  // A star: progress, a win
  star: <path className="fill-art-sun stroke-art-cream" strokeWidth="5" strokeLinejoin="round" d="M150 40l10 22 24 3-18 16 5 24-21-12-21 12 5-24-18-16 24-3z" />,
  // A microphone: recording
  mic: <><rect className="fill-art-cream" x="138" y="40" width="26" height="50" rx="13" /><path className="stroke-art-cream" strokeWidth="6" fill="none" strokeLinecap="round" d="M128 76a23 23 0 0 0 46 0M151 99v16" /></>,
  // A door: a scene, a place to walk into
  door: <><rect className="fill-art-cream" x="128" y="40" width="46" height="74" rx="8" /><circle className="fill-art-plum" cx="164" cy="80" r="4" /></>,
};

// A mode tile, sized by the class given (it is square)
export function ModeTile({ ground, prop, face = "ready", tilt = -4, still = false, motion = "few", scene, className = "size-24" }: { ground: TileGround; prop: TileProp; face?: FaceName; tilt?: number; still?: boolean; motion?: SceneMotion; scene?: SceneName; className?: string }) {
  // An id for the clip and the light, unique on the page and safe inside url()
  const id = `mode-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  // The tile in its lit frame (the ground lit from the upper left, the land, the grain; art/TileFrame.tsx), hidden from screen readers; the prop and the blob stand upright on it
  return (
    <TileFrame
      id={id}
      fill={GROUND_FILL[ground]}
      tilt={tilt}
      motion={still ? "still" : motion}
      className={`flex-none ${className}`}
      data={{ "data-mode-tile": prop, "data-scene": scene }}
      upright={
        <>
          {/* The prop that tells the idea */}
          <g filter={`url(#${id}-drop)`}>{PROPS[prop]}</g>
          {/* The blob, lower left of middle */}
          <Body x={86} y={132} r={38} face={face} />
          {/* One sparkle in the empty corner */}
          <Twinkle x={42} y={46} size={10} />
        </>
      }
    >
      {/* Nothing leans with the ground but the land */}
      {() => null}
    </TileFrame>
  );
}
