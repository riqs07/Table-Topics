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
// Load the text to read by id (a full speech's text loads only when a part of one is asked for)
import { useReading } from "@/components/screens/useReading";
// Load the lesson lookup
import { findLesson } from "@/content/lessons";
// Load the filler marker
import { markFillers } from "@/core/fillers";
// Load the live reading tools
import { followReading, readingTokens, scriptWords, scrollGuide, stampFirstRead, stampSpoken, type ReadingToken } from "@/core/liveReading";
// Load the speech-or-silence threshold, for scrolling at the reader's pace
import { speechThreshold } from "@/core/pauses";
import { memoryLadder, talkSections, type Ladder } from "@/core/eventPrep";
// Load the recording length rules
import { LOUDNESS_TICK_MS, formatClock, maxSeconds, minSeconds, readingSeconds, speakingWindow, targetSeconds, thinkSeconds, timeSignal, timingCue, type SpeakingWindow, type TimeSignal } from "@/core/recordingRules";
// Load the pause-word setting rule
import { pauseWordsShown } from "@/core/pauseWords";
// Load the space bar shortcut choice
import { readSpaceShortcut } from "@/data/spaceShortcut";
// Load the timing tones choice and player type
import { readTimingTones } from "@/data/timingTones";
import type { CuePlayer } from "@/audio/timingTones";
// Load the shared browser repository
import { browserRepository } from "@/data/browserRepository";
// Load the record and repository types
import type { SessionMode, SessionRecord, TalkRecord } from "@/data/records";
// Load the short-speech plan type
import type { Outline } from "@/core/outline";
import type { Repository } from "@/data/repository";
// Load the recording saver
import { saveRecording } from "@/data/saveRecording";
// Load where each kind of session belongs
import { sessionHome } from "@/core/sessionHome";
// Load the small-talk content, the strip's level, and the strip
import { asksWhatYouDid, findSmallTalk, findUnit } from "@/content/smallTalk";
import { stripLevel } from "@/core/smallTalk";
import { RecipeStrip } from "@/components/script/RecipeStrip";
// Load the change picked from the numbers, for a retry cue without the coach
import { localChange } from "@/core/localChange";
// Load the flag for explaining the microphone first
import { markMicExplained, readMicExplained } from "@/data/micExplained";
// Load today's practice, for its number of steps
import { loadDailyPlan, skipStepToday, type LoadedPlan } from "@/data/dailyPlan";
// Load the plan rules, to find the next step after one is put off
import { nextStepIndex, planHref, stepKey } from "@/core/planSteps";
// Load the shared button looks
import { QUIET, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the plain explanations of microphone and speech problems
import { ALLOW_STEPS, PROBLEM_TEXT } from "@/components/script/microphoneHelp";
// Load the check for what the browser did with the microphone, and the even-out factor (decision 81)
import { autoGainApplied } from "@/audio/microphoneSettings";
import { levelScale } from "@/core/voiceLevels";
// Load the voice shape in its forms
import { StartBlob, StatusBlob, TakeControls, VoiceBlob } from "@/components/script/VoiceShapes";
// Load the screen hold
import { holdScreenAwake } from "@/audio/wakeLock";
// Load the request that keeps saved practice from being cleared
import { requestPersistentStorage } from "@/data/storageSafety";
// Load the tab title helper
import { usePageTitle } from "@/components/screens/usePageTitle";

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
  // For a short speech: the user's topic, points and length (on a retry, read from the first try instead)
  outline?: Outline | null;
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
type Stage = "ready" | "mic-primer" | "asking" | "thinking" | "starting" | "recording" | "saving" | "save-failed" | "nothing-heard" | "too-short" | "discarded" | "speech-dropped" | { problem: RecordingProblem };

// How many recent moment notes to show beside a question about what you have been up to
const RECENT_MOMENTS = 3;

// The stage for a browser without speech recognition (one shared value, so it is the same between redraws)
const UNSUPPORTED: Stage = { problem: "speech-unsupported" };

// Number of bars in the level meter
const METER_BARS = 24;

// Draw the transcript so far, with fillers marked and unsettled words lighter
function LiveWords({ text, marks = true }: { text: LiveText; marks?: boolean }) {
  // Settled words with fillers marked (unless pause words are hidden; decision 79), then words still being heard
  return (
    <p className="max-w-[34ch] font-display text-cue">
      {/* Settled words, piece by piece */}
      {(marks ? markFillers(text.final) : [{ text: text.final, filler: false }]).map((piece, index) =>
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
    // Before the minimum: say when it will light, so the empty lamp never looks broken
    none: `Turns green at ${formatClock(window.start)}`,
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
  // Before 2:15: say when it will light
  none: "Turns yellow 45 seconds before the goal",
  // Not used by a Record Response
  green: "",
  // From 2:15
  yellow: "Yellow: 45 seconds to the goal",
  // Past 3:00
  red: "Red: past the goal",
  // Not used by a Record Response
  overtime: "",
};

// The timing light's words in the status line while recording (green, yellow, red for a Table Topic; yellow, red for a Record Response); the voice shape carries the colour, so there is no separate lamp (decision 77)
function TimingLight({ signal, mode, promptId }: { signal: TimeSignal; mode: SessionMode; promptId: string }) {
  // The window, for a Table Topic, a prepared speech or small talk
  const window = speakingWindow(mode, promptId);
  // The words for this kind of session
  const words = window ? windowSignalText(window) : RESPONSE_SIGNAL_TEXT;
  // The words, announced politely when they change
  return (
    <span role="status" aria-label="Timing light" data-signal={signal} className="text-footnote font-normal text-ink-muted">
      {/* What the light means now */}
      {words[signal]}
    </span>
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
        <p className="text-footnote text-ink-muted">A simple shape</p>
        {/* The steps in order */}
        <ol className="mt-2 space-y-1">
          {/* One step per line */}
          {STRUCTURE_HINT.map((step) => <li key={step.label}><em>{step.label}</em> <span className="text-ink-muted">{step.detail}</span></li>)}
        </ol>
      </div>
      {/* The angles */}
      <div>
        {/* Small heading */}
        <p className="text-footnote text-ink-muted">Angles to try</p>
        {/* One per line */}
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {/* One item per angle */}
          {angles.map((angle) => <li key={angle}>{angle}</li>)}
        </ul>
      </div>
    </div>
  );
}

// Scroll once the reader's line passes this share of the screen's height
const SCROLL_WHEN_PAST = 0.55;
// And bring it back up to this share, so the next lines are in view
const KEEP_LINE_AT = 0.3;
// Readings between updates of the silence level (once a second)
const PACE_REFRESH_TICKS = 10;
// How long a discarded take can be brought back (Material suggests 4 to 10 seconds; decision 77)
const UNDO_MS = 8000;

// Words heard before a pause, then the words since, as one transcript
function joinWords(earlier: string, later: string): string {
  // Whichever exist, with one space between
  return [earlier.trim(), later.trim()].filter((part) => part !== "").join(" ");
}

// The text to read, with pause marks as pause signs, *stressed* words in bold and [directions] in quiet italics; while recording, words already read are lit, the next word is marked, and the rest is dimmed
function ScriptText({ tokens, place, guide, className }: { tokens: ReadonlyArray<ReadingToken>; place: number | null; guide: number | null; className: string }) {
  // The text's element, for keeping the reader's line in view
  const box = useRef<HTMLParagraphElement>(null);

  // Keep the reader's line in view as they move down the page (the guide moves on at a reading pace when recognition lags, so hands never need to scroll)
  useEffect(() => {
    // Only while recording
    if (guide === null) return;
    // The word to keep in view
    const word = box.current?.querySelector(`[data-word="${guide}"]`);
    // Nothing to do if it is missing
    if (!word) return;
    // Where it is on screen
    const where = word.getBoundingClientRect();
    // Scroll only when it passes the middle (the action bar sits at the bottom) or has gone above the top
    if (where.bottom > window.innerHeight * SCROLL_WHEN_PAST || where.top < 0) window.scrollTo?.({ top: window.scrollY + where.top - window.innerHeight * KEEP_LINE_AT, behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [guide]);

  // Draw each piece
  return (
    <p ref={box} data-testid="passage" data-guide={guide ?? undefined} className={className}>
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

// Draw the recording screen
export function RecordingScreen({ promptId, mode, retryOf, services, navigate, repository, clock: givenClock, sectionIndex = null, ladder: startingLadder = "full", questionIndex = 0, planStep = null, outline: givenOutline = null }: RecordingScreenProps) {
  // A short speech's plan: from the address, or (on a retry) from the first try
  const [outline, setOutline] = useState<Outline | null>(givenOutline);
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
  // Whether the retry cue is the coach's (otherwise it was picked from the numbers)
  const [cueFromCoach, setCueFromCoach] = useState(true);
  // The live transcriber, audio capture, start time, and timer, kept between renders
  const live = useRef<{ transcriber: LiveTranscriber; capture: AudioCapture; startedAt: Date; timer: ReturnType<typeof setInterval>; readings: number[]; pitches: (number | null)[]; autoGain: boolean | null; spokenTimes: number[]; scriptTimes: (number | null)[]; pausedAt: Date | null; earlier: string; held: Promise<void>; tick: () => void; onWords: (latest: LiveText) => void } | null>(null);
  // Whether the recording is paused (decision 77)
  const [paused, setPaused] = useState(false);
  // Timing tones, when switched on in Settings: made during the start tap, since browsers only let sound start from one (decision 77)
  const cues = useRef<CuePlayer | null>(null);
  // The timing light at the last cue check, to hear when it changes
  const lastSignal = useRef<TimeSignal>("none");
  // A take that was just discarded, kept for a few seconds so it can be undone (decision 77)
  const discarded = useRef<{ transcript: string; audio: Blob; durationSec: number; loudness: number[]; pitch: (number | null)[]; autoGain: boolean | null; spokenTimes: number[]; scriptTimes: (number | null)[] | null } | null>(null);
  // Inside today's practice, how many steps it has (loaded below)
  const [plan, setPlan] = useState<LoadedPlan | null>(null);
  // While reading, the number of the next word to read (every word before it is lit up)
  const [place, setPlace] = useState(0);
  // The word to keep in view: the place, moved on at a reading pace while the reader is speaking and recognition lags
  const [guide, setGuide] = useState(0);
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
  // Where a take saved after the speech service dropped can be seen (shown with the explanation instead of going there at once)
  const [droppedHref, setDroppedHref] = useState("");
  // Whether the screen is still open, so a start that was waiting (the question being said, the microphone being allowed) stops if the page closes
  const mounted = useRef(true);
  // Open while drawn, closed when the screen goes
  useEffect(() => {
    // Open
    mounted.current = true;
    // Closed when leaving
    return () => {
      // No longer open
      mounted.current = false;
      // Stop a question being said
      services.stopSpeaking?.();
    };
  }, [services]);

  // For a Q&A answer, the question (loaded from the session it belongs to, below)
  const [qaQuestion, setQaQuestion] = useState<string | null>(null);
  // The prompt to speak to (for reading aloud, its title; for a Q&A answer, the question)
  const prompt = mode === "qa" ? (qaQuestion ? { id: promptId, text: qaQuestion } : undefined) : findPrompt(promptId);
  // The passage, when reading aloud or doing a pause drill
  const passage = useReading(mode === "read" || mode === "pause" ? promptId : null).passage;
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
  // A small-talk answer: its question, and its lesson when it is a lesson's turn
  const smallTalk = mode === "smalltalk" ? findSmallTalk(promptId) : undefined;
  // The user's earlier small-talk answers, for how much of the strip to show (newest first)
  const [earlierAnswers, setEarlierAnswers] = useState<SessionRecord[]>([]);
  // For a question about what you have been up to, your moment notes from the last week (newest first)
  const [recentMoments, setRecentMoments] = useState<SessionRecord[]>([]);
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
  const goalSeconds = talk?.goalMinutes && section === null ? talk.goalMinutes * 60 : mode === "outline" && outline ? outline.goalMinutes * 60 : undefined;

  // For a small-talk answer, get the question's voice ready and load the earlier answers
  useEffect(() => {
    // Only for small talk
    if (mode !== "smalltalk") return;
    // Fetch the question's audio ahead of the tap
    services.prepareSpeech?.(promptId);
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Read them
    repo.listSessions().then((sessions) => {
      // Stop if closed
      if (cancelled) return;
      // Keep the small-talk answers
      setEarlierAnswers(sessions.filter((session) => session.mode === "smalltalk"));
      // A week ago
      const weekAgo = clock().getTime() - 7 * 86_400_000;
      // And, for a question about what you have been up to, the last few moments of the week
      setRecentMoments(asksWhatYouDid(promptId) ? sessions.filter((session) => session.mode === "moment" && new Date(session.createdAt).getTime() >= weekAgo).slice(0, RECENT_MOMENTS) : []);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [clock, mode, promptId, repo, services]);

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
  const target = targetSeconds(mode, promptId);
  // The limit
  const limit = maxSeconds(mode, promptId);
  // The shortest recording kept
  const shortest = minSeconds(mode, promptId);

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
      // Keep its cue: the coach's, or else the one picked from its numbers
      setRetryCue(original ? (original.feedback ?? localChange(original)).retryCue : null);
      // Where the cue came from
      setCueFromCoach(!!original?.feedback);
      // And the user's own note, if they wrote one
      setOwnNote(original?.selfReview?.change || null);
      // A short speech keeps the first try's plan
      if (original?.outline) setOutline((current) => current ?? original.outline ?? null);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, retryOf]);

  // Whether pause words are marked in the live words (decision 79; marked until Settings is read)
  const [pauseWords, setPauseWords] = useState(true);
  // Read it once
  useEffect(() => {
    // Ignore the answer if the screen closes first
    let cancelled = false;
    // Read the settings
    repo.getSettings(clock()).then((settings) => {
      // Keep it if still open
      if (!cancelled) setPauseWords(pauseWordsShown(settings));
    });
    // Mark as closed when leaving
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [repo, clock]);

  // Inside today's practice, load the plan to say how many steps it has (and where "Can't speak now?" leads)
  useEffect(() => {
    // Only inside the plan
    if (!planStep) return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Load it
    loadDailyPlan(repo, clock()).then((loaded) => {
      // Keep it if still open
      if (!cancelled) setPlan(loaded);
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
    // Work out the length (up to the pause, if paused), capped at the limit
    const durationSec = Math.min(limit, Math.round(((current.pausedAt ?? clock()).getTime() - current.startedAt.getTime()) / 1000));
    // Stop transcribing and recording together
    const [latestWords, audio] = await Promise.all([current.transcriber.stop(), current.capture.stop()]);
    // Wait for the words from before a pause, if the pause is still collecting them (a quick Pause then Stop)
    await current.held;
    // Everything said, including before any pause
    const transcript = joinWords(current.earlier, latestWords);
    // No longer paused
    setPaused(false);
    // One time per word of the final transcript: the noted times, filled with the end time where the final words ran past them
    const spokenTimes = stampSpoken(current.spokenTimes, transcript.split(/\s+/).filter((word) => word !== "").length, durationSec).slice(0, transcript.split(/\s+/).filter((word) => word !== "").length);
    // Hand back the results, with the loudness readings for finding pauses and the word times
    return { transcript, audio, durationSec, loudness: current.readings, pitch: current.pitches, autoGain: current.autoGain, spokenTimes, scriptTimes: current.scriptTimes.length > 0 ? current.scriptTimes : null };
  }, [clock, limit]);

  // Save a finished take and open it (or explain that nothing was heard); used on stop and on undoing a discard. After the speech service dropped, it stays to explain, with a link to the take
  const keep = useCallback(async (result: Awaited<ReturnType<typeof finishCapture>>, dropped = false) => {
    // Any step below can fail (the browser database can refuse a write), so never leave the screen on "Saving…"
    try {
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
      if (result.durationSec < shortest) {
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
      const session = await saveRecording(repo, { id: crypto.randomUUID(), transcript: result.transcript, durationSec: result.durationSec, audio: result.audio, promptId, mode, retryOf, loudness: result.loudness, pitch: result.pitch, autoGain: result.autoGain, spokenTimes: result.spokenTimes, ...(textForFillers.current !== null ? { script: textForFillers.current } : {}), ...(result.scriptTimes ? { scriptTimes: result.scriptTimes } : {}), ...(mode === "rehearse" ? { sectionIndex: section } : {}), ...(mode === "qa" && qaQuestion ? { question: qaQuestion } : {}), ...(mode === "outline" && outline ? { outline } : {}) }, clock());
      // Now there is practice worth keeping, ask the browser not to clear it (no wait; decision 64)
      void requestPersistentStorage();
      // A moment note goes straight back to the Small talk page, where it is listed; anything else opens its page (feedback is requested there)
      const next = mode === "moment" ? "/small-talk/unit?id=answering#moments" : `/sessions?id=${session.id}${planStep ? `&plan=${planStep}` : ""}`;
      // The speech service dropped: say so first, with the way to the take
      if (dropped) {
        // Where it is
        setDroppedHref(next);
        // Explain
        setStage("speech-dropped");
        // Done
        return;
      }
      // Go there
      navigate(next);
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
  }, [clock, mode, navigate, outline, planStep, promptId, qaQuestion, repo, retryOf, section, shortest]);

  // Stop recording, then keep the take
  const stop = useCallback(async () => {
    // Only stop once
    if (stopping.current) return;
    // Mark as stopping
    stopping.current = true;
    // Show that saving is under way
    setStage("saving");
    // Stop everything, then keep what was recorded
    await keep(await finishCapture());
  }, [finishCapture, keep]);

  // Stop because of a problem: the speech service dropping mid-take keeps what was heard and the audio (decision 76); anything else saves nothing
  const fail = useCallback(
    async (problem: RecordingProblem) => {
      // The speech service dropped while a take was under way (and not already stopping)
      if (problem === "speech-offline" && live.current && !stopping.current) {
        // Only stop once
        stopping.current = true;
        // Show that saving is under way
        setStage("saving");
        // Stop everything, keeping what was heard
        const result = await finishCapture();
        // Words heard and long enough to measure: save them, then explain
        if (result && result.transcript.trim() && result.durationSec >= shortest) return keep(result, true);
        // Nothing worth keeping: allow another attempt
        stopping.current = false;
        // Explain the problem
        setStage({ problem });
        // Done
        return;
      }
      // Stop everything without saving
      await finishCapture();
      // Explain
      setStage({ problem });
    },
    [finishCapture, keep, shortest],
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
    // And keep it in view
    setGuide(0);
    // Reset the timer display
    setElapsed(0);
    // Reset the stop guard
    stopping.current = false;
    // Ask for the microphone
    let stream: MediaStream;
    // The browser may refuse
    try {
      // Request access, without the browser's automatic levelling so loud and soft stay different (decision 81)
      stream = await services.openMicrophone({ autoGain: false });
    } catch (error) {
      // The screen closed while asking: nothing to show
      if (!mounted.current) return;
      // A missing microphone, or a refusal
      setStage({ problem: (error as DOMException).name === "NotFoundError" ? "no-microphone" : "microphone-blocked" });
      // Stop here
      return;
    }
    // The screen closed while the microphone was being allowed: let it go and record nothing
    if (!mounted.current) {
      // Release the microphone
      stream.getTracks().forEach((track) => track.stop());
      // Stop here
      return;
    }
    // Start recording audio
    const capture = services.createCapture(stream);
    // If the microphone stops by itself (the phone locked, another app took it), stop and keep what was said (decision 76)
    stream.getAudioTracks?.().forEach((track) => track.addEventListener("ended", () => void stop(), { once: true }));
    // Start live transcription
    const transcriber = services.createTranscriber();
    // Note the start time
    const startedAt = clock();
    // Loudness readings for the whole recording, kept for finding pauses afterwards
    const readings: number[] = [];
    // Pitch readings taken with them (decision 81)
    const pitches: (number | null)[] = [];
    // Whether the browser kept its levelling anyway (some do), or null when it cannot say
    const autoGain = autoGainApplied(stream);
    // Without the levelling, the factor that evens out the meter and the reading pace, refreshed once a second
    const evenOut = { scale: 1 };
    // The words to listen for in the text on screen (none without text)
    const expected = wordsToHear.current;
    // Keep the running pieces, with no word times yet (the clock, tick and word handler are filled in below)
    const pieces: NonNullable<typeof live.current> = { transcriber, capture, startedAt, timer: 0 as unknown as ReturnType<typeof setInterval>, readings, pitches, autoGain, spokenTimes: [], scriptTimes: expected.map((): number | null => null), pausedAt: null, earlier: "", held: Promise.resolve(), tick: () => {}, onWords: () => {} };
    // For scrolling at the reader's pace: the matched place, seconds spoken since it last moved, and the loudness below which it is silence
    const pace = { place: 0, voiced: 0, threshold: speechThreshold([]) };
    // Tick: update the timer and meter, and stop at the limit
    pieces.tick = () => {
      // Seconds since starting (pauses left out)
      const seconds = (clock().getTime() - pieces.startedAt.getTime()) / 1000;
      // Show the time
      setElapsed(seconds);
      // Read the loudness once
      const raw = capture.level();
      // Keep it as measured
      readings.push(raw);
      // And the pitch with it
      pitches.push(capture.pitch?.() ?? null);
      // Without the browser's levelling, refresh the evening-out factor once a second
      if (autoGain === false && readings.length % PACE_REFRESH_TICKS === 0) evenOut.scale = levelScale(readings);
      // The level as the meter and the reading pace see it
      const level = raw * evenOut.scale;
      // Add it to the meter, dropping the oldest
      setLevels((previous) => [...previous.slice(1), level]);
      // With text on screen: update the silence level once a second, count speaking time, and keep the text moving at a reading pace
      if (wordsToHear.current.length > 0) {
        // Once a second
        if (readings.length % PACE_REFRESH_TICKS === 0) pace.threshold = speechThreshold(evenOut.scale === 1 ? readings : readings.map((reading) => reading * evenOut.scale));
        // Speaking now
        if (level >= pace.threshold) pace.voiced += LOUDNESS_TICK_MS / 1000;
        // The word to keep in view
        setGuide(scrollGuide(pace.place, pace.voiced, wordsToHear.current.length));
      }
      // Stop by itself at the limit
      if (seconds >= limit) void stop();
    };
    // Start the clock
    pieces.timer = setInterval(pieces.tick, LOUDNESS_TICK_MS);
    // Keep them between renders
    live.current = pieces;
    // Each time words arrive: show them, note when each was first heard, and move the place in the text
    const heardWords = (latest: LiveText) => {
      // Show them
      setText(latest);
      // Seconds since starting (pauses left out)
      const seconds = (clock().getTime() - pieces.startedAt.getTime()) / 1000;
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
      // Recognition caught up: the pace starts again from here
      if (follow.next > pace.place) {
        // The new place
        pace.place = follow.next;
        // Nothing spoken past it yet
        pace.voiced = 0;
      }
      // Move the place forward, never back
      setPlace((previous) => Math.max(previous, follow.next));
    };
    // Words from the current listener, after any heard before a pause
    pieces.onWords = (latest: LiveText) => heardWords({ final: joinWords(pieces.earlier, latest.final), interim: latest.interim });
    // Begin transcribing, showing words and handling problems
    transcriber.start(pieces.onWords, (problem) => void fail(problem));
    // Now recording
    setStage("recording");
  }, [clock, endThinking, fail, limit, services, stop]);

  // Small talk: say the question aloud, then start recording once it has been said (so the recording never hears the voice)
  const ask = useCallback(
    async (question: string) => {
      // Show that the question is being asked
      setStage("asking");
      // Say it, carrying on even if the voice fails
      await services.speak?.(question, promptId).catch(() => undefined);
      // The screen closed while it was said: record nothing
      if (!mounted.current) return;
      // Then record
      await start();
    },
    [promptId, services, start],
  );

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
    const result = await finishCapture();
    // Thinking only, nothing recorded: go home
    if (!result) {
      // Home
      navigate("/");
      // Done
      return;
    }
    // Keep the take for a few seconds, in case it was a slip (decision 77)
    discarded.current = result;
    // Allow a fresh start
    stopping.current = false;
    // Say so, with an undo
    setStage("discarded");
  }, [endThinking, finishCapture, navigate]);

  // Undo a discard: keep the take after all
  const undoDiscard = useCallback(async () => {
    // The take, if it is still held
    const held = discarded.current;
    // Nothing to undo
    if (!held) return;
    // Let it go from the hold
    discarded.current = null;
    // Saving now
    stopping.current = true;
    // Show it
    setStage("saving");
    // Keep it
    await keep(held);
  }, [keep]);

  // A discarded take is let go after a few seconds, and the screen is ready for another go
  useEffect(() => {
    // Only while showing the undo
    if (stage !== "discarded") return;
    // After the undo window
    const timer = setTimeout(() => {
      // Let the take go
      discarded.current = null;
      // Ready again
      setStage("ready");
    }, UNDO_MS);
    // Cancel if the stage changes first
    return () => clearTimeout(timer);
  }, [stage]);

  // Pause: stop the clock, the audio and the listening, keeping everything so far (decision 77)
  const pause = useCallback(async () => {
    // What is running
    const current = live.current;
    // Nothing to pause, or already paused
    if (!current || current.pausedAt) return;
    // Stop the clock
    clearInterval(current.timer);
    // Note when
    current.pausedAt = clock();
    // Pause the audio
    current.capture.pause?.();
    // The listener in use
    const listener = current.transcriber;
    // Swap in a silent stand-in, so a stop while paused does not stop it twice
    current.transcriber = { start: () => {}, stop: async () => "" };
    // Keep its words once it hands them back; a stop meanwhile waits for this, so nothing said before the pause is lost
    current.held = current.held.then(() => listener.stop().catch(() => "")).then((words) => {
      // Added to the earlier words
      current.earlier = joinWords(current.earlier, words);
    });
    // Shown as paused straight away
    setPaused(true);
    // Wait for the words
    await current.held;
    // Show them as settled, if the take is still under way
    if (live.current === current) setText({ final: current.earlier, interim: "" });
  }, [clock]);

  // Resume: carry on from where it paused
  const resume = useCallback(() => {
    // What is running
    const current = live.current;
    // Nothing paused
    if (!current || !current.pausedAt) return;
    // Move the start on by the paused time, so the clock and the length skip it
    current.startedAt = new Date(current.startedAt.getTime() + (clock().getTime() - current.pausedAt.getTime()));
    // No longer paused
    current.pausedAt = null;
    // Carry on recording audio
    current.capture.resume?.();
    // A fresh listener, its words added after the earlier ones
    const listener = services.createTranscriber();
    // Use it
    current.transcriber = listener;
    // Start listening
    listener.start(current.onWords, (problem) => void fail(problem));
    // Restart the clock
    current.timer = setInterval(current.tick, LOUDNESS_TICK_MS);
    // Shown as recording
    setPaused(false);
  }, [clock, fail, services]);

  // This screen's step of today's practice, when it is one (checked against the page, so a stale step number never skips the wrong step)
  const thisStep = plan && planStep ? plan.steps[planStep - 1] : undefined;
  // Only a speaking step can be put off ("Can't speak now?" is about speaking)
  const skippable = !!thisStep && thisStep.kind === "session" && thisStep.mode === mode && thisStep.promptId === promptId && !retryOf;
  // The reading step can start with an optional warm-up, which comes back here afterwards (decision 80)
  const warmUpFirst = skippable && thisStep.lane === "warmup" && mode === "read" && planStep ? `/voice/warmup?then=${encodeURIComponent(planHref(thisStep, planStep))}` : null;

  // "Can't speak now?": put this step off for today (not done, just not offered next) and go on to the next open step, or back to Today (decision 77)
  const skipForToday = useCallback(async () => {
    // Nothing to skip
    if (!plan || !thisStep) return;
    // Remember it for today
    await skipStepToday(repo, thisStep, clock());
    // Which steps are now put off, counting this one
    const skipped = plan.steps.map((step, index) => plan.skipped[index] || stepKey(step) === stepKey(thisStep));
    // The next step neither done nor put off
    const next = nextStepIndex(plan.done, skipped);
    // Go there, or back to Today when none is left
    navigate(next === -1 ? "/" : planHref(plan.steps[next]!, next + 1));
  }, [clock, navigate, plan, repo, thisStep]);

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
    // A new take lets any discarded one go
    discarded.current = null;
    // Timing tones, if switched on: get the sound ready now, during the tap
    if (readTimingTones() && services.createCuePlayer) {
      // Make the player once
      cues.current ??= services.createCuePlayer();
      // Wake its sound
      cues.current.prime();
    }
    // The start itself: a small-talk question is asked aloud first, a Table Topic or prepared speech counts down, anything else records
    const go = smallTalk ? () => void ask(smallTalk.question) : think > 0 ? beginThinking : () => void start();
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
  }, [ask, beginThinking, needsPrimer, services, smallTalk, start, think]);

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
      // The screen closed while asking: nothing to show
      if (!mounted.current) return;
      // A missing microphone, or a refusal
      setStage({ problem: (error as DOMException).name === "NotFoundError" ? "no-microphone" : "microphone-blocked" });
      // Stop here
      return;
    }
    // The screen closed while asking: start nothing
    if (!mounted.current) return;
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
      // Space: start when ready, stop when recording (unless switched off in Settings; decision 79)
      if (event.key === " " && readSpaceShortcut()) {
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

  // Keep the screen on while thinking and speaking, so the phone does not lock mid-speech (decision 76)
  const holdAwake = stage === "thinking" || stage === "recording";
  // Hold it for as long as that lasts
  useEffect(() => (holdAwake ? holdScreenAwake() : undefined), [holdAwake]);

  // Whether recording is under way
  const recording = stage === "recording";
  // The problem to explain, if any
  const problem = typeof stage === "object" ? stage.problem : null;
  // Length wording for this kind of session
  const lengthText = goalSeconds ? `a ${formatClock(goalSeconds)} goal` : script ? `about ${Math.max(1, Math.round(readingSeconds(script.body) / 60))} min` : mode === "warmup" ? `${target} seconds` : speakingWindow(mode, promptId) ? `${formatClock(speakingWindow(mode, promptId)!.start)} to ${formatClock(speakingWindow(mode, promptId)!.end)}` : mode === "bookend" || mode === "qa" ? `a ${formatClock(target)} goal` : mode === "moment" ? "under a minute" : mode === "free" ? "as long as you like" : "about a minute";
  // Whether the thinking countdown is showing
  const thinking = stage === "thinking";
  // Whether this kind of session has a timing light
  const hasLight = mode === "talk" || mode === "response" || mode === "smalltalk" || mode === "bookend" || mode === "qa" || ((mode === "rehearse" || mode === "outline") && !!goalSeconds);
  // Whether a take is under way (no way out but discard, and no clock in the masthead)
  const busy = recording || thinking || stage === "asking" || stage === "starting" || stage === "saving";
  // Where this kind of session belongs, for the close button (practising hides the tab bar)
  const home = sessionHome(mode, promptId, planStep !== null);
  // Asking or listening, in small talk
  const unit = smallTalk && smallTalk.unit !== "answering" ? findUnit(smallTalk.unit) : null;
  // A story to listen to is not shown before answering, except in a lesson (you listen the way you would in person)
  const storyHidden = smallTalk?.unit === "listening" && !smallTalk.lesson;
  // The page title for this kind of session
  const title = retryOf ? "Second try" : mode === "warmup" ? "Warm-up" : mode === "talk" ? "Rapid Fire" : mode === "response" ? "Prepared speech" : mode === "read" ? "Read aloud" : mode === "pause" ? "Pause drill" : mode === "rehearse" ? "Rehearsal" : mode === "lesson" ? "Lesson" : bookend ? (bookend.part === "opening" ? "Opening drill" : "Closing drill") : mode === "qa" ? "Q&A answer" : mode === "smalltalk" ? "Small talk" : mode === "moment" ? "One moment" : mode === "free" ? "Free talk" : mode === "outline" ? "Short speech" : "Recording";
  // Name the tab after it
  usePageTitle(title);
  // The timing light now, while recording (off otherwise)
  const signal = recording && hasLight ? timeSignal(mode, elapsed, goalSeconds, promptId) : "none";
  // A tone (and a buzz, where the phone allows) when the light first comes on and at red, if switched on (decision 77)
  useEffect(() => {
    // The cue for this change, if any
    const cue = timingCue(lastSignal.current, signal);
    // Remember the light
    lastSignal.current = signal;
    // Play it (nothing happens unless tones were switched on at the start)
    if (cue) cues.current?.play(cue);
  }, [signal]);
  // Let the sound go when the screen closes
  useEffect(() => () => {
    // Close the player, if one was made
    cues.current?.close();
    // Forget it
    cues.current = null;
  }, []);
  // The keyboard hint for this stage
  const hint = recording ? "space to stop · esc to discard" : thinking ? (mode === "talk" ? "esc to leave" : "space to start speaking · esc to leave") : mode === "talk" ? "space to see your topic" : mode === "smalltalk" ? `space to hear ${unit ? "them" : "the question"}` : mode === "response" ? "space to start thinking" : mode === "rehearse" ? "space to start rehearsing" : passage || lesson ? "space to start reading" : "space to start";
  // A Table Topic keeps its question hidden until the countdown begins (and while recording it sits in the margin)
  const showPrompt = !recording && !!prompt && !script && !smallTalk && (mode !== "talk" || thinking);
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
        <Masthead title={title} nav={false} close={home}>{""}</Masthead>
        {/* The explanation */}
        <section aria-label="Your microphone" className="flex flex-1 flex-col md:max-w-2xl md:pt-8">
          {/* What it is for */}
          <h1 className="mt-8 font-display text-statement tracking-tight md:mt-0">VoiceLab listens through your microphone.</h1>
          {/* Where recordings go */}
          <p className="mt-4 max-w-[48ch] text-lede">Recordings stay on this device. Your browser turns speech into text (Google in Chrome, Apple in Safari). Choose Allow next.</p>
          {/* Back without asking (just under the words, so the action band never covers it) */}
          <p className="mt-4">
            <button type="button" onClick={() => setStage("ready")} className={QUIET}>Not now</button>
          </p>
          {/* Let the browser ask */}
          <ActionButton action="Allow microphone" aside="your browser asks next" onClick={() => void allowMicrophone()} />
        </section>
      </main>
    );
  }

  // Draw the page
  return (
    // One column on a phone, margin plus main column on a computer; dark green while the clock runs (the stage, decision 69)
    <main data-area={recording || thinking ? "stage" : undefined} className={`mx-auto flex min-h-dvh max-w-6xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10 ${script ? "pb-36" : "pb-10"}`}>
      {/* Navigation (hidden while recording), title and keyboard hint */}
      <Masthead title={title} nav={false} close={busy ? null : home}>
        {/* The keyboard hint, on computers only */}
        <span className="hidden pointer-fine:inline">{hint}</span>
        {/* Before reading on a phone: the length, small, in place of the big clock */}
        {(script || smallTalk) && !busy && <span className="pointer-fine:hidden md:hidden">{lengthText}</span>}
      </Masthead>
      {/* Inside today's practice, which step this is */}
      {planStep && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 text-footnote">
          {/* The step */}
          <p className="font-medium text-accent">Today’s practice · step {planStep}{plan ? ` of ${plan.steps.length}` : ""}</p>
          {/* Before speaking: a way to put the step off without it counting as done (decision 77) */}
          {skippable && !busy && (
            <span className="flex flex-wrap gap-x-4">
              {/* A minute of warm-up first, on the reading step (decision 80) */}
              {warmUpFirst && <Link href={warmUpFirst} className={`${TEXT_LINK} text-accent`}>Warm up first</Link>}
              {/* Put it off */}
              <button type="button" onClick={() => void skipForToday()} aria-label="Can’t speak now? Skip this step for today" className={`${TEXT_LINK} text-ink-muted`}>Can’t speak now?</button>
            </span>
          )}
        </div>
      )}

      {/* Margin and main column on a computer */}
      <div className="flex flex-1 flex-col md:grid md:grid-cols-[240px_1fr] md:gap-14 md:pt-8">
        {/* Margin: time, length, prompt reminder, discard */}
        <aside className={`mt-5 flex-col text-footnote text-ink-muted md:mt-0 md:flex ${(script || smallTalk) && !busy ? "hidden" : "flex"} ${recording || thinking ? "max-md:order-last max-md:mt-6" : ""}`}>
          {/* The clock, large, only while thinking about a prepared speech (a Table Topic counts down in the shape; while recording the clock is in the shape; decision 77) */}
          {thinking && mode !== "talk" && <p className="font-display text-prompt-xl font-semibold text-ink tabular-nums">{formatClock(Math.ceil(thinkLeft))}</p>}
          {/* The length to aim for, or what the countdown is for (the countdown's own words are in the shape) */}
          {!(thinking && mode === "talk") && <p className={`mt-1 ${recording ? "max-md:hidden" : ""}`}>{thinking ? "to think" : mode === "free" ? "no time limit" : `aim for ${lengthText}`}</p>}
          {/* A lesson keeps its tip in view while speaking */}
          {recording && lesson && <p className="mt-6 border-t border-rule pt-3">{lesson.tip}</p>}
          {/* A Record Response keeps its hints in view while speaking */}
          {recording && angles.length > 0 && <Hints angles={angles} compact />}
          {/* Push the way out down */}
          <div className="hidden flex-1 md:block" />
          {/* Leave while thinking (while recording, Pause and Discard sit by the shape) */}
          {thinking && (
            <button type="button" onClick={() => void discard()} className={`${QUIET} mt-4 self-start md:mb-10`}>
              Leave without speaking
            </button>
          )}
        </aside>

        {/* Main column */}
        <div className="flex flex-1 flex-col">
          {/* While recording: one status line (recording or paused, and the timing words), the question, and, beside text to read, the controls (decision 77) */}
          {recording && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {/* Recording or paused */}
              <p role="status" aria-label={paused ? "Paused" : "Recording"} className="flex items-center gap-2 text-footnote font-semibold text-warm">
                {/* The warm dot (breathes only while recording and when motion is welcome) */}
                <span aria-hidden="true" className={`inline-block size-3 rounded-full bg-warm ${paused ? "" : "motion-safe:animate-breathe"}`} />
                {/* The word */}
                {paused ? "Paused" : "Recording"}
              </p>
              {/* The timing words, or (without a light, on a phone, where the margin moves below) the length to aim for */}
              {hasLight ? <TimingLight signal={signal} mode={mode} promptId={promptId} /> : <span className="text-footnote text-ink-muted md:hidden">{mode === "free" ? lengthText : `aim for ${lengthText}`}</span>}
            </div>
          )}
          {/* The question being answered, above the shape */}
          {recording && prompt && !smallTalk && !script && <p className="mt-3 max-w-[30ch] font-display text-cue font-semibold tracking-tight">{prompt.text}</p>}
          {/* Beside text to read, the controls sit at the top (the shape floats in the corner) */}
          {recording && script && <TakeControls paused={paused} onPause={() => void pause()} onResume={resume} onDiscard={() => void discard()} />}
          {/* A discarded take, which can be brought back for a few seconds */}
          {stage === "discarded" && (
            <div role="status" className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-card p-4 md:mt-0">
              {/* What happened */}
              <span className="min-w-0 flex-1">Take discarded.</span>
              {/* Bring it back */}
              <button type="button" onClick={() => void undoDiscard()} className={SECONDARY}>Undo</button>
            </div>
          )}
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
              <h1 className="mt-8 font-display text-statement tracking-tight md:mt-0 md:max-w-[18ch]">Your topic is hidden until you start.</h1>
              {/* How it works, once */}
              <p className="mt-4 max-w-[48ch] text-lede">You get {think} seconds to think, then recording starts by itself. Aim for 1 to 2 minutes: the light turns green at 1:00, yellow at 1:30 and red at 2:00.</p>
            </>
          )}
          {/* Reading aloud, a lesson, or a rehearsal: the title (and source or tip) before starting, and the text throughout */}
          {script && (
            <>
              {/* Title and source, before starting */}
              {!recording && <h1 className="mt-8 font-display text-statement tracking-tight md:mt-0">{script.title}</h1>}
              {/* Who said it, or that it is a practice passage */}
              {!recording && script.source && <p className="mt-1 text-ink-muted">{script.source}</p>}
              {/* A lesson's tip, before starting */}
              {!recording && lesson && (
                <div className="mt-5 max-w-[52ch] border-l-2 border-accent pl-4">
                  {/* Small heading */}
                  <p className="text-footnote text-ink-muted">The tip</p>
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
                    <button key={rung.ladder} type="button" aria-pressed={ladder === rung.ladder} onClick={() => setLadder(rung.ladder)} className={ladder === rung.ladder ? "text-ink" : "text-ink-muted underline underline-offset-4"}>
                      {rung.name}
                    </button>
                  ))}
                </div>
              )}
              {/* For a pause drill, how it works */}
              {!recording && mode === "pause" && <p className="mt-4 max-w-[52ch] text-lede">Pause for a second at each ‖.</p>}
              {/* The words to read, large enough to read from a distance, unless hidden to practise from memory */}
              {!textHidden && (
<ScriptText tokens={tokens} place={recording ? place : null} guide={recording ? Math.max(place, guide) : null} className={`${recording ? "mt-8" : "mt-6"} max-w-[52ch] whitespace-pre-line font-display text-cue leading-relaxed max-md:pr-20`} />
              )}
            </>
          )}
          {/* Small talk: a lesson's idea and examples before answering, then the question and the recipe throughout */}
          {smallTalk && (
            <>
              {/* In a lesson, before answering: the idea, then a flat answer beside a better one */}
              {smallTalk.lesson && !busy && (
                <section aria-label="The lesson" className="mt-8 md:mt-0">
                  {/* Its title */}
                  <h2 className="font-display text-statement tracking-tight">Lesson {smallTalk.lesson.number}: {smallTalk.lesson.title}</h2>
                  {/* The idea */}
                  <p className="mt-3 max-w-[52ch] text-lede">{smallTalk.lesson.idea}</p>
                  {/* What they said, in an asking or listening example */}
                  {smallTalk.lesson.example && <p className="mt-4 max-w-[52ch] text-lede"><span className="block text-footnote text-ink-muted">They say</span>&ldquo;{smallTalk.lesson.example}&rdquo;</p>}
                  {/* The flat answer */}
                  {smallTalk.lesson.flat && (
                    <p className="mt-4 max-w-[52ch] border-l-2 border-rule pl-4 text-lede text-ink-muted"><span className="block text-footnote">Flat</span>&ldquo;{smallTalk.lesson.flat}&rdquo;</p>
                  )}
                  {/* The better answer */}
                  <p className="mt-3 max-w-[52ch] border-l-2 border-accent pl-4 text-lede"><span className="block text-footnote text-ink-muted">{smallTalk.lesson.flat ? "Better" : "For example"}</span>&ldquo;{smallTalk.lesson.good}&rdquo;</p>
                  {/* Then */}
                  <p className="mt-6 text-footnote text-ink-muted">Your turn</p>
                </section>
              )}
              {/* Asking: who is speaking */}
              {(smallTalk.unit === "asking" || smallTalk.unit === "news") && <p className={`text-footnote text-ink-muted ${smallTalk.lesson && !busy ? "mt-1" : "mt-8 md:mt-0"}`}>{smallTalk.unit === "news" ? "They tell you" : "They say"}</p>}
              {/* A story to listen to, not shown */}
              {storyHidden ? (
                <h1 className="mt-8 font-display text-prompt tracking-tight md:mt-0 md:max-w-[18ch]">Listen to their story.</h1>
              ) : (
                // The question, remark or story, set like a headline (a story a size smaller)
                <h1 className={`relative font-display tracking-tight before:absolute before:-left-[0.42em] before:text-accent before:content-['“'] ${smallTalk.unit === "listening" ? "text-statement md:max-w-[30ch]" : "text-prompt md:max-w-[18ch]"} ${smallTalk.lesson && !busy ? "mt-1" : smallTalk.unit === "asking" || smallTalk.unit === "news" ? "mt-1" : "mt-8 md:mt-0"}`}>
                  {smallTalk.question}
                </h1>
              )}
              {/* A hidden story: why, and that it comes back in the results */}
              {storyHidden && !busy && <p className="mt-3 max-w-[48ch] text-lede">It is not shown, so you listen the way you would in person. Then respond out loud. You will see it afterwards.</p>}
              {/* While it is said aloud */}
              {stage === "asking" && <p role="status" className="mt-3 text-ink-muted">{unit ? "Listen. Recording starts when they finish." : "Listen to the question. Recording starts when it ends."}</p>}
              {/* The recipe */}
              <RecipeStrip level={stripLevel(earlierAnswers, smallTalk.unit)} focus={smallTalk.lesson?.beat ?? null} />
              {/* For a question about what you have been up to: your own moments from this week, as material */}
              {recentMoments.length > 0 && (
                <section aria-label="Your moments this week" className="mt-5 max-w-[52ch]">
                  {/* Small heading */}
                  <p className="text-footnote text-ink-muted">From your moments this week</p>
                  {/* Each moment, in the words it was said */}
                  <ul className="mt-1 space-y-1 text-footnote">
                    {/* One moment */}
                    {recentMoments.map((moment) => <li key={moment.id} className="border-l-2 border-rule pl-3">{moment.transcript}</li>)}
                  </ul>
                </section>
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
          {/* Free talk, before starting: what it is (decision 73) */}
          {mode === "free" && !recording && (
            <>
              {/* The invitation */}
              <h1 className="mt-8 font-display text-prompt font-semibold tracking-tight md:mt-0 md:max-w-[16ch] md:text-prompt-xl">Talk about anything.</h1>
              {/* A few ideas, and that there is no clock to beat */}
              <p className="mt-4 max-w-[48ch] text-lede">Your day, an idea, something you’d explain to a friend. Stop when you’re done.</p>
            </>
          )}
          {/* A short speech: the topic and the points, before and while speaking (smaller while speaking, so the voice shape stays in view) */}
          {mode === "outline" && outline && (
            <section aria-label="Your plan" className={recording ? "mt-6 md:mt-0" : "mt-8 md:mt-0"}>
              {/* The topic */}
              <h1 className={`font-display font-semibold tracking-tight ${recording ? "text-cue" : "text-statement md:max-w-[20ch]"}`}>{outline.topic}</h1>
              {/* The points, numbered */}
              <ol aria-label="Your points" className={`mt-3 flex max-w-[52ch] flex-col gap-2 ${recording ? "text-footnote" : "text-lede"}`}>
                {/* Each point */}
                {outline.points.map((point, index) => (
                  // One point on a rounded tile
                  <li key={index} className="flex items-start gap-3 rounded-2xl bg-card px-3 py-2">
                    {/* Its number */}
                    <span aria-hidden="true" className="flex size-7 flex-none items-center justify-center rounded-lg bg-warm-tint text-footnote font-semibold text-warm-ink">{index + 1}</span>
                    {/* The point */}
                    <span className="pt-0.5">{point}</span>
                  </li>
                ))}
              </ol>
              {/* Before starting, how to use them */}
              {!recording && <p className="mt-4 max-w-[48ch] text-footnote text-ink-muted">Open with why it matters, give each point an example, then close on one line.</p>}
            </section>
          )}
          {/* Thinking about a Record Response: the hints */}
          {thinking && angles.length > 0 && <Hints angles={angles} compact={false} />}
          {/* On a retry, the cue to carry in */}
          {!recording && (retryCue || ownNote) && (
            <div className="mt-6 max-w-md rounded-2xl bg-warm-tint p-4">
              {/* Small heading */}
              <p className="text-footnote text-ink-muted">Before you start</p>
              {/* The user's own note first, in their words */}
              {ownNote && <p className="mt-1 font-display text-cue">{ownNote}</p>}
              {/* The coach's cue, under it when both exist */}
              {retryCue && <p className={ownNote ? "mt-2 text-lede text-ink-muted" : "mt-1 font-display text-cue"}>{ownNote ? `${cueFromCoach ? "Coach" : "From your numbers"}: ${retryCue}` : retryCue}</p>}
            </div>
          )}

          {/* While recording: the meter and the words */}
          {recording && (
            <>
              {/* The live voice shape, with the clock inside */}
              <VoiceBlob levels={levels} signal={signal} clock={formatClock(elapsed)} onStop={() => void stop()} compact={!!script} paused={paused} />
              {/* Pause and discard, under the shape */}
              {!script && <TakeControls paused={paused} onPause={() => void pause()} onResume={resume} onDiscard={() => void discard()} />}
              {/* Words so far, the latest few lines, older ones fading (not while reading: the text itself is on screen) */}
              {(!script || textHidden) && <div className="mt-6 flex max-h-[3.7em] flex-col justify-end overflow-hidden text-cue [mask-image:linear-gradient(to_bottom,transparent,black_45%)]"><LiveWords text={text} marks={pauseWords} /></div>}
            </>
          )}

          {/* Nothing heard */}
          {stage === "nothing-heard" && <p role="alert" className="mt-6 max-w-[48ch] text-lede">I did not catch any words. Check that the right microphone is selected, then try again.</p>}
          {/* Too short */}
          {stage === "too-short" && <p role="alert" className="mt-6 max-w-[48ch] text-lede">That was under {shortest} seconds, too short to measure, so it was not saved. Take your time and keep going a little longer.</p>}

          {/* The speech service dropped mid-take: what was heard is saved, with the way to it */}
          {stage === "speech-dropped" && (
            <div role="alert" className="mt-6 max-w-[48ch] text-lede">
              {/* What happened */}
              <p>The browser’s speech service dropped, so recording stopped there. Everything heard up to then is saved, with the audio.</p>
              {/* The way to the take */}
              <p className="mt-4"><Link href={droppedHref} className={SECONDARY}>See your take</Link></p>
            </div>
          )}

          {/* Saving failed */}
          {stage === "save-failed" && <p role="alert" className="mt-6 max-w-[48ch] text-lede">This recording could not be saved. The browser said: “{saveError}” Try again; if it keeps happening, check that this site may store data on this device.</p>}
          {/* The one action for this stage, on the voice shape (the bottom band went with decision 75): large in the column, or small in the corner beside text to read */}
          {(stage === "ready" || stage === "nothing-heard" || stage === "too-short" || stage === "save-failed" || stage === "discarded" || (problem && problem !== "speech-unsupported")) && (
            <StartBlob compact={!!script} onStart={begin} label={stage === "discarded" ? "Start again" : problem || stage === "nothing-heard" || stage === "too-short" || stage === "save-failed" ? "Try again" : mode === "talk" ? "Show my topic" : smallTalk ? findUnit(smallTalk.unit).words.hear : mode === "response" ? "Start thinking" : mode === "rehearse" ? "Start rehearsing" : passage || lesson ? "Start reading" : "Start speaking"} detail={mode === "talk" ? `${think} seconds to start` : smallTalk ? findUnit(smallTalk.unit).words.then : mode === "response" ? `${think / 60} minutes to prepare` : lengthText} />
          )}
          {/* Thinking about a Record Response: start speaking early */}
          {thinking && mode === "response" && <StartBlob compact={!!script} onStart={() => void start()} label="Ready" detail="start speaking" />}
          {/* A Table Topic's countdown: no early start, just the time left */}
          {thinking && mode === "talk" && <StatusBlob compact={!!script} label="Get ready" detail={`starting in ${Math.ceil(thinkLeft)}`} />}
          {/* While a small-talk question is said aloud */}
          {stage === "asking" && <StatusBlob compact={!!script} label="Listening…" detail={findUnit(smallTalk?.unit ?? "answering").words.then} />}
          {/* Waiting for the microphone */}
          {stage === "starting" && <StatusBlob compact={!!script} label="Starting…" detail="allow the microphone" />}
          {/* Saving */}
          {stage === "saving" && <StatusBlob compact={!!script} label="Saving…" detail="one moment" />}
          {/* Push the footer down */}
          <div className="flex-1" />

          {/* A way home when stuck on a problem */}
          {problem && (
            <Footnote>
              <Link href="/" className={TEXT_LINK}>Back to Today</Link>
            </Footnote>
          )}

        </div>
      </div>
    </main>
  );
}
