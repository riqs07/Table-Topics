// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { drillFindings, paceMatch, shadowHeadline, shadowLine, levelStep, speechLevel, type TakeRecording } from "@/core/voiceFindings";
// Load the drills
import { findVoiceDrill } from "@/content/voice";

// A take: two seconds at one loudness with silence either side, a pitch run, and what was heard
function take(level: number, pitches: (number | null)[] = [], transcript = ""): TakeRecording {
  // Silence, speech, silence
  const levels = [...Array(5).fill(0.01), ...Array(20).fill(level), ...Array(5).fill(0.01)];
  // The take
  return { durationSec: 3, levels, pitches, transcript };
}

// A pitch run that ends falling, rising or level
const run = (end: number) => [200, 202, 198, 201, 200, 199, end, end, end];

// Group the checks about voice drill findings (decision 80)
describe("voice findings", () => {
  // Levels compare by decibels: 3 is a clear step, 1 a small one
  it("compares levels with the speaker's own", () => {
    // Confirm each band, and the level of a take
    expect([levelStep(0.1, 0.15), levelStep(0.1, 0.115), levelStep(0.1, 0.1), levelStep(0.1, 0.08), levelStep(0.1, 0.05), Math.round(speechLevel(take(0.2).levels) * 100) / 100]).toEqual(["clear-up", "small-up", "same", "small-down", "clear-down", 0.2]);
  });

  // Clear sounds names the words that were hard to catch
  it("names words hard to catch", () => {
    // The word endings drill, with one word missing from the first take
    const findings = drillFindings(findVoiceDrill("c01")!, [take(0.2, [], "She asked if the tests passed Tuesday"), take(0.2, [], "He fixed the desks and checked the lists"), take(0.2, [], "The facts were clear and the costs were fixed")]);
    // Confirm the headline and lines
    expect([findings.headline, findings.lines]).toEqual(["1 word was hard to catch.", ["Hard to catch: last.", "Every word caught.", "Every word caught."]]);
  });

  // Three rooms: clear steps up, or not yet
  it("judges the three rooms", () => {
    // The greeting drill, with two clear steps, then with one too small
    const [good, flat] = [drillFindings(findVoiceDrill("v01")!, [take(0.1), take(0.15), take(0.25)]), drillFindings(findVoiceDrill("v01")!, [take(0.1), take(0.11), take(0.25)])];
    // Confirm both
    expect([good.headline, good.lines, flat.headline]).toEqual(["Three clear levels.", ["Your starting level.", "A clear step up from the last take.", "A clear step up from the last take."], "Make each step a clear jump up."]);
  });

  // Statement or question: how each ended against the aim
  it("checks endings against the aim", () => {
    // A falling statement and a level question
    const findings = drillFindings(findVoiceDrill("p01")!, [take(0.2, run(170)), take(0.2, run(201))]);
    // Confirm
    expect([findings.headline, findings.lines]).toEqual(["1 of 2 ended the way you aimed.", ["Ended falling, as aimed.", "Ended level. Aim for a clear lift on the last word."]]);
  });

  // Drop for effect: the quiet take against the normal one
  it("judges the drop", () => {
    // Confirm a clear drop, and one that did not drop
    expect([drillFindings(findVoiceDrill("v04")!, [take(0.2), take(0.08)]).headline.startsWith("A clear drop"), drillFindings(findVoiceDrill("v04")!, [take(0.2), take(0.2)]).headline.startsWith("About the same")]).toEqual([true, true]);
  });

  // Tone: what changed against the first take, and the length
  it("shows what changed between feelings", () => {
    // Three feelings: steady, louder with a wide range, quieter
    const findings = drillFindings(findVoiceDrill("t01")!, [take(0.1, run(200)), take(0.2, [180, 220, 190, 240, 200, 230, 210, 250, 205]), take(0.05, run(200))]);
    // Confirm the second and third lines
    expect(findings.lines.slice(1)).toEqual(["Range 4 steps · louder · 3.0 s", "Range 0 steps · quieter · 3.0 s"]);
  });
});

// Group the checks about shadowing
describe("shadowing", () => {
  // Within a quarter of the model's length is the same pace
  it("compares the pace with the model's", () => {
    // Slower, the same, faster, and no model length
    expect([paceMatch(3, 2), paceMatch(2.2, 2), paceMatch(1.4, 2), paceMatch(2, null), paceMatch(2, 0.1)]).toEqual(["slower", "same", "faster", null, null]);
  });

  // A line gives the pace with both lengths, then the words when they were checked
  it("writes a line per take", () => {
    // A take measured
    const measure = { level: 0.2, rangeSteps: 3, end: "fall" as const, faded: false, durationSec: 2.4, missed: ["country"] };
    // With and without a model length, and without words checked
    expect([shadowLine(measure, 2.2, true), shadowLine({ ...measure, missed: [] }, null, true), shadowLine(measure, 2.2, false)]).toEqual(["About the model’s pace (2.4 s against 2.2 s). Hard to catch: country.", "Took 2.4 s. Every word caught.", "About the model’s pace (2.4 s against 2.2 s)."]);
  });

  // The headline counts the takes at the model's pace, or just what was done
  it("sums up the session", () => {
    // Judged and not judged
    expect([shadowHeadline(["same", "slower", "same"]), shadowHeadline([null, null])]).toEqual(["2 of 3 at the model’s pace.", "You shadowed 2 takes."]);
  });
});
