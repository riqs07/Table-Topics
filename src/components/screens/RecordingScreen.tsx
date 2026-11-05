"use client";
// The recording screen: shows the prompt, records speech with a live transcript and level meter, and saves the session

// Load React's state, effect, reference, and callback tools
// Load the page fade round a glide (decision 141)
import { PageFade } from "@/components/scenes/SharedScene";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load focus mode's thin header, its key caps and its page layout (second pass)
import { Key, LevelBars, PRACTICE_BODY, PRACTICE_COLUMNS, PRACTICE_MAIN, PracticeBar, SingingBlob } from "@/components/script/PracticeBar";
// Load the cast, for your blob singing while you speak
import { Cast } from "@/components/scenes/Cast";
// Load the card and label looks
import { BUBBLE, CARD, CHIP, LAB, LAB_ON_TINT } from "@/components/script/textStyles";
// Load the weekly focus, which is the one goal when nothing else sets one
import { currentFocus, type Focus } from "@/core/focus";
// Load the never-firing subscription used to tell the browser apart from the server
import { subscribeToNothing } from "@/components/screens/screenBasics";
// Load the recording contracts
import type { AudioCapture, LiveText, LiveTranscriber, RecordingProblem, RecordingServices } from "@/audio/services";
// Load the prompt lookup
import { STRUCTURE_HINT, TABLE_TOPICS, findPrompt } from "@/content/prompts";
// Load the text to read by id (a full speech's text loads only when a part of one is asked for)
import { useReading } from "@/components/screens/useReading";
// Load the lesson lookup
import { findLesson } from "@/content/lessons";
// Load the filler marker
import { markFillers } from "@/core/fillers";
// Load the live reading tools
import { followReading, readingTokens, scriptWords, scrollGuide, stampFirstRead, stampSpoken, type ReadingToken } from "@/core/liveReading";
// Load the stress marker, so a reading's key words show in bold while reading (decision 111)
import { markStress } from "@/core/stressMarks";
// Load the speech-or-silence threshold, for scrolling at the reader's pace
import { speechThreshold } from "@/core/pauses";
import { memoryLadder, talkSections, type Ladder } from "@/core/eventPrep";
// Load the recording length rules
import { LOUDNESS_TICK_MS, formatClock, loopWindow, maxSeconds, minSeconds, readingSeconds, speakingWindow, targetSeconds, thinkSeconds, timeSignal, timingCue, windowSignal, type SpeakingWindow, type TimeSignal } from "@/core/recordingRules";
// Load the 4/3/2 loop's rounds and addresses (decision 118)
import { isLoopMode, LOOP_ROUNDS, loopHref, roundTarget } from "@/core/fourThreeTwo";
// Load the guided course rules: a part by id and where a course take goes once saved (decision 131)
import { afterTakeHref, findPart } from "@/core/courses";
// Load the pause-word setting rule
import { pauseWordsShown } from "@/core/pauseWords";
// Load the space bar shortcut choice
import { readSpaceShortcut } from "@/data/spaceShortcut";
// Load the timing tones choice and player type
import { readTimingTones } from "@/data/timingTones";
import type { CuePlayer } from "@/audio/timingTones";
// Load the reading metronome: its saved choice, tempo range and player type (decision 128)
import { readMetronome, saveMetronome, type MetronomeChoice } from "@/data/metronome";
import { DEFAULT_TEMPO, MAX_TEMPO, MIN_TEMPO } from "@/core/metronome";
import type { Metronome } from "@/audio/metronome";
// Load the switch row
import { CheckRow } from "@/components/script/CheckRow";
// Load the Rapid Fire topic draw and its order (decision 133)
import { TopicDraw } from "@/components/script/TopicDraw";
import { drawSteps } from "@/core/topicDraw";
// Load the choice of showing a story's template while telling (decision 130)
import { readStoryTemplateShown, saveStoryTemplateShown } from "@/data/storyTemplateShown";
// Load the shared browser repository
import { browserRepository } from "@/data/browserRepository";
// Load the record and repository types
import type { CheckInPart, CourseTake, SessionMode, SessionRecord, StoryTake, TalkRecord } from "@/data/records";
// Load the check-in's parts, for a take inside the weekly check-in (decision 100)
import { CHECK_IN_PARTS, CHECK_IN_PART_INFO } from "@/core/checkIn";
// Load the story prompts and moment seeds, and the plan card (decision 92)
import { momentIdOf, seedText } from "@/content/stories";
import { StoryPlanCard, StoryPointers } from "@/components/script/StoryPlanCard";
// Load the guided stories and their card, shown in place of the shape card (decision 93)
import { findGuidedStory } from "@/content/guidedStories";
import { GuidedStoryCard } from "@/components/script/GuidedStoryCard";
// Load the short-speech plan type
import type { Outline } from "@/core/outline";
import type { Repository } from "@/data/repository";
// Load the recording saver
import { saveRecording } from "@/data/saveRecording";
// Load the deeper-analysis sender and the saved passphrase (decision 91)
import { requestDeepAnalysis } from "@/data/deepAnalysisClient";
import { readPassphrase } from "@/data/passphrase";
// Load where each kind of session belongs
import { sessionHome } from "@/core/sessionHome";
// Load the small-talk content, the strip's level, and the strip
import { asksWhatYouDid, findSmallTalk, findUnit, unitOf } from "@/content/smallTalk";
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
import { PRIMARY, QUIET, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the plain explanations of microphone and speech problems
import { ALLOW_STEPS, PROBLEM_TEXT } from "@/components/script/microphoneHelp";
// Load the check for what the browser did with the microphone, and the even-out factor (decision 81)
import { autoGainApplied } from "@/audio/microphoneSettings";
import { levelScale } from "@/core/voiceLevels";
// Load the mode tiles and the scene that glides in from the card that opened the screen (decision 141)
import { ModeTile } from "@/components/scenes/ModeTile";
import { SCENE_TILES } from "@/components/scenes/modeTileFor";
import { SharedScene } from "@/components/scenes/SharedScene";
// Load the scene and face names
import type { FaceName, SceneName } from "@/components/scenes/Scene";
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
  // Network function for deeper analysis (replaced in tests; decision 91)
  fetchFn?: typeof fetch;
  // For a told story: its shape, focus and length (on a retelling, read from the telling before instead; decision 92)
  story?: StoryTake | null;
  // Inside the weekly check-in: which check-in and which part; the take is saved as a marker and the check-in carries on (decision 100)
  checkIn?: { id: string; part: CheckInPart } | null;
  // A round of a 4/3/2 loop: the loop's id (null before the first round is saved) and the round, 1 to 3 (decision 118)
  loop?: { id: string | null; round: number } | null;
  // A take inside a guided course: its part and try, or its prompt coming back days later; saved on the take, which then goes back to the course (decision 131)
  course?: CourseTake | null;
}

// Whether motion is welcome (no "reduce motion" setting), for the Rapid Fire topic draw (decision 133); not in a browser, or unable to tell, means no
function motionWelcome(): boolean {
  // Asked of the browser
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
}

// A story's set-up when none is given: Classic, no focus, full length (decision 92)
// The modes whose start screen shows their scene, with the mode's name and what it is (decision 141)
const READY_SCENES: Partial<Record<SessionMode, { scene: SceneName; name: string; line: string }>> = {
  // Rapid Fire
  talk: { scene: "rapid-fire", name: "Rapid Fire", line: "A surprise question, 1 to 2 minutes" },
  // A prepared speech
  response: { scene: "prepared-speech", name: "Prepared speech", line: "Plan for 2 minutes, speak for 2 to 4" },
  // Free talk
  free: { scene: "free-talk", name: "Free talk", line: "Talk about anything, as long as you like" },
};

// Opened from Today, the screens whose step shows a scene there carry it over too: small talk and rehearsing your talk (decision 141)
const TODAY_SCENES: Partial<Record<SessionMode, { scene: SceneName; name?: string; line: string }>> = {
  // Small talk (its own screen already names the question)
  smalltalk: { scene: "conversation", line: "A quick chat, about a minute." },
  // Rehearsing your talk
  rehearse: { scene: "your-talk", name: "Your talk", line: "Run it start to finish" },
};

const DEFAULT_STORY: StoryTake = { template: "lesson", focus: null, length: "full" };

// What a story is about: the prompt from the bank, a guided story's title, or the moment note's words once loaded (decisions 92 and 93)
function storyPromptText(promptId: string, momentText: string | null): { id: string; text: string } | undefined {
  // A prompt from the bank, or a guided story
  const seed = seedText(promptId);
  // Its words
  if (seed) return { id: promptId, text: seed.text };
  // A moment note, once read (an empty note still has its story to tell)
  return momentText === null ? undefined : { id: promptId, text: momentText || "Your moment" };
}

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
function LiveWords({ text, marks = true, card = false }: { text: LiveText; marks?: boolean; card?: boolean }) {
  // In the words card (second pass): the settled words quieter, the words still being heard in bold ink, pause words softly highlighted
  if (card) {
    // The words, large and easy to read
    return (
      <p className="text-xl leading-relaxed text-ink-muted">
        {/* Settled words, piece by piece */}
        {(marks ? markFillers(text.final) : [{ text: text.final, filler: false }]).map((piece, index) =>
          // Fillers softly highlighted, everything else plain
          piece.filler ? <mark key={index} className="rounded-md bg-art-sun/35 px-1 text-ink">{piece.text}</mark> : <span key={index}>{piece.text}</span>,
        )}
        {/* Words still being worked out, in bold */}
        {text.interim && <b className="font-bold text-ink"> {text.interim}</b>}
      </p>
    );
  }
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
function TimingLight({ signal, mode, promptId, storyLength, given = null }: { signal: TimeSignal; mode: SessionMode; promptId: string; storyLength: StoryTake["length"]; given?: SpeakingWindow | null }) {
  // The window given (a 4/3/2 round's, decision 118), or the one for a Table Topic, a prepared speech, small talk or a story
  const window = given ?? speakingWindow(mode, promptId, storyLength);
  // The words for this kind of session
  const words = window ? windowSignalText(window) : RESPONSE_SIGNAL_TEXT;
  // The words, announced politely when they change (no separate name, so the words themselves are read)
  return (
    <span role="status" data-signal={signal} className="text-footnote font-normal text-ink-muted">
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
    <div className="mt-5 grid gap-5 border-t-2 border-rule pt-4 md:grid-cols-2">
      {/* The structure */}
      <div>
        {/* Small heading */}
        <p className={LAB}>A simple shape</p>
        {/* The steps in order */}
        <ol className="mt-2 space-y-1">
          {/* One step per line */}
          {STRUCTURE_HINT.map((step) => <li key={step.label}><b className="font-extrabold">{step.label}</b> <span className="font-bold text-ink-muted">{step.detail}</span></li>)}
        </ol>
      </div>
      {/* The angles */}
      <div>
        {/* Small heading */}
        <p className={LAB}>Angles to try</p>
        {/* One per line */}
        <ul className="mt-2 list-disc space-y-1 pl-5 font-bold">
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
export function RecordingScreen({ promptId, mode, retryOf, services, navigate, repository, clock: givenClock, sectionIndex = null, ladder: startingLadder = "full", questionIndex = 0, planStep = null, outline: givenOutline = null, fetchFn, story: givenStory = null, checkIn = null, loop: givenLoop = null, course = null }: RecordingScreenProps) {
  // The course part this take belongs to, when inside a course (decision 131)
  const coursePlace = course ? findPart(course.part) : undefined;
  // A 4/3/2 round, only for the kinds it is offered for (decision 118)
  const loop = givenLoop && isLoopMode(mode) ? givenLoop : null;
  // The loop's id: from the address, or made when the first round is saved (kept, so a second save attempt keeps it)
  const loopId = useRef<string | null>(loop?.id ?? null);
  // A told story's set-up: from the address, or (on a retelling) from the telling before (decision 92)
  const [storyTake, setStoryTake] = useState<StoryTake>(givenStory ?? DEFAULT_STORY);
  // A guided story's facts and nudges, when the story is one (decision 93)
  const guidedStory = mode === "story" ? findGuidedStory(promptId) : undefined;
  // For a story from one of the user's moment notes, the note's words (loaded below)
  const [momentText, setMomentText] = useState<string | null>(null);
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
  // The reading metronome, made during a tap, since browsers only let sound start from one (decision 128)
  const metronome = useRef<Metronome | null>(null);
  // The metronome choice saved in this browser, read only in the browser so the first draw matches the server's (T4)
  const savedMetronomeOn = useSyncExternalStore(subscribeToNothing, () => readMetronome().on, () => false);
  const savedTempo = useSyncExternalStore(subscribeToNothing, () => readMetronome().tempo, () => DEFAULT_TEMPO);
  // A choice made on this screen, which wins over the saved one
  const [metronomeChange, setMetronomeChange] = useState<MetronomeChoice | null>(null);
  // The choice in force
  const metronomeChoice = metronomeChange ?? { on: savedMetronomeOn, tempo: savedTempo };
  // Whether a story's template shows while telling: the saved choice, read only in the browser so the first draw matches the server's (T4), until changed on this screen (decision 130)
  const savedTemplateShown = useSyncExternalStore(subscribeToNothing, readStoryTemplateShown, () => true);
  // A choice made on this screen, which wins over the saved one
  const [templateShownChange, setTemplateShownChange] = useState<boolean | null>(null);
  // The choice in force
  const templateShown = templateShownChange ?? savedTemplateShown;
  // A Rapid Fire topic being drawn: the topics flicking past, the real one last; null when no draw is under way (decision 133)
  const [draw, setDraw] = useState<string[] | null>(null);
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
  const think = loop && loop.round > 1 ? 0 : thinkSeconds(mode);
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

  // The prompt's heading, focused when a Rapid Fire topic is revealed so it is read out
  const promptHeading = useRef<HTMLHeadingElement>(null);
  // The message after a take that was not kept, scrolled into view and focused so it is seen and read (below a long passage it would be off screen)
  const notice = useRef<HTMLDivElement>(null);

  // For a Q&A answer, the question (loaded from the session it belongs to, below)
  const [qaQuestion, setQaQuestion] = useState<string | null>(null);
  // The prompt to speak to (for reading aloud, its title; for a Q&A answer, the question)
  const prompt = mode === "qa" ? (qaQuestion ? { id: promptId, text: qaQuestion } : undefined) : mode === "story" ? storyPromptText(promptId, momentText) : findPrompt(promptId);
  // Its words, which stay the same between draws (for the Rapid Fire topic draw, decision 133)
  const promptText = prompt?.text ?? null;
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
  // The text on screen: a passage (its key words starred, decision 111), a lesson's practice text, or the talk being rehearsed
  const script = passage ? { title: passage.title, source: passage.source, body: markStress(passage.body, passage.stress ?? []) } : lesson ? { title: `Lesson ${lesson.number}: ${lesson.title}`, source: "", body: lesson.body } : talk ? { title: talk.title, source: section !== null ? `Your talk · section ${section + 1} of ${sections.length}` : "Your talk", body: talkText } : null;
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
    // Fetch the question's audio ahead of the tap (a drill read on a card has no voice; decision 95)
    if (findUnit(unitOf(promptId)).drill === "heard") services.prepareSpeech?.(promptId);
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

  // For a story from a moment note, load the note's words (decision 92)
  useEffect(() => {
    // The note's id, when the story came from one
    const momentId = mode === "story" ? momentIdOf(promptId) : null;
    // Nothing to load
    if (!momentId) return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Read the note
    repo.getSession(momentId).then((moment) => {
      // Keep its words if still open
      if (!cancelled) setMomentText(moment?.transcript ?? "");
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [mode, promptId, repo]);

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
  // A 4/3/2 round's target and window, scaled from the prepared speech's lights (decision 118)
  const loopTarget = loop && isLoopMode(mode) ? roundTarget(mode, storyTake.length, loop.round) : null;
  // (its window)
  const roundWindow = loopTarget !== null ? loopWindow(loopTarget) : null;
  // Target and limit for this kind of session (a story's depend on its length; a round's on its target)
  const target = loopTarget ?? targetSeconds(mode, promptId, storyTake.length);
  // The limit: half a minute past a round's grace, so going over can be seen
  const limit = roundWindow ? roundWindow.limit + 30 : maxSeconds(mode, promptId, storyTake.length);
  // The shortest recording kept
  const shortest = minSeconds(mode, promptId);

  // On a retry, load last time's cue
  useEffect(() => {
    // Nothing to load for a first try
    if (!retryOf) return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Read the first try with its readings, so the cue picked from its numbers is the same as on its page (decision 98)
    repo.getFullSession(retryOf).then((original) => {
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
      // A retold story keeps the telling before's shape, focus and length (decision 92)
      if (original?.story) setStoryTake(original.story);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, retryOf]);

  // Whether pause words are marked in the live words (decision 79; marked until Settings is read)
  const [pauseWords, setPauseWords] = useState(true);
  // The week's focus, the one goal shown while speaking when no retry cue or course goal sets one (second pass)
  const [weekFocus, setWeekFocus] = useState<Focus | null>(null);
  // Whether the live words are hidden while speaking (some find them distracting)
  const [wordsHidden, setWordsHidden] = useState(false);
  // Read it once
  useEffect(() => {
    // Ignore the answer if the screen closes first
    let cancelled = false;
    // Read the settings
    repo.getSettings(clock()).then((settings) => {
      // Keep it if still open
      if (!cancelled) setPauseWords(pauseWordsShown(settings));
      // And the week's focus, as Today works it out
      if (!cancelled) setWeekFocus(currentFocus({ focusIndex: settings.focusIndex, focusStartedOn: new Date(settings.focusStartedOn) }, clock()).focus);
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
      const session = await saveRecording(repo, { id: crypto.randomUUID(), transcript: result.transcript, durationSec: result.durationSec, audio: result.audio, promptId, mode, retryOf, loudness: result.loudness, pitch: result.pitch, autoGain: result.autoGain, spokenTimes: result.spokenTimes, ...(textForFillers.current !== null ? { script: textForFillers.current } : {}), ...(result.scriptTimes ? { scriptTimes: result.scriptTimes } : {}), ...(mode === "rehearse" ? { sectionIndex: section } : {}), ...(mode === "qa" && qaQuestion ? { question: qaQuestion } : {}), ...(mode === "outline" && outline ? { outline } : {}), ...(mode === "story" ? { story: storyTake } : {}), ...(checkIn ? { checkIn } : {}), ...(loop && loopTarget !== null ? { loop: { id: (loopId.current ??= crypto.randomUUID()), round: loop.round, targetSec: loopTarget } } : {}), ...(course ? { course } : {}) }, clock());
      // Now there is practice worth keeping, ask the browser not to clear it (no wait; decision 64)
      void requestPersistentStorage();
      // Send the audio for deeper analysis when that setting is on (no wait, and it never fails: its outcome is kept as a quiet note on the take; decision 91)
      void requestDeepAnalysis(repo, session, { passphrase: readPassphrase(), now: clock(), ...(fetchFn ? { fetchFn } : {}) });
      // A moment note goes straight back to the Small talk page, where it is listed; a check-in part goes on to the next part (decision 100); a 4/3/2 round before the last goes on to the next round (decision 118); anything else opens its page (feedback is requested there)
      const next = course ? afterTakeHref(course, session.id) : mode === "moment" ? "/small-talk/unit?id=answering#moments" : checkIn ? "/check-in/run" : loop && loop.round < LOOP_ROUNDS && isLoopMode(mode) ? loopHref({ mode, promptId, story: mode === "story" ? storyTake : null, planStep }, loopId.current!, loop.round + 1) : `/sessions?id=${session.id}${planStep ? `&plan=${planStep}` : ""}`;
      // The speech service dropped: say so first, with the way to the take
      if (dropped) {
        // Where it is
        setDroppedHref(next);
        // Explain
        setStage("speech-dropped");
        // Done
        return;
      }
      // Go there (no question first: "How did that feel?" was dropped in decision 129)
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
  }, [checkIn, clock, course, fetchFn, loop, loopTarget, mode, navigate, outline, planStep, promptId, qaQuestion, repo, retryOf, section, shortest, storyTake]);

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
    // A topic draw is already under way: nothing to start
    if (draw) return;
    // A new take lets any discarded one go
    discarded.current = null;
    // Timing tones, if switched on: get the sound ready now, during the tap
    if (readTimingTones() && services.createCuePlayer) {
      // Make the player once
      cues.current ??= services.createCuePlayer();
      // Wake its sound
      cues.current.prime();
    }
    // The metronome, if switched on for reading aloud: get its sound ready now, during the tap (decision 128)
    if (mode === "read" && metronomeChoice.on && services.createMetronome) {
      // Make it once
      metronome.current ??= services.createMetronome();
      // Wake its sound
      metronome.current.prime();
      // Tick from now (the effect below only hears changes, and it may already count as ticking)
      metronome.current.start(metronomeChoice.tempo);
    }
    // The start itself: a small-talk question is asked aloud first (a moment, situation or flat question read on a card is not; decision 95), a Table Topic or prepared speech counts down, anything else records
    // A Rapid Fire topic seen for the first time is drawn first, where motion is welcome; the countdown starts once it lands (decision 133)
    const drawFirst = mode === "talk" && stage === "ready" && promptText !== null && motionWelcome();
    // The start: the question asked, the draw, the countdown, or recording
    const go = smallTalk && findUnit(smallTalk.unit).drill === "heard" ? () => void ask(smallTalk.question) : drawFirst ? () => setDraw(drawSteps(promptText!, TABLE_TOPICS.map((topic) => topic.text), Date.now())) : think > 0 ? beginThinking : () => void start();
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
  }, [ask, beginThinking, draw, metronomeChoice.on, metronomeChoice.tempo, mode, needsPrimer, promptText, services, smallTalk, stage, start, think]);

  // The drawn topic has landed: the countdown starts (decision 133)
  const landTopic = useCallback(() => {
    // The draw is over
    setDraw(null);
    // Count down
    beginThinking();
  }, [beginThinking]);

  // Switch the metronome on or off, and remember it (decision 128)
  const switchMetronome = useCallback(
    (on: boolean) => {
      // Switching on is a tap: make the player and wake its sound now
      if (on && services.createMetronome) {
        // Make it once
        metronome.current ??= services.createMetronome();
        // Wake its sound
        metronome.current.prime();
      }
      // The new choice
      const choice = { on, tempo: metronomeChoice.tempo };
      // Remember it in this browser
      saveMetronome(choice);
      // Show it
      setMetronomeChange(choice);
    },
    [metronomeChoice.tempo, services],
  );

  // Change the metronome's tempo, and remember it (decision 128)
  const changeTempo = useCallback(
    (tempo: number) => {
      // The new choice
      const choice = { on: metronomeChoice.on, tempo };
      // Remember it in this browser
      saveMetronome(choice);
      // Show it
      setMetronomeChange(choice);
    },
    [metronomeChoice.on],
  );

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
        // While thinking about a Record Response or planning a story, start early (a Table Topic's countdown cannot be skipped)
        else if (stage === "thinking" && (mode === "response" || mode === "story")) void start();
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

  // The metronome ticks while it is on and the reader is getting ready or reading, never while paused or once the take is done (decision 128)
  const ticking = mode === "read" && metronomeChoice.on && !paused && (stage === "ready" || stage === "starting" || stage === "recording" || stage === "nothing-heard" || stage === "too-short" || stage === "save-failed" || stage === "discarded");
  // Start or stop it to match (it exists only once a tap has made it)
  useEffect(() => {
    // Tick at the chosen tempo
    if (ticking) metronome.current?.start(metronomeChoice.tempo);
    // Or stay quiet
    else metronome.current?.stop();
  }, [ticking, metronomeChoice.tempo]);
  // Let its sound go when the screen closes
  useEffect(
    () => () => {
      // Stop and close it, if one was made
      metronome.current?.close();
      // Forget it
      metronome.current = null;
    },
    [],
  );

  // Keep the screen on while thinking and speaking, so the phone does not lock mid-speech (decision 76)
  const holdAwake = stage === "thinking" || stage === "recording";
  // Hold it for as long as that lasts
  useEffect(() => (holdAwake ? holdScreenAwake() : undefined), [holdAwake]);

  // Whether recording is under way
  const recording = stage === "recording";
  // The problem to explain, if any
  const problem = typeof stage === "object" ? stage.problem : null;
  // Focus mode while speaking without text to read (second pass, the Recording reference): the question and your singing blob on the left, your one goal and your words on the right
  const focusTake = recording && !script;
  // The round Stop button, which takes focus as recording starts, so the keyboard and screen readers land on it
  const stopButton = useRef<HTMLButtonElement>(null);
  // Focus it each time a take starts
  useEffect(() => {
    // In focus mode, or beside text to read
    if (recording) stopButton.current?.focus({ preventScroll: true });
  }, [recording]);
  // Length wording for this kind of session
  const lengthText = loopTarget !== null ? `${formatClock(loopTarget)} this round` : goalSeconds ? `a ${formatClock(goalSeconds)} goal` : script ? `about ${Math.max(1, Math.round(readingSeconds(script.body) / 60))} min` : mode === "warmup" ? `${target} seconds` : speakingWindow(mode, promptId, storyTake.length) ? `${formatClock(speakingWindow(mode, promptId, storyTake.length)!.start)} to ${formatClock(speakingWindow(mode, promptId, storyTake.length)!.end)}` : mode === "qa" ? `a ${formatClock(target)} goal` : mode === "moment" ? "under a minute" : mode === "free" ? "as long as you like" : "about a minute";
  // Whether the thinking countdown is showing
  const thinking = stage === "thinking";
  // Whether this kind of session has a timing light
  const hasLight = mode === "talk" || mode === "response" || mode === "smalltalk" || mode === "story" || mode === "qa" || ((mode === "rehearse" || mode === "outline") && !!goalSeconds);
  // Whether a take is under way (no way out but discard, and no clock in the masthead)
  const busy = recording || thinking || !!draw || stage === "asking" || stage === "starting" || stage === "saving";
  // Where this kind of session belongs, for the close button (practising hides the tab bar); a check-in part goes back to the check-in (decision 100)
  const home = checkIn ? { section: "today" as const, href: "/check-in/run", label: "Close, back to your check-in" } : sessionHome(mode, promptId, planStep !== null);
  // Asking or listening, in small talk
  const unit = smallTalk && smallTalk.unit !== "answering" ? findUnit(smallTalk.unit) : null;
  // A story to listen to is not shown before answering, except in a lesson (you listen the way you would in person)
  const storyHidden = smallTalk?.unit === "listening" && !smallTalk.lesson;
  // The label above a small-talk drill: who is speaking, or what is shown on the card
  const cue = smallTalk ? findUnit(smallTalk.unit).words.cue : null;
  // Whether the drill is a described moment or situation rather than words someone says (decision 95)
  const described = !!smallTalk && findUnit(smallTalk.unit).drill === "situation";
  // The page title for this kind of session (a check-in part by its own name, decision 100)
  const title = checkIn ? CHECK_IN_PART_INFO[checkIn.part].name : retryOf ? (mode === "story" ? "Tell it again" : "Second try") : mode === "story" ? "Story" : mode === "warmup" ? "Warm-up" : mode === "talk" ? "Rapid Fire" : mode === "response" ? "Prepared speech" : mode === "read" ? "Read aloud" : mode === "pause" ? "Pause drill" : mode === "rehearse" ? "Rehearsal" : mode === "lesson" ? "Lesson" : mode === "qa" ? "Q&A answer" : mode === "smalltalk" ? "Small talk" : mode === "moment" ? "One moment" : mode === "free" ? "Free talk" : mode === "outline" ? "Short speech" : "Recording";
  // Name the tab after it
  usePageTitle(title);
  // The timing light now, while recording (off otherwise)
  const signal = recording && hasLight ? (roundWindow ? windowSignal(roundWindow, elapsed) : timeSignal(mode, elapsed, goalSeconds, promptId, storyTake.length)) : "none";
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
  // A Rapid Fire topic revealed: move focus to it, so a screen reader reads the topic rather than nothing (focus would otherwise fall to the page)
  const revealing = stage === "thinking" && mode === "talk";
  // Each time the countdown starts
  useEffect(() => {
    // Only when the topic has just appeared
    if (revealing) promptHeading.current?.focus();
  }, [revealing]);
  // Whether a take just ended without being kept
  const notKept = stage === "too-short" || stage === "nothing-heard" || stage === "save-failed";
  // Each time one does: bring the reason into view and move focus to it
  useEffect(() => {
    // Only then
    if (!notKept) return;
    // Scroll it to the middle of the screen (it sits above any text to read), without animation when motion is unwelcome
    notice.current?.scrollIntoView?.({ block: "center", behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    // And focus it, so it is read out
    notice.current?.focus({ preventScroll: true });
  }, [notKept]);
  // The keyboard hint for this stage (a small-talk drill read on a card has nothing to hear, so its tap starts speaking; decision 96)
  const hint = recording ? "Space to stop · Esc to discard" : thinking ? (mode === "talk" ? "Esc to leave" : "Space to start speaking · Esc to leave") : mode === "talk" ? "Space to see your topic" : mode === "story" ? "Space to start planning" : mode === "smalltalk" ? (unit && unit.drill !== "heard" ? "Space to start speaking" : `Space to hear ${unit ? "them" : "the question"}`) : mode === "response" ? "Space to start thinking" : mode === "rehearse" ? "Space to start rehearsing" : passage || lesson ? "Space to start reading" : "Space to start";
  // After a Rapid Fire take that was not kept, the topic has been seen: it stays in view for the next try instead of hiding again
  const topicSeen = mode === "talk" && (stage === "nothing-heard" || stage === "too-short" || stage === "save-failed" || stage === "discarded");
  // A Table Topic keeps its question hidden until the countdown begins (and while recording it sits in the margin)
  const showPrompt = !recording && !!prompt && !script && !smallTalk && mode !== "story" && (mode !== "talk" || thinking || topicSeen);
  // A Table Topic's briefing, shown before the question is first seen
  const showBriefing = mode === "talk" && stage === "ready" && !draw;
  // This prompt's angles, for a Record Response
  const angles = mode === "response" ? (findPrompt(promptId)?.angles ?? []) : [];
  // Seconds left in a Rapid Fire countdown, as shown
  const countdown = Math.ceil(thinkLeft);
  // What the countdown says to screen readers: once at the start, then only the last three seconds (the shown number changes every second without being read)
  const countdownSpoken = countdown > 3 ? `${think} seconds to think. Recording starts by itself.` : countdown > 0 ? String(countdown) : "";

  // The one goal while speaking: last try's cue on a retry, a course part's goal, or the week's focus
  const goal = retryCue ? { head: retryCue, line: ownNote ? `Your note: ${ownNote}` : cueFromCoach ? "The coach’s cue from your last try." : "Picked from your last try’s numbers." } : coursePlace?.part.practice ? { head: coursePlace.part.practice.goal, line: null } : weekFocus ? { head: weekFocus.title, line: weekFocus.description } : null;
  // How far the take has got against its target, for the header's bar
  const share = recording ? Math.min(1, elapsed / Math.max(1, target)) : 0;
  // The bar: inside today's practice, the steps done plus this one's share; otherwise this take's share while recording
  const progress = planStep && plan ? (planStep - 1 + share) / Math.max(1, plan.steps.length) : recording ? share : null;
  // The latest five level readings, for the level bars
  const lastLevels = levels.slice(-5);
  // Which lamp of the three is lit
  const lamp = signal === "green" ? 0 : signal === "yellow" ? 1 : signal === "red" || signal === "overtime" ? 2 : -1;

  // Before the first ever recording: what the microphone is for, before the browser asks (the opening's layout: your blob listening, the words, one chunky button)
  if (stage === "mic-primer") {
    // Draw the explanation on its own
    return (
      <main id="main" className={PRACTICE_MAIN}>
        {/* Focus mode's bar: the way out and what this is */}
        <PracticeBar close={home} label={title} progress={0} />
        {/* The explanation, centred */}
        <section aria-label="Your microphone" className={`${PRACTICE_BODY} flex max-w-xl flex-col items-center gap-4 pt-6 text-center md:pt-12`}>
          {/* Your blob, listening */}
          <StageRing face="listen" />
          {/* What it is for */}
          <h1 className="font-display text-3xl leading-tight font-semibold md:text-4xl">VoiceLab listens through your microphone.</h1>
          {/* Where recordings go, and who turns speech into text (the browser's speech recognition usually sends the audio to Apple or Google; decision 97) */}
          <p className="max-w-[48ch] text-lede">VoiceLab keeps your recordings on this device. To show your words, your browser’s speech recognition turns them into text; on most phones and in Chrome, Apple or Google does that on their servers. Choose Allow next.</p>
          {/* Let the browser ask */}
          <button type="button" onClick={() => void allowMicrophone()} className={`${PRIMARY} mt-2 w-full max-w-sm`}>Allow microphone<span className="sr-only">, your browser asks next</span></button>
          {/* Back without asking */}
          <button type="button" onClick={() => setStage("ready")} className={QUIET}>Not now</button>
        </section>
      </main>
    );
  }

  // Whether the screen waits for a start (first time, or again after a take that was not kept or a problem)
  const waiting = !draw && (stage === "ready" || stage === "nothing-heard" || stage === "too-short" || stage === "save-failed" || stage === "discarded" || (!!problem && problem !== "speech-unsupported"));
  // Whether this is a second go after something went wrong
  const goingAgain = !!problem || stage === "nothing-heard" || stage === "too-short" || stage === "save-failed";
  // The start's words for this kind of session
  const startLabel = stage === "discarded" ? "Start again" : goingAgain ? "Try again" : loop && loop.round > 1 ? `Start round ${loop.round}` : mode === "talk" ? "Show my topic" : smallTalk ? findUnit(smallTalk.unit).words.hear : mode === "response" ? "Start thinking" : mode === "story" ? "Plan it" : mode === "rehearse" ? "Start rehearsing" : passage || lesson ? "Start reading" : "Start speaking";
  // What happens after the start, said under it (a later 4/3/2 round says it in its own line)
  const startDetail = loop && loop.round > 1 ? null : mode === "talk" ? `${think} seconds to think, then you speak` : smallTalk ? findUnit(smallTalk.unit).words.then : mode === "response" ? `${think / 60} minutes to prepare` : mode === "story" ? "Up to a minute, then tell it" : null;
  // The length to aim for, as a chip
  const aimText = mode === "free" ? "No time limit" : `Aim for ${lengthText}`;
  // The mode's tile and name, carried over from the Practice card or Today's step (decision 141), before starting only
  const badge = stage === "ready" && !busy && !problem && !loop ? (planStep !== null && TODAY_SCENES[mode] ? TODAY_SCENES[mode] : !script && !smallTalk ? READY_SCENES[mode] : mode === "read" ? { scene: "read-aloud" as const, name: "Read aloud", line: aimText } : undefined) : undefined;
  // The goal before a retry: your own note first, the cue under it; otherwise the same one goal as while speaking
  const goalBefore = retryCue || ownNote ? { head: ownNote ?? retryCue ?? "", line: ownNote && retryCue ? `${cueFromCoach ? "Coach" : "From your numbers"}: ${retryCue}` : cueFromCoach ? "The coach’s cue from your last try." : "Picked from your last try’s numbers.", label: "Before you start" } : goal ? { ...goal, label: "Your one goal" } : null;
  // The small label above the headline: what this moment is
  const stageWord = thinking ? (mode === "talk" ? "Think" : mode === "story" ? "Plan it in your head" : "Prepare") : stage === "asking" ? "Listen" : stage === "saving" ? "Saving" : goingAgain || stage === "discarded" ? "Try again" : "Get ready";
  // The cross: a link out before and after a take, a button that discards a take under way (the same as Esc, with its undo), none while the microphone starts or the take saves
  const closeNow = stage === "saving" || stage === "starting" || stage === "asking" || draw ? null : recording ? { href: home.href, label: "Discard this take" } : thinking ? { href: home.href, label: "Leave without speaking" } : home;

  // The way the take ended without being kept, or a problem, or a discard: one card, first in the column, focused when it appears
  const notices = (
    <>
      {/* A discarded take, which can be brought back for a few seconds */}
      {stage === "discarded" && (
        <div role="status" className={`flex w-full max-w-[48ch] flex-wrap items-center gap-3 px-5 py-4 text-left ${CARD}`}>
          {/* What happened */}
          <span className="min-w-0 flex-1 font-bold">Take discarded.</span>
          {/* Bring it back */}
          <button type="button" onClick={() => void undoDiscard()} className={SECONDARY}>Undo</button>
        </div>
      )}
      {/* A take that was not kept, and why: scrolled to and focused (so it is never left off screen below a long passage) */}
      {notKept && (
        <div ref={notice} tabIndex={-1} role="alert" data-testid="not-kept" className="w-full max-w-[48ch] rounded-[22px] bg-warm-tint px-5 py-4 text-left text-lede font-bold text-warm-ink outline-none">
          {/* Nothing heard */}
          {stage === "nothing-heard" && <p>I did not catch any words. Check that the right microphone is selected, then try again.</p>}
          {/* Too short */}
          {stage === "too-short" && <p>That was under {shortest} seconds, too short to measure, so it was not saved. Take your time and keep going a little longer.</p>}
          {/* Saving failed */}
          {stage === "save-failed" && <p>This recording could not be saved. The browser said: “{saveError}” Try again; if it keeps happening, check that this site may store data on this device.</p>}
        </div>
      )}
      {/* A problem, explained plainly, with how to allow a blocked microphone on each kind of device */}
      {problem && (
        <div className="w-full max-w-[52ch] rounded-[22px] bg-warm-tint px-5 py-4 text-left text-warm-ink">
          {/* What is wrong */}
          <p role="alert" className="text-lede font-bold">{PROBLEM_TEXT[problem]}</p>
          {/* A blocked microphone: the steps, then try again */}
          {problem === "microphone-blocked" && (
            <>
              {/* The steps */}
              <ul aria-label="How to allow the microphone" className="mt-3 list-disc space-y-2 pl-5 text-lede">
                {/* One per device */}
                {ALLOW_STEPS.map((step) => <li key={step}>{step}</li>)}
              </ul>
              {/* Then */}
              <p className="mt-3 text-lede font-bold">Then press Try again.</p>
            </>
          )}
        </div>
      )}
      {/* The speech service dropped mid-take: what was heard is saved, with the way to it */}
      {stage === "speech-dropped" && (
        <div role="alert" className={`w-full max-w-[48ch] px-5 py-4 text-left text-lede ${CARD}`}>
          {/* What happened */}
          <p>The browser’s speech service dropped, so recording stopped there. Everything heard up to then is saved, with the audio.</p>
          {/* The way to the take */}
          <p className="mt-4"><Link href={droppedHref} className={PRIMARY}>See your take</Link></p>
        </div>
      )}
    </>
  );

  // The one chunky action for this stage (start, start early, try again), what happens next under it, and the quiet ways round it inside today's practice
  const action = (
    <>
      {/* Ready, or ready again: one chunky start */}
      {waiting && <button type="button" onClick={begin} data-variant="start" className={`${PRIMARY} w-full ${script ? "" : "max-w-sm"}`}>{startLabel}</button>}
      {/* Thinking about a prepared speech or planning a story: start speaking early */}
      {thinking && (mode === "response" || mode === "story") && <button type="button" onClick={() => void start()} data-variant="start" className={`${PRIMARY} w-full ${script ? "" : "max-w-sm"}`}>Ready<span className="sr-only">, {mode === "story" ? "start telling" : "start speaking"}</span></button>}
      {/* What happens next */}
      {waiting && startDetail && !goingAgain && stage !== "discarded" && <p className="text-footnote font-bold text-ink-muted">{startDetail}</p>}
      {/* Inside today's practice, before speaking: a warm-up first, or a way to put the step off without it counting as done (decisions 77 and 80) */}
      {skippable && !busy && (
        <span className="flex flex-wrap justify-center gap-x-4">
          {/* A minute of warm-up first, on the reading step */}
          {warmUpFirst && <Link href={warmUpFirst} className={TEXT_LINK}>Warm up first</Link>}
          {/* Put it off */}
          <button type="button" onClick={() => void skipForToday()} aria-label="Can’t speak now? Skip this step for today" className={`${TEXT_LINK} text-ink-muted`}>Can’t speak now?</button>
        </span>
      )}
      {/* A way home when stuck on a problem */}
      {problem && <Link href="/" className={TEXT_LINK}>Back to Today</Link>}
    </>
  );

  // Your blob where it will sing, for this stage: waiting in its ring, the countdown running down round it, or still while the microphone starts, a question is said or the take saves
  const stageBlob = (
    <>
      {/* A surprise question's countdown: a sun ring running down round your blob, the seconds left big under its face (storyboard "Rapid Fire countdown") */}
      {thinking && mode === "talk" && (
        <StageRing left={thinkLeft / Math.max(1, think)} face="flat" countdown>
          {/* The seconds left */}
          <span aria-hidden="true" className="font-display text-6xl leading-none font-semibold tabular-nums">{countdown}</span>
        </StageRing>
      )}
      {/* Thinking about a prepared speech or planning a story: the minutes running down in the ring */}
      {thinking && mode !== "talk" && (
        <StageRing left={thinkLeft / Math.max(1, think)} face="side" compact={!!script}>
          {/* The time left */}
          <span className="font-display text-4xl leading-none font-semibold tabular-nums">{formatClock(Math.ceil(thinkLeft))}</span>
        </StageRing>
      )}
      {/* Waiting: your blob in its still ring, ready (or wondering, after something went wrong) */}
      {waiting && <StageRing face={goingAgain ? "wonder" : "ready"} compact={!!script || goingAgain || stage === "discarded"} />}
      {/* A surprise question being drawn: the blob waits (decision 133) */}
      {draw && <StageRing face="flat" compact={!!script} />}
      {/* A question being said, the microphone starting, or the take saving: the blob still, with what is happening */}
      {(stage === "asking" || stage === "starting" || stage === "saving") && <StageRing face={stage === "asking" ? "listen" : stage === "saving" ? "happy" : "ready"} compact={!!script} />}
      {/* What the countdown says to screen readers: at the start and in the last three seconds only */}
      {thinking && mode === "talk" && <p role="status" data-testid="countdown-spoken" className="sr-only">{countdownSpoken}</p>}
      {/* Under it, what happens next */}
      {thinking && mode === "talk" && <p className="font-bold text-ink-muted">Recording starts by itself.</p>}
      {/* While a small-talk question is said aloud */}
      {stage === "asking" && <p role="status" className="font-bold text-ink-muted"><span className="block font-display text-xl text-ink">Listening…</span>{unit ? "Recording starts when they finish." : "Recording starts when the question ends."}</p>}
      {/* Waiting for the microphone */}
      {stage === "starting" && <p role="status" className="font-bold text-ink-muted"><span className="block font-display text-xl text-ink">Starting…</span>allow the microphone</p>}
      {/* Saving */}
      {stage === "saving" && <p role="status" className="font-bold text-ink-muted"><span className="block font-display text-xl text-ink">Saving…</span>one moment</p>}
    </>
  );

  // Where this take sits, above the headline: the check-in part, the course part and try, the 4/3/2 round (decisions 100, 118 and 131)
  const context = (
    <>
      {/* Inside the weekly check-in, which part this is */}
      {checkIn && <p className={`${LAB} text-accent-tint-ink`}>Weekly check-in · part {CHECK_IN_PARTS.indexOf(checkIn.part) + 1} of {CHECK_IN_PARTS.length}</p>}
      {/* Inside a guided course: the part and the try (or the comeback; the goal is the one goal card) */}
      {coursePlace?.part.practice && course && <p data-course-take className={`${LAB} text-accent-tint-ink`}>{coursePlace.course.title} · lesson {coursePlace.lessonNumber}, part {coursePlace.partNumber} · {course.revisit ? "back again" : `try ${course.attempt} of ${coursePlace.part.practice.tries}`}</p>}
      {/* A 4/3/2 round: which, and its time */}
      {loop && loopTarget !== null && <p data-loop-round className={`${LAB} text-accent-tint-ink`}>Told three times · round {loop.round} of {LOOP_ROUNDS} · {formatClock(loopTarget)}{loop.round > 1 && !busy ? ". Same content, less time." : ""}</p>}
      {/* Inside today's practice, which step this is, for screen readers (the bar shows it) */}
      {planStep && <p className="sr-only">Today’s practice · step {planStep}{plan ? ` of ${plan.steps.length}` : ""}</p>}
    </>
  );

  // The window this take is timed against, if any, for how it works
  const howWindow = roundWindow ?? speakingWindow(mode, promptId, storyTake.length);
  // The lights, in words
  const lightWords = howWindow ? `The light turns green at ${formatClock(howWindow.start)}, yellow at ${formatClock(howWindow.yellow)} and red at ${formatClock(howWindow.end)}.` : null;
  // The steps of a kind of session without its own plan card, from its real rules (the lights, the thinking time)
  const howSteps = mode === "talk" ? ["Your topic stays hidden until you press Show my topic.", `${think} seconds to think. Recording starts by itself.`, `Speak for ${lengthText}.${lightWords ? ` ${lightWords}` : ""}`] : mode === "response" ? (loop && loop.round > 1 ? [`The same content, ${lengthText}.`, ...(lightWords ? [lightWords] : [])] : [`${think / 60} minutes to prepare. Tap Ready to start early.`, `Speak for ${lengthText}.${lightWords ? ` ${lightWords}` : ""}`]) : mode === "free" ? ["Your day, an idea, something you’d explain to a friend.", "Stop when you’re done. There’s no clock to beat."] : mode === "warmup" ? [`Speak for ${lengthText}. It stops by itself.`] : [`Speak for ${lengthText}.`];

  // How this kind of session works, in the right column before starting (the extrapolation of the Recording reference's side column): a story's plan, small talk's lesson and recipe, a short speech's points, or the steps
  const howItWorks = mode === "story" ? (
    // A story: the template's beats (or a guided story's facts), the three pointers, and how planning works (decisions 92, 93 and 126)
    <section aria-label="Your story" className="flex flex-col gap-4">
      {/* The template's beats, or a guided story's facts */}
      {guidedStory ? <GuidedStoryCard story={guidedStory} take={storyTake} /> : <StoryPlanCard take={storyTake} />}
      {/* The three things every good story does */}
      {!guidedStory && <StoryPointers />}
      {/* How planning works, before it starts */}
      {!thinking && !busy && !(loop && loop.round > 1) && <p className="text-footnote font-bold text-ink-muted">Up to a minute to plan, then tell it out loud. Tap Ready when you are.</p>}
    </section>
  ) : smallTalk ? (
    // Small talk: a lesson's idea and examples, the recipe, and your own moments as material
    <>
      {/* In a lesson, before answering: the idea, then a flat answer beside a better one */}
      {smallTalk.lesson && !busy && (
        <section aria-label="The lesson" className={`px-5 py-5 ${CARD}`}>
          {/* Its title, as one piece of text so it reads (and is counted) as written */}
          <h2 className="font-display text-2xl leading-tight font-semibold">{`Lesson ${smallTalk.lesson.number}: ${smallTalk.lesson.title}`}</h2>
          {/* The idea */}
          <p className="mt-2 text-lede">{smallTalk.lesson.idea}</p>
          {/* Why it works, from the research, folded so the lesson stays short (decision 95) */}
          {smallTalk.lesson.why && <details className="mt-2 text-footnote text-ink-muted"><summary className="min-h-11 cursor-pointer content-center font-bold">Why it works</summary><p className="mt-1">{smallTalk.lesson.why}</p></details>}
          {/* What they said, or the moment, situation or flat question, in the example (a described moment is not quoted) */}
          {smallTalk.lesson.example && <p className="mt-3 text-lede"><span className={`block ${LAB}`}>{findUnit(smallTalk.unit).words.example}</span>{findUnit(smallTalk.unit).drill === "situation" ? smallTalk.lesson.example : `“${smallTalk.lesson.example}”`}</p>}
          {/* The flat answer */}
          {smallTalk.lesson.flat && <p className="mt-3 rounded-2xl bg-paper px-4 py-3 text-lede text-ink-muted"><span className={`block ${LAB}`}>Flat</span>{`“${smallTalk.lesson.flat}”`}</p>}
          {/* The better answer */}
          <p className="mt-2 rounded-2xl bg-accent-tint px-4 py-3 text-lede text-accent-tint-ink"><span className={`block ${LAB_ON_TINT}`}>{smallTalk.lesson.flat ? "Better" : "For example"}</span>{`“${smallTalk.lesson.good}”`}</p>
          {/* Then */}
          <p className={`mt-4 ${LAB}`}>Your turn</p>
        </section>
      )}
      {/* The recipe */}
      <RecipeStrip level={stripLevel(earlierAnswers, smallTalk.unit)} focus={smallTalk.lesson?.beat ?? null} lesson={!!smallTalk.lesson} />
      {/* For a question about what you have been up to: your own moments from this week, as material */}
      {recentMoments.length > 0 && (
        <section aria-label="Your moments this week" className={`px-5 py-4 ${CARD}`}>
          {/* Small heading */}
          <p className={LAB}>From your moments this week</p>
          {/* Each moment, in the words it was said */}
          <ul className="mt-2 space-y-1 text-footnote">
            {/* One moment */}
            {recentMoments.map((moment) => <li key={moment.id} className="border-l-2 border-rule pl-3">{moment.transcript}</li>)}
          </ul>
        </section>
      )}
    </>
  ) : mode === "outline" && outline ? (
    // A short speech: the points, numbered, and how to use them
    <OutlinePlan outline={outline} compact={false} />
  ) : (
    // The steps, numbered, with a prepared speech's shape and angles under them
    <section aria-label="How it works" className={`px-5 py-5 ${CARD}`}>
      {/* Small heading */}
      <p className={LAB}>How it works</p>
      {/* The steps */}
      <ol className="mt-3 flex flex-col gap-3">
        {/* One step a row, its number in a soft round */}
        {howSteps.map((step, index) => (
          // One step
          <li key={step} className="flex items-start gap-3">
            {/* Its number */}
            <span aria-hidden="true" className="flex size-7 flex-none items-center justify-center rounded-full border-2 border-rule text-footnote font-extrabold text-ink-muted">{index + 1}</span>
            {/* The step */}
            <span className="pt-0.5 font-bold">{step}</span>
          </li>
        ))}
      </ol>
      {/* A prepared speech's shape and angles */}
      {angles.length > 0 && <Hints angles={angles} compact={false} />}
    </section>
  );

  // Draw the page
  return (
    // Focus mode: the bar across the top, then the take's two columns on a computer and one on a phone; the stage's colours while the clock runs (decision 69)
    <PageFade>
      <main id="main" data-area={recording || thinking ? "stage" : undefined} className={`${PRACTICE_MAIN} ${script ? "max-md:pb-48" : ""}`}>
        {/* Focus mode's bar (shared with every practice screen): the way out (a button that discards a take under way), how far through, what this is and the step, and the keyboard hints as key caps (only with a mouse or trackpad) */}
        <PracticeBar close={closeNow} onClose={recording || thinking ? () => void discard() : undefined} label={`${title}${planStep ? ` · step ${planStep}${plan ? ` of ${plan.steps.length}` : ""}` : ""}`} progress={progress ?? 0} hints={<span data-keyboard-hint className="hidden items-center gap-1.5 keyboard:inline-flex">{hint.split(" · ").map((part, index) => <span key={part} className="inline-flex items-center gap-1.5">{index > 0 && " "}<Key>{part.split(" ")[0]}</Key>{` ${part.split(" ").slice(1).join(" ")}`}</span>)}</span>} />

        {/* With text to read (Read aloud, a pause drill, a lesson, a rehearsal; the Read aloud reference): the text on the left, your blob and the action in a card on the right */}
        {script && (
          <div className={`${PRACTICE_BODY} ${PRACTICE_COLUMNS}`}>
            {/* The text */}
            <div className="flex min-w-0 flex-col">
              {/* Where this take sits */}
              <div className="mb-2 flex flex-col gap-1 empty:hidden">{context}</div>
              {/* A take that ended without being kept, or a problem: first, above the text */}
              <div className="mb-4 flex flex-col gap-3 empty:hidden">{notices}</div>
              {/* While recording: one status line (recording or paused, and the timing words) */}
              {recording && (
                <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {/* Recording or paused */}
                  <p role="status" className="flex items-center gap-2 text-footnote font-extrabold text-warm-ink">
                    {/* The warm dot (breathes only while recording and when motion is welcome) */}
                    <span aria-hidden="true" className={`inline-block size-2.5 rounded-full bg-warm ${paused ? "" : "motion-safe:animate-breathe"}`} />
                    {/* The word */}
                    {paused ? "Paused" : "Recording"}
                  </p>
                  {/* The timing words, or (on a phone) the length to aim for */}
                  {hasLight ? <TimingLight signal={signal} mode={mode} promptId={promptId} storyLength={storyTake.length} given={roundWindow} /> : <span className="text-footnote font-bold text-ink-muted md:hidden">{aimText}</span>}
                </div>
              )}
              {/* What kind of reading this is, small, then the title (the Read aloud reference) */}
              <p className={LAB}>{title}</p>
              {/* The title */}
              <h1 className="mt-1 font-display text-3xl leading-tight font-semibold md:text-4xl">{script.title}</h1>
              {/* Who said it, or that it is a practice passage */}
              {!recording && script.source && <p className="mt-1 font-bold text-ink-muted">{script.source}</p>}
              {/* A lesson's tip, before starting */}
              {!recording && lesson && (
                <div className="mt-4 max-w-[52ch] rounded-[22px] bg-accent-tint px-5 py-4 text-accent-tint-ink">
                  {/* Small heading */}
                  <p className="text-xs font-extrabold tracking-[.07em] uppercase">The tip</p>
                  {/* The tip itself */}
                  <p className="mt-1 text-lede font-bold">{lesson.tip}</p>
                </div>
              )}
              {/* When rehearsing, the memory ladder: full text, cue words, or nothing, as pills */}
              {mode === "rehearse" && (
                <div role="group" aria-label="How much text to show" className="mt-4 flex flex-wrap gap-2">
                  {/* One button per rung */}
                  {LADDER_RUNGS.map((rung) => (
                    // The current rung in the accent's tint
                    <button key={rung.ladder} type="button" aria-pressed={ladder === rung.ladder} onClick={() => setLadder(rung.ladder)} className={`inline-flex min-h-11 items-center rounded-full border-2 px-4 font-extrabold ${ladder === rung.ladder ? "border-accent bg-accent-tint text-accent-tint-ink" : "border-rule bg-card text-ink-muted hover:text-ink"}`}>
                      {rung.name}
                    </button>
                  ))}
                </div>
              )}
              {/* For a pause drill, how it works */}
              {!recording && mode === "pause" && <p className="mt-4 max-w-[52ch] text-lede">Pause for a second at each ‖.</p>}
              {/* A lesson, a pause drill or a list of tricky words: what good looks like and how it will be shown, before starting (decision 117) */}
              {!recording && (lesson?.goal ?? passage?.goal) && <p data-goal className="mt-3 max-w-[52ch] text-footnote"><span className="font-semibold">Goal:</span> {lesson?.goal ?? passage?.goal}</p>}
              {/* The words to read, large enough to read from a distance, unless hidden to practise from memory */}
              {!textHidden && <ScriptText tokens={tokens} place={recording ? place : null} guide={recording ? Math.max(place, guide) : null} className={`mt-5 whitespace-pre-line px-5 py-5 text-xl leading-[2] md:px-8 md:py-7 md:text-2xl ${CARD}`} />}
              {/* What the marks mean, while reading */}
              {!textHidden && recording && (
                <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold text-ink-muted">
                  {/* The next word */}
                  <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-4.5 rounded-[5px] bg-accent/15" />the next word</span>
                  {/* A stressed word */}
                  <span><b className="text-ink">Bold</b> a word to lean on</span>
                  {/* A pause mark */}
                  {tokens.some((token) => token.kind === "pause") && <span><span className="text-accent">‖</span> pause here</span>}
                </p>
              )}
              {/* Reading from memory: the words so far, the latest few lines, older ones fading */}
              {recording && textHidden && <div className="mt-6 flex max-h-[3.7em] flex-col justify-end overflow-hidden text-cue [mask-image:linear-gradient(to_bottom,transparent,black_45%)]"><LiveWords text={text} marks={pauseWords} /></div>}
            </div>

            {/* The side: your blob and the one action in a card (a bar along the bottom of a phone, never over the text), then the metronome */}
            <aside aria-label="Your take" className="flex flex-col gap-4 lg:sticky lg:top-6">
              {/* The card: a bar at the bottom of a phone (the page leaves room for it), a card on a computer (decision 89) */}
              <div data-shape-place className="flex flex-col items-center gap-3 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-20 max-md:border-t-2 max-md:border-rule max-md:bg-paper-raised max-md:px-4 max-md:pt-3 max-md:pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:rounded-[22px] md:border-2 md:border-rule md:bg-card md:px-6 md:py-6 md:text-center md:shadow-card">
                {/* The mode's tile, carried over (decision 141) */}
                {badge && <div className="self-stretch max-md:hidden"><ModeBadge {...badge} /></div>}
                {/* While recording: your blob, the clock, the level, Start over and the round Stop, with Pause under them; a row along the bottom on a phone */}
                {recording && (
                  <div data-script-take className="flex items-center gap-3 md:flex-col md:gap-4">
                    {/* Your blob, singing or resting */}
                    <span aria-hidden="true" className="flex max-md:hidden">{paused ? <Cast who="you" face="ready" still className="size-28" /> : <SingingBlob className="size-28" />}</span>
                    {/* The clock and your level */}
                    <span className="flex items-center gap-3">
                      {/* The clock */}
                      <b className="font-display text-3xl leading-none font-semibold text-ink tabular-nums md:text-5xl">{formatClock(elapsed)}</b>
                      {/* Your level */}
                      <span role="img" aria-label="Microphone level" className="flex max-md:hidden"><LevelBars levels={levels} /></span>
                    </span>
                    {/* Start over and the round Stop */}
                    <span className="flex items-center gap-3 md:gap-4">
                      {/* Start over: discards this take, which can be brought back for a few seconds */}
                      <button type="button" onClick={() => void discard()} className={`${QUIET} whitespace-nowrap max-md:px-3`}>Start over</button>
                      {/* Stop: the take is done */}
                      <button ref={stopButton} type="button" onClick={() => void stop()} aria-label="Stop" data-variant="stop" className="flex size-16 flex-none items-center justify-center rounded-full bg-ink shadow-stop transition-[transform,box-shadow] duration-100 motion-safe:active:translate-y-[3px] md:size-20">
                        {/* The stop square */}
                        <span aria-hidden="true" className="size-6 rounded-lg bg-paper-raised md:size-7" />
                      </button>
                    </span>
                    {/* Pause or resume */}
                    <button type="button" onClick={paused ? resume : () => void pause()} className={`${TEXT_LINK} text-ink-muted`}>{paused ? "Resume" : "Pause"}</button>
                  </div>
                )}
                {/* Otherwise your blob where it will sing (on a computer), the length, and the one action */}
                {!recording && (
                  <>
                    {/* The blob and what is happening */}
                    <div className="flex flex-col items-center gap-2 text-center max-md:hidden">{stageBlob}</div>
                    {/* On a phone, what is happening in words only */}
                    {(stage === "starting" || stage === "saving") && <p className="font-bold text-ink-muted md:hidden">{stage === "saving" ? "Saving…" : "Starting…"}</p>}
                    {/* The length to aim for (the tile says it when shown) */}
                    {!busy && !badge && <p className={`${CHIP} max-md:hidden`}>{aimText}</p>}
                    {/* The action */}
                    <div className="flex w-full flex-col items-center gap-2 empty:hidden">{action}</div>
                  </>
                )}
              </div>
              {/* Reading aloud: the metronome, before and while reading, on its own card under the shape (decision 128; the Read aloud reference) */}
              {mode === "read" && services.createMetronome && (
                <div data-metronome className={`flex flex-col gap-2 px-5 py-4 text-ink ${CARD}`}>
                  {/* Where the text comes from */}
                  {script.source && <p className="text-footnote font-bold text-ink-muted">{script.source}</p>}
                  {/* On or off */}
                  <CheckRow checked={metronomeChoice.on} onChange={(event) => switchMetronome(event.target.checked)} detail={!recording && metronomeChoice.on ? "A quiet tick to read in time with. Headphones keep it out of the recording." : undefined}>
                    Metronome
                  </CheckRow>
                  {/* The tempo, while on */}
                  {metronomeChoice.on && (
                    <label className="flex items-center gap-3 text-footnote text-ink-muted">
                      {/* The slider */}
                      <input type="range" min={MIN_TEMPO} max={MAX_TEMPO} step={1} value={metronomeChoice.tempo} onChange={(event) => changeTempo(Number(event.target.value))} aria-label="Metronome beats per minute" className="h-11 w-36 accent-accent" />
                      {/* The tempo in words */}
                      <span className="tabular-nums">{metronomeChoice.tempo} beats a minute</span>
                    </label>
                  )}
                </div>
              )}
              {/* A lesson keeps its tip in view while speaking */}
              {recording && lesson && <p className={`px-5 py-4 text-footnote font-bold text-ink-muted ${CARD}`}>{lesson.tip}</p>}
              {/* The length, on a phone, before starting */}
              {!busy && <p className="text-footnote font-bold text-ink-muted md:hidden">{lengthText}</p>}
            </aside>
          </div>
        )}

        {/* A reading, lesson or rehearsal whose text is not here (still loading, or a talk no longer on this device): the page's heading for screen readers and the keyboard, since nothing else draws one */}
        {(mode === "read" || mode === "pause" || mode === "lesson" || mode === "rehearse") && !script && !recording && <h1 className="sr-only">{title}</h1>}

        {/* Without text to read, before and after the take (the opening of the Recording reference, storyboard "Rapid Fire countdown"): the headline, your blob waiting where it will sing and one chunky start on the left; your one goal and how it works on the right */}
        {!script && !recording && (
          <div data-stage className={`${PRACTICE_BODY} flex flex-col gap-8 md:grid md:grid-cols-[repeat(auto-fit,minmax(360px,1fr))] md:items-start md:gap-10`}>
            {/* The left column: where this sits, the headline, your blob, the action */}
            <div className="flex min-w-0 flex-col items-center gap-4 text-center md:gap-5">
              {/* Where this take sits */}
              {context}
              {/* What this moment is */}
              <p className={`${LAB} ${thinking ? "text-warm-ink" : "text-accent-tint-ink"}`}>{title} · {stageWord}</p>
              {/* A take that ended without being kept, a problem or a discard */}
              {notices}
              {/* Before a surprise question: the topic hidden where it will appear */}
              {showBriefing && (
                <div className="w-full max-w-xl rounded-[22px] border-2 border-dashed border-rule px-6 py-5">
                  {/* The headline */}
                  <h1 className="font-display text-3xl leading-tight font-semibold text-ink-muted md:text-4xl">Your topic is hidden until you start.</h1>
                  {/* How it starts */}
                  <p className="mt-2 font-bold text-ink-muted">You get {think} seconds to think, then recording starts by itself.</p>
                </div>
              )}
              {/* A surprise question being drawn, in the headline's place (decision 133) */}
              {draw && <TopicDraw steps={draw} onDone={landTopic} />}
              {/* The question: a surprise question once shown (the same one again after a take that was not kept), a prepared speech's prompt, and the rest */}
              {showPrompt && prompt && (
                <>
                  {/* A surprise question already seen: say it is the same one for the next try */}
                  {topicSeen && <p className="text-footnote font-bold text-ink-muted">Same topic for your next try</p>}
                  {/* The question, big (focusable from code, so it can be read out the moment a surprise question is revealed) */}
                  <h1 ref={promptHeading} tabIndex={-1} className={QUESTION}>{prompt.text}</h1>
                </>
              )}
              {/* Free talk: the invitation (decision 73) */}
              {mode === "free" && <h1 className={QUESTION}>Talk about anything.</h1>}
              {/* A short speech: the topic */}
              {mode === "outline" && outline && <h1 className={QUESTION}>{outline.topic}</h1>}
              {/* A story: where it came from, then the prompt or the moment in your words (decisions 92 and 126) */}
              {mode === "story" && (
                <>
                  {/* Where it came from */}
                  <p className="text-footnote font-bold text-ink-muted">{momentIdOf(promptId) ? "From your moment" : guidedStory ? "Guided story" : "Your story"}</p>
                  {/* The prompt */}
                  <h1 className={momentIdOf(promptId) ? "font-display text-2xl leading-snug font-semibold md:max-w-[30ch]" : QUESTION}>{prompt?.text ?? "Your moment"}</h1>
                </>
              )}
              {/* Small talk: who is speaking or what is shown, then the question, remark or story (a story to listen to is not shown) */}
              {smallTalk && (
                <>
                  {/* The unit's cue */}
                  {cue && <p className="text-footnote font-bold text-ink-muted">{cue}</p>}
                  {/* The question, or the hidden story */}
                  {storyHidden ? <h1 className={QUESTION}>Listen to their story.</h1> : <h1 className={`font-display font-semibold ${described ? "" : "before:text-accent before:content-['“'] after:text-accent after:content-['”']"} ${smallTalk.unit === "listening" || described ? "text-2xl leading-snug md:max-w-[30ch]" : "text-3xl leading-tight md:max-w-[18ch] md:text-4xl"}`}>{smallTalk.question}</h1>}
                  {/* A hidden story: why, and that it comes back in the results */}
                  {storyHidden && !busy && <p className="max-w-[44ch] font-bold text-ink-muted">It is not shown, so you listen the way you would in person. Then respond out loud. You will see it afterwards.</p>}
                </>
              )}
              {/* Your blob where it will sing */}
              {stageBlob}
              {/* The length to aim for (not while counting down) */}
              {!thinking && !busy && <p className={CHIP}>{aimText}</p>}
              {/* The one action */}
              {action}
            </div>

            {/* The right column: the mode's tile, your one goal, and how it works */}
            <aside aria-label="Before you speak" className="flex min-w-0 flex-col gap-4.5">
              {/* The mode's tile and name, carried over from the Practice card or Today's step (decision 141) */}
              {badge && <ModeBadge {...badge} />}
              {/* Your one goal (not a story's, which Sage says under its plan) */}
              {goalBefore && mode !== "story" && (
                <div data-goal className="flex flex-col gap-2 rounded-[22px] bg-accent-tint px-5 py-4.5 text-accent-tint-ink">
                  {/* The small label */}
                  <span className="text-xs font-extrabold tracking-[.07em] uppercase">{goalBefore.label}</span>
                  {/* The goal */}
                  <span className="font-display text-2xl leading-tight font-semibold">{goalBefore.head}</span>
                  {/* What it means */}
                  {goalBefore.line && <span className="font-bold">{goalBefore.line}</span>}
                </div>
              )}
              {/* How it works, for this kind of session */}
              {howItWorks}
              {/* A story's one goal, from Sage, under its plan (the Story reference) */}
              {goalBefore && mode === "story" && (
                <div data-goal className="flex items-end gap-3">
                  {/* Sage */}
                  <Cast who="sage" mood="encouraging" className="size-14 flex-none" />
                  {/* The goal, in a bubble */}
                  <p className={`${BUBBLE} mb-1 text-footnote`}><span className="sr-only">{goalBefore.label}: </span><span>{goalBefore.head}</span>{goalBefore.line && <span className="block font-semibold text-ink-muted">{goalBefore.line}</span>}</p>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* Focus mode while speaking without text to read: on a computer the question, your blob, the clock and the controls on the left, your one goal and your words on the right; on a phone one column, the controls last (storyboard "Recording") */}
        {focusTake && (
          <div data-focus-take className={`${PRACTICE_BODY} flex flex-col gap-5 md:grid md:grid-cols-[repeat(auto-fit,minmax(360px,1fr))] md:items-start md:gap-10`}>
            {/* The left column */}
            <section aria-label="Your take" className="max-md:contents md:flex md:flex-col md:items-center md:gap-4.5 md:text-center">
              {/* Where this take sits */}
              <div className="flex flex-col items-center gap-1 empty:hidden max-md:order-1">{context}</div>
              {/* Recording or paused (the dot breathes only while recording and when motion is welcome) */}
              <p role="status" className="flex items-center gap-2 text-footnote font-extrabold text-warm-ink max-md:order-1 md:justify-center">
                {/* The dot */}
                <span aria-hidden="true" className={`inline-block size-2.5 rounded-full bg-warm ${paused ? "" : "motion-safe:animate-breathe"}`} />
                {/* The word */}
                {paused ? "Paused" : "Recording"}
              </p>
              {/* The question, big */}
              {prompt && !smallTalk && mode !== "outline" && <p className="font-display text-2xl leading-tight font-semibold max-md:order-2 md:max-w-[560px] md:text-4xl">{prompt.text}</p>}
              {/* Small talk's question, the page's heading as before speaking */}
              {smallTalk && <h1 className="font-display text-2xl leading-tight font-semibold max-md:order-2 md:max-w-[560px] md:text-3xl">{storyHidden ? "Listen to their story." : smallTalk.question}</h1>}
              {/* A short speech's topic, the page's heading as before speaking */}
              {mode === "outline" && outline && <h1 className="font-display text-2xl leading-tight font-semibold max-md:order-2 md:max-w-[560px] md:text-3xl">{outline.topic}</h1>}
              {/* Your blob singing inside pulsing rings, swelling a little with your voice */}
              <div aria-hidden="true" className="relative my-6 flex items-center justify-center self-center max-md:order-3">
                {/* The blob, singing in its rings (the shared one), or resting while paused */}
                <span className="flex transition-transform duration-150" style={{ transform: `scale(${paused ? 0.94 : 0.96 + (lastLevels.at(-1) ?? 0) * 0.12})` }}>{paused ? <Cast who="you" face="ready" still className="size-48 md:size-56" /> : <SingingBlob className="size-48 md:size-56" />}</span>
              </div>
              {/* The clock, the timing light and your level */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 max-md:order-4 md:gap-3.5">
                {/* The clock */}
                <b className="font-display text-4xl leading-none font-semibold tabular-nums md:text-5xl">{formatClock(elapsed)}</b>
                {/* The timing light as three lamps and its words */}
                {hasLight && (
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-rule bg-card px-3 py-1.5">
                    {/* The lamps: green, yellow, red, the one lit filled */}
                    <span aria-hidden="true" className={`size-3 rounded-full ${lamp === 0 ? "bg-light-green" : "bg-rule"}`} />
                    <span aria-hidden="true" className={`size-3 rounded-full ${lamp === 1 ? "bg-light-yellow" : "bg-rule"}`} />
                    <span aria-hidden="true" className={`size-3 rounded-full ${lamp === 2 ? "bg-light-red" : "bg-rule"}`} />
                    {/* The words */}
                    <TimingLight signal={signal} mode={mode} promptId={promptId} storyLength={storyTake.length} given={roundWindow} />
                  </span>
                )}
                {/* Without a light, the length to aim for */}
                {!hasLight && <span className="text-footnote font-bold text-ink-muted">{mode === "free" ? "As long as you like" : `Aim for ${lengthText}`}</span>}
                {/* Your level, the latest readings as five bars */}
                <span role="img" aria-label="Microphone level" className="flex"><LevelBars levels={levels} /></span>
              </div>
              {/* Start over, the round Stop, and hide the words (Pause under them) */}
              <div className="flex flex-col items-center gap-2 max-md:order-7 max-md:mt-2">
                {/* The row */}
                <div className="flex items-center gap-3 md:gap-5">
                  {/* Start over: discards this take, which can be brought back for a few seconds */}
                  <button type="button" onClick={() => void discard()} className={`${QUIET} whitespace-nowrap max-md:px-3`}>Start over</button>
                  {/* Stop: the take is done */}
                  <button ref={stopButton} type="button" onClick={() => void stop()} aria-label="Stop" data-variant="stop" className="flex size-23 flex-none items-center justify-center rounded-full bg-ink shadow-stop transition-[transform,box-shadow] duration-100 motion-safe:active:translate-y-[3px]">
                    {/* The stop square */}
                    <span aria-hidden="true" className="size-7.5 rounded-lg bg-paper-raised" />
                  </button>
                  {/* Hide or show the live words */}
                  <button type="button" onClick={() => setWordsHidden(!wordsHidden)} className={`${QUIET} whitespace-nowrap max-md:px-3`}>{wordsHidden ? "Show words" : "Hide words"}</button>
                </div>
                {/* Pause or resume */}
                <button type="button" onClick={paused ? resume : () => void pause()} className={`${TEXT_LINK} text-ink-muted`}>{paused ? "Resume" : "Pause"}</button>
              </div>
            </section>
            {/* The right column */}
            <aside aria-label="While you speak" className="max-md:contents md:flex md:flex-col md:gap-4.5 md:pt-1.5">
              {/* While telling a story: a switch to keep the template's beats (or a guided story's facts) in view, for a beginner, or out of the way (decision 130) */}
              {mode === "story" && (
                <div data-story-template className="max-md:order-6">
                  {/* Show or hide, remembered in this browser */}
                  <CheckRow
                    checked={templateShown}
                    onChange={(event) => {
                      // Remember it
                      saveStoryTemplateShown(event.target.checked);
                      // Show it
                      setTemplateShownChange(event.target.checked);
                    }}
                  >
                    {guidedStory ? "Show the facts" : "Show the template"}
                  </CheckRow>
                  {/* The template's beats in order (with any focus), or the guided story's facts */}
                  {templateShown && (guidedStory ? <GuidedStoryCard story={guidedStory} take={storyTake} /> : <StoryPlanCard take={storyTake} />)}
                </div>
              )}
              {/* Your one goal, on the accent's tint (a short cue on a phone) */}
              {goal && mode !== "story" && (
                <div data-goal className="flex flex-col gap-2 rounded-[22px] bg-accent-tint px-5 py-4.5 text-accent-tint-ink max-md:order-6 max-md:items-center max-md:bg-transparent max-md:p-0">
                  {/* The small label */}
                  <span className="text-xs font-extrabold tracking-[.07em] uppercase max-md:sr-only">Your one goal</span>
                  {/* The goal */}
                  <span className="font-display text-2xl leading-tight font-semibold max-md:rounded-full max-md:bg-accent-tint max-md:px-3 max-md:py-1 max-md:font-sans max-md:text-chip max-md:font-extrabold">{goal.head}</span>
                  {/* What it means */}
                  {goal.line && <span className="font-bold max-md:hidden">{goal.line}</span>}
                </div>
              )}
              {/* A story's one goal, from Sage, under the template (the Story reference) */}
              {goal && mode === "story" && (
                <div data-goal className="flex items-end gap-3 max-md:order-6">
                  {/* Sage */}
                  <Cast who="sage" mood="encouraging" className="size-14 flex-none" />
                  {/* The goal, in a bubble */}
                  <p className={`${BUBBLE} mb-1 text-footnote`}><span className="sr-only">Your one goal: </span>{goal.head}{goal.line ? ` ${goal.line}` : ""}</p>
                </div>
              )}
              {/* Your words, live */}
              <div className={`flex min-h-32 flex-col gap-2.5 px-5.5 py-5 max-md:order-5 md:min-h-65 ${CARD}`}>
                {/* The small label */}
                <span className={`${LAB} max-md:sr-only`}>Your words</span>
                {/* Hidden, still being heard */}
                {wordsHidden ? <p className="text-lede font-bold text-ink-muted">Words hidden. They’re still being heard.</p> : text.final || text.interim ? <LiveWords text={text} marks={pauseWords} card /> : <p className="text-lede font-bold text-ink-muted">Your words show here as you speak.</p>}
              </div>
              {/* Where the live words come from */}
              <p className="text-sm font-bold text-ink-muted max-md:order-8">The live words come from your browser’s speech service, so they’re rough.</p>
              {/* A short speech keeps its points in view while speaking */}
              {mode === "outline" && outline && <div className="max-md:order-8"><OutlinePlan outline={outline} compact /></div>}
              {/* Small talk keeps its recipe in view while speaking */}
              {smallTalk && <div className="max-md:order-8"><RecipeStrip level={stripLevel(earlierAnswers, smallTalk.unit)} focus={smallTalk.lesson?.beat ?? null} lesson={!!smallTalk.lesson} /></div>}
              {/* A prepared speech keeps its hints in view while speaking */}
              {angles.length > 0 && <div className="text-footnote text-ink-muted max-md:order-8"><Hints angles={angles} compact /></div>}
            </aside>
          </div>
        )}
      </main>
    </PageFade>
  );
}

// The question's look before and around a take: big, centred in its column (the Recording reference)
const QUESTION = "font-display text-3xl leading-tight font-semibold outline-none md:max-w-[560px] md:text-4xl";

// Your blob in the ring where it will sing (before, between and after takes; the Recording reference's place, storyboard "Rapid Fire countdown"): a still track, or the time left running down in sun, with anything under the face
function StageRing({ left = null, face = "ready", compact = false, countdown = false, children }: { left?: number | null; face?: FaceName; compact?: boolean; countdown?: boolean; children?: ReactNode }) {
  // The ring, the blob and what sits under its face
  return (
    <div data-countdown={countdown ? "" : undefined} className={`relative flex flex-none items-center justify-center ${compact ? "size-40" : "size-56 md:size-64"}`}>
      {/* The ring: its track, and the time left in sun when counting down */}
      <svg aria-hidden="true" viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90">
        {/* The track */}
        <circle cx="60" cy="60" r="54" fill="none" strokeWidth="7" className="stroke-rule" />
        {/* The time left */}
        {left !== null && <circle cx="60" cy="60" r="54" fill="none" strokeWidth="7" strokeLinecap="round" strokeDasharray="339.3" strokeDashoffset={339.3 * (1 - Math.max(0, Math.min(1, left)))} className="stroke-art-sun transition-[stroke-dashoffset] duration-200" />}
      </svg>
      {/* Your blob, and the time under it */}
      <span className="relative flex flex-col items-center">
        {/* The blob */}
        <Cast who="you" face={face} className={compact ? "size-20" : children ? "size-28" : "size-36 md:size-40"} />
        {/* The time, when counting */}
        {children}
      </span>
    </div>
  );
}

// The mode's tile and name, carried over from the card that opened it (decision 141): the tile that glides in, beside the mode's name and a short line, on the page with no banner round it
function ModeBadge({ scene, name, line }: { scene: SceneName; name?: string; line: string }) {
  // The kind's tile
  const tile = SCENE_TILES[scene];
  // The tile on the left, the words on the right
  return (
    <div data-scene-panel={scene} className="flex items-center gap-3.5 text-left">
      {/* The tile, playing three rounds as the screen opens, then still */}
      <SharedScene scene={scene}><span className="flex flex-none"><ModeTile ground={tile.ground} prop={tile.prop} face={tile.face} tilt={-4} scene={scene} className="size-16" /></span></SharedScene>
      {/* The words */}
      <p className="min-w-0">
        {/* The mode, unless the page's title says it */}
        {name && <span className="block font-display text-xl leading-tight font-semibold">{name}</span>}
        {/* What it is */}
        <span className={`block ${name ? "text-footnote font-bold text-ink-muted" : "font-bold"}`}>{line}</span>
      </p>
    </div>
  );
}

// A short speech's points, numbered on soft rows in a card, and how to use them before starting
function OutlinePlan({ outline, compact }: { outline: Outline; compact: boolean }) {
  // The card
  return (
    <section aria-label="Your plan" className={`px-5 py-5 ${CARD}`}>
      {/* Small heading */}
      <p className={LAB}>Your points</p>
      {/* The points, numbered */}
      <ol aria-label="Your points" className={`mt-3 flex flex-col gap-2 ${compact ? "text-footnote" : "text-lede"}`}>
        {/* Each point */}
        {outline.points.map((point, index) => (
          // One point on a soft row
          <li key={index} className="flex items-start gap-3 rounded-2xl bg-paper px-3 py-2">
            {/* Its number */}
            <span aria-hidden="true" className="flex size-7 flex-none items-center justify-center rounded-lg bg-warm-tint text-footnote font-semibold text-warm-ink">{index + 1}</span>
            {/* The point */}
            <span className="pt-0.5 font-bold">{point}</span>
          </li>
        ))}
      </ol>
      {/* Before starting, how to use them */}
      {!compact && <p className="mt-4 text-footnote font-bold text-ink-muted">Open with why it matters, give each point an example, then close on one line.</p>}
    </section>
  );
}
