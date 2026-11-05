// The ways to practise as cards (second design pass, Desktop Screens "Practice"): the quick start as a wide band on the sky with a white Go button, a job as a picture card (its tile on its ground's tint over the name and a line), and one way as a row with its tile in a job's list

// Load Next.js's link component
import Link from "next/link";
// Load the chevron at the end of a row
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
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
// Load the carried-over wrapper and the transition that fades the pages
import { GLIDE, SharedScene } from "@/components/scenes/SharedScene";
// Load the card and pill looks
import { CARD, CHIP_GOOD } from "@/components/script/textStyles";

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
export function lookFor(way: Way): ModeTileLook {
  // Its kind's tile, or the default
  return way.scene ? SCENE_TILES[way.scene] : { ground: "sky", prop: "mic", face: "ready" };
}

// The quick start's Go, drawn like a white chunky button on the band
const GO = "min-h-12 items-center rounded-2xl bg-art-cream px-7 font-display text-button font-semibold tracking-[.03em] text-art-sky uppercase shadow-on-band md:min-h-13 md:px-8";

// The quick start across the top of Practice: the way's tile on the sky, a label, the name, a line, and a white Go (the whole band is the link; it glides its tile into the screen it opens, decision 141)
export function QuickStart({ way, label, title, line }: { way: Way; label: string; title: string; line: string }) {
  // Its tile
  const look = lookFor(way);
  // The tile, moving all the time, carried into the next screen
  const tile = <ModeTile ground={look.ground} prop={look.prop} face={look.face} tilt={4} motion="loop" scene={way.scene} className="size-22 md:size-34" />;
  // (carried over where it has a scene)
  const art = way.scene ? <SharedScene scene={way.scene}><span className="flex">{tile}</span></SharedScene> : tile;
  // The words
  const words = (
    <span className="flex min-w-0 flex-[1_1_12rem] flex-col gap-1 md:flex-[1_1_18rem] md:gap-1.5">
      {/* The name (first, so the link is named by it) */}
      <span className="font-display text-2xl leading-tight font-semibold md:text-3xl"><span className="md:hidden">{way.name}</span><span className="hidden md:inline">{title}</span></span>
      {/* The label above it */}
      <span className="order-first text-xs font-extrabold tracking-[.07em] whitespace-nowrap uppercase">{label}</span>
      {/* The line (on a computer) */}
      <span className="hidden font-bold md:block">{line}</span>
      {/* On a phone, the Go under the name */}
      {way.href && <span aria-hidden="true" className={`${GO} mt-2 inline-flex self-start md:hidden`}>Go</span>}
    </span>
  );
  // The band's look: the sky, light words, a darker lower edge
  const shape = "flex items-center gap-x-4 md:gap-x-6 gap-y-3 rounded-[22px] bg-art-sky p-4 pb-5 text-art-cream shadow-band md:px-7 md:py-5 md:pb-6";
  // A link once it can start, else a quiet band
  return way.href ? (
    <Link href={way.href} transitionTypes={way.scene ? GLIDE : undefined} data-way-card="big" className={`${shape} ${PRESS} motion-safe:animate-rise hover:-translate-y-0.5`}>
      {/* The picture and the words */}
      {art}{words}
      {/* On a computer, the Go at the end (the whole band is the link) */}
      <span aria-hidden="true" className={`${GO} ml-auto hidden md:inline-flex`}>Go</span>
    </Link>
  ) : (
    <div data-way-card="big" className={shape}>{art}{words}</div>
  );
}

// A picture card: a tile on its ground's tint over the name and a line (with more of it on a computer, on one line), such as one of Practice's four jobs or a course
export function PictureCard({ href, name, line, more, look, tilt = -4, chip, delay = 0 }: { href: string; name: string; line: string; more?: string; look: ModeTileLook; tilt?: number; chip?: string; delay?: number }) {
  // The card, one link
  return (
    <Link href={href} data-picture-card style={{ animationDelay: `${delay}ms` }} className={`flex h-full flex-col overflow-hidden ${CARD} ${PRESS} motion-safe:animate-rise hover:-translate-y-0.5`}>
      {/* The tile on its tint */}
      <span aria-hidden="true" className={`relative flex h-32 items-center justify-center md:h-38 ${GROUND_TINT[look.ground]}`}>
        {/* The tile, playing a few rounds then resting */}
        <ModeTile ground={look.ground} prop={look.prop} face={look.face} tilt={tilt} motion="few" className="size-26 md:size-32" />
      </span>
      {/* The words */}
      <span className="flex min-w-0 flex-col gap-1 p-3.5 pt-3 md:px-4 md:pt-3.5 md:pb-4">
        {/* The name (first, so the link is named by it) */}
        <span className="font-display text-lg leading-tight font-semibold md:text-xl">{name}</span>
        {/* A mark above the name, such as "Your focus" */}
        {chip && <span className={`${CHIP_GOOD} order-first self-start`}>{chip}</span>}
        {/* The line */}
        <span className="text-footnote leading-snug font-bold text-ink-muted md:truncate">{line}{more && <span className="hidden md:inline"> · {more}</span>}</span>
      </span>
    </Link>
  );
}

// One way as a row in a job's list: its tile (or icon), the name and the line, the whole row a link (quiet and not a link while it cannot start)
export function WayRow({ way }: { way: Way }) {
  // Its tile, when its kind has one
  const look = way.scene ? SCENE_TILES[way.scene] : null;
  // The words, shared by both forms
  const words = (
    <>
      {/* Its tile (still, apart from blinking; decision 136), or the icon on a tinted tile */}
      {look ? <ModeTile ground={look.ground} prop={look.prop} face={look.face} still scene={way.scene} className="size-14" /> : (
        <span aria-hidden="true" className={`flex size-12 flex-none items-center justify-center rounded-[14px] ${way.href ? "bg-warm-tint text-warm-ink" : "bg-paper text-ink-muted"}`}>
          {/* The icon */}
          <way.icon weight="bold" className="size-6" />
        </span>
      )}
      {/* Name and detail */}
      <span className="min-w-0 flex-1">
        {/* The name */}
        <span className="block font-display text-lg leading-tight font-semibold">{way.name}</span>
        {/* What it is */}
        <span className="block text-footnote font-bold text-ink-muted">{way.detail}</span>
      </span>
    </>
  );
  // A row that starts it, or a quiet row
  return way.href ? (
    <Link href={way.href} className={`flex min-h-18 items-center gap-4 py-3 hover:text-accent ${PRESS}`}>
      {/* Tile and words */}
      {words}
      {/* The chevron */}
      <CaretRightIcon aria-hidden="true" className="size-5 flex-none text-ink-muted" />
    </Link>
  ) : (
    <div className="flex min-h-18 items-center gap-4 py-3 text-ink-muted">{words}</div>
  );
}
