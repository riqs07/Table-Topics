// Checks for the weekly check-in in the export file (decision 100): its takes and settings round-trip in version 2, older files without them still import, a damaged check-in is refused, and an import joins with what is here (the device's link and marker kept, skipped parts and reminders joined, the file's day)
import { describe, expect, it } from "vitest";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the export and import tools
import { buildExport, exportParts, importExport, parseExport } from "@/data/exportFile";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// A fixed "now"
const NOW = new Date(Date.UTC(2026, 9, 20, 18));
// Plain settings for a file
const SETTINGS = { focusIndex: 0, focusStartedOn: NOW.toISOString(), audioRetention: 30 };
// A check-in take as it is saved
const TAKE = makeSession({ id: "ci-read-1", mode: "read", promptId: "ci-read", marker: true, audioKey: "ci-read-1", createdAt: "2026-10-13T09:00:00.000Z", checkIn: { id: "ci-2026-10-13", week: 1, part: "read" } });

// Group the checks
describe("check-ins in the export file", () => {
  // Takes and settings come back as they went
  it("round-trips check-in takes and settings in version 2", async () => {
    // A device with a check-in take and its settings
    const repository = createRepository(new MemoryStore());
    // (the take)
    await repository.saveSession(TAKE);
    // (the settings)
    await repository.saveSettings({ ...SETTINGS, checkIn: { day: 2, skipped: [{ id: "ci-2026-10-13", parts: ["story"] }], seen: [7], keep: "thinned" } });
    // Exported and read back
    const file = parseExport((await exportParts(await buildExport(repository, NOW))).join(""));
    // Into an empty device
    const other = createRepository(new MemoryStore());
    // (imported)
    await importExport(other, file, NOW);
    // Confirm the version, the take's tag and marker, and the settings
    expect([file.version, (await other.getSession("ci-read-1"))?.checkIn, (await other.getSession("ci-read-1"))?.marker, (await other.getSettings(NOW)).checkIn]).toEqual([2, { id: "ci-2026-10-13", week: 1, part: "read" }, true, { day: 2, skipped: [{ id: "ci-2026-10-13", parts: ["story"] }], seen: [7], keep: "thinned" }]);
  });

  // Files made before the check-in, of either version, still import
  it("imports older files without check-ins, version 1 and version 2", async () => {
    // A version 1 file and a version 2 file with an ordinary session and no check-in settings
    const files = [1, 2].map((version) => JSON.stringify({ format: "voicelab-export", version, exportedAt: NOW.toISOString(), sessions: [makeSession({ id: `old-${version}` })], signals: [], challenges: [], settings: SETTINGS }));
    // Into one device
    const repository = createRepository(new MemoryStore());
    // Each imported
    for (const text of files) await importExport(repository, parseExport(text), NOW);
    // Confirm both sessions came in, without check-in tags, and the settings have no check-in
    expect([(await repository.listSessions()).map((session) => [session.id, session.checkIn]).sort(), (await repository.getSettings(NOW)).checkIn]).toEqual([[["old-1", undefined], ["old-2", undefined]], undefined]);
  });

  // A damaged check-in tag is refused before anything is saved
  it("refuses a damaged check-in tag", () => {
    // A file with a take tagged with an unknown part, a bad id, or no number
    const damaged = [{ id: "ci-2026-10-13", week: 1, part: "dance" }, { id: "monday", week: 1, part: "read" }, { id: "ci-2026-10-13", part: "read" }].map((checkIn) => JSON.stringify({ format: "voicelab-export", version: 2, exportedAt: NOW.toISOString(), sessions: [{ ...TAKE, checkIn }], signals: [], challenges: [], settings: SETTINGS }));
    // Confirm each is refused as damaged
    expect(damaged.map((text) => { try { parseExport(text); return "read"; } catch (error) { return (error as Error).message; } })).toEqual(Array(3).fill("This file is damaged and cannot be imported."));
  });

  // Joined with what is here: the device's recording and marker stay, skips and reminders join, the file's day wins, a damaged choice is dropped
  it("joins with the check-ins already here", async () => {
    // A device with the take (and its recording) and its own skips
    const repository = createRepository(new MemoryStore());
    // (the take)
    await repository.saveSession(TAKE);
    // (its settings)
    await repository.saveSettings({ ...SETTINGS, checkIn: { day: 1, skipped: [{ id: "ci-2026-10-13", parts: ["pitch"] }], seen: [7] } });
    // A backup with the same take, unlinked and unmarked, another skip, another reminder, another day and a damaged choice
    const text = JSON.stringify({ format: "voicelab-export", version: 2, exportedAt: NOW.toISOString(), sessions: [{ ...TAKE, audioKey: null, marker: undefined }], signals: [], challenges: [], settings: { ...SETTINGS, checkIn: { day: 4, skipped: [{ id: "ci-2026-10-13", parts: ["surprise"] }], seen: [14], keep: "most" } } });
    // Imported
    const counts = await importExport(repository, parseExport(text), NOW);
    // Confirm the take kept its recording and marker, and the settings joined
    expect([counts, (await repository.getSession("ci-read-1"))?.audioKey, (await repository.getSession("ci-read-1"))?.marker, (await repository.getSettings(NOW)).checkIn]).toEqual([{ added: 0, kept: 1 }, "ci-read-1", true, { day: 4, skipped: [{ id: "ci-2026-10-13", parts: ["pitch", "surprise"] }], seen: [7, 14] }]);
  });
});
