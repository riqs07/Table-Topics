"use client";
// One scenario question: read the situation, choose the best reply, see every reply's tier and why, then say the move in your own words (decision 54)

// Load React's state tool
import { useState } from "react";
// Load the quick recorder for the spoken step
import { QuickRecorder } from "@/components/script/QuickRecorder";
// Load the scenario content
import { TIER_NAMES, type Scenario, type Tier } from "@/content/scenarios";
// Load the recording contract
import type { RecordingServices } from "@/audio/services";
// Load the shared press effect and card look (decision 79)
import { PRESS } from "@/components/script/Buttons";
import { CARD } from "@/components/script/textStyles";

// What the item needs
interface ScenarioItemProps {
  // The scenario
  scenario: Scenario;
  // The recording services, for saying it aloud
  services: RecordingServices;
  // Called once with the chosen reply's tier
  onAnswer?: (tier: Tier) => void;
}

// The look of each tier once revealed: best filled, the others by their edge
const TIER_LOOK: Readonly<Record<Tier, string>> = { best: "border-fill bg-fill text-fill-ink", good: "border-accent bg-card", flat: "border-transparent bg-card text-ink-muted", misstep: "border-ink bg-card" };

// Draw the item
export function ScenarioItem({ scenario, services, onAnswer }: ScenarioItemProps) {
  // The reply chosen (its place), once chosen
  const [chosen, setChosen] = useState<number | null>(null);
  // The best reply's place
  const best = scenario.options.findIndex((option) => option.tier === "best");

  // Choose a reply
  function choose(position: number) {
    // Once only
    if (chosen !== null) return;
    // Note it
    setChosen(position);
    // Report its tier
    onAnswer?.(scenario.options[position]!.tier);
  }

  // The chosen reply
  const picked = chosen === null ? null : scenario.options[chosen]!;

  // Draw it
  return (
    <div>
      {/* The situation */}
      <p className="max-w-[52ch] text-lede">{scenario.situation}</p>
      {/* The question */}
      <p className="mt-4 text-ink-muted">What’s the best thing to say?</p>
      {/* The replies */}
      <div role="group" aria-label="Replies" className="mt-2 flex flex-col gap-2">
        {/* Each reply */}
        {scenario.options.map((option, position) => (
          // One reply: a button before choosing, then marked with its tier and pattern
          <button key={option.text} type="button" disabled={chosen !== null} onClick={() => choose(position)} data-tier={chosen !== null ? option.tier : undefined} className={`min-h-14 rounded-2xl border-2 px-4 py-3 text-left shadow-card ${PRESS} ${chosen !== null ? TIER_LOOK[option.tier] : "border-transparent bg-card hover:border-accent"}`}>
            {/* The words */}
            <span className="block">{option.text}</span>
            {/* Once chosen: its tier and the pattern behind it */}
            {chosen !== null && <span className="mt-1 block text-footnote">{TIER_NAMES[option.tier]} · {option.pattern}{position === chosen ? " · your choice" : ""}</span>}
          </button>
        ))}
      </div>
      {/* The reveal */}
      {picked && (
        <div role="status" className="mt-4">
          {/* How the choice did */}
          <p className="font-display text-cue">{picked.tier === "best" ? "Yes." : picked.tier === "good" ? "That works too." : picked.tier === "flat" ? "Not wrong, but it gives them little to work with." : "A common move. Here’s what it does."}</p>
          {/* Why the chosen one works, or falls short */}
          <p className="mt-1 max-w-[52ch] text-lede">{picked.why}</p>
          {/* Why the best one works, when another was chosen */}
          {picked.tier !== "best" && <p className="mt-2 max-w-[52ch] text-lede"><em>The best one:</em> {scenario.options[best]!.why}</p>}
          {/* The move */}
          <p className="mt-3 border-l-2 border-accent pl-3 text-lede"><span className="block text-footnote text-ink-muted">The move</span>{scenario.principle}</p>
          {/* A note on context */}
          {scenario.note && <p className="mt-2 text-footnote text-ink-muted">{scenario.note}</p>}
          {/* Say it aloud */}
          <div className={`mt-5 p-4 ${CARD}`}>
            {/* The ask */}
            <p className="text-footnote text-ink-muted">Now say it in your own words</p>
            {/* What to say */}
            <p className="mt-1 text-lede">{scenario.sayIt}</p>
            {/* Record it and hear it back */}
            <QuickRecorder services={services} action="Say it" maxSec={20} />
          </div>
        </div>
      )}
    </div>
  );
}
