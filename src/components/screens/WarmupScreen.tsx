"use client";
// A one-minute warm-up (second design pass: the practice layout in two columns, the moves as numbered rows, Sage beside them, a countdown ring as in storyboard 6, and the verdict panel at the end): three moves of about 20 seconds, with their cues, and nothing recorded (decision 80; the microphone stays off)

// Load React's state, effect and memo tools
import { useEffect, useMemo, useState } from "react";
// Load the practice bar, the page around it, the columns and the step label
import { PRACTICE_BODY, PRACTICE_COLUMNS, PRACTICE_MAIN, PracticeBar, STEP_LABEL } from "@/components/script/PracticeBar";
// Load the shared button looks
import { PRIMARY, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the speech bubble look
import { BUBBLE } from "@/components/script/textStyles";
// Load the verdict panel, the next step and the numbered rows
import { NextLink, NumberedRows, VerdictPanel } from "@/components/script/VoiceTakeStage";
// Load the cast
import { Cast } from "@/components/scenes/Cast";
// Load the mode tile and the warm-up's look
import { ModeTile } from "@/components/scenes/ModeTile";
import { SCENE_TILES } from "@/components/scenes/modeTileFor";
// Load the wrapper that carries the tile over from Today (decision 141)
import { SharedScene } from "@/components/scenes/SharedScene";
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

  // The warm-up's tile
  const tile = SCENE_TILES["warm-up"];
  // Sage's word beside the routine (the move's cue is already under its name)
  const sageLine = done ? "Breath, face and mouth are ready. Speak while they are." : current ? "Nice and easy. Nothing is recorded." : "Loosen up before you speak. Nothing is recorded.";

  // Draw the page
  return (
    <main id="main" className={PRACTICE_MAIN}>
      {/* Title and the way out */}
      <PracticeBar close={planStep ? { href: "/", label: "Close, back to Today" } : { href: "/voice", label: "Close, back to Your voice" }} progress={routine.length > 0 ? Math.max(0, Math.min(move, routine.length)) / routine.length : 0} label={`Warm-up${move >= 0 && move < routine.length ? ` · move ${move + 1} of ${routine.length}` : ""}${plan ? ` · step ${plan.step} of ${plan.total}` : ""}`} />

      <div className={`${PRACTICE_BODY} ${PRACTICE_COLUMNS}`}>
        {/* Before starting: the routine */}
        {move < 0 && (
          <section aria-labelledby="warmup-heading" className="flex min-w-0 flex-col">
            {/* The warm-up's tile (carried over from Today's step, decision 141), the label and the name */}
            <div data-scene-panel="warm-up" className="flex items-center gap-4 md:gap-5">
              {/* The tile */}
              <SharedScene scene="warm-up"><span className="flex flex-none"><ModeTile ground={tile.ground} prop={tile.prop} face={tile.face} tilt={-4} scene="warm-up" className="size-20 md:size-28" /></span></SharedScene>
              {/* The words */}
              <div className="min-w-0">
                {/* The label */}
                <p className={STEP_LABEL}>Your voice · 1 min</p>
                {/* What it is */}
                <h1 id="warmup-heading" className="mt-1 font-display text-statement leading-tight font-semibold">A one-minute warm-up.</h1>
              </div>
            </div>
            {/* How it works */}
            <p className="mt-4 max-w-[48ch] text-lede font-semibold text-ink-muted">Three moves, about {moveSeconds} seconds each. Nothing is recorded.</p>
            {/* The moves */}
            <div className="mt-5"><NumberedRows label="Moves" rows={routine.map((item) => ({ key: item.id, over: SET_NAMES[item.set], text: item.name }))} /></div>
            {/* Start, or a different routine */}
            <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
              {/* Start */}
              <button type="button" onClick={next} disabled={routine.length === 0} className={PRIMARY}>Start</button>
              {/* Another routine */}
              <button type="button" onClick={() => setOffset(offset + 1)} className={TEXT_LINK}>Another routine</button>
            </p>
          </section>
        )}

        {/* A move under way: its name and cue, then your blob in a ring that runs down (storyboard "Rapid Fire countdown") */}
        {current && (
          <section aria-labelledby="move-heading" className="flex min-w-0 flex-col">
            {/* Which move */}
            <p className={STEP_LABEL}>Move {move + 1} of {routine.length} · {SET_NAMES[current.set]}</p>
            {/* Its name */}
            <h1 id="move-heading" className="mt-2 font-display text-statement leading-tight font-semibold md:text-prompt">{current.name}</h1>
            {/* What to do */}
            <p className="mt-3 max-w-[48ch] text-lede font-semibold text-ink-muted">{cue}</p>
            {/* The ring: its track, the time left in leaf, your blob and the seconds */}
            <div data-countdown className="relative mt-6 flex size-60 items-center justify-center self-center md:size-64 md:self-start">
              <svg aria-hidden="true" viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90">
                {/* The track */}
                <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" className="stroke-rule" />
                {/* The time left */}
                <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" strokeLinecap="round" strokeDasharray="339.3" strokeDashoffset={339.3 * (1 - left / Math.max(1, moveSeconds))} className="stroke-art-leaf transition-[stroke-dashoffset] duration-500" />
              </svg>
              {/* Your blob, moving with you, and the seconds */}
              <span aria-hidden="true" className="relative flex flex-col items-center">
                {/* The blob */}
                <Cast who="you" face={current.set === "breath" ? "puff" : "sing"} className="size-24 md:size-28" />
                {/* The seconds left */}
                <span className="font-display text-6xl leading-none font-semibold tabular-nums">{left}</span>
              </span>
            </div>
            {/* Skip ahead */}
            <p className="mt-6 self-center md:self-start"><button type="button" onClick={next} aria-label={`Next move (${left} seconds left)`} className={SECONDARY}>Next move</button></p>
          </section>
        )}

        {/* Done */}
        {done && (
          <section aria-labelledby="done-heading" className="flex min-w-0 flex-col">
            {/* The label */}
            <p className={STEP_LABEL}>Three moves done</p>
            {/* The word */}
            <h1 id="done-heading" className="mt-2 font-display text-statement leading-tight font-semibold">Warmed up.</h1>
            {/* The moves, ticked */}
            <div className="mt-5"><NumberedRows label="Moves done" rows={routine.map((item) => ({ key: item.id, over: SET_NAMES[item.set], text: item.name }))} /></div>
          </section>
        )}

        {/* Beside it: Sage's word, the moves as they go, and once done the next step */}
        <aside aria-label="Your coach" className="flex min-w-0 flex-col gap-4">
          {/* Sage and the word */}
          {!done && (
            <div className="flex items-end gap-3">
              {/* Sage */}
              <Cast who="sage" mood={current ? "breathe" : "encouraging"} className="size-18 flex-none md:size-22" />
              {/* The word */}
              <p className={`${BUBBLE} mb-2`}>{sageLine}</p>
            </div>
          )}
          {/* The moves as they go */}
          {current && (
            <ol aria-label="The routine" className="flex flex-col gap-2.5">
              {routine.map((item, index) => {
                // Whether it is done, this one, or to come
                const state = index === move ? "now" : index < move ? "done" : "next";
                // One move
                return (
                  <li key={item.id} data-move-state={state} className={`rounded-[18px] px-4 py-3 ${state === "now" ? "border-2 border-accent bg-card shadow-picked" : state === "done" ? "bg-paper" : "border-2 border-dashed border-rule"}`}>
                    {/* Its name, and where it is */}
                    <p className="flex items-baseline justify-between gap-3 text-sm font-extrabold">
                      <span>{SET_NAMES[item.set]} · {item.name}</span>
                      <span className={state === "now" ? "text-accent-tint-ink" : "text-ink-muted"}>{state === "done" ? "Done" : state === "now" ? "Now" : index === move + 1 ? "Up next" : ""}</span>
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
          {/* Once done: the reading it warmed up for, today's next step, or back */}
          {done && (
            <VerdictPanel tone="good" face="happy" headingId="warm-done-panel" heading="Ready to speak.">
              {/* What it was for */}
              <p className="font-bold text-ink">{sageLine}</p>
              {/* The next step */}
              {after ? <NextLink action="Start reading" aside="your warm-up step" href={after} /> : plan ? (plan.next ? <NextLink action={`Next: step ${plan.step + 1}`} aside={plan.next.label} href={plan.next.href} /> : <NextLink action="Finish today’s practice" aside="back to Today" href="/" />) : <NextLink action="Back to Your voice" aside="more voice drills" href="/voice" />}
            </VerdictPanel>
          )}
        </aside>
      </div>
    </main>
  );
}
