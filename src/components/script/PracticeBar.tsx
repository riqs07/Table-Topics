// The parts every practice screen shares in focus mode (the UI rewrite's second pass, Desktop Screens row "In use"): the bar across the top (a cross out, the progress bar and the step's label), the page around it, and the blob singing in rings while you speak

// Load Next.js's link component
import Link from "next/link";
// Load the cross
import { XIcon } from "@phosphor-icons/react/dist/ssr";
// Load the type for content passed in
import type { ReactNode } from "react";
// Load the shared press effect
import { PRESS } from "./Buttons";
// Load the progress bar looks
import { PBAR, PBAR_FILL } from "./textStyles";
// Load the cast
import { Cast } from "@/components/scenes/Cast";
// Load the face names
import type { FaceName } from "@/components/scenes/Scene";

// The page while practising: the cream page edge to edge, no navigation
export const PRACTICE_MAIN = "flex min-h-dvh flex-col bg-paper-raised px-4 pb-16 md:px-12";

// A practice page with one column, the bar across its top (the screens without a two-column reference)
export const PRACTICE_NARROW = "mx-auto flex min-h-dvh w-full max-w-3xl flex-col bg-paper-raised px-4 pb-16 md:px-8";

// The content under the bar: centred, as wide as the references' computer layout
export const PRACTICE_BODY = "mx-auto mt-4 w-full max-w-[1240px] md:mt-6";

// Two columns on a computer (the main one and a narrower side), one on a phone
export const PRACTICE_COLUMNS = "grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-10";

// The step's label, in the accent's ink, small and uppercase
export const STEP_LABEL = "text-xs font-extrabold uppercase tracking-[.07em] text-accent-tint-ink";

// What the bar takes
interface PracticeBarProps {
  // The way out: where the cross goes and what it says to screen readers (none mid-conversation, when ending saves instead)
  close?: { href: string; label: string } | null;
  // Something in the cross's place when there is no way out (a clock)
  lead?: ReactNode;
  // Instead of following the cross's link, do this (a take under way is discarded first, with its undo); the cross is then a button named by the close label
  onClose?: () => void;
  // How far through, from 0 to 1, or left out for no bar
  progress?: number;
  // The step's label, such as "Read aloud · step 2 of 3"
  label: string;
  // Keyboard hints on the right, on a computer
  hints?: ReactNode;
  // Extra classes (a page that already has its own top padding pulls the bar up)
  className?: string;
}

// The bar across the top while practising
export function PracticeBar({ close = null, lead, onClose, progress, label, hints, className = "" }: PracticeBarProps) {
  // The share filled, kept between 0 and 1
  const share = progress === undefined ? null : Math.max(0, Math.min(1, progress));
  // One row: the cross (or the lead), the bar, the label, then the hints
  return (
    <header data-practice-bar className={`flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 md:gap-x-5 md:pt-5 ${className}`.trim()}>
      {/* The way out, as a button when leaving does something first */}
      {close && onClose && (
        <button type="button" onClick={onClose} aria-label={close.label} className={`-ml-2 inline-flex size-11 flex-none items-center justify-center rounded-[14px] text-ink-muted hover:bg-paper hover:text-ink ${PRESS}`}>
          {/* The cross */}
          <XIcon aria-hidden="true" weight="bold" className="size-6" />
        </button>
      )}
      {/* The way out */}
      {close && !onClose && (
        <Link href={close.href} aria-label={close.label} className={`-ml-2 inline-flex size-11 flex-none items-center justify-center rounded-[14px] text-ink-muted hover:bg-paper hover:text-ink ${PRESS}`}>
          {/* The cross */}
          <XIcon aria-hidden="true" weight="bold" className="size-6" />
        </Link>
      )}
      {/* Or something in its place */}
      {!close && lead && <span className="inline-flex min-h-11 flex-none items-center">{lead}</span>}
      {/* The progress bar */}
      {share !== null && (
        <span role="progressbar" aria-label="Progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(share * 100)} className={`${PBAR} min-w-24 flex-1 md:max-w-[45rem]`}>
          {/* Its filled part */}
          <span className={`${PBAR_FILL} transition-[width] duration-500`} style={{ width: `${share * 100}%` }} />
        </span>
      )}
      {/* The step's label: under the bar on a phone, beside it on a computer */}
      <span className={`${STEP_LABEL} basis-full md:basis-auto ${share === null && !close && !lead ? "" : "md:pl-1"}`}>{label}</span>
      {/* The hints, on a computer */}
      {hints && <span className="ml-auto hidden items-center gap-2 text-sm font-bold text-ink-muted lg:flex">{hints}</span>}
    </header>
  );
}

// A key, drawn as a small key cap (for the hints)
export function Key({ children }: { children: ReactNode }) {
  // The cap
  return <kbd className="rounded-[7px] border-2 border-rule bg-card px-1.5 py-0.5 font-sans text-xs font-extrabold">{children}</kbd>;
}

// The level bars beside the blob while you speak: the latest readings, tallest when loudest (or a gentle rise and fall when there are none)
export function LevelBars({ levels, className = "" }: { levels?: ReadonlyArray<number>; className?: string }) {
  // The last eight readings, oldest first, padded with quiet
  const recent = levels ? [...Array.from({ length: 8 }, () => 0), ...levels].slice(-8) : null;
  // Eight bars, tall on the left and settling to the right as in the references, or by the voice
  return (
    <svg aria-hidden="true" viewBox="0 0 94 40" className={`vl-rings h-10 w-24 ${className}`}>
      {/* Each bar */}
      {Array.from({ length: 8 }, (_, index) => {
        // Its height: by the reading, or a fixed falling shape
        const height = recent ? 8 + Math.min(1, (recent[index] ?? 0) * 4) * 32 : 40 - index * 3.5;
        // The bar, standing on the bottom edge
        return <rect key={index} className={`fill-accent ${recent ? "" : "p-lvl"}`} style={recent ? undefined : { animationDelay: `${index * 0.12}s` }} x={index * 12} y={40 - height} width="8" height={height} rx="4" />;
      })}
    </svg>
  );
}

// You, singing in rings while you speak: the blob with two rings spreading out behind it
export function SingingBlob({ face = "sing", className = "size-40", ringClass = "stroke-warm" }: { face?: FaceName; className?: string; ringClass?: string }) {
  // The blob over its rings
  return (
    <span className={`vl-rings relative grid flex-none place-items-center ${className}`}>
      {/* The rings */}
      <svg aria-hidden="true" viewBox="0 0 200 200" className="absolute inset-[-12%] overflow-visible">
        {/* The first */}
        <circle className={`p-ring fill-none ${ringClass}`} strokeWidth="4" cx="100" cy="104" r="78" />
        {/* The second, a beat later */}
        <circle className={`p-ring fill-none ${ringClass}`} style={{ animationDelay: "1s" }} strokeWidth="4" cx="100" cy="104" r="78" />
        {/* A still ring, so there is a ring with reduced motion too */}
        <circle className={`fill-none opacity-40 ${ringClass}`} strokeWidth="4" cx="100" cy="104" r="78" />
      </svg>
      {/* The blob */}
      <Cast who="you" face={face} className="relative size-[78%]" />
    </span>
  );
}
