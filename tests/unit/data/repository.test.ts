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

// Group the checks about keeping only recent audio
describe("pruneAudio", () => {
  // Save n sessions, each with audio, on consecutive days; the first is the baseline
  async function seed(count: number) {
    // Create each session and its audio
    for (let n = 1; n <= count; n++) {
      // Save the audio
      await repo.saveAudio(`audio-${n}`, new Blob([`voice ${n}`]));
      // Save the session pointing at it
      await repo.saveSession(makeSession({ id: `s${n}`, createdAt: day(n), audioKey: `audio-${n}`, isBaseline: n === 1 }));
    }
  }

  // Older audio beyond the limit is deleted and the session no longer points at it
  it("keeps audio only for the most recent sessions", async () => {
    // Save five sessions with audio
    await seed(5);
    // Keep audio for the latest two
    await repo.saveSettings({ ...(await repo.getSettings(NOW)), audioRetention: 2 });
    // Prune
    const pruned = await repo.pruneAudio();
    // Confirm two were pruned (s2 and s3; s1 is the baseline)
    expect(pruned).toBe(2);
    // Confirm which sessions still point at audio
    expect((await repo.listSessions()).filter((s) => s.audioKey).map((s) => s.id)).toEqual(["s5", "s4", "s1"]);
    // Confirm the pruned audio is really gone
    expect(await repo.getAudio("audio-2")).toBeUndefined();
    // Confirm the transcript and numbers are kept
    expect((await repo.getSession("s2"))?.transcript).toBe(makeSession().transcript);
  });

  // The first recording is the progress anchor, so its audio is never removed
  it("never prunes the baseline recording's audio", async () => {
    // Save five sessions with audio
    await seed(5);
    // Keep audio for only the latest one
    await repo.saveSettings({ ...(await repo.getSettings(NOW)), audioRetention: 1 });
    // Prune
    await repo.pruneAudio();
    // Confirm the baseline audio is still there
    expect(await repo.getAudio("audio-1")).toBeDefined();
  });

  // The default limit is 30 sessions
  it("uses the default limit of 30", async () => {
    // Save 32 sessions with audio
    await seed(32);
    // Prune with default settings
    const pruned = await repo.pruneAudio();
    // Confirm only s2 lost audio (s3 to s32 are the latest 30; s1 is the baseline)
    expect(pruned).toBe(1);
  });

  // A bad saved limit (negative or not a whole number) must not prune the wrong sessions
  it("treats a negative limit as zero and rounds fractions down", async () => {
    // Save three sessions with audio
    await seed(3);
    // Save a negative limit
    await repo.saveSettings({ ...(await repo.getSettings(NOW)), audioRetention: -2 });
    // Confirm every non-baseline recording is pruned, as with a limit of zero
    expect(await repo.pruneAudio()).toBe(2);
  });

  // Pruning twice does nothing the second time
  it("does nothing when there is nothing to prune", async () => {
    // Save three sessions with audio
    await seed(3);
    // Confirm nothing is pruned under the default limit
    expect(await repo.pruneAudio()).toBe(0);
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

  // The first recording of each prompt is kept so "then and now" can play it later
  it("keeps the audio of the first recording of each prompt", async () => {
    // Five sessions on different prompts, the second one first recorded on day 2
    for (let n = 1; n <= 5; n++) {
      // Save the audio
      await repo.saveAudio(`audio-${n}`, new Blob([`voice ${n}`]));
      // Day 2 and day 4 share a prompt; the others are each a prompt's first take, except day 5 which repeats day 1's prompt
      await repo.saveSession(makeSession({ id: `s${n}`, createdAt: day(n), audioKey: `audio-${n}`, promptId: ["p1", "p2", "p3", "p2", "p1"][n - 1] }));
    }
    // Keep audio for only the latest one
    await repo.saveSettings({ ...(await repo.getSettings(NOW)), audioRetention: 1 });
    // Prune
    await repo.pruneAudio();
    // Confirm the first takes of p1, p2, p3 and the latest session keep their audio
    expect((await repo.listSessions()).filter((session) => session.audioKey).map((session) => session.id)).toEqual(["s5", "s3", "s2", "s1"]);
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
