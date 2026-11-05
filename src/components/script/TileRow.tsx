// A card with a mode tile beside its words (UI rewrite): Today's "Also today", Practice's role plays and other short lists of places to go

// Load Next.js's link component
import Link from "next/link";
// Load the mode tile
import { ModeTile, type TileGround, type TileProp } from "@/components/scenes/ModeTile";
// Load the face names
import type { FaceName } from "@/components/scenes/Scene";
// Load the press effect
import { PRESS } from "@/components/script/Buttons";
// Load the card and label looks
import { CARD, LAB } from "@/components/script/textStyles";

// What the card shows
interface TileRowProps {
  // Where it leads
  href: string;
  // The small label above (left out when it would only repeat the title)
  label: string;
  // The name
  title: string;
  // One quieter line
  detail?: string;
  // The tile's ground
  ground: TileGround;
  // The tile's prop
  prop: TileProp;
  // The blob's face
  face?: FaceName;
  // Which way the tile leans
  tilt?: number;
  // The smaller card (Practice's role plays: a 72-pixel tile, the name a size down; on a phone the tile sits above the words, two cards across)
  small?: boolean;
}

// The card: the tile, then the label, name and detail
export function TileRow({ href, label, title, detail, ground, prop, face = "ready", tilt = -4, small = false }: TileRowProps) {
  // One link, the whole card
  return (
    <Link href={href} className={`flex h-full items-center ${small ? "flex-col items-start gap-2.5 p-3.5 md:flex-row md:items-center md:gap-3.5 md:py-3" : "gap-4 p-3.5 pr-4"} ${CARD} ${PRESS} hover:-translate-y-0.5`}>
      {/* The picture */}
      <ModeTile ground={ground} prop={prop} face={face} tilt={tilt} className={small ? "size-16 md:size-18" : "size-20"} />
      {/* The words */}
      <span className={`flex min-w-0 flex-col gap-0.5 ${small ? "" : "flex-1"}`}>
        {/* The name (first, so the link is named by it) */}
        <span className={`font-display leading-tight font-semibold ${small ? "text-lg" : "text-xl"}`}>{title}</span>
        {/* The label above it, unless it is the title */}
        {label !== title && <span className={`${LAB} order-first`}>{label}</span>}
        {/* The detail */}
        {detail && <span className="text-footnote font-bold text-ink-muted">{detail}</span>}
      </span>
    </Link>
  );
}
