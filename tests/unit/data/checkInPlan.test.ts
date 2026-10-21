// Checks for the weekly check-in in today's plan and its data (decision 100): a check-in day swaps the reading and the picks for the check-in, keeps the Learn card, stays the same all day, counts as done once every part is done or skipped; and saving a check-in take numbers it, marks it and skips the listening step
import { describe, expect, it } from "vitest";
// Load the plan rules
import { dailyPlan, planMinutes, planProgress } from "@/core/dailyPlan";
// Load the plan loader and the check-in's reads and writes
import { loadDailyPlan } from "@/data/dailyPlan";
import { analysesFor, loadCheckIns, markReminderSeen, skipCheckInPart } from "@/data/checkIns";
// Load the recording saver
import { saveRecording } from "@/data/saveRecording";
// Load the check-in rules
import { CHECK_IN_PARTS, checkInId } from "@/core/checkIn";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository, type Repository } from "@/data/repository";
// Load the record types
import type { CheckInPart } from "@/data/records";
// Load a sample session builder and the skip helper
import { checkInSkippedOn, makeSession } from "../../support/fixtures";

// Tuesday 13 October 2026, mid-morning: day two for a user who started on Monday
const TODAY = new Date(2026, 9, 13, 10);
// Monday morning
const MONDAY = new Date(2026, 9, 12, 9);

// A repository with one session on Monday, so today is day two and the first check-in is due
async function dayTwo(): Promise<Repository> {
  // Empty to begin with
  const repository = createRepository(new MemoryStore());
  // Monday's session
  await repository.saveSession(makeSession({ id: "monday", createdAt: MONDAY.toISOString() }));
  // Handed back
  return repository;
}

// Save one check-in part as the recording page does
async function record(repository: Repository, part: CheckInPart, at: Date, id = checkInId(at)) {
  // The take, saved through the real saver
  return saveRecording(repository, { id: `${part}-${at.getTime()}`, transcript: "the same words as before, said again a little more slowly", durationSec: 60, audio: new Blob(["a"]), promptId: part === "read" ? "ci-read" : part === "pitch" ? "ci-pitch" : part === "story" ? "cis01" : "ciq01", mode: part === "read" ? "read" : part === "pitch" ? "outline" : part === "story" ? "story" : "talk", retryOf: null, checkIn: { id, part } }, at);
}

// Group the checks about the plan
describe("the check-in in today's plan", () => {
  // The plan rule on its own: the check-in, then the card, about seven minutes
  it("swaps the reading and both picks for the check-in, keeping the Learn card", () => {
    // Two plans for the same day, without and with the check-in
    const input = { day: TODAY, sessions: [makeSession({ id: "monday", createdAt: MONDAY.toISOString() })], focusId: "pausing", nextTalk: null };
    // (with)
    const [usual, checkIn] = [dailyPlan(input), dailyPlan({ ...input, checkIn: { id: checkInId(TODAY), week: 1, baseline: true } })];
    // Confirm the usual four steps, then the check-in and the card at seven minutes, named as the first
    expect([usual.length, usual[1]!.label, checkIn.map((step) => step.kind), planMinutes(checkIn), checkIn[0]!.label, checkIn[0]!.href]).toEqual([4, "Warm up", ["checkin", "card"], 7, "Your first check-in", "/check-in/run"]);
  });

  // Day one never gets it, even if asked
  it("keeps day one's free talk", () => {
    // A new user, with a check-in passed in anyway
    const plan = dailyPlan({ day: TODAY, sessions: [], focusId: "pausing", nextTalk: null, checkIn: { id: checkInId(TODAY), week: 1, baseline: true } });
    // Confirm the first step is free talk and no check-in
    expect([plan[0]!.mode, plan.some((step) => step.kind === "checkin")]).toEqual(["free", false]);
  });

  // Done only when every part is done or skipped
  it("counts the check-in step done only when finished", () => {
    // The plan
    const plan = dailyPlan({ day: TODAY, sessions: [makeSession({ id: "monday", createdAt: MONDAY.toISOString() })], focusId: "pausing", nextTalk: null, checkIn: { id: checkInId(TODAY), week: 1, baseline: true } });
    // Confirm not done, then done
    expect([planProgress(plan, [], TODAY)[0], planProgress(plan, [], TODAY, {}, {}, [], true)[0]]).toEqual([false, true]);
  });

  // The loader: day two of use is the first check-in, with each part open
  it("loads the first check-in on day two", async () => {
    // Day two
    const plan = await loadDailyPlan(await dayTwo(), TODAY);
    // Confirm the steps and the check-in's state
    expect([plan.steps.map((step) => step.kind), plan.checkIn?.baseline, plan.checkIn?.week, plan.checkIn?.parts.map((part) => part.status)]).toEqual([["checkin", "card"], true, 1, ["open", "open", "open", "open"]]);
  });

  // Started and finished during the day, the plan stays the same and the step is done
  it("stays the same all day and marks the step done once finished", async () => {
    // Day two
    const repository = await dayTwo();
    // Three parts recorded and one skipped
    for (const part of ["read", "pitch", "story"] as const) await record(repository, part, new Date(2026, 9, 13, 11));
    // (skipped)
    await skipCheckInPart(repository, checkInId(TODAY), "surprise", TODAY);
    // The plan afterwards
    const plan = await loadDailyPlan(repository, new Date(2026, 9, 13, 12));
    // Confirm the same steps, the step done, and each part's state
    expect([plan.steps.map((step) => step.kind), plan.done[0], plan.checkIn?.parts.map((part) => part.status)]).toEqual([["checkin", "card"], true, ["done", "done", "done", "skipped"]]);
  });

  // A day that is not a check-in day keeps the usual plan
  it("keeps the usual plan on other days", async () => {
    // Day two, with a check-in noted on Monday
    const repository = await dayTwo();
    // (noted)
    await checkInSkippedOn(repository, MONDAY, TODAY);
    // Confirm the usual plan and no check-in
    const plan = await loadDailyPlan(repository, TODAY);
    // (checked)
    expect([plan.steps.some((step) => step.kind === "checkin"), plan.checkIn]).toEqual([false, null]);
  });
});

// Group the checks about the check-in's data
describe("check-in data", () => {
  // Saving a take: a marker, numbered, tagged, no listening step
  it("saves a check-in take as a marker with its number and part", async () => {
    // Day two
    const repository = await dayTwo();
    // The first check-in's reading, then the next week's
    const first = await record(repository, "read", TODAY);
    // (a week later)
    const second = await record(repository, "read", new Date(2026, 9, 20, 10));
    // Confirm both are markers with their numbers and part, with no listening step and feedback waiting
    expect([[first.marker, first.checkIn, "selfReview" in first, first.feedbackStatus], [second.checkIn?.week]]).toEqual([[true, { id: "ci-2026-10-13", week: 1, part: "read" }, false, "pending"], [2]]);
  });

  // Every check-in from one read, and today's schedule
  it("loads every check-in and today's schedule", async () => {
    // Day two with the reading done
    const repository = await dayTwo();
    // (done)
    await record(repository, "read", TODAY);
    // Loaded
    const data = await loadCheckIns(repository, TODAY);
    // Confirm one check-in with its reading, and that today is due
    expect([data.checkIns.length, Object.keys(data.checkIns[0]!.takes), data.schedule.due]).toEqual([1, ["read"], true]);
  });

  // Skips and the reminder are kept in the settings without touching the rest
  it("keeps skips and reminders in the settings", async () => {
    // Day two, with a choice already made
    const repository = await dayTwo();
    // A chosen day
    await repository.saveSettings({ ...(await repository.getSettings(TODAY)), checkIn: { day: 3 } });
    // Skip a part, and put the week's reminder aside
    await skipCheckInPart(repository, "ci-2026-10-13", "story", TODAY);
    // (aside)
    await markReminderSeen(repository, 7, TODAY);
    // Confirm all three are kept
    expect((await repository.getSettings(TODAY)).checkIn).toEqual({ day: 3, skipped: [{ id: "ci-2026-10-13", parts: ["story"] }], seen: [7] });
  });

  // Just the analyses asked for
  it("reads the analyses of just the takes compared", async () => {
    // Day two with two parts done (each is measured as it is saved)
    const repository = await dayTwo();
    // (done)
    const [read, pitch] = [await record(repository, "read", TODAY), await record(repository, "pitch", TODAY)];
    // Read one, and one that does not exist
    const found = await analysesFor(repository, [read.id, "missing"]);
    // Confirm only the one asked for came back
    expect([[...found.keys()], found.has(pitch.id), CHECK_IN_PARTS.length]).toEqual([[read.id], false, 4]);
  });

  // A refusing store is reported, never swallowed, so the page can say why
  it("passes on a store that refuses", async () => {
    // A repository whose settings cannot be saved
    const repository = await dayTwo();
    // (refusing)
    const refusing = { ...repository, saveSettings: async () => { throw new Error("The database connection is closing."); } };
    // Confirm the skip fails with the browser's reason
    await expect(skipCheckInPart(refusing, "ci-2026-10-13", "read", TODAY)).rejects.toThrow("The database connection is closing.");
  });
});
