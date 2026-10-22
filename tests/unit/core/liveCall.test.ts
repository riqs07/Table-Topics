// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the pieces being checked
import { CallTranscript, buildCallOverrides, callPrompt } from "@/core/liveCall";
// Load the content
import { findDifficulty, findPersona, findScenario } from "@/content/conversations";

// Maya at the station, Theo early for a meeting
const [MAYA, THEO, STATION, MEETING] = [findPersona("maya")!, findPersona("theo")!, findScenario("station")!, findScenario("meeting")!];

// Group the checks on the call's overrides (decision 121)
describe("call overrides", () => {
  // The instructions carry the persona, the situation, this time's twist, the difficulty and the house rules
  it("builds the agent's instructions from the persona, situation, twist and difficulty", () => {
    // Hard, with the second twist
    const prompt = callPrompt({ persona: THEO, scenario: MEETING, twist: 1, difficulty: "hard" });
    // Each part
    expect([prompt.includes("Character: Theo"), prompt.includes(THEO.background), prompt.includes(MEETING.twists[1]!.replace("{name}", "Theo")), prompt.includes(`Difficulty: ${findDifficulty("hard").rule}`), prompt.includes("never mention practice, the app, a skill or that you are an AI"), prompt.includes("at most 40 words"), prompt.includes("After about 2.5 minutes"), prompt.includes("by 3 minutes"), /\{name\}/.test(prompt)]).toEqual([true, true, true, true, true, true, true, true, false]);
  });

  // Normal adds no difficulty line
  it("adds no difficulty line for normal", () => {
    // Normal
    expect(callPrompt({ persona: THEO, scenario: MEETING, twist: 0, difficulty: "normal" }).includes("Difficulty:")).toBe(false);
  });

  // The payload as the SDK takes it: Maya's stand-in voice, the situation's first line, English, and the duration kept apart
  it("builds the SDK payload with the stand-in voice and the first line", () => {
    // Maya at the station, five minutes
    const built = buildCallOverrides({ persona: MAYA, scenario: STATION, twist: 0, difficulty: "easy", voice: true, maxDurationSeconds: 300 });
    // The shape
    expect([Object.keys(built.overrides).sort(), built.overrides.agent.firstMessage, built.overrides.agent.language, built.overrides.tts, built.maxDurationSeconds, built.overrides.agent.prompt.prompt.includes("Difficulty: Make this conversation easy")]).toEqual([["agent", "tts"], "No way, hi! It’s been ages! How are you?", "en", { voiceId: "Mac2FKpSgaGIsaNRXt8A" }, 300, true]);
  });

  // After the agent refused the voice: no voice asked for, so the agent's own speaks
  it("leaves the voice out when falling back to the agent's own", () => {
    // Without the voice
    expect(buildCallOverrides({ persona: THEO, scenario: MEETING, twist: 0, difficulty: "normal", voice: false, maxDurationSeconds: 120.4 })).toMatchObject({ overrides: { agent: { firstMessage: "Oh. Hi. Looks like we’re early." } }, maxDurationSeconds: 120 });
    // And no tts at all
    expect("tts" in buildCallOverrides({ persona: THEO, scenario: MEETING, twist: 0, difficulty: "normal", voice: false, maxDurationSeconds: 60 }).overrides).toBe(false);
  });
});

// Group the checks on collecting a call's transcript from the SDK's events
describe("call transcript", () => {
  // A call: the agent opens, you answer, you cut in, the line is corrected, the agent answers, you say goodbye
  it("collects the turns with their times, cut-ins and corrections", () => {
    // Started at 10 s on the page's clock
    const transcript = new CallTranscript(10_000);
    // The events as the SDK hands them over (times in milliseconds)
    for (const event of [
      { type: "mode", at: 10_200, mode: "speaking" },
      { type: "agent", at: 10_300, text: "No way, hi! It's been ages!" },
      { type: "mode", at: 12_500, mode: "listening" },
      { type: "vad", at: 13_100, score: 0.9 },
      { type: "user", at: 15_000, text: "hey Maya so good to see you" },
      { type: "mode", at: 15_600, mode: "speaking" },
      { type: "agent", at: 15_700, text: "You too! So, I got the job in Lisbon and I'm moving next month and" },
      { type: "vad", at: 17_000, score: 0.8 },
      { type: "interruption", at: 17_400 },
      { type: "correction", at: 17_450, text: "You too! So, I got the job in Lisbon" },
      { type: "mode", at: 17_500, mode: "listening" },
      { type: "user", at: 18_500, text: "wait Lisbon congratulations" },
      { type: "mode", at: 19_000, mode: "speaking" },
      { type: "agent", at: 19_100, text: "Thanks! I'm still in shock." },
    ] as const) transcript.add(event);
    // Finished at 21 s
    const turns = transcript.finish(21_000);
    // Each turn, its times and the cut
    expect(turns.map((turn) => [turn.who, turn.text, turn.at, turn.end, turn.cut ?? false])).toEqual([
      ["them", "No way, hi! It's been ages!", 0.2, 2.5, false],
      ["you", "hey Maya so good to see you", 3.1, 5, false],
      ["them", "You too! So, I got the job in Lisbon", 5.6, 7.4, true],
      ["you", "wait Lisbon congratulations", 7, 8.5, false],
      ["them", "Thanks! I'm still in shock.", 9, 11, false],
    ]);
  });

  // Empty lines are left out; a turn of yours with no score before it starts when it arrived
  it("leaves out empty lines and times a turn heard without a score", () => {
    // From zero
    const transcript = new CallTranscript(0);
    // An empty agent line, an empty transcript, then a line of yours
    for (const event of [{ type: "agent", at: 100, text: " " }, { type: "user", at: 900, text: "" }, { type: "user", at: 2_000, text: "hello" }] as const) transcript.add(event);
    // Only yours, as a moment
    expect(transcript.finish()).toEqual([{ who: "you", text: "hello", seconds: 0, at: 2, end: 2 }]);
  });

  // A line still being spoken at the end is closed at the end
  it("closes an open line at the end", () => {
    // From zero
    const transcript = new CallTranscript(0);
    // The agent speaking
    transcript.add({ type: "mode", at: 500, mode: "speaking" });
    // (its line)
    transcript.add({ type: "agent", at: 600, text: "Hi there." });
    // Closed at 4 s
    expect(transcript.finish(4_000)[0]).toMatchObject({ at: 0.5, end: 4, seconds: 3.5 });
  });
});
