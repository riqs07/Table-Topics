// Load the test helpers from the test runner
import { beforeEach, describe, expect, it } from "vitest";
// Load the in-memory store and the repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository, type Repository } from "@/data/repository";
// Load the upkeep being checked
import { tidyRecordings } from "@/data/housekeeping";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// The fake clock's "now"
const NOW = new Date("2026-10-21T12:00:00.000Z");
// A time a number of days before now
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();
// One take's readings
const READINGS = { loudness: [0.1, 0.2, 0.3], pitch: [110, null, 130], spokenTimes: [0.2, 0.9] };
// No pause between batches, so the checks run at once
const quick = { pause: async () => undefined };

// The store and repository under test
let store: MemoryStore;
// (the repository)
let repo: Repository;

// Start each check with empty storage
beforeEach(() => {
  // An empty store
  store = new MemoryStore();
  // Wrapped
  repo = createRepository(store);
});

// Save a take with a recording and readings, a number of days old
async function take(id: string, days: number, extra: Parameters<typeof makeSession>[0] = {}) {
  // Its recording
  await repo.saveAudio(`audio-${id}`, new Blob([`voice ${id}`]));
  // The take, with its readings
  await repo.saveSession(makeSession({ id, createdAt: daysAgo(days), audioKey: `audio-${id}`, feedbackStatus: "done", ...READINGS, ...extra }));
}

// Group the checks about tidying old recordings and readings (decision 98)
describe("tidyRecordings", () => {
  // Recordings past 14 days go; readings past 30 days go and the take is marked; everything else stays
  it("deletes old recordings and readings, keeping words and numbers", async () => {
    // A take from this week, one from three weeks ago, and one from two months ago
    await take("week", 3);
    // (three weeks)
    await take("weeks", 21);
    // (two months)
    await take("months", 60);
    // Tidy
    const counts = await tidyRecordings(repo, NOW, quick);
    // What each take kept: its recording link, the recording itself, its readings, and the mark
    const kept = await Promise.all(["week", "weeks", "months"].map(async (id) => [(await repo.getSession(id))?.audioKey ?? null, !!(await repo.getAudio(`audio-${id}`)), !!(await repo.getSignals(id)), (await repo.getSession(id))?.trimmedAt ?? null]));
    // Confirm the counts, and that only the right parts went
    expect([counts, kept]).toEqual([{ audio: 2, readings: 1 }, [["audio-week", true, true, null], [null, false, true, null], [null, false, false, NOW.toISOString()]]]);
    // Confirm the transcript and numbers of the oldest stayed
    expect([(await repo.getSession("months"))?.transcript, (await repo.getSession("months"))?.wordsPerMinute]).toEqual([makeSession().transcript, makeSession().wordsPerMinute]);
  });

  // Running again changes nothing
  it("changes nothing the second time", async () => {
    // Two old takes
    await take("a", 40);
    // (another)
    await take("b", 50);
    // Tidy twice
    const first = await tidyRecordings(repo, NOW, quick);
    // The stored data after the first run
    const after = [await store.getAll("sessions"), await store.keys("audio"), await store.keys("signals")];
    // Again
    const second = await tidyRecordings(repo, NOW, quick);
    // Confirm the second run did nothing
    expect([first, second, [await store.getAll("sessions"), await store.keys("audio"), await store.keys("signals")]]).toEqual([{ audio: 2, readings: 2 }, { audio: 0, readings: 0 }, after]);
  });

  // Starred takes, marker takes and the very first recording keep everything
  it("keeps starred, marker and first takes whole", async () => {
    // Three old takes kept whole, and one ordinary
    await take("starred", 200, { starred: true });
    // (a marker)
    await take("marker", 100, { marker: true });
    // (the first recording)
    await take("first", 365, { isBaseline: true });
    // (ordinary)
    await take("plain", 100);
    // Tidy
    await tidyRecordings(repo, NOW, quick);
    // Confirm only the ordinary take lost its recording and readings
    expect(await Promise.all(["starred", "marker", "first", "plain"].map(async (id) => [!!(await repo.getAudio(`audio-${id}`)), !!(await repo.getSignals(id))]))).toEqual([[true, true], [true, true], [true, true], [false, false]]);
  });

  // The chosen number of days is used
  it("keeps recordings for the days chosen in Settings", async () => {
    // Takes from 5, 10 and 20 days ago
    for (const days of [5, 10, 20]) await take(`d${days}`, days);
    // Keep only a week
    await repo.saveSettings({ ...(await repo.getSettings(NOW)), recordingDays: 7 });
    // Tidy
    await tidyRecordings(repo, NOW, quick);
    // Confirm only the five-day take keeps its recording
    expect((await repo.listSessions()).filter((session) => session.audioKey).map((session) => session.id)).toEqual(["d5"]);
  });

  // A take starred while the list was being worked through keeps its recording (the decision is made again on the record as stored)
  it("keeps a take starred after the list was read", async () => {
    // An old take
    await take("late", 40);
    // A store that stars it just before the batch runs
    const racing = Object.assign(Object.create(store) as MemoryStore, {
      // The batch, run after the star is saved
      batch: async (ops: Parameters<MemoryStore["batch"]>[0]) => {
        // The user stars it meanwhile
        await store.put("sessions", "late", { ...(await store.get("sessions", "late"))!, starred: true });
        // Then the batch
        await store.batch(ops);
      },
    });
    // Tidy through it
    await tidyRecordings(createRepository(racing), NOW, quick);
    // Confirm the recording and readings stayed
    expect([!!(await repo.getAudio("audio-late")), !!(await repo.getSignals("late")), (await repo.getSession("late"))?.audioKey]).toEqual([true, true, "audio-late"]);
  });

  // Feedback saved meanwhile is never overwritten by the copy read before
  it("keeps feedback saved while tidying", async () => {
    // An old take still waiting
    await take("waiting", 40, { feedbackStatus: "pending" });
    // A store where the coach's answer lands just before the batch
    const racing = Object.assign(Object.create(store) as MemoryStore, {
      // The batch, run after the feedback is saved
      batch: async (ops: Parameters<MemoryStore["batch"]>[0]) => {
        // The coach answers meanwhile
        await store.put("sessions", "waiting", { ...(await store.get("sessions", "waiting"))!, feedbackStatus: "done", feedback: { keep: "k", change: "c", retryCue: "r" } });
        // Then the batch
        await store.batch(ops);
      },
    });
    // Tidy through it
    await tidyRecordings(createRepository(racing), NOW, quick);
    // The take now
    const now = await repo.getSession("waiting");
    // Confirm it lost its recording but kept the feedback
    expect([now?.audioKey, now?.feedbackStatus, now?.feedback?.keep, !!now?.trimmedAt]).toEqual([null, "done", "k", true]);
  });

  // A failing store leaves everything as it was (each batch is all or nothing)
  it("changes nothing when the store refuses", async () => {
    // An old take
    await take("old", 60);
    // A store that refuses every batch
    const refusing = Object.assign(Object.create(store) as MemoryStore, { batch: async () => { throw new Error("QuotaExceededError"); } });
    // Confirm the tidy fails and the take is untouched
    expect([await tidyRecordings(createRepository(refusing), NOW, quick).then(() => "ok", (error: Error) => error.message), !!(await repo.getAudio("audio-old")), !!(await repo.getSignals("old"))]).toEqual(["QuotaExceededError", true, true]);
  });
});
