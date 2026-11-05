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
// Load the shared button looks
import { PRIMARY, QUIET, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the take stage, the verdict panel and the not-found card
import { NextLink, NotFoundCard, TakeStage, VERDICT_LOOKS, VerdictPanel, type VerdictTone } from "@/components/script/VoiceTakeStage";
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
// Load the planned-stress judge, for a take's verdict between takes
import { drillStress } from "@/core/intonationDrills";
// Load the usual-pitch rule, for the pitch lines
import { usualPitch } from "@/core/pitch";
// Load the next-drill picker
import { nextVoiceDrill } from "@/core/voicePicks";
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

// How a take's line reads: good news, something to work on, or plain (never red)
function lineTone(line: string): VerdictTone {
  // Landed as aimed
  if (/as aimed|as planned|, the target\.|Every word caught|Strong to the last|a clear step up|a clear drop/.test(line)) return "good";
  // Missed, faded or level
  if (/^Hard to catch|Aim for|Faded|, not “|No clear peak|about the same level|Lean on/i.test(line)) return "rough";
  // Anything else
  return "plain";
}

// One finished take's verdict: the planned-stress line for a take with a key word, else the drill's own line for it
function takeVerdict(take: VoiceTake | undefined, recorded: TakeResult | undefined, line: string): { tone: VerdictTone; line: string } {
  // A take with a key word: did the lift land on it (decision 111)
  if (take?.stress && recorded) {
    // The judged line
    const judged = drillStress(recorded, take.text, take.stress)?.judged;
    // Its tone and words, or too little voice
    return judged ? { tone: judged.line.tone === "good" ? "good" : judged.line.tone === "work" ? "rough" : "plain", line: judged.line.text } : { tone: "plain", line: "Too little voice was heard to check the key word." };
  }
  // The drill's own line
  return { tone: lineTone(line), line };
}

// The question a take's card answers, by what the drill measures
const REVIEW_QUESTION: Readonly<Record<string, string>> = { words: "Did every word come through?", steps: "How loud was it?", drop: "How loud was it?", endings: "Did it stay strong to the end?", ends: "How did it end?", range: "How did your pitch move?", dialback: "How did your pitch move?", tone: "How did it sound?", shift: "Did the key word get the lift?", stress: "Did the key word get the lift?" };

// What your blob says beside a take's verdict
const VERDICT_WORDS: Readonly<Record<VerdictTone, string>> = { good: "That one landed.", rough: "Hmm, not quite.", plain: "Take done." };

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
  // Showing the take just recorded before the next one (Desktop Screens "PitchDrill")
  const [reviewing, setReviewing] = useState(false);
  // The findings so far, a line for each take recorded
  const sofar = useMemo(() => (drill && takes.length > 0 ? drillFindings(drill, takes) : null), [drill, takes]);
  // The findings, once every take is in
  const findings = drill && takes.length >= drill.takes.length ? sofar : null;
  // Each recorded take's verdict, for the take list and the take just recorded
  const verdicts = useMemo(() => takes.map((recorded, index) => takeVerdict(drill?.takes[index], recorded, sofar?.lines[index] ?? "")), [drill, sofar, takes]);
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
    // On from the take just shown
    setReviewing(false);
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
    // Show it before the next one
    if (done.length < drill.takes.length) setReviewing(true);
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
    // Nothing to show yet
    setReviewing(false);
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
          <NotFoundCard title="That drill could not be found." line="The link may be old. Every voice drill is on Your voice, by what it trains." href="/voice" action="See every voice drill" />
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
  // The take just recorded, while it shows before the next one
  const reviewed = reviewing && stage === "take" && !recording && !starting && !stopping ? takes.length - 1 : null;
  // Its verdict
  const verdict = reviewed !== null ? verdicts[reviewed] : undefined;
  // The take the left column is about: the one just recorded, or the one to record
  const shownIndex = reviewed ?? takes.length;
  // Its words and cue
  const shown = stage === "slow" ? slowTake : (drill.takes[shownIndex] ?? current);
  // Your face and words beside the takes
  const side = recording ? { face: "sing" as const, words: "Recording." } : verdict ? { face: verdict.tone === "good" ? ("happy" as const) : verdict.tone === "rough" ? ("wonder" as const) : ("ready" as const), words: VERDICT_WORDS[verdict.tone] } : { face: takes.length > 0 ? ("happy" as const) : ("ready" as const), words: takes.length === 0 ? "First take." : takes.length === drill.takes.length - 1 ? "Last one." : `${takes.length} done.` };

  // Draw the page
  return (
    <main id="main" className={PRACTICE_MAIN}>
      {/* The bar: the way out, how many takes are done, and which take */}
      <PracticeBar close={close} progress={stage === "results" ? 1 : takes.length / Math.max(1, drill.takes.length)} label={`${VOICE_MODE_NAMES[drill.kind]} · ${stage === "results" ? "how it went" : stage === "slow" ? "slow round" : `take ${Math.min(reviewed !== null ? reviewed + 1 : takes.length + 1, drill.takes.length)} of ${drill.takes.length}`}${plan ? ` · step ${plan.step} of ${plan.total}` : ""}`} />

      {/* A take: what to say and how on the left, the takes so far on the right */}
      {taking && shown && (
        <div className={`${PRACTICE_BODY} ${PRACTICE_COLUMNS}`}>
          <section aria-labelledby="take-heading" className="flex min-w-0 flex-col">
            {/* Which take */}
            <p className={STEP_LABEL}>{stage === "slow" ? `${drill.title} · Slow round` : `${drill.title}${sentenceLabel} · Take ${shownIndex + 1} of ${drill.takes.length} · ${shown.label}`}</p>
            {/* What to say, the key word marked */}
            <h1 id="take-heading" className="mt-3 font-display text-statement leading-tight font-semibold md:text-prompt">{stage === "slow" ? shown.text : <Stressed text={shown.text} word={shown.stress} />}</h1>
            {/* How to say it */}
            <p className="mt-3 max-w-[52ch] text-lede font-semibold text-ink-muted">{shown.cue}</p>
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
            {shownProblem && <p role="alert" className="mt-4 max-w-[48ch] rounded-2xl bg-warm-tint px-4 py-3 font-bold text-warm-ink">{PROBLEM_TEXT[shownProblem]}</p>}
            {/* A blocked microphone: how to allow it */}
            {shownProblem === "microphone-blocked" && (
              // One step per device
              <ul aria-label="How to allow the microphone" className="mt-3 max-w-[52ch] list-disc space-y-2 pl-5 text-lede">
                {/* Each step */}
                {ALLOW_STEPS.map((step) => <li key={step}>{step}</li>)}
              </ul>
            )}
            {/* The take just recorded: its chart in a card, the verdict under it, then the next take (Desktop Screens "PitchDrill") */}
            {reviewed !== null && verdict && drill.takes[reviewed] && takes[reviewed] ? (
              <>
                <section aria-labelledby="review-heading" data-take-review className={`mt-6 p-5 md:p-6 ${CARD}`}>
                  {/* Which take */}
                  <p className={LAB}>Take {reviewed + 1} · {drill.takes[reviewed]!.label}</p>
                  {/* The question it answers */}
                  <h2 id="review-heading" className="mt-1 font-display text-xl font-semibold md:text-2xl">{drill.takes[reviewed]!.stress ? "Did the key word get the lift?" : (REVIEW_QUESTION[drill.measure] ?? "How did it sound?")}</h2>
                  {/* Did the lift land on the key word */}
                  {drill.takes[reviewed]!.stress && <TakeStress take={takes[reviewed]!} text={drill.takes[reviewed]!.text} stress={drill.takes[reviewed]!.stress!} line={false} />}
                  {/* The take's curve over its words */}
                  {drill.measure === "dialback" && <TakeCurve take={takes[reviewed]!} text={drill.takes[reviewed]!.text} label={`${drill.takes[reviewed]!.label}: your pitch line. ${verdict.line}`} />}
                  {/* Its pitch line, for the other pitch and tone drills */}
                  {PITCH_MEASURES.has(drill.measure) && drill.measure !== "dialback" && !drill.takes[reviewed]!.stress && <div className="mt-3"><PitchLine pitches={takes[reviewed]!.pitches} usual={usual} label={`${drill.takes[reviewed]!.label}: pitch line. ${verdict.line}`} /></div>}
                  {/* Loudness as thickness, for the volume drills */}
                  {drill.kind === "volume" && <TakeThickness take={takes[reviewed]!} text={drill.takes[reviewed]!.text} loudest={loudest} label={drill.takes[reviewed]!.label} />}
                </section>
                {/* The verdict, in a few words */}
                <p role="status" data-take-verdict={verdict.tone} className={`mt-3 rounded-[18px] px-5 py-4 font-display text-lg font-semibold md:text-xl ${VERDICT_LOOKS[verdict.tone]}`}>{verdict.line}</p>
                {/* The next take, and hearing this one */}
                <p className="mt-5 flex flex-wrap items-center gap-3">
                  {/* Record the next take */}
                  <button type="button" onClick={() => void begin()} data-variant="start" className={PRIMARY}>Next take</button>
                  {/* Hear it */}
                  <button type="button" onClick={() => play(reviewed)} className={SECONDARY}><SpeakerHighIcon aria-hidden="true" weight="bold" className="size-5" />{playing === reviewed ? "Playing" : "Hear it"}</button>
                </p>
              </>
            ) : (
              // The stage: your blob, then Record, or the clock and Stop
              <TakeStage recording={recording} starting={starting} stopping={stopping} levels={levels} elapsed={elapsed} onStart={() => void begin()} onStop={() => void finish()} blocked={blocked} troubled={!!(notice || problem)} startLabel={notice || problem ? "Try again" : stage === "slow" ? "Record the slow round" : `Record take ${takes.length + 1}`} startDetail={stage === "slow" ? "one word at a time" : `of ${drill.takes.length}`} />
            )}
          </section>
          {/* The takes: done, this one, and the ones to come */}
          {stage === "take" && (
            <aside aria-label="Your takes so far" className="flex min-w-0 flex-col gap-3">
              {/* You, and where you are (on a computer; on a phone the stage above already shows your blob) */}
              <div className="flex items-center gap-4 max-lg:hidden">
                {/* You */}
                <Cast who="you" face={side.face} className="size-20 md:size-24" />
                {/* Where you are */}
                <p className="font-display text-cue font-semibold leading-tight">{side.words}</p>
              </div>
              {/* Small heading */}
              <p className={`${LAB} mt-1`}>Your takes</p>
              {/* Each take */}
              <ol className="flex flex-col gap-2.5">
                {drill.takes.map((take, index) => {
                  // This one: the one just recorded while it shows, else the one to record
                  const now = index === shownIndex;
                  // Whether it is done, this one, or to come
                  const state = now ? "now" : index < takes.length ? "done" : "next";
                  // Its verdict, once recorded
                  const done = verdicts[index];
                  // One take
                  return (
                    <li key={`${take.label}-${index}`} data-take-state={state} className={`rounded-[18px] px-4 py-3 ${state === "now" ? "border-2 border-accent bg-card shadow-picked" : state === "done" ? VERDICT_LOOKS[done?.tone ?? "plain"] : "border-2 border-dashed border-rule"}`}>
                      {/* Its name, and where it is */}
                      <p className="flex items-baseline justify-between gap-3 text-sm font-extrabold">
                        <span>Take {index + 1} · {take.label}</span>
                        <span className={state === "now" ? "text-accent-tint-ink" : state === "done" ? "" : "text-ink-muted"}>{state === "done" ? (done?.tone === "good" ? "Landed" : done?.tone === "rough" ? "Hmm" : "Done") : state === "now" ? "This take" : index === shownIndex + 1 ? "Up next" : ""}</span>
                      </p>
                      {/* What it showed, once recorded; what to do, for this one and the next (on a computer; on a phone the cue is just above) */}
                      {done ? <p className="mt-1 text-sm font-bold">{done.line}</p> : index <= shownIndex + 1 && <p className="mt-1 text-sm font-semibold text-ink-muted max-lg:hidden">{take.cue}</p>}
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
        <div className={PRACTICE_BODY}>
          {/* Which drill */}
          <p className={STEP_LABEL}>{drill.title}{sentenceLabel}</p>
          {/* The headline */}
          <h1 id="results-heading" className="mt-2 max-w-[28ch] font-display text-statement leading-tight font-semibold">{findings.headline}</h1>
          <div className={`mt-6 ${PRACTICE_COLUMNS}`}>
            <section aria-labelledby="results-heading" className="flex min-w-0 flex-col">
              {/* How loud each take was, side by side */}
              {LEVEL_MEASURES.has(drill.measure) && <div className={`mb-6 p-5 ${CARD}`}><p className={LAB}>How loud each take was</p><div className="mt-3"><LevelBars takes={drill.takes.map((take, index) => ({ label: take.label, level: findings.measures[index]?.level ?? 0 }))} /></div></div>}
              {/* Stress and tone: can a listener tell the takes apart? */}
              {(drill.measure === "stress" || drill.measure === "tone") && <div className="mb-6"><GuessGame options={drill.takes.map((take) => (drill.measure === "stress" ? take.label.replace(/^Stress “|”$/g, "") : take.label))} order={order} play={play} question={drill.measure === "stress" ? "Which word was stressed?" : "Which feeling was it?"} /></div>}
              {/* Each take: its name, its line, a way to hear it, and its pitch line */}
              <ol aria-label="Your takes" className="flex flex-col gap-3">
                {/* Each take */}
                {drill.takes.map((take, index) => (
                  <li key={`${take.label}-${index}`} className={`p-5 ${CARD}`}>
                    {/* Its name, line and play button */}
                    <div className="flex items-start justify-between gap-3">
                      {/* Its name and line */}
                      <div className="min-w-0">
                        {/* Its name */}
                        <p className={LAB}>Take {index + 1} · {take.label}</p>
                        {/* What it showed */}
                        <p className="mt-1 font-display text-lg font-semibold">{findings.lines[index]}</p>
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
            {/* The side: you, the slow round, saving, and what next (first on a phone, so the next step is near the top) */}
            <div className="max-lg:order-first lg:sticky lg:top-6">
              <VerdictPanel tone="good" face="happy" headingId="done-heading" heading={`${drill.takes.length} takes done.`}>
                {/* What it was */}
                <p className="font-bold text-ink">{drill.intro}</p>
                {/* Clear sounds: the hard words once more, slowly */}
                {drill.measure === "words" && missed.length > 0 && (
                  <section aria-labelledby="slow-heading" className={`p-4 text-ink ${CARD}`}>
                    {/* Its name */}
                    <h3 id="slow-heading" className="font-display text-xl font-semibold">Slow round</h3>
                    {/* What it is */}
                    <p className="mt-2 font-semibold">Say the hard words once more, slowly: {missed.join(", ")}. They join your words to watch in the warm-up.</p>
                    {/* How it went, or the way in */}
                    {slowLine ? <p role="status" className="mt-3 font-bold">{slowLine}</p> : <p className="mt-4"><button type="button" onClick={() => setStage("slow")} className={SECONDARY}>Say them slowly</button></p>}
                  </section>
                )}
                {/* How the save went */}
                {saving === "saving" && <p role="status" className="text-footnote font-bold">Saving…</p>}
                {saving === "failed" && (
                  <p role="alert" className="flex flex-wrap items-center gap-3 font-bold">
                    {/* What happened */}
                    <span>This drill could not be saved.</span>
                    {/* Try again */}
                    <button type="button" onClick={() => void save(takes)} className={SECONDARY}>Try saving again</button>
                  </p>
                )}
                {/* Once saved: today's next step, or the next drill of this kind */}
                {saving === "saved" && (plan ? (plan.next ? <NextLink action={`Next: step ${plan.step + 1}`} aside={plan.next.label} href={plan.next.href} /> : <NextLink action="Finish today’s practice" aside="back to Today" href="/" />) : nextDrill ? <NextLink action="Next drill" aside={nextDrill.title} href={`/voice/drill?id=${nextDrill.id}`} /> : null)}
                {/* Do it again */}
                <button type="button" onClick={again} className={`${TEXT_LINK} self-center uppercase tracking-[.04em]`}>Do this drill again</button>
              </VerdictPanel>
            </div>
          </div>
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
