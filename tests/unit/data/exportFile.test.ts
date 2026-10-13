// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the in-memory store
import { MemoryStore } from "@/data/memoryStore";
// Load the repository
import { createRepository } from "@/data/repository";
// Load the export and import tools being checked
import { buildExport, importExport, parseExport } from "@/data/exportFile";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

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
    expect(counts).toEqual({ sessions: 2, challenges: 1 });
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

  // A damaged file with a broken session
  it("rejects a file with a damaged record", () => {
    // Build a file whose session is missing its transcript
    const text = JSON.stringify({ format: "voicelab-export", version: 1, exportedAt: NOW.toISOString(), sessions: [{ id: "s1" }], challenges: [], settings: { focusIndex: 0, focusStartedOn: NOW.toISOString(), audioRetention: 30 } });
    // Confirm a plain-language error
    expect(() => parseExport(text)).toThrow("This file is damaged and cannot be imported.");
  });
});
