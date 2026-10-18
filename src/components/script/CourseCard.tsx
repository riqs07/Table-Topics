// A course card: an icon tile, a name, a line on what it is, and a progress bar with "3/6", the whole card opening its page (decision 57)

// Load Next.js's link component
import Link from "next/link";
// Load the icon type
import type { Icon } from "@phosphor-icons/react";

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
  // How far through: done out of total
  done: number;
  // The total
  total: number;
  // A small note above the name, such as "Next up"
  note?: string;
}

// Draw the card
export function CourseCard({ href, name, blurb, icon: IconShape, done, total, note }: CourseCardProps) {
  // Done as a share of the bar (empty when there is nothing to do)
  const share = total > 0 ? Math.min(1, done / total) : 0;
  // The whole card is the link
  return (
    <Link href={href} aria-label={`${name}, ${done} of ${total}`} className="flex min-h-20 items-center gap-4 border border-rule bg-paper p-4 hover:border-accent">
      {/* The icon on an accent tile */}
      <span aria-hidden="true" className="flex size-14 flex-none items-center justify-center bg-accent text-accent-ink">
        {/* The icon */}
        <IconShape className="size-8" />
      </span>
      {/* Name, line and progress */}
      <span className="min-w-0 flex-1">
        {/* A note, such as "Next up" */}
        {note && <span className="block text-footnote italic text-accent">{note}</span>}
        {/* The name */}
        <span className="block font-display text-cue leading-tight">{name}</span>
        {/* What it is */}
        <span className="block text-footnote text-ink-muted">{blurb}</span>
        {/* The bar and the count */}
        <span aria-hidden="true" className="mt-2 flex items-center gap-3">
          {/* The bar */}
          <span className="h-1.5 flex-1 bg-rule">
            {/* Its filled part */}
            <span className="block h-full bg-accent" style={{ width: `${share * 100}%` }} />
          </span>
          {/* The count */}
          <span className="text-footnote tabular-nums text-ink-muted">{done}/{total}</span>
        </span>
      </span>
    </Link>
  );
}
