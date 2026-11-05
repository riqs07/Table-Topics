"use client";
// Playing a scene (decision 149; laid out as Desktop Screens "SceneReply" in the UI rewrite's second pass): they speak, you choose a reply, they answer to what you chose; twice; then your reply out loud, their closing, and how it went

// Load React's tools
import { useEffect, useRef, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the speaker icon
import { SpeakerHighIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { PRACTICE_BODY, PRACTICE_MAIN, PracticeBar, STEP_LABEL } from "@/components/script/PracticeBar";
import { QuickRecorder } from "@/components/script/QuickRecorder";
// Load the cast, and the panel a step's scene glides into from Today
import { Cast } from "@/components/scenes/Cast";
import { ScenePanel } from "@/components/scenes/ScenePanel";
// Load the face names
import type { FaceName } from "@/components/scenes/Scene";
// Load the shared button looks
import { PRESS, PRIMARY, QUIET, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the card, label, bubble and pill looks
import { BUBBLE, CARD, CHIP, CHIP_GOOD, LAB, LAB_ON_TINT } from "@/components/script/textStyles";
// Load the shared screen starting points and today's practice position
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
import { usePlanNav } from "@/components/screens/usePlanNav";
// Load the browser's recording services, and their type
import { browserRecordingServices } from "@/audio/browserServices";
import type { RecordingServices } from "@/audio/services";
// Load the line player
import { speakQuestion, stopQuestionVoice, unlockQuestionVoice } from "@/audio/questionVoice";
// Load the scenes and the people
import { findScene, type Scene, type SceneLine, type SceneOption } from "@/content/scenes";
import { findPersona } from "@/content/conversations";
// Load the tier names
import { TIER_NAMES, type Tier } from "@/content/scenarios";
// Load the scene rules
import { moodFor, sceneAfter, sceneHref, sceneResult, sceneWarmth, type SceneMood, type SceneResult } from "@/core/scenes";
// Load the progress saver
import { saveSceneResult } from "@/data/practiceProgress";

// Where the scene is
type Phase = "intro" | "first" | "second" | "speak" | "done";

// One line in the conversation so far
interface Said {
  // Who said it
  who: "them" | "you";
  // The words
  text: string;
}

// Their face by the mood: pleased, at ease looking at you, or a little deflated (never cross)
const MOOD_FACES: Readonly<Record<SceneMood, FaceName>> = { pleased: "happy", easy: "side-left", deflated: "flat" };

// The first words after a choice, by its tier
const VERDICTS: Readonly<Record<Tier, string>> = { best: "Yes.", good: "That works too.", flat: "Not wrong, but it gives them little to work with.", misstep: "A common move. Here’s what it does." };

// What the screen needs
interface ScenePlayProps extends ScreenProps {
  // The scene's id, from the address
  sceneId: string;
  // Inside today's practice: this step's number
  planStep?: number | null;
  // The microphone and speech-to-text (fakes in tests)
  services?: RecordingServices;
  // Says a line aloud: its recording, or the phone's voice (a stand-in in tests)
  speak?: (text: string, id: string) => Promise<unknown>;
}

// Draw the page: the scene, or a note when it is not found
export function ScenePlayScreen({ sceneId, ...props }: ScenePlayProps) {
  // The scene
  const scene = findScene(sceneId);
  // Not found: say so, with the way back
  if (!scene) {
    // The note
    return (
      <main id="main" className={PRACTICE_MAIN}>
        {/* The bar, with the way back */}
        <PracticeBar close={{ href: "/scenes", label: "Close, back to Scenes" }} label="Scenes" />
        {/* The note and the way back */}
        <div className={PRACTICE_BODY}>
          {/* The note */}
          <h1 className="font-display text-statement">That scene isn’t here.</h1>
          {/* The way back */}
          <p className="mt-4"><Link href="/scenes" className={TEXT_LINK}>Choose another scene</Link></p>
        </div>
      </main>
    );
  }
  // The scene, starting fresh whenever it changes
  return <ScenePlay key={scene.id} scene={scene} {...props} />;
}

// Play one scene
function ScenePlay({ scene, planStep = null, services = browserRecordingServices, speak = speakQuestion, ...props }: Omit<ScenePlayProps, "sceneId"> & { scene: Scene }) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // Inside today's practice: where this step sits
  const plan = usePlanNav(repo, today, planStep);
  // Who you are with
  const persona = findPersona(scene.personaId);
  // Their name
  const name = persona?.name ?? "They";
  // Where the scene is
  const [phase, setPhase] = useState<Phase>("intro");
  // The conversation so far
  const [log, setLog] = useState<Said[]>([]);
  // The tier of each choice so far
  const [tiers, setTiers] = useState<Tier[]>([]);
  // The reply chosen at this step (its place), once chosen
  const [picked, setPicked] = useState<number | null>(null);
  // Whether they are speaking
  const [speaking, setSpeaking] = useState(false);
  // What you said out loud, once a take is done
  const [transcript, setTranscript] = useState<string | null>(null);
  // How it went, at the end
  const [result, setResult] = useState<SceneResult | null>(null);
  // Whether saving failed
  const [saveFailed, setSaveFailed] = useState(false);
  // Which line is the latest asked for, so an older one finishing late does not clear "speaking"
  const latest = useRef(0);
  // Their latest line, to hear again
  const lastLine = useRef<SceneLine | null>(null);

  // Stop any line still playing when the page closes
  useEffect(() => () => stopQuestionVoice(), []);

  // Say a line: show its words, play it, and note when it ends
  async function say(line: SceneLine) {
    // Kept, to hear again
    lastLine.current = line;
    // Their words in the conversation
    setLog((previous) => [...previous, { who: "them", text: line.text }]);
    // Played
    await play(line);
  }

  // Play a line, noting while it is spoken
  async function play(line: SceneLine) {
    // This line's turn
    const turn = ++latest.current;
    // Speaking
    setSpeaking(true);
    // Play it; a failure still ends the line (the words are on screen)
    await speak(line.text, line.id).catch(() => undefined);
    // Done speaking, unless a newer line has started
    if (turn === latest.current) setSpeaking(false);
  }

  // Their latest line once more, without adding it to the conversation
  async function hearAgain() {
    // Only when there is one
    if (lastLine.current) await play(lastLine.current);
  }

  // Start: the tap lets later lines play, then their first line
  function start() {
    // Let the shared player sound later without a tap
    unlockQuestionVoice();
    // On to the first choice
    setPhase("first");
    // Their opening
    void say(scene.opening);
  }

  // Choose a reply at this step
  function choose(options: ReadonlyArray<SceneOption>, position: number) {
    // Once a step
    if (picked !== null) return;
    // The reply
    const option = options[position]!;
    // Noted
    setPicked(position);
    // Its tier
    setTiers((previous) => [...previous, option.tier]);
    // Your words in the conversation
    setLog((previous) => [...previous, { who: "you", text: option.text.replace(/^“|”$/g, "") }]);
    // Their answer
    void say(option.reply);
  }

  // On from a choice: the bridge and the second choice, or their last line and your turn
  function onward() {
    // The step is over
    setPicked(null);
    // After the first choice
    if (phase === "first") {
      // The second choice
      setPhase("second");
      // Their bridging line
      void say(scene.bridge);
      // Done
      return;
    }
    // After the second: your turn
    setPhase("speak");
    // Their last line
    void say(scene.prompt);
  }

  // Save how it went (again after a failure)
  async function save(finished: SceneResult) {
    // Not failed, for now
    setSaveFailed(false);
    // Save it, saying so if that fails
    try {
      // The play
      await saveSceneResult(repo, scene.id, { warmth: finished.warmth, passed: finished.checks.filter((check) => check.passed).length, checkCount: finished.checks.length }, today ?? new Date());
    } catch {
      // Say so, with a way to try again
      setSaveFailed(true);
    }
  }

  // Finish: check what you said, their closing, and save
  function finish() {
    // What you said
    const said = transcript ?? "";
    // How it went
    const finished = sceneResult(scene, tiers, said);
    // Kept
    setResult(finished);
    // Your words in the conversation
    if (said.trim()) setLog((previous) => [...previous, { who: "you", text: said }]);
    // Over
    setPhase("done");
    // Their closing, warm or flat
    void say(finished.warm ? scene.closings.warm : scene.closings.flat);
    // Saved
    void save(finished);
  }

  // Play the same scene again from the start
  function again() {
    // Stop anything playing
    stopQuestionVoice();
    // Back to the start
    setPhase("intro");
    // With nothing said
    setLog([]);
    // Or chosen
    setTiers([]);
    // (this step too)
    setPicked(null);
    // Or spoken
    setTranscript(null);
    // Or worked out
    setResult(null);
    // Or failed
    setSaveFailed(false);
    // Not speaking
    setSpeaking(false);
  }

  // The choices at this step
  const options = phase === "first" ? scene.first : phase === "second" ? scene.second : null;
  // The chosen reply at this step, once chosen
  const chosen = options && picked !== null ? options[picked]! : null;
  // The best reply at this step
  const best = options?.find((option) => option.tier === "best");
  // Their mood: the end's after the closing, otherwise the choices'
  const mood = result ? result.mood : moodFor(sceneWarmth(tiers));
  // The next scene, for the end
  const after = sceneAfter(scene.id);
  // Their latest line, shown in their bubble
  const latestTheirs = [...log].reverse().find((line) => line.who === "them") ?? null;
  // The lines before it, as the conversation so far
  const earlier = latestTheirs ? log.slice(0, log.lastIndexOf(latestTheirs)) : log;
  // How far through: the start, each choice, your turn, the end
  const progress = { intro: 0, first: 0.25, second: 0.5, speak: 0.75, done: 1 }[phase];
  // Your face: wondering what to say, pleased at a good end
  const yourFace = result ? (result.warm ? "happy" : "wonder") : phase === "speak" ? "ready" : "wonder";

  // Draw it
  return (
    <main id="main" className={PRACTICE_MAIN}>
      {/* The bar: the way out, how far through, and the scene */}
      <PracticeBar close={planStep ? { href: "/", label: "Close, back to Today" } : { href: "/scenes", label: "Close, back to Scenes" }} progress={progress} label={plan ? `Scene · ${scene.title} · step ${plan.step} of ${plan.total}` : `Scene · ${scene.title}`} />
      {/* The page's heading for screen readers and the keyboard, until the result's own */}
      {!result && <h1 className="sr-only">{scene.title}</h1>}
      {/* Them on the left, your choices on the right; one column on a phone */}
      <div className={`${PRACTICE_BODY} grid items-start gap-8 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] lg:gap-10`}>
        {/* Them: where, who, and what they just said */}
        <section aria-label={`With ${name}`} className="flex min-w-0 flex-col gap-5">
          {/* Where and who */}
          <div className="rounded-[22px] bg-warm-tint px-5 py-4 text-warm-ink">
            {/* Small heading */}
            <p className={LAB_ON_TINT}>With {name}</p>
            {/* The setting */}
            <p className="mt-1 font-bold leading-snug">{scene.setting}</p>
          </div>
          {/* Opened from Today, before starting: the step's scene, carried over in its panel (decision 141); otherwise them, their face by the mood */}
          {planStep && phase === "intro" ? <ScenePanel scene="scenes" line="Choose your replies, then say the last one." className="" /> : (
            <div role="img" aria-label={mood === "pleased" ? `${name} looks pleased` : mood === "deflated" ? `${name} looks a little deflated` : `${name} looks at ease`} data-mood={mood} data-speaking={speaking || undefined} className="flex flex-col items-center gap-1 self-start px-4">
              {/* The friend */}
              <Cast who="friend" face={MOOD_FACES[mood]} className="size-28 md:size-36" />
              {/* Their name */}
              <span aria-hidden="true" className="font-display text-xl font-semibold">{name}</span>
            </div>
          )}
          {/* Their latest line, in a bubble, with a way to hear it again */}
          {latestTheirs && (
            <div className={`${BUBBLE} -mt-2 flex flex-col items-start gap-4 rounded-[28px] px-6 py-5 shadow-card`}>
              {/* The line */}
              <p aria-live="polite" className="font-display text-cue font-semibold leading-tight">{latestTheirs.text}</p>
              {/* Hear it again */}
              <button type="button" onClick={() => void hearAgain()} className={QUIET}><SpeakerHighIcon aria-hidden="true" weight="bold" className="size-4.5" />Hear it again</button>
            </div>
          )}
          {/* The conversation so far, before their latest line */}
          {earlier.length > 0 && (
            <ol aria-label="The conversation" className="flex flex-col gap-2">
              {/* Each line */}
              {earlier.map((line, index) => (
                <li key={index} data-said={line.who} className={`max-w-[90%] rounded-[18px] px-4 py-2.5 text-footnote ${line.who === "them" ? "self-start border-2 border-rule bg-card" : "self-end bg-warm-tint text-warm-ink"}`}>
                  {/* Who */}
                  <span className="block text-sm font-extrabold">{line.who === "them" ? name : "You"}</span>
                  {/* What */}
                  {line.text}
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* You: the choice, your turn out loud, or how it went */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* Before starting: how it works */}
          {phase === "intro" && (
            <section aria-label="The scene" className="flex flex-col gap-5">
              {/* You, and the ask */}
              <div className="flex items-center gap-5">
                {/* You */}
                <Cast who="you" face="wonder" className="size-16 md:size-20" />
                {/* The scene's name */}
                <div className="min-w-0">
                  {/* Small heading */}
                  <p className={LAB}>Scene · two choices, then out loud</p>
                  {/* The name */}
                  <p className="font-display text-cue font-semibold md:text-statement">{scene.title}</p>
                </div>
              </div>
              {/* How it works */}
              <p className="max-w-[52ch] text-lede">Choose two replies; {name} answers to what you choose. Then say the last one yourself, out loud.</p>
              {/* Start */}
              <p><button type="button" onClick={start} className={`${PRIMARY} min-w-40`}>Start</button></p>
            </section>
          )}
          {/* A choice */}
          {options && (
            <section aria-label={phase === "first" ? "First choice" : "Second choice"} className="flex flex-col gap-4">
              {/* You, wondering, and the question */}
              <div className="flex items-center gap-5">
                {/* You */}
                <Cast who="you" face={yourFace} className="size-16 md:size-20" />
                {/* The question */}
                <div className="min-w-0">
                  {/* Which choice */}
                  <p className={LAB}>Choice {phase === "first" ? 1 : 2} of 2</p>
                  {/* The ask */}
                  <h2 className="font-display text-cue font-semibold md:text-statement">{chosen ? "Your reply" : "What would you say?"}</h2>
                </div>
              </div>
              {/* The replies */}
              <div role="group" aria-label="Replies" className="flex flex-col gap-3">
                {/* Each reply */}
                {options.map((option, position) => (
                  <div key={option.text} className="flex flex-col">
                    {/* One reply: a button before choosing, then marked with its tier and pattern */}
                    <button type="button" disabled={picked !== null} onClick={() => choose(options, position)} data-tier={chosen ? option.tier : undefined} className={`relative z-10 min-h-14 rounded-[18px] border-2 px-5 py-3.5 text-left text-lg font-bold ${PRESS} ${position === picked ? "-rotate-[0.6deg] border-accent bg-card text-ink shadow-picked" : chosen ? "border-transparent bg-paper text-ink-muted opacity-75" : "border-transparent bg-paper text-ink-muted hover:border-accent hover:bg-card hover:text-ink"}`}>
                      {/* The words */}
                      <span className="block">{option.text}</span>
                      {/* Once chosen: its tier and the pattern behind it (the chosen one's is in the reveal) */}
                      {chosen && position !== picked && <span className="mt-1 block text-sm font-extrabold">{TIER_NAMES[option.tier]} · {option.pattern}</span>}
                      {/* Your choice, for screen readers */}
                      {position === picked && <span className="sr-only"> · {TIER_NAMES[option.tier]} · {option.pattern} · your choice</span>}
                    </button>
                    {/* The reveal, under the chosen reply */}
                    {position === picked && chosen && (
                      <div className={`mx-3 -mt-1 flex flex-col gap-2 rounded-b-[18px] px-5 pt-4 pb-4 ${chosen.tier === "best" || chosen.tier === "good" ? "bg-accent-tint text-accent-tint-ink" : "bg-warm-tint text-warm-ink"}`}>
                        {/* Its tier and the pattern */}
                        <p className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-card px-2.5 py-0.5 text-chip font-extrabold uppercase tracking-[.07em]">{TIER_NAMES[chosen.tier]}</span><span className="text-sm font-extrabold">{chosen.pattern}</span></p>
                        {/* How the choice did, and why */}
                        <div role="status">
                          {/* The verdict */}
                          <p className="font-display text-xl font-semibold">{VERDICTS[chosen.tier]}</p>
                          {/* Why */}
                          <p className="mt-1 max-w-[56ch] font-semibold">{chosen.why}</p>
                          {/* Why the best one works, when another was chosen */}
                          {chosen.tier !== "best" && best && <p className="mt-2 max-w-[56ch] font-semibold"><em className="font-extrabold not-italic">The best one:</em> {best.why}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* On */}
              {chosen && <p className="mt-1"><button type="button" onClick={onward} className={PRIMARY}>Carry on</button></p>}
            </section>
          )}
          {/* Your turn, out loud: ahead while choosing, then the recorder */}
          {(options || phase === "speak") && (
            <section aria-label="Your turn" className={`flex flex-col gap-1 p-5 ${CARD} ${phase === "speak" ? "" : "opacity-80"}`}>
              {/* When */}
              <p className={LAB}>{phase === "speak" ? "Your turn, out loud" : phase === "first" ? "After two choices" : "After one more choice"}</p>
              {/* What */}
              <p className="font-display text-cue font-semibold">Now say it out loud</p>
              {/* What to do */}
              <p className="max-w-[52ch] font-semibold text-ink-muted">{scene.final.ask} Up to 45 seconds.</p>
              {/* Record it, once it is your turn */}
              {phase === "speak" && <QuickRecorder services={services} action="Answer" maxSec={45} onDone={setTranscript} />}
              {/* On, once a take is done */}
              {phase === "speak" && transcript !== null && <p className="mt-4"><button type="button" onClick={finish} className={PRIMARY}>Done, hear what {name} says</button></p>}
            </section>
          )}
          {/* How it went */}
          {phase === "done" && result && (
            <section aria-label="How it went" className="flex flex-col gap-5">
              {/* You, and the headline */}
              <div className="flex items-center gap-5">
                {/* You */}
                <Cast who="you" face={yourFace} className="size-16 md:size-20" />
                {/* The headline */}
                <h1 className="font-display text-statement font-semibold">{result.warm ? `${name} left happy.` : "Close. One more go?"}</h1>
              </div>
              {/* Your choices and your reply */}
              <div className={`flex flex-col gap-4 p-5 ${CARD}`}>
                {/* Your two choices */}
                <h2 className={LAB}>Your choices</h2>
                {/* Each */}
                <ul className="-mt-2 flex flex-wrap gap-2">
                  {/* With its tier */}
                  {result.tiers.map((tier, index) => <li key={index} data-choice-tier={tier} className={tier === "best" || tier === "good" ? CHIP_GOOD : CHIP}>{index === 0 ? "First" : "Second"}: {TIER_NAMES[tier]}</li>)}
                </ul>
                {/* Your spoken reply */}
                <h2 className={LAB}>Your reply</h2>
                {/* Nothing caught */}
                {!transcript?.trim() && <p className="-mt-2 text-footnote">No words were caught, so nothing could be checked. Try the scene again when you can speak.</p>}
                {/* Each check */}
                <ul className="-mt-2 flex flex-col gap-2">
                  {/* Passed or not, with its words */}
                  {result.checks.map((check) => (
                    <li key={check.id} data-check={check.id} data-passed={check.passed} className="flex gap-2.5">
                      {/* The mark */}
                      <span aria-hidden="true" className={`grid size-6 flex-none place-items-center rounded-full text-sm font-extrabold ${check.passed ? "bg-accent-tint text-accent-tint-ink" : "border-2 border-rule text-ink-muted"}`}>{check.passed ? "✓" : ""}</span>
                      {/* What it looks for, and the words */}
                      <span className="font-semibold">
                        {check.label}
                        <span className="sr-only">{check.passed ? ": yes" : ": not yet"}</span>
                        {check.evidence && <span className="text-ink-muted"> · {check.evidence}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* The move and one way to say it */}
              <div className="grid gap-3 sm:grid-cols-2">
                {/* The move */}
                <p className="flex flex-col gap-1.5 rounded-2xl bg-accent-tint px-4 py-3.5 font-bold text-accent-tint-ink"><span className={STEP_LABEL}>The move</span>{scene.move}</p>
                {/* One way to say it */}
                <p className="flex flex-col gap-1.5 rounded-2xl bg-paper px-4 py-3.5 font-bold"><span className={LAB}>One way to answer</span>“{scene.example}”</p>
              </div>
              {/* Saving failed */}
              {saveFailed && (
                <p role="alert" className="text-footnote">
                  This play couldn’t be saved.{" "}
                  <button type="button" onClick={() => void save(result)} className={TEXT_LINK}>Try saving again</button>
                </p>
              )}
              {/* Inside today's practice: the next step or finish; otherwise the next scene; then again */}
              <p className="flex flex-wrap items-center gap-3.5">
                {/* The main action */}
                {planStep ? (plan?.next ? <Link href={plan.next.href} className={PRIMARY}>Next: step {plan.step + 1}<span className="sr-only"> {plan.next.label}</span></Link> : <Link href="/" className={PRIMARY}>Finish today’s practice<span className="sr-only"> back to Today</span></Link>) : <Link href={sceneHref(after.id)} className={PRIMARY}>Next scene<span className="sr-only"> {after.title}</span></Link>}
                {/* The same scene */}
                <button type="button" onClick={again} className={SECONDARY}>Play it again</button>
                {/* Every scene, outside today's practice */}
                {!planStep && <Link href="/scenes" className={TEXT_LINK}>All scenes</Link>}
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
