"use client";
// The voice drills' shared parts (second design pass, Desktop Screens "PitchDrill" and "Recording", storyboard 6 and 18): the take stage (your blob waiting, then singing with the clock, your level and the round Stop, or a chunky Record before it), the verdict panel beside a result (green for a good take, warm amber for a rough one), the not-found card, and the numbered rows of a passage or routine

// Load Next.js's link component
import Link from "next/link";
// Load the children type
import type { ReactNode } from "react";
// Load the cast
import { Cast } from "@/components/scenes/Cast";
// Load the face names
import type { FaceName } from "@/components/scenes/Scene";
// Load the singing blob and the level bars
import { LevelBars, SingingBlob } from "@/components/script/PracticeBar";
// Load the button looks
import { PRIMARY } from "@/components/script/Buttons";
// Load the card and label looks
import { CARD, LAB } from "@/components/script/textStyles";
// Load the clock formatter
import { formatClock } from "@/core/recordingRules";

// What the take stage is given
interface TakeStageProps {
  // Recording now
  recording: boolean;
  // The microphone opening
  starting: boolean;
  // The take being measured
  stopping: boolean;
  // The recent loudness readings, for the level bars
  levels: number[];
  // Seconds recorded so far
  elapsed: number;
  // Start a take
  onStart: () => void;
  // Stop the take
  onStop: () => void;
  // The start button's words, such as "Record take 2" or "Say it back"
  startLabel: string;
  // The quieter words beside it, such as "6 takes, one word each"
  startDetail?: string;
  // After a problem: the puzzled face
  troubled?: boolean;
  // No way to start (the browser cannot hear words)
  blocked?: boolean;
}

// The take stage: your blob and one control, in the order the Recording reference shows them (blob, then the clock and your level, then the round Stop)
export function TakeStage({ recording, starting, stopping, levels, elapsed, onStart, onStop, startLabel, startDetail, troubled = false, blocked = false }: TakeStageProps) {
  // Your face while waiting
  const face: FaceName = troubled ? "wonder" : starting || stopping ? "listen" : "ready";
  // The stage
  return (
    <div data-take-stage className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
      {/* Your blob: singing while recording, waiting otherwise */}
      <span aria-hidden="true" className="flex">{recording ? <SingingBlob className="size-32 md:size-36" /> : <Cast who="you" face={face} className="size-28 md:size-32" />}</span>
      {/* The control */}
      <div className="flex flex-col items-center gap-3 sm:items-start">
        {recording ? (
          <>
            {/* The clock and your level */}
            <span className="flex items-center gap-3">
              {/* The clock */}
              <b className="font-display text-5xl leading-none font-semibold text-ink tabular-nums">{formatClock(elapsed)}</b>
              {/* Your level */}
              <span role="img" aria-label="Microphone level" className="flex"><LevelBars levels={levels} /></span>
            </span>
            {/* The round Stop */}
            <button type="button" onClick={onStop} aria-label="Stop" data-variant="stop" className="flex size-18 flex-none items-center justify-center rounded-full bg-ink shadow-stop transition-[transform,box-shadow] duration-100 motion-safe:active:translate-y-[3px] md:size-20">
              {/* The stop square */}
              <span aria-hidden="true" className="size-6 rounded-lg bg-paper-raised md:size-7" />
            </button>
          </>
        ) : starting || stopping ? (
          // The microphone opening, or the take being measured
          <p role="status" className="font-display text-2xl font-semibold">{starting ? "Starting…" : "One moment…"}<span className="block font-sans text-footnote font-bold text-ink-muted">{starting ? "allow the microphone" : "measuring your take"}</span></p>
        ) : blocked ? null : (
          <>
            {/* The chunky start */}
            <button type="button" onClick={onStart} data-variant="start" className={PRIMARY}>{startLabel}</button>
            {/* What it starts */}
            {startDetail && <span className="text-footnote font-bold text-ink-muted">{startDetail}</span>}
          </>
        )}
      </div>
    </div>
  );
}

// How a verdict reads: good news in green, a rough one in warm amber (never red), or plain
export type VerdictTone = "good" | "rough" | "plain";

// Each tone's surface and words
export const VERDICT_LOOKS: Readonly<Record<VerdictTone, string>> = { good: "bg-accent-tint text-accent-tint-ink", rough: "bg-warm-tint text-warm-ink", plain: "bg-paper text-ink" };

// The verdict panel beside a result (Desktop Screens "Result"): your blob over the headline, then whatever the screen adds (lines, chips, the chunky next step)
export function VerdictPanel({ tone, face, headingId, heading, children }: { tone: VerdictTone; face: FaceName; headingId: string; heading: ReactNode; children?: ReactNode }) {
  // The panel
  return (
    <aside aria-labelledby={headingId} data-verdict={tone} className={`flex flex-col gap-3.5 rounded-[26px] px-6 pt-6 pb-5 motion-safe:md:animate-slide-in ${VERDICT_LOOKS[tone]}`}>
      {/* Your blob */}
      <Cast who="you" face={face} className="size-22 md:size-26" />
      {/* The headline */}
      <h2 id={headingId} className="font-display text-3xl leading-tight font-semibold md:text-4xl">{heading}</h2>
      {/* The rest */}
      {children}
    </aside>
  );
}

// A thing that could not be found (no reference: extrapolated from the result's card and verdict): your puzzled blob, the heading, a line, and one chunky way back
export function NotFoundCard({ title, line, href, action }: { title: string; line: string; href: string; action: string }) {
  // The card
  return (
    <section aria-labelledby="not-found-heading" className={`mx-auto mt-6 flex w-full max-w-xl flex-col items-center gap-4 px-6 py-8 text-center md:mt-12 ${CARD}`}>
      {/* Your blob, puzzled */}
      <Cast who="you" face="wonder" className="size-24 md:size-28" />
      {/* What happened */}
      <h1 id="not-found-heading" className="font-display text-statement leading-tight font-semibold">{title}</h1>
      {/* Why, in a line */}
      <p className="max-w-[40ch] font-semibold text-ink-muted">{line}</p>
      {/* The way back */}
      <Link href={href} className={`${PRIMARY} mt-2`}>{action}</Link>
    </section>
  );
}

// Numbered rows in one card (a passage's phrases, a routine's moves): a sun-tinted number, a small label and the words
export function NumberedRows({ label, rows }: { label: string; rows: ReadonlyArray<{ key: string; over?: string; text: string }> }) {
  // The card
  return (
    <ol aria-label={label} className={`divide-y-2 divide-rule px-4 ${CARD}`}>
      {/* Each row */}
      {rows.map((row, index) => (
        <li key={row.key} className="flex min-h-16 items-center gap-3.5 py-3">
          {/* Its number */}
          <span aria-hidden="true" className="flex size-9 flex-none items-center justify-center rounded-xl bg-warm-tint font-display text-lg font-semibold text-warm-ink">{index + 1}</span>
          {/* Its label and words */}
          <span className="min-w-0">{row.over && <span className={`${LAB} block`}>{row.over}</span>}<span className="block font-bold">{row.text}</span></span>
        </li>
      ))}
    </ol>
  );
}

// The chunky next step at the foot of the verdict panel, named by its action and then where it goes
export function NextLink({ action, aside, href }: { action: string; aside: string; href: string }) {
  // Full width in the panel
  return (
    <span className="flex flex-col">
      {/* The button */}
      <Link href={href} data-action-band className={`${PRIMARY} w-full`}>{action}<span className="sr-only"> {aside}</span></Link>
      {/* Where it goes */}
      <span aria-hidden="true" className="mt-1.5 text-center text-sm font-bold">{aside}</span>
    </span>
  );
}
