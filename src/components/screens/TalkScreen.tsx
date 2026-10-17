"use client";
// A talk's own page: its date, today's step in the countdown plan, every part to practise, and how long each run took

// Load React's state and effect tools
import { useEffect, useState, type FormEvent } from "react";
// Load the app's link
import Link from "next/link";
// Load the shared button style
import { SecondaryLink } from "@/components/script/Buttons";
// Load the page heading with the main navigation
import { Masthead } from "@/components/script/Masthead";
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

// What the page needs from storage
interface Loaded {
  // The talk, or null if it is not on this device
  talk: TalkRecord | null;
  // Every rehearsal of it
  sessions: SessionRecord[];
}

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

// The talk's page
export function TalkScreen({ talkId, ...props }: ScreenProps & { talkId: string }) {
  // The repository and today (null until in the browser)
  const { repo, today } = useScreenBasics(props);
  // The talk and its rehearsals, once loaded
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  // The date being typed in
  const [dateInput, setDateInput] = useState("");

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

  // Still loading, or not yet in the browser
  if (!loaded || !today) return <main className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10"><Masthead title="Your talk" section="practice" /></main>;

  // The talk is not here
  if (!loaded.talk) {
    // Say so, with a way back
    return (
      <main className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
        {/* Heading and navigation */}
        <Masthead title="Your talk" section="practice" />
        {/* The note */}
        <p className="mt-6 text-lede">This talk is not on this device. It may have been deleted, or saved in another browser.</p>
        {/* The way back */}
        <Link href="/rehearse" className="mt-4 inline-flex min-h-11 items-center underline underline-offset-4">Back to your talks</Link>
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
    <main className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Heading and navigation */}
      <Masthead title={talk.title} section="practice" />

      {/* When the talk is, and a way to set or change it */}
      <form onSubmit={(event) => void saveDate(event)} className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        {/* The date field */}
        <label className="flex items-baseline gap-3">
          {/* Its name */}
          <span>Date of the talk</span>
          {/* The field */}
          <input type="date" value={dateInput} onChange={(event) => setDateInput(event.target.value)} className="min-h-11 border-b border-ink bg-transparent py-1" />
        </label>
        {/* Save it */}
        <button type="submit" className="inline-flex min-h-11 items-center underline underline-offset-4">Save date</button>
        {/* The saved date, written out */}
        {talk.eventDate && daysLeft !== null && daysLeft >= 0 && <span className="text-footnote italic text-ink-muted">{longDay(addDays(today, daysLeft))}</span>}
      </form>

      {/* Today's step */}
      {step && daysLeft !== null && (
        <section className="mt-8 border-y border-ink py-5">
          {/* What to do today */}
          <p className="font-display text-statement leading-snug">{prepHeadline(daysLeft, step)}</p>
          {/* Each task, with progress and a link */}
          <ul aria-label="Today" className="mt-4 divide-y divide-rule">
            {/* One row per task */}
            {tasks.map((task, index) => (
              // One task
              <li key={index} className="flex items-baseline gap-4 py-2">
                {/* What to rehearse */}
                <span className="flex-1">{task.label}</span>
                {/* How many runs so far */}
                <span className={`text-footnote italic ${(done[index] ?? 0) >= task.times ? "text-ink" : "text-ink-muted"}`}>{done[index] ?? 0} of {task.times}</span>
                {/* Open the rehearsal */}
                <SecondaryLink href={rehearseHref(talk.id, task.sectionIndex, task.ladder)}>Rehearse</SecondaryLink>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* A date that has passed */}
      {daysLeft !== null && daysLeft < 0 && <p className="mt-8 text-lede">The date has passed. Rehearse any part below, or set a new date for a plan.</p>}

      {/* No date yet */}
      {daysLeft === null && <p className="mt-8 max-w-[52ch] text-lede">Set the date of the talk and VoiceLab will plan each day until then: sections first, then the opening and close, then whole runs with less and less text.</p>}

      {/* The coming days */}
      {plan && plan.length > 1 && (
        <section className="mt-8">
          {/* Small heading */}
          <h2 className="text-footnote italic text-ink-muted">The coming days</h2>
          {/* Up to a week ahead */}
          <ol className="mt-2 space-y-1">
            {/* One line per day */}
            {plan.slice(1, 8).map((later, index) => (
              // One day
              <li key={index}>
                {/* The day */}
                <span className="italic">{addDays(today, index + 1).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                {/* What it holds */}
                <span className="text-ink-muted"> · {stepText(later.kind)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Every part, any time */}
      <section className="mt-10">
        {/* Small heading */}
        <h2 className="text-footnote italic text-ink-muted">Practise any part</h2>
        {/* One row per section, then the whole talk */}
        <ul className="mt-2 divide-y divide-rule border-y border-rule">
          {/* Each section */}
          {sections.map((section, index) => (
            // One section
            <li key={index} className="flex items-baseline gap-4 py-2">
              {/* Its opening words */}
              <span className="min-w-0 flex-1 truncate">
                {/* Its number */}
                <span className="italic text-ink-muted">{index + 1}. </span>
                {/* The start of it */}
                {section.split("\n")[0]}
              </span>
              {/* Rehearse it */}
              <SecondaryLink href={rehearseHref(talk.id, index, "full")} label={`Rehearse section ${index + 1}`}>Rehearse</SecondaryLink>
            </li>
          ))}
          {/* The whole talk, at each rung */}
          <li className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-2">
            {/* Its name */}
            <span className="flex-1">The whole talk</span>
            {/* With the text */}
            <SecondaryLink href={rehearseHref(talk.id, null, "full")}>with the text</SecondaryLink>
            {/* From keywords */}
            <SecondaryLink href={rehearseHref(talk.id, null, "keywords")}>from keywords</SecondaryLink>
            {/* From memory */}
            <SecondaryLink href={rehearseHref(talk.id, null, "none")}>from memory</SecondaryLink>
          </li>
        </ul>
        {/* How sections are made */}
        <p className="mt-2 text-footnote italic text-ink-muted">Sections are split at blank lines in your text.</p>
      </section>

      {/* How long each whole run took */}
      {runs.length > 0 && <RunChart runs={runs} goalSeconds={talk.goalMinutes ? talk.goalMinutes * 60 : null} />}
    </main>
  );
}

// Whole run-throughs as a table with a bar for each run's length; the latest run in the accent, the goal as a line
function RunChart({ runs, goalSeconds }: { runs: ReadonlyArray<RunTime>; goalSeconds: number | null }) {
  // The longest length shown, so bars and the goal share one scale (with a little room)
  const scale = Math.max(goalSeconds ?? 0, ...runs.map((run) => run.seconds)) * 1.1;
  // Where the goal sits across the bar area, as a percentage
  const goalAt = goalSeconds ? (goalSeconds / scale) * 100 : null;
  // Draw the table
  return (
    <section className="mt-10">
      {/* Small heading, with the goal when there is one */}
      <h2 className="text-footnote italic text-ink-muted">
        {/* The name */}
        Whole run-throughs
        {/* The goal */}
        {goalSeconds && <span className="ml-3 not-italic">Goal {formatClock(goalSeconds)}</span>}
      </h2>
      {/* One row per run */}
      <table aria-label="Run-throughs" className="mt-2 w-full border-collapse">
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
              <td className="w-20 py-1 pr-3 text-footnote italic text-ink-muted">{new Date(run.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
              {/* The bar, with the goal line behind it */}
              <td className="relative py-1" aria-hidden="true">
                {/* The goal line */}
                {goalAt !== null && <span className="absolute inset-y-0 border-l border-dashed border-ink" style={{ left: `${goalAt}%` }} />}
                {/* The bar: thin, rounded at its end, latest run in the accent */}
                <span className={`block h-3 rounded-r ${index === runs.length - 1 ? "bg-accent" : "bg-ink-muted"}`} style={{ width: `${(run.seconds / scale) * 100}%` }} />
              </td>
              {/* The length */}
              <td className="w-14 py-1 pl-3 text-right tabular-nums">{formatClock(Math.round(run.seconds))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
