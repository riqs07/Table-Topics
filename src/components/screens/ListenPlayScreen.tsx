"use client";
// Hearing a story (decision 150): who and where, the story once (twice on level 1) with no words on screen, your answer out loud, then the details you caught, what mattered, and their reply

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
import { PRIMARY, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
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
const MARK_LOOK = { core: "rounded bg-warm-tint px-0.5 font-semibold", caught: "rounded bg-accent/15 px-0.5", missed: "underline decoration-ink-muted decoration-dotted underline-offset-4" } as const;

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
      <main id="main" className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
        {/* Title, with the way back */}
        <Masthead title="Active listening" nav={false} close={{ href: "/listening", label: "Close, back to Active listening" }} />
        {/* The note */}
        <h1 className="mt-8 font-display text-statement tracking-tight">That story isn’t here.</h1>
        {/* The way back */}
        <p className="mt-4"><Link href="/listening" className={TEXT_LINK}>Choose another story</Link></p>
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
    <main id="main" className="mx-auto flex min-h-dvh max-w-3xl flex-col bg-paper-raised px-6 pt-6 pb-28 md:px-14 md:pt-10">
      {/* Title, with the way out (the story's name stays hidden until afterwards) */}
      <Masthead title={result ? story.title : "Active listening"} nav={false} close={planStep ? { href: "/", label: "Close, back to Today" } : { href: "/listening", label: "Close, back to Active listening" }}>{plan ? `Step ${plan.step} of ${plan.total}` : LEVELS[story.level].name}</Masthead>
      {/* Opened from Today, before starting: the step's scene, carried over in its panel (decision 141); otherwise the two people */}
      {planStep && phase === "intro" ? <ScenePanel scene="listening" line="Listen once, then answer to what mattered." className="mt-4" /> : (<div className="mt-4 flex justify-center"><SceneCast mood={result ? (result.warm ? "pleased" : "easy") : "easy"} speaking={speaking} name={name} /></div>)}
      {/* Before hearing it */}
      {phase === "intro" && (
        <section aria-label="The story" className="mt-4">
          {/* Where and who */}
          <p className="max-w-[52ch] text-lede">{story.setting}</p>
          {/* What to listen for */}
          <p className="mt-3 max-w-[52ch] text-footnote text-ink-muted">{LEVELS[story.level].about} Listen for what happened, how it felt, and what matters most to {name}. Then answer as you would to a friend.</p>
          {/* Listen */}
          <p className="mt-6"><button type="button" onClick={() => void hear()} className={PRIMARY}>Listen</button></p>
        </section>
      )}
      {/* While hearing it */}
      {phase === "hearing" && <p role="status" className="mt-4 text-center text-lede">{name} is telling you something. Just listen.</p>}
      {/* Your answer */}
      {phase === "answer" && (
        <section aria-label="Your answer" className={`mt-6 p-4 ${CARD}`}>
          {/* The ask */}
          <p className={LABEL}>Your answer, out loud</p>
          {/* What to do */}
          <p className="mt-1 text-lede">Answer {name} as you would a friend.</p>
          {/* Record it */}
          <QuickRecorder services={services} action="Answer" maxSec={45} onDone={setTranscript} />
          {/* On, once a take is done */}
          {transcript !== null && <p className="mt-4"><button type="button" onClick={finish} className={PRIMARY}>Done, see what you caught</button></p>}
          {/* Hear it again, when allowed */}
          <p className="mt-4 flex flex-wrap gap-x-4">
            {/* Once more on level 1 */}
            {left > 0 && <button type="button" disabled={speaking} onClick={() => void hear()} className={TEXT_LINK}>Hear it once more</button>}
            {/* The words, for anyone who cannot listen now */}
            {!showWords && <button type="button" onClick={() => setShowWords(true)} className={TEXT_LINK}>Can’t listen? Show the words</button>}
          </p>
          {/* The words, when asked for */}
          {showWords && <p data-story-words className="mt-3 max-w-[52ch] text-footnote">{story.text}</p>}
        </section>
      )}
      {/* How it went */}
      {phase === "done" && result && (
        <section aria-label="How it went" className="mt-6">
          {/* Their reply */}
          {reply && <p data-reply className="max-w-[85%] rounded-[18px] bg-card px-4 py-3 shadow-card"><span className="block text-footnote text-ink-muted">{name}</span>{reply}</p>}
          {/* The headline */}
          <h1 className="mt-6 font-display text-statement tracking-tight">{result.core ? "You heard what mattered." : `You caught ${result.caught} of ${result.details.length} details.`}</h1>
          {/* Nothing caught */}
          {!transcript?.trim() && <p className="mt-2 text-footnote">No words were caught, so nothing could be checked. Try again when you can speak.</p>}
          {/* The story, marked */}
          <h2 className="mt-6 font-display text-xl font-semibold tracking-tight">What {name} said</h2>
          {/* Its words with the details and what mattered */}
          <p data-story-marked className="mt-2 max-w-[60ch] text-lede leading-relaxed">
            {/* Each piece */}
            {storyPieces(story, result).map((piece, index) => (piece.mark ? <mark key={index} data-mark={piece.mark} className={`bg-transparent text-ink ${MARK_LOOK[piece.mark]}`}>{piece.text}</mark> : <span key={index}>{piece.text}</span>))}
          </p>
          {/* The key to the marks */}
          <p className="mt-2 text-footnote text-ink-muted"><span className={MARK_LOOK.core}>What mattered</span> · <span className={MARK_LOOK.caught}>a detail you caught</span> · <span className={MARK_LOOK.missed}>one you missed</span></p>
          {/* Why it mattered */}
          <p className="mt-4 border-l-2 border-accent pl-3 text-lede"><span className="block text-footnote text-ink-muted">What mattered</span>{story.core.why}</p>
          {/* Each check */}
          <h2 className="mt-6 font-display text-xl font-semibold tracking-tight">Your answer</h2>
          {/* The checks */}
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
          {/* One way to answer */}
          <p className="mt-6 max-w-[52ch] text-lede"><span className="block text-footnote text-ink-muted">One way to answer</span>“{story.example}”</p>
          {/* Saving failed */}
          {saveFailed && (
            <p role="alert" className="mt-4 text-footnote">
              This answer couldn’t be saved.{" "}
              <button type="button" onClick={() => void save(result)} className={TEXT_LINK}>Try saving again</button>
            </p>
          )}
          {/* Again */}
          <p className="mt-6 flex flex-wrap gap-3">
            {/* Hear the story again */}
            <button type="button" disabled={speaking} onClick={() => void hear()} className={SECONDARY}>Hear it again</button>
            {/* Answer it again */}
            <button type="button" onClick={again} className={SECONDARY}>Try it again</button>
            {/* Every story, outside today's practice */}
            {!planStep && <Link href="/listening" className={TEXT_LINK}>All stories</Link>}
          </p>
          {/* Inside today's practice: the next step or finish; otherwise the next story */}
          {planStep ? (plan?.next ? <ActionBand action={`Next: step ${plan.step + 1}`} aside={plan.next.label} href={plan.next.href} /> : <ActionBand action="Finish today’s practice" aside="back to Today" href="/" />) : <ActionBand action="Next story" aside={`${LEVELS[after.level].name}, from ${findPersona(after.personaId)?.name}`} href={listenHref(after.id)} />}
        </section>
      )}
    </main>
  );
}
