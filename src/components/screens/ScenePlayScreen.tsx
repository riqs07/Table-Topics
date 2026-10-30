"use client";
// Playing a scene (decision 149): they speak, you choose a reply, they answer to what you chose; twice; then your reply out loud, their closing, and how it went

// Load React's tools
import { useEffect, useRef, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Masthead } from "@/components/script/Masthead";
import { QuickRecorder } from "@/components/script/QuickRecorder";
// Load the two people, and the panel a step's scene glides into from Today
import { SceneCast } from "@/components/scenes/SceneCast";
import { ScenePanel } from "@/components/scenes/ScenePanel";
// Load the shared button looks
import { PRESS, PRIMARY, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the card look and the small label look
import { CARD, LABEL } from "@/components/script/textStyles";
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
import { moodFor, sceneAfter, sceneHref, sceneResult, sceneWarmth, type SceneResult } from "@/core/scenes";
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

// The look of each tier once revealed: best filled, the others by their edge (as in the quick scenarios)
const TIER_LOOK: Readonly<Record<Tier, string>> = { best: "border-fill bg-fill text-fill-ink", good: "border-accent bg-card", flat: "border-transparent bg-card text-ink-muted", misstep: "border-ink bg-card" };

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
      <main id="main" className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
        {/* Title, with the way back */}
        <Masthead title="Scenes" nav={false} close={{ href: "/scenes", label: "Close, back to Scenes" }} />
        {/* The note */}
        <h1 className="mt-8 font-display text-statement tracking-tight">That scene isn’t here.</h1>
        {/* The way back */}
        <p className="mt-4"><Link href="/scenes" className={TEXT_LINK}>Choose another scene</Link></p>
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

  // Stop any line still playing when the page closes
  useEffect(() => () => stopQuestionVoice(), []);

  // Say a line: show its words, play it, and note when it ends
  async function say(line: SceneLine) {
    // This line's turn
    const turn = ++latest.current;
    // Their words in the conversation
    setLog((previous) => [...previous, { who: "them", text: line.text }]);
    // Speaking
    setSpeaking(true);
    // Play it; a failure still ends the line (the words are on screen)
    await speak(line.text, line.id).catch(() => undefined);
    // Done speaking, unless a newer line has started
    if (turn === latest.current) setSpeaking(false);
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

  // Draw it
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-3xl flex-col bg-paper-raised px-6 pt-6 pb-28 md:px-14 md:pt-10">
      {/* Title, with the way out */}
      <Masthead title={scene.title} nav={false} close={planStep ? { href: "/", label: "Close, back to Today" } : { href: "/scenes", label: "Close, back to Scenes" }}>{plan ? `Step ${plan.step} of ${plan.total}` : `With ${name}`}</Masthead>
      {/* Opened from Today, before starting: the step's scene, carried over in its panel (decision 141); otherwise the two people */}
      {planStep && phase === "intro" ? <ScenePanel scene="scenes" line="Choose your replies, then say the last one." className="mt-4" /> : (<div className="mt-4 flex justify-center"><SceneCast mood={mood} speaking={speaking} name={name} /></div>)}
      {/* Before starting: where you are */}
      {phase === "intro" && (
        <section aria-label="The scene" className="mt-4">
          {/* Where and who */}
          <p className="max-w-[52ch] text-lede">{scene.setting}</p>
          {/* How it works */}
          <p className="mt-3 max-w-[52ch] text-footnote text-ink-muted">Choose two replies; {name} answers to what you choose. Then say the last one yourself, out loud.</p>
          {/* Start */}
          <p className="mt-6"><button type="button" onClick={start} className={PRIMARY}>Start</button></p>
        </section>
      )}
      {/* The conversation so far */}
      {log.length > 0 && (
        <ol aria-label="The conversation" className="mt-4 flex flex-col gap-2">
          {/* Each line */}
          {log.map((line, index) => (
            <li key={index} data-said={line.who} className={`max-w-[85%] rounded-[18px] px-4 py-3 ${line.who === "them" ? "self-start bg-card shadow-card" : "self-end bg-warm-tint"}`}>
              {/* Who */}
              <span className="block text-footnote text-ink-muted">{line.who === "them" ? name : "You"}</span>
              {/* What */}
              {line.text}
            </li>
          ))}
        </ol>
      )}
      {/* A choice */}
      {options && (
        <section aria-label={phase === "first" ? "First choice" : "Second choice"} className="mt-6">
          {/* The question */}
          <p className={LABEL}>{chosen ? "Your reply" : "What do you say?"}</p>
          {/* The replies */}
          <div role="group" aria-label="Replies" className="mt-2 flex flex-col gap-2">
            {/* Each reply */}
            {options.map((option, position) => (
              // One reply: a button before choosing, then marked with its tier and pattern
              <button key={option.text} type="button" disabled={picked !== null} onClick={() => choose(options, position)} data-tier={chosen ? option.tier : undefined} className={`min-h-14 rounded-2xl border-2 px-4 py-3 text-left shadow-card ${PRESS} ${chosen ? TIER_LOOK[option.tier] : "border-transparent bg-card hover:border-accent"} ${chosen && position !== picked ? "opacity-70" : ""}`}>
                {/* The words */}
                <span className="block">{option.text}</span>
                {/* Once chosen: its tier and the pattern behind it */}
                {chosen && <span className="mt-1 block text-footnote">{TIER_NAMES[option.tier]} · {option.pattern}{position === picked ? " · your choice" : ""}</span>}
              </button>
            ))}
          </div>
          {/* The reveal */}
          {chosen && (
            <div role="status" className="mt-4">
              {/* How the choice did */}
              <p className="font-display text-cue">{VERDICTS[chosen.tier]}</p>
              {/* Why */}
              <p className="mt-1 max-w-[52ch] text-lede">{chosen.why}</p>
              {/* Why the best one works, when another was chosen */}
              {chosen.tier !== "best" && best && <p className="mt-2 max-w-[52ch] text-lede"><em>The best one:</em> {best.why}</p>}
              {/* On */}
              <p className="mt-5"><button type="button" onClick={onward} className={PRIMARY}>Carry on</button></p>
            </div>
          )}
        </section>
      )}
      {/* Your turn, out loud */}
      {phase === "speak" && (
        <section aria-label="Your turn" className={`mt-6 p-4 ${CARD}`}>
          {/* The ask */}
          <p className={LABEL}>Your turn, out loud</p>
          {/* What to do */}
          <p className="mt-1 text-lede">{scene.final.ask}</p>
          {/* Record it */}
          <QuickRecorder services={services} action="Answer" maxSec={45} onDone={setTranscript} />
          {/* On, once a take is done */}
          {transcript !== null && <p className="mt-4"><button type="button" onClick={finish} className={PRIMARY}>Done, hear what {name} says</button></p>}
        </section>
      )}
      {/* How it went */}
      {phase === "done" && result && (
        <section aria-label="How it went" className="mt-8">
          {/* The headline */}
          <h1 className="font-display text-statement tracking-tight">{result.warm ? `${name} left happy.` : "Close. One more go?"}</h1>
          {/* Your two choices */}
          <h2 className="mt-6 font-display text-xl font-semibold tracking-tight">Your choices</h2>
          {/* Each */}
          <ul className="mt-2 flex flex-col gap-1">
            {/* With its tier */}
            {result.tiers.map((tier, index) => <li key={index} data-choice-tier={tier}>{index === 0 ? "First" : "Second"}: <strong>{TIER_NAMES[tier]}</strong></li>)}
          </ul>
          {/* Your spoken reply */}
          <h2 className="mt-6 font-display text-xl font-semibold tracking-tight">Your reply</h2>
          {/* Nothing caught */}
          {!transcript?.trim() && <p className="mt-2 text-footnote">No words were caught, so nothing could be checked. Try the scene again when you can speak.</p>}
          {/* Each check */}
          <ul className="mt-2 flex flex-col gap-2">
            {/* Passed or not, with its words */}
            {result.checks.map((check) => (
              <li key={check.id} data-check={check.id} data-passed={check.passed} className="flex gap-2">
                {/* The mark */}
                <span aria-hidden="true" className={check.passed ? "text-accent" : "text-ink-muted"}>{check.passed ? "✓" : "○"}</span>
                {/* What it looks for, and the words */}
                <span>
                  {check.label}
                  <span className="sr-only">{check.passed ? ": yes" : ": not yet"}</span>
                  {check.evidence && <span className="text-ink-muted"> · {check.evidence}</span>}
                </span>
              </li>
            ))}
          </ul>
          {/* The move */}
          <p className="mt-6 border-l-2 border-accent pl-3 text-lede"><span className="block text-footnote text-ink-muted">The move</span>{scene.move}</p>
          {/* One way to say it */}
          <p className="mt-4 max-w-[52ch] text-lede"><span className="block text-footnote text-ink-muted">One way to answer</span>“{scene.example}”</p>
          {/* Saving failed */}
          {saveFailed && (
            <p role="alert" className="mt-4 text-footnote">
              This play couldn’t be saved.{" "}
              <button type="button" onClick={() => void save(result)} className={TEXT_LINK}>Try saving again</button>
            </p>
          )}
          {/* Again */}
          <p className="mt-6 flex flex-wrap gap-3">
            {/* The same scene */}
            <button type="button" onClick={again} className={SECONDARY}>Play it again</button>
            {/* Every scene, outside today's practice */}
            {!planStep && <Link href="/scenes" className={TEXT_LINK}>All scenes</Link>}
          </p>
          {/* Inside today's practice: the next step or finish; otherwise the next scene */}
          {planStep ? (plan?.next ? <ActionBand action={`Next: step ${plan.step + 1}`} aside={plan.next.label} href={plan.next.href} /> : <ActionBand action="Finish today’s practice" aside="back to Today" href="/" />) : <ActionBand action="Next scene" aside={after.title} href={sceneHref(after.id)} />}
        </section>
      )}
    </main>
  );
}
