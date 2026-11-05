"use client";
// One Learn card, one screen at a time: the question, what research found, what it means, what to do, and remembering it. Second design pass (storyboard 22, "A Learn card: myth or fact"): focus mode (the cross, the chunky bar, the set and the kind in green capitals), the claim on its set's colour, Myth and Fact as big choices marked once guessed, the finding and what to do on white cards, Sage saying what it means, "Practise it" as a row with the practice's tile, and the chunky Next at the foot

// Load React's tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { SwipeDeck } from "@/components/script/SwipeDeck";
import { QuickRecorder } from "@/components/script/QuickRecorder";
// Load the focus-mode bar (second design pass)
import { PracticeBar } from "@/components/script/PracticeBar";
// Load the icons for the real-world step, the practice link and a right guess
import { CaretRightIcon, CheckIcon, GlobeHemisphereWestIcon } from "@phosphor-icons/react/dist/ssr";
// Load the shared press effect and looks
import { PRESS, PRIMARY } from "@/components/script/Buttons";
import { BUBBLE, CARD, CHIP, LAB } from "@/components/script/textStyles";
// Load the cast, the mode tile, and which tile stands for a practice and a set
import { Cast } from "@/components/scenes/Cast";
import { ModeTile } from "@/components/scenes/ModeTile";
import { tileForHref } from "@/components/scenes/tileForHref";
import { GROUND_BAND, learnSetGround } from "@/components/scenes/groundLooks";
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
// Load the plan loader (the plan's code loads after the page shows; decision 88)
import { loadDailyPlanLater } from "@/data/loadDailyPlanLater";
import { planHref } from "@/core/planSteps";
// Load progress saving
import { markCardRead } from "@/data/learnProgress";
// Load the tab title helper
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the panel with a step's scene, carried over from Today (decision 141)
import { ScenePanel } from "@/components/scenes/ScenePanel";

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

// The page in focus mode: one column, the bar across its top (the deck's screens bleed to the phone's edges, so the sides are padded to match)
const CARD_PAGE = "mx-auto flex min-h-dvh w-full max-w-3xl flex-col bg-paper-raised px-6 md:px-8";

// The card's last step: a row that starts the practice that fits it best, so every card ends in doing (decision 96), with that practice's tile (storyboard 22)
function PractiseRow({ label, href }: { label: string; href: string }) {
  // The practice's tile
  const tile = tileForHref(href);
  // The whole row is the link: the tile, "Practise it" over the session's name, and a chevron
  return (
    <Link href={href} data-practise-link className={`mt-5 flex min-h-18 items-center gap-3.5 px-4 py-3 ${CARD} ${PRESS} hover:-translate-y-0.5`}>
      {/* The practice's tile */}
      <ModeTile ground={tile.ground} prop={tile.prop} face={tile.face} tilt={-4} motion="still" className="size-14" />
      {/* What it starts */}
      <span className="min-w-0 flex-1">
        {/* Heading */}
        <span className="block font-display text-lg leading-tight font-semibold">Practise it</span>
        {/* The session's name */}
        <span className="block text-footnote font-bold text-ink-muted">{label}</span>
      </span>
      {/* The chevron */}
      <CaretRightIcon aria-hidden="true" weight="bold" className="size-5 flex-none text-ink-muted" />
    </Link>
  );
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
    loadDailyPlanLater(repo, today).then((loaded) => {
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
      <main id="main" data-area="learn" className={CARD_PAGE}>
        {/* The bar, with the way back to Learn */}
        <PracticeBar close={{ href: "/learn", label: "Close, back to Learn" }} label="Learn" />
        {/* The message, on a card with your blob wondering */}
        <section className={`mt-8 flex flex-col items-center gap-4 px-6 py-10 text-center ${CARD}`}>
          {/* Your blob, puzzled */}
          <Cast who="you" face="wonder" className="size-28" />
          {/* The page's heading */}
          <h1 className="font-display text-statement leading-tight font-semibold">Learn</h1>
          {/* What happened */}
          <p data-inline className="font-bold text-ink-muted">There is no such card.</p>
          {/* The way back */}
          <Link href="/learn" className={PRIMARY}>Back to Learn</Link>
        </section>
      </main>
    );
  }

  // The card's set
  const set = LEARN_SETS.find((item) => item.id === card.set);
  // The set's colours, for the claim
  const band = GROUND_BAND[learnSetGround(card.set)];
  // The card after this one
  const next = LEARN_CARDS[LEARN_CARDS.findIndex((item) => item.id === card.id) + 1];

  // Where to go on to from the last screen: today's next step, or the next card, or back to the set
  const finish = plan ? { label: plan.next ? `Next: step ${plan.step + 1}` : "Finish today’s practice", href: plan.next ? plan.next.href : "/" } : next ? { label: "Next card", href: `/learn/card?id=${next.id}` } : { label: `Back to ${set?.name ?? "Learn"}`, href: `/learn/set?id=${card.set}` };

  // The screens: the question, the finding, the meaning, what to do, and a scenario on cards that have one
  const screens = [
    // 1. The question or belief
    <div key="question">
      {/* Opened from Today: the Learn scene, carried over from the step */}
      {planStep && <ScenePanel scene="learn" line="One idea, about a minute to read." className="mb-6" />}
      {/* The question, set like a headline on the set's colour */}
      <div className={`rounded-[24px] px-6 py-5 md:px-7 md:py-6 ${band.band}`}>
        {/* The question */}
        <h1 className="font-display text-prompt leading-tight font-semibold">{card.title}</h1>
      </div>
      {/* A myth-or-fact guess, before the research */}
      {card.verdict && (
        <div className="mt-5">
          {/* The ask */}
          <p className={LAB}>Guess first</p>
          {/* The guesses */}
          <div role="group" aria-label="Your guess" className="mt-2 flex flex-wrap gap-3">
            {/* Each guess */}
            {GUESSES.map((option) => {
              // Whether this is the guess, and whether it was right
              const [picked, right] = [guess === option.verdict, option.verdict === card.verdict];
              // One guess: a big white choice, then green once picked and right, warm once picked and wrong, the answer's edge green
              return (
                <button key={option.verdict} type="button" aria-pressed={picked} disabled={guess !== null} onClick={() => setGuess(option.verdict)} className={`inline-flex min-h-14 flex-1 basis-32 items-center justify-center gap-2 rounded-[18px] border-2 px-4 font-display text-xl font-semibold shadow-ledge ${PRESS} ${picked ? (right ? "border-accent bg-accent-tint text-accent-tint-ink" : "border-warm bg-warm-tint text-warm-ink") : guess && right ? "border-accent bg-card" : guess ? "border-rule bg-card text-ink-muted" : "border-rule bg-card hover:border-accent"}`}>
                  {option.label}
                  {/* A tick on the answer, once guessed */}
                  {guess && right && <CheckIcon aria-hidden="true" weight="bold" className="size-5" />}
                </button>
              );
            })}
          </div>
          {/* The answer, once guessed */}
          {guess && <p role="status" className={`mt-4 rounded-[18px] px-5 py-3.5 font-display text-cue font-semibold motion-safe:animate-pop ${guess === card.verdict ? "bg-accent-tint text-accent-tint-ink" : "bg-warm-tint text-warm-ink"}`}>{VERDICT_WORDS[card.verdict]} {guess === card.verdict ? "You got it." : ""}</p>}
        </div>
      )}
    </div>,
    // 2. What the research found
    <div key="finding" className={`p-5 md:p-6 ${CARD}`}>
      {/* Heading */}
      <p className={LAB}>What the research found</p>
      {/* The finding */}
      <p className="mt-2 max-w-[52ch] text-cue leading-snug font-bold">{card.finding}</p>
      {/* The evidence and source */}
      <p className="mt-4 border-t-2 border-rule pt-3 text-footnote font-bold text-ink-muted">
        {/* The label in words */}
        <strong className="font-extrabold text-ink">{EVIDENCE_LABELS[card.evidence]}.</strong>{" "}
        {/* The source */}
        {card.source.url ? <a href={card.source.url} data-inline target="_blank" rel="noreferrer" className="underline underline-offset-4">{card.source.text}</a> : card.source.text}
      </p>
    </div>,
    // 3. What it means, said by Sage
    <div key="meaning" className="flex items-end gap-3 md:gap-4">
      {/* Sage */}
      <Cast who="sage" mood="encouraging" className="size-16 flex-none md:size-22" />
      {/* The bubble */}
      <div className={`${BUBBLE} mb-2 min-w-0 flex-1 px-5 py-4`}>
        {/* Heading */}
        <p className={LAB}>What it means</p>
        {/* The meaning, set large */}
        <p className="mt-1.5 max-w-[40ch] font-display text-2xl leading-tight font-semibold md:text-statement">{card.meaning}</p>
      </div>
    </div>,
    // 4. What to do
    <div key="do">
      {/* The advice */}
      <div className={`p-5 md:p-6 ${CARD}`}>
        {/* Heading */}
        <p className={LAB}>Do this</p>
        {/* The advice */}
        <p className="mt-2 max-w-[52ch] text-cue leading-snug font-extrabold">{card.doThis}</p>
      </div>
      {/* A short exercise to say aloud, on try-it cards */}
      {card.exercise && (
        <div className="mt-5 rounded-[22px] bg-warm-tint p-5 text-warm-ink">
          {/* Heading */}
          <p className="text-xs font-extrabold tracking-[.07em] uppercase">Try it now</p>
          {/* The exercise */}
          <p className="mt-1 text-lede font-bold text-ink">{card.exercise}</p>
          {/* Record it and hear it back */}
          <QuickRecorder services={services} action="Record it" maxSec={30} />
        </div>
      )}
      {/* A small step to try for real, away from the app */}
      {card.outThere && (
        <div className={`mt-5 flex gap-3.5 p-4 ${CARD}`}>
          {/* The icon */}
          <span aria-hidden="true" className="flex size-12 flex-none items-center justify-center rounded-[14px] bg-art-sky text-art-cream"><GlobeHemisphereWestIcon weight="bold" className="size-6" /></span>
          {/* The step */}
          <span>
            {/* Heading */}
            <span className="block font-display text-lg leading-tight font-semibold">Try it for real</span>
            {/* The step itself */}
            <span className="mt-1 block font-bold text-ink-muted">{card.outThere}</span>
          </span>
        </div>
      )}
      {/* The practice that fits, last on this screen when no scenario follows */}
      {!scenario && <PractiseRow label={card.tryIt.label} href={card.tryIt.href} />}
    </div>,
    // A scenario: choose the best reply, then say it (only on cards that have one)
    ...(scenario ? [
      <div key="scenario">
        {/* Heading */}
        <p className={LAB}>{`Try it: ${scenario.title}`}</p>
        {/* The item */}
        <div className="mt-2"><ScenarioItem scenario={scenario} services={services} onAnswer={(tier) => { if (today) void saveScenarioAnswer(repo, scenario.id, tier, today); }} /></div>
        {/* The practice that fits, the last thing on the card */}
        <PractiseRow label={card.tryIt.label} href={card.tryIt.href} />
      </div>,
    ] : []),
  ];

  // What kind of card, in the bar's label when it is not a plain explainer
  const kind = card.kind === "myth-or-fact" ? " · Myth or fact?" : card.kind === "explainer" ? "" : " · Try it";

  // Draw the page
  return (
    <main id="main" data-area="learn" className={CARD_PAGE}>
      {/* The bar: the way out, how far through the card, and the set and kind */}
      <PracticeBar close={planStep ? { href: "/", label: "Close, back to Today" } : { href: `/learn/set?id=${card.set}`, label: `Close, back to ${set?.name ?? "Learn"}` }} progress={(index + 1) / screens.length} label={`${set?.name ?? "Learn"}${kind}`} />
      {/* Inside today's practice, which step this is */}
      {plan && <p className="mt-3"><span className={CHIP}>Step {plan.step} of {plan.total}</span></p>}
      {/* The screens */}
      <SwipeDeck screens={screens} index={index} onIndex={setIndex} label={card.title} finish={finish} />
    </main>
  );
}
