"use client";
// Hearing a story (decision 150): who and where, the story once (twice on level 1) with no words on screen, your answer out loud, then the details you caught, what mattered, and their reply

// Load React's tools
import { useEffect, useRef, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the icons
import { EarIcon, HeadphonesIcon, HeartIcon, MicrophoneIcon, WaveformIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { PRACTICE_BODY, PRACTICE_MAIN, PracticeBar, STEP_LABEL } from "@/components/script/PracticeBar";
import { QuickRecorder } from "@/components/script/QuickRecorder";
// Load the two people, and the panel a step's scene glides into from Today
import { SceneCast } from "@/components/scenes/SceneCast";
// Load the cast, for you beside the verdict
import { Cast } from "@/components/scenes/Cast";
import { ScenePanel } from "@/components/scenes/ScenePanel";
// Load the shared button looks
import { PRIMARY, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the card, label, bubble and progress bar looks
import { BUBBLE, CARD, LAB, LAB_ON_TINT, PBAR, PBAR_FILL } from "@/components/script/textStyles";
// Load the card for a practice that stopped short
import { StopCard } from "@/components/script/StopCard";
// Load the shared screen starting points and today's practice position
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
import { usePlanNav } from "@/components/screens/usePlanNav";
// Load the browser's recording services, and their type
import { browserRecordingServices } from "@/audio/browserServices";
import type { RecordingServices } from "@/audio/services";
// Load the line player
import { speakQuestion, stopQuestionVoice, unlockQuestionVoice } from "@/audio/questionVoice";
// Load the stories and the people
import { LEVELS, findListenStory, type ListenLine, type ListenStory } from "@/content/listening";
import { findPersona } from "@/content/conversations";
// Load the listening rules
import { hearingsAllowed, listenHref, listenResult, storiesInOrder, storyPieces, type ListenResult } from "@/core/listening";
// Load the progress saver
import { saveListenResult } from "@/data/practiceProgress";

// Where the story is
type Phase = "intro" | "hearing" | "answer" | "done";

// The look of each marked piece of the story
const MARK_LOOK = { core: "rounded bg-warm-tint px-0.5 font-semibold", caught: "rounded bg-accent-tint px-0.5", missed: "underline decoration-ink-muted decoration-dotted underline-offset-4" } as const;

// What the screen needs
interface ListenPlayProps extends ScreenProps {
  // The story's id, from the address
  storyId: string;
  // Inside today's practice: this step's number
  planStep?: number | null;
  // The microphone and speech-to-text (fakes in tests)
  services?: RecordingServices;
  // Says a line aloud: its recording, or the phone's voice (a stand-in in tests)
  speak?: (text: string, id: string) => Promise<unknown>;
}

// Draw the page: the story, or a note when it is not found
export function ListenPlayScreen({ storyId, ...props }: ListenPlayProps) {
  // The story
  const story = findListenStory(storyId);
  // Not found: say so, with the way back
  if (!story) {
    // The note
    return (
      <main id="main" className={PRACTICE_MAIN}>
        {/* The bar, with the way back */}
        <PracticeBar close={{ href: "/listening", label: "Close, back to Active listening" }} label="Active listening" />
        {/* The note and the way back, in one card with the friend */}
        <div className={`${PRACTICE_BODY} max-w-3xl`}>
          {/* The card */}
          <StopCard who="friend" face="wonder" label="Active listening" title="That story isn’t here." detail="The link may be old. Every story is on the Active listening page.">
            {/* The way back */}
            <Link href="/listening" className={PRIMARY}>Choose another story</Link>
          </StopCard>
        </div>
      </main>
    );
  }
  // The story, starting fresh whenever it changes
  return <ListenPlay key={story.id} story={story} {...props} />;
}

// Hear one story
function ListenPlay({ story, planStep = null, services = browserRecordingServices, speak = speakQuestion, ...props }: Omit<ListenPlayProps, "storyId"> & { story: ListenStory }) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // Inside today's practice: where this step sits
  const plan = usePlanNav(repo, today, planStep);
  // The teller's name
  const name = findPersona(story.personaId)?.name ?? "They";
  // Where the story is
  const [phase, setPhase] = useState<Phase>("intro");
  // How many times it has been heard
  const [hearings, setHearings] = useState(0);
  // Whether they are speaking
  const [speaking, setSpeaking] = useState(false);
  // Whether the words are shown while answering (for anyone who cannot listen now)
  const [showWords, setShowWords] = useState(false);
  // What you said, once a take is done
  const [transcript, setTranscript] = useState<string | null>(null);
  // How it went
  const [result, setResult] = useState<ListenResult | null>(null);
  // Their reply to you, once said
  const [reply, setReply] = useState<string | null>(null);
  // Whether saving failed
  const [saveFailed, setSaveFailed] = useState(false);
  // Which line is the latest asked for, so an older one finishing late does not clear "speaking"
  const latest = useRef(0);

  // Stop any line still playing when the page closes
  useEffect(() => () => stopQuestionVoice(), []);

  // Say a line, noting when it ends (a failure still ends it)
  async function say(line: ListenLine) {
    // This line's turn
    const turn = ++latest.current;
    // Speaking
    setSpeaking(true);
    // Play it
    await speak(line.text, line.id).catch(() => undefined);
    // Done speaking, unless a newer line has started
    if (turn === latest.current) setSpeaking(false);
  }

  // Hear the story (the first tap lets later lines play), then answer
  async function hear() {
    // Let the shared player sound later without a tap
    unlockQuestionVoice();
    // Heard once more
    setHearings((count) => count + 1);
    // Before the answer: hearing it
    if (phase !== "done") setPhase("hearing");
    // The story
    await say({ id: story.id, text: story.text, tag: story.tag });
    // Then the answer, unless the result is already showing
    setPhase((current) => (current === "done" ? current : "answer"));
  }

  // Save how it went (again after a failure)
  async function save(finished: ListenResult) {
    // Not failed, for now
    setSaveFailed(false);
    // Save it, saying so if that fails
    try {
      // The answer
      await saveListenResult(repo, story.id, { caught: finished.caught, detailCount: finished.details.length, core: finished.core !== null }, today ?? new Date());
    } catch {
      // Say so, with a way to try again
      setSaveFailed(true);
    }
  }

  // Finish: check the answer, their reply, and save
  function finish() {
    // Stop the story if it is still playing
    stopQuestionVoice();
    // How it went
    const finished = listenResult(story, transcript ?? "");
    // Kept
    setResult(finished);
    // Over
    setPhase("done");
    // Their reply, warm or polite
    const closing = finished.warm ? story.closings.warm : story.closings.flat;
    // Shown
    setReply(closing.text);
    // And said
    void say(closing);
    // Saved
    void save(finished);
  }

  // Try the same story again from the start
  function again() {
    // Stop anything playing
    stopQuestionVoice();
    // Back to the start
    setPhase("intro");
    // Not heard
    setHearings(0);
    // Nothing said
    setTranscript(null);
    // Or worked out
    setResult(null);
    // Or replied
    setReply(null);
    // Or failed
    setSaveFailed(false);
    // Words hidden again
    setShowWords(false);
    // Not speaking
    setSpeaking(false);
  }

  // The stories in order, and the one after this
  const ordered = storiesInOrder();
  // (wrapping round)
  const after = ordered[(ordered.findIndex((item) => item.id === story.id) + 1) % ordered.length]!;
  // Hearings left before answering
  const left = hearingsAllowed(story) - hearings;

  // Draw it
  return (
    <main id="main" className={PRACTICE_MAIN}>
      {/* The bar: the way out, how far through, and the level (the story's name stays hidden until afterwards) */}
      <PracticeBar close={planStep ? { href: "/", label: "Close, back to Today" } : { href: "/listening", label: "Close, back to Active listening" }} progress={{ intro: 0.1, hearing: 0.4, answer: 0.7, done: 1 }[phase]} label={plan ? `Active listening · step ${plan.step} of ${plan.total}` : `Active listening · ${LEVELS[story.level].name}`} />
      {/* The page's heading for screen readers and the keyboard, until the result's own */}
      {!result && <h1 className="sr-only">Active listening</h1>}
      {/* The story on the left, your answer on the right; one column on a phone */}
      <div role={phase === "done" ? "region" : undefined} aria-label={phase === "done" ? "How it went" : undefined} className={`${PRACTICE_BODY} grid max-w-[69rem] items-start gap-6 lg:grid-cols-2 lg:gap-8`}>
        {/* Them: who and where, the two of you, and the story */}
        <section aria-label={phase === "intro" ? "The story" : `With ${name}`} className={`flex min-w-0 flex-col gap-5 p-5 md:p-7 ${CARD}`}>
          {/* Who */}
          <p className={LAB}>{result ? story.title : name}</p>
          {/* Where (until the reply) */}
          {!reply && <p className="-mt-2 font-semibold text-ink-muted">{story.setting}</p>}
          {/* Their reply, at the end */}
          {reply && <p data-reply className={`${BUBBLE} -mt-1 rounded-[22px] font-semibold`}><span className="block text-sm font-extrabold text-ink-muted">{name}</span>{reply}</p>}
          {/* Opened from Today, before starting: the step's scene, carried over in its panel (decision 141); otherwise the two people */}
          {planStep && phase === "intro" ? <ScenePanel scene="listening" line="Listen once, then answer to what mattered." className="" /> : <SceneCast mood={result ? (result.warm ? "pleased" : "easy") : "easy"} speaking={speaking} name={name} labels friendFirst you={phase === "hearing" ? "listen" : result?.warm ? "happy" : "side-left"} className="bg-art-sky/15" />}
          {/* Before hearing it: what to listen for, and Listen */}
          {phase === "intro" && (
            <>
              {/* What to listen for */}
              <p className="max-w-[52ch] font-semibold">{LEVELS[story.level].about} Listen for what happened, how it felt, and what matters most to {name}. Then answer as you would to a friend.</p>
              {/* Listen */}
              <p><button type="button" onClick={() => void hear()} className={`${PRIMARY} min-w-40`}><HeadphonesIcon aria-hidden="true" weight="bold" className="size-5" />Listen</button></p>
            </>
          )}
          {/* While hearing it, and while answering: just listen */}
          {(phase === "hearing" || phase === "answer") && (
            <>
              {/* What is happening */}
              <p role={phase === "hearing" ? "status" : undefined} className="font-display text-cue font-semibold leading-tight">{phase === "hearing" ? `${name} is telling you something. Just listen.` : `${name} has told you something.`}</p>
              {/* How */}
              <p className="-mt-2 flex items-center gap-2.5 font-extrabold"><EarIcon aria-hidden="true" weight="bold" className="size-5 flex-none" />{hearingsAllowed(story) > 1 ? "Listen. You can hear it once more." : "Listen once. No words on screen."}</p>
              {/* Speaking, shown as a moving sound mark */}
              <p aria-hidden="true" className="flex items-center gap-3">
                {/* The sound mark */}
                <span className="grid size-10 flex-none place-items-center rounded-full bg-accent-tint text-accent-tint-ink"><WaveformIcon weight="bold" className="size-5" /></span>
                {/* The bar: moving while they speak */}
                <span className={`${PBAR} h-2.5 flex-1`}><span className={`${PBAR_FILL} transition-[width] duration-700 ${speaking ? "w-2/3 motion-safe:animate-pulse" : "w-full"}`} /></span>
                {/* Heard so far */}
                <span className="text-sm font-extrabold text-ink-muted">{speaking ? "Playing" : `Heard ${hearings === 1 ? "once" : `${hearings} times`}`}</span>
              </p>
            </>
          )}
          {/* At the end: the story marked */}
          {phase === "done" && result && (
            <>
              {/* Small heading */}
              <h2 className={LAB}>What {name} said</h2>
              {/* Its words with the details and what mattered */}
              <p data-story-marked className="-mt-2 max-w-[60ch] text-lede leading-relaxed">
                {/* Each piece */}
                {storyPieces(story, result).map((piece, index) => (piece.mark ? <mark key={index} data-mark={piece.mark} className={`bg-transparent text-ink ${MARK_LOOK[piece.mark]}`}>{piece.text}</mark> : <span key={index}>{piece.text}</span>))}
              </p>
              {/* The key to the marks */}
              <p className="-mt-2 text-sm font-bold text-ink-muted"><span className={MARK_LOOK.core}>What mattered</span> · <span className={MARK_LOOK.caught}>a detail you caught</span> · <span className={MARK_LOOK.missed}>one you missed</span></p>
              {/* Why it mattered */}
              <p className="flex flex-col gap-1 rounded-2xl bg-warm-tint px-4 py-3.5 font-bold text-warm-ink"><span className={LAB_ON_TINT}>What mattered</span>{story.core.why}</p>
            </>
          )}
        </section>

        {/* You: your answer out loud, or how it went */}
        {phase !== "done" ? (
          <section aria-label={phase === "answer" ? "Your answer" : "Answering"} className={`flex min-w-0 flex-col gap-4 p-5 md:p-7 ${CARD}`}>
            {/* Small heading */}
            <p className={LAB}>Your answer, out loud</p>
            {/* The ask */}
            <p className="-mt-2 font-display text-cue font-semibold md:text-statement">What did you catch?</p>
            {/* What to do */}
            <p className="-mt-2 text-lg font-semibold">Answer {name} as you would a friend.</p>
            {/* The tip */}
            <p className="flex items-start gap-3 rounded-2xl bg-warm-tint px-4 py-3.5 font-extrabold text-warm-ink"><HeartIcon aria-hidden="true" weight="bold" className="mt-0.5 size-5 flex-none" />Go to what mattered to them, not just what happened.</p>
            {/* Record it, once the story has been heard */}
            {phase === "answer" ? <QuickRecorder services={services} action="Answer" maxSec={45} onDone={setTranscript} look="round" /> : (
              // The answer button's place, waiting for the story to end (as Listening draws it, still and grey until then)
              <div className="flex flex-col items-center gap-1.5 py-3 text-center">
                {/* The round microphone, not yet pressable */}
                <span aria-hidden="true" className="grid size-24 place-items-center rounded-full bg-paper text-ink-muted shadow-ledge"><MicrophoneIcon weight="bold" className="size-9" /></span>
                {/* Its name */}
                <span aria-hidden="true" className="mt-2 font-display text-xl font-semibold text-ink-muted">Answer</span>
                {/* When */}
                <span className="text-sm font-bold text-ink-muted">Up to 45 seconds. Ready when the story ends.</span>
              </div>
            )}
            {/* On, once a take is done */}
            {phase === "answer" && transcript !== null && <p><button type="button" onClick={finish} className={PRIMARY}>Done, see what you caught</button></p>}
            {/* Hear it again, when allowed, and the words */}
            {phase === "answer" && (
              <p className="flex flex-wrap justify-center gap-x-6 border-t-2 border-rule pt-2">
                {/* Once more on level 1 */}
                {left > 0 && <button type="button" disabled={speaking} onClick={() => void hear()} className={`${TEXT_LINK} underline decoration-current`}>Hear it once more</button>}
                {/* The words, for anyone who cannot listen now */}
                {!showWords && <button type="button" onClick={() => setShowWords(true)} className={`${TEXT_LINK} underline decoration-current`}>Can’t listen? Show the words</button>}
              </p>
            )}
            {/* The words, when asked for */}
            {showWords && <p data-story-words className="max-w-[52ch] rounded-2xl bg-paper px-4 py-3 text-footnote">{story.text}</p>}
          </section>
        ) : result && (
          <section aria-label="Your result" className="flex min-w-0 flex-col gap-5">
            {/* You, and the headline, on the verdict's colour (as the result after a take: green when you heard what mattered, warm amber when not) */}
            <div data-verdict={result.core ? "good" : "rough"} className={`flex items-center gap-5 rounded-[22px] px-5 py-4 motion-safe:animate-rise md:px-6 md:py-5 ${result.core ? "bg-accent-tint text-accent-tint-ink" : "bg-warm-tint text-warm-ink"}`}>
              {/* You */}
              <Cast who="you" face={result.core ? "happy" : "wonder"} className="size-16 md:size-20" />
              {/* The headline */}
              <h1 className="font-display text-cue font-semibold leading-tight md:text-statement">{result.core ? "You heard what mattered." : `You caught ${result.caught} of ${result.details.length} details.`}</h1>
            </div>
            {/* Nothing caught */}
            {!transcript?.trim() && <p className="-mt-2 text-footnote">No words were caught, so nothing could be checked. Try again when you can speak.</p>}
            {/* The checks */}
            <div className={`flex flex-col gap-3 p-5 ${CARD}`}>
              {/* Small heading */}
              <h2 className={LAB}>Your answer</h2>
              {/* Each check */}
              <ul className="flex flex-col gap-2">
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
            {/* One way to answer */}
            <p className="flex flex-col gap-1.5 rounded-2xl bg-accent-tint px-4 py-3.5 font-bold text-accent-tint-ink"><span className={STEP_LABEL}>One way to answer</span>“{story.example}”</p>
            {/* Saving failed */}
            {saveFailed && (
              <p role="alert" className="flex flex-wrap items-center gap-x-3 rounded-2xl bg-warm-tint px-4 py-2 font-bold text-warm-ink">
                This answer couldn’t be saved.{" "}
                <button type="button" onClick={() => void save(result)} className={TEXT_LINK}>Try saving again</button>
              </p>
            )}
            {/* Inside today's practice: the next step or finish; otherwise the next story; then again */}
            <p className="flex flex-wrap items-center gap-3">
              {/* The main action */}
              {planStep ? (plan?.next ? <Link href={plan.next.href} className={PRIMARY}>Next: step {plan.step + 1}<span className="sr-only"> {plan.next.label}</span></Link> : <Link href="/" className={PRIMARY}>Finish today’s practice<span className="sr-only"> back to Today</span></Link>) : <Link href={listenHref(after.id)} className={PRIMARY}>Next story<span className="sr-only"> {LEVELS[after.level].name}, from {findPersona(after.personaId)?.name}</span></Link>}
              {/* Hear the story again */}
              <button type="button" disabled={speaking} onClick={() => void hear()} className={SECONDARY}>Hear it again</button>
              {/* Answer it again */}
              <button type="button" onClick={again} className={SECONDARY}>Try it again</button>
              {/* Every story, outside today's practice */}
              {!planStep && <Link href="/listening" className={TEXT_LINK}>All stories</Link>}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
