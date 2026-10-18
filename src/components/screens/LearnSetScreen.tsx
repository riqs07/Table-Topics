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
import { EVIDENCE_LABELS, LEARN_CARDS, LEARN_SETS } from "@/content/learn";
// Load the rules
import { setProgress, type LearnProgress } from "@/core/learn";
// Load progress
import { loadLearnProgress } from "@/data/learnProgress";

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
  // Its cards
  const cards = LEARN_CARDS.filter((card) => card.set === setId);
  // The first card not yet read in this set
  const upNext = progress ? cards.find((card) => !progress[card.id]) : undefined;
  // The set after this one
  const nextSet = LEARN_SETS[LEARN_SETS.findIndex((item) => item.id === setId) + 1];

  // Draw the page
  return (
    <main className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Heading and navigation */}
      <Masthead title="Learn" section="learn" />
      {/* Back to all sets */}
      <p className="mt-2"><Link href="/learn" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-footnote underline underline-offset-4"><CaretLeftIcon aria-hidden="true" className="size-4" />All sets</Link></p>
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
              return <span aria-hidden="true" className="flex size-16 flex-none items-center justify-center bg-accent text-accent-ink"><IconShape className="size-9" /></span>;
            })()}
            {/* Name and blurb */}
            <div className="min-w-0 flex-1">
              {/* Name */}
              <h1 className="font-display text-statement tracking-tight">{set.name}</h1>
              {/* What it covers */}
              <p className="text-footnote text-ink-muted">{set.blurb} {progress && `${setProgress(set.id, progress).read} of ${cards.length} read.`}</p>
            </div>
          </div>
          {/* The cards, as a path */}
          <ol aria-label="Cards" className="mt-6">
            {/* Each card */}
            {cards.map((card, index) => {
              // Done, next, or still to come
              const mark = progress?.[card.id] ? "done" : card.id === upNext?.id ? "next" : "open";
              // One card
              return (
                <li key={card.id} className="relative">
                  {/* The line to the next card */}
                  {index < cards.length - 1 && <span aria-hidden="true" className="absolute top-14 bottom-0 left-[17px] w-0.5 bg-rule" />}
                  {/* The whole row opens the card */}
                  <Link href={`/learn/card?id=${card.id}`} className="relative flex items-start gap-x-4 py-3 hover:text-accent">
                    {/* Its mark */}
                    <PathMark mark={mark} number={index + 1} />
                    {/* Its title, kind and evidence */}
                    <span className="min-w-0 flex-1">
                      {/* Next */}
                      {mark === "next" && <span className="block text-footnote italic text-accent">Next</span>}
                      {/* Title */}
                      <span className="block text-lede">{card.title}</span>
                      {/* Kind and evidence */}
                      <span className="block text-footnote italic text-ink-muted">{card.kind === "myth-or-fact" ? "Myth or fact" : card.kind === "try-it" ? "Try it" : "Explainer"} · {EVIDENCE_LABELS[card.evidence]}{card.scenario ? " · with a scenario" : ""}</span>
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
