// Ending a conversation turn by itself (decision 101): watches the microphone level ten times a second and the words the speech service has heard, and says when the person has finished speaking. Pure, so every timing can be tested with made-up timelines; the screen feeds it readings and calls Done when it says so
//
// The signals, all on the phone:
// - Speech: the level stays well above a noise floor that adapts to the room (set from the first readings, falling quickly and rising slowly).
// - Silence after speech: the level has stayed near the floor for a while.
// - The words have stopped changing for the same while.
// - A longer wait when the words end on a word that carries on ("and", "so", "um") or a comma.
// - At least a little speech before any automatic end, and a longest turn.
// When the words never arrive (no speech service, or it stops part-way, as Safari's often does on an iPhone), only the level is used, with longer waits.

// How the waits are set
export interface TurnTimings {
  // Speech needed before a turn may end by itself, in milliseconds
  minSpeechMs: number;
  // Quiet needed after speech, in milliseconds
  silenceMs: number;
  // Quiet needed when the words end mid-thought, in milliseconds
  continuationMs: number;
  // Quiet needed once the person has spoken for a long while (they have usually made their point), in milliseconds
  longTurnSilenceMs: number;
  // The longest a turn may run, in milliseconds
  maxTurnMs: number;
}

// The usual waits, with the words to go on: patient, since people practising often pause to think (decision 101 explains the numbers)
export const WORD_TIMINGS: TurnTimings = { minSpeechMs: 1_200, silenceMs: 1_500, continuationMs: 2_800, longTurnSilenceMs: 1_200, maxTurnMs: 60_000 };

// The waits with only the level to go on (no words, or an iPhone): longer, since a pause to think cannot be told apart from the end
export const LEVEL_ONLY_TIMINGS: TurnTimings = { minSpeechMs: 2_000, silenceMs: 2_400, continuationMs: 2_400, longTurnSilenceMs: 2_000, maxTurnMs: 60_000 };

// Speaking this long counts as a long turn, in milliseconds
const LONG_TURN_MS = 20_000;
// A loud stretch must last this long to count as speech (a cough or a door is shorter), in milliseconds
const ONSET_MS = 300;
// Readings used to find the room's noise floor at the start
const CALIBRATION_READINGS = 3;
// The quietest floor allowed, so a silent stand-in microphone still has a floor
const MIN_FLOOR = 0.002;
// Loud: this many times the floor, plus a little
const LOUD_RATIO = 3;
// (the little)
const LOUD_MARGIN = 0.004;
// Quiet again: under this many times the floor, plus a little (between the two, the reading keeps its last state, so it does not flicker)
const QUIET_RATIO = 2;
// (the little)
const QUIET_MARGIN = 0.002;
// How fast the floor follows a quieter reading (a share of the gap per reading)
const FLOOR_FALL = 0.5;
// How fast the floor follows a reading that is not speech
const FLOOR_RISE_QUIET = 0.05;
// How fast the floor creeps up during loud readings, per reading, so a fan that starts mid-turn is learned in time (about 3% a second)
const FLOOR_CREEP = 1.003;
// Speech this long with no words at all means the words are not coming, in milliseconds
const WORDS_GRACE_MS = 3_000;
// Speech this long with no change in the words means the speech service has stopped, in milliseconds
const WORDS_STALE_MS = 5_000;
// The longest gap between readings that counts in full (a tab put in the background must not count as speech or silence), in milliseconds
const MAX_GAP_MS = 500;

// Words that carry on to more: joining words, hesitations, and words that cannot end a sentence
const CONTINUATIONS: ReadonlySet<string> = new Set(["and", "but", "so", "or", "because", "cause", "cos", "um", "uh", "er", "erm", "hmm", "mm", "like", "the", "a", "an", "to", "of", "with", "for", "from", "in", "on", "at", "by", "about", "if", "when", "while", "although", "though", "that", "which", "who", "whose", "where", "then", "my", "your", "our", "their", "his", "her", "its", "is", "was", "are", "were", "am", "be", "i", "we", "i'm", "it's", "i've", "i'd", "also", "plus", "until", "since", "than", "as", "into", "very", "more", "most"]);

// Pairs of words that carry on to more
const CONTINUATION_PAIRS: ReadonlySet<string> = new Set(["you know", "kind of", "sort of", "and then", "so then", "i mean", "i think", "i guess"]);

// One reading from the screen
export interface TurnReading {
  // When, in milliseconds on the turn's clock
  atMs: number;
  // The microphone's level, from 0 to 1
  level: number;
  // The words heard so far, or null when there is no speech service at all
  words: string | null;
  // True while someone using a keyboard or a screen reader is in the middle of something, so the turn never ends under them
  held?: boolean;
}

// Whether the words are coming: not known yet, arriving, or not coming
export type WordsSignal = "unknown" | "present" | "missing";

// What is remembered between readings
export interface TurnState {
  // When the turn started, in milliseconds
  startedAtMs: number;
  // The time of the last reading
  lastAtMs: number;
  // The first readings, for the floor
  calibration: number[];
  // The room's noise floor, once known
  floor: number | null;
  // Whether the latest reading counts as loud
  loud: boolean;
  // How long the current loud stretch has run, in milliseconds
  loudRunMs: number;
  // Speech heard in all, in milliseconds
  speechMs: number;
  // Whether real speech (a long enough loud stretch) has been heard
  speechSeen: boolean;
  // When the level was last loud, in milliseconds
  lastLoudAtMs: number | null;
  // The latest words
  words: string;
  // When the words last changed, in milliseconds
  wordsChangedAtMs: number | null;
  // Whether the words are coming
  wordsSignal: WordsSignal;
  // Speech heard since the words last changed, in milliseconds
  speechSinceWordsMs: number;
  // Whether the turn has ended
  ended: boolean;
}

// Why a turn ended by itself
export type EndReason = "silence" | "max-length";

// What to show: waiting for speech, speaking, a pause counting down, or held for someone mid-action
export interface TurnCue {
  // Where the turn is
  phase: "waiting" | "speaking" | "pausing" | "holding";
  // How far through the wait, from 0 to 1
  progress: number;
  // The wait being counted, in milliseconds
  waitMs: number;
  // Whether only the level is being used
  levelOnly: boolean;
}

// One step's result
export interface TurnStep {
  // The new state
  state: TurnState;
  // Why the turn ended now, or null
  end: EndReason | null;
  // What to show
  cue: TurnCue;
}

// Options for a turn
export interface TurnOptions {
  // Use the longer waits even with words (an iPhone, where the words are unreliable)
  conservative?: boolean;
}

// A new turn's state, starting now
export function startTurn(atMs: number): TurnState {
  // Nothing heard yet
  return { startedAtMs: atMs, lastAtMs: atMs, calibration: [], floor: null, loud: false, loudRunMs: 0, speechMs: 0, speechSeen: false, lastLoudAtMs: null, words: "", wordsChangedAtMs: null, wordsSignal: "unknown", speechSinceWordsMs: 0, ended: false };
}

// Whether words end mid-thought: a comma or a trailing "…", or a last word (or pair) that carries on
export function endsMidThought(words: string): boolean {
  // Without spaces at the ends
  const text = words.trim().toLowerCase();
  // Nothing said
  if (!text) return false;
  // A comma, dash or trailing dots
  if (/(,|…|\.\.\.|-|–)$/.test(text)) return true;
  // The words, without punctuation
  const list = text.replace(/[^a-z'\s]/g, " ").split(/\s+/).filter(Boolean);
  // The last word
  const last = list.at(-1) ?? "";
  // The last two
  const pair = list.slice(-2).join(" ");
  // Either carries on
  return CONTINUATIONS.has(last) || CONTINUATION_PAIRS.has(pair);
}

// The timings in use
export function timingsFor(state: TurnState, options: TurnOptions = {}): TurnTimings {
  // The longer waits without words, or when asked
  return state.wordsSignal === "missing" || options.conservative ? LEVEL_ONLY_TIMINGS : WORD_TIMINGS;
}

// The quiet needed now, from the words and how long the person has spoken
export function waitFor(state: TurnState, options: TurnOptions = {}): number {
  // The timings
  const timings = timingsFor(state, options);
  // Words that carry on: the longer wait
  if (state.wordsSignal === "present" && endsMidThought(state.words)) return timings.continuationMs;
  // A long turn: a shorter wait
  if (state.speechMs >= LONG_TURN_MS) return timings.longTurnSilenceMs;
  // Otherwise the usual
  return timings.silenceMs;
}

// The floor after one more reading: down fast, up slowly, and only creeping up while loud
function nextFloor(floor: number, level: number, loud: boolean): number {
  // A quieter reading: follow it down quickly
  if (level < floor) return Math.max(MIN_FLOOR, floor + (level - floor) * FLOOR_FALL);
  // Loud: creep up slowly
  if (loud) return floor * FLOOR_CREEP;
  // Not speech: follow it up a little
  return floor + (level - floor) * FLOOR_RISE_QUIET;
}

// Take one reading and say whether the turn has ended
export function stepTurn(previous: TurnState, reading: TurnReading, options: TurnOptions = {}): TurnStep {
  // A copy to change
  const state: TurnState = { ...previous, calibration: [...previous.calibration] };
  // Time since the last reading, within reason
  const gap = Math.min(MAX_GAP_MS, Math.max(0, reading.atMs - previous.lastAtMs));
  // Now
  state.lastAtMs = reading.atMs;

  // The words: none at all means there is no speech service
  if (reading.words === null) state.wordsSignal = "missing";
  // New words
  else if (reading.words.trim() !== state.words.trim() && reading.words.trim() !== "") {
    // Kept
    state.words = reading.words;
    // Changed now
    state.wordsChangedAtMs = reading.atMs;
    // Arriving (unless already given up on for this turn)
    if (state.wordsSignal !== "missing") state.wordsSignal = "present";
    // Speech since then starts again
    state.speechSinceWordsMs = 0;
  }

  // The floor: from the first few readings, then adapting
  if (state.floor === null) {
    // Collect
    state.calibration.push(reading.level);
    // Enough: the quietest of them
    if (state.calibration.length >= CALIBRATION_READINGS) state.floor = Math.max(MIN_FLOOR, Math.min(...state.calibration));
  } else {
    // Loud and quiet, with a gap between so it does not flicker
    const loudNow = reading.level >= state.floor * LOUD_RATIO + LOUD_MARGIN ? true : reading.level <= state.floor * QUIET_RATIO + QUIET_MARGIN ? false : state.loud;
    // Kept
    state.loud = loudNow;
    // A loud stretch grows, or ends
    state.loudRunMs = loudNow ? state.loudRunMs + gap : 0;
    // Speech
    if (loudNow) {
      // Counted
      state.speechMs += gap;
      // And since the words changed
      state.speechSinceWordsMs += gap;
      // When it was last loud
      state.lastLoudAtMs = reading.atMs;
      // Long enough to be speech
      if (state.loudRunMs >= ONSET_MS) state.speechSeen = true;
    }
    // The floor moves
    state.floor = nextFloor(state.floor, reading.level, loudNow);
  }

  // Words that never came, or stopped while the person kept talking: use the level alone from now on
  if (state.wordsSignal === "unknown" && state.speechMs >= WORDS_GRACE_MS) state.wordsSignal = "missing";
  // (stopped)
  if (state.wordsSignal === "present" && state.speechSinceWordsMs >= WORDS_STALE_MS) state.wordsSignal = "missing";

  // The timings and the wait
  const timings = timingsFor(state, options);
  // The quiet needed
  const waitMs = waitFor(state, options);
  // Whether only the level counts
  const levelOnly = state.wordsSignal === "missing";

  // Already ended: nothing more
  if (previous.ended) return { state, end: null, cue: { phase: "waiting", progress: 0, waitMs, levelOnly } };
  // Too long: end it
  if (reading.atMs - state.startedAtMs >= timings.maxTurnMs) return { state: { ...state, ended: true }, end: "max-length", cue: { phase: "pausing", progress: 1, waitMs, levelOnly } };
  // No speech yet, or still calibrating
  if (state.floor === null || !state.speechSeen) return { state, end: null, cue: { phase: "waiting", progress: 0, waitMs, levelOnly } };
  // Speaking
  if (state.loud) return { state, end: null, cue: { phase: "speaking", progress: 0, waitMs, levelOnly } };
  // How long it has been quiet
  const silentFor = reading.atMs - (state.lastLoudAtMs ?? reading.atMs);
  // How long the words have stood still (no limit when only the level counts)
  const steadyFor = levelOnly || state.wordsChangedAtMs === null ? silentFor : reading.atMs - state.wordsChangedAtMs;
  // The quiet that counts: both must hold
  const quietFor = Math.min(silentFor, steadyFor);
  // How far through the wait
  const progress = Math.min(1, Math.max(0, quietFor / waitMs));
  // Not enough speech yet to end by itself
  const enoughSpeech = state.speechMs >= timings.minSpeechMs;
  // Words are needed when they are coming
  const hasWords = levelOnly || state.words.trim() !== "";
  // Held for someone mid-action: wait, however long it has been quiet
  if (reading.held) return { state, end: null, cue: { phase: "holding", progress, waitMs, levelOnly } };
  // Long enough: end it
  if (enoughSpeech && hasWords && quietFor >= waitMs) return { state: { ...state, ended: true }, end: "silence", cue: { phase: "pausing", progress: 1, waitMs, levelOnly } };
  // Counting down (only shown once the turn could end)
  return { state, end: null, cue: { phase: "pausing", progress: enoughSpeech && hasWords ? progress : 0, waitMs, levelOnly } };
}


// How a turn of yours ends in a conversation: tap Done, automatically when you stop talking (Settings; decision 101), live, where a streaming service's end-of-turn model decides (beta, uses live minutes; decision 119), or a phone call with the ElevenLabs agent, where there are no turns to end (beta, uses call minutes; decision 121)
export type TurnEnding = "tap" | "auto" | "live" | "call";

// Automatically unless chosen otherwise (decision 101 says why)
export const DEFAULT_TURN_ENDING: TurnEnding = "auto";

// The saved choice, made safe: tap, live or a call only when chosen, anything else automatically
export function turnEndingOf(settings: { turnEnding?: unknown } | null | undefined): TurnEnding {
  // Tap, live or a call only when chosen
  return settings?.turnEnding === "tap" || settings?.turnEnding === "live" || settings?.turnEnding === "call" ? settings.turnEnding : DEFAULT_TURN_ENDING;
}

// Whether a turn ending with these words asked a question, so no listening sound plays before the answer (decision 102): a question mark, or a question opening near the end (speech recognition rarely adds the mark)
export function soundsLikeQuestion(words: string): boolean {
  // The words, lowercased
  const text = words.trim().toLowerCase();
  // A question mark, or a question opening in the last few words
  return text.endsWith("?") || /\b(what|how|why|where|when|who|which|do you|did you|have you|are you|is it|can you|would you|could you|what about you|and you)\b[^.!]{0,40}$/.test(text);
}
