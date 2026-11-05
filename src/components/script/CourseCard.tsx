// A course card (decisions 57 and 59; second design pass, Desktop Screens "Courses"): a row with an icon tile (Learn's sets, the units), a picture card with the course tile over the name and how many lessons ("For you"), or the wide "Keep going" card with the tile, the next lesson, a chunky bar with "1 of 6" and Continue; the whole card opens its page

// Load Next.js's link component
import Link from "next/link";
// Load the icon type and React's node type
import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
// Load the shared card, label and bar looks
import { CARD, LAB, PBAR, PBAR_FILL } from "./textStyles";
// Load the shared press effect
import { PRESS } from "./Buttons";

// What the card shows
interface CourseCardProps {
  // Where it leads
  href: string;
  // Its name
  name: string;
  // A line on what it is (the next lesson on the wide card)
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
  // What the count is of on the wide card's bar, such as "lessons"
  unit?: string;
  // The icon square's colours on a row, such as a Learn set's ground (the warm tint when left out)
  tone?: string;
}

// The chunky bar with its count, such as "1 of 6"
function Bar({ done, total, wide }: { done: number; total: number; wide: boolean }) {
  // How far through, from 0 to 1
  const share = total > 0 ? Math.min(1, done / total) : 0;
  // The bar and the count (decorative: the link's name says how far)
  return (
    <span aria-hidden="true" className={`flex items-center gap-3 ${wide ? "md:max-w-md" : ""}`}>
      {/* The bar */}
      <span className={`${wide ? PBAR : "block h-2.5 overflow-hidden rounded-full bg-rule"} flex-1`}>
        {/* Its filled part, filling in from the left */}
        <span className={`${PBAR_FILL} motion-safe:animate-fill`} style={{ width: `${Math.max(share * 100, done > 0 ? 6 : 0)}%` }} />
      </span>
      {/* The count */}
      <span className="text-footnote font-extrabold whitespace-nowrap tabular-nums text-ink-muted">{done} of {total}</span>
    </span>
  );
}

// Draw the card
export function CourseCard({ href, name, blurb, icon: IconShape, art, done, total, note, count, unit, tone = "bg-warm-tint text-warm-ink", layout = "row" }: CourseCardProps & { layout?: "row" | "stacked" | "hero" }) {
  // Whether it has been started (a single card has no progress to show)
  const started = done > 0 && total > 1;
  // The name, with the progress read out after it (the visible count and bar are decorative), so the link's name is its visible text (WCAG 2.5.3)
  const said = <span className="sr-only">, {done} of {total}{unit ? ` ${unit}` : ""}</span>;

  // The wide "Keep going" card: the tile, the label, name, next lesson and bar, then Continue (under the words, full width, on a phone)
  if (layout === "hero") return (
    <Link href={href} data-course-card="hero" className={`flex flex-wrap items-center gap-x-6 gap-y-4 p-4 md:flex-nowrap md:gap-x-7 md:px-7 md:py-6 ${CARD} ${PRESS} hover:-translate-y-0.5`}>
      {/* The label, on its own line on a phone */}
      {note && <span className={`${LAB} w-full md:hidden`}>{note}</span>}
      {/* The tile */}
      {art && <span aria-hidden="true" className="flex flex-none">{art}</span>}
      {/* The words */}
      <span className="flex min-w-0 flex-[1_1_10rem] flex-col gap-1.5 md:gap-2.5">
        {/* The name */}
        <span className="font-display text-2xl leading-tight font-semibold md:text-4xl">{name}{said}</span>
        {/* The label above it, on a computer */}
        {note && <span className={`${LAB} order-first hidden md:block`}>{note}</span>}
        {/* The next lesson */}
        <span className="font-bold text-ink-muted">{blurb}</span>
        {/* How far */}
        {total > 1 && <Bar done={done} total={total} wide />}
      </span>
      {/* The button, drawn like the chunky one (the whole card is the link) */}
      <span aria-hidden="true" className="inline-flex min-h-13 w-full flex-none items-center justify-center rounded-2xl bg-fill px-8 font-display text-button font-semibold tracking-[.03em] text-fill-ink uppercase shadow-chunky md:w-auto">{done > 0 ? "Continue" : "Start"}</span>
    </Link>
  );

  // A picture card: the tile on white, the name and how many (a thin bar once started)
  if (layout === "stacked") return (
    <Link href={href} data-course-card="stacked" className={`flex h-full flex-col items-start gap-1.5 p-3.5 pb-4 md:px-4 md:pt-3.5 md:pb-4.5 ${CARD} ${PRESS} hover:-translate-y-0.5`}>
      {/* The tile */}
      {art && <span aria-hidden="true" className="flex flex-none">{art}</span>}
      {/* A note, such as "For your focus" */}
      {note && <span className="mt-1 inline-block rounded-full bg-accent-tint px-2.5 py-0.5 text-chip font-extrabold text-accent-tint-ink">{note}</span>}
      {/* The name */}
      <span className="font-display text-lg leading-tight font-semibold md:text-xl">{name}{said}</span>
      {/* How many, or how far */}
      {started ? <span className="block w-full"><Bar done={done} total={total} wide={false} /></span> : count && <span aria-hidden="true" className="text-footnote font-bold text-ink-muted">{count}</span>}
    </Link>
  );

  // The row: the picture (the tile, or the icon on a warm tile), name, line and progress
  return (
    <Link href={href} className={`flex h-full min-h-20 items-center gap-4 p-4 ${CARD} ${PRESS} hover:-translate-y-0.5`}>
      {/* The picture */}
      {art ? <span aria-hidden="true" className="flex flex-none">{art}</span> : (
        <span aria-hidden="true" className={`flex size-14 flex-none items-center justify-center rounded-[16px] ${tone}`}>
          {/* The icon */}
          <IconShape weight="bold" className="size-7" />
        </span>
      )}
      {/* Name, line and progress */}
      <span className="min-w-0 flex-1">
        {/* A note, such as "Next up" */}
        {note && <span className="mb-1 inline-block rounded-full bg-accent-tint px-2.5 py-0.5 text-chip font-extrabold text-accent-tint-ink">{note}</span>}
        {/* The name */}
        <span className="block font-display text-xl leading-tight font-semibold">{name}{said}</span>
        {/* What it is */}
        <span className="mt-0.5 block text-footnote font-bold text-ink-muted">{blurb}</span>
        {/* Before starting: how many there are */}
        {!started && count && <span aria-hidden="true" className="mt-1 block text-footnote font-bold text-ink-muted">{count}</span>}
        {/* Once started: the bar and the count */}
        {started && <span className="mt-2.5 block"><Bar done={done} total={total} wide={false} /></span>}
      </span>
    </Link>
  );
}
