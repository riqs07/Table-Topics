"use client";
// Today's mission and how past tries went against what was expected: the "try it for real" part of Learn (moved from Connect, decision 66)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the mission card
import { MissionCard } from "@/components/script/MissionCard";
// Load the mission lookup
import { findMission } from "@/content/missions";
// Load the mission rules
import { betterThanFeared, missionToday, triedMissions } from "@/core/missions";
// Load the day label
import { dayLabel } from "@/core/copy";
// Load the record and repository types
import type { MissionRecord } from "@/data/records";
import type { Repository } from "@/data/repository";

// How many recent tries to list
const RECENT_MISSIONS = 5;

// Draw the section
export function MissionSection({ repo, today }: { repo: Repository; today: Date }) {
  // The mission tries, oldest first (null while loading)
  const [missions, setMissions] = useState<MissionRecord[] | null>(null);

  // Read the tries once
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read them from the settings
    repo.getSettings(today).then((settings) => {
      // Keep them if still open
      if (!cancelled) setMissions(settings.missions ?? []);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today]);

  // Nothing until loaded
  if (!missions) return null;
  // The tries so far
  const tried = triedMissions(missions);
  // The card, then expected against actual
  return (
    <section id="missions" aria-labelledby="missions-heading" className="mt-6 scroll-mt-6">
      {/* Heading for screen readers (the card has its own small heading) */}
      <h2 id="missions-heading" className="sr-only">Try it for real</h2>
      {/* The card */}
      <MissionCard key={missions.length} repo={repo} now={today} state={missionToday(missions, today)} onChange={setMissions} />
      {/* Expected against actual, for the latest tries */}
      {tried.length > 0 && (
        <>
          {/* The headline */}
          <p className="mt-4 text-lede">{betterThanFeared(missions).better} of {betterThanFeared(missions).total} went better than you expected.</p>
          {/* The latest */}
          <ul aria-label="Your missions" className="mt-2 divide-y divide-rule border-y border-rule">
            {/* Each try */}
            {tried.slice(0, RECENT_MISSIONS).map((record) => (
              // One try: the move, then expected against actual as two short bars
              <li key={record.id} className="flex items-center gap-4 py-3">
                {/* The move and day */}
                <span className="min-w-0 flex-1">
                  {/* The move */}
                  <span className="block">{findMission(record.missionId)?.move ?? "Mission"}</span>
                  {/* The day */}
                  <span className="block text-footnote text-ink-muted">{dayLabel(new Date(record.debriefedAt ?? record.day), today)}</span>
                </span>
                {/* Expected against actual */}
                <span aria-label={`Expected ${record.predicted} of 5, went ${record.outcome} of 5`} className="flex w-32 flex-none flex-col gap-1">
                  {/* Expected */}
                  <span aria-hidden="true" className="flex items-center gap-2 text-footnote text-ink-muted"><span className="w-10">said</span><span className="h-1.5 bg-rule" style={{ width: `${(record.predicted ?? 0) * 12}px` }} /></span>
                  {/* Actual */}
                  <span aria-hidden="true" className="flex items-center gap-2 text-footnote"><span className="w-10">went</span><span className="h-1.5 bg-accent" style={{ width: `${(record.outcome ?? 0) * 12}px` }} /></span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
