// Load the test helpers from the test runner
import { beforeEach, describe, expect, it } from "vitest";
// Load the in-memory store
import { MemoryStore } from "@/data/memoryStore";
// Load the repository being checked
import { createRepository, type Repository } from "@/data/repository";
// Load a sample session builder
import { makeSession, makeTalk } from "../../support/fixtures";

// A fixed "now" so default settings are predictable
const NOW = new Date(2026, 9, 12, 15, 30);

// The store and repository under test
let store: MemoryStore;
// The repository wrapping the store
let repo: Repository;

// Start each check with empty storage
beforeEach(() => {
  // Make an empty store
  store = new MemoryStore();
  // Wrap it in a repository
  repo = createRepository(store);
});

// Build a timestamp for the nth day of October 2026, so ordering is easy to read
const day = (n: number) => new Date(Date.UTC(2026, 9, n, 12)).toISOString();

// Group the checks about sessions
describe("sessions", () => {
  // One recording can be deleted on its own
  it("deletes one recording", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Two recordings
    await repository.saveAudio("a", new Blob(["a"]));
    // (and the second)
    await repository.saveAudio("b", new Blob(["b"]));
    // Delete the first
    await repository.deleteAudio("a");
    // Confirm only the first is gone
    expect([await repository.getAudio("a"), !!(await repository.getAudio("b"))]).toEqual([undefined, true]);
  });

  // A saved session can be loaded by id
  it("saves and loads a session", async () => {
    // Save a session
    await repo.saveSession(makeSession({ id: "s1" }));
    // Confirm it loads back
    expect((await repo.getSession("s1"))?.id).toBe("s1");
  });

  // History shows the latest session first
  it("lists sessions newest first", async () => {
    // Save sessions out of order
    await repo.saveSession(makeSession({ id: "b", createdAt: day(2) }));
    // Save the newest
    await repo.saveSession(makeSession({ id: "c", createdAt: day(3) }));
    // Save the oldest
    await repo.saveSession(makeSession({ id: "a", createdAt: day(1) }));
    // Confirm newest first
    expect((await repo.listSessions()).map((s) => s.id)).toEqual(["c", "b", "a"]);
  });

  // Feedback arrives after the session is saved, so sessions can be updated
  it("updates a session when saved again", async () => {
    // Save a pending session
    await repo.saveSession(makeSession({ id: "s1", feedbackStatus: "pending" }));
    // Save it again with feedback
    await repo.saveSession(makeSession({ id: "s1", feedbackStatus: "done", feedback: { keep: "k", change: "c", retryCue: "r" } }));
    // Confirm there is one session, now done
    expect((await repo.listSessions()).map((s) => s.feedbackStatus)).toEqual(["done"]);
  });
});

// Group the checks about audio
describe("audio", () => {
  // A recording can be saved and played back later
  it("saves and loads audio by key", async () => {
    // Save a fake recording
    await repo.saveAudio("a1", new Blob(["voice"]));
    // Confirm it loads back
    expect(await (await repo.getAudio("a1"))?.text()).toBe("voice");
  });
});

// Group the checks about keeping a take's readings apart from its session (decision 98)
describe("readings kept apart", () => {
  // The readings of one take
  const readings = { loudness: [0.1, 0.2], pitch: [120, null], spokenTimes: [0.1, 0.5], scriptTimes: [null, 1.2] };

  // The session list stays small: its readings go to their own record, and come back joined on the take's page
  it("saves a session's readings apart and joins them back", async () => {
    // Save a session with readings
    await repo.saveSession(makeSession({ id: "s1", ...readings }));
    // The stored session, the stored readings, and the joined take
    const [stored, signals, full] = [await store.get("sessions", "s1"), await repo.getSignals("s1"), await repo.getFullSession("s1")];
    // Confirm the session has none, the readings are under its id, and the joined take has them all
    expect([Object.keys(stored ?? {}).some((key) => key in readings), signals, full]).toEqual([false, { sessionId: "s1", ...readings }, makeSession({ id: "s1", ...readings })]);
  });

  // Feedback and notes are saved on a session without its readings; that must never lose them
  it("keeps saved readings when a session is saved again without them", async () => {
    // Save a session with readings
    await repo.saveSession(makeSession({ id: "s1", ...readings }));
    // Save it again with feedback, as the coach client does, from the small record
    await repo.saveSession({ ...(await repo.getSession("s1"))!, feedbackStatus: "done", feedback: { keep: "k", change: "c", retryCue: "r" } });
    // Confirm the readings are still there
    expect((await repo.getFullSession("s1"))?.loudness).toEqual(readings.loudness);
  });

  // An older record still carrying its readings reads the same way until it is moved
  it("reads a session saved before the readings were kept apart", async () => {
    // A record in the old layout, written straight to the store
    await store.put("sessions", "old", makeSession({ id: "old", ...readings }));
    // Confirm the take's page gets every reading
    expect((await repo.getFullSession("old"))?.pitch).toEqual(readings.pitch);
  });
});

// Group the checks about shared reads (decision 99: a page read every session two or three times)
describe("shared reads", () => {
  // Several reads at once make one read of the store, and a save makes the next read fresh
  it("reads every session once until something is saved", async () => {
    // Count the store's full reads
    let reads = 0;
    // A store that counts them
    const counting = Object.assign(Object.create(store) as MemoryStore, { getAll: (collection: Parameters<MemoryStore["getAll"]>[0]) => { reads += 1; return store.getAll(collection); } });
    // A repository over it
    const shared = createRepository(counting);
    // Save one session
    await shared.saveSession(makeSession({ id: "a", createdAt: day(1) }));
    // Three reads, as a page and its parts make them
    await Promise.all([shared.listSessions(), shared.listSessions(), shared.listSessions()]);
    // Save another
    await shared.saveSession(makeSession({ id: "b", createdAt: day(2) }));
    // Read again
    const after = await shared.listSessions();
    // Confirm two reads in all, and the fresh list has both, newest first
    expect([reads, after.map((session) => session.id)]).toEqual([2, ["b", "a"]]);
  });

  // A caller sorting its copy in place never changes what the next caller sees
  it("hands each caller its own copy of the list", async () => {
    // Two sessions
    await repo.saveSession(makeSession({ id: "a", createdAt: day(1) }));
    // (the second)
    await repo.saveSession(makeSession({ id: "b", createdAt: day(2) }));
    // One caller reverses its list
    (await repo.listSessions()).reverse();
    // Confirm the next caller still gets newest first
    expect((await repo.listSessions()).map((session) => session.id)).toEqual(["b", "a"]);
  });

  // Another tab's save makes this tab read again (through the channel)
  it("reads again when another tab says the data changed", async () => {
    // The listener the repository registers
    const heard: { listener: (() => void) | null } = { listener: null };
    // A channel that keeps it
    const channel = { postMessage: () => undefined, addEventListener: (_type: "message", listener: () => void) => void (heard.listener = listener) };
    // A repository with the channel
    const shared = createRepository(store, { channel });
    // A first read
    await shared.listSessions();
    // Another tab saves a session, straight to the store
    await store.put("sessions", "x", makeSession({ id: "x" }));
    // Its message arrives
    heard.listener?.();
    // Confirm the next read sees it
    expect((await shared.listSessions()).map((session) => session.id)).toEqual(["x"]);
  });

  // A failed read is not kept, so the next one tries again
  it("tries again after a failed read", async () => {
    // A store whose first full read fails
    let fail = true;
    // (failing once)
    const flaky = Object.assign(Object.create(store) as MemoryStore, { getAll: async (collection: Parameters<MemoryStore["getAll"]>[0]) => { if (fail) { fail = false; throw new Error("closed"); } return store.getAll(collection); } });
    // A repository over it
    const shared = createRepository(flaky);
    // Confirm the first read fails and the second works
    expect([await shared.listSessions().then(() => "ok", () => "failed"), (await shared.listSessions()).length]).toEqual(["failed", 0]);
  });
});

// Group the checks about the waiting list (decision 99: FeedbackSync read every session on every page)
describe("listPendingSessions", () => {
  // Only waiting sessions, oldest first
  it("lists the sessions waiting for feedback, oldest first", async () => {
    // Three sessions: two waiting, one done
    await repo.saveSession(makeSession({ id: "new", createdAt: day(3), feedbackStatus: "pending" }));
    // (done)
    await repo.saveSession(makeSession({ id: "done", createdAt: day(2), feedbackStatus: "done" }));
    // (old)
    await repo.saveSession(makeSession({ id: "old", createdAt: day(1), feedbackStatus: "pending" }));
    // Confirm the waiting ones, oldest first
    expect((await repo.listPendingSessions()).map((session) => session.id)).toEqual(["old", "new"]);
  });
});

// Group the checks about the star (decision 98)
describe("setStarred", () => {
  // Only the star changes; feedback saved meanwhile stays
  it("stars and unstars a take without touching anything else", async () => {
    // A take with feedback
    await repo.saveSession(makeSession({ id: "s1", feedbackStatus: "done", feedback: { keep: "k", change: "c", retryCue: "r" } }));
    // Starred
    await repo.setStarred("s1", true);
    // Read
    const starred = await repo.getSession("s1");
    // Unstarred
    await repo.setStarred("s1", false);
    // Confirm the star changed and the feedback stayed
    expect([starred?.starred, starred?.feedback?.keep, (await repo.getSession("s1"))?.starred]).toEqual([true, "k", false]);
  });
});

// Group the checks about the answer before the results (decision 116)
describe("setSelfRating", () => {
  // Only the answer is added; the take's readings and feedback stay
  it("saves the answer on the take without touching anything else", async () => {
    // A take with feedback and readings
    await repo.saveSession(makeSession({ id: "s1", feedbackStatus: "done", feedback: { keep: "k", change: "c", retryCue: "r" }, loudness: [0.2, 0.3] }));
    // Rated
    await repo.setSelfRating("s1", { scale: "pace", answer: "slow", ratedAt: day(1) });
    // Read with its readings
    const full = await repo.getFullSession("s1");
    // The answer is there, the rest unchanged
    expect([full?.selfRating, full?.feedback?.keep, full?.loudness]).toEqual([{ scale: "pace", answer: "slow", ratedAt: day(1) }, "k", [0.2, 0.3]]);
  });

  // A take that is not there is left alone
  it("does nothing for a take that is not there", async () => {
    // Rated
    await repo.setSelfRating("missing", { scale: "pace", answer: "slow", ratedAt: day(1) });
    // Still not there
    expect(await repo.getSession("missing")).toBeUndefined();
  });
});

// Group the checks about settings
describe("settings", () => {
  // A new user gets defaults without anything being saved first
  it("gives defaults when nothing is saved", async () => {
    // Confirm the default focus, start date (start of today), and audio limit
    expect(await repo.getSettings(NOW)).toEqual({ focusIndex: 0, focusStartedOn: new Date(2026, 9, 12).toISOString(), audioRetention: 30 });
  });

  // Saved settings come back as saved
  it("saves and loads settings", async () => {
    // Save custom settings
    await repo.saveSettings({ focusIndex: 2, focusStartedOn: day(5), audioRetention: 10 });
    // Confirm they load back
    expect(await repo.getSettings(NOW)).toEqual({ focusIndex: 2, focusStartedOn: day(5), audioRetention: 10 });
  });
});

// Group the checks about challenges
describe("challenges", () => {
  // Challenges list with the current week first
  it("saves challenges and lists the newest week first", async () => {
    // Save an older challenge
    await repo.saveChallenge({ id: "c1", weekStart: "2026-10-05", text: "Ask a question in a meeting", completedAt: null });
    // Save a newer challenge
    await repo.saveChallenge({ id: "c2", weekStart: "2026-10-12", text: "Order coffee and make small talk", completedAt: null });
    // Confirm newest first
    expect((await repo.listChallenges()).map((c) => c.id)).toEqual(["c2", "c1"]);
  });
});

// Group the checks about wiping everything
describe("deleteAllData", () => {
  // The settings button must remove every trace
  it("removes sessions, audio, challenges and settings", async () => {
    // Save one of everything
    await repo.saveSession(makeSession({ id: "s1", audioKey: "a1" }));
    // Save audio
    await repo.saveAudio("a1", new Blob(["voice"]));
    // Save a challenge
    await repo.saveChallenge({ id: "c1", weekStart: "2026-10-12", text: "Say hi", completedAt: null });
    // Save settings
    await repo.saveSettings({ focusIndex: 3, focusStartedOn: day(1), audioRetention: 5 });
    // Wipe everything
    await repo.deleteAllData();
    // Confirm sessions are gone
    expect(await repo.listSessions()).toEqual([]);
    // Confirm audio is gone
    expect(await repo.getAudio("a1")).toBeUndefined();
    // Confirm challenges are gone
    expect(await repo.listChallenges()).toEqual([]);
    // Confirm settings are back to defaults
    expect((await repo.getSettings(NOW)).focusIndex).toBe(0);
  });
});

// Group the checks about saved talks for Rehearse my talk
describe("talks", () => {
  // Talks are saved, listed newest first, loaded by id, and deleted
  it("saves, lists, loads, and deletes talks", async () => {
    // Save two talks
    await repo.saveTalk(makeTalk({ id: "t1", createdAt: "2026-10-01T10:00:00.000Z" }));
    // A newer one
    await repo.saveTalk(makeTalk({ id: "t2", title: "Toast", createdAt: "2026-10-05T10:00:00.000Z" }));
    // Confirm the list order and a lookup
    expect([(await repo.listTalks()).map((talk) => talk.id), (await repo.getTalk("t2"))?.title]).toEqual([["t2", "t1"], "Toast"]);
    // Delete one
    await repo.deleteTalk("t1");
    // Confirm it is gone
    expect((await repo.listTalks()).map((talk) => talk.id)).toEqual(["t2"]);
  });
});
