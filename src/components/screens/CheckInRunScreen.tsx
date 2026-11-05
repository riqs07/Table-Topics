"use client";
// The weekly check-in itself (decision 100): the four parts in order, each started from here and coming back here when saved, any part skippable, and a finish screen once each part is done or skipped. It can be left and picked up again the same day. Drawn in focus mode after storyboard "Weekly check-in" (second design pass): the bar with the cross, Sage's line, the parts as picture cards with a tick or Next, one chunky Start

// Load React's state and effect tools, and the type for content passed in
import { useEffect, useState, type ReactNode } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the tick
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { DoneBurst } from "@/components/script/DoneBurst";
import { PRACTICE_NARROW, PracticeBar } from "@/components/script/PracticeBar";
import { Skeleton } from "@/components/script/Skeleton";
// Load the shared button and card looks
import { PRIMARY, QUIET, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
import { BUBBLE, CARD, CARD_LIST, CHIP, CHIP_GOOD, LAB } from "@/components/script/textStyles";
// Load the cast, the mode tiles and each part's tile
import { Cast, type SageMood } from "@/components/scenes/Cast";
import { ModeTile } from "@/components/scenes/ModeTile";
import { CHECK_IN_TILES } from "@/components/script/checkInTiles";
// Load the shared screen starting points and the tab title
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the check-in rules
import { CHECK_IN_MINUTES, CHECK_IN_PARTS, CHECK_IN_PART_INFO, checkInId, checkInWeekday, dayWords, firstUseOf, isFinished, nextAfter, nextPart, partHref, partPrompt, partStatuses, readCheckInSettings, recordedCheckIns, weekFor, type CheckIn } from "@/core/checkIn";
// Load the clock format
import { formatClock } from "@/core/recordingRules";
// Load the check-in reads and writes
import { loadCheckIns, skipCheckInPart, type CheckInData } from "@/data/checkIns";
// Load the part type
import type { CheckInPart } from "@/data/records";

// What the page works out from the loaded data
interface RunState {
  // Today's check-in id and number
  id: string;
  // (number)
  week: number;
  // Today's check-in, once started
  current: CheckIn | null;
  // Whether a check-in can be done today: a check-in day, one already started today, or the very first (always available)
  open: boolean;
  // The first check-in, for comparing (null before there is one before today's)
  first: CheckIn | null;
  // The check-in before today's, for "last week"
  previous: CheckIn | null;
  // The next check-in day, in words
  next: string | null;
}

// Work out today's check-in from what was loaded
function runState(data: CheckInData, today: Date): RunState {
  // Today's id
  const id = checkInId(today);
  // Today's check-in, if started
  const current = data.checkIns.find((checkIn) => checkIn.id === id) ?? null;
  // The recorded check-ins before today
  const earlier = recordedCheckIns(data.checkIns).filter((checkIn) => checkIn.id !== id);
  // The weekday, for the next one
  const weekday = checkInWeekday(readCheckInSettings(data.settings.checkIn), data.checkIns, firstUseOf(data.sessions));
  // The next day: from the schedule, or a week on from today once today's is done
  const next = data.schedule.next ?? (weekday !== null ? nextAfter(today, weekday) : null);
  // Everything the page needs
  return { id, week: weekFor(data.checkIns, id), current, open: data.schedule.due || current !== null || earlier.length === 0, first: earlier[0] ?? null, previous: earlier.at(-1) ?? null, next: next ? dayWords(next) : null };
}

// Draw the check-in
export function CheckInRunScreen(props: ScreenProps) {
  // The repository, and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // What was loaded
  const [data, setData] = useState<CheckInData | null>(null);
  // A load or save failure, said plainly
  const [problem, setProblem] = useState<string | null>(null);
  // How many times it was loaded, so a skip or "Try again" loads afresh
  const [attempt, setAttempt] = useState(0);
  // While a skip is saved
  const [saving, setSaving] = useState(false);
  // Name the tab
  usePageTitle("Weekly check-in");

  // Load once the date is known, and again after a change
  useEffect(() => {
    // Wait for the date
    if (!today) return;
    // Ignore late results
    let cancelled = false;
    // Load
    loadCheckIns(repo, today).then((loaded) => {
      // Shown
      if (!cancelled) setData(loaded);
    }).catch((error: unknown) => {
      // Said plainly
      if (!cancelled) setProblem(error instanceof Error ? error.message : String(error));
    });
    // Stop updating once closed
    return () => {
      // Ignore late results
      cancelled = true;
    };
  }, [repo, today, attempt]);

  // Skip a part, then load again
  async function skip(id: string, part: CheckInPart) {
    // Nothing before the date is known
    if (!today) return;
    // Saving
    setSaving(true);
    // The save can fail
    try {
      // Saved
      await skipCheckInPart(repo, id, part, today);
      // Load afresh
      setAttempt((count) => count + 1);
    } catch (error) {
      // Said plainly, with the buttons still there
      setProblem(error instanceof Error ? error.message : String(error));
    } finally {
      // Done
      setSaving(false);
    }
  }

  // What the page shows, once loaded
  const state = data && today ? runState(data, today) : null;
  // The next part to do
  const upNext = state?.open ? nextPart(state.current) : null;
  // Whether today's is done
  const finished = isFinished(state?.current);

  // How many parts are behind (done or skipped), for the bar
  const behind = state?.current ? partStatuses(state.current).filter((item) => item.status !== "open").length : 0;
  // The bar's label: which part is next, or done
  const barLabel = finished ? "Weekly check-in · done" : upNext ? `Weekly check-in · part ${CHECK_IN_PARTS.indexOf(upNext) + 1} of ${CHECK_IN_PARTS.length}` : "Weekly check-in";

  // Draw the page
  return (
    <main id="main" className={`${PRACTICE_NARROW} pb-40 md:pb-16`}>
      {/* Focus mode: the cross back to Today, how far through, and the step (the tabs stay hidden while practising) */}
      <PracticeBar close={{ href: "/", label: "Close, back to Today" }} progress={state?.open ? (finished ? 1 : behind / CHECK_IN_PARTS.length) : undefined} label={barLabel} />
      {/* Until loaded, a quiet placeholder */}
      {!data && !problem && <Skeleton blocks={["h-24", "h-72"]} />}
      {/* A failure: Sage says so, why, and the way forward */}
      {problem !== null && (
        <section role="alert" className="mt-8 flex flex-col gap-5">
          {/* Sage, thinking, with what happened */}
          <SageSays mood="thinking" heading={!state}>Your check-in could not be loaded or saved.</SageSays>
          {/* The browser's reason, on a card */}
          <p className={`p-5 font-semibold ${CARD}`}><span className={`block ${LAB}`}>What the browser said</span>“{problem}”</p>
          {/* Try again */}
          <p><button type="button" onClick={() => { setProblem(null); setAttempt((count) => count + 1); }} className={PRIMARY}>Try again</button></p>
        </section>
      )}
      {/* Not a check-in day: when the next one is */}
      {state && !state.open && (
        <section className="mt-8 flex flex-col gap-5">
          {/* Headline */}
          <h1 className="font-display text-statement font-semibold">Not a check-in day.</h1>
          {/* Sage says when */}
          <SageSays mood="calm">{state.next ? `Your next check-in is on ${state.next}.` : "Your next check-in comes soon."}</SageSays>
          {/* The check-ins so far */}
          <p><Link href="/check-in" className={SECONDARY}>See your check-ins</Link></p>
        </section>
      )}
      {/* Under way: the parts, and the next one */}
      {state && state.open && !finished && upNext && (
        <>
          {/* Headline */}
          <h1 className="mt-6 font-display text-statement font-semibold">{state.week === 1 ? "Your first check-in." : `Check-in ${state.week}.`}</h1>
          {/* Sage says what it is */}
          <SageSays mood="encouraging" className="mt-4">{state.week === 1 ? `About ${CHECK_IN_MINUTES} minutes. The same four parts every week, so you can hear the change.` : `About ${CHECK_IN_MINUTES} minutes, the same four parts as last time.`}</SageSays>
          {/* The four parts, each a picture card */}
          <ol aria-label="The four parts" className="mt-5 flex flex-col gap-3">
            {/* Each part */}
            {partStatuses(state.current).map((item) => {
              // Whether it is the one waiting
              const next = item.part === upNext;
              // Its tile
              const tile = CHECK_IN_TILES[item.part];
              // One part: its tile, name and how it stands, then a tick or "Next"
              return (
                <li key={item.part} data-part={item.part} data-status={item.status} className={`flex items-center gap-4 rounded-[22px] border-2 bg-card px-3.5 py-3 ${next ? "border-art-sun shadow-next" : "border-rule shadow-card"}`}>
                  {/* The tile, quieter once behind */}
                  <span className={`flex flex-none ${item.status === "open" ? "" : "opacity-60"}`}><ModeTile ground={tile.ground} prop={tile.prop} face={item.status === "done" ? "happy" : tile.face} tilt={-4} still={!next} className="size-14" /></span>
                  {/* Its name and what it asks */}
                  <span className="min-w-0 flex-1">
                    {/* Name */}
                    <span className="block font-display text-lg leading-tight font-semibold">{CHECK_IN_PART_INFO[item.part].name}</span>
                    {/* How it stands: skipped, its length, or what it asks */}
                    <span className="block text-sm font-bold text-ink-muted">{item.status === "skipped" ? "Skipped" : item.status === "done" ? `Done · ${formatClock(state.current?.takes[item.part]?.durationSec ?? 0)}` : CHECK_IN_PART_INFO[item.part].what}</span>
                  </span>
                  {/* A tick once done, "Next" on the one waiting */}
                  {item.status === "done" && <span aria-hidden="true" className="flex size-9 flex-none items-center justify-center rounded-full bg-fill text-fill-ink shadow-chunky-pressed"><CheckIcon weight="bold" className="size-5" /></span>}
                  {next && <span className={`${CHIP_GOOD} flex-none uppercase`}>Next</span>}
                </li>
              );
            })}
          </ol>
          {/* The next part: what it asks, and a way to skip it */}
          <section aria-label="Next part" className={`mt-5 p-5 ${CARD}`}>
            {/* Which part */}
            <p className={LAB}>Part {CHECK_IN_PARTS.indexOf(upNext) + 1} of {CHECK_IN_PARTS.length}</p>
            {/* What it asks, or (for the surprise question) that it stays hidden */}
            <p className="mt-1 max-w-[40ch] font-display text-cue font-semibold">{partPrompt(upNext, state.week).text ?? "A question you’ll see when you start."}</p>
            {/* Skip it, or stop for now */}
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {/* Skip */}
              <button type="button" disabled={saving} onClick={() => void skip(state.id, upNext)} className={QUIET}>Skip this part</button>
              {/* Stop for now */}
              <Link href="/" className={`${TEXT_LINK} text-ink-muted`}>Finish later today</Link>
            </p>
          </section>
          {/* Push the action down */}
          <div className="flex-1" />
          {/* Start the next part */}
          <ActionBand action={`Start ${CHECK_IN_PART_INFO[upNext].name.toLowerCase()}`} aside={`Part ${CHECK_IN_PARTS.indexOf(upNext) + 1} of ${CHECK_IN_PARTS.length}`} href={partHref(upNext, state.id, state.week)} />
        </>
      )}
      {/* Done: what was recorded, the comparison, and when the next one is */}
      {state && finished && state.current && <Finished state={state} current={state.current} />}
    </main>
  );
}

// Sage with a line in a speech bubble (storyboard "Weekly check-in")
function SageSays({ mood, children, className = "", heading = false }: { mood: SageMood; children: ReactNode; className?: string; heading?: boolean }) {
  // The coach and the bubble, side by side
  return (
    <div className={`flex items-end gap-3 ${className}`.trim()}>
      {/* The coach */}
      <Cast who="sage" mood={mood} className="size-16 flex-none md:size-20" />
      {/* The line: the page's heading when nothing else on the page is (a failure before anything loaded) */}
      {heading ? <h1 className={`${BUBBLE} mb-2 max-w-[44ch] font-display text-xl font-semibold`}>{children}</h1> : <p className={`${BUBBLE} mb-2 max-w-[44ch]`}>{children}</p>}
    </div>
  );
}

// The finish screen (extrapolated from storyboard "Day done"): the blob celebrating, each part's length, the way to compare, and the next check-in day
function Finished({ state, current }: { state: RunState; current: CheckIn }) {
  // Whether anything was recorded (every part could have been skipped)
  const recorded = Object.keys(current.takes).length > 0;
  // The page
  return (
    <section aria-label="Check-in done" className="mt-2 flex flex-1 flex-col">
      {/* The blob, pleased, once something was recorded */}
      {recorded ? <DoneBurst celebrate={false} /> : <Cast who="you" face="ready" className="mx-auto mt-6 size-32" />}
      {/* Headline */}
      <h1 className="text-center font-display text-statement font-semibold motion-safe:animate-rise">{state.week === 1 && recorded ? "Your starting point is saved." : "Check-in done."}</h1>
      {/* What happens next */}
      <p className="mx-auto mt-2 max-w-[44ch] text-center font-bold text-ink-muted">{!recorded ? "Every part was skipped this time." : state.first ? "Hear it beside where you started." : "Next week you’ll do the same four parts and hear the difference."}</p>
      {/* Each part, linking to its take */}
      <ul aria-label="Your parts" className={`mt-6 ${CARD_LIST}`}>
        {/* Each part */}
        {CHECK_IN_PARTS.map((part) => {
          // Its take, if any
          const take = current.takes[part];
          // Its tile
          const tile = CHECK_IN_TILES[part];
          // One row
          return (
            <li key={part} className="flex min-h-16 items-center gap-3.5 py-2.5">
              {/* Its tile */}
              <span className={`flex flex-none ${take ? "" : "opacity-60"}`}><ModeTile ground={tile.ground} prop={tile.prop} face={take ? "happy" : tile.face} tilt={-4} still className="size-11" /></span>
              {/* Its name */}
              <span className="min-w-0 flex-1 font-display text-lg font-semibold">{CHECK_IN_PART_INFO[part].name}</span>
              {/* Its length, linking to the take, or skipped */}
              {take ? <Link href={`/sessions?id=${encodeURIComponent(take.id)}`} className={TEXT_LINK}>{formatClock(take.durationSec)}</Link> : <span className={CHIP}>Skipped</span>}
            </li>
          );
        })}
      </ul>
      {/* The ways to compare, once there is an earlier check-in */}
      {recorded && state.first && (
        <p className="mt-5 flex flex-wrap gap-3">
          {/* With the first */}
          <Link href={`/check-in/compare?a=${state.first.id}&b=${current.id}`} className={SECONDARY}>Compare with your first</Link>
          {/* With last week, when that is a different one */}
          {state.previous && state.previous.id !== state.first.id && <Link href={`/check-in/compare?a=${state.previous.id}&b=${current.id}`} className={SECONDARY}>Compare with last time</Link>}
        </p>
      )}
      {/* The next check-in day */}
      {state.next && <p className="mt-5 font-bold text-ink-muted">Next check-in: {state.next}.</p>}
      {/* Push the action down */}
      <div className="flex-1" />
      {/* Back to Today */}
      <ActionBand action="Back to Today" aside="check-in saved" href="/" />
    </section>
  );
}
