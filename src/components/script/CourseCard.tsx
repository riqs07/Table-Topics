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
export function CourseCard({ href, name, blurb, icon: IconShape, art, done, total, note, count }: CourseCardProps) {
  // Done as a share of the bar (empty when there is nothing to do)
  const share = total > 0 ? Math.min(1, done / total) : 0;
  // Show the bar only once something is done and there is more than one thing to do (a row of empty bars reads as a template)
  const started = done > 0 && total > 1;
  // The whole card is the link
  return (
    <Link href={href} aria-label={`${name}, ${done} of ${total}`} className={`flex h-full min-h-20 items-center gap-4 p-4 ${CARD} ${PRESS}`}>
      {/* The picture when there is one, otherwise the icon on a rounded warm tile */}
      {art ? <span aria-hidden="true" className="flex flex-none">{art}</span> : (
        <span aria-hidden="true" className="flex size-12 flex-none items-center justify-center rounded-[14px] bg-warm-tint text-warm-ink">
          {/* The icon */}
          <IconShape className="size-7" />
        </span>
      )}
      {/* Name, line and progress */}
      <span className="min-w-0 flex-1">
        {/* A note, such as "Next up" */}
        {note && <span className="block text-footnote font-semibold text-warm-ink">{note}</span>}
        {/* The name */}
        <span className="block font-display text-xl font-semibold leading-tight tracking-tight">{name}</span>
        {/* What it is */}
        <span className="block text-footnote text-ink-muted">{blurb}</span>
        {/* Before starting: how many there are */}
        {!started && count && <span aria-hidden="true" className="mt-1 block text-footnote text-ink-muted">{count}</span>}
        {/* Once started: the bar and the count */}
        {started && <span aria-hidden="true" className="mt-2 flex items-center gap-3">
          {/* The bar */}
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
            {/* Its filled part, filling in from the left */}
            <span className="block h-full origin-left rounded-full bg-accent motion-safe:animate-fill" style={{ width: `${share * 100}%` }} />
          </span>
          {/* The count */}
          <span className="text-footnote tabular-nums text-ink-muted">{done}/{total}</span>
        </span>}
      </span>
    </Link>
  );
}
