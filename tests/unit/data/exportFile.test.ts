// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the in-memory store
import { MemoryStore } from "@/data/memoryStore";
// Load the repository
import { createRepository } from "@/data/repository";
// Load the export and import tools being checked
import { buildExport, exportParts, importExport, parseExport } from "@/data/exportFile";
// Load the analysis builder, to make a version 1 file's analysis (with its words)
import { buildAnalysis } from "@/core/analysis/analysis";
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
    expect([file.format, file.version, file.exportedAt]).toEqual(["voicelab-export", 2, NOW.toISOString()]);
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

// Group the checks about the file layout of decisions 98 and 99: readings in their own list, compact, written a part at a time
describe("export file version 2", () => {
  // One take's readings
  const READINGS = { loudness: [0.1, 0.25], pitch: [118, null], spokenTimes: [0.3, 0.9] };

  // Readings are a list of their own; the sessions stay small; analyses leave their words out
  it("puts readings in their own list and leaves analyses' words out", async () => {
    // A take with readings and its analysis
    const repo = createRepository(new MemoryStore());
    // (the take)
    const take = makeSession({ id: "t1", mode: "talk", transcript: "so we went home", ...READINGS });
    // Saved
    await repo.saveSession(take);
    // Its analysis
    await repo.saveAnalysis(buildAnalysis(take, NOW));
    // The file
    const file = await buildExport(repo, NOW);
    // Confirm the readings list, the small session and the analysis without words
    expect([file.signals, "loudness" in (file.sessions[0] ?? {}), file.analyses[0]?.raw.timedWords]).toEqual([[{ sessionId: "t1", ...READINGS }], false, undefined]);
  });

  // The file is compact JSON (pretty-printing made it two and a half times bigger), written in parts that join into the same file, saying how far it got
  it("writes compact parts that read back as the same file, with progress", async () => {
    // A few hundred sessions, to need more than one part
    const repo = createRepository(new MemoryStore());
    // (saved)
    for (let index = 0; index < 450; index += 1) await repo.saveSession(makeSession({ id: `s${String(index).padStart(3, "0")}`, createdAt: new Date(Date.UTC(2026, 0, 1) + index * 3_600_000).toISOString() }));
    // The file
    const file = await buildExport(repo, NOW);
    // Progress reports
    const progress: Array<{ done: number; total: number }> = [];
    // Written in parts
    const parts = await exportParts(file, { onProgress: (step) => progress.push(step), pause: async () => {} });
    // The whole text
    const text = parts.join("");
    // Confirm it reads back as the file, has no line breaks, came in several parts, and progress reached the end
    expect([parseExport(text).sessions.length, text.includes("\n"), parts.length > 5, progress.at(-1)]).toEqual([450, false, true, { done: 450, total: 450 }]);
    // Confirm it equals the file made in one go
    expect(JSON.parse(text)).toEqual(JSON.parse(JSON.stringify(file)));
  });

  // A version 1 file (readings on each session, analyses with their words) still imports, its readings moved apart
  it("imports a version 1 file", async () => {
    // A take as a version 1 file held it
    const take = makeSession({ id: "v1", mode: "talk", transcript: "we went to the park", ...READINGS });
    // The file
    const text = JSON.stringify({ format: "voicelab-export", version: 1, exportedAt: NOW.toISOString(), sessions: [take], challenges: [], settings: { focusIndex: 0, focusStartedOn: NOW.toISOString(), audioRetention: 30 }, analyses: [buildAnalysis(take, NOW)] });
    // A fresh device
    const fresh = createRepository(new MemoryStore());
    // Imported
    await importExport(fresh, parseExport(text), NOW);
    // Confirm the readings are apart and whole, and the analysis stored without words but with the same measures
    expect([(await fresh.getSignals("v1"))?.pitch, "pitch" in ((await fresh.getSession("v1")) ?? {}), (await fresh.getAnalysis("v1"))?.raw.timedWords, (await fresh.getAnalysis("v1"))?.metrics]).toEqual([READINGS.pitch, false, undefined, buildAnalysis(take, NOW).metrics]);
  });

  // A device that dropped a take's readings on purpose does not get them back from an older backup, and its mark stays
  it("does not bring back readings this device dropped", async () => {
    // The backup, made while the take still had its readings
    const source = createRepository(new MemoryStore());
    // (the take)
    await source.saveSession(makeSession({ id: "old", ...READINGS }));
    // (the file)
    const text = JSON.stringify(await buildExport(source, NOW));
    // This device: the same take, its readings dropped and marked
    const here = createRepository(new MemoryStore());
    // (saved, marked)
    await here.saveSession(makeSession({ id: "old", trimmedAt: "2026-10-01T00:00:00.000Z" }));
    // Imported
    await importExport(here, parseExport(text), NOW);
    // Confirm no readings came back and the mark stayed
    expect([await here.getSignals("old"), (await here.getSession("old"))?.trimmedAt]).toEqual([undefined, "2026-10-01T00:00:00.000Z"]);
  });

  // A big import is saved in chunks, each in one transaction, saying how far it got
  it("imports in chunks with progress", async () => {
    // A file with 450 sessions
    const repo = createRepository(new MemoryStore());
    // (saved)
    for (let index = 0; index < 450; index += 1) await repo.saveSession(makeSession({ id: `s${index}` }));
    // (the file)
    const file = parseExport(JSON.stringify(await buildExport(repo, NOW)));
    // A fresh device that counts its transactions
    const store = new MemoryStore();
    // (counted)
    let batches = 0;
    // (the counting store)
    const counting = Object.assign(Object.create(store) as MemoryStore, { batch: (ops: Parameters<MemoryStore["batch"]>[0]) => { batches += 1; return store.batch(ops); } });
    // Progress reports
    const progress: number[] = [];
    // Imported
    const counts = await importExport(createRepository(counting), file, NOW, { onProgress: (step) => progress.push(step.done), pause: async () => {} });
    // Confirm every session arrived in a handful of transactions (not one per record), with progress at each chunk
    expect([counts.added, (await store.getAll("sessions")).length, batches <= 6, progress]).toEqual([450, 450, true, [200, 400, 450]]);
  });

  // A damaged readings list is refused before anything is saved
  it("refuses a file with damaged readings", () => {
    // A version 2 file whose readings are not numbers
    const text = JSON.stringify({ format: "voicelab-export", version: 2, exportedAt: NOW.toISOString(), settings: { focusIndex: 0, focusStartedOn: NOW.toISOString(), audioRetention: 30 }, sessions: [], signals: [{ sessionId: "x", pitch: ["high"] }], challenges: [] });
    // Confirm it is refused
    expect(() => parseExport(text)).toThrow("This file is damaged and cannot be imported.");
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

  // What to get better at goes into the file and comes back; a file without it keeps this device's, and unknown areas in an edited file are dropped (decision 97)
  it("exports and imports what you want to get better at", async () => {
    // A device with a focus
    const source = await seededRepository();
    // Stories and voice
    await source.saveSettings({ ...(await source.getSettings(NOW)), practiceFocus: ["stories", "voice"] });
    // Its export
    const file = await buildExport(source, NOW);
    // A fresh device imports it
    const fresh = createRepository(new MemoryStore());
    // Import
    await importExport(fresh, parseExport(JSON.stringify(file)), NOW);
    // A device with its own focus imports a file from before the focus existed
    const kept = createRepository(new MemoryStore());
    // Its focus
    await kept.saveSettings({ ...(await kept.getSettings(NOW)), practiceFocus: ["work"] });
    // The old file has no focus
    await importExport(kept, parseExport(JSON.stringify({ ...file, settings: { ...file.settings, practiceFocus: undefined } })), NOW);
    // An edited file names an area that does not exist
    const edited = createRepository(new MemoryStore());
    // Import it
    await importExport(edited, parseExport(JSON.stringify({ ...file, settings: { ...file.settings, practiceFocus: ["nonsense", "talk", "talk"] } })), NOW);
    // Confirm the file holds it, and each device's result
    expect([file.settings.practiceFocus, (await fresh.getSettings(NOW)).practiceFocus, (await kept.getSettings(NOW)).practiceFocus, (await edited.getSettings(NOW)).practiceFocus]).toEqual([["stories", "voice"], ["stories", "voice"], ["work"], ["talk"]]);
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
