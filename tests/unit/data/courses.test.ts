// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { loadCourseProgress, markPartDone, markRevisited } from "@/data/courses";
// Load the safe reader
import { readCourseProgress } from "@/core/courses";
// Load the import merge
import { mergeSettings } from "@/core/importMerge";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the record type
import type { SettingsRecord } from "@/data/records";

// Two moments
const [DAY1, DAY2] = [new Date("2026-10-20T10:00:00Z"), new Date("2026-10-24T10:00:00Z")];

// Group the checks about saving course progress (decision 131)
describe("course progress", () => {
  // Nothing saved: empty; finishing keeps the first time, takes the newest take; a comeback is added
  it("marks parts done and answered again", async () => {
    // A fresh repository
    const repository = createRepository(new MemoryStore());
    // Nothing yet
    const first = await loadCourseProgress(repository, DAY1);
    // Done on day 1 with take a
    await markPartDone(repository, "p1", "a", DAY1);
    // Done again on day 2 with take b
    await markPartDone(repository, "p1", "b", DAY2);
    // A part with no practice
    await markPartDone(repository, "p2", null, DAY2);
    // Answered again
    await markRevisited(repository, "p1", "c", DAY2);
    // A comeback for a part never finished does nothing
    await markRevisited(repository, "p9", "d", DAY2);
    // Confirm empty, then the saved progress
    expect([first, await loadCourseProgress(repository, DAY2)]).toEqual([{}, { p1: { doneAt: DAY1.toISOString(), takeId: "b", revisitedAt: DAY2.toISOString(), revisitTakeId: "c" }, p2: { doneAt: DAY2.toISOString(), takeId: null } }]);
  });

  // Saving keeps the rest of the settings
  it("leaves other settings alone", async () => {
    // A repository with a choice saved
    const repository = createRepository(new MemoryStore());
    // The settings with a choice
    await repository.saveSettings({ ...(await repository.getSettings(DAY1)), hideStreak: true });
    // Mark a part
    await markPartDone(repository, "p1", "a", DAY1);
    // Confirm the choice survived
    expect((await repository.getSettings(DAY1)).hideStreak).toBe(true);
  });

  // Values from an older version or another app are dropped, never thrown on
  it("reads foreign values safely", () => {
    // Not a map, an array, broken entries, and one good one with a half comeback
    const read = [readCourseProgress(undefined), readCourseProgress("x"), readCourseProgress([1]), readCourseProgress({ a: null, b: { doneAt: "not a date", takeId: "t" }, c: { doneAt: DAY1.toISOString(), takeId: 7 }, d: { doneAt: DAY1.toISOString(), takeId: "t", revisitedAt: DAY2.toISOString() } })];
    // Confirm only the good entry, without its half comeback
    expect(read).toEqual([{}, {}, {}, { d: { doneAt: DAY1.toISOString(), takeId: "t" } }]);
  });

  // A backup joined with this device: both kept, the one answered again wins, otherwise the later
  it("joins progress on import", () => {
    // The base settings
    const base: SettingsRecord = { focusIndex: 0, focusStartedOn: DAY1.toISOString(), audioRetention: 30 };
    // Here: p1 earlier, p2 answered again
    const here = { ...base, courses: { p1: { doneAt: DAY1.toISOString(), takeId: "a" }, p2: { doneAt: DAY2.toISOString(), takeId: "x", revisitedAt: DAY2.toISOString(), revisitTakeId: "y" } } };
    // The file: p1 later, p2 later but not answered again, p3, and junk
    const file = { ...base, courses: { p1: { doneAt: DAY2.toISOString(), takeId: "b" }, p2: { doneAt: "2026-10-25T10:00:00Z", takeId: "z" }, p3: { doneAt: DAY1.toISOString(), takeId: null }, junk: 5 } } as unknown as SettingsRecord;
    // Joined
    const joined = mergeSettings(here, file).courses;
    // Confirm the later p1, the answered p2, p3, and no junk
    expect(joined).toEqual({ p1: { doneAt: DAY2.toISOString(), takeId: "b" }, p2: here.courses.p2, p3: { doneAt: DAY1.toISOString(), takeId: null } });
  });

  // Neither side has any: no key added
  it("adds nothing when neither side has course progress", () => {
    // Plain settings
    const base: SettingsRecord = { focusIndex: 0, focusStartedOn: DAY1.toISOString(), audioRetention: 30 };
    // Confirm no key
    expect("courses" in mergeSettings(base, base)).toBe(false);
  });
});
