"use client";
// A spoken conversation with a persona (decisions 83 and 84): they speak, you answer out loud and tap Done, for about three minutes; then it is saved and the coach reviews the whole conversation. With the coach set up, each conversation is in a new situation and every line is written for it and spoken in the persona's voice; without it, the persona says their recorded lines in their own situation

// Load React's state, ref, effect, callback and external-store tools
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the masthead
import { Masthead } from "@/components/script/Masthead";
// Load the shared button looks
import { PRESS, PRIMARY, QUIET, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the shared card look
import { CARD } from "@/components/script/textStyles";
// Load the voice shapes
import { StartBlob, StatusBlob, VoiceBlob } from "@/components/script/VoiceShapes";
// Load the microphone help
import { ALLOW_STEPS, PROBLEM_TEXT } from "@/components/script/microphoneHelp";
// Load the shared screen starting points
import { subscribeToNothing, useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the tab title
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the take recorder
import { useTakeRecorder, type TakeReading } from "@/components/screens/useTakeRecorder";
// Load the rules for ending a turn by itself (decision 101)
import { DEFAULT_TURN_ENDING, soundsLikeQuestion, startTurn, stepTurn, turnEndingOf, type TurnCue, type TurnEnding, type TurnState } from "@/core/endOfTurn";
// Load the iPhone check, where speech recognition is least reliable (decision 101)
import { isIosSafari } from "@/data/storageSafety";
// Load the personas and situations
import { DIFFICULTIES, difficultyOf, findDifficulty, findLine, findPersona, findScenario, goalFor, pickSituation, scenarioText, type ConversationGoal, type Persona, type Scenario } from "@/content/conversations";
// Load the measures, for the goal's count (decision 127)
import { goalProgress, measureConversation } from "@/core/conversationMeasures";
// Load the small-talk unit type, for a conversation opened from a unit page
import type { UnitId } from "@/content/smallTalk";
// Load the saved recordings, for each recorded line's length
import { voiceClip } from "@/content/voiceClips";
// Load the turn rules
import { CONVERSATION_LIMIT_SECONDS, END_AFTER_TURNS, isGoodbye, listeningLine, openingLine, scriptedNext, stageFor, yourTurnCount, type ConversationStage } from "@/core/conversationTurn";
// Load the clock formatter
import { LOUDNESS_TICK_MS, formatClock } from "@/core/recordingRules";
// Load where speech was heard in a turn, for its times (decision 120)
import { speechSpan } from "@/core/conversationTiming";
// Load the client that asks for the next line
import { isRefusal, nextLine, type LineRefusal, type LineRequest, type LineResult, type LineSegment, type WrittenLine } from "@/data/conversationClient";
// Load the saved passphrase
import { readPassphrase } from "@/data/passphrase";
// Load the saver
import { saveConversationSession } from "@/data/conversationSessions";
// Load the turn type
import type { ConversationDifficulty, ConversationTurn } from "@/data/records";
// Load the recording contracts
import type { RecordingServices } from "@/audio/services";
// Load the live listener (decision 119)
import { openLiveListener, type LiveEvents, type LiveMode, type LiveTurns } from "@/audio/liveListener";
// Load the live routes' client and the fallback lines
import { endLive, liveRefusalLine, startLive, type LiveRefusal, type LiveStart } from "@/data/liveClient";
// Load the phone call (decision 121)
import { startElevenLabsCall, type CallHandlers, type LiveCall, type StartCall } from "@/audio/liveCall";
// Load the call's overrides and transcript
import { CallTranscript, buildCallOverrides } from "@/core/liveCall";

// The longest one turn of yours runs before it ends by itself, in seconds
const MAX_TURN_SECONDS = 60;
// How far past the limit a turn of yours may run before it ends by itself, in seconds
const LIMIT_GRACE_SECONDS = 15;
// How long to wait after your turn before a listening sound plays, in milliseconds: none, so the "mm-hm" covers the wait as a person's would (decision 102)
const LISTEN_DELAY_MS = 0;
// Whether development-only readouts are shown (the time from the end of your turn to their first sound; decision 102)
const DEVELOPMENT = process.env.NODE_ENV !== "production";
// How long "I wasn't finished" stays after a turn ends by itself, in milliseconds (decision 101)
const UNDO_MS = 3_000;
// How long a key press or a screen reader moving focus holds off ending a turn by itself, in milliseconds
const HOLD_MS = 5_000;
// A focus change this soon after a tap came from the tap, not a keyboard or screen reader, in milliseconds
const POINTER_FOCUS_MS = 800;
// Steps in the countdown shown while a pause is noticed (redrawn only when a step changes)
const CUE_STEPS = 5;
// How long the live service takes to send the first words of you talking over the persona, in seconds (decision 120; a rough allowance for their times)
const BARGE_LAG_SECONDS = 0.5;
// The most times the persona cuts in on a long turn in one conversation, on hard (decision 120)
const MAX_CUT_INS = 2;

// How a turn of yours ended: a tap on Done, by itself when you stopped talking, the turn's timer, or the persona cutting in on a long turn (hard; decision 120)
type TurnEnd = "tap" | "auto" | "timer" | "cut";

// Where the conversation is
type Phase =
  // Before starting: the situation and what to practise
  | "intro"
  // The persona is speaking
  | "them"
  // Their next line is on its way
  | "thinking"
  // A phone call with the agent is under way (decision 121)
  | "call"
  // Your turn: the microphone starting, recording, or a problem to retry
  | "you"
  // Being saved
  | "saving"
  // Nothing was heard from you, so nothing was saved
  | "empty"
  // The connection dropped before you said anything, so nothing was saved
  | "lost"
  // Saving failed
  | "failed";

// Asks for the persona's next written line: the line, a refusal with its reason (the month's minutes, the conversation's cap), or null when it could not be written; a signal cancels it ("I wasn't finished", decision 101), and pieces of a streamed line go to onSegment as they arrive (decision 102)
export type WriteLine = (request: LineRequest, options?: { signal?: AbortSignal; onSegment?: (segment: LineSegment) => void }) => Promise<LineResult>;

// The real asker: the conversation route with the saved passphrase, streamed
const askRoute: WriteLine = (request, options) => nextLine(request, { passphrase: readPassphrase(), signal: options?.signal, onSegment: options?.onSegment });

// Whether the coach is set up on this device (a passphrase is saved)
const passphraseSaved = () => readPassphrase() !== "";

// Opens live step A for a conversation (decision 119): the listener and the seconds granted, or why not
export type OpenLive = (conversationId: string, events: LiveEvents) => Promise<{ live: LiveTurns; grantedSeconds: number } | { refused: LiveRefusal }>;

// Settles a live conversation: hands back the minutes it did not use
export type SettleLive = (conversationId: string, seconds: number) => void;

// The real opener: a token from our route, then the socket and the microphone; a failure after the token hands its minutes back at once
const openLiveRoute: OpenLive = async (conversationId, events) => {
  // The saved passphrase
  const passphrase = readPassphrase();
  // The token
  const started = await startLive("a", conversationId, { passphrase });
  // Refused
  if ("refused" in started) return started;
  // Not step A's
  if (started.grant.kind !== "a") return { refused: "unavailable" };
  // Opening can fail
  try {
    // The socket and the microphone
    return { live: await openLiveListener({ token: started.grant.token, events }), grantedSeconds: started.grant.grantedSeconds };
  } catch {
    // Nothing was used
    void endLive("a", conversationId, 0, { passphrase });
    // Said
    return { refused: "unavailable" };
  }
};

// The real settler
const settleLiveRoute: SettleLive = (conversationId, seconds) => {
  // Sent, never failing out loud
  void endLive("a", conversationId, seconds, { passphrase: readPassphrase() });
};

// Asks for a phone call's token (decision 121)
export type OpenCall = (conversationId: string) => Promise<LiveStart>;

// The real asker: the live route with the saved passphrase
const openCallRoute: OpenCall = (conversationId) => startLive("b", conversationId, { passphrase: readPassphrase() });

// The real call settler
const settleCallRoute: SettleLive = (conversationId, seconds) => {
  // Sent, never failing out loud
  void endLive("b", conversationId, seconds, { passphrase: readPassphrase() });
};

// What the conversation page is given
interface ConversationScreenProps extends ScreenProps {
  // Who to talk with
  characterId: string;
  // Only situations practising this skill (from a unit page), or every situation
  skill?: UnitId;
  // The situation picked for this conversation (Quick play or the situation list, decision 127), or none for the person's next one
  situationId?: string | undefined;
  // Start at once, without the Start button, when the page was opened by a tap (Quick play, decision 127)
  autostart?: boolean;
  // The browser's microphone, transcriber, capture and voice
  services: RecordingServices;
  // Where to go once saved (the router in the app)
  navigate: (path: string) => void;
  // How the next line is written (the route in the app, a fake in checks)
  writeLine?: WriteLine;
  // Whether the coach is set up (a saved passphrase in the app)
  coachReady?: () => boolean;
  // The clock (replaced in checks)
  clock?: () => Date;
  // How long to wait before a listening sound, in milliseconds (shorter in checks)
  listenDelayMs?: number;
  // How long "I wasn't finished" stays, in milliseconds (shorter in checks)
  undoMs?: number;
  // How live step A opens (the route and AssemblyAI in the app, a fake in checks; decision 119)
  openLive?: OpenLive;
  // How a live conversation is settled
  settleLive?: SettleLive;
  // After how many seconds of one turn the persona cuts in on hard (the level's own when left out; shorter in checks)
  cutInSeconds?: number;
  // How a phone call's token is asked for, how the call starts and how it is settled (the route and ElevenLabs' SDK in the app, fakes in checks; decision 121)
  openCall?: OpenCall;
  // (starting)
  startCall?: StartCall;
  // (settling)
  settleCall?: SettleLive;
}

// Draw the conversation with the persona named, or say they could not be found
export function ConversationScreen({ characterId, ...rest }: ConversationScreenProps) {
  // Who it is with
  const persona = findPersona(characterId);
  // Known: the conversation
  if (persona) return <Conversation persona={persona} {...rest} />;
  // Unknown: say so, with the way back
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-5xl flex-col bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Title and the way out */}
      <Masthead title="Conversation" nav={false} close={{ href: "/conversations", label: "Close, back to Conversations" }} />
      {/* What happened */}
      <h1 className="mt-8 font-display text-statement font-semibold tracking-tight">That person could not be found.</h1>
      {/* The way back */}
      <p className="mt-4"><Link href="/conversations" className={TEXT_LINK}>See everyone to talk with</Link></p>
    </main>
  );
}

// The goal, counted from your turns so far (decision 127)
function GoalChip({ goal, turns }: { goal: ConversationGoal; turns: ReadonlyArray<ConversationTurn> }) {
  // How far
  const progress = goalProgress(goal, measureConversation(turns));
  // What it counts
  const what = goal.kind === "questions" ? "Questions back" : "Follow-ups";
  // The chip
  return <p data-goal-chip className={`mt-2 inline-flex self-start rounded-full px-3 py-1 text-footnote font-semibold ${progress.met ? "bg-accent/15 text-accent" : "bg-paper text-ink-muted"}`}>{what}: {Math.min(progress.done, progress.target)} of {progress.target}{progress.met ? " ✓" : ""}</p>;
}

// The conversation itself
function Conversation({ persona, skill, situationId, autostart = false, services, navigate, writeLine = askRoute, coachReady = passphraseSaved, clock: givenClock, listenDelayMs = LISTEN_DELAY_MS, undoMs = UNDO_MS, openLive = openLiveRoute, settleLive = settleLiveRoute, cutInSeconds, openCall = openCallRoute, startCall = startElevenLabsCall, settleCall = settleCallRoute, ...props }: Omit<ConversationScreenProps, "characterId"> & { persona: Persona }) {
  // The repository once in the browser
  const { repo } = useScreenBasics(props);
  // The clock
  const [clock] = useState(() => givenClock ?? (() => new Date()));
  // Whether this browser can turn speech into text (worked out in the browser only)
  const supported = useSyncExternalStore(subscribeToNothing, () => services.speechSupported(), () => true);
  // Whether the coach is set up, so lines can be written (worked out in the browser only)
  const coach = useSyncExternalStore(subscribeToNothing, coachReady, () => false);
  // How a turn of yours ends, from Settings (automatically until read; decision 101)
  const [turnEnding, setTurnEnding] = useState<TurnEnding>(DEFAULT_TURN_ENDING);
  // Whether turns end by themselves (live falls back to this whenever it is not connected; decision 119)
  const auto = turnEnding !== "tap";
  // Whether live step A was chosen in Settings
  const liveChosen = turnEnding === "live";
  // Whether a phone call was chosen (decision 121)
  const callChosen = turnEnding === "call";
  // The call under way, its transcript, when it started and its time limit
  const call = useRef<{ live: LiveCall | null; transcript: CallTranscript; startedAt: number; timer: ReturnType<typeof setTimeout> | null; heard: boolean; retried: boolean; ending: boolean } | null>(null);
  // Whether the agent is speaking, for drawing
  const [callSpeaking, setCallSpeaking] = useState(false);
  // The one plain line when a call could not start
  const [callNote, setCallNote] = useState("");
  // Whether this conversation was a call, saved with it
  const usedCall = useRef(false);
  // Whether headphones are on, so talking over the persona stops them (decision 119; read outside drawing)
  const headphonesRef = useRef(false);
  // The live listener while connected (null otherwise)
  const live = useRef<LiveTurns | null>(null);
  // Whether live was connected at any point, saved with the conversation (decision 120)
  const usedLive = useRef(false);
  // How hard the persona makes it, from the last choice (decision 120)
  const [difficulty, setDifficulty] = useState<ConversationDifficulty>("normal");
  // When your turn's recording started, in seconds of the conversation (for its times)
  const turnStartedAt = useRef<number | null>(null);
  // When you started talking over the persona, in seconds of the conversation (live with headphones)
  const bargeAt = useRef<number | null>(null);
  // When a streamed line was first and last heard, in seconds of the conversation
  const streamedTimes = useRef<{ at: number; end: number } | null>(null);
  // How many times the persona has cut in on a long turn (hard; at most twice a conversation, so it is "now and then")
  const cutIns = useRef(0);
  // Whether live is connected, for drawing
  const [liveOn, setLiveOn] = useState(false);
  // The one plain line when live could not start or dropped
  const [liveNote, setLiveNote] = useState("");
  // Where the conversation is, for the live listener's events (which arrive outside drawing)
  const phaseRef = useRef<Phase>("intro");
  // The turn's end-of-speech tracker while one is under way (null otherwise)
  const detector = useRef<TurnState | null>(null);
  // Whether to use the longer waits (an iPhone)
  const conservative = useRef(false);
  // What the countdown shows, and the step last shown
  const [cue, setCue] = useState<TurnCue | null>(null);
  // (the step)
  const cueKey = useRef("");
  // When a key was last pressed or focus moved without a tap, so a turn never ends under someone mid-action
  const assistAt = useRef(Number.NEGATIVE_INFINITY);
  // When the screen was last tapped
  const pointerAt = useRef(Number.NEGATIVE_INFINITY);
  // The latest "done", for the readings to call
  const doneRef = useRef<(how: TurnEnd) => Promise<void>>(async () => undefined);
  // The latest "end", for the page hiding while live
  const endRef = useRef<() => Promise<void>>(async () => undefined);
  // Each reading while recording: track the turn and end it when the person has finished
  const onReading = useCallback((reading: TakeReading) => {
    // Only while a turn is tracked
    if (!detector.current) return;
    // Held for someone using a keyboard or screen reader
    const held = reading.atMs - assistAt.current < HOLD_MS;
    // One step
    const step = stepTurn(detector.current, { ...reading, held }, { conservative: conservative.current });
    // Kept
    detector.current = step.state;
    // The countdown's step
    const key = `${step.cue.phase}:${Math.floor(step.cue.progress * CUE_STEPS)}`;
    // Redrawn only when it changes
    if (key !== cueKey.current) {
      // Noted
      cueKey.current = key;
      // Shown
      setCue(step.cue);
    }
    // Ended: stop tracking and end the turn
    if (step.end) {
      // Not again
      detector.current = null;
      // End it (a turn at its longest length ends like the timer's)
      void doneRef.current(step.end === "silence" ? "auto" : "timer");
    }
  }, []);
  // The recorder's services: while live, each turn's words come from the live socket instead of the browser's speech recognition (decision 119)
  const recorderServices = useMemo<RecordingServices>(() => ({ ...services, createTranscriber: () => live.current?.turnTranscriber() ?? services.createTranscriber() }), [services]);
  // The recorder, listening for words (its clock is this turn's; the whole conversation's is in the header)
  const { recording, stopping, levels, elapsed: turnSeconds, problem, start, stop } = useTakeRecorder({ services: recorderServices, clock, raw: false, words: true, onReading });
  // Where the conversation is
  const [phase, setPhaseState] = useState<Phase>("intro");
  // Whether the settings were read, so Quick play starts with the right way of ending turns (decision 127)
  const [settingsRead, setSettingsRead] = useState(false);
  // Whether Quick play has started the conversation
  const autostarted = useRef(false);
  // The latest start, for Quick play
  const beginRef = useRef<() => Promise<void>>(async () => undefined);
  // Move to a phase: kept where the live listener's events can read it, and the live socket told what to send at once (the microphone on your turn; while the persona talks only with headphones, to notice you talking over them; silence otherwise, so their voice from a speaker is never heard as yours)
  const setPhase = (next: Phase) => {
    // Kept
    phaseRef.current = next;
    // Told
    live.current?.setMode(liveModeFor(next, headphonesRef.current));
    // Drawn
    setPhaseState(next);
  };
  // Their latest line, shown as they say it
  const [caption, setCaption] = useState("");
  // Whether your last turn was not caught
  const [missed, setMissed] = useState(false);
  // Seconds since the conversation started, ticking while it runs
  const [elapsed, setElapsed] = useState(0);
  // How many earlier conversations with them (null until read), so the situation moves on each time
  const [earlier, setEarlier] = useState<number | null>(null);
  // How many times "another situation" was tapped
  const [skipped, setSkipped] = useState(0);
  // Whether the coach could not be reached, so the recorded lines are used instead
  const [fellBack, setFellBack] = useState(false);
  // Every turn so far (kept outside rendering, since the turns run across several awaits)
  const turns = useRef<ConversationTurn[]>([]);
  // The same turns for drawing (the goal chip and the turn count, decision 127), kept in step with the ref
  const [turnsShown, setTurnsShown] = useState<ConversationTurn[]>([]);
  // Replace the turns, in the ref and for drawing
  function setTurns(next: ConversationTurn[]) {
    // The ref, read by the conversation's own steps
    turns.current = next;
    // For drawing
    setTurnsShown(next);
  }
  // When it started
  const startedAt = useRef<Date | null>(null);
  // Whether it is still running (false once ended or the page closes, so waiting steps stop)
  const alive = useRef(false);
  // Whether it is being saved, so it is saved once
  const saving = useRef(false);
  // Which run of turns is current: "I wasn't finished" moves it on, so the steps waiting on the cancelled reply stop
  const flow = useRef(0);
  // Whether the persona's line was cut short by a tap
  const interrupted = useRef(false);
  // The reply request under way, to cancel
  const asking = useRef<AbortController | null>(null);
  // Your words from a turn that was reopened, joined to what you say next
  const carried = useRef<{ text: string; seconds: number; at?: number } | null>(null);
  // Where to go back to if "I wasn't finished" is tapped: the conversation before that turn, and the turn's words
  const resumePoint = useRef<{ length: number; text: string; seconds: number; at?: number } | null>(null);
  // Whether "I wasn't finished" is shown
  const [canResume, setCanResume] = useState(false);
  // What a screen reader hears when the turn changes
  const [announcement, setAnnouncement] = useState("");
  // This conversation's random id, for the server's five-minute cap and the month's minutes (decision 102)
  const conversationId = useRef("");
  // Why the recorded lines are used instead of written ones: the coach could not be reached, or the month's minutes are used up
  const [fellBackWhy, setFellBackWhy] = useState<"unreachable" | "budget">("unreachable");
  // When your last turn ended, until their first sound (development readout)
  const turnEndedAt = useRef<number | null>(null);
  // How long their first sound took after your turn, in milliseconds (development readout)
  const [latency, setLatency] = useState<number | null>(null);
  // Name the tab
  usePageTitle(`Talk with ${persona.name}`);

  // Written lines when the coach is set up and was reached; otherwise the recorded lines
  const written = coach && !fellBack;
  // The situation picked for this conversation (decision 127), when it is a real one
  const picked = situationId ? findScenario(situationId) : undefined;
  // The situation: the one picked, else a new one each conversation with written lines; their own with recorded lines
  const situation: { scenario: Scenario; twist: number } = written ? (picked && skipped === 0 ? { scenario: picked, twist: (earlier ?? 0) % picked.twists.length } : pickSituation(persona, (earlier ?? 0) + skipped, skill)) : { scenario: findScenario(persona.home)!, twist: 0 };
  // Its goal (decision 127)
  const goal = goalFor(situation.scenario);
  // The situation
  const { scenario, twist } = situation;

  // Read how turns end, from Settings
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the settings
    repo.getSettings(clock()).then((settings) => {
      // Keep the choice while the page is open
      if (!cancelled) setTurnEnding(turnEndingOf(settings));
      // And whether headphones are on
      if (!cancelled) headphonesRef.current = settings.headphones === true;
      // And the last difficulty chosen
      if (!cancelled) setDifficulty(difficultyOf(settings.conversationDifficulty));
      // Read, so Quick play can start (decision 127)
      if (!cancelled) setSettingsRead(true);
    }).catch(() => {
      // Unreadable: the default stays, and Quick play can still start
      if (!cancelled) setSettingsRead(true);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [clock, repo]);

  // Count earlier conversations with them, so the situation moves on and the recorded opening changes
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the sessions
    void repo.listSessions().then((sessions) => {
      // Keep the count while the page is open
      if (!cancelled) setEarlier(sessions.filter((session) => session.mode === "conversation" && session.promptId === persona.id).length);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [persona.id, repo]);

  // Get the recorded lines ready, so the listening sounds (and, without the coach, every line) play at once
  useEffect(() => {
    // Each line
    for (const line of persona.lines) services.prepareSpeech?.(line.id);
  }, [persona, services]);

  // Stop the voice and every waiting step if the page closes mid-conversation, and close a live socket (billed while open)
  useEffect(() => () => {
    // No longer running
    alive.current = false;
    // Quiet
    services.stopSpeaking?.();
    // The live socket, if open
    const open = live.current;
    // Forgotten
    live.current = null;
    // Closed and settled
    if (open) void open.close().then((seconds) => settleLive(conversationId.current, seconds));
    // A call under way
    const calling = call.current;
    // Forgotten
    call.current = null;
    // Hung up and settled
    if (calling) {
      // No time limit left
      if (calling.timer) clearTimeout(calling.timer);
      // Hung up
      void calling.live?.end().catch(() => undefined);
      // Settled
      settleCall(conversationId.current, (clock().getTime() - calling.startedAt) / 1000);
    }
  }, [clock, services, settleLive, settleCall]);


  // Seconds since the start
  const secondsIn = () => (startedAt.current ? (clock().getTime() - startedAt.current.getTime()) / 1000 : 0);

  // Tick the clock while the conversation runs
  useEffect(() => {
    // Only while talking, or on a call
    if (phase !== "them" && phase !== "thinking" && phase !== "you" && phase !== "call") return;
    // Twice a second
    const timer = setInterval(() => setElapsed(startedAt.current ? (clock().getTime() - startedAt.current.getTime()) / 1000 : 0), 500);
    // Not once it stops
    return () => clearInterval(timer);
  }, [clock, phase]);

  // Add a turn
  function add(turn: ConversationTurn): ConversationTurn {
    // To the list
    setTurns([...turns.current, turn]);
    // Handed back, to be timed once said
    return turn;
  }

  // Add a turn's times once known (decision 120); nothing if the turn is gone ("I wasn't finished" went back before it)
  function stamp(turn: ConversationTurn | null, times: { at?: number; end?: number; cut?: boolean }) {
    // Nothing to time
    if (!turn) return;
    // That turn, timed
    setTurns(turns.current.map((each) => (each === turn ? { ...each, ...roundTimes(times) } : each)));
  }

  // Choose how hard the persona makes it, remembered for next time
  function chooseDifficulty(next: ConversationDifficulty) {
    // Shown
    setDifficulty(next);
    // Saved (a failure only loses the memory of the choice)
    void repo.getSettings(clock()).then((settings) => repo.saveSettings({ ...settings, conversationDifficulty: next })).catch(() => undefined);
  }

  // Say recorded lines in order, adding each to the conversation (or not, for a line that is not part of it); true if one was a goodbye
  async function sayRecorded(ids: ReadonlyArray<string>, keep = true): Promise<boolean> {
    // Not cut short yet
    interrupted.current = false;
    // The lines said (or started)
    const said: string[] = [];
    // Each line
    for (const id of ids) {
      // Stop if the conversation ended
      if (!alive.current) return false;
      // Cut short by a tap: skip the rest
      if (interrupted.current) break;
      // The line
      const line = findLine(persona, id);
      // Unknown: skip it
      if (!line) continue;
      // They are speaking
      setPhase("them");
      // Their words on screen
      setCaption(line.text);
      // Part of the conversation, counted as said even if it is cut short
      const added = keep ? add({ who: "them", text: line.text, lineId: line.id, seconds: voiceClip(line.id)?.seconds ?? 0 }) : null;
      // Said
      said.push(id);
      // When it started
      const at = secondsIn();
      // Say it (called straight away, so the first line plays within the Start tap)
      await services.speak?.(line.text, line.id).catch(() => null);
      // Its times, and whether it was cut short
      stamp(added, { at, end: secondsIn(), cut: interrupted.current });
    }
    // Whether it ended the conversation
    return keep && said.some((id) => isGoodbye(persona, id));
  }

  // Note the first sound after your turn, for the development readout
  function noteFirstSound() {
    // Only once per turn
    if (turnEndedAt.current === null) return;
    // How long it took
    setLatency(clock().getTime() - turnEndedAt.current);
    // Noted
    turnEndedAt.current = null;
  }

  // Say a written line, adding it to the conversation (or not, when asking you to say it again); true if it was a goodbye. A streamed line has already been played piece by piece
  async function sayWritten(line: WrittenLine, keep = true): Promise<boolean> {
    // Stop if the conversation ended
    if (!alive.current) return false;
    // Streamed: already said; kept, and the whole line shown
    if (line.streamed) {
      // The whole line
      setCaption(line.text);
      // Part of the conversation, with when it was heard
      const added = keep ? add({ who: "them", text: line.text, seconds: 0 }) : null;
      // Its times, when its pieces played
      if (streamedTimes.current) stamp(added, { ...streamedTimes.current, cut: interrupted.current });
      // Used
      streamedTimes.current = null;
      // Whether it ended the conversation
      return keep && line.goodbye;
    }
    // Not cut short yet
    interrupted.current = false;
    // They are speaking
    setPhase("them");
    // Their words on screen
    setCaption(line.text);
    // Part of the conversation, counted as said even if it is cut short
    const added = keep ? add({ who: "them", text: line.text, seconds: 0 }) : null;
    // Their first sound
    noteFirstSound();
    // When it started
    const at = secondsIn();
    // Say it in their voice, or the phone's own
    await services.speakAudio?.(line.audio, line.text).catch(() => undefined);
    // Its times, and whether it was cut short
    stamp(added, { at, end: secondsIn(), cut: interrupted.current });
    // Whether it ended the conversation
    return keep && line.goodbye;
  }

  // Ask for their next written line: a listening sound at once (not before their first line, when asking you to say it again, or after you asked a question), and a streamed line's pieces played in order as they arrive (decision 102)
  async function ask(stage: ConversationStage, heard: boolean): Promise<LineResult> {
    // Their next line is on its way
    setPhase("thinking");
    // Nothing cut short yet
    interrupted.current = false;
    // A way to cancel it ("I wasn't finished")
    const controller = new AbortController();
    // Kept, to cancel
    asking.current = controller;
    // A listening sound
    const sound: { playing: Promise<unknown> | null } = { playing: null };
    // No streamed line heard yet
    streamedTimes.current = null;
    // Your last words
    const yours = [...turns.current].reverse().find((turn) => turn.who === "you")?.text ?? "";
    // Wanted: not before their first line, when asking you to say it again, or after a question of yours (they answer it instead)
    const wanted = stage !== "open" && heard && !soundsLikeQuestion(yours);
    // Play it, kept out of the conversation
    const playSound = () => {
      // Only while still running
      if (!alive.current) return;
      // The sound for this turn
      const line = listeningLine(persona, turns.current);
      // Played
      sound.playing = services.speak?.(line.text, line.id).catch(() => null) ?? null;
    };
    // At once, or after the given wait
    const timer = wanted && listenDelayMs > 0 ? setTimeout(playSound, listenDelayMs) : null;
    // (at once)
    if (wanted && listenDelayMs <= 0) playSound();
    // A streamed line's pieces, played one after another on the shared player
    const pieces: { queue: Promise<void>; shown: string[] } = { queue: Promise.resolve(), shown: [] };
    // Each piece as it arrives
    const onSegment = (segment: LineSegment) => {
      // Queued after the ones before it
      pieces.queue = pieces.queue.then(async () => {
        // After the listening sound
        if (sound.playing) await sound.playing;
        // Not once cancelled, cut short or ended
        if (!alive.current || interrupted.current || controller.signal.aborted) return;
        // Shown so far
        pieces.shown.push(segment.text);
        // They are speaking
        setPhase("them");
        // Their words so far
        setCaption(pieces.shown.join(" "));
        // Their first sound
        noteFirstSound();
        // When this piece started
        const at = secondsIn();
        // Said in their voice, or the phone's own
        await services.speakAudio?.(segment.audio, segment.text).catch(() => undefined);
        // The line's times so far: from its first piece to this one's end
        streamedTimes.current = { at: streamedTimes.current?.at ?? at, end: secondsIn() };
      });
    };
    // Ask
    const reply = writeLine({ personaId: persona.id, scenarioId: scenario.id, twist, turns: turns.current, stage, heard, conversationId: conversationId.current, elapsedSec: secondsIn(), difficulty }, { signal: controller.signal, onSegment }).catch(() => null);
    // The line
    const line = await reply;
    // No longer cancellable
    if (asking.current === controller) asking.current = null;
    // No sound needed if it came in time
    if (timer) clearTimeout(timer);
    // Let the pieces finish playing
    await pieces.queue;
    // Let a listening sound finish
    if (sound.playing) await sound.playing;
    // Cut short by a tap part-way through a streamed line: what was said stands
    if (!line && interrupted.current && pieces.shown.length > 0) return { text: pieces.shown.join(" "), audio: null, goodbye: false, streamed: true };
    // The line, a refusal, or nothing
    return line;
  }

  // The route said no for the month's minutes or the conversation's cap, part-way: their recorded goodbye, then save
  async function refused(why: LineRefusal) {
    // Said
    setAnnouncement(why.refused === "budget" ? "This month’s conversation minutes are used up, so the conversation ends here." : "This conversation has reached its five-minute limit.");
    // A recorded goodbye
    await sayRecorded(scriptedNext(persona, turns.current, true));
    // Saved
    return save();
  }

  // Close the live socket and settle its minutes; with a reason, say in one line that turns now end on the phone (decision 119)
  async function closeLive(why?: "dropped") {
    // The socket, if open
    const open = live.current;
    // None
    if (!open) return;
    // Forgotten, so turns end on the phone from now on
    live.current = null;
    // Drawn as off
    setLiveOn(false);
    // Said
    if (why) setLiveNote(liveRefusalLine(why, "a", "turns now end automatically"));
    // Closed (billing stops), then settled
    settleLive(conversationId.current, await open.close());
  }

  // Open live step A for this conversation, or say in one line why turns end automatically instead
  async function goLive() {
    // Nothing said yet
    setLiveNote("");
    // The service's events
    const events: LiveEvents = {
      // Your turn is over: end it as if it had ended by itself
      onEndOfTurn: () => {
        // Only during your turn
        if (phaseRef.current === "you") void doneRef.current("auto");
      },
      // You talked over the persona (headphones): stop them and start your turn
      onBargeIn: () => {
        // Only while they talk
        if (phaseRef.current !== "them") return;
        // When you started, allowing for the half second the service takes to send words
        bargeAt.current = Math.max(0, secondsIn() - BARGE_LAG_SECONDS);
        // Stopped, and your turn starts
        interrupt();
      },
      // The socket dropped: turns end on the phone, and a turn under way ends with what was heard
      onDropped: () => {
        // Closed and said
        void closeLive("dropped");
        // A turn under way ends now
        if (phaseRef.current === "you") void doneRef.current("auto");
      },
    };
    // Opened, or why not
    const result = await openLive(conversationId.current, events);
    // Refused: said, and turns end automatically
    if ("refused" in result) {
      // Said
      setLiveNote(liveRefusalLine(result.refused, "a", "turns end automatically"));
      // Nothing more
      return;
    }
    // The conversation ended while connecting: close at once
    if (!alive.current) {
      // Closed and settled
      settleLive(conversationId.current, await result.live.close());
      // Nothing more
      return;
    }
    // Live
    live.current = result.live;
    // Noted for the saved conversation
    usedLive.current = true;
    // Told what to send now
    result.live.setMode(liveModeFor(phaseRef.current, headphonesRef.current));
    // Drawn as on
    setLiveOn(true);
  }

  // The call's events: into the transcript, the latest line on screen, and whether the agent is speaking
  function callHandlers(): CallHandlers {
    // The handlers
    return {
      // Each event
      onEvent: (event) => {
        // The call under way
        const calling = call.current;
        // None (ended)
        if (!calling) return;
        // Into the transcript
        calling.transcript.add(event);
        // A line: shown, and the agent heard from
        if (event.type === "agent" || event.type === "user") {
          // Shown
          if (event.text.trim()) setCaption(event.text.trim());
          // Heard from (a refused voice can no longer be the reason it ends)
          if (event.type === "agent") calling.heard = true;
        }
        // Speaking or listening
        if (event.type === "mode") setCallSpeaking(event.mode === "speaking");
        // Cut short
        if (event.type === "interruption") setCallSpeaking(false);
      },
      // Connected: nothing more to do
      onConnected: () => undefined,
      // Ended by itself: a refused voice before any line is tried once more with the agent's own; otherwise the call is saved
      onEnded: (error) => {
        // The call under way
        const calling = call.current;
        // Already ending
        if (!calling || calling.ending) return;
        // A fault before the agent said anything, with the persona's voice asked for: once more without it
        if (error && !calling.heard && !calling.retried) {
          // Logged (decision 121: the agent may refuse a voice it does not allow)
          console.info("The phone call ended before it began; trying again with the agent’s own voice.");
          // Tried again; if that cannot start either, what was said is saved (or the page says the conversation could not continue)
          void startCallAttempt(false).then((started) => (started ? undefined : save(true)));
          // Nothing more
          return;
        }
        // Saved
        void finishCall();
      },
    };
  }

  // Start the call once: a token (a second one for the same conversation reuses its minutes), then the SDK; false when it could not start
  async function startCallAttempt(voice: boolean): Promise<boolean> {
    // The call under way, if this is a second try
    const calling = call.current;
    // Marked as retried
    if (calling) calling.retried = !voice;
    // The token
    const started = await openCall(conversationId.current);
    // Refused
    if ("refused" in started || started.grant.kind !== "b") {
      // Said in one line
      setCallNote(liveRefusalLine("refused" in started ? started.refused : "unavailable", "b", "this conversation uses live turns"));
      // Not started
      return false;
    }
    // The grant
    const grant = started.grant;
    // The overrides: the persona, situation, difficulty, house rules, first line and voice
    const { overrides, maxDurationSeconds } = buildCallOverrides({ persona, scenario, twist, difficulty, voice, maxDurationSeconds: Math.min(grant.grantedSeconds, CONVERSATION_LIMIT_SECONDS + LIMIT_GRACE_SECONDS) });
    // Kept (a fresh transcript for a first try)
    call.current = calling ?? { live: null, transcript: new CallTranscript(clock().getTime()), startedAt: clock().getTime(), timer: null, heard: false, retried: !voice, ending: false };
    // Starting can fail
    try {
      // Started
      call.current.live = await startCall(grant, overrides, callHandlers());
    } catch {
      // A first try with the persona's voice: once more with the agent's own
      if (voice) {
        // Logged
        console.info("The phone call could not start with the persona’s voice; trying the agent’s own voice.");
        // Tried again
        return startCallAttempt(false);
      }
      // Nothing used
      settleCall(conversationId.current, 0);
      // Forgotten
      call.current = null;
      // Said in one line
      setCallNote(liveRefusalLine("unavailable", "b", "this conversation uses live turns"));
      // Not started
      return false;
    }
    // Ended while connecting: hang up and save
    if (!alive.current) {
      // Saved (hangs up)
      await finishCall();
      // Started, then ended
      return true;
    }
    // The time limit (the SDK cannot set the agent's own, which is five minutes)
    if (call.current.timer) clearTimeout(call.current.timer);
    // Hung up at the granted time
    call.current.timer = setTimeout(() => void finishCall(), maxDurationSeconds * 1000);
    // Noted for the saved conversation
    usedCall.current = true;
    // The call
    setPhase("call");
    // Said
    setAnnouncement(`On a call with ${persona.name}. Talk when you like.`);
    // Started
    return true;
  }

  // End the call: hang up, settle the minutes, and save what was said
  async function finishCall() {
    // The call under way
    const calling = call.current;
    // None, or already ending
    if (!calling || calling.ending) return;
    // Once
    calling.ending = true;
    // No time limit left
    if (calling.timer) clearTimeout(calling.timer);
    // Hung up (a failure only means it was already over)
    await calling.live?.end().catch(() => undefined);
    // Forgotten
    call.current = null;
    // Settled
    settleCall(conversationId.current, (clock().getTime() - calling.startedAt) / 1000);
    // The transcript, with its times
    setTurns(calling.transcript.finish(clock().getTime()));
    // Saved
    await save();
  }

  // Your turn: start recording
  async function yourTurn() {
    // Stop if the conversation ended
    if (!alive.current) return;
    // Your turn
    setPhase("you");
    // Nothing counted down yet
    setCue(null);
    // (the step)
    cueKey.current = "";
    // Open the microphone and record
    const started = await start();
    // Ended while the microphone opened: let it go
    if (!alive.current) {
      // Let it go
      await stop();
      // Nothing more
      return;
    }
    // When the recording started, for the turn's times
    if (started) turnStartedAt.current = secondsIn();
    // Recording: track the turn on the phone when turns end by themselves and live is not connected (live's own model ends it otherwise)
    if (started) detector.current = auto && !live.current ? startTurn(clock().getTime()) : null;
    // Say whose turn it is
    if (started) setAnnouncement(live.current ? "Your turn. It ends when you finish, or tap Done." : auto ? "Your turn. It ends when you stop talking, or tap Done." : "Your turn. Tap Done when you’ve finished.");
  }

  // Tap while they are talking: stop their line and start your turn (decision 101; no voice barge-in, since echo cancellation is doubtful on phone speakers)
  function interrupt() {
    // Cut short
    interrupted.current = true;
    // A streamed line still arriving stops too, so your turn starts at once
    asking.current?.abort();
    // Quiet now; the step waiting on the line carries on to your turn
    services.stopSpeaking?.();
  }

  // Offer "I wasn't finished" for a few seconds after a turn ended by itself
  function offerResume(length: number, text: string, seconds: number, at?: number) {
    // Where to go back to
    resumePoint.current = { length, text, seconds, at };
    // Shown
    setCanResume(true);
    // Said
    setAnnouncement("Your turn ended. If you weren’t finished, tap “I wasn’t finished”.");
    // Taken away after a few seconds
    setTimeout(() => {
      // Only this offer
      if (resumePoint.current?.length === length && resumePoint.current.text === text) {
        // Gone
        resumePoint.current = null;
        // Hidden
        setCanResume(false);
      }
    }, undoMs);
  }

  // "I wasn't finished": cancel the reply, go back to before that turn, and listen again, keeping the words so far
  function resume() {
    // Where to go back to
    const point = resumePoint.current;
    // Nothing to go back to
    if (!point || !alive.current) return;
    // Used
    resumePoint.current = null;
    // Hidden
    setCanResume(false);
    // The steps waiting on the reply stop
    flow.current += 1;
    // Cancel the reply request
    asking.current?.abort();
    // Cut short anything being said
    interrupted.current = true;
    // Quiet now
    services.stopSpeaking?.();
    // The conversation as it was before that turn
    setTurns(turns.current.slice(0, point.length));
    // Their last line back on screen
    setCaption([...turns.current].reverse().find((turn) => turn.who === "them")?.text ?? "");
    // Your words so far, joined to what comes next
    carried.current = { text: point.text, seconds: point.seconds, at: point.at };
    // Carry on
    void yourTurn();
  }

  // Done: end your turn (a tap, by itself when you stopped talking, or the timer), then let them answer
  async function done(how: TurnEnd = "tap") {
    // This run of turns
    const mine = flow.current;
    // Whether "I wasn't finished" has moved things on, or the conversation ended
    const stale = () => mine !== flow.current || !alive.current;
    // No longer tracking this turn
    detector.current = null;
    // Nothing counted down
    setCue(null);
    // When your turn ended, for the development readout
    turnEndedAt.current = clock().getTime();
    // Your take (a turn that ended by itself already waited for the last words)
    const take = await stop({ quick: how === "auto" });
    // Nothing was under way, or the conversation ended
    if (!take || stale()) return;
    // Where speech was heard in the recording
    const span = speechSpan(take.levels, LOUDNESS_TICK_MS);
    // When the recording started
    const recordedFrom = turnStartedAt.current ?? secondsIn() - take.durationSec;
    // Your speech's times (from talking over the persona, when you did)
    const yourTimes = { at: Math.min(recordedFrom + (span?.first ?? 0), bargeAt.current ?? Number.POSITIVE_INFINITY), end: recordedFrom + (span?.last ?? take.durationSec), cut: how === "cut" };
    // Used
    bargeAt.current = null;
    // Words from a reopened turn, joined to these
    const before = carried.current;
    // Used
    carried.current = null;
    // What you said
    const text = [before?.text ?? "", take.transcript.trim()].filter(Boolean).join(" ");
    // How long you spoke in all
    const seconds = Math.round(((before?.seconds ?? 0) + take.durationSec) * 10) / 10;
    // A reopened turn started when its first part did
    if (before?.at !== undefined) yourTimes.at = Math.min(yourTimes.at, before.at);
    // Nothing caught after time is up: never ask again (the turn would end itself at once, over and over), so say goodbye and save
    if (!text && stageFor(yourTurnCount(turns.current), secondsIn()) === "end") return farewell();
    // Nothing caught: they ask you to say it again, then it is your turn again
    if (!text) {
      // Say why on screen
      setMissed(true);
      // With written lines, a line for it, kept out of the conversation
      if (written) {
        // Asked for
        const again = await ask(stageFor(yourTurnCount(turns.current), secondsIn()), false);
        // Moved on
        if (stale()) return;
        // The connection dropped
        if (!again) return lose();
        // Out of minutes, or past the cap
        if (isRefusal(again)) return refused(again);
        // Said, kept in the conversation only if it says goodbye; a goodbye ends it
        if (await sayWritten(again, again.goodbye)) return save();
      } else {
        // Their recorded line for it, kept out of the conversation
        await sayRecorded([persona.again], false);
      }
      // Try again
      await yourTurn();
      // Nothing more
      return;
    }
    // Caught
    setMissed(false);
    // The conversation before this turn, to go back to
    const length = turns.current.length;
    // Your turn, with its times
    add({ who: "you", text, seconds, ...roundTimes(yourTimes) });
    // Ended by itself: offer to carry on
    if (how === "auto") offerResume(length, text, seconds, yourTimes.at);
    // How far in: your turns so far (this one included) and the time (decision 127)
    const stage = stageFor(yourTurnCount(turns.current), secondsIn());
    // Their reply ends the conversation
    let ended: boolean;
    // Written: ask for the next line
    if (written) {
      // Asked for
      const reply = await ask(stage, true);
      // Moved on ("I wasn't finished")
      if (stale()) return;
      // The connection dropped: save what was said
      if (!reply) return lose();
      // Out of minutes, or past the cap
      if (isRefusal(reply)) return refused(reply);
      // Said
      ended = await sayWritten(reply);
    } else {
      // Recorded: the next step of the script, or a goodbye near the end
      ended = await sayRecorded(scriptedNext(persona, turns.current, stage !== "talk"));
    }
    // Moved on ("I wasn't finished")
    if (stale()) return;
    // A goodbye, or time is up: save
    if (ended || stage === "end") return save();
    // Your turn again
    await yourTurn();
  }

  // Start: their opening line, then your turn
  async function begin() {
    // Running
    alive.current = true;
    // Not saving
    saving.current = false;
    // From the beginning
    setTurns([]);
    // Now
    startedAt.current = clock();
    // From zero
    setElapsed(0);
    // Nothing missed yet
    setMissed(false);
    // Nothing carried over or on offer
    carried.current = null;
    // (on offer)
    resumePoint.current = null;
    // Hidden
    setCanResume(false);
    // A new run of turns
    flow.current += 1;
    // A new conversation id, for the server's caps
    conversationId.current = crypto.randomUUID();
    // No cut-ins, live or call yet, and no times carried over (decision 120)
    cutIns.current = 0;
    // (call)
    usedCall.current = false;
    // Nothing said about a call
    setCallNote("");
    // (live)
    usedLive.current = false;
    // (times)
    bargeAt.current = null;
    // No readout yet
    setLatency(null);
    // The longer waits on an iPhone, where speech recognition stops by itself (decision 101)
    conservative.current = isIosSafari();
    // Recorded: the opening starts within this tap, which lets phones play the later lines too
    if (!written) {
      // Live and calls need the coach: said in one line, and turns end automatically
      setLiveNote(liveChosen ? liveRefusalLine("no-coach", "a", "turns end automatically") : callChosen ? liveRefusalLine("no-coach", "b", "turns end automatically") : "");
      // The opening, then your turn
      await sayRecorded([openingLine(persona, earlier ?? 0).id]);
      // Your turn
      return yourTurn();
    }
    // Written: unlock the player within this tap, since the opening arrives over the network
    services.unlockSpeech?.();
    // A phone call chosen: the agent takes over (decision 121); if it cannot start, live turns instead
    if (callChosen) {
      // Started: the call runs the conversation from here
      if (await startCallAttempt(true)) return;
      // Ended while trying
      if (!alive.current) return;
    }
    // Live chosen, or a call that could not start: connect first (or say why not, and carry on with turns ending on the phone)
    if (liveChosen || callChosen) await goLive();
    // The opening
    const opening = await ask("open", true);
    // The coach could not be reached, or the month's minutes are used up: back to the start, with their recorded lines instead
    if (!opening || isRefusal(opening)) {
      // No longer running
      alive.current = false;
      // No live socket left open
      await closeLive();
      // Why
      setFellBackWhy(opening && opening.refused === "budget" ? "budget" : "unreachable");
      // Use the recordings
      setFellBack(true);
      // Back to the start
      setPhase("intro");
      // Nothing more
      return;
    }
    // Said, then your turn
    await sayWritten(opening);
    // Your turn
    await yourTurn();
  }

  // Time is up and your last turn was not caught: their goodbye, then save
  async function farewell() {
    // Nothing missed to show
    setMissed(false);
    // Written: ask for a goodbye
    if (written) {
      // Asked for
      const goodbye = await ask("end", true);
      // The connection dropped: save what was said
      if (!goodbye) return lose();
      // Out of minutes, or past the cap: a recorded goodbye instead
      if (isRefusal(goodbye)) return refused(goodbye);
      // Said
      await sayWritten(goodbye);
    } else {
      // Recorded: a goodbye line
      await sayRecorded(scriptedNext(persona, turns.current, true));
    }
    // Save (stopped by the page closing, the goodbye still ends it)
    return save();
  }

  // The connection dropped mid-conversation: save what was said
  async function lose() {
    // Save, saying why if nothing of yours was said
    await save(true);
  }

  // End early: keep what you were saying, then save
  async function end() {
    // No longer running, so waiting steps stop
    alive.current = false;
    // Quiet
    services.stopSpeaking?.();
    // A take under way (its last words read from the live socket first, if open)
    const take = await stop();
    // The live socket closed, so billing stops
    await closeLive();
    // Words from a reopened turn, joined to these
    const text = [carried.current?.text ?? "", take?.transcript.trim() ?? ""].filter(Boolean).join(" ");
    // Keep them, if any
    if (text) add({ who: "you", text, seconds: Math.round(((carried.current?.seconds ?? 0) + (take?.durationSec ?? 0)) * 10) / 10, ...(take && turnStartedAt.current !== null ? roundTimes({ at: carried.current?.at ?? turnStartedAt.current + (speechSpan(take.levels, LOUDNESS_TICK_MS)?.first ?? 0), end: turnStartedAt.current + (speechSpan(take.levels, LOUDNESS_TICK_MS)?.last ?? take.durationSec) }) : {}) });
    // Used
    carried.current = null;
    // Save
    await save();
  }

  // Save the conversation and open its results (lost: the connection dropped)
  async function save(lost = false) {
    // Once
    if (saving.current) return;
    // Saving now
    saving.current = true;
    // No longer running
    alive.current = false;
    // Show it
    setPhase("saving");
    // The live socket closed first, so billing stops
    await closeLive();
    // Nothing heard from you: nothing to save
    if (!turns.current.some((turn) => turn.who === "you" && turn.text.trim() !== "")) {
      // Say so
      setPhase(lost ? "lost" : "empty");
      // Ready to start again
      saving.current = false;
      // Nothing more
      return;
    }
    // Save, noting any failure
    try {
      // A new id
      const id = crypto.randomUUID();
      // Saved, waiting for the coach
      await saveConversationSession(repo, { id, characterId: persona.id, scenarioId: scenario.id, twist, turns: turns.current, durationSec: secondsIn(), difficulty: written ? difficulty : undefined, turnMode: usedCall.current ? "call" : usedLive.current ? "live" : auto ? "auto" : "tap" }, clock());
      // Its results, where the coach's notes arrive
      navigate(`/sessions?id=${id}`);
    } catch {
      // Not saved
      setPhase("failed");
      // Ready to try again
      saving.current = false;
    }
  }

  // End a turn of yours that runs too long, or past the time limit
  useEffect(() => {
    // Only while recording
    if (!recording) return;
    // Seconds left before it ends by itself
    const left = Math.min(MAX_TURN_SECONDS, CONVERSATION_LIMIT_SECONDS + LIMIT_GRACE_SECONDS - (startedAt.current ? (clock().getTime() - startedAt.current.getTime()) / 1000 : 0));
    // On hard, with written lines, the persona cuts in on a long turn now and then (decision 120)
    const level = findDifficulty(difficulty).cutInSeconds;
    // (the check's shorter time, when given)
    const cutIn = written && cutIns.current < MAX_CUT_INS && level !== null ? (cutInSeconds ?? level) : null;
    // Cutting in comes first
    const cuts = cutIn !== null && cutIn < left;
    // End it then
    const timer = setTimeout(() => {
      // Counted
      if (cuts) cutIns.current += 1;
      // Ended
      void done(cuts ? "cut" : "timer");
    }, Math.max(0, cuts ? cutIn : left) * 1000);
    // Not if it ends first
    return () => clearTimeout(timer);
    // done reads only refs and steady tools, so it need not restart the timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock, recording]);

  // Keep the readings' "done" and the hiding page's "end" current after each draw
  useEffect(() => {
    // The newest
    doneRef.current = done;
    // (and end)
    endRef.current = end;
    // (and the start, for Quick play)
    beginRef.current = begin;
  });

  // Quick play (decision 127): start at once once the settings and earlier conversations are read, but only when the page was opened by a tap, so the persona's voice is allowed to play; otherwise Start is shown as usual
  useEffect(() => {
    // Not asked, already done, not ready, or no speech-to-text
    if (!autostart || autostarted.current || !settingsRead || earlier === null || phase !== "intro" || !supported) return;
    // Whether this page has had a tap (kept across the app's own page changes)
    const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
    // No tap yet: Start stays
    if (!activation?.hasBeenActive) return;
    // Once
    autostarted.current = true;
    // Start
    void beginRef.current();
  }, [autostart, settingsRead, earlier, phase, supported]);

  // Whether the conversation is under way
  const talking = phase === "them" || phase === "thinking" || phase === "you";

  // While talking, note key presses and focus moved without a tap (a keyboard or a screen reader), which hold off ending a turn by itself
  useEffect(() => {
    // Only while talking
    if (!talking) return;
    // A tap
    const onPointer = () => {
      // Noted
      pointerAt.current = clock().getTime();
    };
    // A key
    const onKey = () => {
      // Noted
      assistAt.current = clock().getTime();
    };
    // Focus moving, unless a tap just moved it
    const onFocus = () => {
      // Not from a tap
      if (clock().getTime() - pointerAt.current > POINTER_FOCUS_MS) assistAt.current = clock().getTime();
    };
    // Listen
    document.addEventListener("pointerdown", onPointer, true);
    // (keys)
    document.addEventListener("keydown", onKey, true);
    // (focus)
    document.addEventListener("focusin", onFocus, true);
    // Stop listening
    return () => {
      // Each one
      document.removeEventListener("pointerdown", onPointer, true);
      // (keys)
      document.removeEventListener("keydown", onKey, true);
      // (focus)
      document.removeEventListener("focusin", onFocus, true);
    };
  }, [clock, talking]);
  // While live, the page hiding or closing ends the conversation and saves what was said: an installed iPhone app loses the microphone when hidden, and the socket is billed while it is open (decision 119)
  useEffect(() => {
    // Only while talking live, or on a call
    if (!(talking && liveOn) && phase !== "call") return;
    // Hidden
    const onVisibility = () => {
      // Ended and saved
      if (document.visibilityState === "hidden") void (call.current ? finishCall() : endRef.current());
    };
    // Closing
    const onPageHide = () => {
      // Ended and saved
      void (call.current ? finishCall() : endRef.current());
    };
    // Listen
    document.addEventListener("visibilitychange", onVisibility);
    // (closing)
    window.addEventListener("pagehide", onPageHide);
    // Stop listening
    return () => {
      // Each one
      document.removeEventListener("visibilitychange", onVisibility);
      // (closing)
      window.removeEventListener("pagehide", onPageHide);
    };
    // finishCall reads only refs and steady tools
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talking, liveOn, phase]);
  // The situation's words, with the name filled in
  const named = (text: string) => scenarioText(text, persona);

  // Draw the page
  return (
    // Dark while you speak (the stage, decision 69)
    <main id="main" data-area={recording ? "stage" : undefined} className="mx-auto flex min-h-dvh max-w-5xl flex-col bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Title, the time, and the way out (none mid-conversation; End saves it instead) */}
      <Masthead title="Conversation" nav={false} close={talking || phase === "call" || phase === "saving" ? null : { href: "/conversations", label: "Close, back to Conversations" }}>{phase === "call" ? `${formatClock(elapsed)} of ${formatClock(CONVERSATION_LIMIT_SECONDS)}` : talking ? `Turn ${Math.min(END_AFTER_TURNS, yourTurnCount(turnsShown) + 1)} of ${END_AFTER_TURNS}` : ""}</Masthead>

      {/* Before starting: the situation and what to practise (once the earlier conversations are counted) */}
      {phase === "intro" && earlier !== null && (
        <section aria-labelledby="talk-heading" className="mt-8 md:max-w-2xl">
          {/* What this is */}
          <p className="text-footnote font-semibold text-accent">Talk with someone</p>
          {/* The situation (decision 127) */}
          <h1 id="talk-heading" className="mt-1 font-display text-statement font-semibold tracking-tight">{scenario.title}</h1>
          {/* Where you are */}
          <p className="mt-3 max-w-[48ch] text-lede">{named(scenario.setting)}</p>
          {/* Who it is with, picked for you */}
          <p data-talking-with className="mt-3 text-footnote text-ink-muted">You’ll talk with <span className="font-semibold text-ink">{persona.name}</span> · {persona.tagline}</p>
          {/* The one goal (decision 127) */}
          <div data-goal className={`mt-5 p-4 ${CARD}`}>
            {/* Small heading */}
            <p className="text-footnote font-semibold text-accent">Your goal</p>
            {/* The goal */}
            <p className="mt-1 font-display text-cue font-semibold leading-tight">{goal.text}</p>
            {/* How */}
            <p className="mt-1 text-footnote">{named(goal.detail)}</p>
          </div>
          {/* How hard, with written lines (decision 120) */}
          {written && <DifficultyPicker chosen={difficulty} name={persona.name} onChoose={chooseDifficulty} />}
          {/* The coach could not be reached */}
          {fellBack && <p role="status" className="mt-4 max-w-[48ch] text-lede">{fellBackWhy === "budget" ? `This month’s conversation minutes are used up, so ${persona.name} will use recorded lines until next month.` : `The coach couldn’t be reached, so ${persona.name} will use recorded lines here.`}</p>}
          {/* How it works */}
          <p className="mt-4 max-w-[52ch] text-footnote text-ink-muted">A few exchanges, about a minute. {persona.name} speaks first. {callChosen ? "A phone call (beta, change this in Settings): no turns to end, and you can talk over each other." : liveChosen ? "Answer out loud; a live speech service hears when you’ve finished (beta, change this in Settings)." : auto ? "Answer out loud; your turn ends when you stop talking (change this in Settings)." : "Answer out loud, then tap Done."} {persona.name}’s voice is AI, by ElevenLabs. {callChosen ? "During the call your voice goes to ElevenLabs and is not kept." : liveChosen ? "While you talk, your voice goes to AssemblyAI and is not kept." : "Your browser turns your words into text, usually through Apple or Google."}</p>
          {/* No speech-to-text in this browser */}
          {!supported && <p role="alert" className="mt-4 max-w-[48ch] text-lede">This browser can’t turn speech into text, so {persona.name} can’t follow what you say. Try Chrome, Edge or Safari.</p>}
          {/* Start, or another situation */}
          {supported && (
            <p className="mt-6 flex flex-wrap gap-3">
              {/* Start */}
              <button type="button" onClick={() => void begin()} className={PRIMARY}>Start</button>
              {/* Another situation, when lines are written */}
              {written && !picked && <button type="button" onClick={() => setSkipped(skipped + 1)} className={QUIET}>Another situation</button>}
            </p>
          )}
        </section>
      )}

      {/* The conversation */}
      {(talking || phase === "saving") && (
        <section aria-labelledby="line-heading" className="mt-8 flex flex-col md:max-w-2xl">
          {/* Who is talking, and where (decision 127) */}
          <p className="text-footnote font-semibold text-accent"><span data-who-talking>{phase === "you" ? "Your turn" : `${persona.name} is talking`}</span> · {scenario.title}{liveOn ? <span data-live="on"> · Live</span> : null}</p>
          {/* The goal, counted as you go (decision 127) */}
          {phase !== "saving" && <GoalChip goal={goal} turns={turnsShown} />}
          {/* Live could not start or dropped: why, in one line (decision 119) */}
          {liveNote && <p role="status" data-live-note className="mt-2 max-w-[48ch] text-footnote text-ink-muted">{liveNote}</p>}
          {/* A call could not start: why, in one line (decision 121) */}
          {callNote && <p role="status" data-call-note className="mt-2 max-w-[48ch] text-footnote text-ink-muted">{callNote}</p>}
          {/* Their latest line, announced as it changes */}
          <h1 id="line-heading" aria-live="polite" className="mt-3 font-display text-statement font-semibold tracking-tight">{caption || "…"}</h1>
          {/* Not caught last time */}
          {missed && phase === "you" && <p role="status" className="mt-3 text-lede">That wasn’t caught. Say it again, then tap Done.</p>}
          {/* A problem, explained plainly */}
          {problem && phase === "you" && <p role="alert" className="mt-4 max-w-[48ch] text-lede">{PROBLEM_TEXT[problem]}</p>}
          {/* A blocked microphone: how to allow it */}
          {problem === "microphone-blocked" && phase === "you" && (
            // One step per device
            <ul aria-label="How to allow the microphone" className="mt-3 max-w-[52ch] list-disc space-y-2 pl-5 text-lede">
              {/* Each step */}
              {ALLOW_STEPS.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
          {/* The shape: them speaking, their line on its way, your turn, or saving */}
          {phase === "saving" ? (
            <StatusBlob compact={false} label="Saving…" detail="one moment" />
          ) : phase === "them" ? (
            <StartBlob compact={false} label={persona.name} detail="is talking · tap to talk" ariaLabel={`Interrupt ${persona.name} and start your turn`} onStart={interrupt} />
          ) : phase === "thinking" ? (
            <StatusBlob compact={false} label={persona.name} detail={caption ? "is listening" : "is about to speak"} mood={caption ? "listening" : "thinking"} />
          ) : recording ? (
            <VoiceBlob levels={levels} signal="none" clock={formatClock(turnSeconds)} onStop={() => void done()} compact={false} action="Done" />
          ) : stopping ? (
            <StatusBlob compact={false} label="One moment…" detail="catching your words" />
          ) : problem ? (
            <StartBlob compact={false} onStart={() => void yourTurn()} mood="hmm" label="Try again" detail="your turn" />
          ) : (
            <StatusBlob compact={false} label="Your turn" detail="allow the microphone" />
          )}
          {/* What to do while recording: tap Done, or the countdown when turns end by themselves */}
          {recording && !auto && <p className="text-center text-footnote text-ink-muted md:text-left">Your turn. Tap Done when you’ve finished.</p>}
          {recording && auto && !liveOn && <TurnCueLine cue={cue} />}
          {recording && liveOn && <p data-live-turn className="mt-1 text-center text-footnote text-ink-muted md:text-left">Live. Your turn ends when you finish, or tap Done.</p>}
          {/* A turn that ended by itself, for a few seconds: carry on */}
          {canResume && (phase === "thinking" || phase === "them") && <p className="mt-3 text-center md:text-left"><button type="button" onClick={resume} className={SECONDARY}>I wasn’t finished</button></p>}
          {/* While developing: how long their first sound took after your turn ended */}
          {DEVELOPMENT && latency !== null && <p data-latency={latency} className="mt-2 text-center text-footnote text-ink-muted md:text-left">Reply sound {(latency / 1000).toFixed(1)} s after your turn ended (development only)</p>}
          {/* Whose turn it is, for screen readers */}
          <p role="status" className="sr-only">{talking ? announcement : ""}</p>
          {/* End early, saving what was said */}
          {talking && !stopping && <p className="mt-4 text-center md:text-left"><button type="button" onClick={() => void end()} className={QUIET}>End conversation</button></p>}
        </section>
      )}

      {/* A phone call with the agent (decision 121) */}
      {phase === "call" && (
        <section aria-labelledby="call-heading" data-call className="mt-8 flex flex-col md:max-w-2xl">
          {/* Who, where, and that it is a call */}
          <p className="text-footnote font-semibold text-accent">{persona.name} · {scenario.title} · Phone call</p>
          {/* The latest line, yours or theirs, announced as it changes */}
          <h1 id="call-heading" aria-live="polite" className="mt-3 font-display text-statement font-semibold tracking-tight">{caption || "…"}</h1>
          {/* Speaking or listening */}
          <StatusBlob compact={false} label={callSpeaking ? persona.name : "Your turn"} detail={callSpeaking ? "is talking · talk over them any time" : "just talk"} />
          {/* How it works */}
          <p className="text-center text-footnote text-ink-muted md:text-left">On a call: no turns to end. Talk when you like; {persona.name} can be interrupted.</p>
          {/* Whose turn, for screen readers */}
          <p role="status" className="sr-only">{announcement}</p>
          {/* Hang up, saving what was said */}
          <p className="mt-4 text-center md:text-left"><button type="button" onClick={() => void finishCall()} className={SECONDARY}>End call</button></p>
        </section>
      )}

      {/* Nothing heard from you, or the connection dropped first */}
      {(phase === "empty" || phase === "lost") && (
        <section aria-labelledby="empty-heading" className="mt-8 md:max-w-2xl">
          {/* What happened */}
          <h1 id="empty-heading" className="font-display text-statement font-semibold tracking-tight">{phase === "lost" ? "The conversation couldn’t continue, so nothing was saved." : "Nothing was heard from you, so nothing was saved."}</h1>
          {/* Try again */}
          <p className="mt-6"><button type="button" onClick={() => void begin()} className={PRIMARY}>Start again</button></p>
        </section>
      )}

      {/* Saving failed */}
      {phase === "failed" && (
        <section aria-labelledby="failed-heading" className="mt-8 md:max-w-2xl">
          {/* What happened */}
          <h1 id="failed-heading" role="alert" className="font-display text-statement font-semibold tracking-tight">This conversation could not be saved.</h1>
          {/* Try again */}
          <p className="mt-6"><button type="button" onClick={() => void save()} className={SECONDARY}>Try saving again</button></p>
        </section>
      )}
    </main>
  );
}

// How hard the persona makes it (decision 120): three buttons side by side, the chosen one filled, and what it means
function DifficultyPicker({ chosen, name, onChoose }: { chosen: ConversationDifficulty; name: string; onChoose: (next: ConversationDifficulty) => void }) {
  // The buttons and the line
  return (
    <div data-difficulty={chosen} className="mt-5">
      {/* The choice's name */}
      <p id="difficulty-label" className="text-footnote text-ink-muted">How hard should {name} make it?</p>
      {/* The three buttons */}
      <div role="group" aria-labelledby="difficulty-label" className="mt-2 grid max-w-sm grid-cols-3 gap-1 rounded-2xl bg-paper p-1">
        {/* One per level */}
        {DIFFICULTIES.map((level) => (
          // One level, filled when chosen
          <button key={level.id} type="button" aria-pressed={chosen === level.id} onClick={() => onChoose(level.id)} className={`min-h-11 rounded-xl px-3 ${PRESS} ${chosen === level.id ? "bg-fill font-semibold text-fill-ink" : "text-ink-muted hover:bg-card hover:text-ink"}`}>{level.name}</button>
        ))}
      </div>
      {/* What the chosen one means */}
      <p className="mt-2 text-footnote text-ink-muted">{findDifficulty(chosen).blurb}</p>
    </div>
  );
}

// Times rounded to a tenth of a second, for saving (decision 120)
function roundTimes<Times extends { at?: number; end?: number; cut?: boolean }>(times: Times): Times {
  // Each time to a tenth, never negative; cut kept only when true
  return { ...times, ...(times.at !== undefined ? { at: Math.max(0, Math.round(times.at * 10) / 10) } : {}), ...(times.end !== undefined ? { end: Math.max(0, Math.round(times.end * 10) / 10) } : {}), cut: times.cut === true ? true : undefined };
}

// What the live socket sends in each phase (decision 119): the microphone on your turn; while the persona talks, the microphone only with headphones (to notice you talking over them); silence otherwise, so their voice from a speaker is never heard as yours
function liveModeFor(phase: Phase, headphones: boolean): LiveMode {
  // By phase
  return phase === "you" ? "listen" : phase === "them" && headphones ? "barge" : "silence";
}

// What the countdown says, by where the turn is
function cueText(cue: TurnCue | null): string {
  // Before any speech
  if (!cue || cue.phase === "waiting") return "Listening. Your turn ends when you stop talking, or tap Done.";
  // Speaking
  if (cue.phase === "speaking") return "Listening…";
  // Held for a keyboard or screen reader
  if (cue.phase === "holding") return "Waiting while you use the keyboard. Tap Done when you’ve finished.";
  // A pause noticed
  return cue.progress > 0 ? "Pause noticed. Ending your turn unless you carry on…" : "Listening…";
}

// The countdown while turns end by themselves: five marks that fill as a pause goes on, and words saying what is happening (steps, not movement, so it reads the same with reduced motion; decision 101)
function TurnCueLine({ cue }: { cue: TurnCue | null }) {
  // How many marks are filled
  const filled = cue && (cue.phase === "pausing" || cue.phase === "holding") ? Math.floor(cue.progress * CUE_STEPS) : 0;
  // The marks and the words
  return (
    <div data-turn-cue={cue?.phase ?? "waiting"} data-turn-progress={filled} className="mt-1 flex flex-col items-center gap-1.5 md:items-start">
      {/* The marks, for sighted people (the words say the same) */}
      <div aria-hidden="true" className="flex gap-1">
        {/* Each mark */}
        {Array.from({ length: CUE_STEPS }, (_, index) => <span key={index} className={`h-1.5 w-7 rounded-full ${index < filled ? "bg-accent" : "bg-rule"}`} />)}
      </div>
      {/* The words */}
      <p className="text-center text-footnote text-ink-muted md:text-left">{cueText(cue)}</p>
    </div>
  );
}
