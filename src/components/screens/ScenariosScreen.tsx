"use client";
// Quick scenarios: three situations one at a time (a missed move comes back in a new situation), then how the first tries went (decision 54); also a step of today's practice (decision 72) Second design pass: focus mode with the practice bar, the scenario's name large, the item drawn after Desktop Screens "SceneReply", the chunky full-width Next, and the round's result on the green panel of a result

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { PRACTICE_NARROW, PracticeBar } from "@/components/script/PracticeBar";
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
import { PRIMARY, TEXT_LINK } from "@/components/script/Buttons";
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

  // Draw it
  return (
    <main id="main" className={PRACTICE_NARROW}>
      {/* Title, with a way back to Learn */}
      <PracticeBar close={planStep ? { href: "/", label: "Close, back to Today" } : { href: "/learn", label: "Close, back to Learn" }} progress={round ? (finished ? 1 : index / round.length) : 0} label={`Scenarios${round && !finished ? ` · ${index + 1} of ${round.length}` : ""}${plan ? ` · step ${plan.step} of ${plan.total}` : ""}`} />
      {/* Opened from Today, before the first answer: the conversation scene, carried over from the step */}
      {planStep && index === 0 && !finished && <ScenePanel scene="conversation" line="Choose the best reply, then say it." />}
      {/* Until the round is chosen, a quiet placeholder (decision 76) */}
      {!round && <Skeleton blocks={["h-12", "h-24", "h-56"]} />}
      {/* One scenario */}
      {scenario && !finished && (
        <section key={scenario.id} aria-label={scenario.title} className="mt-6">
          {/* Its name, the page's heading (the round's result has its own once finished) */}
          <h1 className="font-display text-statement leading-tight font-semibold">{scenario.title}</h1>
          {/* The item */}
          <div className="mt-4"><ScenarioItem scenario={scenario} services={services} onAnswer={answer} /></div>
          {/* On to the next, once answered: the chunky button, full width */}
          {tiers.length > index && <p className="mt-6"><button type="button" onClick={() => setIndex(index + 1)} className={`${PRIMARY} w-full`}>{index + 1 < (round?.length ?? 0) ? "Next scenario" : "Finish"}</button></p>}
        </section>
      )}
      {/* The round's result: the green panel of a result (Desktop Screens "Result"), your blob pleased or wondering */}
      {finished && (
        <section aria-label="Result" className="mt-6 flex flex-1 flex-col">
          <div className="flex flex-col items-start gap-3 rounded-[28px] bg-accent-tint p-6 text-accent-tint-ink">
            {/* Your blob */}
            <Cast who="you" face={tiers.some((tier) => tier === "best") ? "happy" : "wonder"} className="size-20" />
            {/* How many best */}
            <h1 className="font-display text-statement leading-tight font-semibold">{tiers.filter((tier) => tier === "best").length} of {tiers.length} best.</h1>
            {/* What happens next */}
            <p className="max-w-[52ch] font-bold">A move you missed comes back in a new situation next time. Choosing is the warm-up; saying it aloud and trying it for real are what change things.</p>
          </div>
          {/* A real try (not inside today's practice, which shows the mission on Today) */}
          {!planStep && <p className="mt-4"><Link href="/learn#missions" className={TEXT_LINK}>Today’s mission</Link></p>}
          {/* Push the band down */}
          <div className="flex-1" />
          {/* Inside today's practice: on to the next step, or finish; otherwise back to Learn */}
          {planStep ? (plan?.next ? <ActionBand action={`Next: step ${plan.step + 1}`} aside={plan.next.label} href={plan.next.href} /> : <ActionBand action="Finish today’s practice" aside="back to Today" href="/" />) : <ActionBand action="Back to Learn" aside="done" href="/learn" />}
        </section>
      )}
    </main>
  );
}
