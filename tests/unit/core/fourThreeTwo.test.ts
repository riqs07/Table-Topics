// Checks for the 4/3/2 loop (decision 118): the scaled timings, the rounds' windows, linking the rounds, the table and the line, and the three-way curve line-up
import { describe, expect, it } from "vitest";
// Load what is being checked
import { isLoopMode, LOOP_TARGETS, loopComplete, loopHref, loopRounds, loopTargets, roundTarget, targetWords } from "@/core/fourThreeTwo";
import { loopChangeLine, loopTable, roundNumbers, type RoundNumbers } from "@/core/loopCompare";
import { loopWindow, takeWindow, timingSentence, windowSignal } from "@/core/recordingRules";
import { alignThree } from "@/core/takeMatch";
import { localChange } from "@/core/localChange";
// Load the phrase builder and the word placement
import { pitchWords } from "@/core/pitchPhrases";
import { alignFromServer } from "@/core/wordAlign";
// Load the made-up takes and the session builder
import { makeTake, type SaidWord } from "../../support/pitchTake";
import { makeSession } from "../../support/fixtures";

// The timings
describe("4/3/2 timings", () => {
  // Nation's own for a prepared speech, the 4:3:2 ratio scaled for stories
  it("uses 4:00, 3:00, 2:00 for a prepared speech and scales stories", () => {
    // Each kind's three targets
    expect([loopTargets("response"), loopTargets("story", "full"), loopTargets("story", "short")]).toEqual([[240, 180, 120], [180, 135, 90], [120, 90, 60]]);
    // Each keeps the 4:3:2 ratio
    for (const targets of Object.values(LOOP_TARGETS)) expect([targets[1] / targets[0], targets[2] / targets[0]]).toEqual([0.75, 0.5]);
    // A round's target, rounds kept within one to three
    expect([roundTarget("story", "short", 2), roundTarget("response", "full", 0), roundTarget("response", "full", 9)]).toEqual([90, 240, 120]);
    // In words
    expect(targetWords("response")).toBe("4:00, then 3:00, then 2:00");
    // Offered for prepared speeches and stories only
    expect([isLoopMode("response"), isLoopMode("story"), isLoopMode("talk")]).toEqual([true, true, false]);
  });

  // Each round's lights, scaled from the prepared speech's
  it("gives each round lights scaled from its target", () => {
    // A 4:00 round has exactly the prepared speech's lights
    expect(loopWindow(240)).toEqual({ start: 120, yellow: 180, end: 240, limit: 270 });
    // A 1:00 round
    expect(loopWindow(60)).toEqual({ start: 30, yellow: 45, end: 60, limit: 70 });
    // The light at moments in a 2:00 round
    expect([10, 61, 95, 121, 140].map((seconds) => windowSignal(loopWindow(120), seconds))).toEqual(["none", "green", "yellow", "red", "overtime"]);
    // A saved round's window and timing sentence follow its target, not its kind's
    const round = makeSession({ mode: "response", durationSec: 110, loop: { id: "l", round: 3, targetSec: 120 } });
    // (the window)
    expect(takeWindow(round)).toEqual(loopWindow(120));
    // (the sentence: inside 1:00 to 2:00, not under a prepared speech's 2:00 minimum)
    expect(timingSentence(round.mode, round.durationSec, undefined, round.promptId, "full", takeWindow(round))).toBe("1:50, inside the 1:00 to 2:00 window.");
    // The change from the numbers does not call a 1:50 third round too short
    expect(localChange({ ...round, wordsPerMinute: 130, fillersPerMinute: 1 }).aboutTiming).toBeFalsy();
  });
});

// Linking the rounds
describe("4/3/2 rounds", () => {
  // The address of each round
  it("builds each round's address with the same set-up", () => {
    // A story's second round
    expect(loopHref({ mode: "story", promptId: "sp01", story: { shape: "but-therefore", focus: "dialogue", length: "short" } }, "abc", 2)).toBe("/session?mode=story&prompt=sp01&shape=but-therefore&focus=dialogue&length=short&loop=abc&round=2");
    // A prepared speech's first, retrying a take, inside today's practice
    expect(loopHref({ mode: "response", promptId: "p008", retryOf: "s1", planStep: 3 }, "new", 1)).toBe("/session?mode=response&prompt=p008&retryOf=s1&loop=new&round=1&plan=3");
  });

  // The rounds found by the loop's id, in order, a repeated round keeping its latest
  it("finds a loop's rounds and checks they are whole", () => {
    // Three rounds out of order, a repeat of round 2, another loop and a plain take
    const sessions = [
      // Round 3
      makeSession({ id: "c", createdAt: "2026-10-22T10:09:00Z", loop: { id: "L", round: 3, targetSec: 60 }, mode: "story", promptId: "sp01" }),
      // Round 1
      makeSession({ id: "a", createdAt: "2026-10-22T10:01:00Z", loop: { id: "L", round: 1, targetSec: 120 }, mode: "story", promptId: "sp01" }),
      // Round 2, then told again
      makeSession({ id: "b1", createdAt: "2026-10-22T10:04:00Z", loop: { id: "L", round: 2, targetSec: 90 }, mode: "story", promptId: "sp01" }),
      // (again)
      makeSession({ id: "b2", createdAt: "2026-10-22T10:06:00Z", loop: { id: "L", round: 2, targetSec: 90 }, mode: "story", promptId: "sp01" }),
      // Another loop
      makeSession({ id: "x", loop: { id: "M", round: 1, targetSec: 120 }, mode: "story", promptId: "sp01" }),
      // A plain take
      makeSession({ id: "y", mode: "story", promptId: "sp01" }),
    ];
    // The rounds
    const rounds = loopRounds(sessions, "L");
    // In order, the later round 2
    expect(rounds.map((round) => round.id)).toEqual(["a", "b2", "c"]);
    // Whole
    expect(loopComplete(rounds)).toBe(true);
    // Not whole: two rounds, or a round of another prompt
    expect([loopComplete(rounds.slice(0, 2)), loopComplete([rounds[0]!, rounds[1]!, { ...rounds[2]!, promptId: "sp02" }])]).toEqual([false, false]);
  });
});

// The table and the line
describe("4/3/2 comparison", () => {
  // Three rounds' numbers
  const numbers = (paces: number[], words: number[]): RoundNumbers[] => paces.map((pace, index) => ({ round: index + 1, pace, pauseWords: words[index]!, pauses: 6, storyChecks: null, durationSec: [235, 170, 118][index]!, targetSec: [240, 180, 120][index]! }));

  // A clear rise in pace and fall in pause words are said; small ones are not
  it("says only the changes that clear the noise", () => {
    // Pace up 28 and pause words down from 6 to 2
    expect(loopChangeLine(numbers([122, 135, 150], [6, 4, 2]))).toBe("From round 1 to round 3, your pace went from 122 to 150 a minute, and pause words from 6 to 2 a minute.");
    // Pace up 8 (under a tenth or 10) and pause words 6 to 5 (under a quarter): about the same
    expect(loopChangeLine(numbers([122, 126, 130], [6, 5.5, 5]))).toBe("From round 1 to round 3, your pace and pause words stayed about the same.");
    // Pause words hidden: only pace is spoken of
    expect([loopChangeLine(numbers([122, 126, 130], [6, 4, 1]), { pauseWords: false }), loopChangeLine(numbers([100, 110, 140], [6, 4, 1]), { pauseWords: false })]).toEqual(["From round 1 to round 3, your pace stayed about the same.", "From round 1 to round 3, your pace went from 100 to 140 a minute."]);
    // One round only
    expect(loopChangeLine(numbers([100], [2]))).toBe("Tell all three rounds to compare them.");
  });

  // The rows, with story checks only for a story and time against target
  it("lays out the table", () => {
    // A prepared speech's rows
    expect(loopTable(numbers([122, 135, 150], [6, 4, 2]))).toEqual([
      // Pace
      { label: "pace a min", values: ["122", "135", "150"] },
      // Pause words
      { label: "pause words a min", values: ["6", "4", "2"] },
      // Pauses
      { label: "pauses a min", values: ["6", "6", "6"] },
      // Time against target
      { label: "time / target", values: ["3:55 / 4:00", "2:50 / 3:00", "1:58 / 2:00"] },
    ]);
    // A story's rows add the checks, and pause words can be left out
    expect(loopTable(numbers([1, 2, 3], [0, 0, 0]).map((round) => ({ ...round, storyChecks: 4 })), { pauseWords: false }).map((row) => row.label)).toEqual(["pace a min", "pauses a min", "story checks", "time / target"]);
  });

  // Numbers from saved rounds
  it("works out each round's numbers", () => {
    // A story round with loudness: speech, a long quiet, speech
    const round = makeSession({ mode: "story", durationSec: 60, wordsPerMinute: 131.6, fillersPerMinute: 2.04, transcript: "The train stopped dead but then the guard said don't worry and I was so relieved", loudness: [...Array(100).fill(0.3), ...Array(15).fill(0.01), ...Array(100).fill(0.3)], loop: { id: "L", round: 2, targetSec: 90 } });
    // Its numbers
    expect(roundNumbers([round])[0]).toMatchObject({ round: 2, pace: 132, pauseWords: 2, durationSec: 60, targetSec: 90, pauses: 1, storyChecks: expect.any(Number) });
    // A prepared speech has no story checks
    expect(roundNumbers([{ ...round, mode: "response" }])[0]!.storyChecks).toBeNull();
  });
});

// Three curves on a matching phrase
describe("alignThree", () => {
  // A sentence said with the given steps
  const said = (steps: number[]): SaidWord[] => "We moved the meeting to Friday".split(" ").map((text, index) => ({ text, step: steps[index] ?? 0 }));
  // A take's phrases, with exact word times
  const phrasesOf = (phrases: ReadonlyArray<{ words: SaidWord[]; pauseAfter: number }>) => {
    // Made
    const take = makeTake(phrases);
    // In words
    return pitchWords({ pitch: take.pitch, alignment: alignFromServer(take.serverWords), tickMs: 100 })!.phrases;
  };

  // The phrase all three rounds share comes first, with both partners
  it("lines up the phrase all three rounds share", () => {
    // Round 1: an extra phrase first, then the sentence
    const first = phrasesOf([{ words: [{ text: "So", step: 0 }, { text: "anyway", step: 1 }, { text: "listen", step: 0 }], pauseAfter: 1.2 }, { words: said([0, 1, 0, 2, 0, -2]), pauseAfter: 0.5 }]);
    // Round 2: the sentence
    const middle = phrasesOf([{ words: said([0, 2, 0, 3, 0, -2]), pauseAfter: 0.5 }]);
    // Round 3: the sentence, then a new phrase no one else said
    const last = phrasesOf([{ words: said([1, 3, 0, 4, 0, -3]), pauseAfter: 1.2 }, { words: [{ text: "Nobody", step: 0 }, { text: "complained", step: 1 }, { text: "afterwards", step: 0 }], pauseAfter: 0.5 }]);
    // Lined up
    const triples = alignThree(first, middle, last);
    // One phrase, with both partners, matching all six words
    expect(triples.map((triple) => [triple.after.index, triple.first?.words.length, triple.middle?.words.length])).toEqual([[0, 6, 6]]);
  });

  // A phrase only one earlier round shares still shows, with that one
  it("keeps a phrase with one partner, and none without", () => {
    // Round 1 says something else entirely
    const first = phrasesOf([{ words: [{ text: "Completely", step: 0 }, { text: "different", step: 1 }, { text: "words", step: 0 }], pauseAfter: 0.5 }]);
    // Rounds 2 and 3 say the sentence
    const [middle, last] = [phrasesOf([{ words: said([0, 2, 0, 3, 0, -2]), pauseAfter: 0.5 }]), phrasesOf([{ words: said([0, 3, 0, 4, 0, -3]), pauseAfter: 0.5 }])];
    // One partner
    expect(alignThree(first, middle, last).map((triple) => [triple.first, triple.middle?.words.length])).toEqual([[null, 6]]);
    // No partners at all
    expect(alignThree(first, first, last)).toEqual([]);
  });
});
