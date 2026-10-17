"use client";
// Practice: every way to speak on the spot, each with what it is for and where to start (UX round, 2026-10-15)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the page heading with the main navigation
import { Masthead } from "@/components/script/Masthead";
// Load the shared button styles
import { PrimaryLink, RowLink, SecondaryLink } from "@/components/script/Buttons";
// Load the days-left counter, for a talk's date
import { daysUntil } from "@/core/eventPrep";
// Load the talk record type
import type { TalkRecord } from "@/data/records";
// Load a mode's heading and description
import { ModeHeader } from "@/components/script/ModeHeader";
// Load the shared card
import { Card } from "@/components/script/Card";
// Load an icon for each mode
import { ChatsCircleIcon, LightningIcon, NotePencilIcon, QuotesIcon } from "@phosphor-icons/react/dist/ssr";
// Load the shared screen set-up
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load this week's challenge
import { WeeklyChallenge } from "@/components/screens/WeeklyChallenge";
// Load the catalogue
import { MODES, type ModeInfo } from "@/content/modes";
// Load the day's pickers
import { promptForDay, tableTopicForDay } from "@/content/prompts";

// The catalogue entry for an id (always present for the ids used here)
const mode = (id: string) => MODES.find((item) => item.id === id) as ModeInfo;

// When a talk is, in a few words ("today", "in 3 days"), or nothing once it has passed
function talkWhen(days: number): string | undefined {
  // Past: say nothing
  if (days < 0) return undefined;
  // Today, tomorrow, or later
  return days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
}

// The page
export function PracticeScreen(props: ScreenProps) {
  // The repository and today (null until in the browser)
  const { repo, today } = useScreenBasics(props);
  // How many prompts along from today's ("choose another" adds one)
  const [offset, setOffset] = useState(0);
  // The newest rehearsal or prepared speech, for Q&A (undefined while loading)
  const [qaFrom, setQaFrom] = useState<string | null | undefined>(undefined);
  // The user's saved talks (null while loading)
  const [talks, setTalks] = useState<TalkRecord[] | null>(null);

  // Find the newest rehearsal or prepared speech
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the sessions (newest first)
    repo.listSessions().then((sessions) => {
      // Keep the newest that Q&A can follow
      if (!cancelled) setQaFrom(sessions.find((session) => session.mode === "rehearse" || session.mode === "response")?.id ?? null);
    });
    // Read the saved talks
    repo.listTalks().then((saved) => {
      // Keep them if the page is still open
      if (!cancelled) setTalks(saved);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo]);

  // Today's Table Topic and prepared-answer prompt
  const topic = today ? tableTopicForDay(today, offset) : null;
  // The prompt
  const prompt = today ? promptForDay(today, offset) : null;

  // Draw the page
  return (
    <main className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Heading and navigation */}
      <Masthead title="Practice" section="practice" />

      {/* Your own talks first (what used to be the Talks tab) */}
      <section aria-labelledby="your-talks" className="mt-6">
        {/* Run-in heading */}
        <h2 id="your-talks" className="italic">Your talks</h2>
        {/* Each saved talk, then a way to add one */}
        {talks && (
          <ul className="mt-2 divide-y divide-rule border-y border-rule">
            {/* Each talk */}
            {talks.map((talk) => (
              // One talk, with its date if it has one
              <li key={talk.id}><RowLink href={`/talk?id=${talk.id}`} meta={talk.eventDate && today ? talkWhen(daysUntil(talk.eventDate, today)) : undefined}>{talk.title}</RowLink></li>
            ))}
            {/* Add or rehearse */}
            <li><RowLink href="/rehearse">{talks.length > 0 ? "Add a talk, or rehearse one" : "Preparing a talk? Save it and rehearse it here"}</RowLink></li>
          </ul>
        )}
      </section>

      {/* Speaking on the spot */}
      <h2 className="mt-10 italic">Speak on the spot</h2>
      {/* What this is */}
      <p className="mt-2 max-w-[52ch] text-lede">Practise speaking without a script. Each takes a few minutes, and afterwards you get one specific fix.</p>

      {/* Each mode */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {/* A Table Topic */}
        <Card labelledBy="table-topic" icon={LightningIcon}>
          {/* What it is */}
          <ModeHeader mode={mode("table-topic")} />
          {/* Start it */}
          {topic && <p className="mt-auto pt-3"><PrimaryLink href={`/session?mode=talk&prompt=${topic.id}`}>Start a Table Topic</PrimaryLink></p>}
        </Card>

        {/* A prepared speech */}
        <Card labelledBy="prepared" icon={NotePencilIcon}>
          {/* What it is */}
          <ModeHeader mode={mode("prepared")} />
          {/* Today's task */}
          {prompt && <p className="mt-3 font-display text-cue">“{prompt.text}”</p>}
          {/* Start it, or swap the task */}
          <p className="mt-auto flex flex-wrap items-baseline gap-x-4 gap-y-2 pt-3">
            {/* Start */}
            {prompt && <PrimaryLink href={`/session?mode=response&prompt=${prompt.id}`}>Start a prepared speech</PrimaryLink>}
            {/* Another task */}
            <button type="button" onClick={() => setOffset(offset + 1)} className="inline-flex min-h-11 items-center italic text-ink-muted underline underline-offset-4">or choose another</button>
          </p>
        </Card>

        {/* Openings and closings */}
        <Card labelledBy="openings" icon={QuotesIcon}>
          {/* What it is */}
          <ModeHeader mode={mode("openings")} />
          {/* Its page */}
          <p className="mt-auto pt-3"><SecondaryLink href="/bookends">Choose an opening or a close</SecondaryLink></p>
        </Card>

        {/* Q&A practice */}
        <Card labelledBy="qa" icon={ChatsCircleIcon}>
          {/* What it is */}
          <ModeHeader mode={mode("qa")} />
          {/* Its page, once there is something to ask about */}
          {qaFrom ? (
            // The newest rehearsal or prepared speech
            <p className="mt-auto pt-3"><SecondaryLink href={`/qa?from=${qaFrom}`}>Practise Q&amp;A on your latest run</SecondaryLink></p>
          ) : (
            // Nothing yet
            qaFrom === null && <p className="mt-3 text-footnote italic text-ink-muted">Opens after a rehearsal or a prepared speech: the questions come from what you said.</p>
          )}
        </Card>
      </div>

      {/* This week's challenge off the page */}
      {today && <WeeklyChallenge repo={repo} today={today} />}
    </main>
  );
}
