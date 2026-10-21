// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the weekly summary rules being checked
import { SummaryInputSchema, buildSummaryInput, buildSummaryMessage, checkSummary, summaryDue } from "@/core/weeklySummary";
// Load the profile builder
import { buildProfile } from "@/core/analysis/profile";
// Load the analysis builder
import { buildAnalysis, withRubric } from "@/core/analysis/analysis";
// Load the size limits
import { SUMMARY_SIZE } from "@/core/requestLimits";
// Load the sample records
import { makeSession } from "../../support/fixtures";

// The moment the checks run at
const NOW = new Date("2026-10-21T12:00:00.000Z");
// A day
const DAY = 86_400_000;

// Ten Rapid Fire takes over twenty days, the last four this week, each with a long transcript
const SESSIONS = Array.from({ length: 10 }, (_, index) => makeSession({ id: `s${index}`, mode: "talk", createdAt: new Date(NOW.getTime() - (18 - index * 2) * DAY).toISOString(), transcript: `so the main point is that ${"we kept going and going ".repeat(80)}`, durationSec: 120 }));
// Their analyses, one with a rubric
const ANALYSES = SESSIONS.map((session, index) => (index === 9 ? withRubric(buildAnalysis(session, NOW), { pointFirst: { score: 3, quote: "the main point is that" }, answersQuestion: null, structure: { score: 2, quote: "q" }, ending: { score: 1, quote: "going and going" }, concreteExample: { score: 0, quote: "" }, wordChoice: { score: 1, quote: "" }, devices: [], unnecessaryHedges: 0, wordSwaps: [{ said: "going", stronger: "pushing on", why: "vivid" }], model: "m", at: NOW.toISOString() }) : buildAnalysis(session, NOW)));

// Group the checks about the weekly summary
describe("weekly summary", () => {
  // Due with none, or after a week
  it("is due with no summary or one a week old", () => {
    // A summary from a given number of days ago
    const from = (days: number) => ({ id: "x", createdAt: new Date(NOW.getTime() - days * DAY).toISOString(), headline: "", improved: [], pattern: "", focus: "", suggestedDrill: null, model: "m" });
    // Confirm none, six days and seven days
    expect([summaryDue(undefined, NOW), summaryDue(from(6), NOW), summaryDue(from(7), NOW)]).toEqual([true, false, true]);
  });

  // The table carries numbers and short quotes, never the transcripts, and passes the server's schema
  it("builds a compact table without whole transcripts", () => {
    // The input
    const input = buildSummaryInput(buildProfile(SESSIONS, ANALYSES, NOW), SESSIONS, ANALYSES, undefined, NOW);
    // Its text
    const text = JSON.stringify(input);
    // Confirm the schema accepts it, the week's count, the rubric quotes, and no whole transcript
    expect([SummaryInputSchema.safeParse(input).success, input.takesThisWeek, input.quotes, text.includes("going and going going and going going"), input.wordSwaps]).toEqual([true, 4, ["the main point is that", "going and going"], false, [{ said: "going", stronger: "pushing on" }]]);
  });

  // Without rubrics, the openings of this week's takes are quoted, cut short
  it("quotes the openings of this week's takes when there is no rubric", () => {
    // The input without the rubric
    const plain = SESSIONS.map((session) => buildAnalysis(session, NOW));
    // Built
    const input = buildSummaryInput(buildProfile(SESSIONS, plain, NOW), SESSIONS, plain, undefined, NOW);
    // Confirm four quotes, each within the cap
    expect([input.quotes.length, input.quotes.every((quote) => quote.length <= SUMMARY_SIZE.quoteChars && quote.startsWith("so the main point"))]).toEqual([4, true]);
  });

  // The message is a table with each row
  it("writes the table as rows the coach can read", () => {
    // The input
    const input = buildSummaryInput(buildProfile(SESSIONS, ANALYSES, NOW), SESSIONS, ANALYSES, { id: "p", createdAt: "", headline: "", improved: [], pattern: "", focus: "Breathe first.", suggestedDrill: null, model: "m" }, NOW);
    // The message
    const message = buildSummaryMessage(input);
    // Confirm the heading, a row and last week's focus
    expect([message.includes("## Speaking on the spot (10 takes, 4 this week)"), /\nOverall pace \(with pauses\) \| words\/min \| /.test(message), message.includes("Last week's focus: Breathe first.")]).toEqual([true, true, true]);
  });

  // A reply is trimmed and must have a headline and a focus
  it("writes the check-in's numbers into the table, and accepts a request without them (decision 100)", () => {
    // The usual input, with a small check-in comparison
    const input = { ...buildSummaryInput(buildProfile(SESSIONS, ANALYSES, NOW), SESSIONS, ANALYSES, undefined, NOW), checkIn: { first: "2026-10-07", latest: "2026-10-21", count: 3, parts: [{ part: "read" as const, firstSec: 52, latestSec: 49, rows: [{ name: "Pitch range", unit: "semitones", first: 5, latest: 8, verdict: "better" as const }] }] } };
    // The message
    const message = buildSummaryMessage(input);
    // Confirm the schema accepts it, the message carries the rows, and a request without it is still accepted
    expect([SummaryInputSchema.safeParse(input).success, message.includes("## Weekly check-in: first (2026-10-07) against latest (2026-10-21), 3 so far"), message.includes("Read aloud | Pitch range | semitones | 5 | 8 | better"), message.includes("Read aloud | Time | s | 52 | 49 | -"), SummaryInputSchema.safeParse({ ...input, checkIn: undefined }).success, SummaryInputSchema.safeParse({ ...input, checkIn: { ...input.checkIn, parts: [{ ...input.checkIn.parts[0], part: "dance" }] } }).success]).toEqual([true, true, true, true, true, false]);
  });

  it("checks the coach's reply", () => {
    // A tidy reply
    expect(checkSummary({ headline: " h ", improved: ["a", "", "b", "c", "d"], pattern: "p", focus: " f ", suggestedDrill: " " })).toEqual({ headline: "h", improved: ["a", "b", "c"], pattern: "p", focus: "f", suggestedDrill: null });
    // One with no focus is refused
    expect(() => checkSummary({ headline: "h", improved: [], pattern: "", focus: " ", suggestedDrill: null })).toThrow("The weekly summary was incomplete.");
  });
});
