"use client";
// The weekly check-in itself (decision 100): the four parts in order, each started from here and coming back here when saved, any part skippable, and a finish screen once each part is done or skipped. It can be left and picked up again the same day

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Masthead } from "@/components/script/Masthead";
import { PathMark } from "@/components/script/PathMark";
import { Skeleton } from "@/components/script/Skeleton";
// Load the shared button and card looks
import { QUIET, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
import { CARD } from "@/components/script/textStyles";
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

  // Draw the page
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-5xl flex-col bg-paper-raised px-6 pt-6 pb-40 md:px-14 md:pt-10 md:pb-10 md:[&>:not(header,nav,[data-action-band])]:max-w-2xl">
      {/* The title and a way out (the tabs stay hidden while practising) */}
      <Masthead title="Check-in" nav={false} close={{ href: "/", label: "Close, back to Today" }} />
      {/* Until loaded, a quiet placeholder */}
      {!data && !problem && <Skeleton blocks={["h-24", "h-72"]} />}
      {/* A failure: why, and the way forward */}
      {problem !== null && (
        <section role="alert" className="mt-8 max-w-[48ch] text-lede">
          {/* What happened */}
          <p>Your check-in could not be loaded or saved. The browser said: “{problem}”</p>
          {/* Try again */}
          <p className="mt-4"><button type="button" onClick={() => { setProblem(null); setAttempt((count) => count + 1); }} className={SECONDARY}>Try again</button></p>
        </section>
      )}
      {/* Not a check-in day: when the next one is */}
      {state && !state.open && (
        <section className="mt-8">
          {/* Headline */}
          <h1 className="font-display text-statement font-semibold tracking-tight">Not a check-in day.</h1>
          {/* When */}
          <p className="mt-3 max-w-[48ch] text-lede">{state.next ? `Your next check-in is on ${state.next}.` : "Your next check-in comes soon."}</p>
          {/* The check-ins so far */}
          <p className="mt-4"><Link href="/check-in" className={TEXT_LINK}>See your check-ins</Link></p>
        </section>
      )}
      {/* Under way: the parts, and the next one */}
      {state && state.open && !finished && upNext && (
        <>
          {/* Headline */}
          <h1 className="mt-6 font-display text-statement font-semibold tracking-tight">{state.week === 1 ? "Your first check-in." : `Check-in ${state.week}.`}</h1>
          {/* What it is */}
          <p className="mt-2 max-w-[48ch] text-ink-muted">{state.week === 1 ? `About ${CHECK_IN_MINUTES} minutes. The same four parts every week, so you can hear the change.` : `About ${CHECK_IN_MINUTES} minutes, the same four parts as last time.`}</p>
          {/* The four parts */}
          <ol aria-label="The four parts" className={`mt-5 flex flex-col gap-1 p-3 ${CARD}`}>
            {/* Each part */}
            {partStatuses(state.current).map((item, index) => (
              // One part: its mark, name and how it stands
              <li key={item.part} data-part={item.part} data-status={item.status} className={`flex items-center gap-3 rounded-2xl px-2 py-2 ${item.part === upNext ? "bg-warm-tint" : ""}`}>
                {/* Done, next or still to come */}
                <PathMark mark={item.status === "done" ? "done" : item.part === upNext ? "next" : "open"} number={index + 1} />
                {/* Its name and what it asks */}
                <span className="min-w-0 flex-1">
                  {/* Name */}
                  <span className={`block ${item.part === upNext ? "font-semibold text-warm-ink" : ""}`}>{CHECK_IN_PART_INFO[item.part].name}</span>
                  {/* How it stands: skipped, its length, or what it asks */}
                  <span className="block text-footnote text-ink-muted">{item.status === "skipped" ? "Skipped" : item.status === "done" ? `Done · ${formatClock(state.current?.takes[item.part]?.durationSec ?? 0)}` : CHECK_IN_PART_INFO[item.part].what}</span>
                </span>
              </li>
            ))}
          </ol>
          {/* The next part: what it asks, and a way to skip it */}
          <section aria-label="Next part" className="mt-6">
            {/* Which part */}
            <p className="text-footnote text-ink-muted">Part {CHECK_IN_PARTS.indexOf(upNext) + 1} of {CHECK_IN_PARTS.length}</p>
            {/* What it asks, or (for the surprise question) that it stays hidden */}
            <p className="mt-1 max-w-[40ch] font-display text-cue font-semibold tracking-tight">{partPrompt(upNext, state.week).text ?? "A question you’ll see when you start."}</p>
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

// The finish screen: each part's length, the way to compare, and the next check-in day
function Finished({ state, current }: { state: RunState; current: CheckIn }) {
  // Whether anything was recorded (every part could have been skipped)
  const recorded = Object.keys(current.takes).length > 0;
  // The page
  return (
    <section aria-label="Check-in done" className="mt-6 flex flex-1 flex-col">
      {/* Headline */}
      <h1 className="font-display text-statement font-semibold tracking-tight motion-safe:animate-rise">{state.week === 1 && recorded ? "Your starting point is saved." : "Check-in done."}</h1>
      {/* What happens next */}
      <p className="mt-2 max-w-[48ch] text-lede">{!recorded ? "Every part was skipped this time." : state.first ? "Hear it beside where you started." : "Next week you’ll do the same four parts and hear the difference."}</p>
      {/* Each part, linking to its take */}
      <ul aria-label="Your parts" className={`mt-5 divide-y divide-rule px-4 ${CARD}`}>
        {/* Each part */}
        {CHECK_IN_PARTS.map((part) => {
          // Its take, if any
          const take = current.takes[part];
          // One row
          return (
            <li key={part} className="flex min-h-14 items-center justify-between gap-3 py-2">
              {/* Its name */}
              <span>{CHECK_IN_PART_INFO[part].name}</span>
              {/* Its length, linking to the take, or skipped */}
              {take ? <Link href={`/sessions?id=${encodeURIComponent(take.id)}`} className={TEXT_LINK}>{formatClock(take.durationSec)}</Link> : <span className="text-footnote text-ink-muted">Skipped</span>}
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
      {state.next && <p className="mt-5 text-ink-muted">Next check-in: {state.next}.</p>}
      {/* Push the action down */}
      <div className="flex-1" />
      {/* Back to Today */}
      <ActionBand action="Back to Today" aside="check-in saved" href="/" />
    </section>
  );
}
