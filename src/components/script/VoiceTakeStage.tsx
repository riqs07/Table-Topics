"use client";
// The voice drills' shared parts (second design pass, Desktop Screens "PitchDrill" and "Recording", storyboard 6, 7 and 18): the take stage (your blob centred in a ring, then singing with the clock and your level under it and Start over beside the round Stop, pinned to the foot on a phone), a recording problem as a card with your puzzled blob, the verdict panel beside a result (green with your happy blob for a good result, warm amber with Sage for a rough one), the not-found message (Sage, shared), and the numbered rows of a passage or routine

// Load Next.js's link component
import Link from "next/link";
// Load the tick
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
// Load the children type
import type { ReactNode } from "react";
// Load the cast
import { Cast } from "@/components/scenes/Cast";
// Load the face names
import type { FaceName } from "@/components/scenes/Scene";
// Load the singing blob and the level bars
import { LevelBars, SingingBlob } from "@/components/script/PracticeBar";
// Load the button looks
import { PRIMARY, QUIET, SECONDARY } from "@/components/script/Buttons";
// Load the card and label looks
import { CARD, LAB } from "@/components/script/textStyles";
// Load the shared not-found message (Sage says it)
import { NotFound } from "@/components/script/SageSays";
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
  // Throw this take away (it can be brought back for a few seconds), or nothing where that is not offered
  onDiscard?: (() => void) | null;
  // The start button's words, such as "Record take 2 of 6" or "Say it back"
  startLabel: string;
  // After a problem: the puzzled face
  troubled?: boolean;
  // No way to start (the browser cannot hear words)
  blocked?: boolean;
  // Another button is the main one for now (shadowing before you have listened), so the start is the quiet kind
  quiet?: boolean;
}

// The controls row: under the blob on a computer, pinned to the foot of the screen on a phone (storyboard 7)
const CONTROLS = "flex items-center justify-center gap-4 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-20 max-md:border-t-2 max-md:border-rule max-md:bg-paper-raised max-md:px-4 max-md:py-3";

// The take stage, as desk-Recording lays it out: your blob centred in its rings, the clock and your level under it, then Start over beside the round Stop
export function TakeStage({ recording, starting, stopping, levels, elapsed, onStart, onStop, onDiscard = null, startLabel, troubled = false, blocked = false, quiet = false }: TakeStageProps) {
  // Your face while waiting
  const face: FaceName = troubled ? "wonder" : starting || stopping ? "listen" : "ready";
  // The stage
  return (
    <div data-take-stage className="mt-6 flex w-full flex-col items-center gap-5 pb-24 md:mt-8 md:pb-0">
      {/* Your blob: singing in rings while recording, waiting in a still ring otherwise */}
      {recording ? <span aria-hidden="true" className="flex"><SingingBlob className="size-44 md:size-56" /></span> : (
        <span aria-hidden="true" className="relative grid size-44 place-items-center md:size-56">
          {/* The still ring */}
          <span className="absolute inset-[-6%] rounded-full border-4 border-warm opacity-40" />
          {/* The blob */}
          <Cast who="you" face={face} className="size-[78%]" />
        </span>
      )}
      {recording ? (
        <>
          {/* The clock and your level */}
          <span className="flex items-center gap-3">
            {/* The clock */}
            <b className="font-display text-5xl leading-none font-semibold text-ink tabular-nums">{formatClock(elapsed)}</b>
            {/* Your level */}
            <span role="img" aria-label="Microphone level" className="flex"><LevelBars levels={levels} /></span>
          </span>
          {/* Start over and the round Stop */}
          <div className={CONTROLS}>
            {/* Start over: this take goes, with a few seconds to bring it back */}
            {onDiscard && <button type="button" onClick={onDiscard} className={`${QUIET} whitespace-nowrap`}>Start over</button>}
            {/* The round Stop */}
            <button type="button" onClick={onStop} aria-label="Stop" data-variant="stop" className="flex size-18 flex-none items-center justify-center rounded-full bg-ink shadow-stop transition-[transform,box-shadow] duration-100 motion-safe:active:translate-y-[3px] md:size-20">
              {/* The stop square */}
              <span aria-hidden="true" className="size-6 rounded-lg bg-paper-raised md:size-7" />
            </button>
          </div>
        </>
      ) : starting || stopping ? (
        // The microphone opening, or the take being measured
        <p role="status" className="text-center font-display text-2xl font-semibold">{starting ? "Starting…" : "One moment…"}<span className="block font-sans text-footnote font-bold text-ink-muted">{starting ? "allow the microphone" : "measuring your take"}</span></p>
      ) : blocked ? null : (
        // The chunky start, pinned to the foot on a phone
        <div className={CONTROLS}>
          <button type="button" onClick={onStart} data-variant="start" className={`${quiet ? SECONDARY : PRIMARY} max-md:w-full`}>{startLabel}</button>
        </div>
      )}
    </div>
  );
}

// A take that was thrown away, with a few seconds to bring it back (decision 77)
export function DiscardedCard({ onUndo }: { onUndo: () => void }) {
  // The card
  return (
    <div role="status" className={`mt-5 flex w-full max-w-[48ch] flex-wrap items-center gap-3 self-center px-5 py-4 ${CARD}`}>
      {/* What happened */}
      <span className="min-w-0 flex-1 font-bold">Take discarded.</span>
      {/* Bring it back */}
      <button type="button" onClick={onUndo} className={SECONDARY}>Undo</button>
    </div>
  );
}

// A recording problem (too short, nothing heard, the microphone blocked, a browser that cannot hear words): a card with your puzzled blob, never a flat tinted box
export function ProblemCard({ children }: { children: ReactNode }) {
  // The card
  return (
    <div role="alert" className={`mt-5 flex max-w-[56ch] items-start gap-4 px-5 py-4 ${CARD}`}>
      {/* You, puzzled */}
      <Cast who="you" face="wonder" className="size-14 flex-none" />
      {/* What happened and what to do */}
      <div className="min-w-0 self-center font-bold">{children}</div>
    </div>
  );
}

// How a verdict reads: good news in green, a rough one in warm amber (never red), or plain
export type VerdictTone = "good" | "rough" | "plain";

// Each tone's surface and words
export const VERDICT_LOOKS: Readonly<Record<VerdictTone, string>> = { good: "bg-accent-tint text-accent-tint-ink", rough: "bg-warm-tint text-warm-ink", plain: "bg-paper text-ink" };

// How a take's saved line reads (a drill's or a shadowed phrase's): good news, something to work on, or plain (never red)
export function takeLineTone(line: string): VerdictTone {
  // Missed, faded, level, or off the model's pace
  if (/^Hard to catch|Hard to catch:|Aim for|Faded|, not “|No clear peak|about the same level|Lean on|Faster than|Slower than|Your lift went to/i.test(line)) return "rough";
  // Landed as aimed
  if (/as aimed|as planned|, the target\.|Every word caught|Strong to the last|a clear step up|a clear drop|About the model’s pace/.test(line)) return "good";
  // Anything else
  return "plain";
}

// A set's tone from its takes' tones: rough when more went rough than landed, good when any landed, else plain
export function overallTone(tones: ReadonlyArray<VerdictTone>): VerdictTone {
  // How many of each
  const [good, rough] = [tones.filter((tone) => tone === "good").length, tones.filter((tone) => tone === "rough").length];
  // The set's tone
  return rough > good ? "rough" : good > 0 ? "good" : "plain";
}

// The verdict panel beside a result (Desktop Screens "Result"): green with your happy blob for a good result, warm amber with your puzzled blob and Sage for a rough one, soft cream for a plain one; then the headline and whatever the screen adds (lines, the chunky next step)
export function VerdictPanel({ tone, headingId, heading, children }: { tone: VerdictTone; headingId: string; heading: ReactNode; children?: ReactNode }) {
  // The panel
  return (
    <aside aria-labelledby={headingId} data-verdict={tone} className={`flex flex-col gap-3.5 rounded-[26px] px-6 pt-6 pb-5 motion-safe:md:animate-slide-in ${VERDICT_LOOKS[tone]}`}>
      {/* Your blob, and Sage after a rough result */}
      <div className="flex items-end gap-3">
        {/* Your blob */}
        <Cast who="you" face={tone === "good" ? "happy" : tone === "rough" ? "wonder" : "ready"} className="size-22 md:size-26" />
        {/* Sage, for the one note */}
        {tone === "rough" && <Cast who="sage" mood="encouraging" className="size-16 md:size-19" />}
      </div>
      {/* The headline */}
      <h2 id={headingId} className="font-display text-3xl leading-tight font-semibold md:text-4xl">{heading}</h2>
      {/* The rest */}
      {children}
    </aside>
  );
}

// A thing that could not be found: the shared message, Sage saying it as the page's one heading, with one chunky way back
export function NotFoundCard({ title, href, action }: { title: string; href: string; action: string }) {
  // Sage says it
  return <NotFound title={title} back={{ href, label: action }} className="mx-auto mt-10 md:mt-16" />;
}

// Numbered rows in one card (a passage's phrases, a routine's moves): a sun-tinted number (a tick once done), a small label and the words
export function NumberedRows({ label, rows, done = false }: { label: string; rows: ReadonlyArray<{ key: string; over?: string; text: string }>; done?: boolean }) {
  // The card
  return (
    <ol aria-label={label} className={`divide-y-2 divide-rule px-4 ${CARD}`}>
      {/* Each row */}
      {rows.map((row, index) => (
        <li key={row.key} className="flex min-h-16 items-center gap-3.5 py-3">
          {/* Its number, or a tick once done */}
          <span aria-hidden="true" className={`flex size-9 flex-none items-center justify-center rounded-xl font-display text-lg font-semibold ${done ? "bg-fill text-fill-ink" : "bg-warm-tint text-warm-ink"}`}>{done ? <CheckIcon weight="bold" className="size-5" /> : index + 1}</span>
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
