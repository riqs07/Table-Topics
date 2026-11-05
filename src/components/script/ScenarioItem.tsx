"use client";
// One scenario question: read the situation, choose the best reply, see every reply's tier and why, then say the move in your own words (decision 54). Second design pass, after Desktop Screens "SceneReply": the situation on the warm tint, your blob over "What's the best thing to say?", the replies as soft bubbles, the one you pick lifted and edged in green with the verdict tucked under it, the move on the soft green, and "Now say it" on a white card

// Load React's state tool
import { useState } from "react";
// Load the quick recorder for the spoken step
import { QuickRecorder } from "@/components/script/QuickRecorder";
// Load the scenario content
import { TIER_NAMES, type Scenario, type Tier } from "@/content/scenarios";
// Load the recording contract
import type { RecordingServices } from "@/audio/services";
// Load the shared press effect and looks
import { PRESS } from "@/components/script/Buttons";
import { CARD, LAB, LAB_ON_TINT } from "@/components/script/textStyles";
// Load the cast, for your blob
import { Cast } from "@/components/scenes/Cast";

// What the item needs
interface ScenarioItemProps {
  // The scenario
  scenario: Scenario;
  // The recording services, for saying it aloud
  services: RecordingServices;
  // Called once with the chosen reply's tier
  onAnswer?: (tier: Tier) => void;
}

// The look of each tier once revealed, on the replies not picked: the best edged in green, the others quiet
const TIER_LOOK: Readonly<Record<Tier, string>> = { best: "border-accent bg-card text-ink", good: "border-transparent bg-paper text-ink", flat: "border-transparent bg-paper text-ink-muted", misstep: "border-transparent bg-paper text-ink-muted" };

// Your blob's face once a reply is picked
const FACES: Readonly<Record<Tier, "happy" | "ready" | "wonder">> = { best: "happy", good: "happy", flat: "wonder", misstep: "wonder" };

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
  // Whether the pick went well
  const good = picked?.tier === "best" || picked?.tier === "good";

  // Draw it
  return (
    <div className="flex flex-col gap-5">
      {/* The situation, on the warm tint */}
      <div className="rounded-[22px] bg-warm-tint px-5 py-4 text-warm-ink">
        {/* Heading */}
        <p className={LAB_ON_TINT}>The situation</p>
        {/* The words */}
        <p className="mt-1 max-w-[56ch] text-lede leading-snug font-bold">{scenario.situation}</p>
      </div>
      {/* Your blob, and the question */}
      <div className="flex items-center gap-4">
        {/* You, wondering until you pick */}
        <Cast who="you" face={picked ? FACES[picked.tier] : "wonder"} className="size-14 flex-none md:size-16" />
        {/* The question */}
        <p className="font-display text-cue leading-tight font-semibold">What’s the best thing to say?</p>
      </div>
      {/* The replies */}
      <div role="group" aria-label="Replies" className="flex flex-col gap-3">
        {/* Each reply */}
        {scenario.options.map((option, position) => (
          // One reply: a soft bubble before choosing, then the pick lifted and every reply marked with its tier and pattern
          <button key={option.text} type="button" disabled={chosen !== null} onClick={() => choose(position)} data-tier={chosen !== null ? option.tier : undefined} className={`min-h-14 rounded-[18px] border-2 px-5 py-3.5 text-left text-lg font-bold ${PRESS} ${position === chosen ? "-rotate-[0.6deg] border-accent bg-card text-ink shadow-picked" : chosen !== null ? TIER_LOOK[option.tier] : "border-transparent bg-paper text-ink hover:border-accent hover:bg-card"}`}>
            {/* The words */}
            <span className="block">{option.text}</span>
            {/* Once chosen: its tier and the pattern behind it */}
            {chosen !== null && <span className="mt-1.5 flex flex-wrap items-center gap-2 text-sm font-extrabold"><span className={`rounded-full px-2.5 py-0.5 text-chip uppercase tracking-[.07em] ${option.tier === "best" ? "bg-accent-tint text-accent-tint-ink" : "bg-paper-raised text-ink-muted"}`}>{TIER_NAMES[option.tier]}</span>{option.pattern}{position === chosen ? " · your choice" : ""}</span>}
          </button>
        ))}
      </div>
      {/* The reveal */}
      {picked && (
        <div role="status" className="flex flex-col gap-4">
          {/* How the choice did, and why, on green for a good pick and warm otherwise */}
          <div className={`rounded-[22px] px-5 py-4 ${good ? "bg-accent-tint text-accent-tint-ink" : "bg-warm-tint text-warm-ink"}`}>
            {/* How the choice did */}
            <p className="font-display text-xl font-semibold">{picked.tier === "best" ? "Yes." : picked.tier === "good" ? "That works too." : picked.tier === "flat" ? "Not wrong, but it gives them little to work with." : "A common move. Here’s what it does."}</p>
            {/* Why the chosen one works, or falls short */}
            <p className="mt-1 max-w-[56ch] font-bold">{picked.why}</p>
            {/* Why the best one works, when another was chosen */}
            {picked.tier !== "best" && <p className="mt-2 max-w-[56ch] font-bold"><em className="font-extrabold not-italic">The best one:</em> {scenario.options[best]!.why}</p>}
          </div>
          {/* The move */}
          <div className={`px-5 py-4 ${CARD}`}>
            {/* Heading */}
            <p className={LAB}>The move</p>
            {/* The move itself */}
            <p className="mt-1 font-display text-cue leading-snug font-semibold">{scenario.principle}</p>
            {/* A note on context */}
            {scenario.note && <p className="mt-2 text-footnote font-bold text-ink-muted">{scenario.note}</p>}
          </div>
          {/* Say it aloud */}
          <div className={`p-5 ${CARD}`}>
            {/* The ask */}
            <p className={LAB}>Now say it in your own words</p>
            {/* What to say */}
            <p className="mt-1 font-display text-xl leading-snug font-semibold">{scenario.sayIt}</p>
            {/* Record it and hear it back */}
            <QuickRecorder services={services} action="Say it" maxSec={20} />
          </div>
        </div>
      )}
    </div>
  );
}
