// Checks for comparing two weekly check-ins (decision 100): the table of measures per part, like with like, missing parts, measures that cannot be judged, the plain lines, the time against each window, and which two are picked
import { describe, expect, it } from "vitest";
// Load the comparison being checked
import { compareCheckIns, partWindow, pickPair, takeIds, timeStatus, windowWords } from "@/core/checkInCompare";
// Load the grouping
import { checkInId, groupCheckIns } from "@/core/checkIn";
// Load the calendar helpers
import { addDays, dayKey } from "@/core/dates";
// Load the record types
import type { AnalysisRecord, CheckInPart, MetricValue, SessionRecord } from "@/data/records";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// The first check-in's day, and the next week's
const FIRST = new Date(2026, 9, 13, 10);
// (a week later)
const LATER = addDays(FIRST, 7);

// A take in a check-in
function take(day: Date, part: CheckInPart, durationSec: number, extra: Partial<SessionRecord> = {}): SessionRecord {
  // Tagged with its check-in, made without the browser's levelling
  return makeSession({ id: `${dayKey(day)}-${part}`, createdAt: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9).toISOString(), mode: part === "read" ? "read" : part === "pitch" ? "outline" : part === "story" ? "story" : "talk", durationSec, checkIn: { id: checkInId(day), week: 1, part }, autoGain: false, ...extra });
}

// One measured value from the phone (or another source)
const phone = (value: number | null, unit = "/min", source: MetricValue["source"] = "device"): MetricValue => ({ value, unit, source, engine: source === "device" ? "device-v1" : "assemblyai" });

// An analysis with the given measures
function analysis(sessionId: string, metrics: Record<string, MetricValue>, superseded?: Record<string, MetricValue>): AnalysisRecord {
  // The smallest real record
  return { sessionId, schemaVersion: 1, computedAt: "2026-10-13T10:00:00.000Z", engines: { device: { name: "device", version: "1", at: "2026-10-13T10:00:00.000Z" } }, metrics, raw: { mode: "talk", durationSec: 60, fillersPerMinute: 0, pauses: [], pauseSource: "none", speech: null, loudness: null, pitch: null, fading: null, firstPart: null, contentWords: {} }, ...(superseded ? { superseded } : {}) };
}

// Two check-ins, the second without its story, and their analyses
function setUp() {
  // The takes: every part the first week; the read, pitch and surprise the next
  const sessions = [take(FIRST, "read", 52), take(FIRST, "pitch", 70), take(FIRST, "story", 40), take(FIRST, "surprise", 50), take(LATER, "read", 49), take(LATER, "pitch", 110), take(LATER, "surprise", 95)];
  // Grouped
  const [a, b] = groupCheckIns(sessions, { skipped: [{ id: checkInId(LATER), parts: ["story"] }] });
  // The measures: pace slower, pause words fewer, pitch range wider, volume variety the same, pauses mid-sentence from deeper analysis on one side only
  const analyses = new Map([
    // The first reading
    ["2026-10-13-read", analysis("2026-10-13-read", { "flu.articulation_rate_wpm": phone(190, "words/min"), "lang.fillers_per_min": phone(4), "flu.pause_rate": phone(10), "flu.midclause_pause_share": phone(40, "%"), "pro.f0_range_st": phone(5, "semitones"), "pro.loudness_cv": phone(0.5, "ratio") })],
    // The later reading: the mid-sentence share from deeper analysis, with the phone's kept aside
    ["2026-10-20-read", analysis("2026-10-20-read", { "flu.articulation_rate_wpm": phone(160, "words/min"), "lang.fillers_per_min": phone(1.5), "flu.pause_rate": phone(10.2), "flu.midclause_pause_share": phone(20, "%", "transcript"), "pro.f0_range_st": phone(8, "semitones"), "pro.loudness_cv": phone(0.51, "ratio") }, { "flu.midclause_pause_share": phone(30, "%") })],
    // The pitches: one measured by deeper analysis only, with no phone value kept
    ["2026-10-13-pitch", analysis("2026-10-13-pitch", { "flu.articulation_rate_wpm": phone(170, "words/min"), "pro.articulation_clarity": phone(80, "%", "transcript") })],
    // (later)
    ["2026-10-20-pitch", analysis("2026-10-20-pitch", { "flu.articulation_rate_wpm": phone(172, "words/min", "transcript") })],
  ]);
  // Everything
  return { a: a!, b: b!, analyses, sessions };
}

// Group the checks
describe("comparing check-ins", () => {
  // The read part: a row per measure, judged like with like, with plain lines biggest first
  it("compares each measure of a part and says what changed", () => {
    // Two check-ins
    const { a, b, analyses } = setUp();
    // Compared
    const read = compareCheckIns(a, b, analyses, { pauseWords: true }).parts.find((part) => part.part === "read")!;
    // Each row's verdict and note
    const rows = read.rows.map((row) => [row.metric.id, row.verdict, row.note]);
    // Confirm the rows, and the lines (biggest first, measured against each measure's usual wobble; "better" only where the measure has a better side)
    expect([rows, read.lines]).toEqual([[["flu.articulation_rate_wpm", "changed", null], ["lang.fillers_per_min", "better", null], ["flu.pause_rate", "same", null], ["flu.midclause_pause_share", "better", "phone’s measure"], ["pro.f0_range_st", "better", null], ["pro.loudness_cv", "same", null]], ["Pitch range: 5 semitones → 8 semitones, wider, better.", "Pause words: 4/min → 1.5/min, fewer, better.", "Pace while talking (pauses left out): 190 words/min → 160 words/min, slower."]]);
  });

  // Values from different engines are not judged when the phone's own are not there for both
  it("shows but does not judge a measure taken differently", () => {
    // Two check-ins
    const { a, b, analyses } = setUp();
    // The pitch part
    const pitch = compareCheckIns(a, b, analyses, { pauseWords: true }).parts.find((part) => part.part === "pitch")!;
    // The pace row and the clarity row (deeper analysis on one side only)
    const [pace, clarity] = ["flu.articulation_rate_wpm", "pro.articulation_clarity"].map((id) => pitch.rows.find((row) => row.metric.id === id)!);
    // Confirm neither is judged, both are shown, and the time line says it is now inside its window
    expect([[pace!.a, pace!.b, pace!.verdict, pace!.note], [clarity!.a, clarity!.b, clarity!.verdict], pitch.lines[0], pitch.time]).toEqual([[170, 172, null, "measured differently"], [80, null, null], "Time: 1:10 → 1:50, now inside the 1:15 to 2:00 window.", { a: "short", b: "inside" }]);
  });

  // A part skipped in one check-in has nothing to compare, and says so
  it("says when a part is missing from one check-in", () => {
    // Two check-ins
    const { a, b, analyses } = setUp();
    // The story part
    const story = compareCheckIns(a, b, analyses, { pauseWords: true }).parts.find((part) => part.part === "story")!;
    // Confirm no rows, the take that is there, and the line
    expect([story.rows, story.a?.id, story.b, story.lines]).toEqual([[], "2026-10-13-story", null, ["Skipped or not recorded in one of these check-ins, so there is nothing to compare."]]);
  });

  // Pause words hidden: no row and no line about them
  it("leaves pause words out when they are hidden", () => {
    // Two check-ins
    const { a, b, analyses } = setUp();
    // The read part, with pause words hidden
    const read = compareCheckIns(a, b, analyses, { pauseWords: false }).parts.find((part) => part.part === "read")!;
    // Confirm the row and the line are gone
    expect([read.rows.some((row) => row.metric.id === "lang.fillers_per_min"), read.lines.some((line) => line.startsWith("Pause words"))]).toEqual([false, false]);
  });

  // Volume variety is only judged when the browser levelled neither take
  it("does not judge volume variety when the browser levelled a take", () => {
    // Two check-ins, the later reading levelled by the browser
    const { a, analyses, sessions } = setUp();
    // The later check-in again, levelled
    const levelled = groupCheckIns(sessions.map((session) => (session.id === "2026-10-20-read" ? { ...session, autoGain: true } : session)), undefined)[1]!;
    // The row
    const row = compareCheckIns(a, levelled, analyses, { pauseWords: true }).parts[0]!.rows.find((item) => item.metric.id === "pro.loudness_cv")!;
    // Confirm it is shown but not judged
    expect([row.a, row.b, row.verdict, row.note]).toEqual([0.5, 0.51, null, "levelled by the browser"]);
  });

  // Takes without analyses (imported without them) still compare their times
  it("still compares times when no measures were kept", () => {
    // Two check-ins with no analyses
    const { a, b } = setUp();
    // Compared with nothing measured
    const surprise = compareCheckIns(a, b, new Map(), { pauseWords: true }).parts.find((part) => part.part === "surprise")!;
    // Confirm the rows are there but unjudged, and the time line leads
    expect([surprise.rows.every((row) => row.verdict === null && row.a === null), surprise.lines]).toEqual([true, ["Time: 0:50 → 1:35, now inside the 1:00 to 2:00 window."]]);
  });

  // Nothing moved: one line saying so
  it("says when nothing much changed", () => {
    // The same reading twice
    const same = [take(FIRST, "read", 50), take(LATER, "read", 52)];
    // Grouped
    const [a, b] = groupCheckIns(same, undefined);
    // The same measures
    const analyses = new Map(same.map((session) => [session.id, analysis(session.id, { "flu.articulation_rate_wpm": phone(160, "words/min") })]));
    // Confirm the line
    expect(compareCheckIns(a!, b!, analyses, { pauseWords: true }).parts[0]!.lines).toEqual(["About the same on every measure."]);
  });

  // The story checks read as words
  it("adds the story checks to the story part", () => {
    // Two told stories
    const stories = [take(FIRST, "story", 60), take(LATER, "story", 70)];
    // Grouped
    const [a, b] = groupCheckIns(stories, undefined);
    // The first without someone's words, the later with
    const analyses = new Map([[stories[0]!.id, analysis(stories[0]!.id, { "story.dialogue": phone(0, "yes/no"), "story.details": phone(1, "count") })], [stories[1]!.id, analysis(stories[1]!.id, { "story.dialogue": phone(1, "yes/no"), "story.details": phone(3, "count") })]]);
    // The story part
    const story = compareCheckIns(a!, b!, analyses, { pauseWords: true }).parts.find((part) => part.part === "story")!;
    // Confirm the lines, the bigger change first
    expect(story.lines).toEqual(["Someone's words: now there.", "Specific details: 1 → 3, more, better."]);
  });
});

// Group the checks about picking two and the windows
describe("picking check-ins and windows", () => {
  // Three check-ins
  const three = groupCheckIns([take(FIRST, "read", 50), take(LATER, "read", 50), take(addDays(LATER, 7), "read", 50)], undefined);

  // First and latest by default; named ones when they exist; earlier first; never the same twice
  it("picks the first and latest unless told otherwise", () => {
    // The days picked
    const days = (a: string | null, b: string | null) => { const pair = pickPair(three, a, b); return pair ? [pair.a.day, pair.b.day] : null; };
    // Confirm the default, a named pair given backwards, a missing id, the same one twice, and too few
    expect([days(null, null), days(three[2]!.id, three[1]!.id), days("ci-1999-01-01", null), days(three[2]!.id, three[2]!.id), pickPair(three.slice(0, 1), null, null)]).toEqual([["2026-10-13", "2026-10-27"], ["2026-10-20", "2026-10-27"], ["2026-10-13", "2026-10-27"], ["2026-10-20", "2026-10-27"], null]);
  });

  // The ids of the takes to read analyses for
  it("lists the takes of the two check-ins", () => {
    // Confirm the ids
    expect(takeIds(three[0]!, three[1]!)).toEqual(["2026-10-13-read", "2026-10-20-read"]);
  });

  // The windows: none for reading, the pitch's light, a short story, Rapid Fire's
  it("places each length against its part's window", () => {
    // Confirm the windows and a few lengths
    expect([partWindow("read"), windowWords("pitch"), windowWords("story"), windowWords("surprise"), timeStatus("read", 60), timeStatus("surprise", 59), timeStatus("surprise", 120), timeStatus("surprise", 140), timeStatus("surprise", 151)]).toEqual([null, "1:15 to 2:00", "0:45 to 1:15", "1:00 to 2:00", null, "short", "inside", "grace", "long"]);
  });

  // Regression for decision 103: 15 to 16 pause words a minute is noise, not "worse"; a real rise is said plainly as "more", never "worse"
  it("calls small moves about the same and never says worse", () => {
    // Two readings
    const takes = [take(FIRST, "read", 50), take(LATER, "read", 52)];
    // Grouped
    const [a, b] = groupCheckIns(takes, undefined);
    // A small rise, then a big one
    const row = (before: number, after: number) => compareCheckIns(a!, b!, new Map([[takes[0]!.id, analysis(takes[0]!.id, { "lang.fillers_per_min": phone(before) })], [takes[1]!.id, analysis(takes[1]!.id, { "lang.fillers_per_min": phone(after) })]]), { pauseWords: true }).parts[0]!;
    // Each
    const [small, big] = [row(15, 16), row(6, 12)];
    // About the same, then "more" without a judgement, and the threshold's basis
    // The pause-word rows
    const [smallRow, bigRow] = [small, big].map((part) => part.rows.find((item) => item.metric.id === "lang.fillers_per_min")!);
    // (checked)
    expect([smallRow!.verdict, small.lines, bigRow!.verdict, big.lines, bigRow!.threshold]).toEqual(["same", ["About the same on every measure."], "changed", ["Pause words: 6/min → 12/min, more."], { value: 1.5, basis: "fixed" }]);
  });

  // With five earlier check-ins, the part's own spread sets what counts: a steady speaker's small move counts, a variable speaker's does not
  it("uses this part's spread once there are enough check-ins", () => {
    // Seven weekly readings
    const days = Array.from({ length: 7 }, (_, index) => addDays(FIRST, index * 7));
    // Their takes
    const takes = days.map((day) => take(day, "read", 50));
    // Grouped
    const checkIns = groupCheckIns(takes, undefined);
    // Pace values: steady, or all over the place; the last moves by 9 words a minute
    const compare = (values: number[]) => {
      // Each take's pace
      const analyses = new Map(takes.map((session, index) => [session.id, analysis(session.id, { "flu.articulation_rate_wpm": phone(values[index]!, "words/min") })]));
      // The first against the last, with the history
      return compareCheckIns(checkIns[0]!, checkIns[6]!, analyses, { pauseWords: true, history: checkIns }).parts[0]!.rows[0]!;
    };
    // Steady: 160 give or take 1, then 169
    const steady = compare([160, 161, 159, 160, 161, 160, 169]);
    // Variable: swinging by 20, then the same move
    const variable = compare([160, 180, 140, 175, 145, 170, 169]);
    // The steady speaker's move counts (the spread is small, so half the fixed 10 is the floor); the variable one's is within the wobble
    expect([steady.verdict, steady.threshold?.basis, steady.threshold?.value, variable.verdict, variable.threshold?.basis]).toEqual(["changed", "spread", 5, "same", "spread"]);
  });
});
