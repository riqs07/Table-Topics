// Checks for rating yourself (decision 116; no longer asked after a take since decision 129, but older ratings still show): the comparison only against a confident measure, each answer, and the calibration count
import { describe, expect, it } from "vitest";
// Load the question's rules
import { RATING_OPTIONS, ratingOption } from "@/core/selfRating";
// Load the comparison and the calibration
import { bandSide, calibration, CALIBRATION_MIN, compareRating, MIN_EARLIER_TAKES, ratingValue, usualBand } from "@/core/ratingCompare";
// Load the session builder
import { makeSession } from "../../support/fixtures";
// Load the record types
import type { RatingAnswer, SessionRecord } from "@/data/records";

// A day's time, so takes sort by when they were made
const at = (day: number) => new Date(Date.UTC(2026, 9, day, 10)).toISOString();

// Five earlier Rapid Fire takes at a steady pace near 130 words a minute, each a minute long
function earlierPace(): SessionRecord[] {
  // Five days in a row
  return [128, 130, 132, 129, 131].map((wpm, index) => makeSession({ id: `e${index}`, mode: "talk", createdAt: at(index + 1), wordsPerMinute: wpm, durationSec: 60 }));
}

// A rated Rapid Fire take after them
function ratedTake(wpm: number, answer: RatingAnswer, overrides: Partial<SessionRecord> = {}): SessionRecord {
  // The take, a day later, with its call
  return makeSession({ id: "now", mode: "talk", createdAt: at(10), wordsPerMinute: wpm, durationSec: 60, selfRating: { scale: "pace", answer, ratedAt: at(10) }, ...overrides });
}

// The answers on each scale
describe("RATING_OPTIONS", () => {
  // Each scale has three answers, each claiming a different side
  it("gives three answers per scale, one for each side of the usual", () => {
    // Pace and liveliness
    for (const options of Object.values(RATING_OPTIONS)) expect(options.map((option) => option.side).sort()).toEqual(["above", "below", "inside"]);
    // An answer is found on its own scale only
    expect([ratingOption({ scale: "pace", answer: "rushed", ratedAt: "" })?.label, ratingOption({ scale: "pace", answer: "lively", ratedAt: "" })]).toEqual(["Rushed", undefined]);
  });
});

// The band and its sides
describe("usualBand", () => {
  // Fewer than five values: no band
  it("needs at least five earlier values", () => {
    // Four is too few
    expect(usualBand([1, 2, 3, 4])).toBeNull();
    // Five is enough
    expect(usualBand([100, 100, 100, 100, 100])).toEqual({ low: 95, high: 105 });
    // The rule's number
    expect(MIN_EARLIER_TAKES).toBe(5);
  });

  // Above, inside, below
  it("names the side a value sits on", () => {
    // Each side
    expect([bandSide(110, { low: 95, high: 105 }), bandSide(100, { low: 95, high: 105 }), bandSide(90, { low: 95, high: 105 })]).toEqual(["above", "inside", "below"]);
  });
});

// The line on the results
describe("compareRating", () => {
  // Rushed, and the pace was inside the usual: said plainly, not matched
  it("says the call and the measure, inside the usual", () => {
    // A take at the usual pace, called rushed
    const take = ratedTake(130, "rushed");
    // Compared
    const result = compareRating(take, [...earlierPace(), take]);
    // The line and the verdict
    expect(result).toMatchObject({ text: "You said rushed. Your pace was 130 a minute, inside your usual.", matched: false, side: "inside" });
  });

  // Each answer on the pace scale
  it("matches each pace answer to its own side", () => {
    // Faster than usual, called rushed
    expect(compareRating(ratedTake(170, "rushed"), earlierPace())).toMatchObject({ matched: true, side: "above", text: "You said rushed. Your pace was 170 a minute, faster than usual." });
    // Inside, called about right
    expect(compareRating(ratedTake(131, "right"), earlierPace())).toMatchObject({ matched: true, side: "inside", text: "You said about right. Your pace was 131 a minute, inside your usual." });
    // Slower, called slow
    expect(compareRating(ratedTake(100, "slow"), earlierPace())).toMatchObject({ matched: true, side: "below", text: "You said slow. Your pace was 100 a minute, slower than usual." });
    // Slower, called rushed
    expect(compareRating(ratedTake(100, "rushed"), earlierPace())?.matched).toBe(false);
  });

  // Each answer on the liveliness scale, against pitch range
  it("compares a story's call with its pitch range", () => {
    // Five earlier stories with a range near 6 steps
    const earlier = [6, 6.2, 5.8, 6.1, 5.9].map((range, index) => makeSession({ id: `s${index}`, mode: "story", createdAt: at(index + 1), pitchRange: range }));
    // A story told with a wider range
    const take = (range: number, answer: RatingAnswer) => makeSession({ id: "now", mode: "story", createdAt: at(10), pitchRange: range, selfRating: { scale: "liveliness", answer, ratedAt: at(10) } });
    // Lively and wide
    expect(compareRating(take(9, "lively"), earlier)).toMatchObject({ matched: true, text: "You said lively. Your pitch range was 9 steps, wider than usual." });
    // OK and usual
    expect(compareRating(take(6, "ok"), earlier)).toMatchObject({ matched: true, text: "You said OK. Your pitch range was 6 steps, inside your usual." });
    // Flat and narrow
    expect(compareRating(take(3.5, "flat"), earlier)).toMatchObject({ matched: true, text: "You said flat. Your pitch range was 3.5 steps, narrower than usual." });
    // Flat, but it was wide
    expect(compareRating(take(9, "flat"), earlier)?.matched).toBe(false);
    // No range measured: nothing to say
    expect(compareRating(makeSession({ id: "now", mode: "story", createdAt: at(10), selfRating: { scale: "liveliness", answer: "flat", ratedAt: at(10) } }), earlier)).toBeNull();
  });

  // Not confident: nothing is said
  it("says nothing when the measure is not confident", () => {
    // Only four earlier takes
    expect(compareRating(ratedTake(130, "right"), earlierPace().slice(0, 4))).toBeNull();
    // A take too short for its pace to settle
    expect(compareRating(ratedTake(130, "right", { durationSec: 12 }), earlierPace())).toBeNull();
    // Earlier takes of another family (reading aloud) do not count
    expect(compareRating(ratedTake(130, "right"), earlierPace().map((session) => ({ ...session, mode: "read" as const })))).toBeNull();
    // Later takes do not count
    expect(compareRating(ratedTake(130, "right", { createdAt: at(0) }), earlierPace())).toBeNull();
    // Not rated
    expect(compareRating(makeSession({ mode: "talk" }), earlierPace())).toBeNull();
  });

  // Short earlier takes have no confident pace, so they do not make a band
  it("builds the band only from confident earlier values", () => {
    // Five earlier takes, too short each
    const short = earlierPace().map((session) => ({ ...session, durationSec: 15 }));
    // No band
    expect(compareRating(ratedTake(130, "right"), short)).toBeNull();
    // The values themselves
    expect([ratingValue(short[0]!, "pace"), ratingValue(earlierPace()[0]!, "pace")]).toEqual([null, 128]);
  });
});

// The line on Your progress
describe("calibration", () => {
  // A run of rated takes after five unrated ones
  function history(rated: ReadonlyArray<{ wpm: number; answer: RatingAnswer }>): SessionRecord[] {
    // The five earlier ones, then the rated ones a day apart
    return [...earlierPace(), ...rated.map((item, index) => makeSession({ id: `r${index}`, mode: "talk", createdAt: at(10 + index), wordsPerMinute: item.wpm, durationSec: 60, selfRating: { scale: "pace", answer: item.answer, ratedAt: at(10 + index) } }))];
  }

  // Fewer than eight compared takes: nothing
  it("needs at least eight rated takes with a confident measure", () => {
    // Seven, each about right and inside
    expect(calibration(history(Array.from({ length: 7 }, () => ({ wpm: 130, answer: "right" as const }))), "pace")).toBeNull();
    // Eight
    expect(calibration(history(Array.from({ length: 8 }, () => ({ wpm: 130, answer: "right" as const }))), "pace")).toMatchObject({ matched: 8, total: 8 });
    // The rule's number
    expect(CALIBRATION_MIN).toBe(8);
  });

  // The latest ten, with how many matched
  it("counts the matches over the latest ten", () => {
    // Twelve rated: the two oldest matched, then seven matched and three not
    const answers = [...Array.from({ length: 2 }, () => ({ wpm: 130, answer: "right" as const })), ...Array.from({ length: 7 }, () => ({ wpm: 130, answer: "right" as const })), ...Array.from({ length: 3 }, () => ({ wpm: 130, answer: "rushed" as const }))];
    // Counted
    expect(calibration(history(answers), "pace")).toEqual({ scale: "pace", matched: 7, total: 10, text: "Your sense of your pace matched the measure in 7 of your last 10 takes." });
    // Nothing on the other scale
    expect(calibration(history(answers), "liveliness")).toBeNull();
  });

  // Rated takes without a confident measure are not counted
  it("leaves out rated takes that could not be compared", () => {
    // Eight rated, but two too short to trust
    const sessions = history(Array.from({ length: 8 }, () => ({ wpm: 130, answer: "right" as const }))).map((session, index) => (index >= 5 && index < 7 ? { ...session, durationSec: 10 } : session));
    // Six compared: too few
    expect(calibration(sessions, "pace")).toBeNull();
  });
});
