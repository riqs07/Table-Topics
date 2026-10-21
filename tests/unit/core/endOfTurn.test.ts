// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the rules being checked
import { LEVEL_ONLY_TIMINGS, WORD_TIMINGS, endsMidThought, startTurn, stepTurn, type EndReason, type TurnCue, type TurnOptions } from "@/core/endOfTurn";

// One stretch of a made-up timeline: how long, how loud, and the words heard by its end (null for no speech service)
interface Stretch {
  // How long it lasts, in milliseconds
  ms: number;
  // The level throughout
  level: number;
  // The words by the end of the stretch (kept from before when left out)
  words?: string | null;
  // Held for someone mid-action
  held?: boolean;
}

// Room noise: a quiet hum
const ROOM = 0.01;
// Speech: well above the room
const VOICE = 0.12;

// Run a timeline a tenth of a second at a time; hand back when and why it ended (null when it did not), and the cues seen
function run(timeline: ReadonlyArray<Stretch>, options: TurnOptions = {}): { endedAt: number | null; reason: EndReason | null; cues: TurnCue[] } {
  // A new turn at zero
  let state = startTurn(0);
  // The time now
  let at = 0;
  // The words so far
  let words: string | null = "";
  // The cues seen
  const cues: TurnCue[] = [];
  // Each stretch
  for (const stretch of timeline) {
    // The words given, if any
    if (stretch.words !== undefined) words = stretch.words;
    // Each tenth of a second in it
    for (let passed = 0; passed < stretch.ms; passed += 100) {
      // Time moves on
      at += 100;
      // One reading
      const step = stepTurn(state, { atMs: at, level: stretch.level, words, held: stretch.held }, options);
      // Kept
      state = step.state;
      // Noted
      cues.push(step.cue);
      // Ended
      if (step.end) return { endedAt: at, reason: step.end, cues };
    }
  }
  // Never ended
  return { endedAt: null, reason: null, cues };
}

// Group the checks about words that carry on
describe("endsMidThought", () => {
  // Joining words, hesitations, articles and pairs carry on; a finished sentence does not
  it("spots a turn that stops mid-thought", () => {
    // Each case
    expect(["I went climbing and", "it was great so", "um", "I saw the", "you know", "kind of", "we went there,", "I was…", "It was great", "what about you", ""].map(endsMidThought)).toEqual([true, true, true, true, true, true, true, true, false, false, false]);
  });
});

// Group the checks about ending a turn by itself (decision 101)
describe("stepTurn", () => {
  // A short answer, then quiet: it ends once the quiet and still words have lasted the usual wait
  it("ends after a short answer and a pause", () => {
    // Quiet, speech for two seconds, then quiet
    const result = run([{ ms: 300, level: ROOM }, { ms: 2_000, level: VOICE, words: "I went climbing on Saturday" }, { ms: 5_000, level: ROOM }]);
    // Ended by silence, the usual wait after the last speech
    expect([result.reason, result.endedAt]).toEqual(["silence", 2_300 + WORD_TIMINGS.silenceMs]);
  });

  // A short pause to think mid-answer does not end it
  it("does not end on a short pause", () => {
    // Speech, a one-second pause, more speech, then a long quiet
    const result = run([{ ms: 300, level: ROOM }, { ms: 2_000, level: VOICE, words: "I went climbing" }, { ms: 1_000, level: ROOM }, { ms: 1_500, level: VOICE, words: "I went climbing on Saturday with my sister" }, { ms: 5_000, level: ROOM }]);
    // Ended only after the second stretch
    expect([result.reason, result.endedAt]).toEqual(["silence", 4_800 + WORD_TIMINGS.silenceMs]);
  });

  // A trailing "and…" waits longer, and carrying on cancels the end
  it("waits longer after a word that carries on", () => {
    // Speech ending on "and", then quiet
    const trailing = run([{ ms: 300, level: ROOM }, { ms: 2_000, level: VOICE, words: "I went climbing and" }, { ms: 6_000, level: ROOM }]);
    // The same pause, but the person carries on before the longer wait is up
    const carriesOn = run([{ ms: 300, level: ROOM }, { ms: 2_000, level: VOICE, words: "I went climbing and" }, { ms: 2_000, level: ROOM }, { ms: 1_000, level: VOICE, words: "I went climbing and fell off" }, { ms: 5_000, level: ROOM }]);
    // The longer wait, and the carried-on turn ends only after the second stretch
    expect([trailing.endedAt, carriesOn.endedAt]).toEqual([2_300 + WORD_TIMINGS.continuationMs, 5_300 + WORD_TIMINGS.silenceMs]);
  });

  // Words still changing (the speech service catching up) hold the end back even when it is quiet
  it("waits for the words to stop changing", () => {
    // Speech, then quiet while the last words arrive a second later
    const result = run([{ ms: 300, level: ROOM }, { ms: 2_000, level: VOICE, words: "it was" }, { ms: 900, level: ROOM }, { ms: 100, level: ROOM, words: "it was really good fun" }, { ms: 5_000, level: ROOM }]);
    // The wait counts from the last change of words, at 3.3 seconds
    expect(result.endedAt).toBe(3_300 + WORD_TIMINGS.silenceMs);
  });

  // Steady noise (a fan) is learned as the floor and never ends a turn on its own; a cough-length burst is not speech
  it("ignores steady noise and short bursts", () => {
    // A noisy room, a short knock, more noise
    const result = run([{ ms: 300, level: 0.06 }, { ms: 200, level: 0.4, words: "" }, { ms: 8_000, level: 0.06 }]);
    // Never ended, and never counted as speaking
    expect([result.endedAt, result.cues.some((cue) => cue.phase === "pausing")]).toEqual([null, false]);
  });

  // Speech in a noisy room still ends once the speech stops
  it("ends speech over steady noise", () => {
    // A noisy room, speech over it, then the noise alone
    const result = run([{ ms: 300, level: 0.05 }, { ms: 2_000, level: 0.3, words: "the trains were late again" }, { ms: 5_000, level: 0.05 }]);
    // Ended by silence after the usual wait
    expect(result.endedAt).toBe(2_300 + WORD_TIMINGS.silenceMs);
  });

  // No speech at all: never ends by itself until the longest turn
  it("never ends with no speech, except at the longest turn", () => {
    // A minute and more of quiet
    const result = run([{ ms: 61_000, level: ROOM }]);
    // Ended by length at exactly the limit
    expect([result.reason, result.endedAt]).toEqual(["max-length", WORD_TIMINGS.maxTurnMs]);
  });

  // A word or two, too short to count, does not end it
  it("needs a little speech before ending", () => {
    // Half a second of speech, then quiet
    const result = run([{ ms: 300, level: ROOM }, { ms: 500, level: VOICE, words: "yes" }, { ms: 5_000, level: ROOM }]);
    // Not ended
    expect(result.endedAt).toBeNull();
  });

  // A long monologue with breaths ends sooner after its last pause, and never mid-way
  it("ends a long monologue soon after it stops, not at its breaths", () => {
    // Twenty-four seconds of speech in four-second stretches with half-second breaths, then quiet
    const talk: Stretch[] = Array.from({ length: 6 }, (_, index) => [{ ms: 3_500, level: VOICE, words: `sentence ${index} is here` }, { ms: 500, level: ROOM }]).flat();
    // Run it
    const result = run([{ ms: 300, level: ROOM }, ...talk, { ms: 5_000, level: ROOM }]);
    // The last speech ended at 0.3 + 6 × 4 − 0.5 seconds; the shorter wait for long turns applies
    expect(result.endedAt).toBe(23_800 + WORD_TIMINGS.longTurnSilenceMs);
  });

  // Without any speech service, only the level counts, with the longer waits
  it("falls back to the level alone, with longer waits", () => {
    // No words at all
    const result = run([{ ms: 300, level: ROOM, words: null }, { ms: 3_000, level: VOICE }, { ms: 5_000, level: ROOM }]);
    // The level-only wait
    expect(result.endedAt).toBe(3_300 + LEVEL_ONLY_TIMINGS.silenceMs);
  });

  // Words that stop arriving while the person keeps talking (Safari on an iPhone) switch to the level alone
  it("stops waiting for words that stopped coming", () => {
    // Words at first, then six seconds of speech with no new words, then quiet
    const result = run([{ ms: 300, level: ROOM }, { ms: 1_000, level: VOICE, words: "so I" }, { ms: 6_000, level: VOICE }, { ms: 5_000, level: ROOM }]);
    // Ended on the level-only wait (the words "so I" would otherwise have meant the longer wait)
    expect([result.endedAt, result.cues.at(-1)?.levelOnly]).toEqual([7_300 + LEVEL_ONLY_TIMINGS.silenceMs, true]);
  });

  // An iPhone uses the longer waits even when words arrive
  it("uses the longer waits when asked to be conservative", () => {
    // A short answer, then quiet
    const result = run([{ ms: 300, level: ROOM }, { ms: 2_500, level: VOICE, words: "it was fine" }, { ms: 5_000, level: ROOM }], { conservative: true });
    // The level-only wait
    expect(result.endedAt).toBe(2_800 + LEVEL_ONLY_TIMINGS.silenceMs);
  });

  // Someone using a keyboard or screen reader mid-action holds the end, however long the quiet
  it("never ends while held", () => {
    // Speech, then quiet while held, then quiet again
    const result = run([{ ms: 300, level: ROOM }, { ms: 2_000, level: VOICE, words: "it was fine" }, { ms: 4_000, level: ROOM, held: true }, { ms: 2_000, level: ROOM, held: false }]);
    // Held at first, then ends at the next reading once let go
    expect([result.cues.some((cue) => cue.phase === "holding"), result.endedAt]).toEqual([true, 6_400]);
  });

  // The cue counts down in steps the screen can show: speaking, then a pause filling up
  it("shows the countdown as the pause goes on", () => {
    // Speech, then quiet
    const { cues } = run([{ ms: 300, level: ROOM }, { ms: 2_000, level: VOICE, words: "it was fine" }, { ms: 5_000, level: ROOM }]);
    // The phases in order, and the progress rising to the end
    const phases = cues.map((cue) => cue.phase).filter((phase, index, list) => phase !== list[index - 1]);
    // Progress while pausing
    const progress = cues.filter((cue) => cue.phase === "pausing").map((cue) => cue.progress);
    // Waiting, speaking, then pausing, rising steadily to one
    expect([phases, progress.every((value, index) => index === 0 || value >= progress[index - 1]!), progress.at(-1)]).toEqual([["waiting", "speaking", "pausing"], true, 1]);
  });

  // A turn that already ended says nothing more
  it("ends once", () => {
    // A turn that ended
    const ended = { ...startTurn(0), ended: true };
    // Another reading
    expect(stepTurn(ended, { atMs: 100_000, level: 0, words: "" }).end).toBeNull();
  });
});

// Group the checks about the saved choice
describe("turnEndingOf", () => {
  // Automatic unless "tap" was chosen; damaged values read as automatic
  it("reads the choice safely", async () => {
    // The reader
    const { turnEndingOf } = await import("@/core/endOfTurn");
    // Each case
    expect([turnEndingOf(undefined), turnEndingOf({}), turnEndingOf({ turnEnding: "tap" }), turnEndingOf({ turnEnding: "auto" }), turnEndingOf({ turnEnding: 3 })]).toEqual(["auto", "auto", "tap", "auto", "auto"]);
  });
});
