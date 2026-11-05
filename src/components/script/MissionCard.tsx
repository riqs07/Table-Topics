"use client";
// Today's mission: offered (with no prediction since decision 104), then waiting for its debrief, then how it went (against the prediction for older tries that have one; decision 52). Second design pass (storyboard 23, "Today's mission"): offered, a white card with you and the friend on its pink, the task large, Sage saying the habit to drop, and the chunky "I'll try it"; once taken on, a slim white card with a small tile

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
import { PRESS, QUIET, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the shared card, label and bubble looks (second design pass)
import { BUBBLE, CARD, LAB } from "@/components/script/textStyles";
// Load the cast (you, the friend and Sage) and the tile tints
import { Cast } from "@/components/scenes/Cast";
import { GROUND_TINT } from "@/components/scenes/ModeTile";

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
  // On Today: the task and a link to Learn only, without the habit or the reason (decision 62)
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
          <button key={point} type="button" aria-label={`${point} ${SCALE_WORDS[point]}`} aria-pressed={value === point} onClick={() => onChoose(point)} className={`min-h-12 rounded-xl border-2 font-display text-cue font-semibold ${PRESS} ${value === point ? "border-fill bg-fill text-fill-ink" : "border-rule bg-card hover:border-ink"}`}>{point}</button>
        ))}
      </div>
      {/* The two ends */}
      <p aria-hidden="true" className="mt-1 flex justify-between text-footnote text-ink-muted"><span>{SCALE_WORDS[1]}</span><span>{SCALE_WORDS[5]}</span></p>
    </div>
  );
}

// Draw the card
export function MissionCard({ repo, now, state, onChange, compact = false }: MissionCardProps) {
  // Whether a save is under way
  const [saving, setSaving] = useState(false);
  // The mission
  const mission = state.mission;

  // Accept, with no prediction (the user asked for the 1 to 5 guess to go; decision 104)
  async function accept() {
    // Saving
    setSaving(true);
    // Save, then update the page
    onChange(await acceptMission(repo, mission.id, null, now));
  }

  // Skip for today
  async function skip() {
    // Saving
    setSaving(true);
    // Save, then update the page
    onChange(await skipMission(repo, mission.id, now));
  }

  // Once taken on or answered, one slim line: the task and what is next, so it no longer leads the page (decision 79)
  if (state.kind !== "offer") {
    // The slim card
    return (
      <section aria-labelledby="mission-heading" className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 motion-safe:animate-rise ${CARD}`}>
        {/* The mission's tile: you and the friend, on its pink */}
        <span aria-hidden="true" className={`flex size-12 flex-none items-end justify-center overflow-hidden rounded-[14px] ${GROUND_TINT.bloom}`}><Cast who="you" face="happy" className="-mr-1 size-7" /><Cast who="friend" face="happy" className="size-7" /></span>
        {/* What it is, and the task */}
        <p className="min-w-0 flex-1 font-bold"><span id="mission-heading" className="block text-xs font-extrabold tracking-[.07em] text-ink-muted uppercase">Today’s mission</span> {mission.task}</p>
        {/* Waiting for its debrief: the way in */}
        {state.kind === "debrief" && <Link href={`/mission?id=${state.record.id}&from=${compact ? "today" : "learn"}`} className={`${TEXT_LINK} font-semibold`}>How did it go?</Link>}
        {/* Answered today: how it went, or that it was skipped */}
        {state.kind === "answered" && <p className="basis-full text-footnote text-ink-muted">{state.record.status === "skipped" ? "Skipped for today. A mission will be here tomorrow." : compareLine(state.record)}</p>}
      </section>
    );
  }

  // Draw it
  return (
    <section aria-labelledby="mission-heading" className={`overflow-hidden motion-safe:animate-rise ${CARD}`}>
      {/* The scene on its pink: you and the friend, talking (storyboard 23) */}
      <div aria-hidden="true" className={`flex h-28 items-end justify-center gap-1 md:h-32 ${GROUND_TINT.bloom}`}>
        {/* You */}
        <Cast who="you" face="happy" className="-mb-2 size-24 md:size-28" />
        {/* The friend */}
        <Cast who="friend" face="happy" className="-mb-2 size-24 md:size-28" />
      </div>
      {/* The words and the choice */}
      <div className="p-5 md:p-6">
      {/* Small heading: what it is, and the move */}
      <p className={LAB}><span id="mission-heading">Today’s mission</span> · {mission.move}</p>
      {/* The task */}
      <p className="mt-1.5 font-display text-2xl leading-tight font-semibold md:text-statement">{mission.task}</p>
      {/* Offered, on Today: a way to take it on in Connect */}
      {state.kind === "offer" && compact && <p className="mt-2"><Link href="/learn#missions" className={TEXT_LINK}>Take it on in Learn</Link></p>}
      {/* Offered: the habit to drop, why, and the choice */}
      {state.kind === "offer" && !compact && (
        <>
          {/* The habit to drop and why, folded away until wanted (decision 63) */}
          <details className="mt-2">
            {/* Open it */}
            <summary className={`${TEXT_LINK} cursor-pointer text-footnote`}>Tip and why</summary>
            {/* The habit to drop, said by Sage */}
            <div className="mt-2 flex items-end gap-3">
              {/* Sage */}
              <Cast who="sage" mood="encouraging" className="size-12 flex-none" />
              {/* The bubble */}
              <p className={`${BUBBLE} mb-1 min-w-0 flex-1`}><span className={`block ${LAB}`}>Drop one habit</span>{mission.drop}</p>
            </div>
            {/* Why */}
            <p className="mt-3 text-footnote font-bold text-ink-muted">{mission.why}</p>
            {/* The card behind it */}
            {mission.cardId && <p><Link href={`/learn/card?id=${mission.cardId}`} className={`${TEXT_LINK} text-footnote`}>Read the card</Link></p>}
          </details>
          {/* Accept, or not today */}
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Accept (a second choice on Learn, whose chunky action is the next card) */}
            <button type="button" onClick={() => void accept()} disabled={saving} className={SECONDARY}>I’ll try it</button>
            {/* Skip */}
            <button type="button" onClick={() => void skip()} disabled={saving} className={QUIET}>Not today</button>
          </p>
        </>
      )}
      </div>
    </section>
  );
}
