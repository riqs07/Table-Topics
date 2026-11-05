"use client";
// One Learn set: its icon, name and progress, then its cards as a path with done and next marks (decision 57). Second design pass, extrapolated from a course's page (Desktop Screens "CoursePath"): "‹ All sets", the header band on the set's colour (its icon, how many cards, the name, its line, a chunky bar once started), then the cards as numbered rows in one white card (a green tick done, the sun next, cream still to come), and the chunky Next card

// Load React's tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the icons
import { CaretLeftIcon, CaretRightIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Masthead } from "@/components/script/Masthead";
import { Skeleton } from "@/components/script/Skeleton";
import { LEARN_SET_ICONS } from "@/components/script/learnSetIcons";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the cards
import { LEARN_CARDS, LEARN_SETS } from "@/content/learn";
// Load the rules
import { setProgress, type LearnProgress } from "@/core/learn";
// Load progress
import { loadLearnProgress } from "@/data/learnProgress";
// Load the shared looks
import { PRESS, TEXT_LINK } from "@/components/script/Buttons";
import { CARD_LIST, CHIP_GOOD, PBAR } from "@/components/script/textStyles";
// Load the set's colours, and the cast for the missing set
import { GROUND_BAND, learnSetGround } from "@/components/scenes/groundLooks";
// Load the shared not-found card
import { NotFound } from "@/components/script/SageSays";
// Load the shared page shell
import { PAGE } from "@/components/script/layout";
// Load the tab title helper
import { usePageTitle } from "@/components/screens/usePageTitle";

// Draw a set
export function LearnSetScreen({ setId, ...props }: ScreenProps & { setId: string }) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // Progress, once loaded
  const [progress, setLoaded] = useState<LearnProgress | null>(null);

  // Load progress once in the browser
  useEffect(() => {
    // Wait for the browser
    if (!today) return;
    // Ignore the result if closed first
    let cancelled = false;
    // Load it
    loadLearnProgress(repo, today).then((loaded) => {
      // Keep it if still open
      if (!cancelled) setLoaded(loaded);
    });
    // Mark as closed
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [repo, today]);

  // The set
  const set = LEARN_SETS.find((item) => item.id === setId);
  // Name the tab after the set
  usePageTitle(set?.name);
  // Its cards
  const cards = LEARN_CARDS.filter((card) => card.set === setId);
  // The first card not yet read in this set
  const upNext = progress ? cards.find((card) => !progress[card.id]) : undefined;
  // The set after this one
  const nextSet = LEARN_SETS[LEARN_SETS.findIndex((item) => item.id === setId) + 1];
  // How many of its cards are read
  const read = set && progress ? setProgress(set.id, progress).read : 0;

  // Draw the page
  return (
    <main id="main" data-area="learn" className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="Learn" section="learn" />
      {/* Back to all sets */}
      <p className="mt-1 md:-mt-12"><Link href="/learn" className={`${TEXT_LINK} -ml-1 gap-1 text-footnote text-ink-muted`}><CaretLeftIcon aria-hidden="true" weight="bold" className="size-4" />All sets</Link></p>
      {/* An unknown set: Sage, puzzled, says so as the page's heading, then the way back (the shared not-found pattern) */}
      {!set && <NotFound title="There is no such set." back={{ href: "/learn", label: "See every set" }} className="mt-4" />}
      {/* The set */}
      {set && (() => {
        // The set's icon
        const IconShape = LEARN_SET_ICONS[set.id];
        // Its colour
        const ground = learnSetGround(set.id);
        // Its band
        const band = GROUND_BAND[ground];
        // The page
        return (
          <>
            {/* The header band on the set's colour */}
            <div className={`mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-3xl px-5 py-4 pb-5 md:px-6.5 md:py-5 md:pb-6 ${band.band}`}>
              {/* The icon, how many, the name and its line */}
              <div className="flex min-w-0 flex-[1_1_18rem] items-center gap-4">
                {/* The icon on its colour */}
                <span aria-hidden="true" className={`flex size-16 flex-none items-center justify-center rounded-[18px] bg-card text-ink shadow-ledge`}><IconShape weight="bold" className="size-8" /></span>
                {/* The words */}
                <div className="flex min-w-0 flex-col gap-1">
                  {/* What it is, and how far through or how many */}
                  <p className="text-xs font-extrabold tracking-[.07em] uppercase">Quick reads · {read > 0 ? `${read} of ${cards.length} read` : `${cards.length} cards`}</p>
                  {/* Its name */}
                  <h1 className="font-display text-3xl leading-tight font-semibold md:text-4xl">{set.name}</h1>
                  {/* What it covers */}
                  <p className="max-w-[56ch] font-bold">{set.blurb}</p>
                </div>
              </div>
              {/* How far, once started */}
              {read > 0 && (
                <div aria-hidden="true" className="flex min-w-48 flex-[0_1_16rem] items-center gap-3">
                  {/* The bar */}
                  <span className={`${PBAR} flex-1 ${band.track}`}><span className={`block h-full rounded-full ${band.fill} motion-safe:animate-fill`} style={{ width: `${Math.max((read / cards.length) * 100, 6)}%` }} /></span>
                  {/* The count */}
                  <span className="font-extrabold whitespace-nowrap tabular-nums">{read} of {cards.length}</span>
                </div>
              )}
            </div>
            {/* Until progress is read, a quiet placeholder */}
            {!progress && <Skeleton blocks={["h-72"]} />}
            {/* The cards, as numbered rows in one card */}
            {progress && (
              <ol aria-label="Cards" className={`mt-6 ${CARD_LIST}`}>
                {/* Each card */}
                {cards.map((card, index) => {
                  // Done, next, or still to come
                  const mark = progress[card.id] ? "done" : card.id === upNext?.id ? "next" : "open";
                  // One card
                  return (
                    <li key={card.id}>
                      {/* The whole row opens the card */}
                      <Link href={`/learn/card?id=${card.id}`} className={`flex min-h-16 items-center gap-3.5 py-3 hover:text-accent ${PRESS}`}>
                        {/* Its mark: a tick once read, the number otherwise, on the sun when next */}
                        <span className={`flex size-9 flex-none items-center justify-center rounded-xl font-display font-semibold ${mark === "done" ? "bg-fill text-fill-ink" : mark === "next" ? "bg-art-sun text-on-warm" : "bg-rule text-ink"}`}>{mark === "done" ? <><CheckIcon aria-hidden="true" weight="bold" className="size-4.5" /><span className="sr-only">Done</span></> : index + 1}</span>
                        {/* Its title (the kind and evidence show on the card itself, decision 63) */}
                        <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                          {/* Next */}
                          {mark === "next" && <span className={CHIP_GOOD}>Next</span>}
                          {/* Title */}
                          <span className="leading-snug font-extrabold">{card.title}</span>
                        </span>
                        {/* The chevron */}
                        <CaretRightIcon aria-hidden="true" weight="bold" className="size-5 flex-none text-ink-muted" />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
            {/* The main action: the next card here, or the next set once this one is read */}
            {upNext ? (
              <ActionBand action="Next card" aside={upNext.kind === "myth-or-fact" ? "myth or fact" : "about a minute"} href={`/learn/card?id=${upNext.id}`} />
            ) : (
              progress && nextSet && <ActionBand action="Next set" aside={nextSet.name} href={`/learn/set?id=${nextSet.id}`} />
            )}
          </>
        );
      })()}
    </main>
  );
}
