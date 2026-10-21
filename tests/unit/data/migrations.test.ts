// Make a simulated IndexedDB available in Node, as the browser would have
import "fake-indexeddb/auto";
// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the real browser store and the repository
import { IndexedDbStore } from "@/data/indexedDbStore";
import { createRepository } from "@/data/repository";
// Load the move being checked
import { CURRENT_SCHEMA, isMigrated, migrate } from "@/data/migrations";
// Load the analysis builder, to make analyses as the old app saved them (with their words)
import { buildAnalysis } from "@/core/analysis/analysis";
// Load the pitch range rule
import { rangeOf } from "@/core/voiceFeedback";
// Load the record types
import type { AnalysisRecord, FullSession } from "@/data/records";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// The collections the app had before decision 98, laid out as it made them (keys outside the records, no lookups)
const OLD_COLLECTIONS = ["sessions", "challenges", "settings", "audio", "talks", "analyses", "summaries", "stories"];
// A fixed "now"
const NOW = new Date("2026-10-21T12:00:00.000Z");
// No pause between batches
const quick = async () => undefined;
// Counter so each check gets its own database
let databaseNumber = 0;

// Five takes as the old app saved them: readings on the session (enough voice for a pitch range on most), one without readings
function oldTakes(): FullSession[] {
  // Pitch readings with plenty of voice, rising and falling
  const pitch = Array.from({ length: 200 }, (_, index) => (index % 5 === 0 ? null : 110 + (index % 40)));
  // The takes
  return [1, 2, 3, 4, 5].map((n) => makeSession({ id: `s${n}`, createdAt: `2026-10-0${n}T10:00:00.000Z`, transcript: `so this is take ${n} and it went well`, feedbackStatus: n === 3 ? "pending" : "done", ...(n === 5 ? {} : { loudness: Array.from({ length: 200 }, (_, index) => (index % 7 === 0 ? 0.01 : 0.2)), pitch, spokenTimes: [0.1, 0.4, 0.8, 1.2, 1.5, 1.9, 2.2, 2.6, 3.0], scriptTimes: [null, 0.5] }) }));
}

// Make a database exactly as the app did before decision 98, holding the given takes and their analyses (with words)
async function oldDatabase(name: string, takes: ReadonlyArray<FullSession>): Promise<void> {
  // Open it at version 1 with the old collections
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    // Ask for it
    const request = indexedDB.open(name, 1);
    // Make the old collections, keys outside the records, no lookups
    request.onupgradeneeded = () => OLD_COLLECTIONS.forEach((collection) => request.result.createObjectStore(collection));
    // Opened
    request.onsuccess = () => resolve(request.result);
    // Failed
    request.onerror = () => reject(request.error);
  });
  // Write the takes and their analyses in one transaction
  await new Promise<void>((resolve, reject) => {
    // The transaction
    const transaction = database.transaction(["sessions", "analyses"], "readwrite");
    // Each take, with its readings inline
    for (const session of takes) transaction.objectStore("sessions").put(session, session.id);
    // Each analysis, with its words, as the old app saved them
    for (const session of takes) transaction.objectStore("analyses").put(buildAnalysis(session, NOW), session.id);
    // Done
    transaction.oncomplete = () => resolve();
    // Failed
    transaction.onerror = () => reject(transaction.error);
  });
  // Closed, as when the old app's tab closed
  database.close();
}

// Every take as the app reads it now, with its readings joined back
async function readAll(repository: ReturnType<typeof createRepository>, ids: ReadonlyArray<string>): Promise<Array<FullSession | undefined>> {
  // Each in turn
  return Promise.all(ids.map((id) => repository.getFullSession(id)));
}

// What a take should read as after the move: the same, plus its pitch range when there was enough voice
function expected(session: FullSession): FullSession {
  // The range from its readings
  const range = rangeOf(session);
  // Added when there is one
  return range === null ? session : { ...session, pitchRange: range };
}

// Group the checks about moving an older database to the current layout (decision 98)
describe("migrate", () => {
  // An old database in, the new layout out, nothing lost
  it("moves an older database's readings apart without losing anything", async () => {
    // The old takes
    const takes = oldTakes();
    // An old database holding them
    const name = `voicelab-migrate-${databaseNumber++}`;
    // (made)
    await oldDatabase(name, takes);
    // The app opens it
    const repository = createRepository(new IndexedDbStore(name));
    // Moved
    const counts = await migrate(repository, { batchSize: 2, pause: quick, now: NOW });
    // The stored records
    const [sessions, analyses, signals] = [await repository.store.getAll("sessions"), await repository.store.getAll("analyses"), await repository.store.keys("signals")];
    // Confirm the counts, the small sessions, the words left out of every analysis, the readings under their ids, and the layout noted
    expect([counts, sessions.some((session) => "loudness" in session || "pitch" in session || "spokenTimes" in session || "scriptTimes" in session), analyses.some((analysis: AnalysisRecord) => analysis.raw.timedWords !== undefined), signals, await isMigrated(repository)]).toEqual([{ sessions: 4, analyses: 5 }, false, false, ["s1", "s2", "s3", "s4"], true]);
    // Confirm every take reads as before, with its pitch range added
    expect(await readAll(repository, takes.map((take) => take.id))).toEqual(takes.map(expected));
    // Confirm the new lookup works on the old records (the waiting take)
    expect((await repository.listPendingSessions()).map((session) => session.id)).toEqual(["s3"]);
  });

  // The analyses' words are rebuilt exactly as they were, so measures can still be worked out again
  it("rebuilds an analysis's words exactly as they were saved", async () => {
    // The old takes
    const takes = oldTakes();
    // An old database holding them
    const name = `voicelab-migrate-${databaseNumber++}`;
    // (made)
    await oldDatabase(name, takes);
    // The app opens and moves it
    const repository = createRepository(new IndexedDbStore(name));
    // (moved)
    await migrate(repository, { pause: quick, now: NOW });
    // Confirm each working analysis has the same words the old one stored
    expect((await Promise.all(takes.map((take) => repository.getWorkingAnalysis(take.id)))).map((analysis) => analysis?.raw.timedWords)).toEqual(takes.map((take) => buildAnalysis(take, NOW).raw.timedWords));
  });

  // Stopped half-way (the tab closed), each record is either moved or untouched, and the next start finishes the job
  it("can be interrupted and carries on where it stopped", async () => {
    // The old takes
    const takes = oldTakes();
    // An old database holding them
    const name = `voicelab-migrate-${databaseNumber++}`;
    // (made)
    await oldDatabase(name, takes);
    // The real store
    const real = new IndexedDbStore(name);
    // Batches allowed before the "crash"
    let allowed = 1;
    // A store whose second batch fails, as if the tab closed
    const crashing = Object.assign(Object.create(real) as IndexedDbStore, { batch: async (ops: Parameters<IndexedDbStore["batch"]>[0]) => { if (allowed-- <= 0) throw new Error("The tab closed"); return real.batch(ops); } });
    // The first try stops
    const first = await migrate(createRepository(crashing), { batchSize: 2, pause: quick, now: NOW }).then(() => "finished", (error: Error) => error.message);
    // A repository over the real store, as on the next start
    const repository = createRepository(real);
    // In between, nothing is lost or half-moved: every take reads as before, and the layout is not yet noted
    const between = [await readAll(repository, takes.map((take) => take.id)), await isMigrated(repository)];
    // The next start
    const second = await migrate(repository, { batchSize: 2, pause: quick, now: NOW });
    // Confirm the first try stopped, nothing was lost meanwhile, and the second moved only what was left
    expect([first, between[1], (between[0] as Array<FullSession | undefined>).map((take) => take?.loudness), second.sessions, await isMigrated(repository)]).toEqual(["The tab closed", false, takes.map((take) => take.loudness), 2, true]);
    // Confirm the finished database reads as a clean move would
    expect(await readAll(repository, takes.map((take) => take.id))).toEqual(takes.map(expected));
  });

  // Running again once moved does nothing, and a new database is simply noted as current
  it("does nothing once moved, and notes a new database as current", async () => {
    // A new, empty database
    const repository = createRepository(new IndexedDbStore(`voicelab-migrate-${databaseNumber++}`));
    // Moved twice
    const counts = [await migrate(repository, { pause: quick, now: NOW }), await migrate(repository, { pause: quick, now: NOW })];
    // Confirm nothing moved and the layout is noted
    expect([counts, (await repository.store.get("meta", "schema"))?.schema]).toEqual([[{ sessions: 0, analyses: 0 }, { sessions: 0, analyses: 0 }], CURRENT_SCHEMA]);
  });
});
