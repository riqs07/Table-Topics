"use client";
// A mission's debrief, by taps and by voice: did you try it, how it went (1 to 5), what you noticed, then how it went, against the prediction for older tries that have one (decision 52; new tries have none since decision 104). Second design pass, after storyboard 23 ("Today's mission"): the two of you in a scene, the move as a small label, the task large, Sage with the habit to drop (or how it went), then the answers in a card and one chunky button

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { PRACTICE_BODY, PRACTICE_COLUMNS, PRACTICE_MAIN, PracticeBar } from "@/components/script/PracticeBar";
// Load the verdict panel and its tones
import { VerdictPanel, type VerdictTone } from "@/components/script/VoiceTakeStage";
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
import { PRESS, PRIMARY } from "@/components/script/Buttons";
// Load the shared card and label looks
import { CARD, LAB } from "@/components/script/textStyles";
// Load the cast, and Sage's line
import { Cast } from "@/components/scenes/Cast";
import { NotFound, SageSays } from "@/components/script/SageSays";

// The look of an answer: white with a ledge, edged in the accent with a green ledge when chosen (as the story set-up's choices)
const choice = (chosen: boolean) => `flex min-h-14 w-full items-center justify-center rounded-2xl border-2 bg-card px-4 text-center font-display text-lg font-semibold ${PRESS} ${chosen ? "border-accent shadow-picked" : "border-rule shadow-card hover:border-ink-muted"}`;

// The mission's scene (storyboard 23): you and the friend on the pink ground, the friend's bubble holding one prop, a question mark; both happy once it went well. Decorative, so the words carry the meaning
function MissionScene({ pleased }: { pleased: boolean }) {
  // The pink panel, a soft light circle behind, the two of you standing on its lower edge
  return (
    <div aria-hidden="true" data-mission-scene className="relative mt-6 flex h-40 items-end justify-center gap-6 overflow-hidden rounded-[22px] bg-art-bloom pb-3 shadow-band md:h-44">
      {/* A soft light circle in the upper right, as the tiles have */}
      <span className="absolute -top-10 -right-8 size-40 rounded-full bg-art-cream/20" />
      {/* You */}
      <Cast who="you" face={pleased ? "happy" : "ready"} className="relative size-24 md:size-28" />
      {/* The friend, with a question in a bubble */}
      <span className="relative flex flex-col items-center">
        {/* The bubble with the question mark */}
        <span className="mb-1 rounded-2xl bg-art-cream px-3.5 py-0.5 font-display text-2xl font-semibold text-art-bloom shadow-ledge">?</span>
        {/* The friend */}
        <Cast who="friend" face={pleased ? "happy" : "ready"} className="size-24 md:size-28" />
      </span>
    </div>
  );
}

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

  // Where the debrief stands, for the bar: did you try it (1), how it went (2), how it went, saved (3)
  const step = record?.status === "done" ? 3 : tried ? 2 : 1;
  // How the finished try reads: green for 4 or 5, warm for 1 or 2, plain for 3 or when it was not tried (FIXES decision 6)
  const tone: VerdictTone = record?.status === "done" && record.tried && record.outcome !== null ? (record.outcome >= 4 ? "good" : record.outcome <= 2 ? "rough" : "plain") : "plain";

  // Draw the page
  return (
    <main id="main" className={PRACTICE_MAIN}>
      {/* The bar: the way back, how far through the debrief, the mission's move and the step */}
      <PracticeBar close={{ href: origin.href, label: `Close, back to ${origin.name}` }} progress={record && mission ? step / 3 : undefined} label={record && mission ? `Mission · ${mission.move} · step ${step} of 3` : "Mission"} />
      {/* Missing: Sage says so, with the way back */}
      {record === null && <div className={PRACTICE_BODY}><NotFound title="This mission could not be found." back={{ href: origin.href, label: `Back to ${origin.name}` }} className="mt-4" /></div>}
      {/* The debrief, in the two practice columns: the mission on the left, the answers (or how it went) on the right */}
      {record && mission && (
        <div className={`${PRACTICE_BODY} ${PRACTICE_COLUMNS}`}>
          {/* The mission */}
          <div className="flex min-w-0 flex-col">
            {/* The two of you, as in the storyboard's mission: pleased once it went well */}
            <MissionScene pleased={tone === "good"} />
            {/* The move, as a small label */}
            <p className={`${LAB} mt-5`}>{mission.move} · the mission</p>
            {/* The task, large */}
            <h1 className="mt-2 max-w-[24ch] font-display text-statement leading-tight font-semibold">{mission.task}</h1>
            {/* Sage with the one habit to drop while trying it */}
            <SageSays mood="encouraging" className="mt-5">{mission.drop}</SageSays>
          </div>
          {/* The answers, or how it went */}
          <div className="flex min-w-0 flex-col">
          {/* Debriefed: the verdict panel, coloured and faced by the answer, then what they noticed */}
          {record.status === "done" ? (
            <section aria-label="How it went" className="flex flex-col gap-4">
              {/* The verdict: the comparison as its headline */}
              <VerdictPanel tone={tone} headingId="mission-verdict" heading={<span role="status">{compareLine(record)}</span>}>
                {/* Stepping back */}
                {record.tooMuch && <p className="font-bold">Next time, the mission steps back to an easier one.</p>}
              </VerdictPanel>
              {/* Their note */}
              {record.note && <p className={`${CARD} px-5 py-4 text-lede`}><span className={`${LAB} block`}>What you noticed</span>{record.note}</p>}
              {/* Back to where it was opened from */}
              <ActionBand action={`Back to ${origin.name}`} aside="done" href={origin.href} inCard />
            </section>
          ) : (
            <>
              {/* The debrief, in a card */}
              <div className={`flex flex-col p-5 md:p-6 ${CARD}`}>
                {/* What they expected, when they guessed (the guess is optional) */}
                {record.predicted !== null && <p className="mb-4 text-footnote font-semibold text-ink-muted">You expected it to go {SCALE_WORDS[record.predicted]?.toLowerCase()} ({record.predicted} of 5).</p>}
                {/* Did you try it */}
                <p className="font-display text-xl font-semibold">Did you try it?</p>
                {/* The answers */}
                <div role="group" aria-label="Did you try it?" className="mt-3 grid gap-2.5 sm:grid-cols-3">
                  {/* Yes */}
                  <button type="button" aria-pressed={tried === true} onClick={() => setTried(true)} className={choice(tried === true)}>Yes</button>
                  {/* No chance */}
                  <button type="button" disabled={saving} onClick={() => void save({ tried: false, outcome: null, tooMuch: false })} className={choice(false)}>Didn’t get a chance</button>
                  {/* Too much */}
                  <button type="button" disabled={saving} onClick={() => void save({ tried: false, outcome: null, tooMuch: true })} className={choice(false)}>Too much for now</button>
                </div>
                {/* Tried: how it went and what they noticed */}
                {tried && (
                  <>
                    {/* How it went */}
                    <p className="mt-6 font-display text-xl font-semibold">How did it go?</p>
                    {/* The scale */}
                    <ScaleChoice label="How did it go?" value={outcome} onChoose={setOutcome} />
                    {/* What they noticed, asked the mission's own way when it has one (decision 95) */}
                    <label htmlFor="mission-note" className="mt-6 block font-display text-xl font-semibold">{mission.notice ?? "What did you notice about them?"} <span className="font-sans text-base font-bold text-ink-muted">(optional)</span></label>
                    {/* Typed */}
                    <textarea id="mission-note" value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border-2 border-rule bg-paper p-3 text-lede" />
                    {/* Or said */}
                    <div className="mt-1"><QuickRecorder services={services} action="Say it instead" maxSec={45} quiet onDone={(said) => setNote((previous) => [previous.trim(), said.trim()].filter(Boolean).join(" "))} /></div>
                    {/* Save */}
                    <p className="mt-6"><button type="button" disabled={outcome === null || saving} onClick={() => void save({ tried: true, outcome, tooMuch: false })} className={`${PRIMARY} w-full`}>Save how it went</button></p>
                  </>
                )}
              </div>
              {/* Privacy */}
              <p className="mt-4 text-center text-footnote font-semibold text-ink-muted">Your notes stay on this phone.</p>
            </>
          )}
          </div>
        </div>
      )}
    </main>
  );
}
