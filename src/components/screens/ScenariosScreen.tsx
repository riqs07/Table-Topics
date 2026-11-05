"use client";
// Quick scenarios: three situations one at a time (a missed move comes back in a new situation), then how the first tries went (decision 54); also a step of today's practice (decision 72). Second design pass: focus mode with the practice bar, each scenario in the two columns of Desktop Screens "SceneReply" (the situation and the friend on the left, the replies on the right), Next chunky only once the move has been said aloud, and the round's result on the result's panel, green for a good round and warm with Sage for a rough one

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { PRACTICE_BODY, PRACTICE_MAIN, PracticeBar } from "@/components/script/PracticeBar";
import { ScenarioItem } from "@/components/script/ScenarioItem";
import { Skeleton } from "@/components/script/Skeleton";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the browser's recording services, and their type
import { browserRecordingServices } from "@/audio/browserServices";
import type { RecordingServices } from "@/audio/services";
// Load the scenario types
import type { Scenario, Tier } from "@/content/scenarios";
// Load the choice of scenarios
import { nextScenarios } from "@/core/scenarios";
// Load the progress helpers
import { loadScenarioProgress, saveScenarioAnswer } from "@/data/scenarioProgress";
// Load the shared button looks
import { PRIMARY, SECONDARY } from "@/components/script/Buttons";
// Load the plan navigation type, today's practice and step addresses
import type { PlanNav } from "@/components/screens/planNav";
// Load the plan loader (the plan's code loads after the page shows; decision 88)
import { loadDailyPlanLater } from "@/data/loadDailyPlanLater";
import { planHref } from "@/core/planSteps";
// Load the panel with a step's scene, carried over from Today (decision 141)
import { ScenePanel } from "@/components/scenes/ScenePanel";
// Load the cast, for your blob on the result
import { Cast } from "@/components/scenes/Cast";

// Draw the page
export function ScenariosScreen({ services = browserRecordingServices, planStep = null, ...props }: ScreenProps & { services?: RecordingServices; planStep?: number | null }) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // This round's scenarios (null while loading)
  const [round, setRound] = useState<Scenario[] | null>(null);
  // The one showing
  const [index, setIndex] = useState(0);
  // The scenario last said aloud (its place), so Next becomes the chunky button only once it has been said
  const [said, setSaid] = useState<number | null>(null);
  // The tier chosen for each, so far
  const [tiers, setTiers] = useState<Tier[]>([]);
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

  // Choose the round once in the browser
  useEffect(() => {
    // Wait for the date
    if (!today) return;
    // Ignore the result if closed first
    let cancelled = false;
    // Load progress and choose
    loadScenarioProgress(repo, today).then((progress) => {
      // Keep the round if still open
      if (!cancelled) setRound(nextScenarios(progress));
    });
    // Mark as closed
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [repo, today]);

  // The scenario showing
  const scenario = round?.[index];
  // Whether the round is over
  const finished = !!round && index >= round.length;

  // Note an answer and save it
  function answer(tier: Tier) {
    // Note it
    setTiers((previous) => [...previous, tier]);
    // Save it
    if (scenario && today) void saveScenarioAnswer(repo, scenario.id, tier, today);
  }

  // How many best this round, and whether that is a good round (at least half)
  const bests = tiers.filter((tier) => tier === "best").length;
  // (good)
  const good = bests > 0 && bests * 2 >= tiers.length;

  // Draw it
  return (
    <main id="main" className={PRACTICE_MAIN}>
      {/* The bar: the way back, how far through the round, and which scenario */}
      <PracticeBar close={planStep ? { href: "/", label: "Close, back to Today" } : { href: "/learn", label: "Close, back to Learn" }} progress={round ? (finished ? 1 : (index + (tiers.length > index ? 1 : 0)) / round.length) : 0} label={`Scenarios${round && !finished ? ` · ${index + 1} of ${round.length}` : ""}${plan ? ` · step ${plan.step} of ${plan.total}` : ""}`} />
      <div className={PRACTICE_BODY}>
        {/* Opened from Today, before the first answer: the conversation scene, carried over from the step */}
        {planStep && index === 0 && !finished && <ScenePanel scene="conversation" line="Choose the best reply, then say it." />}
        {/* Until the round is chosen, a quiet placeholder (decision 76) */}
        {!round && <Skeleton blocks={["h-12", "h-24", "h-56"]} />}
        {/* One scenario, in the two columns of a scene (Desktop Screens "SceneReply") */}
        {scenario && !finished && (
          <section key={scenario.id} aria-label={scenario.title}>
            {/* The item, with its name as the page's heading and the way on at the foot of the right column (chunky once you have said it, quiet before) */}
            <ScenarioItem scenario={scenario} services={services} onAnswer={answer} onSaid={() => setSaid(index)} layout="columns" heading={<h1 className="font-display text-statement leading-tight font-semibold">{scenario.title}</h1>} after={tiers.length > index ? <p><button type="button" onClick={() => setIndex(index + 1)} className={`${said === index ? PRIMARY : SECONDARY} w-full`}>{index + 1 < (round?.length ?? 0) ? "Next scenario" : "Finish"}</button></p> : null} />
          </section>
        )}
        {/* The round's result: the result's panel, green with your blob for a good round, warm with Sage for a rough one (Desktop Screens "Result") */}
        {finished && (
          <section aria-label="Result" className={`mx-auto mt-4 flex max-w-2xl flex-col items-start gap-3 rounded-[28px] p-6 md:p-8 ${good ? "bg-accent-tint text-accent-tint-ink" : "bg-warm-tint text-warm-ink"}`}>
            {/* Your blob, pleased, or Sage, encouraging */}
            {good ? <Cast who="you" face="happy" className="size-20" /> : <Cast who="sage" mood="encouraging" className="size-20" />}
            {/* How many best */}
            <h1 className="font-display text-statement leading-tight font-semibold">{bests} of {tiers.length} best.</h1>
            {/* What happens next */}
            <p className="max-w-[52ch] font-bold">A move you missed comes back in a new situation next time. Choosing is the warm-up; saying it aloud and trying it for real are what change things.</p>
            {/* Inside today's practice: on to the next step, or finish; otherwise back to Learn (the one chunky button, in the panel) */}
            {planStep ? (plan?.next ? <Link href={plan.next.href} className={`${PRIMARY} mt-2 w-full`}>Next: step {plan.step + 1}<span className="sr-only">, {plan.next.label}</span></Link> : <Link href="/" className={`${PRIMARY} mt-2 w-full`}>Finish today’s practice</Link>) : <Link href="/learn" className={`${PRIMARY} mt-2 w-full`}>Back to Learn</Link>}
            {/* A real try (not inside today's practice, which shows the mission on Today) */}
            {!planStep && <Link href="/learn#missions" className={`${SECONDARY} w-full`}>Today’s mission</Link>}
          </section>
        )}
      </div>
    </main>
  );
}
