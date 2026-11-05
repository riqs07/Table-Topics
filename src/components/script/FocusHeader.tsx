// The thin header of focus mode (second pass: the Recording and Result references): a close cross, a thick progress bar, what this is and which step, and the keyboard hints on the right; no tabs, no rail

// Load Next.js's link component
import Link from "next/link";
// Load the cross
import { XIcon } from "@phosphor-icons/react/dist/ssr";
// Load the type for content passed in
import type { ReactNode } from "react";
// Load the shared press effect
import { PRESS } from "@/components/script/Buttons";
// Load the bar and label looks
import { PBAR, PBAR_FILL } from "@/components/script/textStyles";

// What the header shows
interface FocusHeaderProps {
  // The way out, or none while a take is under way
  close: { href: string; label: string } | null;
  // What this is, such as "Rapid Fire"
  title: string;
  // Where it sits, such as "step 1 of 3", or nothing
  place?: string | null;
  // How far through, from 0 to 1, or null for no bar
  progress?: number | null;
  // The keyboard hints and anything else on the right
  children?: ReactNode;
}

// Draw the header
export function FocusHeader({ close, title, place = null, progress = null, children }: FocusHeaderProps) {
  // One row that wraps on a phone
  return (
    <header className="flex min-h-11 flex-wrap items-center gap-x-4.5 gap-y-2 pb-1">
      {/* The way out (a blank of the same size while a take is under way, so the bar does not jump) */}
      {close ? (
        <Link href={close.href} aria-label={close.label} className={`inline-flex size-11 flex-none items-center justify-center rounded-xl text-ink-muted hover:bg-paper hover:text-ink ${PRESS}`}>
          {/* The cross */}
          <XIcon aria-hidden="true" weight="bold" className="size-6" />
        </Link>
      ) : (
        <span aria-hidden="true" className="size-11 flex-none" />
      )}
      {/* How far through */}
      {progress !== null && (
        <span role="img" aria-label={place ? `${title}, ${place}` : `${Math.round(progress * 100)}% through`} className={`${PBAR} min-w-30 max-w-[720px] flex-[1_1_240px]`}>
          {/* The filled part */}
          <span className={`${PBAR_FILL} transition-[width] duration-500`} style={{ width: `${Math.max(4, Math.min(100, progress * 100))}%` }} />
        </span>
      )}
      {/* What this is, and the step */}
      <p className="text-xs font-extrabold uppercase tracking-[.07em] text-accent-tint-ink max-md:order-last max-md:basis-full"><span data-focus-title>{title}</span>{place ? ` · ${place}` : ""}</p>
      {/* The hints, on the right */}
      {children && <span className="ml-auto flex items-center gap-2 text-sm font-bold text-ink-muted">{children}</span>}
    </header>
  );
}

// A key on the keyboard, drawn as a small key cap
export function Kbd({ children }: { children: ReactNode }) {
  // The cap
  return <kbd className="rounded-[7px] border-2 border-rule bg-card px-1.5 py-0.5 font-sans text-xs font-extrabold text-ink">{children}</kbd>;
}
