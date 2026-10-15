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
import { STRUCTURE_HINT, findPassage, findPrompt } from "@/content/prompts";
// Load the filler marker
import { markFillers } from "@/core/fillers";
// Load the recording length rules
import { LOUDNESS_TICK_MS, MIN_SECONDS, TOPIC_WINDOW_START, formatClock, maxSeconds, readingSeconds, targetSeconds, thinkSeconds, timeSignal, type TimeSignal } from "@/core/recordingRules";
// Load the shared browser repository
import { browserRepository } from "@/data/browserRepository";
// Load the record and repository types
import type { SessionMode, TalkRecord } from "@/data/records";
import type { Repository } from "@/data/repository";
// Load the recording saver
import { saveRecording } from "@/data/saveRecording";

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
}

// Where the screen is in the flow
type Stage = "ready" | "thinking" | "starting" | "recording" | "saving" | "save-failed" | "nothing-heard" | "too-short" | { problem: RecordingProblem };

// The stage for a browser without speech recognition (one shared value, so it is the same between redraws)
const UNSUPPORTED: Stage = { problem: "speech-unsupported" };

// Plain explanations for each problem
const PROBLEM_TEXT: Record<RecordingProblem, string> = {
  // Microphone refused
  "microphone-blocked": "The microphone is blocked. Allow it for this site in your browser’s address bar, then try again.",
  // No microphone found
  "no-microphone": "No microphone was found. Plug one in or check your sound settings, then try again.",
  // Browser cannot transcribe
  "speech-unsupported": "This browser cannot turn speech into text. Use Chrome, Edge, or Safari.",
  // Speech service unreachable
  "speech-offline": "The browser’s speech service could not be reached. Check your connection, then try again.",
};

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

// Words for the Table Topic light, read out to screen readers and shown beside the lamp (Toastmasters meanings)
const TOPIC_SIGNAL_TEXT: Record<TimeSignal, string> = {
  // Before 1:00
  none: "",
  // From 1:00
  green: "Green: the minimum is met",
  // From 1:30
  yellow: "Yellow: start wrapping up",
  // From 2:00
  red: "Red: finish now",
  // Past 2:30
  overtime: "Over 2:30: past the limit",
};

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
  // The words for this kind of session
  const words = mode === "talk" ? TOPIC_SIGNAL_TEXT : RESPONSE_SIGNAL_TEXT;
  // Lamp plus words, announced politely when they change
  return (
    <p role="status" aria-label="Timing light" data-signal={signal} className="mt-3 flex items-center gap-3">
      {/* The lamp itself (decorative; the words carry the meaning) */}
      <span aria-hidden="true" className={`inline-block size-6 flex-none rounded-full border-2 transition-colors ${SIGNAL_LAMP[signal]}`} />
      {/* What the lamp means */}
      <span className="italic">{words[signal]}</span>
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

// Draw the level meter from recent loudness readings
function Meter({ levels }: { levels: number[] }) {
  // A row of bars; recent loud bars in the accent
  return (
    <div className="flex h-14 items-end gap-1.5" role="img" aria-label="Microphone level">
      {/* One bar per reading, at least a sliver tall */}
      {levels.map((level, index) => (
        // A single bar
        <span key={index} className={`flex-1 ${level > 0.04 ? "bg-accent" : "bg-rule"}`} style={{ height: `${Math.max(6, Math.min(100, level * 300))}%` }} />
      ))}
    </div>
  );
}

// Draw the recording screen
export function RecordingScreen({ promptId, mode, retryOf, services, navigate, repository, clock: givenClock }: RecordingScreenProps) {
  // Use the given repository, or the browser's
  const [repo] = useState(() => repository ?? browserRepository());
  // Use the given clock, or the real one, kept the same between redraws (a new one each time would restart the effects below)
  const [clock] = useState(() => givenClock ?? (() => new Date()));
  // Whether this browser can turn speech into text (the server cannot tell, so it assumes yes and the browser corrects it)
  const supported = useSyncExternalStore(subscribeToNothing, () => services.speechSupported(), () => true);
  // Where the screen is in the flow
  const [flowStage, setStage] = useState<Stage>("ready");
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
  // The live transcriber, audio capture, start time, and timer, kept between renders
  const live = useRef<{ transcriber: LiveTranscriber; capture: AudioCapture; startedAt: Date; timer: ReturnType<typeof setInterval>; readings: number[] } | null>(null);
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

  // The prompt to speak to (for reading aloud, its title)
  const prompt = findPrompt(promptId);
  // The passage, when reading aloud or doing a pause drill
  const passage = mode === "read" || mode === "pause" ? findPassage(promptId) : undefined;
  // The user's own talk, when rehearsing (loaded from storage below)
  const [talk, setTalk] = useState<TalkRecord | null>(null);
  // Whether the rehearsal text is hidden, to practise from memory
  const [textHidden, setTextHidden] = useState(false);
  // The text on screen: a passage, or the talk being rehearsed
  const script = passage ? { title: passage.title, source: passage.source, body: passage.body } : talk ? { title: talk.title, source: "Your talk", body: talk.body } : null;
  // A rehearsal's own goal in seconds, if it has one
  const goalSeconds = talk?.goalMinutes ? talk.goalMinutes * 60 : undefined;

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
      // Keep its cue if the screen is still open
      if (!cancelled) setRetryCue(original?.feedback?.retryCue ?? null);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, retryOf]);

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
    // Hand back the results, with the loudness readings for finding pauses
    return { transcript, audio, durationSec, loudness: current.readings };
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
      const session = await saveRecording(repo, { id: crypto.randomUUID(), transcript: result.transcript, durationSec: result.durationSec, audio: result.audio, promptId, mode, retryOf, loudness: result.loudness }, clock());
      // Open the new session's page (feedback is requested there)
      navigate(`/sessions?id=${session.id}`);
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
  }, [clock, finishCapture, mode, navigate, promptId, repo, retryOf]);

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
    // Keep the running pieces
    live.current = { transcriber, capture, startedAt, timer, readings };
    // Begin transcribing, showing words and handling problems
    transcriber.start(setText, (problem) => void fail(problem));
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
        if (stage === "ready" || stage === "nothing-heard" || stage === "too-short" || stage === "save-failed") void (think > 0 ? beginThinking() : start());
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
  }, [beginThinking, discard, mode, stage, start, stop, think]);

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
  const lengthText = goalSeconds ? `a ${formatClock(goalSeconds)} goal` : script ? `about ${Math.max(1, Math.round(readingSeconds(script.body) / 60))} min` : mode === "warmup" ? `${target} seconds` : mode === "talk" ? `${formatClock(TOPIC_WINDOW_START)} to ${formatClock(target)}` : mode === "response" ? `a ${formatClock(target)} goal` : "about a minute";
  // Whether the thinking countdown is showing
  const thinking = stage === "thinking";
  // The page title for this kind of session
  const title = retryOf ? "Second try" : mode === "warmup" ? "Warm-up" : mode === "talk" ? "Table Topic" : mode === "response" ? "Record Response" : mode === "read" ? "Read aloud" : mode === "pause" ? "Pause drill" : mode === "rehearse" ? "Rehearsal" : "Recording";
  // The keyboard hint for this stage
  const hint = recording ? "space to stop · esc to discard" : thinking ? (mode === "talk" ? "esc to leave" : "space to start speaking · esc to leave") : mode === "talk" ? "space to see your topic" : mode === "response" ? "space to start thinking" : mode === "rehearse" ? "space to start rehearsing" : passage ? "space to start reading" : "space to start";
  // A Table Topic keeps its question hidden until the countdown begins (and while recording it sits in the margin)
  const showPrompt = !recording && !!prompt && !passage && (mode !== "talk" || thinking);
  // A Table Topic's briefing, shown before the question
  const showBriefing = mode === "talk" && (stage === "ready" || stage === "nothing-heard" || stage === "too-short" || stage === "save-failed");
  // This prompt's angles, for a Record Response
  const angles = mode === "response" ? (prompt?.angles ?? []) : [];

  // Draw the page
  return (
    // One column on a phone, margin plus main column on a computer
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
      {/* Navigation (hidden while recording), title and keyboard hint */}
      <Masthead title={title} nav={!(recording || thinking || stage === "starting" || stage === "saving")}>{hint}</Masthead>

      {/* Margin and main column on a computer */}
      <div className="flex flex-1 flex-col md:grid md:grid-cols-[240px_1fr] md:gap-14 md:pt-8">
        {/* Margin: time, length, prompt reminder, discard */}
        <aside className="mt-5 flex flex-col text-footnote text-ink-muted md:mt-0">
          {/* The clock, large */}
          <p className="font-display text-statement text-ink tabular-nums">{formatClock(thinking ? Math.ceil(thinkLeft) : elapsed)}</p>
          {/* The length to aim for, or what the countdown is for */}
          <p className="mt-1">{thinking ? (mode === "talk" ? "until you start" : "to think") : mode === "talk" ? `aim for ${lengthText}` : `of ${lengthText}`}</p>
          {/* During a Table Topic or Record Response, the timing light */}
          {recording && (mode === "talk" || mode === "response" || (mode === "rehearse" && goalSeconds)) && <TimingLight signal={timeSignal(mode, elapsed, goalSeconds)} mode={mode} />}
          {/* Prompt reminder while recording */}
          {recording && prompt && <p className="mt-6 border-t border-rule pt-3 italic">{prompt.text}</p>}
          {/* A Record Response keeps its hints in view while speaking */}
          {recording && angles.length > 0 && <Hints angles={angles} compact />}
          {/* Push discard down */}
          <div className="hidden flex-1 md:block" />
          {/* Discard while recording */}
          {(recording || thinking) && (
            <button type="button" onClick={() => void discard()} className="mt-4 self-start italic underline underline-offset-4 md:mb-10">
              {thinking ? "or leave without speaking" : "or discard this one without saving"}
            </button>
          )}
        </aside>

        {/* Main column */}
        <div className="flex flex-1 flex-col">
          {/* Before a Table Topic: the briefing instead of the question */}
          {showBriefing && (
            <>
              {/* The headline */}
              <h1 className="mt-8 font-display text-prompt tracking-tight md:mt-0 md:max-w-[18ch]">There is very little waiting time.</h1>
              {/* How it works */}
              <p className="mt-5 max-w-[48ch] text-lede">In Table Topics you hear the question and start almost straight away. Press the button to see yours: you get {think} seconds, then recording starts by itself. Speak for 1 to 2 minutes; the light turns green at 1:00, yellow at 1:30, and red at 2:00.</p>
            </>
          )}
          {/* Reading aloud: the title and source before starting, and the text throughout */}
          {script && (
            <>
              {/* Title and source, before starting */}
              {!recording && <h1 className="mt-8 font-display text-statement tracking-tight md:mt-0">{script.title}</h1>}
              {/* Who said it, or that it is a practice passage */}
              {!recording && <p className="mt-1 italic text-ink-muted">{script.source}</p>}
              {/* When rehearsing, hide or show the text to practise from memory */}
              {mode === "rehearse" && (
                <button type="button" onClick={() => setTextHidden(!textHidden)} className="mt-4 self-start italic underline underline-offset-4">
                  {textHidden ? "Show the text" : "Hide the text"}
                </button>
              )}
              {/* For a pause drill, how it works */}
              {!recording && mode === "pause" && <p className="mt-4 max-w-[52ch] text-lede">Read the passage aloud and pause for about a second at each ‖. Take your time.</p>}
              {/* The words to read, large enough to read from a distance, unless hidden to practise from memory */}
              {!textHidden && (
                <p data-testid="passage" className={`${recording ? "mt-8" : "mt-6"} max-w-[52ch] whitespace-pre-line font-display text-cue leading-relaxed`}>
                  {/* The text, with each pause mark (in a pause drill) shown as a pause sign in the accent color */}
                  {(mode === "pause" ? script.body.split(" / ") : [script.body]).map((part, index) => (
                    // One stretch between pauses
                    <span key={index}>
                      {/* A pause sign before every stretch but the first */}
                      {index > 0 && <span role="img" aria-label="pause here" className="mx-2 text-accent">‖</span>}
                      {/* The words */}
                      {part}
                    </span>
                  ))}
                </p>
              )}
            </>
          )}
          {/* Before recording: the prompt and, on a retry, last time's cue */}
          {showPrompt && prompt && (
            <h1 className="relative mt-8 font-display text-prompt tracking-tight before:absolute before:-left-[0.42em] before:text-accent before:content-['“'] md:mt-0 md:max-w-[16ch] md:text-prompt-xl">
              {prompt.text}
            </h1>
          )}
          {/* Thinking about a Record Response: the hints */}
          {thinking && angles.length > 0 && <Hints angles={angles} compact={false} />}
          {/* On a retry, the cue to carry in */}
          {!recording && retryCue && (
            <div className="mt-6 max-w-md border-y border-ink py-4">
              {/* Small heading */}
              <p className="text-footnote italic text-ink-muted">Before you start</p>
              {/* The cue */}
              <p className="mt-1 font-display text-cue">{retryCue}</p>
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

          {/* A problem, explained plainly */}
          {problem && <p role="alert" className="mt-6 max-w-[48ch] text-lede">{PROBLEM_TEXT[problem]}</p>}
          {/* Nothing heard */}
          {stage === "nothing-heard" && <p role="alert" className="mt-6 max-w-[48ch] text-lede">I did not catch any words. Check that the right microphone is selected, then try again.</p>}
          {/* Too short */}
          {stage === "too-short" && <p role="alert" className="mt-6 max-w-[48ch] text-lede">That was under {MIN_SECONDS} seconds, too short to measure, so it was not saved. Take your time and keep going a little longer.</p>}

          {/* Saving failed */}
          {stage === "save-failed" && <p role="alert" className="mt-6 max-w-[48ch] text-lede">This recording could not be saved. The browser said: “{saveError}” Try again; if it keeps happening, check that this site may store data on this device.</p>}
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
              <Link href="/" className="underline underline-offset-4">Back to the prompt</Link>
            </Footnote>
          )}

          {/* The one action for this stage */}
          {(stage === "ready" || stage === "nothing-heard" || stage === "too-short" || stage === "save-failed" || (problem && problem !== "speech-unsupported")) && (
            mode === "talk" ? (
              <ActionButton action={problem || stage === "nothing-heard" || stage === "too-short" || stage === "save-failed" ? "Try again" : "Show my topic"} aside={`${think} seconds to start`} onClick={beginThinking} />
            ) : mode === "response" ? (
              <ActionButton action={problem || stage === "nothing-heard" || stage === "too-short" || stage === "save-failed" ? "Try again" : "Start thinking"} aside={`${think / 60} minutes to prepare`} onClick={beginThinking} />
            ) : (
              <ActionButton action={problem || stage === "nothing-heard" || stage === "too-short" || stage === "save-failed" ? "Try again" : mode === "rehearse" ? "Start rehearsing" : passage ? "Start reading" : "Start speaking"} aside={lengthText} onClick={() => void start()} />
            )
          )}
          {/* Thinking about a Record Response: start speaking early */}
          {thinking && mode === "response" && <ActionButton action="Ready" aside="start speaking" onClick={() => void start()} />}
          {/* A Table Topic's countdown: no early start, just the time left */}
          {thinking && mode === "talk" && <ActionButton action="Get ready" aside={`starting in ${Math.ceil(thinkLeft)}`} onClick={() => {}} disabled />}
          {/* Waiting for the microphone */}
          {stage === "starting" && <ActionButton action="Starting…" aside="allow the microphone" onClick={() => {}} disabled />}
          {/* Recording */}
          {recording && <ActionButton action="Stop" aside={formatClock(elapsed)} onClick={() => void stop()} />}
          {/* Saving */}
          {stage === "saving" && <ActionButton action="Saving…" aside="one moment" onClick={() => {}} disabled />}
        </div>
      </div>
    </main>
  );
}
