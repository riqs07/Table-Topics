"use client";
// Shadowing (decision 80; second design pass: the PitchDrill layout, two columns, the take stage and the verdict panel): listen to a phrase in the model voice, say it back the same way, and compare (your length against the model's, the words that were hard to catch, your pitch line); then the whole passage. The model voice is a saved ElevenLabs recording, or the phone's own when it cannot play (decision 82). Only the lines are saved, never the audio

// Load React's state, memo, callback, effect and external-store tools
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
// Load the speaker icon
import { SpeakerHighIcon } from "@phosphor-icons/react/dist/ssr";
// Load the practice bar, the page around it and the columns
import { PRACTICE_BODY, PRACTICE_COLUMNS, PRACTICE_MAIN, PracticeBar, STEP_LABEL } from "@/components/script/PracticeBar";
// Load the cast
import { Cast } from "@/components/scenes/Cast";
// Load the card and label looks
import { CARD, LAB } from "@/components/script/textStyles";
// Load the shared button looks
import { PRIMARY, QUIET, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the take stage, the verdict panel, the next step, the not-found card and the numbered rows
import { NextLink, NotFoundCard, NumberedRows, TakeStage, VerdictPanel } from "@/components/script/VoiceTakeStage";
// Load Next.js's lazy loader
import dynamic from "next/dynamic";
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
// Load the passages
import { findShadowPassage, shadowSteps, type ShadowPassage, type ShadowStep } from "@/content/voice";
// Load the shadowing findings
import { measureTake, paceMatch, shadowHeadline, shadowLine } from "@/core/voiceFindings";
// Load the next-passage picker
import { nextShadowPassage } from "@/core/voicePicks";
// Load the saver
import { saveVoiceSession } from "@/data/voiceSessions";
// Load the recording contracts
import type { RecordingServices } from "@/audio/services";

// Your curve with the model voice's under it, loaded with the model's pitch once a take is in (decision 111)
const ShadowModelCurve = dynamic(() => import("@/components/script/DrillCurves").then((module) => module.ShadowModelCurve), { ssr: false });

// The longest a take runs before it stops by itself, in seconds
const MAX_TAKE_SECONDS = 45;
// The shortest take worth comparing, in seconds
const MIN_TAKE_SECONDS = 0.5;
// Below this loudness all through, nothing was heard
const SILENT_LEVEL = 0.01;

// What the shadowing page is given
interface ShadowScreenProps extends ScreenProps {
  // The passage's id
  passageId: string;
  // The browser's microphone, transcriber, capture and voice
  services: RecordingServices;
  // The step inside today's practice, or null
  planStep?: number | null;
  // The clock (replaced in checks)
  clock?: () => Date;
}

// Draw shadowing
export function ShadowScreen({ passageId, services, planStep = null, clock: givenClock, ...props }: ShadowScreenProps) {
  // The repository and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // The clock
  const [clock] = useState(() => givenClock ?? (() => new Date()));
  // The passage
  const passage = findShadowPassage(passageId);
  // Its steps
  const steps = useMemo(() => (passage ? shadowSteps(passage) : []), [passage]);
  // Where this sits in today's practice
  const plan = usePlanNav(repo, today, planStep);
  // Whether this browser can turn speech into text, for checking the words (worked out in the browser only)
  const supported = useSyncExternalStore(subscribeToNothing, () => services.speechSupported(), () => true);
  // The recorder, listening for words
  const { recording, stopping, levels, elapsed, problem, start, stop } = useTakeRecorder({ services, clock, raw: false, words: true });
  // The step under way (-1 before starting; past the last when done)
  const [step, setStep] = useState(-1);
  // How long the model took to say each step, in seconds (null when not known)
  const [model, setModel] = useState<(number | null)[]>([]);
  // Your take of each step
  const [takes, setTakes] = useState<(TakeResult | undefined)[]>([]);
  // The line for each step
  const [lines, setLines] = useState<string[]>([]);
  // The model voice speaking
  const [speaking, setSpeaking] = useState(false);
  // The microphone starting
  const [starting, setStarting] = useState(false);
  // A take that could not be used
  const [notice, setNotice] = useState<"too-short" | "nothing-heard" | null>(null);
  // How the save went
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  // The passage to offer next, once saved
  const [nextPassage, setNextPassage] = useState<ShadowPassage | null>(null);
  // The recordings, for playing back (an empty one where a step has none yet)
  const audio = useMemo(() => takes.map((take) => take?.audio ?? new Blob()), [takes]);
  // The player
  const { play, playing } = useTakePlayback(audio);
  // Name the tab
  usePageTitle(passage ? `Shadowing: ${passage.title}` : "Shadowing");
  // The step on screen
  const current = steps[step];
  // Done
  const done = steps.length > 0 && step >= steps.length;

  // Get every step's recording ready once the passage is known, so Listen plays at once (and offline next time)
  useEffect(() => {
    // Each step
    for (const item of steps) services.prepareSpeech?.(item.voiceId);
  }, [services, steps]);

  // Say the step in the model voice, keeping how long it took
  const listen = useCallback(async () => {
    // Nothing to say, no voice, or busy
    if (!current || !services.speak || speaking || recording) return;
    // Speaking
    setSpeaking(true);
    // When it began
    const began = clock();
    // Say it, finishing when it ends (with the recording's own length when one played)
    const recorded = await services.speak(current.text, current.voiceId).catch(() => null);
    // How long it took, for the phone's own voice
    const took = (clock().getTime() - began.getTime()) / 1000;
    // Keep it: the recording's length, or the time taken (a voice that finished at once did not say how long it took)
    setModel((previous) => Object.assign([...previous], { [step]: recorded ?? (took >= MIN_TAKE_SECONDS ? Math.round(took * 10) / 10 : null) }));
    // Done speaking
    setSpeaking(false);
  }, [clock, current, recording, services, speaking, step]);

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

  // Stop a take and compare it, or explain why it could not be used
  const finish = useCallback(async () => {
    // The take
    const take = await stop();
    // Nothing was under way
    if (!take || !current) return;
    // Too short to compare
    if (take.durationSec < MIN_TAKE_SECONDS) {
      // Say so
      setNotice("too-short");
      // Not kept
      return;
    }
    // Nothing heard
    if (Math.max(0, ...take.levels) < SILENT_LEVEL) {
      // Say so
      setNotice("nothing-heard");
      // Not kept
      return;
    }
    // Whether the words can be judged: the browser can hear words, and heard some (an empty transcript after sound means the speech service failed, not that every word was missed)
    const wordsChecked = supported && take.transcript.trim() !== "";
    // Measured
    const measure = measureTake(take, current.text, null, wordsChecked);
    // Keep the take
    setTakes((previous) => Object.assign([...previous], { [step]: take }));
    // And its line
    setLines((previous) => Object.assign([...previous], { [step]: shadowLine(measure, model[step] ?? null, wordsChecked) }));
  }, [current, model, step, stop, supported]);

  // Stop a take that runs too long
  useEffect(() => {
    // Only while recording
    if (!recording) return;
    // Stop it at the limit
    const timer = setTimeout(() => void finish(), MAX_TAKE_SECONDS * 1000);
    // Not if it stops first
    return () => clearTimeout(timer);
  }, [finish, recording]);

  // Save the session, then find the passage to offer next
  const save = useCallback(async () => {
    // Nothing to save
    if (!passage) return;
    // The steps with a take
    const taken = steps.map((item, index) => ({ item, index, take: takes[index] })).filter((entry): entry is { item: ShadowStep; index: number; take: TakeResult } => entry.take !== undefined);
    // Nothing recorded
    if (taken.length === 0) return;
    // Saving
    setSaving("saving");
    // Save, noting any failure
    try {
      // The session: the headline and a line per take
      await saveVoiceSession(repo, { id: crypto.randomUUID(), promptId: passage.id, summary: { kind: "shadow", headline: shadowHeadline(taken.map((entry) => paceMatch(entry.take.durationSec, model[entry.index] ?? null))), takes: taken.map((entry) => ({ label: entry.item.label, line: lines[entry.index] ?? "" })) }, transcript: taken.map((entry) => entry.take.transcript).filter(Boolean).join(" "), durationSec: taken.reduce((sum, entry) => sum + entry.take.durationSec, 0) }, clock());
      // How often each passage was shadowed, counting this one
      const counts = new Map<string, number>();
      // Count them
      for (const session of await repo.listSessions()) if (session.voice?.kind === "shadow") counts.set(session.promptId, (counts.get(session.promptId) ?? 0) + 1);
      // The passage done least
      setNextPassage(nextShadowPassage(counts));
      // Saved
      setSaving("saved");
    } catch {
      // Not saved
      setSaving("failed");
    }
  }, [clock, lines, model, passage, repo, steps, takes]);

  // On to the next step, saving after the last
  function next() {
    // The next step
    const after = step + 1;
    // Move on
    setStep(after);
    // Clear any notice
    setNotice(null);
    // After the last: save
    if (after >= steps.length) void save();
  }

  // Record this step again
  function retake() {
    // Forget its take
    setTakes((previous) => Object.assign([...previous], { [step]: undefined }));
    // And its line
    setLines((previous) => Object.assign([...previous], { [step]: "" }));
  }

  // The way out (none mid-take)
  const close = recording || starting || stopping ? null : planStep ? { href: "/", label: "Close, back to Today" } : { href: "/voice", label: "Close, back to Your voice" };

  // An unknown passage
  if (!passage) {
    // Say so, with the way back
    return (
      <main id="main" className={PRACTICE_MAIN}>
        {/* Title and the way out */}
        <PracticeBar close={{ href: "/voice", label: "Close, back to Your voice" }} label="Shadowing" />
        {/* What happened, and the way back */}
        <div className={PRACTICE_BODY}>
          <NotFoundCard title="That passage could not be found." line="The link may be old. Every passage to shadow is on Your voice." href="/voice#shadowing" action="See every passage" />
        </div>
      </main>
    );
  }

  // This step's take and line, once recorded
  const take = takes[step];
  // Its line
  const line = lines[step];
  // Your face and words beside the steps
  const side = recording ? { face: "sing" as const, words: "Say it back." } : speaking ? { face: "listen" as const, words: "Listen closely." } : take && line ? { face: "happy" as const, words: "Compare the two." } : { face: "ready" as const, words: model[step] !== undefined ? "Your turn." : "Listen first." };

  // Draw the page
  return (
    // The page while practising: two columns on a computer, one on a phone
    <main id="main" className={PRACTICE_MAIN}>
      {/* Title, step and the way out */}
      <PracticeBar close={close} progress={steps.length > 0 ? Math.max(0, Math.min(step, steps.length)) / steps.length : 0} label={`Shadowing${step >= 0 && step < steps.length ? ` · step ${step + 1} of ${steps.length}` : ""}${plan ? ` · today ${plan.step} of ${plan.total}` : ""}`} />

      {/* Before starting: the passage and how it works */}
      {step < 0 && (
        <div className={`${PRACTICE_BODY} ${PRACTICE_COLUMNS}`}>
          <section aria-labelledby="shadow-heading" className="flex min-w-0 flex-col">
            {/* Where it comes from */}
            <p className={STEP_LABEL}>{passage.source}</p>
            {/* Its name */}
            <h1 id="shadow-heading" className="mt-2 font-display text-statement leading-tight font-semibold md:text-prompt">{passage.title}</h1>
            {/* How it works */}
            <p className="mt-3 max-w-[48ch] text-lede font-semibold text-ink-muted">Listen to each phrase, then say it back the same way. Then the whole passage.</p>
            {/* The phrases */}
            <div className="mt-5"><NumberedRows label="Phrases" rows={passage.phrases.map((phrase) => ({ key: phrase.text, text: phrase.text }))} /></div>
            {/* The model voice, plainly */}
            <p className="mt-3 text-footnote text-ink-muted">The model voice is an AI reading by ElevenLabs, not the original speaker.</p>
            {/* Start */}
            <p className="mt-6"><button type="button" onClick={next} className={PRIMARY}>Start</button></p>
          </section>
          {/* The goal beside it */}
          <aside aria-label="Your goal" className="flex min-w-0 flex-col gap-4">
            {/* You, ready to listen */}
            <div className="flex items-center gap-4 max-lg:hidden">
              {/* You */}
              <Cast who="you" face="listen" className="size-20 md:size-24" />
              {/* What comes first */}
              <p className="font-display text-cue leading-tight font-semibold">Listen, then copy.</p>
            </div>
            {/* What good looks like and how it will be shown (decision 117; Desktop Screens "Recording": your one goal) */}
            <div className="flex flex-col gap-1.5 rounded-[22px] bg-accent-tint px-5 py-4 text-accent-tint-ink">
              {/* The label */}
              <p className="text-xs font-extrabold tracking-[.07em] uppercase">Your one goal</p>
              {/* The goal */}
              <p data-goal className="font-bold"><span className="font-extrabold">Goal:</span> {passage.goal}</p>
            </div>
          </aside>
        </div>
      )}

      {/* A step: listen, say it back, compare */}
      {current && (
        <div className={`${PRACTICE_BODY} ${PRACTICE_COLUMNS}`}>
          <section aria-labelledby="step-heading" className="flex min-w-0 flex-col">
            {/* Which step */}
            <p className={STEP_LABEL}>{passage.title} · {step < passage.phrases.length ? `Phrase ${step + 1} of ${passage.phrases.length}` : "Whole passage"}</p>
            {/* What to say */}
            <h1 id="step-heading" className="mt-3 font-display text-statement leading-tight font-semibold md:text-prompt">{current.text}</h1>
            {/* What to copy */}
            <p className="mt-3 max-w-[48ch] text-lede font-semibold text-ink-muted">{current.copy}</p>
            {/* Listen to the model */}
            {!recording && !starting && !stopping && (
              <p className="mt-5 flex flex-wrap gap-3">
                {/* The model voice */}
                <button type="button" onClick={() => void listen()} disabled={speaking || !services.speak} className={model[step] === undefined && !take ? PRIMARY : SECONDARY}>
                  {/* The speaker */}
                  <SpeakerHighIcon aria-hidden="true" weight="fill" className="size-5" />
                  {/* What it does */}
                  {speaking ? "Listening…" : model[step] !== undefined ? "Listen again" : "Listen"}
                </button>
                {/* Your take, once recorded */}
                {take && <button type="button" onClick={() => play(step)} className={QUIET}>{playing === step ? "Playing yours" : "Play yours"}</button>}
              </p>
            )}
            {/* A take that could not be used */}
            {notice === "too-short" && <p role="alert" className="mt-4 max-w-[48ch] rounded-2xl bg-warm-tint px-4 py-3 font-bold text-warm-ink">That was too short to compare. Say the whole phrase, then press Stop.</p>}
            {notice === "nothing-heard" && <p role="alert" className="mt-4 max-w-[48ch] rounded-2xl bg-warm-tint px-4 py-3 font-bold text-warm-ink">I did not catch anything. Check that the right microphone is selected, then try again.</p>}
            {/* A problem, explained plainly */}
            {problem && <p role="alert" className="mt-4 max-w-[48ch] rounded-2xl bg-warm-tint px-4 py-3 font-bold text-warm-ink">{PROBLEM_TEXT[problem]}</p>}
            {/* A blocked microphone: how to allow it */}
            {problem === "microphone-blocked" && (
              // One step per device
              <ul aria-label="How to allow the microphone" className="mt-3 max-w-[52ch] list-disc space-y-2 pl-5 text-lede">
                {/* Each step */}
                {ALLOW_STEPS.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
            {/* The comparison, once recorded: the curves in a card, the line under it, then on */}
            {take && line ? (
              <>
                <section aria-labelledby="compare-heading" className={`mt-6 p-5 md:p-6 ${CARD}`}>
                  {/* Which take */}
                  <p className={LAB}>{current.label} · you and the model</p>
                  {/* The question it answers */}
                  <h2 id="compare-heading" className="mt-1 font-display text-xl font-semibold md:text-2xl">Did your melody follow the model’s?</h2>
                  {/* Your pitch over the model's */}
                  <ShadowModelCurve take={take} text={current.text} voiceId={current.voiceId} label={current.label} />
                </section>
                {/* How it compared */}
                <p role="status" className="mt-3 rounded-[18px] bg-paper px-5 py-4 font-display text-lg font-semibold">{line}</p>
                {/* Next, or again */}
                <p className="mt-5 flex flex-wrap gap-3">
                  {/* Next */}
                  <button type="button" onClick={next} className={PRIMARY}>{step + 1 < passage.phrases.length ? "Next phrase" : step + 1 === passage.phrases.length ? "The whole passage" : "Finish"}</button>
                  {/* Again */}
                  <button type="button" onClick={retake} className={SECONDARY}>Try it again</button>
                </p>
              </>
            ) : (
              // The stage: your blob, then Say it back, or the clock and Stop
              <TakeStage recording={recording} starting={starting} stopping={stopping} levels={levels} elapsed={elapsed} onStart={() => void begin()} onStop={() => void finish()} troubled={!!(notice || problem)} startLabel={notice || problem ? "Try again" : "Say it back"} startDetail={model[step] !== undefined ? "the same way" : "after listening"} />
            )}
            {/* The whole passage can be left out */}
            {step === passage.phrases.length && !take && !recording && !starting && !stopping && <p className="mt-2"><button type="button" onClick={next} className={`${TEXT_LINK} text-ink-muted`}>Finish without the whole passage</button></p>}
          </section>
          {/* The steps: done, this one, and the ones to come */}
          <aside aria-label="Your phrases so far" className="flex min-w-0 flex-col gap-3">
            {/* You, and where you are */}
            <div className="flex items-center gap-4 max-lg:hidden">
              {/* You */}
              <Cast who="you" face={side.face} className="size-20 md:size-24" />
              {/* Where you are */}
              <p className="font-display text-cue leading-tight font-semibold">{side.words}</p>
            </div>
            {/* Small heading */}
            <p className={`${LAB} mt-1`}>The passage</p>
            {/* Each step */}
            <ol className="flex flex-col gap-2.5">
              {steps.map((item, index) => {
                // Whether it is done, this one, or to come
                const state = index === step ? "now" : index < step ? "done" : "next";
                // One step
                return (
                  <li key={item.voiceId} data-step-state={state} className={`rounded-[18px] px-4 py-3 ${state === "now" ? "border-2 border-accent bg-card shadow-picked" : state === "done" ? "bg-paper" : "border-2 border-dashed border-rule"}`}>
                    {/* Its name, and where it is */}
                    <p className="flex items-baseline justify-between gap-3 text-sm font-extrabold">
                      <span>{item.label}</span>
                      <span className={state === "now" ? "text-accent-tint-ink" : "text-ink-muted"}>{state === "done" ? (lines[index] ? "Done" : "Left out") : state === "now" ? "This one" : index === step + 1 ? "Up next" : ""}</span>
                    </p>
                    {/* How it compared, once done */}
                    {state === "done" && lines[index] && <p className="mt-1 text-sm font-semibold text-ink-muted">{lines[index]}</p>}
                  </li>
                );
              })}
            </ol>
          </aside>
        </div>
      )}

      {/* Done */}
      {done && (
        <div className={PRACTICE_BODY}>
          {/* Which passage */}
          <p className={STEP_LABEL}>{passage.title}</p>
          {/* The headline */}
          <h1 id="done-heading" className="mt-2 max-w-[28ch] font-display text-statement leading-tight font-semibold">{shadowHeadline(takes.flatMap((item, index) => (item ? [paceMatch(item.durationSec, model[index] ?? null)] : [])))}</h1>
          <div className={`mt-6 ${PRACTICE_COLUMNS}`}>
            {/* A line per take */}
            <ol aria-label="Your takes" className="flex min-w-0 flex-col gap-3">
              {/* Each step with a take */}
              {steps.map((item, index) => lines[index] ? (
                <li key={item.voiceId} className={`p-5 ${CARD}`}>
                  {/* Its name */}
                  <p className={LAB}>{item.label}</p>
                  {/* How it compared */}
                  <p className="mt-1 font-display text-lg font-semibold">{lines[index]}</p>
                </li>
              ) : null)}
            </ol>
            {/* How it went, and what next (first on a phone) */}
            <div className="max-lg:order-first">
              <VerdictPanel tone="good" face="happy" headingId="shadow-done-panel" heading="Shadowed.">
                {/* What it was */}
                <p className="font-bold text-ink">{passage.title}, {passage.source}. Your pace and melody against the model voice’s.</p>
                {/* How the save went */}
                {saving === "saving" && <p role="status" className="text-footnote font-bold">Saving…</p>}
                {saving === "failed" && (
                  <p role="alert" className="flex flex-wrap items-center gap-3 font-bold">
                    {/* What happened */}
                    <span>This session could not be saved.</span>
                    {/* Try again */}
                    <button type="button" onClick={() => void save()} className={SECONDARY}>Try saving again</button>
                  </p>
                )}
                {/* Once saved: today's next step, or the next passage */}
                {saving === "saved" && (plan ? (plan.next ? <NextLink action={`Next: step ${plan.step + 1}`} aside={plan.next.label} href={plan.next.href} /> : <NextLink action="Finish today’s practice" aside="back to Today" href="/" />) : nextPassage ? <NextLink action="Next passage" aside={nextPassage.title} href={`/voice/shadow?id=${nextPassage.id}`} /> : null)}
              </VerdictPanel>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
