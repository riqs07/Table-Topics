"use client";
// Shadowing (decision 80): listen to a phrase in the model voice, say it back the same way, and compare (your length against the model's, the words that were hard to catch, your pitch line); then the whole passage. The model voice is a saved ElevenLabs recording, or the phone's own when it cannot play (decision 82). Only the lines are saved, never the audio

// Load React's state, memo, callback, effect and external-store tools
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the speaker icon
import { SpeakerHighIcon } from "@phosphor-icons/react/dist/ssr";
// Load the masthead
import { Masthead } from "@/components/script/Masthead";
// Load the action band
import { ActionBand } from "@/components/script/ActionBand";
// Load the shared button looks
import { PRIMARY, QUIET, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the voice shapes
import { StartBlob, StatusBlob, VoiceBlob } from "@/components/script/VoiceShapes";
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
// Load the clock formatter
import { formatClock } from "@/core/recordingRules";
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
      <main id="main" className="mx-auto flex min-h-dvh max-w-5xl flex-col bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
        {/* Title and the way out */}
        <Masthead title="Shadowing" nav={false} close={{ href: "/voice", label: "Close, back to Your voice" }} />
        {/* What happened */}
        <h1 className="mt-8 font-display text-statement font-semibold tracking-tight">That passage could not be found.</h1>
        {/* The way back */}
        <p className="mt-4"><Link href="/voice#shadowing" className={TEXT_LINK}>See every passage</Link></p>
      </main>
    );
  }

  // This step's take and line, once recorded
  const take = takes[step];
  // Its line
  const line = lines[step];

  // Draw the page
  return (
    // Dark while a take records (the stage, decision 69)
    <main id="main" data-area={recording ? "stage" : undefined} className="mx-auto flex min-h-dvh max-w-5xl flex-col bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Title, step and the way out */}
      <Masthead title="Shadowing" nav={false} close={close}>{plan ? `Step ${plan.step} of ${plan.total}` : ""}</Masthead>

      {/* Before starting: the passage and how it works */}
      {step < 0 && (
        <section aria-labelledby="shadow-heading" className="mt-8 md:max-w-2xl">
          {/* Where it comes from */}
          <p className="text-footnote font-semibold text-accent">{passage.source}</p>
          {/* Its name */}
          <h1 id="shadow-heading" className="mt-1 font-display text-statement font-semibold tracking-tight">{passage.title}</h1>
          {/* How it works */}
          <p className="mt-3 max-w-[48ch] text-lede">Listen to each phrase, then say it back the same way. Then the whole passage.</p>
          {/* What good looks like and how it will be shown (decision 117) */}
          <p data-goal className="mt-2 max-w-[48ch] text-footnote"><span className="font-semibold">Goal:</span> {passage.goal}</p>
          {/* The phrases */}
          <ol aria-label="Phrases" className="mt-5 flex flex-col gap-2">
            {/* Each phrase */}
            {passage.phrases.map((phrase, index) => (
              <li key={phrase.text} className="flex gap-3 rounded-2xl bg-card px-3 py-2.5">
                {/* Its number */}
                <span aria-hidden="true" className="flex size-8 flex-none items-center justify-center rounded-lg bg-warm-tint font-semibold text-warm-ink">{index + 1}</span>
                {/* Its words */}
                <span className="self-center">{phrase.text}</span>
              </li>
            ))}
          </ol>
          {/* The model voice, plainly */}
          <p className="mt-4 text-footnote text-ink-muted">The model voice is an AI reading by ElevenLabs, not the original speaker.</p>
          {/* Start */}
          <p className="mt-6"><button type="button" onClick={next} className={PRIMARY}>Start</button></p>
        </section>
      )}

      {/* A step: listen, say it back, compare */}
      {current && (
        <section aria-labelledby="step-heading" className="mt-8 flex flex-col md:max-w-2xl">
          {/* Which step */}
          <p className="text-footnote font-semibold text-accent">{passage.title} · {step < passage.phrases.length ? `Phrase ${step + 1} of ${passage.phrases.length}` : "Whole passage"}</p>
          {/* What to say */}
          <h1 id="step-heading" className="mt-3 font-display text-statement font-semibold tracking-tight">{current.text}</h1>
          {/* What to copy */}
          <p className="mt-3 max-w-[48ch] text-lede">{current.copy}</p>
          {/* Listen to the model */}
          {!recording && !starting && !stopping && (
            <p className="mt-5 flex flex-wrap gap-3">
              {/* The model voice */}
              <button type="button" onClick={() => void listen()} disabled={speaking || !services.speak} className={SECONDARY}>
                {/* The speaker */}
                <SpeakerHighIcon aria-hidden="true" weight="fill" className="mr-2 size-5" />
                {/* What it does */}
                {speaking ? "Listening…" : model[step] !== undefined ? "Listen again" : "Listen"}
              </button>
              {/* Your take, once recorded */}
              {take && <button type="button" onClick={() => play(step)} className={QUIET}>{playing === step ? "Playing yours" : "Play yours"}</button>}
            </p>
          )}
          {/* A take that could not be used */}
          {notice === "too-short" && <p role="alert" className="mt-4 max-w-[48ch] text-lede">That was too short to compare. Say the whole phrase, then press Stop.</p>}
          {notice === "nothing-heard" && <p role="alert" className="mt-4 max-w-[48ch] text-lede">I did not catch anything. Check that the right microphone is selected, then try again.</p>}
          {/* A problem, explained plainly */}
          {problem && <p role="alert" className="mt-4 max-w-[48ch] text-lede">{PROBLEM_TEXT[problem]}</p>}
          {/* A blocked microphone: how to allow it */}
          {problem === "microphone-blocked" && (
            // One step per device
            <ul aria-label="How to allow the microphone" className="mt-3 max-w-[52ch] list-disc space-y-2 pl-5 text-lede">
              {/* Each step */}
              {ALLOW_STEPS.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
          {/* The comparison, once recorded */}
          {take && line ? (
            <div role="status" className="mt-6 rounded-2xl bg-card p-4">
              {/* How it compared */}
              <p className="text-lede">{line}</p>
              {/* Your pitch */}
              <ShadowModelCurve take={take} text={current.text} voiceId={current.voiceId} label={current.label} />
              {/* Next, or again */}
              <p className="mt-4 flex flex-wrap gap-3">
                {/* Next */}
                <button type="button" onClick={next} className={PRIMARY}>{step + 1 < passage.phrases.length ? "Next phrase" : step + 1 === passage.phrases.length ? "The whole passage" : "Finish"}</button>
                {/* Again */}
                <button type="button" onClick={retake} className={QUIET}>Try it again</button>
              </p>
            </div>
          ) : recording ? (
            <VoiceBlob levels={levels} signal="none" clock={formatClock(elapsed)} onStop={() => void finish()} compact={false} />
          ) : stopping ? (
            <StatusBlob compact={false} label="One moment…" detail="measuring your take" />
          ) : starting ? (
            <StatusBlob compact={false} label="Starting…" detail="allow the microphone" />
          ) : (
            <StartBlob compact={false} onStart={() => void begin()} label={notice || problem ? "Try again" : "Say it back"} detail={model[step] !== undefined ? "the same way" : "after listening"} />
          )}
          {/* The whole passage can be left out */}
          {step === passage.phrases.length && !take && !recording && !starting && !stopping && <p className="mt-2"><button type="button" onClick={next} className={`${TEXT_LINK} text-ink-muted`}>Finish without the whole passage</button></p>}
        </section>
      )}

      {/* Done */}
      {done && (
        <section aria-labelledby="done-heading" className="mt-8 md:max-w-2xl">
          {/* Which passage */}
          <p className="text-footnote font-semibold text-accent">{passage.title}</p>
          {/* The headline */}
          <h1 id="done-heading" className="mt-1 font-display text-statement font-semibold tracking-tight">{shadowHeadline(takes.flatMap((item, index) => (item ? [paceMatch(item.durationSec, model[index] ?? null)] : [])))}</h1>
          {/* A line per take */}
          <ol aria-label="Your takes" className="mt-6 flex flex-col gap-3">
            {/* Each step with a take */}
            {steps.map((item, index) => lines[index] ? (
              <li key={item.voiceId} className="rounded-2xl bg-card p-4">
                {/* Its name */}
                <p className="font-semibold">{item.label}</p>
                {/* How it compared */}
                <p className="mt-0.5 text-footnote text-ink-muted">{lines[index]}</p>
              </li>
            ) : null)}
          </ol>
          {/* How the save went */}
          {saving === "saving" && <p role="status" className="mt-6 text-footnote text-ink-muted">Saving…</p>}
          {saving === "failed" && (
            <p role="alert" className="mt-6 flex flex-wrap items-center gap-3 text-lede">
              {/* What happened */}
              <span>This session could not be saved.</span>
              {/* Try again */}
              <button type="button" onClick={() => void save()} className={SECONDARY}>Try saving again</button>
            </p>
          )}
        </section>
      )}

      {/* Push the band down */}
      <div className="flex-1" />
      {/* Once saved: today's next step, or the next passage */}
      {saving === "saved" && (plan ? (plan.next ? <ActionBand action={`Next: step ${plan.step + 1}`} aside={plan.next.label} href={plan.next.href} /> : <ActionBand action="Finish today’s practice" aside="back to Today" href="/" />) : nextPassage ? <ActionBand action="Next passage" aside={nextPassage.title} href={`/voice/shadow?id=${nextPassage.id}`} /> : null)}
    </main>
  );
}
