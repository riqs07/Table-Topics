"use client";
// Quick scenarios: three situations one at a time (a missed move comes back in a new situation), then how the first tries went (decision 54)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Masthead } from "@/components/script/Masthead";
import { ScenarioItem } from "@/components/script/ScenarioItem";
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

// Draw the page
export function ScenariosScreen({ services = browserRecordingServices, ...props }: ScreenProps & { services?: RecordingServices }) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // This round's scenarios (null while loading)
  const [round, setRound] = useState<Scenario[] | null>(null);
  // The one showing
  const [index, setIndex] = useState(0);
  // The tier chosen for each, so far
  const [tiers, setTiers] = useState<Tier[]>([]);

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
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
      {/* Title, with a way back to Learn */}
      <Masthead title="Scenarios" nav={false} close={{ href: "/learn", label: "Close, back to Learn" }}>{round && !finished ? `${index + 1} of ${round.length}` : ""}</Masthead>
      {/* One scenario */}
      {scenario && !finished && (
        <section key={scenario.id} aria-label={scenario.title} className="mt-6">
          {/* Its name */}
          <p className="text-footnote italic text-ink-muted">{scenario.title}</p>
          {/* The item */}
          <div className="mt-2"><ScenarioItem scenario={scenario} services={services} onAnswer={answer} /></div>
          {/* On to the next, once answered */}
          {tiers.length > index && <p className="mt-6"><button type="button" onClick={() => setIndex(index + 1)} className="inline-flex min-h-11 items-center bg-accent px-5 text-accent-ink hover:opacity-90">{index + 1 < (round?.length ?? 0) ? "Next scenario" : "Finish"}</button></p>}
        </section>
      )}
      {/* The round's result */}
      {finished && (
        <section aria-label="Result" className="mt-8 flex flex-1 flex-col">
          {/* How many best */}
          <h1 className="font-display text-statement tracking-tight">{tiers.filter((tier) => tier === "best").length} of {tiers.length} best.</h1>
          {/* What happens next */}
          <p className="mt-3 max-w-[52ch] text-lede">A move you missed comes back in a new situation next time. Choosing is the warm-up; saying it aloud and trying it for real are what change things.</p>
          {/* A real try */}
          <p className="mt-4"><Link href="/small-talk#missions" className="inline-flex min-h-11 items-center underline underline-offset-4">Today’s mission</Link></p>
          {/* Push the band down */}
          <div className="flex-1" />
          {/* Back to Learn */}
          <ActionBand action="Back to Learn" aside="done" href="/learn" />
        </section>
      )}
    </main>
  );
}
