"use client";
// Your check-ins (decision 100): today's check-in or when the next one is, quick ways to compare, and every check-in so far, newest first

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Masthead } from "@/components/script/Masthead";
import { PageTitle } from "@/components/script/PageTitle";
import { Skeleton } from "@/components/script/Skeleton";
// Load the shared looks
import { RowLink, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
import { CARD, SECTION_HEADING } from "@/components/script/textStyles";
import { PAGE } from "@/components/script/layout";
// Load the shared screen starting points and the tab title
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the check-in rules
import { CHECK_IN_PARTS, checkInId, checkInWeekday, dayWords, firstUseOf, isFinished, nextAfter, readCheckInSettings, recordedCheckIns, shortDay } from "@/core/checkIn";
// Load the check-in reads
import { loadCheckIns, type CheckInData } from "@/data/checkIns";

// Draw the page
export function CheckInScreen(props: ScreenProps) {
  // The repository, and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // What was loaded
  const [data, setData] = useState<CheckInData | null>(null);
  // A load failure, said plainly
  const [problem, setProblem] = useState<string | null>(null);
  // Name the tab
  usePageTitle("Your check-ins");

  // Load once the date is known
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
  }, [repo, today]);

  // The check-ins with takes, newest first
  const recorded = data ? recordedCheckIns(data.checkIns).reverse() : [];
  // Today's check-in, if started
  const current = data && today ? data.checkIns.find((checkIn) => checkIn.id === checkInId(today)) : undefined;
  // Whether one can be done today: a check-in day, one under way, or the very first
  const open = !!data && (data.schedule.due || (!!current && !isFinished(current)) || recorded.length === 0) && !isFinished(current);
  // The weekday check-ins fall on
  const weekday = data ? checkInWeekday(readCheckInSettings(data.settings.checkIn), data.checkIns, firstUseOf(data.sessions)) : null;
  // The next check-in day, in words
  const next = data && today ? (data.schedule.next ?? (weekday !== null ? nextAfter(today, weekday) : null)) : null;

  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* The masthead, under Today */}
      <Masthead title="VoiceLab" section="today" />
      {/* The page's name */}
      <PageTitle title="Your check-ins">The same four parts each week: read, pitch, story and a surprise question.</PageTitle>
      {/* Until loaded */}
      {!data && !problem && <Skeleton blocks={["h-24", "h-56"]} />}
      {/* A failure */}
      {problem !== null && <p role="alert" className="mt-6 max-w-[48ch]">Your check-ins could not be loaded. The browser said: “{problem}” Reload the page to try again.</p>}
      {/* Today, or when the next one is */}
      {data && (
        <section aria-label="This week" className={`mt-6 p-5 ${CARD}`}>
          {/* The state in a line */}
          <p className="font-display text-cue font-semibold tracking-tight">{open ? (recorded.length === 0 ? "Your first check-in sets your starting point." : current ? "Your check-in is under way." : "Today is check-in day.") : next ? `Next check-in: ${dayWords(next)}.` : "Your first check-in comes after your first day."}</p>
          {/* The day can be changed */}
          <p className="mt-1 text-footnote text-ink-muted">About 6 minutes. <Link href="/settings#check-in" className={TEXT_LINK}>Change the day</Link></p>
        </section>
      )}
      {/* Quick ways to compare, once there are two */}
      {recorded.length >= 2 && (
        <p className="mt-5 flex flex-wrap gap-3">
          {/* First and latest */}
          <Link href="/check-in/compare" className={SECONDARY}>First and latest</Link>
          {/* Last time and this time, when different from first and latest */}
          {recorded.length >= 3 && <Link href={`/check-in/compare?a=${recorded[1]!.id}&b=${recorded[0]!.id}`} className={SECONDARY}>Last two</Link>}
        </p>
      )}
      {/* Every check-in, newest first */}
      {recorded.length > 0 && (
        <section aria-labelledby="all-check-ins" className="mt-8">
          {/* Heading */}
          <h2 id="all-check-ins" className={SECTION_HEADING}>So far</h2>
          {/* The list */}
          <ul aria-label="Your check-ins" className={`mt-3 divide-y divide-rule px-4 ${CARD}`}>
            {/* Each one, linking to it beside the first (the first itself beside the latest) */}
            {recorded.map((checkIn) => (
              <li key={checkIn.id}>
                <RowLink href={recorded.length >= 2 ? `/check-in/compare?a=${recorded.at(-1)!.id === checkIn.id ? checkIn.id : recorded.at(-1)!.id}&b=${recorded.at(-1)!.id === checkIn.id ? recorded[0]!.id : checkIn.id}` : `/sessions?id=${encodeURIComponent(Object.values(checkIn.takes)[0]!.id)}`} meta={`${Object.keys(checkIn.takes).length} of ${CHECK_IN_PARTS.length} parts`}>
                  {/* Its number and day */}
                  <span className="block">{checkIn.week === 1 ? "Your first check-in" : `Check-in ${checkIn.week}`}</span>
                  {/* (day) */}
                  <span className="block text-footnote text-ink-muted">{shortDay(checkIn.day)}</span>
                </RowLink>
              </li>
            ))}
          </ul>
        </section>
      )}
      {/* Start or carry on, when one can be done today */}
      {open && <ActionBand action={current ? "Continue check-in" : "Start check-in"} aside="about 6 min" href="/check-in/run" />}
    </main>
  );
}
