// A course card: an icon tile (or a picture, such as a course tile, decision 142), a name, a line on what it is, and a progress bar with "3/6" once started (before that, how many there are), the whole card opening its page (decisions 57 and 59)

// Load Next.js's link component
import Link from "next/link";
// Load the icon type and React's node type
import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
// Load the shared card look
import { CARD } from "./textStyles";
// Load the shared press effect
import { PRESS } from "./Buttons";

// What the card shows
interface CourseCardProps {
  // Where it leads
  href: string;
  // Its name
  name: string;
  // A line on what it is
  blurb: string;
  // Its icon
  icon: Icon;
  // A picture to show in place of the icon tile, such as a course tile (decision 142)
  art?: ReactNode;
  // How far through: done out of total
  done: number;
  // The total
  total: number;
  // A small note above the name, such as "Next up"
  note?: string;
  // What is inside, for before it is started, such as "6 cards" (nothing when left out)
  count?: string;
}

// Draw the card
export function CourseCard({ href, name, blurb, icon: IconShape, art, done, total, note, count, layout = "row" }: CourseCardProps & { layout?: "row" | "stacked" | "hero" }) {
  // How far through, from 0 to 1
  const share = total > 0 ? Math.min(1, done / total) : 0;
  // Whether it has been started (a single card has no progress to show)
  const started = done > 0 && total > 1;
  // The picture: the tile, or the icon on a warm tile
  const picture = art ? <span aria-hidden="true" className="flex flex-none">{art}</span> : (
    <span aria-hidden="true" className="flex size-14 flex-none items-center justify-center rounded-2xl bg-warm-tint text-warm-ink">
      {/* The icon */}
      <IconShape weight="bold" className="size-7" />
    </span>
  );
  // The card's shape: a row, a tile over the words, or the big "keep going" card
  const shape = layout === "stacked" ? "flex-col items-stretch p-0 overflow-hidden" : layout === "hero" ? "flex-wrap items-center gap-x-6 gap-y-4 p-5 md:p-6" : "items-center gap-4 p-4";
  // The whole card is one link
  return (
    <Link href={href} className={`flex h-full min-h-20 ${shape} ${CARD} ${PRESS} hover:-translate-y-0.5`}>
      {/* The picture: on a soft panel when stacked */}
      {layout === "stacked" ? <span aria-hidden="true" className="flex h-36 items-center justify-center bg-paper">{picture}</span> : picture}
      {/* Name, line and progress */}
      <span className={`min-w-0 flex-1 ${layout === "stacked" ? "p-4 pt-3.5" : ""} ${layout === "hero" ? "flex-[1_1_16rem]" : ""}`}>
        {/* A note, such as "Next up" */}
        {note && <span className="mb-1 inline-block rounded-full bg-accent-tint px-2.5 py-0.5 text-chip font-extrabold text-accent-tint-ink">{note}</span>}
        {/* The name, with the progress read out after it (the visible count and bar below are decorative), so the link's name is its visible text (WCAG 2.5.3) */}
        <span className={`block font-display leading-tight font-semibold ${layout === "hero" ? "text-3xl" : "text-xl"}`}>{name}<span className="sr-only">, {done} of {total}</span></span>
        {/* What it is */}
        <span className="mt-0.5 block text-footnote font-bold text-ink-muted">{blurb}</span>
        {/* Before starting: how many there are */}
        {!started && count && <span aria-hidden="true" className="mt-1 block text-footnote font-bold text-ink-muted">{count}</span>}
        {/* Once started: the bar and the count */}
        {started && <span aria-hidden="true" className="mt-2.5 flex items-center gap-3">
          {/* The chunky bar */}
          <span className="h-3 flex-1 overflow-hidden rounded-full bg-rule">
            {/* Its filled part, filling in from the left */}
            <span className="block h-full origin-left rounded-full bg-accent shadow-bar motion-safe:animate-fill" style={{ width: `${share * 100}%` }} />
          </span>
          {/* The count */}
          <span className="text-footnote font-extrabold tabular-nums text-ink-muted">{done}/{total}</span>
        </span>}
      </span>
      {/* The big card's button, drawn like the chunky button (the whole card is the link) */}
      {layout === "hero" && <span aria-hidden="true" className="inline-flex min-h-13 items-center rounded-2xl bg-fill px-7 font-display text-button font-semibold tracking-[.03em] text-fill-ink uppercase shadow-chunky">{started ? "Continue" : "Start"}</span>}
    </Link>
  );
}
