"use client";
// The recording screen: shows the prompt, records speech with a live transcript and level meter, and saves the session

// Load React's state, effect, reference, and callback tools
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionButton } from "@/components/script/ActionBand";
import { Footnote } from "@/components/script/Footnote";
import { Masthead } from "@/components/script/Masthead";
// Load the never-firing subscription used to tell the browser apart from the server
import { subscribeToNothing } from "@/components/screens/screenBasics";
// Load the recording contracts
import type { AudioCapture, LiveText, LiveTranscriber, RecordingProblem, RecordingServices } from "@/audio/services";
// Load the prompt lookup
import { BOOKENDS, STRUCTURE_HINT, findPrompt } from "@/content/prompts";
// Load the lookup for every text to read, full speeches included
import { findReading } from "@/content/readings";
// Load the lesson lookup
import { findLesson } from "@/content/lessons";
// Load the plain descriptions of each mode
import { modeForSession } from "@/content/modes";
// Load the filler marker
import { markFillers } from "@/core/fillers";
// Load the live reading tools
import { followReading, readingTokens, scriptWords, stampFirstRead, stampSpoken, type ReadingToken } from "@/core/liveReading";
import { memoryLadder, talkSections, type Ladder } from "@/core/eventPrep";
// Load the recording length rules
import { LOUDNESS_TICK_MS, MIN_SECONDS, formatClock, maxSeconds, readingSeconds, speakingWindow, targetSeconds, thinkSeconds, timeSignal, type SpeakingWindow, type TimeSignal } from "@/core/recordingRules";
// Load the shared browser repository
import { browserRepository } from "@/data/browserRepository";
// Load the record and repository types
import type { SessionMode, TalkRecord } from "@/data/records";
import type { Repository } from "@/data/repository";
// Load the recording saver
import { saveRecording } from "@/data/saveRecording";
// Load the flag for explaining the microphone first
import { markMicExplained, readMicExplained } from "@/data/micExplained";
// Load today's practice, for its number of steps
import { loadDailyPlan } from "@/data/dailyPlan";

// What the screen is given
interface RecordingScreenProps {
  // Which prompt to speak to
  promptId: string;
  // Full session or warm-up
  mode: SessionMode;
  // The session being retried, or null
  retryOf: string | null;
  // The browser's recording pieces (fakes in tests)
  services: RecordingServices;
  // Where to go next (the router in the app)
  navigate: (path: string) => void;
  // Where sessions are saved (the browser's repository by default)
  repository?: Repository;
  // The current time (the real clock by default)
  clock?: () => Date;
  // For a rehearsal: one section of the talk (counted from 0), or null for the whole talk
  sectionIndex?: number | null;
  // For a rehearsal: how much of the text to show at first
  ladder?: Ladder;
  // For a Q&A answer: which of the session's questions (counted from 0)
  questionIndex?: number;
  // Inside today's practice: which step this is (counted from 1), or null
  planStep?: number | null;
}

// One tip for each end of a talk, shown before an openings and closings drill
const BOOKEND_TIPS = {
  // Openings
  opening: "Stand still, breathe in, look up, and only then speak. Start on your first real word, not “so” or “um”.",
  // Closes
  close: "End on your point, say your last line a little slower, then stop. No “so, yeah, that’s it”.",
} as const;

// The rungs of the memory ladder, with their button names
const LADDER_RUNGS: ReadonlyArray<{ ladder: Ladder; name: string }> = [
  // All the words
  { ladder: "full", name: "Full text" },
  // Cue words only
  { ladder: "keywords", name: "Keywords" },
  // Nothing
  { ladder: "none", name: "From memory" },
];

// Where the screen is in the flow
type Stage = "ready" | "mic-primer" | "thinking" | "starting" | "recording" | "saving" | "save-failed" | "nothing-heard" | "too-short" | { problem: RecordingProblem };

// The stage for a browser without speech recognition (one shared value, so it is the same between redraws)
const UNSUPPORTED: Stage = { problem: "speech-unsupported" };

// Plain explanations for each problem
const PROBLEM_TEXT: Record<RecordingProblem, string> = {
  // Microphone refused (the steps to allow it follow on screen)
  "microphone-blocked": "The microphone is blocked for this site, so VoiceLab cannot hear you. To allow it:",
  // No microphone found
  "no-microphone": "No microphone was found. Plug one in or check your sound settings, then try again.",
  // Browser cannot transcribe
  "speech-unsupported": "This browser cannot turn speech into text. Use Chrome, Edge, or Safari.",
  // Speech service unreachable
  "speech-offline": "The browser’s speech service could not be reached. Check your connection, then try again.",
};

// How to allow a blocked microphone, by device
const ALLOW_STEPS: ReadonlyArray<string> = [
  // iPhone and iPad
  "iPhone or iPad (Safari): tap aA in the address bar, then Website Settings, and set Microphone to Allow.",
  // Android
  "Android (Chrome): tap the icon left of the address, then Permissions, and turn on Microphone.",
  // A computer
  "Computer: click the icon at the left of the address bar and allow the microphone.",
];

// Number of bars in the level meter
const METER_BARS = 24;

// Draw the transcript so far, with fillers marked and unsettled words lighter
function LiveWords({ text }: { text: LiveText }) {
  // Settled words with fillers marked, then words still being heard
  return (
    <p className="max-w-[34ch] font-display text-cue">
      {/* Settled words, piece by piece */}
      {markFillers(text.final).map((piece, index) =>
        // Fillers quietly marked, everything else plain
        piece.filler ? <span key={index} className="text-filler underline decoration-dotted underline-offset-4">{piece.text}</span> : <span key={index}>{piece.text}</span>,
      )}
      {/* Words still being worked out, lighter */}
      {text.interim && <span className="text-ink-muted"> {text.interim}</span>}
    </p>
  );
}

// Words for the light of a Table Topic or prepared speech, read out to screen readers and shown beside the lamp (Toastmasters meanings)
function windowSignalText(window: SpeakingWindow): Record<TimeSignal, string> {
  // One phrase per state
  return {
    // Before the minimum
    none: "",
    // From the minimum
    green: "Green: the minimum is met",
    // From the middle
    yellow: "Yellow: start wrapping up",
    // From the top of the window
    red: "Red: finish now",
    // Past the limit
    overtime: `Over ${formatClock(window.limit)}: past the limit`,
  };
}

// Words for the Record Response light, which only turns yellow and red
const RESPONSE_SIGNAL_TEXT: Record<TimeSignal, string> = {
  // Before 2:15
  none: "",
  // Not used by a Record Response
  green: "",
  // From 2:15
  yellow: "Yellow: 45 seconds to the goal",
  // Past 3:00
  red: "Red: past the goal",
  // Not used by a Record Response
  overtime: "",
};

// Fill for the lamp at each state
const SIGNAL_LAMP: Record<TimeSignal, string> = {
  // Off: an empty ring
  none: "border-rule bg-transparent",
  // Green
  green: "border-light-green bg-light-green",
  // Yellow
  yellow: "border-light-yellow bg-light-yellow",
  // Red
  red: "border-light-red bg-light-red",
  // Still red past the limit, with a heavier ring
  overtime: "border-ink bg-light-red",
};

// The timing light: a lamp that changes color as the time goes on (green, yellow, red for a Table Topic; yellow, red for a Record Response)
function TimingLight({ signal, mode }: { signal: TimeSignal; mode: SessionMode }) {
  // The window, for a Table Topic or a prepared speech
  const window = speakingWindow(mode);
  // The words for this kind of session
  const words = window ? windowSignalText(window) : RESPONSE_SIGNAL_TEXT;
  // Lamp plus words, announced politely when they change
  return (
    <p role="status" aria-label="Timing light" data-signal={signal} className="mt-3 flex items-center gap-3">
      {/* The lamp itself (decorative; the words carry the meaning) */}
      <span aria-hidden="true" className={`inline-block size-10 flex-none rounded-full border-2 transition-colors ${SIGNAL_LAMP[signal]}`} />
      {/* What the lamp means */}
      <span className="text-lede italic">{words[signal]}</span>
    </p>
  );
}

// The hints for a Record Response: a simple structure plus this prompt's angles (large while thinking, compact in the margin while speaking)
function Hints({ angles, compact }: { angles: ReadonlyArray<string>; compact: boolean }) {
  // Compact: one line of structure and a short list of angles
  if (compact) {
    // Margin version
    return (
      <div className="mt-6 border-t border-rule pt-3">
        {/* The structure on one line */}
        <p>{STRUCTURE_HINT.map((step) => step.label).join(" · ")}</p>
        {/* The angles */}
        <ul className="mt-3 list-disc space-y-1 pl-4">
          {/* One item per angle */}
          {angles.map((angle) => <li key={angle}>{angle}</li>)}
        </ul>
      </div>
    );
  }
  // Full version: structure and angles side by side on a computer
  return (
    <div className="mt-8 grid max-w-2xl gap-6 text-lede md:grid-cols-2">
      {/* The structure */}
      <div>
        {/* Small heading */}
        <p className="text-footnote italic text-ink-muted">A simple shape</p>
        {/* The steps in order */}
        <ol className="mt-2 space-y-1">
          {/* One step per line */}
          {STRUCTURE_HINT.map((step) => <li key={step.label}><em>{step.label}</em> <span className="text-ink-muted">{step.detail}</span></li>)}
        </ol>
      </div>
      {/* The angles */}
      <div>
        {/* Small heading */}
        <p className="text-footnote italic text-ink-muted">Angles to try</p>
        {/* One per line */}
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {/* One item per angle */}
          {angles.map((angle) => <li key={angle}>{angle}</li>)}
        </ul>
      </div>
    </div>
  );
}

// The text to read, with pause marks as pause signs, *stressed* words in bold and [directions] in quiet italics; while recording, words already read are lit, the next word is marked, and the rest is dimmed
function ScriptText({ tokens, place, className }: { tokens: ReadonlyArray<ReadingToken>; place: number | null; className: string }) {
  // The text's element, for keeping the reader's line in view
  const box = useRef<HTMLParagraphElement>(null);

  // Keep the next word in view as the reader moves down the page
  useEffect(() => {
    // Only while recording
    if (place === null) return;
    // The next word
    const word = box.current?.querySelector(`[data-word="${place}"]`);
    // Nothing to do if it is missing
    if (!word) return;
    // Where it is on screen
    const where = word.getBoundingClientRect();
    // Scroll only when it nears the bottom (where the action bar sits) or has gone above the top
    if (where.bottom > window.innerHeight * 0.6 || where.top < 0) word.scrollIntoView?.({ block: "center", behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [place]);

  // Draw each piece
  return (
    <p ref={box} data-testid="passage" className={className}>
      {/* One element per piece */}
      {tokens.map((token, index) => {
        // A pause mark, as a pause sign in the accent color
        if (token.kind === "pause") return <span key={index} role="img" aria-label="pause here" className="mx-2 text-accent">‖</span>;
        // Where a numbered word stands while recording: read, next, or still ahead
        const status = place === null || token.word === null ? null : token.word < place ? "read" : token.word === place ? "current" : "ahead";
        // Its look: ahead is dimmed, the next word has a soft mark
        const look = status === "ahead" ? "text-ink-muted" : status === "current" ? "bg-accent/15" : "";
        // Shared attributes
        const marks = { "data-read": status ?? undefined, "data-word": token.word ?? undefined, className: look || undefined };
        // Stressed words in bold
        if (token.style === "stress") return <strong key={index} {...marks}>{token.text}</strong>;
        // Directions in quiet italics
        if (token.style === "note") return <em key={index} className="text-ink-muted">{token.text}</em>;
        // Everything else plain
        return <span key={index} {...marks}>{token.text}</span>;
      })}
    </p>
  );
}

// Draw the level meter from recent loudness readings
function Meter({ levels }: { levels: number[] }) {
  // A row of bars; recent loud bars in the accent
  return (
    <div className="flex h-24 items-end gap-1.5" role="img" aria-label="Microphone level">
      {/* One bar per reading, at least a sliver tall */}
      {levels.map((level, index) => (
        // A single bar
        <span key={index} className={`flex-1 ${level > 0.04 ? "bg-accent" : "bg-rule"}`} style={{ height: `${Math.max(6, Math.min(100, level * 300))}%` }} />
      ))}
    </div>
  );
}

// Draw the recording screen
export function RecordingScreen({ promptId, mode, retryOf, services, navigate, repository, clock: givenClock, sectionIndex = null, ladder: startingLadder = "full", questionIndex = 0, planStep = null }: RecordingScreenProps) {
  // Use the given repository, or the browser's
  const [repo] = useState(() => repository ?? browserRepository());
  // Use the given clock, or the real one, kept the same between redraws (a new one each time would restart the effects below)
  const [clock] = useState(() => givenClock ?? (() => new Date()));
  // Whether this browser can turn speech into text (the server cannot tell, so it assumes yes and the browser corrects it)
  const supported = useSyncExternalStore(subscribeToNothing, () => services.speechSupported(), () => true);
  // Where the screen is in the flow
  const [flowStage, setStage] = useState<Stage>("ready");
  // Whether to explain the microphone before the browser's own question (worked out once the browser can say)
  const [needsPrimer, setNeedsPrimer] = useState(false);
  // What to do once the microphone is allowed from the explanation
  const afterPrimer = useRef<(() => void) | null>(null);
  // An unsupported browser always shows that problem
  const stage: Stage = supported ? flowStage : UNSUPPORTED;
  // Words heard so far
  const [text, setText] = useState<LiveText>({ final: "", interim: "" });
  // Seconds elapsed
  const [elapsed, setElapsed] = useState(0);
  // Recent loudness readings for the meter
  const [levels, setLevels] = useState<number[]>(() => Array(METER_BARS).fill(0));
  // On a retry, the cue from last time's feedback
  const [retryCue, setRetryCue] = useState<string | null>(null);
  // On a retry, what the user wrote they would change last time
  const [ownNote, setOwnNote] = useState<string | null>(null);
  // The live transcriber, audio capture, start time, and timer, kept between renders
  const live = useRef<{ transcriber: LiveTranscriber; capture: AudioCapture; startedAt: Date; timer: ReturnType<typeof setInterval>; readings: number[]; spokenTimes: number[]; scriptTimes: (number | null)[] } | null>(null);
  // Inside today's practice, how many steps it has (loaded below)
  const [planTotal, setPlanTotal] = useState<number | null>(null);
  // While reading, the number of the next word to read (every word before it is lit up)
  const [place, setPlace] = useState(0);
  // Guards against stopping twice (a click and the auto-stop at once)
  const stopping = useRef(false);
  // Seconds between seeing the prompt and recording for this kind of session
  const think = thinkSeconds(mode);
  // Seconds of thinking time (or countdown) left
  const [thinkLeft, setThinkLeft] = useState(think);
  // The thinking countdown's timer, kept between renders
  const thinkTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // The browser's reason when saving failed, shown so the problem can be pinned down
  const [saveError, setSaveError] = useState("");

  // For a Q&A answer, the question (loaded from the session it belongs to, below)
  const [qaQuestion, setQaQuestion] = useState<string | null>(null);
  // The prompt to speak to (for reading aloud, its title; for a Q&A answer, the question)
  const prompt = mode === "qa" ? (qaQuestion ? { id: promptId, text: qaQuestion } : undefined) : findPrompt(promptId);
  // The passage, when reading aloud or doing a pause drill
  const passage = mode === "read" || mode === "pause" ? findReading(promptId) : undefined;
  // The user's own talk, when rehearsing (loaded from storage below)
  const [talk, setTalk] = useState<TalkRecord | null>(null);
  // How much of the rehearsal text shows: all of it, cue words, or nothing
  const [ladder, setLadder] = useState<Ladder>(startingLadder);
  // Whether the text is hidden, to practise from memory
  const textHidden = mode === "rehearse" && ladder === "none";
  // The talk's sections
  const sections = talk ? talkSections(talk.body) : [];
  // The section being rehearsed, if it exists in the talk
  const section = sectionIndex !== null && sectionIndex >= 0 && sectionIndex < sections.length ? sectionIndex : null;
  // The rehearsal's text: one section, or the whole talk, at the chosen rung
  const talkText = talk ? memoryLadder(section !== null ? (sections[section] ?? "") : talk.body, ladder) : "";
  // The lesson, on the skill path
  const lesson = mode === "lesson" ? findLesson(promptId) : undefined;
  // The openings and closings drill prompt, with which end of a talk it practises
  const bookend = mode === "bookend" ? BOOKENDS.find((item) => item.id === promptId) : undefined;
  // The text on screen: a passage, a lesson's practice text, or the talk being rehearsed
  const script = passage ? { title: passage.title, source: passage.source, body: passage.body } : lesson ? { title: `Lesson ${lesson.number}: ${lesson.title}`, source: "", body: lesson.body } : talk ? { title: talk.title, source: section !== null ? `Your talk · section ${section + 1} of ${sections.length}` : "Your talk", body: talkText } : null;
  // The text on screen as pieces that can be lit up, and the words to listen for
  const scriptBody = script?.body ?? null;
  // The pieces (the compiler keeps them until the text changes)
  const tokens = scriptBody === null ? [] : readingTokens(scriptBody);
  // The words to listen for, kept current for the recording to read when it starts
  const wordsToHear = useRef<string[]>([]);
  // The whole text being read, for counting fillers against it (a rehearsal counts against the full talk or section, whatever the memory rung)
  const fullText = talk ? (section !== null ? (sections[section] ?? "") : talk.body) : scriptBody;
  // Kept current for saving
  const textForFillers = useRef<string | null>(null);
  // Update both when the text changes
  useEffect(() => {
    // The numbered words of the text, or none
    wordsToHear.current = scriptBody === null ? [] : scriptWords(readingTokens(scriptBody));
    // The full text, or none
    textForFillers.current = fullText;
  }, [scriptBody, fullText]);
  // A rehearsal's own goal in seconds, if it has one (whole-talk runs only)
  const goalSeconds = talk?.goalMinutes && section === null ? talk.goalMinutes * 60 : undefined;

  // For a Q&A answer, load the question from the session it belongs to
  useEffect(() => {
    // Only for Q&A answers
    if (mode !== "qa") return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Read the session
    repo.getSession(promptId).then((source) => {
      // Show the question if still open
      if (!cancelled) setQaQuestion(source?.questions?.[questionIndex] ?? null);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [mode, promptId, questionIndex, repo]);

  // When rehearsing, load the talk
  useEffect(() => {
    // Only for rehearsals
    if (mode !== "rehearse") return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Read the talk
    repo.getTalk(promptId).then((loaded) => {
      // Show it if still open
      if (!cancelled) setTalk(loaded ?? null);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [mode, promptId, repo]);
  // Target and limit for this kind of session
  const target = targetSeconds(mode);
  // The limit
  const limit = maxSeconds(mode);

  // On a retry, load last time's cue
  useEffect(() => {
    // Nothing to load for a first try
    if (!retryOf) return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Read the first try
    repo.getSession(retryOf).then((original) => {
      // Stop if the screen closed
      if (cancelled) return;
      // Keep its cue
      setRetryCue(original?.feedback?.retryCue ?? null);
      // And the user's own note, if they wrote one
      setOwnNote(original?.selfReview?.change || null);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, retryOf]);

  // Inside today's practice, load the plan to say how many steps it has
  useEffect(() => {
    // Only inside the plan
    if (!planStep) return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Load it
    loadDailyPlan(repo, clock()).then((plan) => {
      // Keep the count if still open
      if (!cancelled) setPlanTotal(plan.steps.length);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, clock, planStep]);

  // Stop the timer and every recording piece, handing back the transcript, audio, and length
  const finishCapture = useCallback(async () => {
    // Nothing to stop if not recording
    const current = live.current;
    // Leave if nothing is running
    if (!current) return null;
    // Forget it, so nothing stops twice
    live.current = null;
    // Stop the timer
    clearInterval(current.timer);
    // Work out the length, capped at the limit
    const durationSec = Math.min(limit, Math.round((clock().getTime() - current.startedAt.getTime()) / 1000));
    // Stop transcribing and recording together
    const [transcript, audio] = await Promise.all([current.transcriber.stop(), current.capture.stop()]);
    // One time per word of the final transcript: the noted times, filled with the end time where the final words ran past them
    const spokenTimes = stampSpoken(current.spokenTimes, transcript.split(/\s+/).filter((word) => word !== "").length, durationSec).slice(0, transcript.split(/\s+/).filter((word) => word !== "").length);
    // Hand back the results, with the loudness readings for finding pauses and the word times
    return { transcript, audio, durationSec, loudness: current.readings, spokenTimes, scriptTimes: current.scriptTimes.length > 0 ? current.scriptTimes : null };
  }, [clock, limit]);

  // Stop recording, then save the session and open it (or explain that nothing was heard)
  const stop = useCallback(async () => {
    // Only stop once
    if (stopping.current) return;
    // Mark as stopping
    stopping.current = true;
    // Show that saving is under way
    setStage("saving");
    // Any step below can fail (the browser database can refuse a write), so never leave the screen on "Saving…"
    try {
      // Stop everything
      const result = await finishCapture();
      // Nothing was running (it was already stopped elsewhere): back to the start
      if (!result) {
        // Allow another attempt
        stopping.current = false;
        // Offer a fresh start
        setStage("ready");
        // Done
        return;
      }
      // Too short to measure: save nothing and explain
      if (result.durationSec < MIN_SECONDS) {
        // Allow another attempt
        stopping.current = false;
        // Explain
        setStage("too-short");
        // Done
        return;
      }
      // No words heard: save nothing and explain
      if (!result.transcript.trim()) {
        // Allow another attempt
        stopping.current = false;
        // Explain
        setStage("nothing-heard");
        // Done
        return;
      }
      // Save the session with its audio
      const session = await saveRecording(repo, { id: crypto.randomUUID(), transcript: result.transcript, durationSec: result.durationSec, audio: result.audio, promptId, mode, retryOf, loudness: result.loudness, spokenTimes: result.spokenTimes, ...(textForFillers.current !== null ? { script: textForFillers.current } : {}), ...(result.scriptTimes ? { scriptTimes: result.scriptTimes } : {}), ...(mode === "rehearse" ? { sectionIndex: section } : {}), ...(mode === "qa" && qaQuestion ? { question: qaQuestion } : {}) }, clock());
      // Open the new session's page (feedback is requested there)
      navigate(`/sessions?id=${session.id}${planStep ? `&plan=${planStep}` : ""}`);
    } catch (error) {
      // Keep the details in the browser console for debugging
      console.error("Saving the recording failed", error);
      // Allow another attempt
      stopping.current = false;
      // Keep the browser's reason to show
      setSaveError(error instanceof Error ? error.message : String(error));
      // Explain
      setStage("save-failed");
    }
  }, [clock, finishCapture, mode, navigate, planStep, promptId, qaQuestion, repo, retryOf, section]);

  // Stop because of a problem, saving nothing
  const fail = useCallback(
    async (problem: RecordingProblem) => {
      // Stop everything without saving
      await finishCapture();
      // Explain
      setStage({ problem });
    },
    [finishCapture],
  );

  // Stop the thinking countdown, if one is running
  const endThinking = useCallback(() => {
    // Clear the timer
    if (thinkTimer.current) clearInterval(thinkTimer.current);
    // Forget it
    thinkTimer.current = null;
  }, []);

  // Ask for the microphone and start recording
  const start = useCallback(async () => {
    // Thinking time is over
    endThinking();
    // Show that the microphone is being requested
    setStage("starting");
    // Clear any earlier attempt
    setText({ final: "", interim: "" });
    // Back to the first word
    setPlace(0);
    // Reset the timer display
    setElapsed(0);
    // Reset the stop guard
    stopping.current = false;
    // Ask for the microphone
    let stream: MediaStream;
    // The browser may refuse
    try {
      // Request access
      stream = await services.openMicrophone();
    } catch (error) {
      // A missing microphone, or a refusal
      setStage({ problem: (error as DOMException).name === "NotFoundError" ? "no-microphone" : "microphone-blocked" });
      // Stop here
      return;
    }
    // Start recording audio
    const capture = services.createCapture(stream);
    // Start live transcription
    const transcriber = services.createTranscriber();
    // Note the start time
    const startedAt = clock();
    // Update the timer and meter, and stop at the limit
    // Loudness readings for the whole recording, kept for finding pauses afterwards
    const readings: number[] = [];
    // Tick
    const timer = setInterval(() => {
      // Seconds since starting
      const seconds = (clock().getTime() - startedAt.getTime()) / 1000;
      // Show the time
      setElapsed(seconds);
      // Read the loudness once
      const level = capture.level();
      // Keep it
      readings.push(level);
      // Add it to the meter, dropping the oldest
      setLevels((previous) => [...previous.slice(1), level]);
      // Stop by itself at the limit
      if (seconds >= limit) void stop();
    }, LOUDNESS_TICK_MS);
    // The words to listen for in the text on screen (none without text)
    const expected = wordsToHear.current;
    // Keep the running pieces, with no word times yet
    const pieces = { transcriber, capture, startedAt, timer, readings, spokenTimes: [] as number[], scriptTimes: expected.map((): number | null => null) };
    // Keep them between renders
    live.current = pieces;
    // Each time words arrive: show them, note when each was first heard, and move the place in the text
    const heardWords = (latest: LiveText) => {
      // Show them
      setText(latest);
      // Seconds since starting
      const seconds = (clock().getTime() - startedAt.getTime()) / 1000;
      // Everything heard so far
      const heard = `${latest.final} ${latest.interim}`;
      // Note the new word positions
      pieces.spokenTimes = stampSpoken(pieces.spokenTimes, heard.split(/\s+/).filter((word) => word !== "").length, seconds);
      // Nothing more without text on screen
      if (expected.length === 0) return;
      // Follow the reader through the text
      const follow = followReading(expected, heard);
      // Note when each word was first read
      pieces.scriptTimes = stampFirstRead(pieces.scriptTimes, follow.read, seconds);
      // Move the place forward, never back
      setPlace((previous) => Math.max(previous, follow.next));
    };
    // Begin transcribing, showing words and handling problems
    transcriber.start(heardWords, (problem) => void fail(problem));
    // Now recording
    setStage("recording");
  }, [clock, endThinking, fail, limit, services, stop]);

  // Before a Table Topic or Record Response: count down, then start recording by itself
  const beginThinking = useCallback(() => {
    // Clear any earlier countdown
    endThinking();
    // Note when thinking began
    const startedAt = clock();
    // Show the full time
    setThinkLeft(think);
    // Show the thinking stage
    setStage("thinking");
    // Count down
    thinkTimer.current = setInterval(() => {
      // Seconds left
      const left = think - (clock().getTime() - startedAt.getTime()) / 1000;
      // Show them, never below zero
      setThinkLeft(Math.max(0, left));
      // Time is up: start speaking
      if (left <= 0) void start();
    }, LOUDNESS_TICK_MS);
  }, [clock, endThinking, start, think]);

  // Stop everything without saving and go home
  const discard = useCallback(async () => {
    // Stop any thinking countdown
    endThinking();
    // Stop without saving
    stopping.current = true;
    // Stop everything
    await finishCapture();
    // Go home
    navigate("/");
  }, [endThinking, finishCapture, navigate]);

  // Before the first ever recording, find out whether the browser will ask for the microphone
  useEffect(() => {
    // Nothing to check, or already explained in this browser
    if (!services.micPermission || readMicExplained()) return;
    // Ignore the answer if the screen closes first
    let cancelled = false;
    // Ask the browser without prompting
    void services.micPermission().then((permission) => {
      // Explain first only when the browser is about to ask (or cannot say)
      if (!cancelled && (permission === "prompt" || permission === "unknown")) setNeedsPrimer(true);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [services]);

  // Start this kind of session: the countdown or thinking time if it has one, otherwise recording; the explanation first if needed
  const begin = useCallback(() => {
    // The start itself
    const go = think > 0 ? beginThinking : () => void start();
    // The first ever recording: explain the microphone, and start once it is allowed
    if (needsPrimer) {
      // Remember the start for afterwards
      afterPrimer.current = go;
      // Show the explanation
      setStage("mic-primer");
      // Stop here
      return;
    }
    // Otherwise start now
    go();
  }, [beginThinking, needsPrimer, start, think]);

  // From the explanation: let the browser ask now, then start
  const allowMicrophone = useCallback(async () => {
    // Explained: never again in this browser
    markMicExplained();
    // Not needed again on this screen
    setNeedsPrimer(false);
    // Show that the browser is asking
    setStage("starting");
    // Ask for the microphone now, so the browser's question follows the explanation straight away
    try {
      // Request access
      const stream = await services.openMicrophone();
      // Let it go again; recording opens it afresh
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      // A missing microphone, or a refusal
      setStage({ problem: (error as DOMException).name === "NotFoundError" ? "no-microphone" : "microphone-blocked" });
      // Stop here
      return;
    }
    // The start that was waiting
    const go = afterPrimer.current;
    // Forget it
    afterPrimer.current = null;
    // Back to the start
    setStage("ready");
    // Start
    go?.();
  }, [services]);

  // Space starts and stops; Escape discards (on a computer)
  useEffect(() => {
    // Handle a key press
    const onKey = (event: KeyboardEvent) => {
      // Leave keys alone while typing or when a button has focus (it handles its own space)
      if (event.target instanceof HTMLElement && event.target.closest("button, input, textarea, select, a")) return;
      // Space: start when ready, stop when recording
      if (event.key === " ") {
        // Stop the page from scrolling
        event.preventDefault();
        // Start or stop
        if (stage === "ready" || stage === "nothing-heard" || stage === "too-short" || stage === "save-failed") begin();
        // While thinking about a Record Response, start early (a Table Topic's countdown cannot be skipped)
        else if (stage === "thinking" && mode === "response") void start();
        else if (stage === "recording") void stop();
      }
      // Escape while thinking or recording: discard
      if (event.key === "Escape" && (stage === "recording" || stage === "thinking")) void discard();
    };
    // Listen for key presses
    window.addEventListener("keydown", onKey);
    // Stop listening when the screen changes
    return () => window.removeEventListener("keydown", onKey);
  }, [begin, discard, mode, stage, start, stop]);

  // The latest stop-everything function, for the cleanup below
  const finishLatest = useRef(finishCapture);
  // Keep it current after each redraw
  useEffect(() => {
    // Point at the newest version
    finishLatest.current = finishCapture;
  }, [finishCapture]);
  // Release the microphone only when the screen actually closes mid-recording
  useEffect(() => () => void finishLatest.current(), []);
  // Stop the thinking countdown when the screen closes
  useEffect(() => endThinking, [endThinking]);

  // Whether recording is under way
  const recording = stage === "recording";
  // The problem to explain, if any
  const problem = typeof stage === "object" ? stage.problem : null;
  // Length wording for this kind of session
  const lengthText = goalSeconds ? `a ${formatClock(goalSeconds)} goal` : script ? `about ${Math.max(1, Math.round(readingSeconds(script.body) / 60))} min` : mode === "warmup" ? `${target} seconds` : speakingWindow(mode) ? `${formatClock(speakingWindow(mode)!.start)} to ${formatClock(speakingWindow(mode)!.end)}` : mode === "bookend" || mode === "qa" ? `a ${formatClock(target)} goal` : "about a minute";
  // Whether the thinking countdown is showing
  const thinking = stage === "thinking";
  // How this kind of session works, from the catalogue
  const howItWorks = modeForSession(mode);
  // The page title for this kind of session
  const title = retryOf ? "Second try" : mode === "warmup" ? "Warm-up" : mode === "talk" ? "Table Topic" : mode === "response" ? "Prepared speech" : mode === "read" ? "Read aloud" : mode === "pause" ? "Pause drill" : mode === "rehearse" ? "Rehearsal" : mode === "lesson" ? "Lesson" : bookend ? (bookend.part === "opening" ? "Opening drill" : "Closing drill") : mode === "qa" ? "Q&A answer" : "Recording";
  // The keyboard hint for this stage
  const hint = recording ? "space to stop · esc to discard" : thinking ? (mode === "talk" ? "esc to leave" : "space to start speaking · esc to leave") : mode === "talk" ? "space to see your topic" : mode === "response" ? "space to start thinking" : mode === "rehearse" ? "space to start rehearsing" : passage || lesson ? "space to start reading" : "space to start";
  // A Table Topic keeps its question hidden until the countdown begins (and while recording it sits in the margin)
  const showPrompt = !recording && !!prompt && !script && (mode !== "talk" || thinking);
  // A Table Topic's briefing, shown before the question
  const showBriefing = mode === "talk" && (stage === "ready" || stage === "nothing-heard" || stage === "too-short" || stage === "save-failed");
  // This prompt's angles, for a Record Response
  const angles = mode === "response" ? (prompt?.angles ?? []) : [];

  // Before the first ever recording: what the microphone is for, before the browser asks
  if (stage === "mic-primer") {
    // Draw the explanation on its own
    return (
      <main className="mx-auto flex min-h-dvh max-w-6xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
        {/* Navigation, title, no keyboard hint */}
        <Masthead title={title}>{""}</Masthead>
        {/* The explanation */}
        <section aria-label="Your microphone" className="flex flex-1 flex-col md:max-w-2xl md:pt-8">
          {/* What it is for */}
          <h1 className="mt-8 font-display text-statement tracking-tight md:mt-0">VoiceLab listens through your microphone.</h1>
          {/* Where recordings go */}
          <p className="mt-4 max-w-[48ch] text-lede">Your recordings stay on this device. Your browser will ask next: choose Allow.</p>
          {/* Back without asking (just under the words, so the action band never covers it) */}
          <p className="mt-4">
            <button type="button" onClick={() => setStage("ready")} className="inline-flex min-h-11 items-center italic text-ink-muted underline underline-offset-4">Not now</button>
          </p>
          {/* Let the browser ask */}
          <ActionButton action="Allow microphone" aside="your browser asks next" onClick={() => void allowMicrophone()} />
        </section>
      </main>
    );
  }

  // Draw the page
  return (
    // One column on a phone, margin plus main column on a computer
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
      {/* Navigation (hidden while recording), title and keyboard hint */}
      <Masthead title={title} nav={!(recording || thinking || stage === "starting" || stage === "saving")}>{hint}</Masthead>
      {/* Inside today's practice, which step this is */}
      {planStep && <p className="mt-3 text-footnote italic text-accent">Today’s practice · step {planStep}{planTotal ? ` of ${planTotal}` : ""}</p>}

      {/* Margin and main column on a computer */}
      <div className="flex flex-1 flex-col md:grid md:grid-cols-[240px_1fr] md:gap-14 md:pt-8">
        {/* Margin: time, length, prompt reminder, discard */}
        <aside className="mt-5 flex flex-col text-footnote text-ink-muted md:mt-0">
          {/* The clock, large */}
          <p className={`font-display text-ink tabular-nums ${recording || thinking ? "text-prompt-xl" : "text-statement"}`}>{formatClock(thinking ? Math.ceil(thinkLeft) : elapsed)}</p>
          {/* While recording: a plain, pulsing marker that says so */}
          {recording && (
            <p role="status" aria-label="Recording" className="mt-2 flex items-center gap-2 text-ink">
              {/* The red dot (pulses only when motion is welcome) */}
              <span aria-hidden="true" className="inline-block size-3 rounded-full bg-light-red motion-safe:animate-pulse" />
              {/* The word */}
              Recording
            </p>
          )}
          {/* The length to aim for, or what the countdown is for */}
          <p className="mt-1">{thinking ? (mode === "talk" ? "until you start" : "to think") : mode === "talk" ? `aim for ${lengthText}` : `of ${lengthText}`}</p>
          {/* During a Table Topic or Record Response, the timing light */}
          {recording && (mode === "talk" || mode === "response" || mode === "bookend" || mode === "qa" || (mode === "rehearse" && goalSeconds)) && <TimingLight signal={timeSignal(mode, elapsed, goalSeconds)} mode={mode} />}
          {/* Prompt reminder while recording */}
          {recording && prompt && <p className="mt-6 border-t border-rule pt-3 italic">{prompt.text}</p>}
          {/* A lesson keeps its tip in view while speaking */}
          {recording && lesson && <p className="mt-6 border-t border-rule pt-3">{lesson.tip}</p>}
          {/* A Record Response keeps its hints in view while speaking */}
          {recording && angles.length > 0 && <Hints angles={angles} compact />}
          {/* Push discard down */}
          <div className="hidden flex-1 md:block" />
          {/* Discard while recording */}
          {(recording || thinking) && (
            <button type="button" onClick={() => void discard()} className="mt-4 self-start inline-flex min-h-11 items-center italic underline underline-offset-4 md:mb-10">
              {thinking ? "or leave without speaking" : "or discard this one without saving"}
            </button>
          )}
        </aside>

        {/* Main column */}
        <div className="flex flex-1 flex-col">
          {/* A problem, explained plainly (first in the column, so a phone shows it above any text to read) */}
          {problem && <p role="alert" className="mt-6 max-w-[48ch] text-lede md:mt-0">{PROBLEM_TEXT[problem]}</p>}
          {/* A blocked microphone: how to allow it on each kind of device, then try again */}
          {problem === "microphone-blocked" && (
            <>
              {/* The steps */}
              <ul aria-label="How to allow the microphone" className="mt-3 max-w-[52ch] list-disc space-y-2 pl-5 text-lede">
                {/* One per device */}
                {ALLOW_STEPS.map((step) => <li key={step}>{step}</li>)}
              </ul>
              {/* Then */}
              <p className="mt-3 max-w-[52ch] text-lede">Then press Try again.</p>
            </>
          )}
          {/* Before a Table Topic: the briefing instead of the question */}
          {showBriefing && (
            <>
              {/* The headline */}
              <h1 className="mt-8 font-display text-prompt tracking-tight md:mt-0 md:max-w-[18ch]">There is very little waiting time.</h1>
              {/* How it works */}
              <p className="mt-5 max-w-[48ch] text-lede">In Table Topics you hear the question and start almost straight away. Press the button to see yours: you get {think} seconds, then recording starts by itself. Speak for 1 to 2 minutes; the light turns green at 1:00, yellow at 1:30, and red at 2:00.</p>
            </>
          )}
          {/* Reading aloud, a lesson, or a rehearsal: the title (and source or tip) before starting, and the text throughout */}
          {script && (
            <>
              {/* Title and source, before starting */}
              {!recording && <h1 className="mt-8 font-display text-statement tracking-tight md:mt-0">{script.title}</h1>}
              {/* Who said it, or that it is a practice passage */}
              {!recording && script.source && <p className="mt-1 italic text-ink-muted">{script.source}</p>}
              {/* A lesson's tip, before starting */}
              {!recording && lesson && (
                <div className="mt-5 max-w-[52ch] border-l-2 border-accent pl-4">
                  {/* Small heading */}
                  <p className="text-footnote italic text-ink-muted">The tip</p>
                  {/* The tip itself */}
                  <p className="mt-1 text-lede">{lesson.tip}</p>
                </div>
              )}
              {/* When rehearsing, the memory ladder: full text, cue words, or nothing */}
              {mode === "rehearse" && (
                <div role="group" aria-label="How much text to show" className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                  {/* One button per rung */}
                  {LADDER_RUNGS.map((rung) => (
                    // The current rung is plain; the others are links-style buttons
                    <button key={rung.ladder} type="button" aria-pressed={ladder === rung.ladder} onClick={() => setLadder(rung.ladder)} className={ladder === rung.ladder ? "text-ink" : "italic text-ink-muted underline underline-offset-4"}>
                      {rung.name}
                    </button>
                  ))}
                </div>
              )}
              {/* For a pause drill, how it works */}
              {!recording && mode === "pause" && <p className="mt-4 max-w-[52ch] text-lede">Read the passage aloud and pause for about a second at each ‖. Take your time.</p>}
              {/* The words to read, large enough to read from a distance, unless hidden to practise from memory */}
              {!textHidden && (
<ScriptText tokens={tokens} place={recording ? place : null} className={`${recording ? "mt-8" : "mt-6"} max-w-[52ch] whitespace-pre-line font-display text-cue leading-relaxed`} />
              )}
            </>
          )}
          {/* Before recording: the prompt and, on a retry, last time's cue */}
          {showPrompt && prompt && (
            <h1 className="relative mt-8 font-display text-prompt tracking-tight before:absolute before:-left-[0.42em] before:text-accent before:content-['“'] md:mt-0 md:max-w-[16ch] md:text-prompt-xl">
              {prompt.text}
            </h1>
          )}
          {/* An openings and closings drill: one tip for that end of a talk */}
          {showPrompt && bookend && <p className="mt-5 max-w-[52ch] border-l-2 border-accent pl-4 text-lede">{BOOKEND_TIPS[bookend.part]}</p>}
          {/* Thinking about a Record Response: the hints */}
          {thinking && angles.length > 0 && <Hints angles={angles} compact={false} />}
          {/* On a retry, the cue to carry in */}
          {!recording && (retryCue || ownNote) && (
            <div className="mt-6 max-w-md border-y border-ink py-4">
              {/* Small heading */}
              <p className="text-footnote italic text-ink-muted">Before you start</p>
              {/* The user's own note first, in their words */}
              {ownNote && <p className="mt-1 font-display text-cue">{ownNote}</p>}
              {/* The coach's cue, under it when both exist */}
              {retryCue && <p className={ownNote ? "mt-2 text-lede text-ink-muted" : "mt-1 font-display text-cue"}>{ownNote ? `Coach: ${retryCue}` : retryCue}</p>}
            </div>
          )}

          {/* While recording: the meter and the words */}
          {recording && (
            <>
              {/* Live level meter */}
              <Meter levels={levels} />
              {/* Words so far (not while reading: the text itself is on screen) */}
              {(!script || textHidden) && <div className="mt-8"><LiveWords text={text} /></div>}
            </>
          )}

          {/* Nothing heard */}
          {stage === "nothing-heard" && <p role="alert" className="mt-6 max-w-[48ch] text-lede">I did not catch any words. Check that the right microphone is selected, then try again.</p>}
          {/* Too short */}
          {stage === "too-short" && <p role="alert" className="mt-6 max-w-[48ch] text-lede">That was under {MIN_SECONDS} seconds, too short to measure, so it was not saved. Take your time and keep going a little longer.</p>}

          {/* Saving failed */}
          {stage === "save-failed" && <p role="alert" className="mt-6 max-w-[48ch] text-lede">This recording could not be saved. The browser said: “{saveError}” Try again; if it keeps happening, check that this site may store data on this device.</p>}
          {/* Before starting: how this kind of session works and what comes afterwards (after the task, so a phone shows the task first) */}
          {howItWorks && !(recording || thinking || stage === "starting" || stage === "saving") && (
            <div role="note" aria-label="How this works" className="mt-8 max-w-[52ch] border-t border-rule pt-3 text-footnote text-ink-muted">
              {/* Small heading */}
              <p className="italic">How this works</p>
              {/* What you do */}
              <p className="mt-1 text-ink">{howItWorks.youDo}</p>
              {/* What you get */}
              <p className="mt-1">Afterwards: {howItWorks.youGet.charAt(0).toLowerCase() + howItWorks.youGet.slice(1)}</p>
            </div>
          )}
          {/* Push the footer down */}
          <div className="flex-1" />

          {/* Before starting: where the words go */}
          {(stage === "ready" || stage === "nothing-heard" || stage === "too-short") && (
            <Footnote>
              <span>Your words are turned into text by your browser’s speech service (Google in Chrome, Apple in Safari). The recording itself stays on this device.</span>
            </Footnote>
          )}
          {/* A way home when stuck on a problem */}
          {problem && (
            <Footnote>
              <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">Back to Today</Link>
            </Footnote>
          )}

          {/* The one action for this stage */}
          {(stage === "ready" || stage === "nothing-heard" || stage === "too-short" || stage === "save-failed" || (problem && problem !== "speech-unsupported")) && (
            mode === "talk" ? (
              <ActionButton action={problem || stage === "nothing-heard" || stage === "too-short" || stage === "save-failed" ? "Try again" : "Show my topic"} aside={`${think} seconds to start`} onClick={begin} />
            ) : mode === "response" ? (
              <ActionButton action={problem || stage === "nothing-heard" || stage === "too-short" || stage === "save-failed" ? "Try again" : "Start thinking"} aside={`${think / 60} minutes to prepare`} onClick={begin} />
            ) : (
              <ActionButton action={problem || stage === "nothing-heard" || stage === "too-short" || stage === "save-failed" ? "Try again" : mode === "rehearse" ? "Start rehearsing" : passage || lesson ? "Start reading" : "Start speaking"} aside={lengthText} onClick={begin} />
            )
          )}
          {/* Thinking about a Record Response: start speaking early */}
          {thinking && mode === "response" && <ActionButton action="Ready" aside="start speaking" onClick={() => void start()} />}
          {/* A Table Topic's countdown: no early start, just the time left */}
          {thinking && mode === "talk" && <ActionButton action="Get ready" aside={`starting in ${Math.ceil(thinkLeft)}`} onClick={() => {}} disabled />}
          {/* Waiting for the microphone */}
          {stage === "starting" && <ActionButton action="Starting…" aside="allow the microphone" onClick={() => {}} disabled />}
          {/* Recording */}
          {recording && <ActionButton action="Stop" aside={formatClock(elapsed)} onClick={() => void stop()} variant="stop" />}
          {/* Saving */}
          {stage === "saving" && <ActionButton action="Saving…" aside="one moment" onClick={() => {}} disabled />}
        </div>
      </div>
    </main>
  );
}
