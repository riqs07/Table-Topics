"use client";
// One Learn card, one screen at a time: the question, what research found, what it means, what to do, and remembering it

// Load React's tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
import { SwipeDeck } from "@/components/script/SwipeDeck";
import { QuickRecorder } from "@/components/script/QuickRecorder";
import { PrimaryLink } from "@/components/script/Buttons";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the browser's recording services, and their type
import { browserRecordingServices } from "@/audio/browserServices";
import type { RecordingServices } from "@/audio/services";
// Load the cards
import { EVIDENCE_LABELS, LEARN_CARDS, LEARN_SETS, findCard, type Verdict } from "@/content/learn";
// Load the recall rules
import { RECALL_DAYS, shuffledRecall, type LearnProgress } from "@/core/learn";
// Load the plan navigation type, today's practice and step addresses
import type { PlanNav } from "@/components/screens/planNav";
import { loadDailyPlan } from "@/data/dailyPlan";
import { planHref } from "@/core/dailyPlan";
// Load progress saving
import { loadLearnProgress, markCardRead, saveRecall } from "@/data/learnProgress";

// The words for each verdict
const VERDICT_WORDS: Readonly<Record<Verdict, string>> = {
  // A myth
  myth: "It's a myth.",
  // A fact
  fact: "It's a fact.",
  // In between
  mixed: "It's mixed: partly true.",
};

// The guesses offered on a myth-or-fact card
const GUESSES: ReadonlyArray<{ verdict: Verdict; label: string }> = [
  // Myth
  { verdict: "myth", label: "Myth" },
  // Fact
  { verdict: "fact", label: "Fact" },
  // In between
  { verdict: "mixed", label: "Somewhere between" },
];

// A small italic heading over a screen
function Kicker({ children }: { children: string }) {
  // The heading
  return <p className="mt-6 text-footnote italic text-ink-muted md:mt-0">{children}</p>;
}

// When a recall question comes back, in words
function comesBack(days: number): string {
  // A day, a week, a month, or longer
  return days <= 1 ? "tomorrow" : days <= 7 ? "in a week" : days <= 30 ? "in a month" : "in three months";
}

// Draw a card
export function CardScreen({ cardId, services = browserRecordingServices, planStep = null, ...props }: ScreenProps & { cardId: string; services?: RecordingServices; planStep?: number | null }) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // The card
  const card = findCard(cardId);
  // The screen showing
  const [index, setIndex] = useState(0);
  // A myth-or-fact guess
  const [guess, setGuess] = useState<Verdict | null>(null);
  // The recall answer tapped
  const [picked, setPicked] = useState<number | null>(null);
  // What was said when saying it back, once stopped
  const [said, setSaid] = useState<string | null>(null);
  // Whether the recall has been saved (once per visit)
  const [recalled, setRecalled] = useState<boolean | null>(null);
  // Progress, for the "comes back" line
  const [progress, setProgress] = useState<LearnProgress>({});
  // Inside today's practice: this step, how many there are, and the next one
  const [plan, setPlan] = useState<PlanNav | null>(null);

  // Inside today's practice, load the plan to find the next step
  useEffect(() => {
    // Only inside the plan, in the browser
    if (!planStep || !today) return;
    // Ignore the result if closed first
    let cancelled = false;
    // Load it
    loadDailyPlan(repo, today).then((loaded) => {
      // Stop if closed
      if (cancelled) return;
      // The next step, if any
      const after = loaded.steps[planStep];
      // Keep where this step sits
      setPlan({ step: planStep, total: loaded.steps.length, next: after ? { href: planHref(after, planStep + 1), label: after.label } : null });
    });
    // Mark as closed
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [planStep, repo, today]);

  // Load progress once in the browser
  useEffect(() => {
    // Wait for the browser
    if (!today) return;
    // Ignore the result if closed first
    let cancelled = false;
    // Load it
    loadLearnProgress(repo, today).then((loaded) => {
      // Keep it if still open
      if (!cancelled) setProgress(loaded);
    });
    // Mark as closed
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [repo, today]);

  // Reaching the last screen counts as reading the card
  useEffect(() => {
    // Only on the last screen, in the browser, for a real card
    if (!today || !card || index < 4) return;
    // Note it (keeps earlier progress)
    void markCardRead(repo, card.id, today).then(setProgress);
  }, [card, index, repo, today]);

  // An unknown card
  if (!card) {
    // Say so, with a way back
    return (
      <main className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
        {/* Heading */}
        <Masthead title="Learn" section="learn" />
        {/* Explanation */}
        <p data-inline className="mt-6 text-lede">There is no such card. <Link href="/learn" className="underline underline-offset-4">Back to Learn</Link></p>
      </main>
    );
  }

  // The card's set
  const set = LEARN_SETS.find((item) => item.id === card.set);
  // The recall answers in their stable shuffled order
  const recall = shuffledRecall(card);
  // The card after this one
  const next = LEARN_CARDS[LEARN_CARDS.findIndex((item) => item.id === card.id) + 1];

  // Save a recall result once
  function remember(right: boolean) {
    // Once per visit, and only in the browser
    if (recalled !== null || !today || !card) return;
    // Note it on screen
    setRecalled(right);
    // Save it
    void saveRecall(repo, card.id, right, today).then(setProgress);
  }

  // When the question comes back, once answered
  const back = recalled === null ? null : comesBack(RECALL_DAYS[Math.min(progress[card.id]?.box ?? 0, RECALL_DAYS.length - 1)] ?? 1);

  // The five screens
  const screens = [
    // 1. The question or belief
    <div key="question">
      {/* Which set, and what kind of card */}
      <Kicker>{card.kind === "myth-or-fact" ? "Myth or fact?" : card.kind === "try-it" ? "Try it" : (set?.name ?? "Learn")}</Kicker>
      {/* The question, set like a headline */}
      <h1 className="mt-2 font-display text-prompt tracking-tight">{card.title}</h1>
      {/* A myth-or-fact guess, before the research */}
      {card.verdict && (
        <div className="mt-6">
          {/* The ask */}
          <p className="italic text-ink-muted">Guess first.</p>
          {/* The guesses */}
          <div role="group" aria-label="Your guess" className="mt-2 flex flex-wrap gap-2">
            {/* Each guess */}
            {GUESSES.map((option) => (
              // One guess, filled once chosen
              <button key={option.verdict} type="button" aria-pressed={guess === option.verdict} disabled={guess !== null} onClick={() => setGuess(option.verdict)} className={`min-h-11 border px-4 ${guess === option.verdict ? "border-accent bg-accent text-accent-ink" : "border-ink disabled:opacity-60"}`}>{option.label}</button>
            ))}
          </div>
          {/* The answer, once guessed */}
          {guess && <p role="status" className="mt-4 font-display text-cue">{VERDICT_WORDS[card.verdict]} {guess === card.verdict ? "You got it." : ""}</p>}
        </div>
      )}
      {/* How to move on */}
      {!card.verdict && <p className="mt-6 italic text-ink-muted">Swipe, or press Next, to see what research found.</p>}
    </div>,
    // 2. What the research found
    <div key="finding">
      {/* Heading */}
      <Kicker>What the research found</Kicker>
      {/* The finding */}
      <p className="mt-2 max-w-[52ch] text-cue leading-snug">{card.finding}</p>
    </div>,
    // 3. What it means
    <div key="meaning">
      {/* Heading */}
      <Kicker>What it means</Kicker>
      {/* The meaning, set large */}
      <p className="mt-2 max-w-[40ch] font-display text-statement tracking-tight">{card.meaning}</p>
    </div>,
    // 4. What to do
    <div key="do">
      {/* Heading */}
      <Kicker>What to do</Kicker>
      {/* The advice */}
      <p className="mt-2 max-w-[52ch] text-cue leading-snug">{card.doThis}</p>
      {/* A short exercise to say aloud, on try-it cards */}
      {card.exercise && (
        <div className="mt-6 border-l-2 border-accent pl-4">
          {/* Heading */}
          <p className="text-footnote italic text-ink-muted">Try it now</p>
          {/* The exercise */}
          <p className="mt-1 text-lede">{card.exercise}</p>
          {/* Record it and hear it back */}
          <QuickRecorder services={services} action="Record it" maxSec={30} />
        </div>
      )}
      {/* Practise it elsewhere */}
      {card.tryIt && <p className="mt-6"><PrimaryLink href={card.tryIt.href}>{card.tryIt.label}</PrimaryLink></p>}
    </div>,
    // 5. Remember it
    <div key="remember">
      {/* Heading */}
      <Kicker>Remember it</Kicker>
      {/* The question */}
      <p className="mt-2 font-display text-cue">{card.recall.question}</p>
      {/* The answers to tap */}
      <div role="group" aria-label="Answers" className="mt-3 flex flex-col gap-2">
        {/* Each answer */}
        {recall.options.map((option, position) => {
          // Whether this answer has been revealed as right or wrong
          const shown = picked !== null && (position === recall.answer || position === picked);
          // One answer
          return (
            <button key={option} type="button" disabled={picked !== null || said !== null} onClick={() => { setPicked(position); remember(position === recall.answer); }} data-result={shown ? (position === recall.answer ? "right" : "wrong") : undefined} className={`min-h-11 border px-4 py-2 text-left ${shown && position === recall.answer ? "border-accent bg-accent text-accent-ink" : shown ? "border-ink line-through" : "border-rule"}`}>
              {option}
            </button>
          );
        })}
      </div>
      {/* After a tap: right or not, and the line to remember */}
      {picked !== null && <p role="status" className="mt-3 text-lede">{picked === recall.answer ? "Right." : "Not quite."} <em>{card.keyLine}</em></p>}
      {/* Or say it back in your own words */}
      {picked === null && (
        <div className="mt-6 border-t border-rule pt-3">
          {/* The offer */}
          <p className="text-footnote italic text-ink-muted">Or say the main point in your own words</p>
          {/* Record it */}
          <QuickRecorder services={services} action="Say it" maxSec={30} onDone={setSaid} />
          {/* Then compare, and say how it went */}
          {said !== null && (
            <div className="mt-4">
              {/* The line to compare with */}
              <p className="text-lede">The main point: <em>{card.keyLine}</em></p>
              {/* How it went */}
              {recalled === null ? (
                <p className="mt-2 flex flex-wrap gap-2">
                  {/* Had it */}
                  <button type="button" onClick={() => remember(true)} className="min-h-11 border border-ink px-4">I had it</button>
                  {/* Not quite */}
                  <button type="button" onClick={() => remember(false)} className="min-h-11 border border-rule px-4">Not quite</button>
                </p>
              ) : (
                // Noted
                <p role="status" className="mt-2 italic text-ink-muted">Noted.</p>
              )}
            </div>
          )}
        </div>
      )}
      {/* When it comes back */}
      {back && <p className="mt-3 text-footnote italic text-ink-muted">This question comes back {back}.</p>}
      {/* The evidence and source */}
      <p className="mt-6 border-t border-rule pt-3 text-footnote text-ink-muted">
        {/* The label in words */}
        <strong className="font-normal text-ink">{EVIDENCE_LABELS[card.evidence]}.</strong>{" "}
        {/* The source */}
        {card.source.url ? <a href={card.source.url} data-inline target="_blank" rel="noreferrer" className="underline underline-offset-4">{card.source.text}</a> : card.source.text}
      </p>
      {/* Inside today's practice: on to the next step, or finish */}
      {plan && <p className="mt-6"><PrimaryLink href={plan.next ? plan.next.href : "/"}>{plan.next ? `Next: step ${plan.step + 1}` : "Finish today\u2019s practice"}</PrimaryLink></p>}
      {/* On to the next card, or back */}
      {!plan && <p className="mt-4 flex flex-wrap gap-x-4">
        {/* The next card */}
        {next && <Link href={`/learn/card?id=${next.id}`} className="inline-flex min-h-11 items-center underline underline-offset-4">Next card</Link>}
        {/* Back */}
        <Link href="/learn" className="inline-flex min-h-11 items-center italic text-ink-muted underline underline-offset-4">Back to Learn</Link>
      </p>}
    </div>,
  ];

  // Draw the page
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
      {/* The set's name, with a way out instead of the tab bar */}
      <Masthead title={set?.name ?? "Learn"} nav={false} close={planStep ? { href: "/", label: "Close, back to Today" } : { href: "/learn", label: "Close, back to Learn" }}>{plan ? `Step ${plan.step} of ${plan.total}` : ""}</Masthead>
      {/* The screens */}
      <SwipeDeck screens={screens} index={index} onIndex={setIndex} label={card.title} />
    </main>
  );
}
