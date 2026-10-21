// Make a simulated IndexedDB available in Node, for the upgrade check
import "fake-indexeddb/auto";
// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository, type Repository } from "@/data/repository";
// Load the real browser store, for the upgrade check
import { IndexedDbStore } from "@/data/indexedDbStore";
// Load the analysis savers being checked
import { analyseSession, backfillAnalyses, saveRubric } from "@/data/analyses";
// Load the recording saver, which now analyses each take
import { saveRecording } from "@/data/saveRecording";
// Load the feedback client, which saves the rubric
import { requestFeedback } from "@/data/feedbackClient";
// Load the weekly summary client being checked
import { requestWeeklySummary } from "@/data/summaryClient";
// Load the export tools, which now carry analyses and summaries
import { buildExport, importExport, parseExport } from "@/data/exportFile";
// Load the analysis builder
import { ANALYSIS_SCHEMA_VERSION, buildAnalysis } from "@/core/analysis/analysis";
// Load the record types
import type { RubricRecord, SummaryRecord } from "@/data/records";
// Load the sample records
import { makeSession } from "../../support/fixtures";

// A fixed "now"
const NOW = new Date("2026-10-21T12:00:00.000Z");
// A rubric as the route hands it on
const RUBRIC: Omit<RubricRecord, "at"> = { pointFirst: { score: 2, quote: "I went" }, answersQuestion: null, structure: { score: 1, quote: "" }, ending: { score: 3, quote: "loudly" }, concreteExample: { score: 2, quote: "the dog" }, wordChoice: { score: 1, quote: "shop" }, devices: ["story"], unnecessaryHedges: 0, wordSwaps: [{ said: "good", stronger: "gripping", why: "vivid" }], model: "coach-model" };

// An empty repository
const empty = () => createRepository(new MemoryStore());

// A network that answers with a status and body
function answer(status: number, body: unknown = {}) {
  // Every call gets the same reply
  return vi.fn(async () => Response.json(body, { status }));
}

// Group the checks about saving analyses
describe("analyses", () => {
  // A new recording is analysed as it is saved
  it("analyses a recording when it is saved", async () => {
    // An empty repository
    const repository = empty();
    // Save a recording
    await saveRecording(repository, { id: "new", transcript: "so I went to the shop and it was good", durationSec: 30, audio: new Blob(["v"]), promptId: "t001", mode: "talk", retryOf: null }, NOW);
    // Its analysis
    const analysis = await repository.getAnalysis("new");
    // Confirm the version and a measure
    expect([analysis?.schemaVersion, analysis?.metrics["lang.wpm"]?.value]).toEqual([ANALYSIS_SCHEMA_VERSION, 20]);
  });

  // Rule T1 and T2: a failing analysis never stops the take being saved
  it("still saves the take when the analysis cannot be saved", async () => {
    // A repository whose analysis saves fail
    const repository: Repository = { ...empty(), saveAnalysis: async () => { throw new Error("disk full"); } };
    // Quiet the expected warning
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Save a recording
    await saveRecording(repository, { id: "new", transcript: "hello there", durationSec: 30, audio: new Blob(["v"]), promptId: "t001", mode: "talk", retryOf: null }, NOW);
    // Confirm the take is saved and the warning names the cause
    expect([(await repository.getSession("new"))?.id, String(warn.mock.calls[0]?.[0])]).toEqual(["new", "The analysis of a take could not be saved: disk full"]);
    // Restore the console
    warn.mockRestore();
  });

  // Voice drills and moment notes are not analysed
  it("does not analyse voice drills or moment notes", async () => {
    // An empty repository
    const repository = empty();
    // Try both
    const results = [await analyseSession(repository, makeSession({ id: "v", mode: "voice" }), NOW), await analyseSession(repository, makeSession({ id: "m", mode: "moment" }), NOW)];
    // Confirm neither was analysed
    expect([results, await repository.listAnalyses()]).toEqual([[false, false], []]);
  });

  // Older takes are analysed in batches, giving the page a turn between them; ones up to date are left alone
  it("backfills older takes in batches", async () => {
    // Five old takes, one already analysed, and a voice drill
    const repository = empty();
    // Save them
    for (let index = 0; index < 5; index++) await repository.saveSession(makeSession({ id: `s${index}`, mode: "talk", createdAt: `2026-10-1${index}T10:00:00.000Z` }));
    // A voice drill
    await repository.saveSession(makeSession({ id: "v", mode: "voice" }));
    // One already analysed
    await repository.saveAnalysis(buildAnalysis((await repository.getSession("s0"))!, NOW));
    // Count the turns given
    const pause = vi.fn(async () => {});
    // Backfill two at a time
    const done = await backfillAnalyses(repository, NOW, { batchSize: 2, pause });
    // Confirm four analysed, in two batches, and five in all
    expect([done, pause.mock.calls.length, (await repository.listAnalyses()).length]).toEqual([4, 2, 5]);
  });

  // Out-of-date analyses are redone, keeping the rubric
  it("redoes an out-of-date analysis and keeps its rubric", async () => {
    // A take with an old analysis that has a rubric
    const repository = empty();
    // The take
    const session = makeSession({ id: "s", mode: "talk" });
    // Saved
    await repository.saveSession(session);
    // Its rubric
    await saveRubric(repository, session, { ...RUBRIC, at: NOW.toISOString() }, NOW);
    // Made old
    await repository.saveAnalysis({ ...(await repository.getAnalysis("s"))!, schemaVersion: 0 });
    // Backfilled
    await backfillAnalyses(repository, NOW, { pause: async () => {} });
    // Confirm the new version and the kept rubric
    const analysis = await repository.getAnalysis("s");
    // (checked)
    expect([analysis?.schemaVersion, analysis?.rubric?.wordSwaps[0]?.stronger, analysis?.metrics["rub.point_first"]?.value]).toEqual([ANALYSIS_SCHEMA_VERSION, "gripping", 2]);
  });
});

// Group the checks about analyses of takes whose readings were dropped (decision 98)
describe("analyses of trimmed takes", () => {
  // A change of definitions skips takes whose readings are gone: they keep their old values
  it("keeps a trimmed take's values when the definitions change", async () => {
    // A take with readings, analysed
    const repository = empty();
    // (the take)
    const session = makeSession({ id: "t", mode: "talk", transcript: "so I think um we should start", spokenTimes: [0.1, 0.4, 0.8, 1.1, 1.5, 1.8, 2.1], loudness: Array.from({ length: 40 }, (_, index) => (index % 9 === 0 ? 0.01 : 0.2)) });
    // Saved and analysed
    await repository.saveSession(session);
    // (analysed)
    await analyseSession(repository, session, NOW);
    // Its values
    const before = (await repository.getAnalysis("t"))!;
    // Its readings dropped and the take marked, then the definitions change
    await repository.store.delete("signals", "t");
    // (marked)
    await repository.saveSession({ ...(await repository.getSession("t"))!, trimmedAt: NOW.toISOString() });
    // (made old)
    await repository.saveAnalysis({ ...before, schemaVersion: 0 });
    // Backfilled
    const redone = await backfillAnalyses(repository, NOW, { pause: async () => {} });
    // Confirm nothing was redone and the values are as they were
    expect([redone, (await repository.getAnalysis("t"))?.metrics]).toEqual([0, before.metrics]);
  });

  // A rubric arriving for a trimmed take keeps the phone's values
  it("adds a rubric to a trimmed take without changing its phone values", async () => {
    // A take analysed with its readings
    const repository = empty();
    // (the take)
    const session = makeSession({ id: "r", mode: "talk", spokenTimes: [0.2, 0.6, 1.0, 1.4, 1.9], loudness: Array.from({ length: 30 }, () => 0.2) });
    // Saved and analysed
    await repository.saveSession(session);
    // (analysed)
    await analyseSession(repository, session, NOW);
    // Its values
    const before = (await repository.getAnalysis("r"))!;
    // Its readings dropped
    await repository.store.delete("signals", "r");
    // (marked)
    await repository.saveSession({ ...(await repository.getSession("r"))!, trimmedAt: NOW.toISOString() });
    // The rubric arrives
    await saveRubric(repository, (await repository.getSession("r"))!, { ...RUBRIC, at: NOW.toISOString() }, NOW);
    // The phone's values
    const phone = (metrics: typeof before.metrics) => Object.fromEntries(Object.entries(metrics).filter(([, metric]) => metric.source === "device"));
    // Confirm they are unchanged and the rubric is in
    expect([phone((await repository.getAnalysis("r"))!.metrics), (await repository.getAnalysis("r"))?.rubric?.model]).toEqual([phone(before.metrics), RUBRIC.model]);
  });
});

// Group the checks about the coach's rubric arriving with feedback
describe("rubric with feedback", () => {
  // The rubric goes into the analysis; the visible feedback is saved as before
  it("saves the rubric into the take's analysis", async () => {
    // A take waiting for feedback
    const repository = empty();
    // Saved
    await repository.saveSession(makeSession({ id: "s", mode: "talk" }));
    // The route answers with feedback and a rubric
    await requestFeedback(repository, "s", { passphrase: "pass", fetchFn: answer(200, { feedback: { keep: "k", change: "c", retryCue: "r" }, rubric: RUBRIC }) });
    // Confirm the feedback and the rubric's measures
    expect([(await repository.getSession("s"))?.feedback?.keep, (await repository.getAnalysis("s"))?.metrics["rub.close_strength"]]).toEqual(["k", { value: 3, unit: "0–3", source: "rubric", engine: "coach-model" }]);
  });

  // A broken rubric is ignored; the feedback is still saved
  it("ignores a broken rubric and keeps the feedback", async () => {
    // A take waiting for feedback
    const repository = empty();
    // Saved
    await repository.saveSession(makeSession({ id: "s", mode: "talk" }));
    // The route answers with a broken rubric
    const outcome = await requestFeedback(repository, "s", { passphrase: "pass", fetchFn: answer(200, { feedback: { keep: "k", change: "c", retryCue: "r" }, rubric: { pointFirst: { score: 9 } } }) });
    // Confirm done, the feedback saved, and no rubric
    expect([outcome, (await repository.getSession("s"))?.feedbackStatus, (await repository.getAnalysis("s"))?.rubric]).toEqual(["done", "done", undefined]);
  });
});

// Group the checks about asking for the weekly summary
describe("requestWeeklySummary", () => {
  // A repository with a number of analysed takes this week
  async function withTakes(count: number) {
    // An empty repository
    const repository = empty();
    // Each take, a day apart
    for (let index = 0; index < count; index++) {
      // The take
      const session = makeSession({ id: `s${index}`, mode: "talk", createdAt: new Date(NOW.getTime() - index * 86_400_000).toISOString(), transcript: "so the point is we shipped it" });
      // Saved with its analysis
      await repository.saveSession(session);
      // (analysis)
      await repository.saveAnalysis(buildAnalysis(session, NOW));
    }
    // The repository
    return repository;
  }

  // A good reply is saved
  it("asks when due and saves the summary", async () => {
    // Three takes this week
    const repository = await withTakes(3);
    // The route answers
    const network = answer(200, { summary: { headline: "h", improved: [], pattern: "p", focus: "f", suggestedDrill: null }, model: "weekly-model" });
    // Ask
    const outcome = await requestWeeklySummary(repository, { passphrase: "pass", now: NOW, fetchFn: network });
    // Confirm saved, with the model, and that the short take's opening words went as a quote
    expect([outcome.status, (await repository.listSummaries())[0]?.model, String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body).includes("we shipped it")]).toEqual(["saved", "weekly-model", true]);
  });

  // Not due, no passphrase, or too few takes: nothing is sent
  it("sends nothing when not due, without a passphrase, or with too few takes", async () => {
    // A network that would answer
    const network = answer(200, {});
    // Two takes only
    const few = await withTakes(2);
    // Three takes and a recent summary
    const recent = await withTakes(3);
    // The recent summary
    const summary: SummaryRecord = { id: "x", createdAt: NOW.toISOString(), headline: "", improved: [], pattern: "", focus: "", suggestedDrill: null, model: "m" };
    // Saved
    await recent.saveSummary(summary);
    // Each case
    const outcomes = [(await requestWeeklySummary(few, { passphrase: "pass", now: NOW, fetchFn: network })).status, (await requestWeeklySummary(recent, { passphrase: "pass", now: NOW, fetchFn: network })).status, (await requestWeeklySummary(await withTakes(3), { passphrase: "", now: NOW, fetchFn: network })).status];
    // Confirm each, and no call
    expect([outcomes, network.mock.calls.length]).toEqual([["too-few", "not-due", "needs-passphrase"], 0]);
  });

  // With two check-ins, the first against the latest goes too, as numbers only; with one, nothing (decision 100)
  it("sends the first check-in against the latest, as numbers only", async () => {
    // Three ordinary takes this week
    const repository = await withTakes(3);
    // Two check-in readings a week apart, with their analyses
    for (const [index, day] of ["2026-10-07", "2026-10-14"].entries()) {
      // The reading
      const session = makeSession({ id: `ci${index}`, mode: "read", promptId: "ci-read", createdAt: `${day}T09:00:00.000Z`, durationSec: 50 + index * 5, transcript: "every saturday i take the same walk to the market", checkIn: { id: `ci-${day}`, week: index + 1, part: "read" } });
      // Saved with its analysis
      await repository.saveSession(session);
      // (analysis)
      await repository.saveAnalysis(buildAnalysis(session, NOW));
    }
    // The route answers
    const network = answer(200, { summary: { headline: "h", improved: [], pattern: "p", focus: "f", suggestedDrill: null }, model: "weekly-model" });
    // Ask
    await requestWeeklySummary(repository, { passphrase: "pass", now: NOW, fetchFn: network });
    // What was sent
    const sent = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body)) as { checkIn?: { first: string; latest: string; count: number; parts: Array<{ part: string; firstSec: number | null; latestSec: number | null; rows: unknown[] }> } };
    // Confirm the two days, the count, the reading's times, the parts not done as empty, and no transcript words
    expect([sent.checkIn?.first, sent.checkIn?.latest, sent.checkIn?.count, sent.checkIn?.parts.map((part) => [part.part, part.firstSec, part.latestSec]), JSON.stringify(sent.checkIn).includes("saturday")]).toEqual(["2026-10-07", "2026-10-14", 2, [["read", 50, 55], ["pitch", null, null], ["story", null, null], ["surprise", null, null]], false]);
  });

  // A refusal or a network failure says why, and saves nothing
  it("reports a refusal or a network failure and saves nothing", async () => {
    // Three takes
    const repository = await withTakes(3);
    // A rate-limited reply, then no network
    const limited = await requestWeeklySummary(repository, { passphrase: "pass", now: NOW, fetchFn: answer(429, { error: "Today's feedback limit is reached." }) });
    // (offline)
    const offline = await requestWeeklySummary(repository, { passphrase: "pass", now: NOW, fetchFn: vi.fn(async () => { throw new TypeError("offline"); }) });
    // Confirm both failed, with reasons, and nothing saved
    expect([limited, offline.status, (await repository.listSummaries()).length]).toEqual([{ status: "failed", reason: "Today's feedback limit is reached." }, "failed", 0]);
  });
});

// Group the checks about export, import and deleting everything
describe("analyses in the export file", () => {
  // Analyses and summaries round-trip; a rubric in the file fills one missing here
  it("exports and imports analyses and summaries", async () => {
    // A repository with an analysed take with a rubric, and a summary
    const source = empty();
    // The take
    const session = makeSession({ id: "s", mode: "talk" });
    // Saved
    await source.saveSession(session);
    // With a rubric
    await saveRubric(source, session, { ...RUBRIC, at: NOW.toISOString() }, NOW);
    // A summary
    await source.saveSummary({ id: "w1", createdAt: NOW.toISOString(), headline: "h", improved: ["i"], pattern: "p", focus: "f", suggestedDrill: "Rapid Fire", model: "m" });
    // A device that has the take analysed but without the rubric
    const target = empty();
    // Its plain analysis
    await target.saveAnalysis(buildAnalysis(session, NOW));
    // Exported, parsed and imported
    await importExport(target, parseExport(JSON.stringify(await buildExport(source, NOW))), NOW);
    // Confirm the rubric arrived and the summary too
    expect([(await target.getAnalysis("s"))?.rubric?.model, (await target.listSummaries()).map((summary) => summary.id)]).toEqual(["coach-model", ["w1"]]);
  });

  // A file made before analyses existed still imports
  it("imports a file made before analyses existed", async () => {
    // An older file
    const file = { format: "voicelab-export", version: 1, exportedAt: NOW.toISOString(), sessions: [makeSession({ id: "old" })], challenges: [], settings: { focusIndex: 0, focusStartedOn: NOW.toISOString(), audioRetention: 30 } };
    // Parsed
    const parsed = parseExport(JSON.stringify(file));
    // Confirm empty lists for both
    expect([parsed.analyses, parsed.summaries]).toEqual([[], []]);
  });

  // A damaged analysis is refused before anything is saved
  it("refuses a file with a damaged analysis", () => {
    // A file whose analysis has a measure without a number
    const file = { format: "voicelab-export", version: 1, exportedAt: NOW.toISOString(), sessions: [], challenges: [], settings: { focusIndex: 0, focusStartedOn: NOW.toISOString(), audioRetention: 30 }, analyses: [{ ...buildAnalysis(makeSession(), NOW), metrics: { "lang.wpm": { value: "fast", unit: "", source: "device", engine: "x" } } }] };
    // Confirm it is refused
    expect(() => parseExport(JSON.stringify(file))).toThrow("This file is damaged and cannot be imported.");
  });

  // "Delete everything" removes analyses and summaries too
  it("deletes analyses and summaries with everything else", async () => {
    // A repository with one of each
    const repository = empty();
    // An analysis
    await repository.saveAnalysis(buildAnalysis(makeSession(), NOW));
    // A summary
    await repository.saveSummary({ id: "w", createdAt: NOW.toISOString(), headline: "", improved: [], pattern: "", focus: "", suggestedDrill: null, model: "m" });
    // Delete everything
    await repository.deleteAllData();
    // Confirm both are gone
    expect([await repository.listAnalyses(), await repository.listSummaries()]).toEqual([[], []]);
  });
});

// Group the checks about the browser database upgrade (rule T3: storage that already holds data)
describe("upgrading a database made before analyses existed", () => {
  // A database with the five older collections and data in them gains the two new ones without losing anything
  it("adds the analyses and summaries collections and keeps existing data", async () => {
    // The older database, as the app made it before decision 90, with a session in it
    await new Promise<void>((resolve, reject) => {
      // Open it at version 2 with the older collections
      const request = indexedDB.open("voicelab-before-analyses", 2);
      // Create them, keys kept outside the records as the app does
      request.onupgradeneeded = () => ["sessions", "challenges", "settings", "audio", "talks"].forEach((name) => request.result.createObjectStore(name));
      // Write a session and close
      request.onsuccess = () => {
        // The transaction
        const transaction = request.result.transaction("sessions", "readwrite");
        // The session
        transaction.objectStore("sessions").put(makeSession({ id: "kept" }), "kept");
        // Closed once written
        transaction.oncomplete = () => {
          // Release it
          request.result.close();
          // Done
          resolve();
        };
      };
      // Pass on failures
      request.onerror = () => reject(request.error);
    });
    // The app's repository on it
    const repository = createRepository(new IndexedDbStore("voicelab-before-analyses"));
    // Save an analysis
    await repository.saveAnalysis(buildAnalysis(makeSession({ id: "kept" }), NOW));
    // Confirm the old session survived and the analysis saved
    expect([(await repository.getSession("kept"))?.id, (await repository.getAnalysis("kept"))?.sessionId]).toEqual(["kept", "kept"]);
  });
});
