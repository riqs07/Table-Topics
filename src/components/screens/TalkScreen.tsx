"use client";
// A talk's own page: its date, today's step in the countdown plan, every part to practise, and how long each run took. Laid out in the UI rewrite's second pass, extrapolated from Desktop Screens "CoursePath" and "Main" (no reference draws it): "‹ Your talks", the talk's card with its tile and date, then today's step as a card (or Sage's note when there is no plan), the parts as rows, and beside them on a computer the coming days and the run-throughs in a Chart Kit card

// Load React's state and effect tools
import { useEffect, useState, type FormEvent } from "react";
// Load the app's link
import Link from "next/link";
// Load the back arrow
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
// Load the shared button styles
import { PRIMARY, QUIET, SecondaryLink, TEXT_LINK } from "@/components/script/Buttons";
// Load the page heading with the main navigation
import { Masthead } from "@/components/script/Masthead";
// Load the card for a page that has nothing to show
import { StopCard } from "@/components/script/StopCard";
// Load the mode tile
import { ModeTile } from "@/components/scenes/ModeTile";
// Load each kind's tile
import { SCENE_TILES } from "@/components/scenes/modeTileFor";
// Load the cast
import { Cast } from "@/components/scenes/Cast";
// Load the Chart Kit's frame
import { ChartCard, Em } from "@/components/charts/ChartCard";
// Load the shared screen set-up
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the calendar helpers
import { addDays, dayKey } from "@/core/dates";
// Load the event-prep rules
import { daysUntil, eventPlan, prepHeadline, runTimes, stepTasks, stepText, talkSections, taskProgress, type Ladder, type RunTime } from "@/core/eventPrep";
// Load the clock formatter
import { formatClock } from "@/core/recordingRules";
// Load the record types
import type { SessionRecord, TalkRecord } from "@/data/records";
// Load the shared looks
import { BUBBLE, CARD, CARD_LIST, CHIP, CHIP_GOOD, LAB, SECTION_HEADING } from "@/components/script/textStyles";
// Load the shared page shell
import { PAGE } from "@/components/script/layout";

// What the page needs from storage
interface Loaded {
  // The talk, or null if it is not on this device
  talk: TalkRecord | null;
  // Every rehearsal of it
  sessions: SessionRecord[];
}

// The talk's tile: a flag on coral, as on Practice
const TALK_TILE = SCENE_TILES["your-talk"];

// The address that opens a rehearsal of a talk, a section, at a rung of the memory ladder
function rehearseHref(talkId: string, sectionIndex: number | null, ladder: Ladder): string {
  // The section part, if any
  const section = sectionIndex === null ? "" : `&section=${sectionIndex}`;
  // The full address
  return `/session?mode=rehearse&prompt=${talkId}${section}&ladder=${ladder}`;
}

// A day written out, such as "Thursday, October 22"
function longDay(day: Date): string {
  // Weekday, month and day
  return day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

// The way back to the list of talks
function BackToTalks() {
  // A small green link with an arrow
  return <p className="mt-1 md:-mt-12"><Link href="/rehearse" className={`${TEXT_LINK} -ml-1 gap-1 text-footnote`}><CaretLeftIcon aria-hidden="true" weight="bold" className="size-4" />Your talks</Link></p>;
}

// The talk's page
export function TalkScreen({ talkId, ...props }: ScreenProps & { talkId: string }) {
  // The repository and today (null until in the browser)
  const { repo, today } = useScreenBasics(props);
  // The talk and its rehearsals, once loaded
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  // The date being typed in
  const [dateInput, setDateInput] = useState("");
  // The browser's reason when the talk could not be read, so the page explains instead of staying empty
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load the talk and its rehearsals
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read both
    Promise.all([repo.getTalk(talkId), repo.listSessions()]).then(([talk, sessions]) => {
      // Stop if closed
      if (cancelled) return;
      // Keep the talk and its rehearsals
      setLoaded({ talk: talk ?? null, sessions: sessions.filter((session) => session.mode === "rehearse" && session.promptId === talkId) });
      // Start the date field at the saved date
      setDateInput(talk?.eventDate ?? "");
    }).catch((error: unknown) => {
      // Keep the reason to show, if still open
      if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error));
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, talkId]);

  // Save the date (or clear it when the field is empty)
  async function saveDate(event: FormEvent) {
    // Stay on the page
    event.preventDefault();
    // Nothing to change before loading
    if (!loaded?.talk) return;
    // The new talk record
    const talk: TalkRecord = { ...loaded.talk, eventDate: /^\d{4}-\d{2}-\d{2}$/.test(dateInput) ? dateInput : null };
    // Save it
    await repo.saveTalk(talk);
    // Show it
    setLoaded({ ...loaded, talk });
  }

  // The talk could not be read: why, and the way back
  if (!loaded && loadError !== null) {
    // Say so, in one card
    return (
      <main id="main" className={PAGE}>
        {/* Heading and navigation */}
        <Masthead title="Your talk" section="practice" />
        {/* The way back */}
        <BackToTalks />
        {/* What happened */}
        <div className="mt-4">
          <StopCard who="you" face="wonder" label="Your talk" title="This talk couldn’t be loaded." detail={<span role="alert">This talk could not be loaded. The browser said: “{loadError}” Reload the page to try again.</span>}>
            {/* The way back */}
            <Link href="/rehearse" className={PRIMARY}>Back to your talks</Link>
          </StopCard>
        </div>
      </main>
    );
  }

  // Still loading, or not yet in the browser
  if (!loaded || !today) return <main id="main" className={PAGE}><Masthead title="Your talk" section="practice" /></main>;

  // The talk is not here
  if (!loaded.talk) {
    // Say so, with a way back
    return (
      <main id="main" className={PAGE}>
        {/* Heading and navigation */}
        <Masthead title="Your talk" section="practice" />
        {/* The way back */}
        <BackToTalks />
        {/* The note */}
        <div className="mt-4">
          <StopCard who="you" face="wonder" label="Your talk" title="This talk isn’t here." detail="This talk is not on this device. It may have been deleted, or saved in another browser.">
            {/* The way back */}
            <Link href="/rehearse" className={PRIMARY}>Back to your talks</Link>
          </StopCard>
        </div>
      </main>
    );
  }

  // The talk
  const talk = loaded.talk;
  // Its sections
  const sections = talkSections(talk.body);
  // Days to the talk, if it has a date
  const daysLeft = talk.eventDate ? daysUntil(talk.eventDate, today) : null;
  // The plan from today, if there is one
  const plan = daysLeft !== null ? eventPlan(daysLeft) : null;
  // Today's step
  const step = plan?.[0] ?? null;
  // Today's tasks
  const tasks = step ? stepTasks(step, sections.length) : [];
  // Today's rehearsals
  const todays = loaded.sessions.filter((session) => dayKey(new Date(session.createdAt)) === dayKey(today));
  // Runs done for each task
  const done = taskProgress(tasks, todays);
  // Whole run-throughs, oldest first
  const runs = runTimes(loaded.sessions, talk.id);

  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="Your talk" section="practice" />
      {/* The way back */}
      <BackToTalks />

      {/* The talk: its tile, its name, when it is, and a way to set or change the date */}
      <section aria-labelledby="talk-title" data-wide className={`mt-3 flex flex-wrap items-center gap-x-6 gap-y-4 p-5 md:p-6 ${CARD}`}>
        {/* The tile */}
        <ModeTile ground={TALK_TILE.ground} prop={TALK_TILE.prop} face={TALK_TILE.face} tilt={-4} motion="few" className="size-20 md:size-24" />
        {/* The words */}
        <div className="flex min-w-0 flex-[1_1_14rem] flex-col gap-1">
          {/* Small label */}
          <p className={LAB}>Your talk{talk.goalMinutes ? ` · goal ${talk.goalMinutes} min` : ""}</p>
          {/* The talk's name */}
          <h1 id="talk-title" className="font-display text-statement leading-tight font-semibold">{talk.title}</h1>
          {/* When */}
          <p className="font-bold text-ink-muted">{daysLeft === null ? "No date yet" : daysLeft < 0 ? "Its date has gone by" : longDay(addDays(today, daysLeft))}</p>
        </div>
        {/* The date */}
        <form onSubmit={(event) => void saveDate(event)} className="flex flex-wrap items-end gap-3">
          {/* The date field */}
          <label className="flex flex-col gap-1">
            {/* Its name */}
            <span className={LAB}>Date of the talk</span>
            {/* The field */}
            <input type="date" value={dateInput} onChange={(event) => setDateInput(event.target.value)} className="min-h-11 rounded-[14px] border-2 border-rule bg-paper px-3 py-1 font-bold" />
          </label>
          {/* Save it */}
          <button type="submit" className={QUIET}>Save date</button>
        </form>
      </section>

      {/* Today and the parts, with the days ahead and the runs beside them on a computer */}
      <div data-wide className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Today's step */}
          {step && daysLeft !== null && (
            <section aria-labelledby="today-step" className={`p-5 md:p-6 ${CARD}`}>
              {/* Small label */}
              <p className={LAB}>Today</p>
              {/* What to do today */}
              <p id="today-step" className="mt-1 font-display text-cue leading-snug font-semibold">{prepHeadline(daysLeft, step)}</p>
              {/* Each task, with progress and a link */}
              <ul aria-label="Today" className="mt-4 divide-y-2 divide-rule">
                {/* One row per task */}
                {tasks.map((task, index) => (
                  // One task: its name, the runs so far as a pill, and the rehearsal
                  <li key={index} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                    {/* What to rehearse */}
                    <span className="min-w-0 flex-1 font-display text-lg font-semibold">{task.label}</span>
                    {/* How many runs so far */}
                    <span className={(done[index] ?? 0) >= task.times ? CHIP_GOOD : CHIP}>{done[index] ?? 0} of {task.times}</span>
                    {/* Open the rehearsal */}
                    <SecondaryLink href={rehearseHref(talk.id, task.sectionIndex, task.ladder)}>Rehearse</SecondaryLink>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* A date that has passed, or no date yet: Sage's note */}
          {(daysLeft === null || daysLeft < 0) && (
            <div className="flex items-end gap-3">
              {/* Sage */}
              <Cast who="sage" mood={daysLeft === null ? "encouraging" : "calm"} className="size-16 flex-none md:size-20" />
              {/* The note */}
              <p className={`${BUBBLE} mb-4 max-w-[52ch] rounded-[22px] px-5 py-4 text-lede leading-snug`}>{daysLeft === null ? "Set the date of the talk and VoiceLab will plan each day until then: sections first, then the opening and close, then whole runs with less and less text." : "The date has passed. Rehearse any part below, or set a new date for a plan."}</p>
            </div>
          )}

          {/* Every part, any time */}
          <section aria-labelledby="any-part">
            {/* Heading */}
            <h2 id="any-part" className={SECTION_HEADING}>Practise any part</h2>
            {/* One row per section, then the whole talk */}
            <ul className={`mt-3 ${CARD_LIST}`}>
              {/* Each section */}
              {sections.map((section, index) => (
                // One section
                <li key={index} className="flex min-h-16 items-center gap-4 py-2.5">
                  {/* Its number */}
                  <span aria-hidden="true" className="grid size-8 flex-none place-items-center rounded-full bg-paper font-display font-semibold">{index + 1}</span>
                  {/* The start of it */}
                  <span className="min-w-0 flex-1 truncate font-semibold"><span className="sr-only">{index + 1}. </span>{section.split("\n")[0]}</span>
                  {/* Rehearse it */}
                  <SecondaryLink href={rehearseHref(talk.id, index, "full")} label={`section ${index + 1}`}>Rehearse</SecondaryLink>
                </li>
              ))}
              {/* The whole talk, at each rung */}
              <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                {/* Its name */}
                <span className="min-w-0 flex-[1_1_100%] font-display text-lg font-semibold">The whole talk</span>
                {/* With the text */}
                <SecondaryLink href={rehearseHref(talk.id, null, "full")}>with the text</SecondaryLink>
                {/* From keywords */}
                <SecondaryLink href={rehearseHref(talk.id, null, "keywords")}>from keywords</SecondaryLink>
                {/* From memory */}
                <SecondaryLink href={rehearseHref(talk.id, null, "none")}>from memory</SecondaryLink>
              </li>
            </ul>
            {/* How sections are made */}
            <p className="mt-2 text-footnote font-bold text-ink-muted">Sections are split at blank lines in your text.</p>
          </section>
        </div>

        {/* The side: the days ahead and the runs */}
        <div className="flex min-w-0 flex-col gap-6">
          {/* The coming days */}
          {plan && plan.length > 1 && (
            <section aria-labelledby="coming-days" className={`p-5 ${CARD}`}>
              {/* Small heading */}
              <h2 id="coming-days" className={LAB}>The coming days</h2>
              {/* Up to a week ahead */}
              <ol className="mt-3 flex flex-col gap-3">
                {/* One line per day */}
                {plan.slice(1, 8).map((later, index) => (
                  // One day: a dot on the path, the day, and what it holds
                  <li key={index} className="flex gap-3">
                    {/* The dot */}
                    <span aria-hidden="true" className="mt-1.5 size-3 flex-none rounded-full border-2 border-accent" />
                    {/* The day and what it holds */}
                    <span className="flex min-w-0 flex-col">
                      {/* The day */}
                      <span className="font-display font-semibold">{addDays(today, index + 1).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                      {/* What it holds */}
                      <span className="text-footnote font-bold text-ink-muted">{stepText(later.kind)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* How long each whole run took */}
          {runs.length > 0 && <RunChart runs={runs} goalSeconds={talk.goalMinutes ? talk.goalMinutes * 60 : null} />}
        </div>
      </div>
    </main>
  );
}

// Whole run-throughs in the Chart Kit's frame: a table with a bar for each run's length; the latest run in the "went well" colour, earlier ones as grey ghosts, the goal as a dashed line
function RunChart({ runs, goalSeconds }: { runs: ReadonlyArray<RunTime>; goalSeconds: number | null }) {
  // The longest length shown, so bars and the goal share one scale (with a little room)
  const scale = Math.max(goalSeconds ?? 0, ...runs.map((run) => run.seconds)) * 1.1;
  // Where the goal sits across the bar area, as a percentage
  const goalAt = goalSeconds ? (goalSeconds / scale) * 100 : null;
  // The latest run
  const last = runs[runs.length - 1]!;
  // Draw the card
  return (
    <ChartCard id="run-throughs" label="Whole run-throughs" heading="label" headline={<>Your last run took <Em>{formatClock(Math.round(last.seconds))}</Em>.</>} note={goalSeconds ? <span>Goal {formatClock(goalSeconds)}</span> : undefined}>
      {/* One row per run */}
      <table aria-label="Run-throughs" className="mt-1 w-full border-collapse">
        {/* Column names, for screen readers */}
        <thead className="sr-only">
          {/* The header row */}
          <tr>
            {/* Date */}
            <th scope="col">Date</th>
            {/* Bar */}
            <th scope="col">Length as a bar</th>
            {/* Length */}
            <th scope="col">Length</th>
          </tr>
        </thead>
        {/* The runs */}
        <tbody>
          {/* Each run */}
          {runs.map((run, index) => (
            // One run
            <tr key={run.id} title={`${new Date(run.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${formatClock(Math.round(run.seconds))}`}>
              {/* The date */}
              <td className="w-16 py-1.5 pr-3 text-footnote font-bold text-ink-muted">{new Date(run.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
              {/* The bar, with the goal line behind it */}
              <td className="relative py-1.5" aria-hidden="true">
                {/* The goal line */}
                {goalAt !== null && <span className="absolute inset-y-0 border-l-2 border-dashed border-chart-ghost" style={{ left: `${goalAt}%` }} />}
                {/* The bar: thick and rounded, latest run in the "went well" colour */}
                <span className={`block h-3.5 rounded-full ${index === runs.length - 1 ? "bg-chart-well" : "bg-chart-ghost"}`} style={{ width: `${(run.seconds / scale) * 100}%` }} />
              </td>
              {/* The length */}
              <td className="w-14 py-1.5 pl-3 text-right font-bold tabular-nums">{formatClock(Math.round(run.seconds))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ChartCard>
  );
}
