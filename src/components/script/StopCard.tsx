// A practice that stopped short (UI rewrite, second pass; built from the result's verdict card, since the references draw no such state): nothing was saved, saving failed, or what the address names is not here. One card with the cast member it happened with, a small label, the page's heading, a line on what to do, and the ways on

// Load the type for content passed in
import type { ReactNode } from "react";
// Load the cast
import { Cast, type CastWho } from "@/components/scenes/Cast";
// Load the face names
import type { FaceName } from "@/components/scenes/Scene";
// Load the card and label looks
import { CARD, LAB } from "@/components/script/textStyles";

// What the card shows
interface StopCardProps {
  // Who it happened with: the friend in a conversation, you on your own
  who: CastWho;
  // Their face
  face?: FaceName;
  // The small label above the heading
  label: string;
  // The page's heading (the page's only h1)
  title: string;
  // What to do now, in a line
  detail?: ReactNode;
  // The ways on: a chunky button first, then a quiet one
  children?: ReactNode;
  // Whether the heading is announced at once (a failure)
  alert?: boolean;
  // The heading's id, for a section to name itself by
  headingId?: string;
}

// The card: the figure beside the words on a computer, above them on a phone
export function StopCard({ who, face = "flat", label, title, detail, children, alert = false, headingId }: StopCardProps) {
  // One card
  return (
    <div data-stop-card className={`flex flex-col items-start gap-5 p-6 motion-safe:animate-rise sm:flex-row sm:items-center sm:gap-7 md:p-8 ${CARD}`}>
      {/* The figure it happened with, on a soft tint */}
      <span aria-hidden="true" className="grid flex-none place-items-center rounded-[22px] bg-paper p-3 md:p-4"><Cast who={who} face={face} className="size-20 md:size-28" /></span>
      {/* The words and the ways on */}
      <div className="flex min-w-0 flex-col gap-2">
        {/* The small label */}
        <p className={LAB}>{label}</p>
        {/* The heading */}
        <h1 id={headingId} role={alert ? "alert" : undefined} className="font-display text-cue leading-tight font-semibold md:text-statement">{title}</h1>
        {/* What to do now */}
        {detail && <p className="max-w-[52ch] font-bold text-ink-muted">{detail}</p>}
        {/* The ways on */}
        {children && <div className="mt-3 flex flex-wrap items-center gap-3">{children}</div>}
      </div>
    </div>
  );
}
