// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the in-memory store
import { MemoryStore } from "@/data/memoryStore";
// Load the repository
import { createRepository } from "@/data/repository";
// Load the export and import tools being checked
import { buildExport, importExport, parseExport } from "@/data/exportFile";
// Load a sample session builder
import { makeSession, makeTalk } from "../../support/fixtures";

// A fixed "now" for predictable output
const NOW = new Date(Date.UTC(2026, 9, 12, 18));

// Make a repository with some data in it
async function seededRepository() {
  // Wrap an empty store
  const repo = createRepository(new MemoryStore());
  // Save a baseline session that has audio
  await repo.saveSession(makeSession({ id: "s1", isBaseline: true, audioKey: "a1", createdAt: "2026-10-10T12:00:00.000Z" }));
  // Save its audio
  await repo.saveAudio("a1", new Blob(["voice"]));
  // Save a later session with feedback
  await repo.saveSession(makeSession({ id: "s2", retryOf: "s1", feedbackStatus: "done", feedback: { keep: "k", change: "c", retryCue: "r" } }));
  // Save a challenge
  await repo.saveChallenge({ id: "c1", weekStart: "2026-10-12", text: "Say hi to a neighbor", completedAt: null });
  // Save settings
  await repo.saveSettings({ focusIndex: 1, focusStartedOn: "2026-10-05T04:00:00.000Z", audioRetention: 30 });
  // Hand back the filled repository
  return repo;
}

// Group the checks about building an export
describe("buildExport", () => {
  // The file is labeled so it can be recognized on import
  it("labels the file with its format, version and time", async () => {
    // Build an export
    const file = await buildExport(await seededRepository(), NOW);
    // Confirm the label
    expect([file.format, file.version, file.exportedAt]).toEqual(["voicelab-export", 1, NOW.toISOString()]);
  });

  // Audio is not included, so session pointers to audio are cleared
  it("includes sessions, challenges and settings but not audio", async () => {
    // Build an export
    const file = await buildExport(await seededRepository(), NOW);
    // Confirm both sessions are included
    expect(file.sessions.map((s) => s.id).sort()).toEqual(["s1", "s2"]);
    // Confirm no session points at audio that the file does not contain
    expect(file.sessions.every((s) => s.audioKey === null)).toBe(true);
    // Confirm the challenge is included
    expect(file.challenges).toHaveLength(1);
    // Confirm the settings are included
    expect(file.settings.focusIndex).toBe(1);
  });
});

// Group the checks about the full round trip
describe("export and import", () => {
  // Data exported from one device and imported into a fresh one must match
  it("round-trips through a JSON file", async () => {
    // Export from a filled repository and turn it into file text
    const text = JSON.stringify(await buildExport(await seededRepository(), NOW));
    // Make a fresh, empty repository
    const fresh = createRepository(new MemoryStore());
    // Read and import the file
    const counts = await importExport(fresh, parseExport(text));
    // Confirm the counts reported to the user
    expect(counts).toEqual({ added: 2, kept: 0 });
    // Export again from the fresh repository
    const again = await buildExport(fresh, NOW);
    // Confirm everything matches the original export
    expect(again).toEqual(JSON.parse(text));
  });

  // Importing into a device that already has data adds to it rather than wiping it
  it("adds to existing data and updates records with the same id", async () => {
    // Make a repository with one unrelated session
    const repo = createRepository(new MemoryStore());
    // Save the unrelated session
    await repo.saveSession(makeSession({ id: "other" }));
    // Import the seeded data
    await importExport(repo, parseExport(JSON.stringify(await buildExport(await seededRepository(), NOW))));
    // Confirm all three sessions are present
    expect((await repo.listSessions()).map((s) => s.id).sort()).toEqual(["other", "s1", "s2"]);
  });
});

// Group the checks about importing onto a device that already has data (decision 86)
describe("importing over existing data", () => {
  // Regression: re-importing a backup unlinked recordings (the file has no audio) and replaced newer feedback and notes
  it("keeps recordings linked and newer feedback and notes", async () => {
    // The backup, made before anything below happened
    const file = parseExport(JSON.stringify(await buildExport(await seededRepository(), NOW)));
    // The device now: s1 still has its recording and gained notes; s2 is as it was
    const repo = await seededRepository();
    // Notes saved after the backup
    await repo.saveSession({ ...(await repo.getSession("s1"))!, selfReview: { worked: "", change: "Slow down", tags: [], skipped: false, savedAt: "2026-10-13T10:00:00.000Z" } });
    // Import the older backup
    const counts = await importExport(repo, file, NOW);
    // The session as it is now
    const s1 = await repo.getSession("s1");
    // Still linked to its recording, which is still there, notes kept, and both counted as already here
    expect([s1?.audioKey, !!(await repo.getAudio("a1")), s1?.selfReview?.change, counts]).toEqual(["a1", true, "Slow down", { added: 0, kept: 2 }]);
  });

  // A copy here that lacks something the file has gains it: feedback that arrived on another device comes in with its status
  it("fills in feedback the copy here lacks", async () => {
    // A device where s2 is still waiting for the coach
    const repo = createRepository(new MemoryStore());
    // Waiting
    await repo.saveSession(makeSession({ id: "s2", feedbackStatus: "pending", feedback: null, audioKey: "a2" }));
    // Import a file where it was reviewed
    await importExport(repo, parseExport(JSON.stringify(await buildExport(await seededRepository(), NOW))), NOW);
    // The session as it is now
    const s2 = await repo.getSession("s2");
    // The feedback and its status from the file, the recording link from here
    expect([s2?.feedback?.keep, s2?.feedbackStatus, s2?.audioKey]).toEqual(["k", "done", "a2"]);
  });

  // Settings: the file's choices, this device's where the file has none, and progress from both
  it("joins settings and progress instead of replacing them", async () => {
    // A device with its own progress and a choice the file lacks
    const repo = createRepository(new MemoryStore());
    // Saved here
    await repo.saveSettings({ focusIndex: 3, focusStartedOn: "2026-10-12T04:00:00.000Z", audioRetention: 60, stammer: true, learn: { a: { readAt: "2026-10-12T10:00:00.000Z", box: 2, dueAt: "2026-10-20T10:00:00.000Z", lastResult: "right", recalledAt: "2026-10-12T10:00:00.000Z" } }, scenarios: { s: { firstTier: "good", lastTier: "best", firstAt: "2026-10-01", lastAt: "2026-10-12" } }, warmupDays: ["2026-10-12"], missions: [{ id: "m1", missionId: "x", day: "2026-10-12", status: "done", predicted: 3, tried: true, outcome: 4, note: "", tooMuch: false, debriefedAt: "2026-10-12T20:00:00.000Z" }] });
    // A backup with its own progress, an older copy of card a, and an earlier copy of the mission
    const file = parseExport(JSON.stringify({ ...(await buildExport(await seededRepository(), NOW)), settings: { focusIndex: 1, focusStartedOn: "2026-10-05T04:00:00.000Z", audioRetention: 30, learn: { a: { readAt: "2026-10-01T10:00:00.000Z", box: 0, dueAt: "2026-10-02T10:00:00.000Z", lastResult: null }, b: { readAt: "2026-10-02T10:00:00.000Z", box: 1, dueAt: "2026-10-04T10:00:00.000Z", lastResult: "right" } }, warmupDays: ["2026-10-01"], missions: [{ id: "m1", missionId: "x", day: "2026-10-12", status: "accepted", predicted: 3, tried: null, outcome: null, note: "", tooMuch: false, debriefedAt: null }, { id: "m0", missionId: "y", day: "2026-10-01", status: "skipped", predicted: null, tried: null, outcome: null, note: "", tooMuch: false, debriefedAt: null }] } }));
    // Import it
    await importExport(repo, file, NOW);
    // The settings now
    const settings = await repo.getSettings(NOW);
    // The file's focus, this device's stammer, both cards with this device's newer card a, both scenario and warm-up days, both missions with this device's finished one
    expect([settings.focusIndex, settings.stammer, Object.keys(settings.learn ?? {}).sort(), settings.learn?.a?.box, Object.keys(settings.scenarios ?? {}), settings.warmupDays, settings.missions?.map((mission) => `${mission.id}:${mission.status}`)]).toEqual([1, true, ["a", "b"], 2, ["s"], ["2026-10-01", "2026-10-12"], ["m0:skipped", "m1:done"]]);
  });

  // A challenge done here stays done when an older file says it is not
  it("keeps a challenge marked done", async () => {
    // A device where the challenge is done
    const repo = createRepository(new MemoryStore());
    // Done
    await repo.saveChallenge({ id: "c1", weekStart: "2026-10-12", text: "Say hi to a neighbor", completedAt: "2026-10-13T09:00:00.000Z" });
    // Import a file where it is not
    await importExport(repo, parseExport(JSON.stringify(await buildExport(await seededRepository(), NOW))), NOW);
    // Still done
    expect((await repo.listChallenges())[0]?.completedAt).toBe("2026-10-13T09:00:00.000Z");
  });
});

// Group the checks about refusing bad files
describe("parseExport", () => {
  // A file that is not JSON at all
  it("rejects text that is not JSON", () => {
    // Confirm a plain-language error
    expect(() => parseExport("hello")).toThrow("This file is not a VoiceLab export.");
  });

  // A JSON file from somewhere else
  it("rejects JSON that is not a VoiceLab export", () => {
    // Confirm a plain-language error
    expect(() => parseExport(JSON.stringify({ hello: "world" }))).toThrow("This file is not a VoiceLab export.");
  });

  // A file from a newer version of the app
  it("rejects a file from a newer version", () => {
    // Confirm a plain-language error
    expect(() => parseExport(JSON.stringify({ format: "voicelab-export", version: 99 }))).toThrow("This file comes from a newer version of VoiceLab.");
  });

  // Files exported before warm-ups existed have no mode; their sessions are full sessions
  it("treats sessions without a mode as full sessions", () => {
    // A valid file whose session has no mode field
    const session: Record<string, unknown> = { ...makeSession({ id: "old" }) };
    // Remove the mode, as an older export would have
    delete session.mode;
    // Build the file text
    const text = JSON.stringify({ format: "voicelab-export", version: 1, exportedAt: NOW.toISOString(), sessions: [session], challenges: [], settings: { focusIndex: 0, focusStartedOn: NOW.toISOString(), audioRetention: 30 } });
    // Confirm the session comes back as a full session
    expect(parseExport(text).sessions[0]?.mode).toBe("standard");
  });

  // Table Topics and Record Responses survive a round trip
  it("keeps every mode", () => {
    // A file with one talk
    const text = JSON.stringify({ format: "voicelab-export", version: 1, exportedAt: NOW.toISOString(), sessions: [makeSession({ id: "t1", mode: "talk" }), makeSession({ id: "r1", mode: "response" }), makeSession({ id: "d1", mode: "pause" }), makeSession({ id: "h1", mode: "rehearse" }), makeSession({ id: "l1", mode: "lesson" })], challenges: [], settings: { focusIndex: 0, focusStartedOn: NOW.toISOString(), audioRetention: 30 } });
    // Confirm it comes back as a talk
    expect(parseExport(text).sessions.map((session) => session.mode)).toEqual(["talk", "response", "pause", "rehearse", "lesson"]);
  });

  // Saved talks go into the file and come back; files from before talks existed still import
  it("carries saved talks, and accepts files without them", async () => {
    // A repository with a talk
    const repository = createRepository(new MemoryStore());
    // Save it
    await repository.saveTalk(makeTalk());
    // Export and read the file back
    const file = parseExport(JSON.stringify(await buildExport(repository, NOW)));
    // Import into an empty repository
    const fresh = createRepository(new MemoryStore());
    // Import it
    await importExport(fresh, file);
    // An older file with no talks field
    const older = JSON.stringify({ format: "voicelab-export", version: 1, exportedAt: NOW.toISOString(), sessions: [], challenges: [], settings: { focusIndex: 0, focusStartedOn: NOW.toISOString(), audioRetention: 30 } });
    // Confirm the talk round-tripped and the older file parses
    expect([(await fresh.listTalks()).map((talk) => talk.title), parseExport(older).talks]).toEqual([["Team update"], []]);
  });

  // A talk's date and a rehearsal's section survive the round trip; a damaged date does not import
  it("carries a talk's date and a rehearsal's section, and rejects a damaged date", async () => {
    // A repository with a dated talk and a section rehearsal
    const repository = createRepository(new MemoryStore());
    // Save the talk
    await repository.saveTalk(makeTalk({ eventDate: "2026-10-22" }));
    // Save the rehearsal
    await repository.saveSession(makeSession({ id: "s1", mode: "rehearse", sectionIndex: 2 }));
    // Export and read the file back
    const file = parseExport(JSON.stringify(await buildExport(repository, NOW)));
    // The same file with the date damaged
    const damaged = JSON.stringify({ ...file, talks: [{ ...file.talks[0], eventDate: 22 }] });
    // Confirm both survived, and the damaged file is refused
    expect([file.talks[0]?.eventDate, file.sessions[0]?.sectionIndex, (() => { try { parseExport(damaged); return "accepted"; } catch { return "refused"; } })()]).toEqual(["2026-10-22", 2, "refused"]);
  });

  // A session's Q&A questions and a Q&A answer's question survive the round trip; a damaged list does not import
  it("carries Q&A questions, and rejects a damaged list", async () => {
    // A repository with a rehearsal that has questions, and an answer
    const repository = createRepository(new MemoryStore());
    // The rehearsal
    await repository.saveSession(makeSession({ id: "r1", mode: "rehearse", questions: ["A?", "B?"] }));
    // The answer
    await repository.saveSession(makeSession({ id: "q1", mode: "qa", promptId: "r1", question: "A?" }));
    // Export and read back
    const file = parseExport(JSON.stringify(await buildExport(repository, NOW)));
    // The same file with a damaged list
    const damaged = JSON.stringify({ ...file, sessions: file.sessions.map((session) => (session.id === "r1" ? { ...session, questions: [1, 2] } : session)) });
    // Confirm both survived, and the damaged file is refused
    expect([file.sessions.find((session) => session.id === "r1")?.questions, file.sessions.find((session) => session.id === "q1")?.question, (() => { try { parseExport(damaged); return "accepted"; } catch { return "refused"; } })()]).toEqual([["A?", "B?"], "A?", "refused"]);
  });

  // A conversation keeps its turns and the coach's line; a turn said by nobody is refused (decision 83)
  it("carries a conversation's turns, and refuses a broken turn", () => {
    // A conversation with Maya
    const turns = [{ who: "them" as const, text: "Hi! I'm Maya.", lineId: "maya-01", seconds: 3 }, { who: "you" as const, text: "Hi, I'm Sam", seconds: 2 }];
    // Its session, with the coach's notes
    const session = makeSession({ id: "c1", mode: "conversation", promptId: "maya", conversation: { turns }, feedbackStatus: "done", feedback: { keep: "k", change: "c", retryCue: "r", conversation: { yours: "Hi", better: "Hi, I'm Sam. And you?" } } });
    // The file around it
    const file = (sessions: unknown[]) => JSON.stringify({ format: "voicelab-export", version: 1, exportedAt: NOW.toISOString(), sessions, challenges: [], settings: { focusIndex: 0, focusStartedOn: NOW.toISOString(), audioRetention: 30 } });
    // The same session with a turn said by nobody
    const broken = { ...session, conversation: { turns: [{ who: "nobody", text: "?", seconds: 1 }] } };
    // Kept, and refused
    expect([parseExport(file([session])).sessions[0]?.conversation?.turns, (() => { try { parseExport(file([broken])); return "accepted"; } catch { return "refused"; } })()]).toEqual([turns, "refused"]);
  });

  // A damaged file with a broken session
  it("rejects a file with a damaged record", () => {
    // Build a file whose session is missing its transcript
    const text = JSON.stringify({ format: "voicelab-export", version: 1, exportedAt: NOW.toISOString(), sessions: [{ id: "s1" }], challenges: [], settings: { focusIndex: 0, focusStartedOn: NOW.toISOString(), audioRetention: 30 } });
    // Confirm a plain-language error
    expect(() => parseExport(text)).toThrow("This file is damaged and cannot be imported.");
  });
});
