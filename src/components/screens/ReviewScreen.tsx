"use client";
// Learn review: the recall questions that are due, one at a time

// Load React's tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionBand, ActionButton } from "@/components/script/ActionBand";
import { Masthead } from "@/components/script/Masthead";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the card type
import type { LearnCard } from "@/content/learn";
// Load the rules
import { dueCards, shuffledRecall } from "@/core/learn";
// Load progress
import { loadLearnProgress, saveRecall } from "@/data/learnProgress";

// Draw the review
export function ReviewScreen(props: ScreenProps) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // The cards due when the page opened (null while loading)
  const [cards, setCards] = useState<LearnCard[] | null>(null);
  // Which question is showing
  const [position, setPosition] = useState(0);
  // The answer tapped for it
  const [picked, setPicked] = useState<number | null>(null);
  // How many were right
  const [rightCount, setRightCount] = useState(0);

  // Load the due cards once in the browser
  useEffect(() => {
    // Wait for the browser
    if (!today) return;
    // Ignore the result if closed first
    let cancelled = false;
    // Load them
    loadLearnProgress(repo, today).then((progress) => {
      // Keep them if still open
      if (!cancelled) setCards(dueCards(progress, today));
    });
    // Mark as closed
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [repo, today]);

  // The card showing
  const card = cards?.[position];
  // Its answers, shuffled the same way every time
  const recall = card ? shuffledRecall(card) : null;

  // Answer the question
  function answer(choice: number) {
    // Nothing to answer, or already answered
    if (!card || !recall || picked !== null || !today) return;
    // Note the choice
    setPicked(choice);
    // Whether it was right
    const right = choice === recall.answer;
    // Count it
    if (right) setRightCount((count) => count + 1);
    // Save it
    void saveRecall(repo, card.id, right, today);
  }

  // Move to the next question
  function onward() {
    // Clear the answer
    setPicked(null);
    // The next one
    setPosition((current) => current + 1);
  }

  // Draw the page
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
      {/* Heading, with a way out */}
      <Masthead title="Review" nav={false} close={{ href: "/learn", label: "Close, back to Learn" }}>{cards && card ? `${position + 1} of ${cards.length}` : ""}</Masthead>
      {/* Nothing due */}
      {cards && cards.length === 0 && <p className="mt-8 text-lede">Nothing to review right now. Questions come back a day, a week and a month after you read a card.</p>}
      {/* All done */}
      {cards && cards.length > 0 && !card && (
        <section aria-label="Review done" className="mt-8">
          {/* The result */}
          <h1 className="font-display text-prompt tracking-tight">{rightCount === cards.length ? "All right." : `${rightCount} of ${cards.length} right.`}</h1>
          {/* What happens next */}
          <p className="mt-3 max-w-[52ch] text-lede">The ones you got right come back later; the others come back tomorrow.</p>
        </section>
      )}
      {/* A question */}
      {card && recall && (
        <section aria-label="Question" className="mt-8">
          {/* The card it comes from */}
          <p className="text-footnote italic text-ink-muted">From: {card.title}</p>
          {/* The question */}
          <h1 className="mt-2 font-display text-cue">{card.recall.question}</h1>
          {/* The answers */}
          <div role="group" aria-label="Answers" className="mt-4 flex flex-col gap-2">
            {/* Each answer */}
            {recall.options.map((option, index) => {
              // Whether it has been revealed
              const shown = picked !== null && (index === recall.answer || index === picked);
              // One answer
              return (
                <button key={option} type="button" disabled={picked !== null} onClick={() => answer(index)} data-result={shown ? (index === recall.answer ? "right" : "wrong") : undefined} className={`min-h-11 border px-4 py-2 text-left ${shown && index === recall.answer ? "border-accent bg-accent text-accent-ink" : shown ? "border-ink line-through" : "border-rule"}`}>
                  {option}
                </button>
              );
            })}
          </div>
          {/* After answering: the line to remember, and the card */}
          {picked !== null && (
            <p role="status" className="mt-4 text-lede">
              {/* Right or not */}
              {picked === recall.answer ? "Right." : "Not quite."} <em>{card.keyLine}</em>{" "}
              {/* Read it again */}
              <Link href={`/learn/card?id=${card.id}`} data-inline className="underline underline-offset-4">Read the card</Link>
            </p>
          )}
        </section>
      )}
      {/* Push the action down */}
      <div className="flex-1" />
      {/* The action: next, or back to Learn */}
      {card ? (
        <ActionButton action={position + 1 < (cards?.length ?? 0) ? "Next question" : "Finish"} aside={picked === null ? "answer first" : ""} disabled={picked === null} onClick={onward} />
      ) : (
        cards && <ActionBand action="Back to Learn" aside="" href="/learn" />
      )}
    </main>
  );
}
