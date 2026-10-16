"use client";
// Openings and closings: short drills on the first and last 45 seconds of a talk (plan step B2)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the shared button and row styles
import { RowLink, SecondaryLink } from "@/components/script/Buttons";
// Load the page heading with the main navigation
import { Masthead } from "@/components/script/Masthead";
// Load the shared screen set-up
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the openings and closings prompts
import { BOOKENDS, bookendForDay, type Bookend } from "@/content/prompts";
// Load the section splitter
import { talkSections } from "@/core/eventPrep";
// Load the talk record type
import type { TalkRecord } from "@/data/records";

// The address of a drill on one prompt
const drillHref = (item: Bookend) => `/session?mode=bookend&prompt=${item.id}`;

// The address of a rehearsal of one section of a talk
const sectionHref = (talk: TalkRecord, index: number) => `/session?mode=rehearse&prompt=${talk.id}&section=${index}&ladder=full`;

// The page
export function BookendsScreen(props: ScreenProps) {
  // The repository and today (null until in the browser)
  const { repo, today } = useScreenBasics(props);
  // Saved talks (null while loading)
  const [talks, setTalks] = useState<TalkRecord[] | null>(null);

  // Load the talks
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read them
    repo.listTalks().then((loaded) => {
      // Keep them if still open
      if (!cancelled) setTalks(loaded);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo]);

  // Today's opening and close
  const pair = today ? ([bookendForDay(today, "opening"), bookendForDay(today, "close")] as const) : null;
  // Talks long enough to have a separate opening and close
  const sectioned = (talks ?? []).map((talk) => ({ talk, count: talkSections(talk.body).length })).filter((entry) => entry.count >= 2);

  // Draw the page
  return (
    <main className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Heading and navigation */}
      <Masthead title="Openings and closings" section="practice" />

      {/* Why this exists */}
      <p className="mt-6 max-w-[52ch] text-lede">An audience decides in the first seconds whether to listen, and remembers the last thing you say. Practise just those parts: 45 seconds, then stop.</p>

      {/* Today's pair */}
      {pair && (
        <section className="mt-8">
          {/* Small heading */}
          <h2 className="text-footnote italic text-ink-muted">Today</h2>
          {/* The two prompts */}
          <ul className="mt-2 divide-y divide-rule border-y border-ink">
            {/* Each one */}
            {pair.map((item) => (
              // One prompt
              <li key={item.id}>
                {/* The whole row starts the drill */}
                <RowLink href={drillHref(item)} label={item.text}>
                  {/* Its part */}
                  <span className="block text-footnote italic text-ink-muted">{item.part === "opening" ? "Opening" : "Close"}</span>
                  {/* The prompt */}
                  <span className="block font-display text-cue">{item.text}</span>
                </RowLink>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The opening and close of each talk */}
      {sectioned.length > 0 && (
        <section className="mt-10">
          {/* Small heading */}
          <h2 className="text-footnote italic text-ink-muted">From your talks</h2>
          {/* One row per talk */}
          <ul className="mt-2 divide-y divide-rule border-y border-rule">
            {/* Each talk */}
            {sectioned.map(({ talk, count }) => (
              // One talk
              <li key={talk.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-2">
                {/* Its title */}
                <span className="flex-1">{talk.title}</span>
                {/* Its first section */}
                <SecondaryLink href={sectionHref(talk, 0)} label={`Opening of “${talk.title}”`}>opening</SecondaryLink>
                {/* Its last section */}
                <SecondaryLink href={sectionHref(talk, count - 1)} label={`Close of “${talk.title}”`}>close</SecondaryLink>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Every prompt */}
      <section className="mt-10 grid gap-8 md:grid-cols-2">
        {/* Openings, then closes */}
        {(["opening", "close"] as const).map((part) => (
          // One list
          <div key={part}>
            {/* Small heading */}
            <h2 className="text-footnote italic text-ink-muted">{part === "opening" ? "More openings" : "More closes"}</h2>
            {/* The prompts */}
            <ul className="mt-2 divide-y divide-rule border-y border-rule">
              {/* Each prompt */}
              {BOOKENDS.filter((item) => item.part === part && !pair?.some((today) => today.id === item.id)).map((item) => (
                // One prompt
                <li key={item.id}>
                  {/* The link */}
                  <RowLink href={drillHref(item)}>{item.text}</RowLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
