// The top of a list page inside a section (second design pass, extrapolated from Desktop Screens "CoursePath" and "Practice"): a "‹ back" link, then the page's tile on its ground's tint in a card with a ledge, beside the page's name, an optional mark above it and a line under it. Used by one job's ways, Stories, 4/3/2, Read aloud, a whole speech and Your talks

// Load Next.js's link component
import Link from "next/link";
// Load the back arrow
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
// Load the type for content passed in
import type { ReactNode } from "react";
// Load the mode tile and its tints
import { GROUND_TINT, ModeTile } from "@/components/scenes/ModeTile";
// Load the tile look type
import type { ModeTileLook } from "@/components/scenes/modeTileFor";
// Load the scene names
import type { SceneName } from "@/components/scenes/Scene";
// Load the carried-over wrapper (decision 141)
import { SharedScene } from "@/components/scenes/SharedScene";
// Load the link look
import { TEXT_LINK } from "@/components/script/Buttons";
// Load the pill look
import { CHIP_GOOD } from "@/components/script/textStyles";

// What the header shows
interface HubHeaderProps {
  // The way back: where and its words, such as "Practice"
  back: { href: string; label: string };
  // The tile's look
  look: ModeTileLook;
  // The kind's scene, when the tile glides in from the card that opened the page
  scene?: SceneName;
  // The page's name (the page's one h1)
  title: string;
  // The line under it
  line?: ReactNode;
  // A mark above the name, such as "Your focus"
  chip?: string;
  // Anything after the words, such as a count or a button (on the right on a computer, under on a phone)
  children?: ReactNode;
}

// The "‹ back" link at the top of a list page, pulled up beside the hidden masthead title on a computer
export function BackLink({ href, label }: { href: string; label: string }) {
  // One small green link with its arrow
  return <p className="mt-1 md:-mt-12"><Link href={href} className={`${TEXT_LINK} -ml-1 gap-1 text-footnote`}><CaretLeftIcon aria-hidden="true" weight="bold" className="size-4" />{label}</Link></p>;
}

// Draw the header
export function HubHeader({ back, look, scene, title, line, chip, children }: HubHeaderProps) {
  // The tile, moving a few rounds as the page opens
  const tile = <ModeTile ground={look.ground} prop={look.prop} face={look.face} tilt={-4} motion="few" scene={scene} className="size-16 md:size-24" />;
  // The back link, then the card
  return (
    <>
      {/* The way back */}
      <BackLink {...back} />
      {/* The tile on its tint, the words beside it, in a card with a ledge */}
      <div data-hub-header data-wide data-scene-panel={scene} className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[22px] border-2 border-rule p-4 shadow-card md:gap-x-5 md:p-5 ${GROUND_TINT[look.ground]}`}>
        {/* The tile, carried over from the card when it has a scene */}
        {scene ? <SharedScene scene={scene}><span className="flex flex-none">{tile}</span></SharedScene> : <span className="flex flex-none">{tile}</span>}
        {/* The words */}
        <div className="min-w-0 flex-[1_1_10rem]">
          {/* The mark above the name */}
          {chip && <span className={CHIP_GOOD}>{chip}</span>}
          {/* The page's name */}
          <h1 className="font-display text-statement leading-tight font-semibold motion-safe:animate-rise">{title}</h1>
          {/* The line */}
          {line && <p className="mt-0.5 font-bold text-ink">{line}</p>}
        </div>
        {/* Anything after */}
        {children}
      </div>
    </>
  );
}
