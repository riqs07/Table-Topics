// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { loadListenProgress, loadSceneProgress, saveListenResult, saveSceneResult } from "@/data/practiceProgress";
// Load the import merge
import { mergeSettings } from "@/core/importMerge";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the record type
import type { SettingsRecord } from "@/data/records";

// Two moments
const [DAY1, DAY2] = [new Date("2026-10-30T10:00:00Z"), new Date("2026-10-31T10:00:00Z")];

// Group the checks about saving Scenes and Active listening progress (decisions 149 and 150)
describe("practice progress", () => {
  // Nothing saved: empty; a second play keeps the first time and the best, and takes the latest
  it("saves scene plays, keeping the first time and the best warmth", async () => {
    // A fresh repository
    const repository = createRepository(new MemoryStore());
    // Nothing yet
    const before = await loadSceneProgress(repository, DAY1);
    // A warm play on day 1, a cooler one on day 2
    await saveSceneResult(repository, "sn-lisbon", { warmth: 4, passed: 4, checkCount: 4 }, DAY1);
    await saveSceneResult(repository, "sn-lisbon", { warmth: -1, passed: 1, checkCount: 4 }, DAY2);
    // Confirm empty, then the joined progress
    expect([before, await loadSceneProgress(repository, DAY2)]).toEqual([{}, { "sn-lisbon": { plays: 2, firstAt: DAY1.toISOString(), lastAt: DAY2.toISOString(), lastWarmth: -1, bestWarmth: 4, lastPassed: 1, checkCount: 4 } }]);
  });

  // The same for stories: the most details kept, the latest answer's details and core
  it("saves story answers, keeping the most details caught", async () => {
    // A fresh repository
    const repository = createRepository(new MemoryStore());
    // A poor answer then a better one
    await saveListenResult(repository, "ls-radio", { caught: 1, detailCount: 7, core: false }, DAY1);
    await saveListenResult(repository, "ls-radio", { caught: 4, detailCount: 7, core: true }, DAY2);
    // A third, poorer again
    await saveListenResult(repository, "ls-radio", { caught: 2, detailCount: 7, core: false }, DAY2);
    // Confirm the joined progress
    expect(await loadListenProgress(repository, DAY2)).toEqual({ "ls-radio": { plays: 3, firstAt: DAY1.toISOString(), lastAt: DAY2.toISOString(), lastCaught: 2, bestCaught: 4, detailCount: 7, lastCore: false } });
  });

  // Saving keeps the rest of the settings, including older progress the app wrote before (and scenes leave stories alone)
  it("keeps the rest of the settings when saving", async () => {
    // A repository whose settings already hold quick scenario progress and a choice
    const repository = createRepository(new MemoryStore());
    // The settings now
    const settings = await repository.getSettings(DAY1);
    // With older progress and a choice saved
    await repository.saveSettings({ ...settings, hideStreak: true, scenarios: { "sc-job-offer": { firstTier: "best", lastTier: "best", firstAt: DAY1.toISOString(), lastAt: DAY1.toISOString() } } });
    // A scene and a story
    await saveSceneResult(repository, "sn-early", { warmth: 2, passed: 2, checkCount: 3 }, DAY2);
    await saveListenResult(repository, "ls-whale", { caught: 3, detailCount: 6, core: true }, DAY2);
    // The settings after
    const after = await repository.getSettings(DAY2);
    // Confirm everything is there
    expect([after.hideStreak, Object.keys(after.scenarios ?? {}), Object.keys(after.scenes ?? {}), Object.keys(after.listening ?? {})]).toEqual([true, ["sc-job-offer"], ["sn-early"], ["ls-whale"]]);
  });

  // A failing store fails the save loudly, so the screen can say so
  it("fails loudly when the store cannot save", async () => {
    // A repository whose settings cannot be written
    const repository = createRepository(new MemoryStore());
    // Saving the settings breaks
    repository.saveSettings = () => Promise.reject(new Error("The storage is full."));
    // Confirm both saves fail with the store's error
    await expect(saveSceneResult(repository, "sn-early", { warmth: 0, passed: 0, checkCount: 3 }, DAY1)).rejects.toThrow("The storage is full.");
    await expect(saveListenResult(repository, "ls-radio", { caught: 0, detailCount: 7, core: false }, DAY1)).rejects.toThrow("The storage is full.");
  });
});

// Group the checks about importing a backup
describe("mergeSettings with scenes and stories", () => {
  // Both sides' progress joined, the later play winning where both have one; an older backup without them keeps the device's
  it("joins progress, the later play winning, and keeps it when the backup has none", () => {
    // A play of a scene and a story
    const scene = (lastAt: string, lastWarmth: number) => ({ plays: 1, firstAt: lastAt, lastAt, lastWarmth, bestWarmth: lastWarmth, lastPassed: 0, checkCount: 3 });
    // (story)
    const story = (lastAt: string, lastCaught: number) => ({ plays: 1, firstAt: lastAt, lastAt, lastCaught, bestCaught: lastCaught, detailCount: 5, lastCore: false });
    // The device's settings
    const device = { focusIndex: 0, focusStartedOn: "2026-10-01", audioRetention: 30, scenes: { a: scene("2026-10-30", 1), b: scene("2026-10-20", 2) }, listening: { x: story("2026-10-30", 1) } } as SettingsRecord;
    // The file's settings, newer for b and with a new story
    const file = { focusIndex: 0, focusStartedOn: "2026-10-01", audioRetention: 30, scenes: { b: scene("2026-10-25", 4) }, listening: { y: story("2026-10-29", 3) } } as SettingsRecord;
    // An older backup with neither
    const old = { focusIndex: 0, focusStartedOn: "2026-10-01", audioRetention: 30 } as SettingsRecord;
    // Joined
    const joined = mergeSettings(device, file);
    // Confirm the join, and that the old backup keeps the device's
    expect([joined.scenes?.b?.lastWarmth, Object.keys(joined.scenes ?? {}).sort(), Object.keys(joined.listening ?? {}).sort(), mergeSettings(device, old).scenes]).toEqual([4, ["a", "b"], ["x", "y"], device.scenes]);
  });
});
