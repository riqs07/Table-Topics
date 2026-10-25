// A take at a glance (decision 115): the fingerprint and its tiny copy, the best moment (including the "nothing good" case), the energy arc, a conversation's timeline, the usual zone
import { describe, expect, it } from "vitest";
// Load the pieces
import { fingerprintHeadline, miniFingerprint, sessionMiniFingerprint, stripStretches, takeFingerprint } from "@/core/fingerprint";
import { MINI_BINS, isMiniFingerprint, miniStretches } from "@/core/miniFingerprint";
import { bestMoment } from "@/core/bestMoment";
import { arcLine, energyArc } from "@/core/energyArc";
import { conversationTimeline } from "@/core/conversationTimeline";
import { usualZones } from "@/core/usualZone";
import { pitchWords } from "@/core/pitchPhrases";
import { alignFromServer } from "@/core/wordAlign";
import { findMetric } from "@/core/analysis/metrics";
// Load the made-up takes
import { makeTake, ZOO_PHRASES, type SaidPhrase } from "../../support/pitchTake";
// Load the types
import type { MetricSummary } from "@/core/analysis/profile";

// Loudness readings ten a second: speech at a level for some seconds, then silence for some, in turn
function levels(parts: ReadonlyArray<[number, number]>): number[] {
  // Each part's readings
  return parts.flatMap(([seconds, level]) => Array.from({ length: Math.round(seconds * 10) }, () => level));
}

describe("the fingerprint", () => {
  // Stretches split at silences
  it("splits speech into stretches at silences and scales them to the loudest", () => {
    // Two stretches, the second quieter, with a short cough between
    const stretches = stripStretches(levels([[0.5, 0.01], [2, 0.3], [1, 0.01], [3, 0.15], [0.5, 0.01], [0.1, 0.2], [0.5, 0.01]]), 100);
    // The cough is too short to count; the second stretch is half as loud
    expect(stretches.map((stretch) => [stretch.start, stretch.end, stretch.level])).toEqual([[0.5, 2.5], [3.5, 6.5]].map(([start, end], index) => [start, end, index === 0 ? 1 : 0.5]));
  });

  // The headline's rules
  it("words its headline from the pauses and where the pause words came", () => {
    // Calm, no pause words
    expect(fingerprintHeadline({ betweenPauses: 4, midPauses: 0, ums: [], duration: 150 })).toBe("Pauses between thoughts, no pause words.");
    // Split sentences, pause words bunched in the middle
    expect(fingerprintHeadline({ betweenPauses: 1, midPauses: 3, ums: [60, 70, 80, 140], duration: 150 })).toBe("3 pauses split a sentence, pause words bunched in the middle.");
    // One wobble
    expect(fingerprintHeadline({ betweenPauses: 3, midPauses: 1, ums: [10, 140], duration: 150 })).toBe("Pauses between thoughts, one mid-sentence, 2 pause words.");
    // Few pauses
    expect(fingerprintHeadline({ betweenPauses: 0, midPauses: 0, ums: [5], duration: 150 })).toBe("Few pauses, 1 pause word.");
  });

  // The quieter end
  it("notes a last stretch much quieter than the take's usual", () => {
    // Three loud stretches and a quiet one
    const print = takeFingerprint({ levels: levels([[2, 0.3], [0.5, 0.01], [2, 0.3], [0.5, 0.01], [2, 0.3], [0.5, 0.01], [2, 0.1]]), tickMs: 100, duration: 9.5, ums: [], peaks: [], midPauses: [], betweenPauses: 3 })!;
    // The note
    expect(print.note).toBe("The last stretch is lighter: your volume dropped as you finished.");
    // Nothing said, no fingerprint
    expect(takeFingerprint({ levels: levels([[3, 0]]), tickMs: 100, duration: 3, ums: [], peaks: [], midPauses: [], betweenPauses: 0 })).toBeNull();
  });
});

describe("the tiny fingerprint", () => {
  // 32 parts
  it("keeps 32 loudness levels and the parts with pause words", () => {
    // Half speech at two levels, half silence
    const mini = miniFingerprint(levels([[4, 0.3], [4, 0.15], [8, 0.01]]), 100, [1, 5, 5.1])!;
    // The shape
    expect(isMiniFingerprint(mini)).toBe(true);
    // Loud, then half, then silent
    expect([mini.bins[0], mini.bins[10], mini.bins[20]]).toEqual([9, 5, 0]);
    // The pause words' parts, each once
    expect(mini.ums).toEqual([2, 10]);
    // Its stretches for drawing
    expect(miniStretches(mini).map((run) => [run.from, run.to])).toEqual([[0, 15]]);
  });

  // Too little, or a damaged value
  it("makes none from too few readings and refuses a damaged value", () => {
    // Too few
    expect(miniFingerprint([0.2, 0.2], 100, [])).toBeNull();
    // Silence
    expect(miniFingerprint(levels([[5, 0]]), 100, [])).toBeNull();
    // Damaged
    expect(isMiniFingerprint({ v: 1, bins: [1, 2], ums: [] })).toBe(false);
    // (a later version)
    expect(isMiniFingerprint({ v: 2, bins: Array(MINI_BINS).fill(0), ums: [] })).toBe(false);
  });

  // From a saved take's transcript
  it("places a saved take's pause words at their first-heard time less the usual lag", () => {
    // "um" first heard at 3.6 s, in a 16 s take
    const mini = sessionMiniFingerprint({ transcript: "um hello there", spokenTimes: [3.6, 4, 4.4], loudness: levels([[16, 0.2]]) })!;
    // 3.0 s is part 6 at half a second a part
    expect(mini.ums).toEqual([6]);
  });
});

// The zoo story with its service words, as pitch in the words
function zooPitch(phrases: ReadonlyArray<SaidPhrase> = ZOO_PHRASES) {
  // The take, gliding
  const take = makeTake(phrases, { glide: true });
  // Its phrases from the service's exact words
  return { take, pitch: pitchWords({ pitch: take.pitch, alignment: alignFromServer(take.serverWords), tickMs: 100 })! };
}

describe("the best moment", () => {
  // A beat before a peak
  it("picks a window with a beat of silence before a clear peak on a word that carries meaning", () => {
    // "and a seagull… stole it right out of my hand." with a beat before "stole"
    const phrases: SaidPhrase[] = [ZOO_PHRASES[0]!, { words: [{ text: "and", step: 0 }, { text: "a", step: 0 }, { text: "seagull", step: 0.5 }], pauseAfter: 0.7 }, { words: [{ text: "stole", step: 7, level: 0.35 }, { text: "it", step: 1 }, { text: "right", step: 0.5 }, { text: "out", step: 0.4 }, { text: "of", step: 0.2 }, { text: "my", step: 0 }, { text: "hand.", step: -1, to: -4 }], pauseAfter: 1 }];
    // Its pitch
    const { take, pitch } = zooPitch(phrases);
    // The pick
    const moment = bestMoment({ phrases: pitch.phrases, fillers: [], levels: take.loudness, tickMs: 100 })!;
    // Its words, the beat shown
    expect(moment.words).toBe("and a seagull… stole it right out of my hand.");
    // Why
    expect(moment.why).toBe("A beat of silence, then your highest pitch on “stole”, the line ended low, without fading, and no pause words.");
    // Between three and six seconds
    expect(moment.end - moment.start).toBeGreaterThanOrEqual(3);
    // (at most six and a half with the lead-in and tail)
    expect(moment.end - moment.start).toBeLessThanOrEqual(6.5);
  });

  // A pause word rules a window out
  it("never picks a window with a pause word in it", () => {
    // The same, with an "um" heard inside the window
    const phrases: SaidPhrase[] = [{ words: [{ text: "and", step: 0 }, { text: "a", step: 0 }, { text: "seagull", step: 0.5 }], pauseAfter: 0.7 }, { words: [{ text: "stole", step: 7 }, { text: "it", step: 1 }, { text: "right", step: 0.5 }, { text: "out", step: 0.4 }, { text: "of", step: 0.2 }, { text: "my", step: 0 }, { text: "hand.", step: -1, to: -4 }], pauseAfter: 1 }];
    // Its pitch
    const { take, pitch } = zooPitch(phrases);
    // An "um" at 2 s
    expect(bestMoment({ phrases: pitch.phrases, fillers: [2], levels: take.loudness, tickMs: 100 })).toBeNull();
  });

  // Nothing good
  it("shows nothing when no window scores well (a flat take)", () => {
    // Flat phrases with no peaks and level endings
    const flat: SaidPhrase[] = Array.from({ length: 4 }, () => ({ words: "we went there and then we came back home".split(" ").map((text) => ({ text, step: 0 })), pauseAfter: 0.5 }));
    // Its pitch
    const { take, pitch } = zooPitch(flat);
    // Nothing picked
    expect(bestMoment({ phrases: pitch.phrases, fillers: [], levels: take.loudness, tickMs: 100 })).toBeNull();
  });
});

describe("the energy arc", () => {
  // Readings with loudness and pitch variety per third
  function take(thirds: ReadonlyArray<[number, number]>) {
    // Each third: 10 s at a loudness, pitch swinging by a number of steps
    const loud = thirds.flatMap(([level]) => Array.from({ length: 100 }, () => level));
    // (the pitch)
    const pitch = thirds.flatMap(([, swing]) => Array.from({ length: 100 }, (_, index) => Math.round(180 * 2 ** ((swing * Math.sin(index / 4)) / 12))));
    // The arc
    return energyArc(loud, pitch, 100);
  }

  // A fading finish
  it("says when the end was the quietest", () => {
    // Strong middle, faded end
    expect(take([[0.2, 3], [0.3, 5], [0.12, 1]])?.line).toBe("Strongest in the middle, quieter at the end. Give your last line the most energy.");
  });

  // Steady and building
  it("names a steady arc and one that built to the end", () => {
    // Steady
    expect(take([[0.2, 3], [0.2, 3], [0.2, 3]])?.line).toBe("Steady energy from start to finish.");
    // Built
    expect(take([[0.12, 1], [0.2, 3], [0.3, 5]])?.line).toBe("Energy built to the end.");
  });

  // The other shapes
  it("names a quiet start and a dip in the middle", () => {
    // A quiet start, strongest in the middle
    expect(arcLine([0.7, 1.3, 1])).toBe("A quiet start, strongest in the middle.");
    // A dip
    expect(arcLine([1.2, 0.7, 1.1])).toBe("Strong at the start and end, with a dip in the middle.");
    // Strong start, faded
    expect(arcLine([1.3, 1, 0.7])).toBe("Strongest at the start, quieter by the end. Give your last line the most energy.");
  });

  // Too little
  it("draws nothing without enough voice in each third", () => {
    // Silence
    expect(energyArc(Array(300).fill(0), Array(300).fill(null), 100)).toBeNull();
  });
});

describe("a conversation's timeline", () => {
  // The turns
  it("places turns in two lanes, marks your questions and says when one turn ran long", () => {
    // Them, you, them, you (long), them, you (a question)
    const timeline = conversationTimeline([{ who: "them", text: "Hi, I'm Maya.", seconds: 3 }, { who: "you", text: "hi I'm Sam", seconds: 8 }, { who: "them", text: "What do you do?", seconds: 3 }, { who: "you", text: "I work in a lab and it is a long story about cells and grants and the people there", seconds: 40 }, { who: "them", text: "Wow.", seconds: 2 }, { who: "you", text: "what about you", seconds: 10 }])!;
    // The places
    expect(timeline.turns.map((turn) => [turn.who, turn.start, turn.question])).toEqual([["them", 0, false], ["you", 3, false], ["them", 11, false], ["you", 14, false], ["them", 54, false], ["you", 56, true]]);
    // The line
    expect(timeline.line).toBe("Your 2nd turn ran longest, 40 seconds. Hand it back sooner with a question.");
    // The share
    expect(timeline.share).toBeGreaterThan(50);
  });

  // Even turns, and none
  it("says how long the turns were when none ran long, and draws nothing without turns", () => {
    // Even turns
    expect(conversationTimeline([{ who: "you", text: "a b", seconds: 9 }, { who: "them", text: "c", seconds: 3 }, { who: "you", text: "d", seconds: 11 }])!.line).toBe("Your turns were 11 seconds or so each.");
    // None
    expect(conversationTimeline([])).toBeNull();
  });
});

describe("the usual zone", () => {
  // A summary for a measure
  function summary(id: string, usual: number, spread: number, latest: number, count = 8): MetricSummary {
    // The summary
    return { metric: findMetric(id)!, source: "device", count, usual, recent: latest, latest, spread, trend: null, verdict: null, best: null, flag: null };
  }

  // Neutral words on each side
  it("says inside, faster or fewer in neutral words", () => {
    // Pace inside, pause words below, range above
    const bars = usualZones([summary("lang.wpm", 140, 10, 142), summary("lang.fillers_per_min", 6, 1.5, 3), summary("pro.f0_range_st", 6, 1, 9)]);
    // The words
    expect(bars.map((bar) => bar.words)).toEqual(["inside your usual", "fewer than usual", "wider than usual"]);
    // The dot and the band both fit inside the bar
    for (const bar of bars) expect(bar.from <= Math.min(bar.low, bar.latest) && bar.to >= Math.max(bar.high, bar.latest)).toBe(true);
  });

  // Too few takes
  it("draws no band before five takes", () => {
    // Four takes
    expect(usualZones([summary("lang.wpm", 140, 10, 150, 4)])).toEqual([]);
  });
});
