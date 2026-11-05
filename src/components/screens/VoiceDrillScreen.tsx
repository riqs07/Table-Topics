"use client";
// A voice drill, take by take (decision 80): clear sounds, volume, pitch and stress, or tone. Each take records its loudness and pitch (and, for clear sounds, its words); the results compare the takes with the speaker's own voice, and stress and tone end with a guessing game. Only the lines are saved, never the audio

// Load React's state, memo, callback, effect and external-store tools
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the practice bar, the page around it and the columns
import { PRACTICE_BODY, PRACTICE_COLUMNS, PRACTICE_MAIN, PracticeBar, STEP_LABEL } from "@/components/script/PracticeBar";
// Load the speaker icon
import { SpeakerHighIcon } from "@phosphor-icons/react/dist/ssr";
// Load the cast
import { Cast } from "@/components/scenes/Cast";
// Load the card and label looks
import { CARD, LAB } from "@/components/script/textStyles";
// Load the action band
import { ActionBand } from "@/components/script/ActionBand";
// Load the shared button looks
import { QUIET, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the voice shapes
import { StartBlob, StatusBlob, VoiceBlob } from "@/components/script/VoiceShapes";
// Load the take pictures
import { LevelBars, PitchLine } from "@/components/script/TakeVisuals";
// Load Next.js's lazy loader
import dynamic from "next/dynamic";
// Load the guessing game
import { GuessGame } from "@/components/script/GuessGame";
// Load the microphone help
import { ALLOW_STEPS, PROBLEM_TEXT } from "@/components/script/microphoneHelp";
// Load the shared screen starting points
import { subscribeToNothing, useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the plan position
import { usePlanNav } from "@/components/screens/usePlanNav";
// Load the tab title
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the take recorder
import { useTakeRecorder, type TakeResult } from "@/components/screens/useTakeRecorder";
// Load the take player
import { useTakePlayback } from "@/components/screens/useTakePlayback";
// Load the drills
import { drillWithSet, findVoiceDrill, VOICE_MODE_NAMES, type VoiceDrill, type VoiceTake } from "@/content/voice";
// Load the findings
import { drillFindings, measureTake } from "@/core/voiceFindings";
// Load the usual-pitch rule, for the pitch lines
import { usualPitch } from "@/core/pitch";
// Load the next-drill picker
import { nextVoiceDrill } from "@/core/voicePicks";
// Load the clock formatter
import { formatClock } from "@/core/recordingRules";
// Load the savers
import { saveVoiceSession, saveWordsToWatch } from "@/data/voiceSessions";
// Load the recording contracts
import type { RecordingServices } from "@/audio/services";

// Pitch in your words for the drills, loaded once a drill's results show: planned stress and loudness as thickness (decision 111)
const TakeStress = dynamic(() => import("@/components/script/DrillCurves").then((module) => module.TakeStress), { ssr: false });
// (loudness as thickness)
const TakeThickness = dynamic(() => import("@/components/script/DrillCurves").then((module) => module.TakeThickness), { ssr: false });
// (each take's curve over its words, for "Exaggerate, then dial back", decision 117)
const TakeCurve = dynamic(() => import("@/components/script/DrillCurves").then((module) => module.TakeCurve), { ssr: false });

// The longest a take runs before it stops by itself, in seconds
const MAX_TAKE_SECONDS = 30;
// The shortest take worth measuring, in seconds
const MIN_TAKE_SECONDS = 1;
// Below this loudness all through, nothing was heard
const SILENT_LEVEL = 0.01;

// The measures drawn as loudness bars, and as pitch lines
const LEVEL_MEASURES = new Set(["steps", "drop", "tone"]);
// The measures drawn as pitch lines
const PITCH_MEASURES = new Set(["ends", "range", "stress", "tone", "dialback"]);

// Mix the order of the takes for the guessing game
function mixedOrder(count: number): number[] {
  // In order to start
  const order = Array.from({ length: count }, (_, index) => index);
  // Swap each place with an earlier one at random
  for (let place = count - 1; place > 0; place -= 1) {
    // The place to swap with
    const other = Math.floor(Math.random() * (place + 1));
    // Swap them
    [order[place], order[other]] = [order[other]!, order[place]!];
  }
  // The mixed order
  return order;
}

// The words of a line, for counting which were caught
const wordsOf = (text: string) => text.split(/[\s,.;:!?“”"]+/).filter(Boolean);

// What the drill page is given
interface VoiceDrillScreenProps extends ScreenProps {
  // The drill's id
  drillId: string;
  // For a drill done with one of several sentences: which (counted from 0), or null to take the next in turn (decision 117)
  set?: number | null;
  // The browser's microphone, transcriber and capture
  services: RecordingServices;
  // The step inside today's practice, or null
  planStep?: number | null;
  // The clock (replaced in checks)
  clock?: () => Date;
  // How the guessing game mixes the takes (replaced in checks)
  shuffle?: (count: number) => number[];
}

// Draw the drill
export function VoiceDrillScreen({ drillId, services, planStep = null, set = null, clock: givenClock, shuffle = mixedOrder, ...props }: VoiceDrillScreenProps) {
  // The repository and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // The clock
  const [clock] = useState(() => givenClock ?? (() => new Date()));
  // The drill as written
  const written = findVoiceDrill(drillId);
  // How many sentences it turns through (none for most drills)
  const setCount = written?.sets?.length ?? 0;
  // The next sentence in turn, worked out from how often the drill was done, when the address does not name one (decision 117)
  const [nextSet, setNextSet] = useState<number | null>(null);
  // Read how often it was done, once, only when needed
  useEffect(() => {
    // Not a drill with sentences, or one was named
    if (setCount === 0 || set !== null) return;
    // Ignore a late answer
    let cancelled = false;
    // Count this drill's sessions
    repo.listSessions().then((sessions) => {
      // The next sentence in turn
      if (!cancelled) setNextSet(sessions.filter((session) => session.mode === "voice" && session.promptId === drillId).length % setCount);
    }, () => {
      // Unreadable: the first sentence
      if (!cancelled) setNextSet(0);
    });
    // Stop on leaving
    return () => {
      // Ignore late answers
      cancelled = true;
    };
  }, [drillId, repo, set, setCount]);
  // The sentence in use: the named one, the next in turn once known, or none for most drills
  const setIndex = setCount === 0 ? null : set !== null ? ((set % setCount) + setCount) % setCount : nextSet;
  // The drill with that sentence's takes (memoised, so the findings below stay put)
  const drill = useMemo(() => (written && setIndex !== null ? drillWithSet(written, setIndex) : written), [written, setIndex]);
  // Still finding which sentence comes next
  const choosingSet = setCount > 0 && setIndex === null;
  // Where this sits in today's practice
  const plan = usePlanNav(repo, today, planStep);
  // Whether this browser can turn speech into text (worked out in the browser only)
  const supported = useSyncExternalStore(subscribeToNothing, () => services.speechSupported(), () => true);
  // The recorder: the raw microphone for volume, pitch and tone, the words for clear sounds
  const { recording, stopping, levels, elapsed, problem, start, stop } = useTakeRecorder({ services, clock, raw: drill?.kind !== "clear", words: drill?.kind === "clear" });
  // The finished takes
  const [takes, setTakes] = useState<TakeResult[]>([]);
  // Recording the drill's takes, the slow round, or the results
  const [stage, setStage] = useState<"take" | "slow" | "results">("take");
  // The microphone starting
  const [starting, setStarting] = useState(false);
  // A take that could not be used
  const [notice, setNotice] = useState<"too-short" | "nothing-heard" | null>(null);
  // How the save went
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  // The drill to offer next, once saved
  const [nextDrill, setNextDrill] = useState<VoiceDrill | null>(null);
  // How the slow round went, once done
  const [slowLine, setSlowLine] = useState<string | null>(null);
  // The guessing game's order, mixed once
  const [order] = useState(() => shuffle(Math.max(drill?.takes.length ?? 0, ...(written?.sets ?? []).map((takes) => takes.length))));
  // The findings, once every take is in
  const findings = useMemo(() => (drill && takes.length >= drill.takes.length ? drillFindings(drill, takes) : null), [drill, takes]);
  // The speaker's usual pitch across the takes, for the pitch lines
  const usual = useMemo(() => usualPitch(takes.flatMap((take) => take.pitches)), [takes]);
  // The recordings, for playing back
  const audio = useMemo(() => takes.map((take) => take.audio), [takes]);
  // The loudest reading across the takes, for loudness as thickness (decision 111)
  const loudest = useMemo(() => Math.max(0, ...takes.flatMap((take) => take.levels)), [takes]);
  // The player
  const { play, playing } = useTakePlayback(audio);
  // Every word missed across the takes, once each
  const missed = useMemo(() => [...new Set(findings?.measures.flatMap((measure) => measure.missed) ?? [])], [findings]);
  // Name the tab
  usePageTitle(drill?.title ?? "Voice drill");

  // Save the finished drill, then find the drill to offer next
  const save = useCallback(async (done: ReadonlyArray<TakeResult>) => {
    // Nothing to save
    if (!drill) return;
    // The findings
    const found = drillFindings(drill, done);
    // Saving
    setSaving("saving");
    // Save, noting any failure
    try {
      // When it finished
      const now = clock();
      // The session: the headline and a line per take
      await saveVoiceSession(repo, { id: crypto.randomUUID(), promptId: drill.id, summary: { kind: drill.kind, headline: found.headline, takes: drill.takes.map((take, index) => ({ label: take.label, line: found.lines[index] ?? "" })) }, transcript: done.map((take) => take.transcript).filter(Boolean).join(" "), durationSec: done.reduce((sum, take) => sum + take.durationSec, 0) }, now);
      // Clear sounds: the words missed go on the words to watch, and words caught come off
      if (drill.measure === "words") {
        // The words missed, in plain form
        const lost = new Set(found.measures.flatMap((measure) => measure.missed).map((word) => word.toLowerCase()));
        // Every other word of the lines was caught
        const caught = drill.takes.flatMap((take) => wordsOf(take.text)).filter((word) => !lost.has(word.toLowerCase()));
        // Save them
        await saveWordsToWatch(repo, [...lost], caught, now);
      }
      // How often each voice drill was done, counting this one
      const counts = new Map<string, number>();
      // Count them
      for (const session of await repo.listSessions()) if (session.mode === "voice") counts.set(session.promptId, (counts.get(session.promptId) ?? 0) + 1);
      // The drill of this kind done least
      setNextDrill(nextVoiceDrill(drill.kind, counts));
      // Saved
      setSaving("saved");
    } catch {
      // Not saved
      setSaving("failed");
    }
  }, [clock, drill, repo]);

  // Start a take
  const begin = useCallback(async () => {
    // Clear the last notice
    setNotice(null);
    // Starting
    setStarting(true);
    // Open the microphone and record
    await start();
    // Started, or a problem shows
    setStarting(false);
  }, [start]);

  // The take being recorded: one of the drill's, or the slow round of hard words
  const slowTake: VoiceTake = { label: "Slow round", text: missed.join(", "), cue: "Slowly, one word at a time, with a short pause after each." };
  // The take on screen
  const current = stage === "slow" ? slowTake : drill?.takes[takes.length];

  // Stop a take and keep it, or explain why it could not be used
  const finish = useCallback(async () => {
    // The take
    const take = await stop();
    // Nothing was under way
    if (!take || !drill) return;
    // Too short to measure
    if (take.durationSec < MIN_TAKE_SECONDS) {
      // Say so, and record it again
      setNotice("too-short");
      // Not kept
      return;
    }
    // Nothing heard: no words for clear sounds, or silence for the others
    if (drill.measure === "words" ? take.transcript.trim() === "" : Math.max(0, ...take.levels) < SILENT_LEVEL) {
      // Say so, and record it again
      setNotice("nothing-heard");
      // Not kept
      return;
    }
    // The slow round: which hard words came through this time
    if (stage === "slow") {
      // Words still missed
      const still = measureTake(take, slowTake.text, null, true).missed;
      // Words caught this time
      const caught = missed.filter((word) => !still.includes(word));
      // How it went
      setSlowLine(still.length === 0 ? "Every word came through this time." : caught.length === 0 ? `Still hard to catch: ${still.join(", ")}. Slower still, and finish each word.` : `Caught this time: ${caught.join(", ")}. Still hard: ${still.join(", ")}.`);
      // Back to the results
      setStage("results");
      // Not a drill take
      return;
    }
    // The takes so far, with this one
    const done = [...takes, take];
    // Keep it
    setTakes(done);
    // The last take: the results, saved
    if (done.length >= drill.takes.length) {
      // Show the results
      setStage("results");
      // Save them
      await save(done);
    }
  }, [drill, missed, save, slowTake.text, stage, stop, takes]);

  // Stop a take that runs too long
  useEffect(() => {
    // Only while recording
    if (!recording) return;
    // Stop it at the limit
    const timer = setTimeout(() => void finish(), MAX_TAKE_SECONDS * 1000);
    // Not if it stops first
    return () => clearTimeout(timer);
  }, [finish, recording]);

  // Start the drill again
  function again() {
    // No takes
    setTakes([]);
    // From the first
    setStage("take");
    // Not saved yet
    setSaving("idle");
    // No slow round yet
    setSlowLine(null);
    // No next drill yet
    setNextDrill(null);
  }

  // The way out (none mid-take, so a stray tap cannot lose it)
  const close = recording || starting || stopping ? null : planStep ? { href: "/", label: "Close, back to Today" } : { href: "/voice", label: "Close, back to Your voice" };

  // An unknown drill
  if (!drill) {
    // Say so, with the way back
    return (
      <main id="main" className={PRACTICE_MAIN}>
        {/* The bar and the way out */}
        <PracticeBar close={{ href: "/voice", label: "Close, back to Your voice" }} label="Voice drill" />
        {/* What happened, and the way back */}
        <div className={PRACTICE_BODY}>
          {/* What happened */}
          <h1 className="font-display text-statement font-semibold">That drill could not be found.</h1>
          {/* The way back */}
          <p className="mt-4"><Link href="/voice" className={TEXT_LINK}>See every voice drill</Link></p>
        </div>
      </main>
    );
  }

  // Clear sounds in a browser that cannot hear words cannot start
  const blocked = drill.measure === "words" && !supported;
  // The problem to show: the blocked browser first
  const shownProblem = blocked ? "speech-unsupported" : problem;
  // Whether the take shows (the drill's takes, or the slow round)
  const taking = stage !== "results" && current && !choosingSet;
  // Which sentence of how many, for a drill with sentences (counted from 1)
  const sentenceLabel = setIndex !== null && setCount > 0 ? ` · Sentence ${setIndex + 1} of ${setCount}` : "";

  // Draw the page
  return (
    <main id="main" className={PRACTICE_MAIN}>
      {/* The bar: the way out, how many takes are done, and which take */}
      <PracticeBar close={close} progress={stage === "results" ? 1 : takes.length / Math.max(1, drill.takes.length)} label={`${VOICE_MODE_NAMES[drill.kind]} · ${stage === "results" ? "how it went" : stage === "slow" ? "slow round" : `take ${Math.min(takes.length + 1, drill.takes.length)} of ${drill.takes.length}`}${plan ? ` · step ${plan.step} of ${plan.total}` : ""}`} />

      {/* A take: what to say and how on the left, the takes so far on the right */}
      {taking && (
        <div className={`${PRACTICE_BODY} ${PRACTICE_COLUMNS}`}>
          <section aria-labelledby="take-heading" className="flex min-w-0 flex-col">
            {/* Which take */}
            <p className={STEP_LABEL}>{stage === "slow" ? `${drill.title} · Slow round` : `${drill.title}${sentenceLabel} · Take ${takes.length + 1} of ${drill.takes.length} · ${current.label}`}</p>
            {/* What to say, the key word marked */}
            <h1 id="take-heading" className="mt-3 font-display text-statement font-semibold md:text-prompt">{stage === "slow" ? current.text : <Stressed text={current.text} word={current.stress} />}</h1>
            {/* How to say it */}
            <p className="mt-3 max-w-[52ch] text-lede font-semibold text-ink-muted">{current.cue}</p>
            {/* What the drill trains and what good looks like, before the first take (decision 117) */}
            {stage === "take" && takes.length === 0 && !recording && (
              <div className="mt-5 flex max-w-[56ch] flex-col gap-1.5 rounded-[22px] bg-accent-tint px-5 py-4 text-accent-tint-ink">
                {/* What it trains */}
                <p className="font-semibold">{drill.intro}</p>
                {/* The goal */}
                <p data-goal className="font-bold"><span className="font-extrabold">Goal:</span> {drill.goal}</p>
              </div>
            )}
            {/* Another of the drill's sentences, before the first take */}
            {stage === "take" && takes.length === 0 && !recording && !starting && setIndex !== null && setCount > 1 && <p className="mt-2"><Link href={`/voice/drill?id=${drill.id}&set=${((setIndex + 1) % setCount) + 1}${planStep ? `&plan=${planStep}` : ""}`} className={`${TEXT_LINK} text-footnote`}>Another sentence</Link></p>}
            {/* A take that could not be used */}
            {notice === "too-short" && <p role="alert" className="mt-4 max-w-[48ch] rounded-2xl bg-warm-tint px-4 py-3 font-bold text-warm-ink">That was too short to measure. Say the whole line, then press Stop.</p>}
            {notice === "nothing-heard" && <p role="alert" className="mt-4 max-w-[48ch] rounded-2xl bg-warm-tint px-4 py-3 font-bold text-warm-ink">I did not catch anything. Check that the right microphone is selected, then try this take again.</p>}
            {/* A problem, explained plainly */}
            {shownProblem && <p role="alert" className="mt-4 max-w-[48ch] text-lede">{PROBLEM_TEXT[shownProblem]}</p>}
            {/* A blocked microphone: how to allow it */}
            {shownProblem === "microphone-blocked" && (
              // One step per device
              <ul aria-label="How to allow the microphone" className="mt-3 max-w-[52ch] list-disc space-y-2 pl-5 text-lede">
                {/* Each step */}
                {ALLOW_STEPS.map((step) => <li key={step}>{step}</li>)}
              </ul>
            )}
            {/* The shape: stop while recording, waiting while the microphone opens, otherwise start */}
            {recording ? (
              <VoiceBlob levels={levels} signal="none" clock={formatClock(elapsed)} onStop={() => void finish()} compact={false} />
            ) : stopping ? (
              <StatusBlob compact={false} label="One moment…" detail="measuring your take" />
            ) : starting ? (
              <StatusBlob compact={false} label="Starting…" detail="allow the microphone" />
            ) : blocked ? null : (
              <StartBlob compact={false} onStart={() => void begin()} mood={notice || problem ? "hmm" : "ready"} label={notice || problem ? "Try again" : "Record"} detail={stage === "slow" ? "the slow round" : `take ${takes.length + 1} of ${drill.takes.length}`} />
            )}
          </section>
          {/* The takes: done, this one, and the ones to come */}
          {stage === "take" && (
            <aside aria-label="Your takes so far" className="flex min-w-0 flex-col gap-3">
              {/* You, and where you are */}
              <div className="flex items-center gap-4">
                {/* You */}
                <Cast who="you" face={recording ? "sing" : takes.length > 0 ? "happy" : "ready"} className="size-20 md:size-24" />
                {/* Where you are */}
                <p className="font-display text-cue font-semibold leading-tight">{recording ? "Recording." : takes.length === 0 ? "First take." : takes.length === drill.takes.length - 1 ? "Last one." : `${takes.length} done.`}</p>
              </div>
              {/* Small heading */}
              <p className={`${LAB} mt-1`}>Your takes</p>
              {/* Each take */}
              <ol className="flex flex-col gap-2.5">
                {drill.takes.map((take, index) => {
                  // Whether it is done, this one, or to come
                  const state = index < takes.length ? "done" : index === takes.length ? "now" : "next";
                  // One take
                  return (
                    <li key={`${take.label}-${index}`} data-take-state={state} className={`rounded-[18px] px-4 py-3 ${state === "now" ? "border-2 border-accent bg-card shadow-picked" : state === "done" ? "bg-paper" : "border-2 border-dashed border-rule"}`}>
                      {/* Its name, and where it is */}
                      <p className="flex items-baseline justify-between gap-3 text-sm font-extrabold">
                        <span>Take {index + 1} · {take.label}</span>
                        <span className={state === "now" ? "text-accent-tint-ink" : "text-ink-muted"}>{state === "done" ? "Done" : state === "now" ? "This take" : index === takes.length + 1 ? "Up next" : ""}</span>
                      </p>
                      {/* What to do, for this one and the next */}
                      {state !== "done" && <p className="mt-1 text-sm font-semibold text-ink-muted">{take.cue}</p>}
                    </li>
                  );
                })}
              </ol>
            </aside>
          )}
        </div>
      )}

      {/* The results */}
      {stage === "results" && findings && (
        <div className={`${PRACTICE_BODY} ${PRACTICE_COLUMNS}`}>
          <section aria-labelledby="results-heading" className="flex min-w-0 flex-col">
            {/* Which drill */}
            <p className={STEP_LABEL}>{drill.title}</p>
            {/* The headline */}
            <h1 id="results-heading" className="mt-2 font-display text-statement font-semibold">{findings.headline}</h1>
            {/* How loud each take was, side by side */}
            {LEVEL_MEASURES.has(drill.measure) && <div className={`mt-6 p-5 ${CARD}`}><LevelBars takes={drill.takes.map((take, index) => ({ label: take.label, level: findings.measures[index]?.level ?? 0 }))} /></div>}
            {/* Stress and tone: can a listener tell the takes apart? */}
            {(drill.measure === "stress" || drill.measure === "tone") && <GuessGame options={drill.takes.map((take) => (drill.measure === "stress" ? take.label.replace(/^Stress “|”$/g, "") : take.label))} order={order} play={play} question={drill.measure === "stress" ? "Which word was stressed?" : "Which feeling was it?"} />}
            {/* Each take: its name, its line, a way to hear it, and its pitch line */}
            <ol aria-label="Your takes" className="mt-6 flex flex-col gap-3">
              {/* Each take */}
              {drill.takes.map((take, index) => (
                <li key={`${take.label}-${index}`} className={`p-5 ${CARD}`}>
                  {/* Its name, line and play button */}
                  <div className="flex items-start justify-between gap-3">
                    {/* Its name and line */}
                    <div className="min-w-0">
                      {/* Its name */}
                      <p className={LAB}>{take.label}</p>
                      {/* What it showed */}
                      <p className="mt-1 font-bold">{findings.lines[index]}</p>
                    </div>
                    {/* Hear it */}
                    <button type="button" onClick={() => play(index)} aria-label={`Play ${take.label}`} className={QUIET}><SpeakerHighIcon aria-hidden="true" weight="bold" className="size-4.5" />{playing === index ? "Playing" : "Play"}</button>
                  </div>
                  {/* The stress drill: did the lift land on the key word (planned stress, decision 111) */}
                  {take.stress && takes[index] && <TakeStress take={takes[index]} text={take.text} stress={take.stress} />}
                  {/* Exaggerate, then dial back: the take's curve over its words (decision 117) */}
                  {drill.measure === "dialback" && takes[index] && <TakeCurve take={takes[index]} text={take.text} label={`${take.label}: your pitch line. ${findings.lines[index] ?? ""}`} />}
                  {/* Its pitch, for the other pitch and tone drills */}
                  {PITCH_MEASURES.has(drill.measure) && drill.measure !== "dialback" && !take.stress && <div className="mt-3"><PitchLine pitches={takes[index]?.pitches ?? []} usual={usual} label={`${take.label}: pitch line. ${findings.lines[index] ?? ""}`} /></div>}
                  {/* The volume drills: the line thicker where louder (decision 111) */}
                  {drill.kind === "volume" && takes[index] && <TakeThickness take={takes[index]} text={take.text} loudest={loudest} label={take.label} />}
                </li>
              ))}
            </ol>
            {/* For the pitch lines: what the dashed line is */}
            {PITCH_MEASURES.has(drill.measure) && drill.measure !== "stress" && drill.measure !== "dialback" && usual !== null && <p className="mt-2 text-footnote text-ink-muted">The dashed line is your usual pitch; up is higher.</p>}
            {/* For the curves over the words: what the dashed line is */}
            {drill.measure === "dialback" && <p className="mt-2 text-footnote text-ink-muted">The dashed line is each take’s own usual pitch; up is higher.</p>}
            {/* For the stress takes: the key */}
            {drill.measure === "shift" && <p className="mt-2 text-footnote text-ink-muted">The dashed circle is the word to stress; the dot is where your highest pitch landed.</p>}
            {/* For the thick lines: what the thickness is */}
            {drill.kind === "volume" && <p className="mt-2 text-footnote text-ink-muted">Thicker where you were louder. The dashed line is your usual pitch.</p>}
          </section>
          {/* The side: you, the slow round, saving, and what next */}
          <aside aria-label="What next" className="flex min-w-0 flex-col gap-4">
            {/* You, pleased */}
            <div className="flex items-center gap-4">
              {/* You */}
              <Cast who="you" face="happy" className="size-20 md:size-24" />
              {/* Done */}
              <p className="font-display text-cue font-semibold leading-tight">{drill.takes.length} takes done.</p>
            </div>
            {/* Clear sounds: the hard words once more, slowly */}
            {drill.measure === "words" && missed.length > 0 && (
              <section aria-labelledby="slow-heading" className={`p-5 ${CARD}`}>
                {/* Its name */}
                <h2 id="slow-heading" className="font-display text-xl font-semibold">Slow round</h2>
                {/* What it is */}
                <p className="mt-2 max-w-[48ch] font-semibold">Say the hard words once more, slowly: {missed.join(", ")}. They join your words to watch in the warm-up.</p>
                {/* How it went, or the way in */}
                {slowLine ? <p role="status" className="mt-3 max-w-[48ch] font-bold">{slowLine}</p> : <p className="mt-4"><button type="button" onClick={() => setStage("slow")} className={SECONDARY}>Say them slowly</button></p>}
              </section>
            )}
            {/* How the save went */}
            {saving === "saving" && <p role="status" className="text-footnote text-ink-muted">Saving…</p>}
            {saving === "failed" && (
              <p role="alert" className="flex flex-wrap items-center gap-3 font-bold">
                {/* What happened */}
                <span>This drill could not be saved.</span>
                {/* Try again */}
                <button type="button" onClick={() => void save(takes)} className={SECONDARY}>Try saving again</button>
              </p>
            )}
            {/* Once saved: today's next step, or the next drill of this kind; and again */}
            <p className="flex flex-wrap items-center gap-3">
              {/* The main action */}
              {saving === "saved" && (plan ? (plan.next ? <ActionBand action={`Next: step ${plan.step + 1}`} aside={plan.next.label} href={plan.next.href} /> : <ActionBand action="Finish today’s practice" aside="back to Today" href="/" />) : nextDrill ? <ActionBand action="Next drill" aside={nextDrill.title} href={`/voice/drill?id=${nextDrill.id}`} /> : null)}
              {/* Do it again */}
              <button type="button" onClick={again} className={QUIET}>Do this drill again</button>
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}

// The line to say, with the key word marked in the accent and a dotted line under it (planned stress)
function Stressed({ text, word }: { text: string; word?: string }) {
  // Nothing to mark
  if (!word) return <>{text}</>;
  // Where the word is, as a whole word
  const match = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").exec(text);
  // Not found: the line as it is
  if (!match) return <>{text}</>;
  // The line, the key word marked
  return (
    <>
      {/* Before it */}
      {text.slice(0, match.index)}
      {/* The word */}
      <span data-stressed className="text-accent-tint-ink underline decoration-art-sun decoration-dotted decoration-4 underline-offset-8">{match[0]}</span>
      {/* After it */}
      {text.slice(match.index + match[0].length)}
    </>
  );
}
