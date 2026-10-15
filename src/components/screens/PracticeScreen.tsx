"use client";
// Practice: every way to speak on the spot, each with what it is for and where to start (UX round, 2026-10-15)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the app's link
import Link from "next/link";
// Load the page heading with the main navigation
import { Masthead } from "@/components/script/Masthead";
// Load a mode's heading and description
import { ModeHeader } from "@/components/script/ModeHeader";
// Load the shared screen set-up
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the catalogue
import { MODES, type ModeInfo } from "@/content/modes";
// Load the day's pickers
import { promptForDay, tableTopicForDay } from "@/content/prompts";

// The catalogue entry for an id (always present for the ids used here)
const mode = (id: string) => MODES.find((item) => item.id === id) as ModeInfo;

// The page
export function PracticeScreen(props: ScreenProps) {
  // The repository and today (null until in the browser)
  const { repo, today } = useScreenBasics(props);
  // How many prompts along from today's ("choose another" adds one)
  const [offset, setOffset] = useState(0);
  // The newest rehearsal or prepared answer, for Q&A (undefined while loading)
  const [qaFrom, setQaFrom] = useState<string | null | undefined>(undefined);

  // Find the newest rehearsal or prepared answer
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the sessions (newest first)
    repo.listSessions().then((sessions) => {
      // Keep the newest that Q&A can follow
      if (!cancelled) setQaFrom(sessions.find((session) => session.mode === "rehearse" || session.mode === "response")?.id ?? null);
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
      <Masthead title="Speak on the spot" section="practice" />
      {/* What this is */}
      <p className="mt-6 max-w-[52ch] text-lede">Practise speaking without a script. Each takes a few minutes, and afterwards you get one specific fix.</p>

      {/* Each mode */}
      <div className="mt-8 divide-y divide-rule border-y border-ink">
        {/* A Table Topic */}
        <section className="py-5">
          {/* What it is */}
          <ModeHeader mode={mode("table-topic")} />
          {/* Start it */}
          {topic && <Link href={`/session?mode=talk&prompt=${topic.id}`} className="mt-3 inline-block bg-accent px-4 py-1.5 text-accent-ink">Start a Table Topic</Link>}
        </section>

        {/* A prepared answer */}
        <section className="py-5">
          {/* What it is */}
          <ModeHeader mode={mode("prepared")} />
          {/* Today's task */}
          {prompt && <p className="mt-3 font-display text-cue">“{prompt.text}”</p>}
          {/* Start it, or swap the task */}
          <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            {/* Start */}
            {prompt && <Link href={`/session?mode=response&prompt=${prompt.id}`} className="inline-block bg-accent px-4 py-1.5 text-accent-ink">Start a prepared answer</Link>}
            {/* Another task */}
            <button type="button" onClick={() => setOffset(offset + 1)} className="italic text-ink-muted underline underline-offset-4">or choose another</button>
          </p>
        </section>

        {/* Openings and closings */}
        <section className="py-5">
          {/* What it is */}
          <ModeHeader mode={mode("openings")} />
          {/* Its page */}
          <Link href="/bookends" className="mt-3 inline-block underline underline-offset-4">Choose an opening or a close</Link>
        </section>

        {/* Q&A practice */}
        <section className="py-5">
          {/* What it is */}
          <ModeHeader mode={mode("qa")} />
          {/* Its page, once there is something to ask about */}
          {qaFrom ? (
            // The newest rehearsal or prepared answer
            <Link href={`/qa?from=${qaFrom}`} className="mt-3 inline-block underline underline-offset-4">Practise Q&amp;A on your latest run</Link>
          ) : (
            // Nothing yet
            qaFrom === null && <p className="mt-3 text-footnote italic text-ink-muted">Opens after a rehearsal or a prepared answer: the questions come from what you said.</p>
          )}
        </section>
      </div>

      {/* Your own talk lives elsewhere */}
      <p className="mt-8 text-footnote italic text-ink-muted">
        {/* The pointer */}
        Preparing a talk of your own? <Link href="/rehearse" className="underline underline-offset-4">Go to Talks</Link>.
      </p>
    </main>
  );
}
