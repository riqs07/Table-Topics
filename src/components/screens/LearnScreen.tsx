"use client";
// The Learn page: questions due for review, then each set of cards as a path

// Load React's tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the chevron
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Masthead } from "@/components/script/Masthead";
import { PathMark } from "@/components/script/PathMark";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the cards
import { EVIDENCE_LABELS, LEARN_CARDS, LEARN_SETS } from "@/content/learn";
// Load the rules
import { dueCards, nextCard, setProgress, type LearnProgress } from "@/core/learn";
// Load progress
import { loadLearnProgress } from "@/data/learnProgress";
import { loadScenarioProgress } from "@/data/scenarioProgress";
// Load the first-tries count
import { firstTries } from "@/core/scenarios";
// Load the scenario progress type
import type { ScenarioProgress } from "@/data/records";

// Draw the Learn page
export function LearnScreen(props: ScreenProps) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // Progress, once loaded
  const [progress, setLoaded] = useState<LearnProgress | null>(null);
  // Scenario progress, once loaded
  const [scenarios, setScenarios] = useState<Record<string, ScenarioProgress> | null>(null);

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
    // And the scenarios'
    loadScenarioProgress(repo, today).then((loaded) => {
      // Keep it if still open
      if (!cancelled) setScenarios(loaded);
    });
    // Mark as closed
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [repo, today]);

  // Questions due now
  const due = progress && today ? dueCards(progress, today) : [];
  // The next card to read
  const upNext = progress ? nextCard(progress) : undefined;

  // Draw the page
  return (
    <main className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Heading and navigation */}
      <Masthead title="Learn" section="learn" />
      {/* What this is */}
      <h1 className="mt-8 font-display text-prompt tracking-tight md:text-prompt-xl">What the research says.</h1>
      {/* How it works */}
      <p className="mt-3 max-w-[52ch] text-lede">Short cards on speaking, charisma, body language and connecting with people, each about a minute, with how strong the evidence is. A question at the end of each comes back later, so it sticks.</p>

      {/* Questions due */}
      {due.length > 0 && (
        <section aria-label="Review" className="mt-6 border-y border-ink py-4">
          {/* How many */}
          <p className="font-display text-cue">{due.length === 1 ? "One question to review." : `${due.length} questions to review.`}</p>
          {/* Go */}
          <Link href="/learn/review" className="mt-1 inline-flex min-h-11 items-center underline underline-offset-4">Review now</Link>
        </section>
      )}

      {/* Quick scenarios: choose the best reply, then say it */}
      <section aria-labelledby="scenarios-heading" className="mt-6 border-b border-rule pb-4">
        {/* Heading */}
        <h2 id="scenarios-heading" className="font-display text-cue">Quick scenarios</h2>
        {/* What it is */}
        <p className="mt-1 max-w-[52ch] text-footnote text-ink-muted">Three everyday situations: choose the best reply, see why, then say it in your own words.{scenarios && firstTries(scenarios).total > 0 ? ` First tries so far: ${firstTries(scenarios).best} of ${firstTries(scenarios).total} best.` : ""}</p>
        {/* Go */}
        <Link href="/learn/scenarios" className="mt-1 inline-flex min-h-11 items-center underline underline-offset-4">Start three</Link>
      </section>

      {/* Each set */}
      {LEARN_SETS.map((set) => {
        // The set's cards
        const cards = LEARN_CARDS.filter((card) => card.set === set.id);
        // How far through
        const done = progress ? setProgress(set.id, progress) : { read: 0, total: cards.length };
        // One set
        return (
          <section key={set.id} aria-labelledby={`set-${set.id}`} className="mt-10">
            {/* Its name and progress */}
            <h2 id={`set-${set.id}`} className="flex items-baseline justify-between gap-3 italic">
              {/* Name */}
              {set.name}
              {/* Progress */}
              <span className="text-footnote not-italic text-ink-muted">{done.read} of {done.total}</span>
            </h2>
            {/* What it covers */}
            <p className="mt-1 text-footnote text-ink-muted">{set.blurb}</p>
            {/* The cards, as a path */}
            <ol className="mt-2">
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
                        <span className="block text-footnote italic text-ink-muted">{card.kind === "myth-or-fact" ? "Myth or fact" : card.kind === "try-it" ? "Try it" : "Explainer"} · {EVIDENCE_LABELS[card.evidence]}</span>
                      </span>
                      {/* The chevron */}
                      <CaretRightIcon aria-hidden="true" className="size-5 flex-none self-center text-ink-muted" />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      {/* The main action: review first, otherwise the next card */}
      {due.length > 0 ? (
        <ActionBand action="Review" aside={`${due.length} due`} href="/learn/review" />
      ) : (
        upNext && <ActionBand action="Next card" aside={upNext.kind === "myth-or-fact" ? "myth or fact" : "about a minute"} href={`/learn/card?id=${upNext.id}`} />
      )}
    </main>
  );
}
