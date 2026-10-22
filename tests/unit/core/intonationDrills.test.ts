// Checks for the two intonation drills (decision 117): the stress-shift verdicts (peak on the target or not) and the exaggeration range comparison
import { describe, expect, it } from "vitest";
// Load what is being checked
import { dialBackLine, drillStress, shareWords, shiftFindings, shiftVerdict, type IntonationTake } from "@/core/intonationDrills";
import { drillFindings } from "@/core/voiceFindings";
// Load the drills
import { drillWithSet, findVoiceDrill } from "@/content/voice";
// Load the made-up takes
import { makeTake } from "../../support/pitchTake";

// The classic sentence said with the lift on one word: five steps up on it, the end falling
function said(lift: string): IntonationTake {
  // The made-up take
  const take = makeTake([{ words: "I didn’t say she stole it.".split(" ").map((text) => ({ text, step: text.replace(/[.,]/g, "") === lift ? 5 : 0, ...(text === "it." ? { to: -3 } : {}) })), pauseAfter: 0.6 }], { glide: true });
  // As a drill take
  return { durationSec: take.durationSec, levels: take.loudness, pitches: take.pitch };
}

// A silent take
const silent: IntonationTake = { durationSec: 2, levels: Array(20).fill(0), pitches: Array(20).fill(null) };

// Same sentence, different stress
describe("stress shift", () => {
  // The lift on the target: a hit
  it("finds the peak on the target word", () => {
    // Lifted "she", aimed at "she"
    expect(shiftVerdict(said("she"), "I didn’t say she stole it.", "she")).toEqual({ target: "she", hit: true, peak: "she" });
  });

  // The lift elsewhere: a miss, naming where it went
  it("names the word the peak went to when it missed", () => {
    // Lifted "say", aimed at "stole"
    expect(shiftVerdict(said("say"), "I didn’t say she stole it.", "stole")).toEqual({ target: "stole", hit: false, peak: "say" });
  });

  // A level line has no clear peak, so it is not on the target, whatever the half-step rule says
  it("does not count a level line as a hit", () => {
    // Every word at the same pitch
    const level = makeTake([{ words: "I didn’t say she stole it.".split(" ").map((text) => ({ text, step: 0.3 })), pauseAfter: 0.6 }], { glide: true });
    // Judged
    const verdict = shiftVerdict({ durationSec: level.durationSec, levels: level.loudness, pitches: level.pitch }, "I didn’t say she stole it.", "she");
    // Not a hit, and said so
    expect([verdict.hit, verdict.level, shiftFindings([verdict]).lines[0]]).toEqual([false, true, "No clear peak."]);
  });

  // Too little voice: not judged
  it("does not judge a take with no voice", () => {
    // Silence
    expect([shiftVerdict(silent, "I didn’t say she stole it.", "she"), drillStress(silent, "I didn’t say she stole it.", "she")]).toEqual([{ target: "she", hit: null, peak: null }, null]);
  });

  // The headline counts the judged takes; each take has its own line
  it("counts the takes with the peak on the target", () => {
    // Two hits, one miss, one not judged
    const found = shiftFindings([{ target: "I", hit: true, peak: "I" }, { target: "say", hit: false, peak: "she" }, { target: "she", hit: true, peak: "she" }, { target: "stole", hit: null, peak: null }]);
    // The headline and lines
    expect(found).toEqual({ headline: "2 of 3 takes got the peak on the target word.", lines: ["Peak on “I”, the target.", "Peak on “she”, not “say”.", "Peak on “she”, the target.", "Too little voice to check the target word."] });
    // None judged
    expect(shiftFindings([{ target: "I", hit: null, peak: null }]).headline).toBe("Not enough voice to read the pitch.");
  });

  // The whole drill: each take judged against its own target
  it("judges each take of the drill against its own target", () => {
    // The drill's first sentence: I, say, she, stole
    const drill = drillWithSet(findVoiceDrill("p05")!, 0);
    // Each take lifted on its target except the last, which lifts "say"
    const takes = ["I", "say", "she", "say"].map((word) => ({ ...said(word), transcript: "" }));
    // The findings
    expect(drillFindings(drill, takes.map((take) => ({ durationSec: take.durationSec, levels: [...take.levels], pitches: [...take.pitches], transcript: "" }))).headline).toBe("3 of 4 takes got the peak on the target word.");
  });
});

// Exaggerate, then dial back
describe("dial back", () => {
  // The share kept, in plain fractions
  it("says the share kept in plain words", () => {
    // Each fraction
    expect([0.1, 0.25, 0.34, 0.5, 0.62, 0.74, 0.92].map(shareWords)).toEqual(["very little", "a quarter", "a third", "half", "two thirds", "three quarters", "nearly all"]);
  });

  // The one line, from the three ranges
  it("compares the natural take with the exaggerated one", () => {
    // Half kept
    expect(dialBackLine({ flat: 2, exaggerated: 10, natural: 5 })).toBe("Your natural take kept half of the exaggerated range (5 of 10 steps).");
    // As wide
    expect(dialBackLine({ flat: 2, exaggerated: 8, natural: 9 })).toBe("Your natural take was as wide as the exaggerated one: 9 steps.");
    // The exaggerated take within the noise of the flat one (decision 103: a sixth or one step)
    expect(dialBackLine({ flat: 4, exaggerated: 5, natural: 4 })).toBe("Your exaggerated take ranged 5 steps, about the same as the flat one. Go much bigger on the second take.");
    // Not read
    expect([dialBackLine({ flat: 2, exaggerated: null, natural: 3 }), dialBackLine({ flat: null, exaggerated: 6, natural: null })]).toEqual(["Not enough voice to read the pitch.", "Not enough voice to read the pitch."]);
    // No flat reading: compared without it
    expect(dialBackLine({ flat: null, exaggerated: 9, natural: 3 })).toBe("Your natural take kept a third of the exaggerated range (3 of 9 steps).");
  });

  // The whole drill: the headline and a range per take
  it("gives the line and each take's range", () => {
    // Three takes: flat, wide, middling
    const take = (spread: number) => ({ durationSec: 2, levels: Array(20).fill(0.2), pitches: Array.from({ length: 20 }, (_, index) => Math.round(180 * 2 ** ((spread * Math.sin(index / 2)) / 12))), transcript: "" });
    // The findings
    const found = drillFindings(drillWithSet(findVoiceDrill("p06")!, 2), [take(0.5), take(8), take(4)]);
    // A line per take with its range, and the headline about the share kept
    expect([found.lines.every((line) => /^Range: \d+ steps?\.$/.test(line)), found.headline.startsWith("Your natural take kept")]).toEqual([true, true]);
  });
});
