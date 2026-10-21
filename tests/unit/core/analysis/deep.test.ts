// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the functions being checked
import { DEEP_NOTES, RUNNING_STALE_MS, deepStatus, noteFor, outcomeOfParts, outcomeOfRefusal } from "@/core/analysis/deep";
// Load the analysis builders
import { buildAnalysis, recomputeFromRaw, withDeepStatus, withRubric, withServerAnalysis } from "@/core/analysis/analysis";
// Load the sample records
import { makeSession } from "../../../support/fixtures";
import { makeTranscript, makeVoice } from "../../../support/serverAnalysis";
// Load the record types
import type { RubricRecord } from "@/data/records";

// A fixed "now"
const NOW = new Date("2026-10-21T12:00:00.000Z");
// When
const AT = NOW.toISOString();
// A rubric
const RUBRIC: RubricRecord = { pointFirst: { score: 2, quote: "" }, answersQuestion: null, structure: { score: 1, quote: "" }, ending: { score: 3, quote: "" }, concreteExample: { score: 2, quote: "" }, wordChoice: { score: 1, quote: "" }, devices: [], unnecessaryHedges: 0, wordSwaps: [], model: "coach-model", at: AT };
// A talk with loudness readings, so the phone places its pauses (and the heuristic engine is used)
const SESSION = makeSession({ id: "t", mode: "talk", transcript: "the dog ran home and then we left the park", durationSec: 30, spokenTimes: [0.5, 0.8, 1.1, 2.4, 2.7, 3, 3.3, 3.6, 3.9, 4.2], loudness: Array.from({ length: 50 }, (_, index) => (index >= 15 && index < 22 ? 0.01 : 0.2)) });

// Group the checks about the deeper-analysis outcomes (decision 91)
describe("deeper analysis outcomes", () => {
  // Each outcome keeps its status and note
  it("keeps a status and a note for each outcome", async () => {
    // A few outcomes
    expect([deepStatus("running", AT).status, deepStatus("done", AT), deepStatus("no-voice", AT).status, deepStatus("failed", AT).status, deepStatus("offline", AT).status]).toEqual(["running", { status: "done", note: "", at: AT }, "partial", "failed", "skipped"]);
  });

  // A part that is not set up is not a failure
  it("treats a part that is not set up as nothing missing", async () => {
    // Transcript only, voice not set up; voice failed; transcript failed
    expect([outcomeOfParts({ transcript: true, voice: false, failures: { voice: "not-set-up" } }), outcomeOfParts({ transcript: true, voice: false, failures: { voice: "failed" } }), outcomeOfParts({ transcript: false, voice: true, failures: { transcript: "timeout" } })]).toEqual(["done", "no-voice", "no-transcript"]);
  });

  // Refusals map to their notes
  it("reads refusals by status and code", async () => {
    // Not set up, too big, wrong passphrase, limited, other
    expect([outcomeOfRefusal(503, "not-set-up"), outcomeOfRefusal(413, "too-large"), outcomeOfRefusal(401, undefined), outcomeOfRefusal(429, undefined), outcomeOfRefusal(502, undefined), outcomeOfRefusal(503, undefined)]).toEqual(["not-set-up", "too-large", "wrong-passphrase", "limited", "failed", "failed"]);
  });

  // A running status left behind by a closed app stops saying it is under way
  it("treats a running status older than ten minutes as failed", async () => {
    // Just now, and long ago
    expect([noteFor(deepStatus("running", AT), NOW), noteFor(deepStatus("running", new Date(NOW.getTime() - RUNNING_STALE_MS - 1).toISOString()), NOW), noteFor(undefined, NOW)]).toEqual([DEEP_NOTES.running, DEEP_NOTES.failed, ""]);
  });
});

// Group the checks about keeping server analyses in the record
describe("analysis records with a server analysis", () => {
  // The server's values replace the phone's guesses, which are kept, with both engines named
  it("merges the server's analysis, keeping the phone values it replaced and naming the engines", async () => {
    // The phone's analysis
    const device = buildAnalysis(SESSION, NOW);
    // With the server's
    const merged = withServerAnalysis(device, { transcript: makeTranscript("The dog | ran home, and | then we left the park."), voice: makeVoice() }, deepStatus("done", AT));
    // Placement now from punctuation; the phone's heuristic value kept aside; every other phone value untouched; engines named
    expect([merged.metrics["flu.midclause_pause_share"]?.engine, merged.superseded?.["flu.midclause_pause_share"], merged.metrics["lang.wpm"], merged.metrics["pro.hnr_db"]?.value, merged.engines.transcript?.version, merged.engines.voice?.version, merged.deep?.status]).toEqual(["assemblyai-universal-3-pro-punctuation-v1", device.metrics["flu.midclause_pause_share"], device.metrics["lang.wpm"], 14.2, "assemblyai-universal-3-pro", "voice-worker-1+praat-6.1.38", "done"]);
  });

  // Every phone measure survives the merge
  it("never loses a phone value", async () => {
    // The phone's analysis
    const device = buildAnalysis(SESSION, NOW);
    // With the server's
    const merged = withServerAnalysis(device, { transcript: makeTranscript("The dog | ran home."), voice: makeVoice() }, deepStatus("done", AT));
    // Each phone measure is still in the measures or kept aside, unchanged
    expect(Object.entries(device.metrics).every(([id, value]) => JSON.stringify(merged.metrics[id]?.source === "device" ? merged.metrics[id] : merged.superseded?.[id]) === JSON.stringify(value))).toBe(true);
  });

  // Rebuilding from the session, recomputing from raw and adding a rubric all keep the server's analysis
  it("keeps the server's analysis through a rebuild, a recompute and a rubric", async () => {
    // Merged first
    const merged = withServerAnalysis(buildAnalysis(SESSION, NOW), { transcript: null, voice: makeVoice() }, deepStatus("no-transcript", AT));
    // Each later step
    const [rebuilt, recomputed, rubricked] = [buildAnalysis(SESSION, NOW, merged), recomputeFromRaw(merged, NOW), withRubric(merged, RUBRIC)];
    // The voice value and the status survive each, and the rubric's score arrives
    expect([rebuilt.metrics["pro.hnr_db"]?.value, recomputed.metrics["pro.hnr_db"]?.value, rubricked.metrics["pro.hnr_db"]?.value, rubricked.metrics["rub.structure"]?.value, rebuilt.deep?.status]).toEqual([14.2, 14.2, 14.2, 1, "partial"]);
  });

  // A part already saved is kept when a new reply lacks it
  it("keeps a part already saved when a later reply lacks it", async () => {
    // The voice first, then only a transcript
    const first = withServerAnalysis(buildAnalysis(SESSION, NOW), { transcript: null, voice: makeVoice() }, deepStatus("no-transcript", AT));
    // (then)
    const second = withServerAnalysis(first, { transcript: makeTranscript("The dog ran."), voice: null }, deepStatus("done", AT));
    // Both now
    expect([second.server?.voice?.hnrDb, second.server?.transcript?.text]).toEqual([14.2, "The dog ran."]);
  });

  // A status alone changes nothing else
  it("sets a status without touching the measures", async () => {
    // The phone's analysis
    const device = buildAnalysis(SESSION, NOW);
    // With a status
    expect(withDeepStatus(device, deepStatus("offline", AT))).toEqual({ ...device, deep: deepStatus("offline", AT) });
  });
});
