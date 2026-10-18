"use client";
// Today's mission: offered with a prediction ("How do you think it will go?"), then waiting for its debrief, then the outcome against the prediction (decision 52)

// Load React's state tool
import { useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the mission scale's words
import { SCALE_WORDS } from "@/content/missions";
// Load the mission rules
import { compareLine, type MissionState } from "@/core/missions";
// Load the saving helpers
import { acceptMission, skipMission } from "@/data/missions";
// Load the record and repository types
import type { MissionRecord } from "@/data/records";
import type { Repository } from "@/data/repository";
// Load the shared button looks
import { PRIMARY, QUIET, TEXT_LINK } from "@/components/script/Buttons";

// What the card needs
interface MissionCardProps {
  // Where tries are saved
  repo: Repository;
  // Now
  now: Date;
  // Where today's mission stands
  state: MissionState;
  // Called with every try after one is saved, so the page can update
  onChange: (records: MissionRecord[]) => void;
}

// A 1 to 5 choice, as a row of buttons
export function ScaleChoice({ label, value, onChoose }: { label: string; value: number | null; onChoose: (value: number) => void }) {
  // The five buttons, each named by its number and word
  return (
    <div role="group" aria-label={label} className="mt-2 grid grid-cols-5 gap-1.5">
      {/* Each point on the scale */}
      {[1, 2, 3, 4, 5].map((point) => (
        // One point
        <button key={point} type="button" aria-pressed={value === point} onClick={() => onChoose(point)} className={`flex min-h-14 flex-col items-center justify-center border px-1 text-footnote leading-tight ${value === point ? "border-fill bg-fill text-fill-ink" : "border-rule hover:border-ink"}`}>
          {/* The number */}
          <span className="font-display text-cue">{point}</span>
          {/* Its word */}
          <span className="whitespace-nowrap text-tab">{SCALE_WORDS[point]}</span>
        </button>
      ))}
    </div>
  );
}

// Draw the card
export function MissionCard({ repo, now, state, onChange }: MissionCardProps) {
  // The prediction chosen so far
  const [predicted, setPredicted] = useState<number | null>(null);
  // Whether a save is under way
  const [saving, setSaving] = useState(false);
  // The mission
  const mission = state.mission;

  // Accept with the prediction
  async function accept() {
    // Nothing to save without a prediction
    if (predicted === null) return;
    // Saving
    setSaving(true);
    // Save, then update the page
    onChange(await acceptMission(repo, mission.id, predicted, now));
  }

  // Skip for today
  async function skip() {
    // Saving
    setSaving(true);
    // Save, then update the page
    onChange(await skipMission(repo, mission.id, now));
  }

  // Draw it
  return (
    <section aria-labelledby="mission-heading" className="border-y border-ink py-4">
      {/* Small heading: what it is, and the move */}
      <p className="text-footnote text-ink-muted"><span id="mission-heading">Today’s mission</span> · {mission.move}</p>
      {/* The task */}
      <p className="mt-1 font-display text-cue">{mission.task}</p>
      {/* Offered: the habit to drop, why, the prediction, and the choice */}
      {state.kind === "offer" && (
        <>
          {/* The habit to drop */}
          <p className="mt-3 border-l-2 border-accent pl-3 text-lede"><span className="block text-footnote text-ink-muted">Drop one habit</span>{mission.drop}</p>
          {/* Why, with a link to the card behind it */}
          <p className="mt-3 text-footnote text-ink-muted">{mission.why}</p>
          {/* The card behind it */}
          {mission.cardId && <p><Link href={`/learn/card?id=${mission.cardId}`} className={`${TEXT_LINK} text-footnote`}>Why it works</Link></p>}
          {/* The prediction */}
          <p className="mt-4 font-medium">How do you think it will go?</p>
          {/* The scale */}
          <ScaleChoice label="How do you think it will go?" value={predicted} onChoose={setPredicted} />
          {/* Accept, or not today */}
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Accept */}
            <button type="button" onClick={() => void accept()} disabled={predicted === null || saving} className={PRIMARY}>I’ll try it</button>
            {/* Skip */}
            <button type="button" onClick={() => void skip()} disabled={saving} className={QUIET}>Not today</button>
          </p>
        </>
      )}
      {/* Waiting for its debrief */}
      {state.kind === "debrief" && (
        <>
          {/* What was expected */}
          <p className="mt-2 text-footnote text-ink-muted">You expected it to go {SCALE_WORDS[state.record.predicted ?? 3]?.toLowerCase()}. Drop the habit: {mission.drop}</p>
          {/* Debrief */}
          <p className="mt-3"><Link href={`/mission?id=${state.record.id}`} className={PRIMARY}>How did it go?</Link></p>
        </>
      )}
      {/* Answered today */}
      {state.kind === "answered" && (
        <p className="mt-2 text-lede">{state.record.status === "skipped" ? "Skipped for today. A mission will be here tomorrow." : compareLine(state.record)}</p>
      )}
    </section>
  );
}
