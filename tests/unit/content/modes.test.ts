// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the mode catalogue being checked
import { JOBS, MODES, modeForSession } from "@/content/modes";
// Load the list of session kinds
import { SESSION_MODES } from "@/data/records";

// Group the checks about the catalogue of ways to practise
describe("mode catalogue", () => {
  // Every mode says what it is for, how long it takes, and what you get afterwards
  it("describes every mode in plain words", () => {
    // Check each one
    for (const mode of MODES) expect([mode.name.length > 0, mode.subtitle.length > 0 && mode.subtitle.length <= 40, mode.length.length > 0, /\.$/.test(mode.youDo), /\.$/.test(mode.youGet)]).toEqual([true, true, true, true, true]);
  });

  // The jobs, each with at least one mode, in a fixed order
  it("groups the modes into the jobs", () => {
    // Confirm the jobs and their modes
    expect(JOBS.map((job) => [job.id, MODES.filter((mode) => mode.job === job.id).map((mode) => mode.id)])).toEqual([
      ["talk", ["talks"]],
      ["spot", ["table-topic", "prepared", "openings", "qa"]],
      ["skill", ["lessons", "readings", "pause-drills", "tricky-words"]],
      ["connect", ["small-talk", "moments"]],
    ]);
  });

  // Plain names: no internal words reach the user
  it("uses plain names, never internal ones", () => {
    // Every visible word
    const visible = MODES.map((mode) => `${mode.name} ${mode.subtitle} ${mode.youDo} ${mode.youGet}`).join(" ");
    // Confirm no internal names
    expect(/bookend|Record Response|\bqa\b/.test(visible)).toBe(false);
  });

  // Every kind of session that can still be recorded has a "how this works" entry
  it("explains every kind of session that can still be recorded", () => {
    // The retired kinds have none
    const live = SESSION_MODES.filter((mode) => mode !== "standard" && mode !== "warmup");
    // Confirm each has one
    expect(live.map((mode) => [mode, Boolean(modeForSession(mode))])).toEqual(live.map((mode) => [mode, true]));
  });
});
