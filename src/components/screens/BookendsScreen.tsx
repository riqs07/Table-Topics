"use client";
// Openings and closings: short drills on the first and last 45 seconds of a talk (plan step B2)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the shared button and row styles
import { RowLink, SecondaryLink } from "@/components/script/Buttons";
// Load the folded group card
import { FoldCard } from "@/components/script/FoldCard";
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
// Load the shared heading look
import { SECTION_HEADING, CARD_LIST } from "@/components/script/textStyles";
// Load the shared page shell
import { PAGE } from "@/components/script/layout";

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
    <main id="main" className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="Openings and closings" section="practice" />

      {/* Why this exists */}
      <p className="mt-6 max-w-[52ch] text-lede">The first and last 45 seconds of a talk, on their own.</p>

      {/* Today's pair */}
      {pair && (
        <section className="mt-8">
          {/* Small heading */}
          <h2 className={SECTION_HEADING}>Today</h2>
          {/* The two prompts */}
          <ul className={`mt-2 ${CARD_LIST}`}>
            {/* Each one */}
            {pair.map((item) => (
              // One prompt
              <li key={item.id}>
                {/* The whole row starts the drill */}
                <RowLink href={drillHref(item)} label={item.text}>
                  {/* Its part */}
                  <span className="block text-footnote text-ink-muted">{item.part === "opening" ? "Opening" : "Close"}</span>
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
          <h2 className={SECTION_HEADING}>From your talks</h2>
          {/* One row per talk */}
          <ul className={`mt-2 ${CARD_LIST}`}>
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

      {/* Every other prompt, folded until wanted (decision 67), as rounded cards (decision 79) */}
      <section aria-label="More prompts" className="mt-10 flex flex-col gap-2">
        {/* Openings, then closes */}
        {(["opening", "close"] as const).map((part) => {
          // The prompts not already offered today
          const rest = BOOKENDS.filter((item) => item.part === part && !pair?.some((today) => today.id === item.id));
          // One folded list
          return (
            <FoldCard key={part} name={part === "opening" ? "More openings" : "More closes"} count={rest.length}>
              {/* The prompts */}
              <ul className="divide-y divide-rule">
                {/* Each prompt */}
                {rest.map((item) => (
                  // One prompt
                  <li key={item.id}>
                    {/* The link */}
                    <RowLink href={drillHref(item)}>{item.text}</RowLink>
                  </li>
                ))}
              </ul>
            </FoldCard>
          );
        })}
      </section>
    </main>
  );
}
