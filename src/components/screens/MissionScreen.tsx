"use client";
// A mission's debrief, by taps and by voice: did you try it, how it went (1 to 5), what you noticed, then how it went, against the prediction for older tries that have one (decision 52; new tries have none since decision 104)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Masthead } from "@/components/script/Masthead";
import { ScaleChoice } from "@/components/script/MissionCard";
import { QuickRecorder } from "@/components/script/QuickRecorder";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the browser's recording services, and their type
import { browserRecordingServices } from "@/audio/browserServices";
import type { RecordingServices } from "@/audio/services";
// Load the missions
import { SCALE_WORDS, findMission } from "@/content/missions";
// Load the comparison sentence
import { compareLine } from "@/core/missions";
// Load the saving helpers
import { debriefMission, loadMissions } from "@/data/missions";
// Load the record type
import type { MissionRecord } from "@/data/records";
// Load the shared button looks
import { PRIMARY } from "@/components/script/Buttons";

// Draw the debrief
export function MissionScreen({ recordId, from = "learn", services = browserRecordingServices, ...props }: ScreenProps & { recordId: string; from?: "today" | "learn"; services?: RecordingServices }) {
  // Where the debrief was opened from, and the way back there (decision 67)
  const origin = from === "today" ? { href: "/", name: "Today" } : { href: "/learn", name: "Learn" };
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // The try being debriefed (undefined while loading, null if missing)
  const [record, setRecord] = useState<MissionRecord | null | undefined>(undefined);
  // Whether they tried it (null until answered)
  const [tried, setTried] = useState<boolean | null>(null);
  // How it went
  const [outcome, setOutcome] = useState<number | null>(null);
  // What they noticed
  const [note, setNote] = useState("");
  // Whether a save is under way
  const [saving, setSaving] = useState(false);

  // Load the try
  useEffect(() => {
    // Wait for the date
    if (!today) return;
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the tries
    loadMissions(repo, today).then((records) => {
      // Keep this one, if still open
      if (!cancelled) setRecord(records.find((item) => item.id === recordId) ?? null);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [recordId, repo, today]);

  // Save the debrief
  async function save(debrief: { tried: boolean; outcome: number | null; tooMuch: boolean }) {
    // Nothing to save before loading
    if (!record || !today) return;
    // Saving
    setSaving(true);
    // Save it
    const records = await debriefMission(repo, record, { ...debrief, note }, new Date());
    // Show the saved try
    setRecord(records.find((item) => item.id === record.id) ?? null);
    // Done
    setSaving(false);
  }

  // The mission
  const mission = record ? findMission(record.missionId) : undefined;

  // Draw the page
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-3xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
      {/* Title and a way back to Today */}
      <Masthead title="Mission" nav={false} close={{ href: origin.href, label: `Close, back to ${origin.name}` }}>{mission?.move ?? ""}</Masthead>
      {/* Missing */}
      {record === null && <h1 className="sr-only">Mission</h1>}
      {/* Missing */}
      {record === null && <p className="mt-8 text-lede">This mission could not be found. <Link href={origin.href} className="underline underline-offset-4">Back to {origin.name}</Link></p>}
      {/* The debrief */}
      {record && mission && (
        <div className="flex flex-1 flex-col">
          {/* The task */}
          <p className="mt-6 text-footnote text-ink-muted">The mission</p>
          {/* Its words */}
          <h1 className="mt-1 font-display text-statement tracking-tight">{mission.task}</h1>
          {/* Debriefed: the outcome against the prediction, and what they noticed */}
          {record.status === "done" ? (
            <section aria-label="How it went" className="mt-6">
              {/* The comparison */}
              <p role="status" className="text-lede">{compareLine(record)}</p>
              {/* Their note */}
              {record.note && <p className="mt-4 border-l-2 border-rule pl-3 text-lede"><span className="block text-footnote text-ink-muted">What you noticed</span>{record.note}</p>}
              {/* Stepping back */}
              {record.tooMuch && <p className="mt-4 text-lede">Next time, the mission steps back to an easier one.</p>}
            </section>
          ) : (
            <>
              {/* What they expected, when they guessed (the guess is optional) */}
              {record.predicted !== null && <p className="mt-3 text-footnote text-ink-muted">You expected it to go {SCALE_WORDS[record.predicted]?.toLowerCase()} ({record.predicted} of 5).</p>}
              {/* Did you try it */}
              <p className="mt-6 font-medium">Did you try it?</p>
              {/* The answers */}
              <div role="group" aria-label="Did you try it?" className="mt-2 flex flex-wrap gap-2">
                {/* Yes */}
                <button type="button" aria-pressed={tried === true} onClick={() => setTried(true)} className={`inline-flex min-h-11 items-center border px-4 ${tried === true ? "border-fill bg-fill text-fill-ink" : "border-rule hover:border-accent"}`}>Yes</button>
                {/* No chance */}
                <button type="button" disabled={saving} onClick={() => void save({ tried: false, outcome: null, tooMuch: false })} className="inline-flex min-h-11 items-center border border-rule px-4 hover:border-accent">Didn’t get a chance</button>
                {/* Too much */}
                <button type="button" disabled={saving} onClick={() => void save({ tried: false, outcome: null, tooMuch: true })} className="inline-flex min-h-11 items-center border border-rule px-4 hover:border-accent">Too much for now</button>
              </div>
              {/* Tried: how it went and what they noticed */}
              {tried && (
                <>
                  {/* How it went */}
                  <p className="mt-6 font-medium">How did it go?</p>
                  {/* The scale */}
                  <ScaleChoice label="How did it go?" value={outcome} onChoose={setOutcome} />
                  {/* What they noticed, asked the mission's own way when it has one (decision 95) */}
                  <label htmlFor="mission-note" className="mt-6 block font-medium">{mission.notice ?? "What did you notice about them?"} <span className="text-ink-muted">(optional)</span></label>
                  {/* Typed */}
                  <textarea id="mission-note" value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="mt-2 w-full border border-rule bg-paper p-3 text-lede" />
                  {/* Or said */}
                  <div className="mt-2"><QuickRecorder services={services} action="Say it instead" maxSec={45} onDone={(said) => setNote((previous) => [previous.trim(), said.trim()].filter(Boolean).join(" "))} /></div>
                  {/* Save */}
                  <p className="mt-6"><button type="button" disabled={outcome === null || saving} onClick={() => void save({ tried: true, outcome, tooMuch: false })} className={PRIMARY}>Save and compare</button></p>
                </>
              )}
              {/* Privacy */}
              <p className="mt-6 text-footnote text-ink-muted">Your notes stay on this phone.</p>
            </>
          )}
          {/* Push the band down */}
          <div className="flex-1" />
          {/* Back to where it was opened from, once debriefed */}
          {record.status === "done" && <div className="mt-8"><ActionBand action={`Back to ${origin.name}`} aside="done" href={origin.href} /></div>}
        </div>
      )}
    </main>
  );
}
