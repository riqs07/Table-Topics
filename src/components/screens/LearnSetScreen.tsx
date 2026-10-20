"use client";
// One Learn set: its icon, name and progress, then its cards as a path with done and next marks (decision 57)

// Load React's tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the icons
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Masthead } from "@/components/script/Masthead";
import { PathMark } from "@/components/script/PathMark";
import { LEARN_SET_ICONS } from "@/components/script/learnSetIcons";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the cards
import { LEARN_CARDS, LEARN_SETS } from "@/content/learn";
// Load the rules
import { setProgress, type LearnProgress } from "@/core/learn";
// Load progress
import { loadLearnProgress } from "@/data/learnProgress";
// Load the shared button looks
import { PRESS, TEXT_LINK } from "@/components/script/Buttons";
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

  // Draw the page
  return (
    <main id="main" data-area="learn" className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="Learn" section="learn" />
      {/* Back to all sets */}
      <p className="mt-2"><Link href="/learn" className={`${TEXT_LINK} -ml-1 gap-1 text-footnote`}><CaretLeftIcon aria-hidden="true" className="size-4" />All sets</Link></p>
      {/* An unknown set */}
      {!set && <p className="mt-4 text-lede">There is no such set.</p>}
      {/* The set */}
      {set && (
        <>
          {/* Icon, name and progress */}
          <div className="mt-2 flex items-center gap-4">
            {/* The icon on an accent tile */}
            {(() => {
              // The set's icon
              const IconShape = LEARN_SET_ICONS[set.id];
              // The tile
              return <span aria-hidden="true" className="flex size-16 flex-none items-center justify-center rounded-[18px] bg-warm-tint text-warm-ink"><IconShape className="size-9" /></span>;
            })()}
            {/* Name and blurb */}
            <div className="min-w-0 flex-1">
              {/* Name */}
              <h1 className="font-display text-statement font-semibold tracking-tight">{set.name}</h1>
              {/* How far through, or how many cards (the blurb is on the set's card on Learn) */}
              <p className="text-footnote text-ink-muted">{progress && setProgress(set.id, progress).read > 0 ? `${setProgress(set.id, progress).read} of ${cards.length} read` : `${cards.length} cards`}</p>
            </div>
          </div>
          {/* The cards, as a path */}
          <ol aria-label="Cards" className="mt-6 flex flex-col gap-2">
            {/* Each card */}
            {cards.map((card, index) => {
              // Done, next, or still to come
              const mark = progress?.[card.id] ? "done" : card.id === upNext?.id ? "next" : "open";
              // One card
              return (
                <li key={card.id}>
                  {/* The whole row opens the card: a rounded tile, warm when next */}
                  <Link href={`/learn/card?id=${card.id}`} className={`flex items-center gap-x-3 rounded-2xl px-3 py-2.5 ${PRESS} ${mark === "next" ? "bg-warm-tint" : "bg-card"}`}>
                    {/* Its mark */}
                    <PathMark mark={mark} number={index + 1} />
                    {/* Its title (the kind and evidence show on the card itself, decision 63) */}
                    <span className="min-w-0 flex-1">
                      {/* Next */}
                      {mark === "next" && <span className="block text-footnote font-semibold text-warm-ink">Next</span>}
                      {/* Title */}
                      <span className="block leading-snug">{card.title}</span>
                    </span>
                    {/* The chevron */}
                    <CaretRightIcon aria-hidden="true" className="size-5 flex-none self-center text-ink-muted" />
                  </Link>
                </li>
              );
            })}
          </ol>
          {/* The main action: the next card here, or the next set once this one is read */}
          {upNext ? (
            <ActionBand action="Next card" aside={upNext.kind === "myth-or-fact" ? "myth or fact" : "about a minute"} href={`/learn/card?id=${upNext.id}`} />
          ) : (
            progress && nextSet && <ActionBand action="Next set" aside={nextSet.name} href={`/learn/set?id=${nextSet.id}`} />
          )}
        </>
      )}
    </main>
  );
}
