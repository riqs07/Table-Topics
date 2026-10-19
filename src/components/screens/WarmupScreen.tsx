"use client";
// A one-minute warm-up: three moves of about 20 seconds, with their cues, and nothing recorded (decision 80; the microphone stays off)

// Load React's state, effect and memo tools
import { useEffect, useMemo, useState } from "react";
// Load the masthead
import { Masthead } from "@/components/script/Masthead";
// Load the action band
import { ActionBand } from "@/components/script/ActionBand";
// Load the shared button looks
import { PRESS, PRIMARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the plan position
import { usePlanNav } from "@/components/screens/usePlanNav";
// Load the tab title
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the routine picker
import { warmupRoutine } from "@/core/voicePicks";
// Load the words to watch, for the line to say
import { topWordsToWatch } from "@/core/wordsToWatch";
// Load the warm-up saver
import { markWarmupDone } from "@/data/dailyPlan";
// Load the set names
import type { WarmupSet } from "@/content/voice";

// How long each move lasts, in seconds
const MOVE_SECONDS = 20;

// What each set is called on screen
const SET_NAMES: Readonly<Record<WarmupSet, string>> = { breath: "Breath and body", mouth: "Face and mouth", say: "Say it aloud" };

// What the warm-up page is given
interface WarmupScreenProps extends ScreenProps {
  // The step inside today's practice, or null
  planStep?: number | null;
  // Where to go afterwards, such as the reading it warms up for (only a recording page is allowed), or null
  then?: string | null;
  // Seconds per move (shorter in checks)
  moveSeconds?: number;
}

// Draw the warm-up
export function WarmupScreen({ planStep = null, then = null, moveSeconds = MOVE_SECONDS, ...props }: WarmupScreenProps) {
  // The repository and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // Where this sits in today's practice
  const plan = usePlanNav(repo, today, planStep);
  // Which routine: today's, or another one asked for
  const [offset, setOffset] = useState(0);
  // The move under way (-1 before starting, 3 when done)
  const [move, setMove] = useState(-1);
  // Seconds left in the move
  const [left, setLeft] = useState(moveSeconds);
  // Words to watch, for the line to say
  const [watch, setWatch] = useState<string[]>([]);
  // The routine
  const routine = useMemo(() => (today ? warmupRoutine(today, offset) : []), [today, offset]);
  // Only a recording page may follow
  const after = then && then.startsWith("/session?") ? then : null;
  // Name the tab
  usePageTitle("Warm-up");

  // Read the words to watch once
  useEffect(() => {
    // Wait for the date
    if (!today) return;
    // Ignore the answer if closed first
    let cancelled = false;
    // Read the settings
    repo.getSettings(today).then((settings) => {
      // Keep the top few
      if (!cancelled) setWatch(topWordsToWatch(settings.wordsToWatch ?? {}, 3));
    });
    // Mark as closed
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [repo, today]);

  // Count down while a move is under way, then move on
  useEffect(() => {
    // Only during a move
    if (move < 0 || move >= routine.length) return;
    // Tick once a second
    const timer = setInterval(() => setLeft((seconds) => seconds - 1), 1000);
    // Stop when the move changes
    return () => clearInterval(timer);
  }, [move, routine.length]);

  // At zero, the next move
  useEffect(() => {
    // Not yet
    if (left > 0 || move < 0 || move >= routine.length) return;
    // On to the next
    next();
  });

  // Finished: note it for today's practice
  useEffect(() => {
    // Only once done, in the browser
    if (move !== routine.length || routine.length === 0 || !today) return;
    // Save the day
    void markWarmupDone(repo, today);
  }, [move, repo, routine.length, today]);

  // Go on to the next move (or finish)
  function next() {
    // The next move
    setMove((current) => current + 1);
    // A full count for it
    setLeft(moveSeconds);
  }

  // The move under way
  const current = move >= 0 ? routine[move] : undefined;
  // Done
  const done = routine.length > 0 && move >= routine.length;
  // The cue, with a trouble word added to the line to say when there is one
  const cue = current?.set === "say" && watch.length > 0 ? `${current.cue} Then say “${watch.join(", ")}”, slowly.` : current?.cue;

  // Draw the page
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Title and the way out */}
      <Masthead title="Warm-up" nav={false} close={planStep ? { href: "/", label: "Close, back to Today" } : { href: "/voice", label: "Close, back to Your voice" }}>{plan ? `Step ${plan.step} of ${plan.total}` : ""}</Masthead>

      {/* Before starting: the routine */}
      {move < 0 && (
        <section aria-labelledby="warmup-heading" className="mt-8 md:max-w-2xl">
          {/* What it is */}
          <h1 id="warmup-heading" className="font-display text-statement font-semibold tracking-tight">A one-minute warm-up.</h1>
          {/* How it works */}
          <p className="mt-3 max-w-[48ch] text-lede">Three moves, about {moveSeconds} seconds each. Nothing is recorded.</p>
          {/* The moves */}
          <ol aria-label="Moves" className="mt-5 flex flex-col gap-2">
            {/* Each move */}
            {routine.map((item, index) => (
              // One move on a rounded tile
              <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-card px-3 py-2.5">
                {/* Its number */}
                <span aria-hidden="true" className="flex size-8 flex-none items-center justify-center rounded-lg bg-warm-tint font-semibold text-warm-ink">{index + 1}</span>
                {/* Its set and name */}
                <span><span className="block text-footnote text-ink-muted">{SET_NAMES[item.set]}</span><span className="block font-semibold">{item.name}</span></span>
              </li>
            ))}
          </ol>
          {/* Start, or a different routine */}
          <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
            {/* Start */}
            <button type="button" onClick={next} disabled={routine.length === 0} className={PRIMARY}>Start</button>
            {/* Another routine */}
            <button type="button" onClick={() => setOffset(offset + 1)} className={TEXT_LINK}>Another routine</button>
          </p>
        </section>
      )}

      {/* A move under way */}
      {current && (
        <section aria-labelledby="move-heading" className="mt-8 flex flex-col md:max-w-2xl">
          {/* Which move */}
          <p className="text-footnote font-semibold text-accent">Move {move + 1} of {routine.length} · {SET_NAMES[current.set]}</p>
          {/* Its name */}
          <h1 id="move-heading" className="mt-1 font-display text-statement font-semibold tracking-tight">{current.name}</h1>
          {/* What to do */}
          <p className="mt-3 max-w-[48ch] text-lede">{cue}</p>
          {/* The countdown on the shape, which skips ahead when tapped */}
          <button type="button" onClick={next} aria-label={`Next move (${left} seconds left)`} className={`relative mx-auto my-8 flex size-56 items-center justify-center rounded-full md:mx-0 ${PRESS}`}>
            {/* The halo, turning slowly */}
            <span aria-hidden="true" className="absolute inset-0 rounded-full border-2 border-dashed border-warm opacity-60 motion-safe:animate-spin-slow" />
            {/* The shape */}
            <span aria-hidden="true" className="absolute inset-4 rounded-full bg-warm shadow-card motion-safe:animate-morph" />
            {/* The seconds left, and what a tap does */}
            <span className="relative flex flex-col items-center text-on-warm">
              {/* Seconds */}
              <span aria-hidden="true" className="font-display text-prompt-xl font-semibold tabular-nums">{left}</span>
              {/* The action */}
              <span aria-hidden="true" className="text-footnote font-semibold">Next</span>
            </span>
          </button>
        </section>
      )}

      {/* Done */}
      {done && (
        <section aria-labelledby="done-heading" className="mt-8 md:max-w-2xl">
          {/* The word */}
          <h1 id="done-heading" className="font-display text-statement font-semibold tracking-tight">Warmed up.</h1>
          {/* What it was for */}
          <p className="mt-3 max-w-[48ch] text-lede">Breath, face and mouth are ready. Speak while they are.</p>
        </section>
      )}

      {/* Push the band down */}
      <div className="flex-1" />
      {/* Once done: the reading it warmed up for, today's next step, or back */}
      {done && (after ? <ActionBand action="Start reading" aside="your warm-up step" href={after} /> : plan ? (plan.next ? <ActionBand action={`Next: step ${plan.step + 1}`} aside={plan.next.label} href={plan.next.href} /> : <ActionBand action="Finish today’s practice" aside="back to Today" href="/" />) : <ActionBand action="Back to Your voice" aside="more voice drills" href="/voice" />)}
    </main>
  );
}
