"use client";
// Your check-ins (decision 100): today's check-in or when the next one is, quick ways to compare, and every check-in so far, newest first. Drawn after storyboard "Weekly check-in" and Desktop Screens "Me" (second design pass): the check-in's tile beside the title, Sage's line over the four parts' tiles, then and now as a card, the check-ins as rows with tiles

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Masthead } from "@/components/script/Masthead";
import { PictureTitle } from "@/components/script/PictureTitle";
import { Skeleton } from "@/components/script/Skeleton";
// Load the shared looks
import { RowLink, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
import { BUBBLE, CARD, CARD_LIST, LAB, SECTION_HEADING } from "@/components/script/textStyles";
// Load the cast, the mode tiles and the check-in's tiles
import { Cast } from "@/components/scenes/Cast";
import { ModeTile } from "@/components/scenes/ModeTile";
import { CHECK_IN_TILE, CHECK_IN_TILES } from "@/components/script/checkInTiles";
import { PAGE } from "@/components/script/layout";
// Load the shared screen starting points and the tab title
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the check-in rules
import { CHECK_IN_PARTS, CHECK_IN_PART_INFO, checkInId, checkInWeekday, dayWords, firstUseOf, isFinished, nextAfter, readCheckInSettings, recordedCheckIns, shortDay } from "@/core/checkIn";
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

  // The line Sage says about this week
  const line = open ? (recorded.length === 0 ? "Your first check-in sets your starting point." : current ? "Your check-in is under way." : "Today is check-in day.") : next ? `Next check-in: ${dayWords(next)}.` : "Your first check-in comes after your first day.";

  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* The masthead, under Today */}
      <Masthead title="VoiceLab" section="today" />
      {/* The page's name, beside the check-in's tile */}
      <PictureTitle title="Your check-ins" picture={<ModeTile {...CHECK_IN_TILE} tilt={-4} className="size-14 md:size-22" />}>The same four parts each week: read, pitch, story and a surprise question.</PictureTitle>
      {/* Until loaded */}
      {!data && !problem && <Skeleton blocks={["h-24", "h-56"]} />}
      {/* A failure */}
      {problem !== null && <p role="alert" className={`mt-6 p-5 font-semibold ${CARD}`}><span className={`block ${LAB}`}>Not loaded</span>Your check-ins could not be loaded. The browser said: “{problem}” Reload the page to try again.</p>}
      {/* Today, or when the next one is: Sage says it, the four parts under it (storyboard "Weekly check-in") */}
      {data && (
        <section aria-label="This week" className={`mt-6 p-5 ${CARD}`}>
          {/* Sage and the state in a bubble */}
          <div className="flex items-end gap-3">
            {/* The coach */}
            <Cast who="sage" mood={open ? "encouraging" : "calm"} className="size-16 flex-none md:size-18" />
            {/* The state in a line */}
            <p className={`${BUBBLE} mb-2 font-display text-lg font-semibold md:text-xl`}>{line}</p>
          </div>
          {/* The four parts, as small tiles */}
          <ul aria-label="The parts" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Each part */}
            {CHECK_IN_PARTS.map((part) => (
              <li key={part} className="flex items-center gap-2.5 rounded-[16px] bg-paper px-2.5 py-2">
                {/* Its tile */}
                <ModeTile {...CHECK_IN_TILES[part]} tilt={-4} still className="size-10 flex-none" />
                {/* Its name */}
                <span className="min-w-0 text-sm leading-tight font-extrabold">{CHECK_IN_PART_INFO[part].name}</span>
              </li>
            ))}
          </ul>
          {/* The day can be changed */}
          <p className="mt-3 text-footnote font-semibold text-ink-muted">About 6 minutes. <Link href="/settings#check-in" className={TEXT_LINK}>Change the day</Link></p>
        </section>
      )}
      {/* Quick ways to compare, once there are two */}
      {recorded.length >= 2 && (
        <section aria-label="Compare" className={`mt-5 flex flex-wrap items-center gap-4 px-4.5 py-4 ${CARD}`}>
          {/* Then and now: you before and after */}
          <span aria-hidden="true" className="flex flex-none items-end"><Cast who="you" face="ready" still className="size-10" /><Cast who="you" face="happy" still className="-ml-1 size-13" /></span>
          {/* What it is */}
          <span className="min-w-0 flex-[1_1_12rem]">
            {/* The small label */}
            <span className={`block ${LAB}`}>Then and now</span>
            {/* What it does */}
            <span className="block font-display text-lg leading-tight font-semibold">Hear two check-ins side by side</span>
          </span>
          {/* The choices */}
          <span className="flex flex-wrap gap-3">
            {/* First and latest */}
            <Link href="/check-in/compare" className={SECONDARY}>First and latest</Link>
            {/* Last time and this time, when different from first and latest */}
            {recorded.length >= 3 && <Link href={`/check-in/compare?a=${recorded[1]!.id}&b=${recorded[0]!.id}`} className={SECONDARY}>Last two</Link>}
          </span>
        </section>
      )}
      {/* Every check-in, newest first */}
      {recorded.length > 0 && (
        <section aria-labelledby="all-check-ins" className="mt-8">
          {/* Heading */}
          <h2 id="all-check-ins" className={SECTION_HEADING}>So far</h2>
          {/* The list */}
          <ul aria-label="Your check-ins" className={`mt-3 ${CARD_LIST}`}>
            {/* Each one, linking to it beside the first (the first itself beside the latest) */}
            {recorded.map((checkIn) => (
              <li key={checkIn.id}>
                <RowLink href={recorded.length >= 2 ? `/check-in/compare?a=${recorded.at(-1)!.id === checkIn.id ? checkIn.id : recorded.at(-1)!.id}&b=${recorded.at(-1)!.id === checkIn.id ? recorded[0]!.id : checkIn.id}` : `/sessions?id=${encodeURIComponent(Object.values(checkIn.takes)[0]!.id)}`} meta={`${Object.keys(checkIn.takes).length} of ${CHECK_IN_PARTS.length} parts`}>
                  <span className="flex items-center gap-3.5">
                    {/* The check-in's tile */}
                    <ModeTile {...CHECK_IN_TILE} face={checkIn.week === 1 ? "ready" : "happy"} tilt={-4} still className="size-11 flex-none" />
                    {/* Its number and day */}
                    <span className="min-w-0">
                      {/* Its number */}
                      <span className="block font-display text-lg leading-tight font-semibold">{checkIn.week === 1 ? "Your first check-in" : `Check-in ${checkIn.week}`}</span>
                      {/* (day) */}
                      <span className="block text-sm font-bold text-ink-muted">{shortDay(checkIn.day)}</span>
                    </span>
                  </span>
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
