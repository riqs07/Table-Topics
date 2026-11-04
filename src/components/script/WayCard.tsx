// A card for one way to practise (UI rewrite): a picture-book tile on its ground's tint over the name and what it is; the big one, across the top of Practice, lays them side by side with a Go button

// Load Next.js's link component
import Link from "next/link";
// Load the icon type
import type { Icon } from "@phosphor-icons/react";
// Load the scene names (each kind of practice has one)
import type { SceneName } from "@/components/scenes/Scene";
// Load the mode tile and its tints
import { GROUND_TINT, ModeTile } from "@/components/scenes/ModeTile";
// Load each kind's tile
import { SCENE_TILES, type ModeTileLook } from "@/components/scenes/modeTileFor";
// Load the press effect
import { PRESS } from "@/components/script/Buttons";
// Load the card and pill looks
import { CARD, CHIP_GOOD, LAB } from "@/components/script/textStyles";

// One way to practise
export interface Way {
  // Its name
  name: string;
  // What it is, in a line
  detail: string;
  // Where it starts, or nothing while it cannot yet
  href: string | null;
  // Its icon, for rows without a tile
  icon: Icon;
  // Its kind's scene, which picks its tile
  scene?: SceneName;
}

// The tile for a way: its kind's, or a microphone on sky
function lookFor(way: Way): ModeTileLook {
  // Its kind's tile, or the default
  return way.scene ? SCENE_TILES[way.scene] : { ground: "sky", prop: "mic", face: "ready" };
}

// The card (shared is kept for the callers that asked for the scene to glide; the tiles do not glide)
export function WayCard({ way, big = false, forFocus = false, delay = 0 }: { way: Way; big?: boolean; forFocus?: boolean; delay?: number; shared?: boolean }) {
  // Its tile
  const look = lookFor(way);
  // The picture: on its tint over the words, or (big) beside them
  const art = big ? (
    <ModeTile ground={look.ground} prop={look.prop} face={look.face} tilt={4} motion="loop" scene={way.scene} className="size-28 md:size-34" />
  ) : (
    <span aria-hidden="true" className={`flex h-32 items-center justify-center md:h-36 ${GROUND_TINT[look.ground]}`}>
      {/* The tile */}
      <ModeTile ground={look.ground} prop={look.prop} face={look.face} tilt={delay % 140 ? 4 : -4} scene={way.scene} className="size-26 md:size-30" />
    </span>
  );
  // The words
  const words = (
    <span className={`flex min-w-0 flex-col gap-1 ${big ? "flex-[1_1_14rem]" : "p-3.5 pt-3 md:p-4"}`}>
      {/* The name (first, so the link is named by it) */}
      <span className={`font-display leading-tight font-semibold ${big ? "text-3xl md:text-4xl" : "text-xl"}`}>{way.name}</span>
      {/* The focus mark, or what the big one is, drawn above the name */}
      {forFocus ? <span className={`${CHIP_GOOD} order-first self-start`}>Your focus</span> : big && way.scene === "rapid-fire" && <span className={`${LAB} order-first`}>Quick start · 1–2 min</span>}
      {/* What it is */}
      <span className={`leading-snug font-bold text-ink-muted ${big ? "text-lg" : "text-footnote"}`}>{way.detail}</span>
    </span>
  );
  // The big one's look: its ground's tint, a Go button on the right; the others: a card with the picture on top
  const shape = big ? `flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[22px] border-2 border-rule p-4 pr-5 shadow-card md:p-5 md:pr-7 ${GROUND_TINT[look.ground]}` : `flex h-full flex-col overflow-hidden ${CARD}`;
  // Arriving one after another
  const arrive = { animationDelay: `${delay}ms` };
  // A link when it can start, else a quiet card
  return way.href ? (
    <Link href={way.href} data-way-card={big ? "big" : "small"} style={arrive} className={`${shape} ${PRESS} motion-safe:animate-rise hover:-translate-y-0.5`}>
      {/* The picture and the words */}
      {art}{words}
      {/* The big one's Go, drawn like the chunky button (the whole card is the link) */}
      {big && <span aria-hidden="true" className="ml-auto inline-flex min-h-13 items-center rounded-2xl bg-fill px-8 font-display text-button font-semibold tracking-[.03em] text-fill-ink uppercase shadow-chunky">Go</span>}
    </Link>
  ) : (
    <div data-way-card={big ? "big" : "small"} style={arrive} className={`${shape} text-ink-muted motion-safe:animate-rise`}>{art}{words}</div>
  );
}
