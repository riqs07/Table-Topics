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
// Load the icon for the real-world step
import { GlobeHemisphereWestIcon } from "@phosphor-icons/react/dist/ssr";
// Load the shared button looks
import { PRESS, PrimaryLink } from "@/components/script/Buttons";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the scenarios, their item and progress saving
import { findScenario } from "@/content/scenarios";
import { ScenarioItem } from "@/components/script/ScenarioItem";
import { saveScenarioAnswer } from "@/data/scenarioProgress";
// Load the browser's recording services, and their type
import { browserRecordingServices } from "@/audio/browserServices";
import type { RecordingServices } from "@/audio/services";
// Load the cards
import { EVIDENCE_LABELS, LEARN_CARDS, LEARN_SETS, findCard, type Verdict } from "@/content/learn";
// Load the plan navigation type, today's practice and step addresses
import type { PlanNav } from "@/components/screens/planNav";
import { loadDailyPlan } from "@/data/dailyPlan";
import { planHref } from "@/core/dailyPlan";
// Load progress saving
import { markCardRead } from "@/data/learnProgress";
// Load the tab title helper
import { usePageTitle } from "@/components/screens/usePageTitle";

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
  return <p className="mt-6 text-footnote text-ink-muted md:mt-0">{children}</p>;
}

// Draw a card
export function CardScreen({ cardId, services = browserRecordingServices, planStep = null, ...props }: ScreenProps & { cardId: string; services?: RecordingServices; planStep?: number | null }) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // The card
  const card = findCard(cardId);
  // Name the tab after the card
  usePageTitle(card?.title.replace(/[“”"]/g, ""));
  // The screen showing
  const [index, setIndex] = useState(0);
  // A myth-or-fact guess
  const [guess, setGuess] = useState<Verdict | null>(null);
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

  // The card's scenario, if it has one (an extra, last screen)
  const scenario = card?.scenario ? findScenario(card.scenario) : undefined;
  // The last screen's place (the recall quiz screen went with decision 67)
  const lastScreen = scenario ? 4 : 3;

  // Reaching the last screen counts as reading the card
  useEffect(() => {
    // Only on the last screen, in the browser, for a real card
    if (!today || !card || index < lastScreen) return;
    // Note it (keeps earlier progress)
    void markCardRead(repo, card.id, today);
  }, [card, index, lastScreen, repo, today]);

  // An unknown card
  if (!card) {
    // Say so, with a way back
    return (
      <main data-area="learn" className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
        {/* Heading */}
        <Masthead title="Learn" section="learn" />
        {/* Explanation */}
        <p data-inline className="mt-6 text-lede">There is no such card. <Link href="/learn" className="underline underline-offset-4">Back to Learn</Link></p>
      </main>
    );
  }

  // The card's set
  const set = LEARN_SETS.find((item) => item.id === card.set);
  // The card after this one
  const next = LEARN_CARDS[LEARN_CARDS.findIndex((item) => item.id === card.id) + 1];

  // Where to go on to from the last screen: today's next step, or the next card, or back to the set
  const finish = plan ? { label: plan.next ? `Next: step ${plan.step + 1}` : "Finish today\u2019s practice", href: plan.next ? plan.next.href : "/" } : next ? { label: "Next card", href: `/learn/card?id=${next.id}` } : { label: `Back to ${set?.name ?? "Learn"}`, href: `/learn/set?id=${card.set}` };

  // The screens: the question, the finding, the meaning, what to do, and a scenario on cards that have one
  const screens = [
    // 1. The question or belief
    <div key="question">
      {/* What kind of card, when it is not a plain explainer (the set's name is already the page title; decision 79) */}
      {card.kind !== "explainer" && <Kicker>{card.kind === "myth-or-fact" ? "Myth or fact?" : "Try it"}</Kicker>}
      {/* The question, set like a headline */}
      <h1 className="mt-2 font-display text-prompt font-semibold tracking-tight">{card.title}</h1>
      {/* A myth-or-fact guess, before the research */}
      {card.verdict && (
        <div className="mt-6">
          {/* The ask */}
          <p className="text-ink-muted">Guess first.</p>
          {/* The guesses */}
          <div role="group" aria-label="Your guess" className="mt-2 flex flex-wrap gap-2">
            {/* Each guess */}
            {GUESSES.map((option) => (
              // One guess, filled once chosen
              <button key={option.verdict} type="button" aria-pressed={guess === option.verdict} disabled={guess !== null} onClick={() => setGuess(option.verdict)} className={`min-h-12 flex-1 rounded-[14px] border-2 px-4 font-semibold ${PRESS} ${guess === option.verdict ? "border-fill bg-fill text-fill-ink" : "border-rule bg-card disabled:opacity-60"}`}>{option.label}</button>
            ))}
          </div>
          {/* The answer, once guessed */}
          {guess && <p role="status" className="mt-4 rounded-2xl bg-card px-4 py-3 font-display text-cue font-semibold motion-safe:animate-pop">{VERDICT_WORDS[card.verdict]} {guess === card.verdict ? "You got it." : ""}</p>}
        </div>
      )}
    </div>,
    // 2. What the research found
    <div key="finding">
      {/* Heading */}
      <Kicker>What the research found</Kicker>
      {/* The finding */}
      <p className="mt-2 max-w-[52ch] text-cue leading-snug">{card.finding}</p>
      {/* The evidence and source */}
      <p className="mt-4 text-footnote text-ink-muted">
        {/* The label in words */}
        <strong className="font-normal text-ink">{EVIDENCE_LABELS[card.evidence]}.</strong>{" "}
        {/* The source */}
        {card.source.url ? <a href={card.source.url} data-inline target="_blank" rel="noreferrer" className="underline underline-offset-4">{card.source.text}</a> : card.source.text}
      </p>
    </div>,
    // 3. What it means
    <div key="meaning">
      {/* Heading */}
      <Kicker>What it means</Kicker>
      {/* The meaning, set large */}
      <p className="mt-2 max-w-[40ch] font-display text-statement font-semibold tracking-tight">{card.meaning}</p>
    </div>,
    // 4. What to do
    <div key="do">
      {/* Heading */}
      <Kicker>What to do</Kicker>
      {/* The advice */}
      <p className="mt-2 max-w-[52ch] text-cue leading-snug">{card.doThis}</p>
      {/* A short exercise to say aloud, on try-it cards */}
      {card.exercise && (
        <div className="mt-6 rounded-2xl bg-warm-tint p-4">
          {/* Heading */}
          <p className="text-footnote text-ink-muted">Try it now</p>
          {/* The exercise */}
          <p className="mt-1 text-lede">{card.exercise}</p>
          {/* Record it and hear it back */}
          <QuickRecorder services={services} action="Record it" maxSec={30} />
        </div>
      )}
      {/* A small step to try for real, away from the app */}
      {card.outThere && (
        <div className="mt-6 flex gap-3 rounded-2xl bg-card p-4">
          {/* The icon */}
          <span aria-hidden="true" className="flex size-10 flex-none items-center justify-center rounded-xl bg-warm-tint text-warm-ink"><GlobeHemisphereWestIcon className="size-6" /></span>
          {/* The step */}
          <span>
            {/* Heading */}
            <span className="block text-footnote font-semibold text-warm-ink">Try it for real</span>
            {/* The step itself */}
            <span className="mt-1 block">{card.outThere}</span>
          </span>
        </div>
      )}
      {/* Practise it elsewhere */}
      {card.tryIt && <p className="mt-6"><PrimaryLink href={card.tryIt.href}>{card.tryIt.label}</PrimaryLink></p>}
    </div>,
    // A scenario: choose the best reply, then say it (only on cards that have one)
    ...(scenario ? [
      <div key="scenario">
        {/* Heading */}
        <Kicker>{`Try it: ${scenario.title}`}</Kicker>
        {/* The item */}
        <div className="mt-2"><ScenarioItem scenario={scenario} services={services} onAnswer={(tier) => { if (today) void saveScenarioAnswer(repo, scenario.id, tier, today); }} /></div>
      </div>,
    ] : []),
  ];

  // Draw the page
  return (
    <main data-area="learn" className="mx-auto flex min-h-dvh max-w-3xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
      {/* The set's name, with a way out instead of the tab bar */}
      <Masthead title={set?.name ?? "Learn"} nav={false} close={planStep ? { href: "/", label: "Close, back to Today" } : { href: `/learn/set?id=${card.set}`, label: `Close, back to ${set?.name ?? "Learn"}` }}>{plan ? `Step ${plan.step} of ${plan.total}` : ""}</Masthead>
      {/* The screens */}
      <SwipeDeck screens={screens} index={index} onIndex={setIndex} label={card.title} finish={finish} />
    </main>
  );
}
