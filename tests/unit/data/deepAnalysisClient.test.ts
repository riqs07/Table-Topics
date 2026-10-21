// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository, type Repository } from "@/data/repository";
// Load the functions being checked
import { checkDeepSetup, requestDeepAnalysis } from "@/data/deepAnalysisClient";
// Load the analysis builder and the rubric merge
import { buildAnalysis, withRubric } from "@/core/analysis/analysis";
// Load the notes
import { DEEP_NOTES } from "@/core/analysis/deep";
// Load the upload cap
import { ANALYSE_MAX_BYTES } from "@/core/requestLimits";
// Load the sample records
import { makeSession } from "../../support/fixtures";
import { makeTranscript, makeVoice } from "../../support/serverAnalysis";
// Load the record types
import type { RubricRecord, SessionRecord } from "@/data/records";

// A fixed "now"
const NOW = new Date("2026-10-21T12:00:00.000Z");
// The passphrase
const PASS = "a long passphrase for testing";
// A saved take with audio
const TAKE = makeSession({ id: "t1", mode: "talk", transcript: "the dog ran home", durationSec: 62, audioKey: "t1" });
// A rubric that arrives while the upload is under way
const RUBRIC: RubricRecord = { pointFirst: { score: 2, quote: "" }, answersQuestion: null, structure: { score: 1, quote: "" }, ending: { score: 3, quote: "" }, concreteExample: { score: 2, quote: "" }, wordChoice: { score: 1, quote: "" }, devices: [], unnecessaryHedges: 0, wordSwaps: [], model: "coach-model", at: NOW.toISOString() };

// A repository holding the take, its audio and its phone analysis, with the setting on or off
async function repositoryWith(on: boolean, audio: Blob = new Blob(["audio"], { type: "audio/webm" }), session: SessionRecord = TAKE): Promise<Repository> {
  // Empty
  const repository = createRepository(new MemoryStore());
  // The setting
  await repository.saveSettings({ ...(await repository.getSettings(NOW)), deepAnalysis: on });
  // The take and its audio
  await repository.saveSession(session);
  // (audio)
  await repository.saveAudio(session.id, audio);
  // Its phone analysis
  await repository.saveAnalysis(buildAnalysis(session, NOW));
  // Ready
  return repository;
}

// A network that answers with a status and body, noting what it was sent
function answer(status: number, body: unknown) {
  // Every call gets the same reply
  return vi.fn<typeof fetch>(async () => Response.json(body, { status }));
}

// Group the checks about sending a take for deeper analysis (decision 91)
describe("requestDeepAnalysis", () => {
  // Off by default: nothing is sent and nothing changes
  it("sends nothing when the setting is off", async () => {
    // Off
    const repository = await repositoryWith(false);
    // A network that must not be used
    const fetchFn = answer(200, {});
    // Asked
    const status = await requestDeepAnalysis(repository, TAKE, { passphrase: PASS, now: NOW, fetchFn });
    // Nothing done
    expect([status, fetchFn.mock.calls.length, (await repository.getAnalysis("t1"))?.deep]).toEqual([null, 0, undefined]);
  });

  // On: the audio goes once with its kind, length and passphrase; the measures are merged, keeping the phone's and a rubric that arrived meanwhile
  it("sends the audio and merges what comes back, keeping every phone value and a rubric saved meanwhile", async () => {
    // On
    const repository = await repositoryWith(true);
    // The phone's analysis before
    const before = (await repository.getAnalysis("t1"))!;
    // A network that saves a rubric while "uploading", then answers
    const fetchFn = vi.fn(async () => {
      // The rubric arrives meanwhile
      await repository.saveAnalysis(withRubric((await repository.getAnalysis("t1"))!, RUBRIC));
      // The route's reply
      return Response.json({ transcript: makeTranscript("The dog | ran home."), voice: makeVoice(), failures: {} });
    });
    // Asked
    const status = await requestDeepAnalysis(repository, TAKE, { passphrase: PASS, now: NOW, fetchFn });
    // What was sent
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    // The saved analysis
    const after = (await repository.getAnalysis("t1"))!;
    // Sent once with its kind, length and passphrase; done quietly; server values in; the rubric kept; phone values kept
    expect([fetchFn.mock.calls.length, url, new Headers(init.headers).get("content-type"), new Headers(init.headers).get("x-voicelab-duration"), new Headers(init.headers).get("x-voicelab-passphrase"), status?.status, after.metrics["pro.hnr_db"]?.value, after.metrics["rub.structure"]?.value, after.metrics["lang.wpm"], after.superseded?.["lang.fillers_per_min"]]).toEqual([1, "/api/analyse", "audio/webm", "62", PASS, "done", 14.2, 1, before.metrics["lang.wpm"], before.metrics["lang.fillers_per_min"]]);
  });

  // Not set up: the phone's measures stay, with the note
  it("keeps the phone's measures and says so when deeper analysis is not set up", async () => {
    // On
    const repository = await repositoryWith(true);
    // Asked
    await requestDeepAnalysis(repository, TAKE, { passphrase: PASS, now: NOW, fetchFn: answer(503, { error: "Deeper analysis isn't set up on the server.", code: "not-set-up" }) });
    // The analysis
    const after = (await repository.getAnalysis("t1"))!;
    // The note, and no server values
    expect([after.deep?.note, after.server, after.metrics["pro.hnr_db"]]).toEqual([DEEP_NOTES["not-set-up"], undefined, undefined]);
  });

  // A part failing shows which part
  it("notes a partial result", async () => {
    // On
    const repository = await repositoryWith(true);
    // Only the transcript came back; the worker was down
    const status = await requestDeepAnalysis(repository, TAKE, { passphrase: PASS, now: NOW, fetchFn: answer(200, { transcript: makeTranscript("Hi there."), voice: null, failures: { voice: "failed" } }) });
    // Partial, with its note
    expect([status?.status, status?.note]).toEqual(["partial", DEEP_NOTES["no-voice"]]);
  });

  // The network failing (offline mid-send): the phone's measures stay, with the note
  it("keeps the phone's measures when the network fails", async () => {
    // On
    const repository = await repositoryWith(true);
    // A failing network
    const status = await requestDeepAnalysis(repository, TAKE, { passphrase: PASS, now: NOW, fetchFn: vi.fn(async () => { throw new TypeError("Failed to fetch"); }) });
    // Skipped with the note, phone values intact
    expect([status?.note, (await repository.getAnalysis("t1"))?.metrics["lang.wpm"]?.source]).toEqual([DEEP_NOTES.offline, "device"]);
  });

  // Known to be offline: not sent, not queued
  it("skips a take while offline instead of queueing it", async () => {
    // On
    const repository = await repositoryWith(true);
    // A network that must not be used
    const fetchFn = answer(200, {});
    // Offline
    const status = await requestDeepAnalysis(repository, TAKE, { passphrase: PASS, now: NOW, fetchFn, online: () => false });
    // Skipped
    expect([status?.status, status?.note, fetchFn.mock.calls.length]).toEqual(["skipped", DEEP_NOTES.offline, 0]);
  });

  // No passphrase: nothing sent, with the way forward
  it("sends nothing without a passphrase", async () => {
    // On
    const repository = await repositoryWith(true);
    // A network that must not be used
    const fetchFn = answer(200, {});
    // Asked without a passphrase
    const status = await requestDeepAnalysis(repository, TAKE, { passphrase: "", now: NOW, fetchFn });
    // Skipped with the note
    expect([status?.note, fetchFn.mock.calls.length]).toEqual([DEEP_NOTES["needs-passphrase"], 0]);
  });

  // Over the cap: not sent
  it("does not send a recording over the size cap", async () => {
    // On, with a recording one byte too big
    const repository = await repositoryWith(true, new Blob([new Uint8Array(ANALYSE_MAX_BYTES + 1)], { type: "audio/webm" }));
    // A network that must not be used
    const fetchFn = answer(200, {});
    // Asked
    const status = await requestDeepAnalysis(repository, TAKE, { passphrase: PASS, now: NOW, fetchFn });
    // Skipped with the note
    expect([status?.note, fetchFn.mock.calls.length]).toEqual([DEEP_NOTES["too-large"], 0]);
  });

  // A reply of the wrong shape is a failure, never a crash
  it("treats a reply of the wrong shape as a failure", async () => {
    // On
    const repository = await repositoryWith(true);
    // Nonsense
    const status = await requestDeepAnalysis(repository, TAKE, { passphrase: PASS, now: NOW, fetchFn: answer(200, { transcript: { words: "no" }, voice: null }) });
    // Failed quietly
    expect(status?.note).toBe(DEEP_NOTES.failed);
  });

  // Storage failing: never throws (rule T1), says why in the console
  it("never throws when storage fails", async () => {
    // On, then a repository whose analysis saves fail
    const repository: Repository = { ...(await repositoryWith(true)), saveAnalysis: async () => { throw new Error("disk full"); } };
    // Quiet the expected warning
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Asked
    const status = await requestDeepAnalysis(repository, TAKE, { passphrase: PASS, now: NOW, fetchFn: answer(200, {}) });
    // Nothing thrown, the cause said
    expect([status, String(warn.mock.calls[0]?.[0])]).toEqual([null, "Deeper analysis of a take could not be finished: disk full"]);
    // Restore the console
    warn.mockRestore();
  });

  // A conversation keeps no audio, so nothing is sent
  it("sends nothing for a take without audio", async () => {
    // On, with a conversation
    const conversation = makeSession({ id: "c1", mode: "conversation", audioKey: null });
    // (saved)
    const repository = await repositoryWith(true, new Blob(["a"]), conversation);
    // A network that must not be used
    const fetchFn = answer(200, {});
    // Nothing done
    expect([await requestDeepAnalysis(repository, conversation, { passphrase: PASS, now: NOW, fetchFn }), fetchFn.mock.calls.length]).toEqual([null, 0]);
  });
});

// Group the checks about asking which parts are set up
describe("checkDeepSetup", () => {
  // Every state the server can be in
  it("reads every state", async () => {
    // Both, one, neither, refused, failing, offline, and no passphrase
    const states = await Promise.all([
      checkDeepSetup(PASS, answer(200, { transcription: true, voice: true, problems: [] })),
      checkDeepSetup(PASS, answer(200, { transcription: true, voice: false, problems: ["VOICE_WORKER_URL is set but VOICE_WORKER_SECRET is not."] })),
      checkDeepSetup(PASS, answer(200, { transcription: false, voice: false, problems: [] })),
      checkDeepSetup(PASS, answer(401, {})),
      checkDeepSetup(PASS, answer(500, {})),
      checkDeepSetup(PASS, vi.fn(async () => { throw new TypeError("Failed to fetch"); })),
      checkDeepSetup("", answer(200, {})),
    ]);
    // As expected
    expect(states).toEqual([{ state: "ready", problems: [] }, { state: "partial", transcription: true, voice: false, problems: ["VOICE_WORKER_URL is set but VOICE_WORKER_SECRET is not."] }, { state: "not-set-up", problems: [] }, { state: "wrong-passphrase" }, { state: "unreachable" }, { state: "unreachable" }, { state: "needs-passphrase" }]);
  });
});

// Group the checks about deeper analyses in the export file (rule T3: import onto a device that already has data)
describe("deeper analyses in exports", () => {
  // A take analysed on the server round-trips, and a device whose copy lacks it gains it without losing its own phone values
  it("exports the server's analysis and adds it on import to a copy that lacks it", async () => {
    // Load the export tools
    const { buildExport, importExport, parseExport } = await import("@/data/exportFile");
    // A device where the take was analysed on the server
    const source = await repositoryWith(true);
    // (analysed)
    await requestDeepAnalysis(source, TAKE, { passphrase: PASS, now: NOW, fetchFn: answer(200, { transcript: makeTranscript("The dog | ran home."), voice: makeVoice(), failures: {} }) });
    // Its file
    const file = parseExport(JSON.stringify(await buildExport(source, NOW)));
    // Another device with the same take, phone measures only
    const target = await repositoryWith(false);
    // Imported
    await importExport(target, file, NOW);
    // The analysis there
    const after = (await target.getAnalysis("t1"))!;
    // The server's values arrived, with the status; phone values kept
    expect([after.metrics["pro.hnr_db"]?.value, after.deep?.status, after.metrics["lang.wpm"]?.source]).toEqual([14.2, "done", "device"]);
  });

  // A damaged server analysis in a file is refused before anything is saved
  it("refuses a file whose server analysis is damaged", async () => {
    // Load the export tools
    const { buildExport, parseExport } = await import("@/data/exportFile");
    // A file
    const file = await buildExport(await repositoryWith(false), NOW);
    // Its analysis given a broken server part
    const broken = { ...file, analyses: file.analyses.map((analysis) => ({ ...analysis, server: { transcript: "nope", voice: null } })) };
    // Refused
    expect(() => parseExport(JSON.stringify(broken))).toThrow("This file is damaged and cannot be imported.");
  });
});
