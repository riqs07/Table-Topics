// The next one to play, across the top of a role play's list page (UI rewrite, second pass; extrapolated from Practice's quick start, Desktop Screens "Practice"): the kind's tile on the sky, a small label, the name, a line, and a white chunky button that starts it. The tile carries over from the Practice card that opened the page (decision 141)

// Load Next.js's link component
import Link from "next/link";
// Load the type for content passed in
import type { ReactNode } from "react";
// Load the scene names
import type { SceneName } from "@/components/scenes/Scene";
// Load the mode tile
import { ModeTile } from "@/components/scenes/ModeTile";
// Load each kind's tile
import { SCENE_TILES } from "@/components/scenes/modeTileFor";
// Load the carried-over wrapper
import { SharedScene } from "@/components/scenes/SharedScene";
// Load the press effect
import { PRESS } from "@/components/script/Buttons";

// The button on the band: white and chunky on the sky, as Practice's Go
const GO = `inline-flex min-h-12 items-center justify-center rounded-2xl bg-art-cream px-7 font-display text-button font-semibold tracking-[.03em] text-art-sky uppercase shadow-on-band md:min-h-13 md:px-8 ${PRESS}`;

// What the band shows
interface NextUpBandProps {
  // The kind of practice, which picks the tile and names the carried-over scene
  scene: SceneName;
  // The small label above the name, such as "Next up · about 2 min"
  label: string;
  // The name, or null while it is still being picked
  name: ReactNode | null;
  // One line under the name
  line?: ReactNode;
  // Where the button goes, or null while it cannot start
  href: string | null;
  // The button's words (its name for screen readers too)
  go: string;
  // The band's name for screen readers
  ariaLabel: string;
}

// The band
export function NextUpBand({ scene, label, name, line, href, go, ariaLabel }: NextUpBandProps) {
  // The kind's tile
  const look = SCENE_TILES[scene];
  // The sky band, the tile, the words, the button
  return (
    <section aria-label={ariaLabel} data-scene-panel={scene} className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[22px] bg-art-sky p-4 pb-5 text-art-cream shadow-band md:flex-nowrap md:gap-x-6 md:px-7 md:py-5 md:pb-6">
      {/* The tile, carried over from the Practice card, moving all the time */}
      <SharedScene scene={scene}><span className="flex flex-none"><ModeTile ground={look.ground} prop={look.prop} face={look.face} tilt={4} motion="loop" scene={scene} className="size-22 md:size-30" /></span></SharedScene>
      {/* The words */}
      <div className="flex min-w-0 flex-[1_1_12rem] flex-col gap-1 md:gap-1.5">
        {/* The small label */}
        <p className="text-xs font-extrabold tracking-[.07em] uppercase">{label}</p>
        {/* The name, or a wait */}
        <p className="font-display text-2xl leading-tight font-semibold md:text-3xl">{name ?? "Getting ready…"}</p>
        {/* The line */}
        {line && <p className="font-bold">{line}</p>}
      </div>
      {/* Start it: under the words on a phone, at the end on a computer */}
      {href && <Link href={href} className={`${GO} max-md:w-full md:ml-auto`}>{go}</Link>}
    </section>
  );
}
