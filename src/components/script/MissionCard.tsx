"use client";
// Today's mission: offered with a prediction ("How will it go?"), then waiting for its debrief, then the outcome against the prediction (decision 52)

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
  // On Today: the task and a link to Connect only, without the habit, the reason or the 1 to 5 prediction (decision 62)
  compact?: boolean;
}

// A 1 to 5 choice: five numbered buttons, with only the two ends named underneath (each button still says its word to screen readers)
export function ScaleChoice({ label, value, onChoose }: { label: string; value: number | null; onChoose: (value: number) => void }) {
  // The buttons, then the ends
  return (
    <div className="mt-2 max-w-md">
      {/* The five buttons */}
      <div role="group" aria-label={label} className="grid grid-cols-5 gap-1.5">
        {/* Each point on the scale */}
        {[1, 2, 3, 4, 5].map((point) => (
          // One point, named by its number and word
          <button key={point} type="button" aria-label={`${point} ${SCALE_WORDS[point]}`} aria-pressed={value === point} onClick={() => onChoose(point)} className={`min-h-12 border font-display text-cue ${value === point ? "border-fill bg-fill text-fill-ink" : "border-rule hover:border-ink"}`}>{point}</button>
        ))}
      </div>
      {/* The two ends */}
      <p aria-hidden="true" className="mt-1 flex justify-between text-footnote text-ink-muted"><span>{SCALE_WORDS[1]}</span><span>{SCALE_WORDS[5]}</span></p>
    </div>
  );
}

// Draw the card
export function MissionCard({ repo, now, state, onChange, compact = false }: MissionCardProps) {
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
      {/* Offered, on Today: a way to take it on in Connect */}
      {state.kind === "offer" && compact && <p className="mt-2"><Link href="/small-talk#missions" className={TEXT_LINK}>Take it on in Connect</Link></p>}
      {/* Offered: the habit to drop, why, the prediction, and the choice */}
      {state.kind === "offer" && !compact && (
        <>
          {/* The habit to drop and why, folded away until wanted (decision 63) */}
          <details className="mt-2">
            {/* Open it */}
            <summary className={`${TEXT_LINK} cursor-pointer text-footnote`}>Tip and why</summary>
            {/* The habit to drop */}
            <p className="mt-2 border-l-2 border-accent pl-3"><span className="block text-footnote text-ink-muted">Drop one habit</span>{mission.drop}</p>
            {/* Why */}
            <p className="mt-2 text-footnote text-ink-muted">{mission.why}</p>
            {/* The card behind it */}
            {mission.cardId && <p><Link href={`/learn/card?id=${mission.cardId}`} className={`${TEXT_LINK} text-footnote`}>Read the card</Link></p>}
          </details>
          {/* The prediction */}
          <p className="mt-4 font-medium">How will it go?</p>
          {/* The scale */}
          <ScaleChoice label="How will it go?" value={predicted} onChoose={setPredicted} />
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
          <p className="mt-2 text-footnote text-ink-muted">You expected it to go {SCALE_WORDS[state.record.predicted ?? 3]?.toLowerCase()}.</p>
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
