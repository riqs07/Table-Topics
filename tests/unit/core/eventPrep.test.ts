// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the event-prep rules being checked
import { daysUntil, eventPlan, memoryLadder, prepHeadline, runTimes, stepTasks, stepText, talkSections, taskProgress } from "@/core/eventPrep";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// A talk with an opening, a middle and a close, separated by blank lines
const THREE_PARTS = "Good evening, everyone.\nThank you for coming.\n\nWe grew from four people to forty.\n\nSo here is my ask. Join us.";

// Group the checks about splitting a talk into sections
describe("talkSections", () => {
  // Blank lines separate sections
  it("splits a talk at blank lines", () => {
    // Confirm the three sections
    expect(talkSections(THREE_PARTS)).toEqual(["Good evening, everyone.\nThank you for coming.", "We grew from four people to forty.", "So here is my ask. Join us."]);
  });

  // Several blank lines, or spaces on them, still make one break
  it("treats several blank lines, or lines of spaces, as one break", () => {
    // Confirm two sections
    expect(talkSections("One.\n \n\n\nTwo.")).toEqual(["One.", "Two."]);
  });

  // A talk with no blank lines is one section
  it("keeps a talk without blank lines as one section", () => {
    // Confirm one section
    expect(talkSections("Just one paragraph.\nOn two lines.")).toEqual(["Just one paragraph.\nOn two lines."]);
  });
});

// Group the checks about the memory ladder
describe("memoryLadder", () => {
  // Full text is unchanged
  it("shows the full text at the first rung", () => {
    // Confirm the same text
    expect(memoryLadder(THREE_PARTS, "full")).toBe(THREE_PARTS);
  });

  // Keywords: the first two words of each sentence, keeping lines and sections
  it("keeps the first two words of each sentence at the keyword rung", () => {
    // Confirm the cue words
    expect(memoryLadder(THREE_PARTS, "keywords")).toBe("Good evening, …\nThank you …\n\nWe grew …\n\nSo here … Join us.");
  });

  // Words the speaker marked with stars stay as cues too
  it("keeps marked words at the keyword rung", () => {
    // Confirm the marked word is kept
    expect(memoryLadder("We cut costs by *thirty percent* last year.", "keywords")).toBe("We cut … *thirty percent* …");
  });

  // Nothing at the last rung
  it("shows nothing at the last rung", () => {
    // Confirm empty
    expect(memoryLadder(THREE_PARTS, "none")).toBe("");
  });
});

// Group the checks about counting days to the talk
describe("daysUntil", () => {
  // Calendar days, ignoring the time of day
  it("counts calendar days from today to the date", () => {
    // Confirm a week ahead, late in the evening
    expect(daysUntil("2026-10-22", new Date(2026, 9, 15, 23))).toBe(7);
  });

  // The day of the talk is zero, and a past date is negative
  it("gives zero on the day and a negative number afterwards", () => {
    // Confirm both
    expect([daysUntil("2026-10-15", new Date(2026, 9, 15, 9)), daysUntil("2026-10-14", new Date(2026, 9, 15, 9))]).toEqual([0, -1]);
  });
});

// Group the checks about the countdown plan
describe("eventPlan", () => {
  // The kinds of step, day by day from today
  const kinds = (daysLeft: number) => eventPlan(daysLeft)?.map((step) => step.kind);

  // A past date has no plan
  it("has no plan for a past date", () => {
    // Confirm nothing
    expect(eventPlan(-1)).toBeNull();
  });

  // On the day: a warm-up and one light run
  it("is a warm-up on the day", () => {
    // Confirm the single step
    expect(kinds(0)).toEqual(["warmup"]);
  });

  // The day before: a full rehearsal, then the warm-up
  it("is a full rehearsal the day before", () => {
    // Confirm both days
    expect(kinds(1)).toEqual(["dress", "warmup"]);
  });

  // With little time, the plan compresses
  it("compresses when there are only a few days", () => {
    // Confirm the short plans
    expect([kinds(2), kinds(3), kinds(4), kinds(5)]).toEqual([
      ["run", "dress", "warmup"],
      ["opening-close", "keywords", "dress", "warmup"],
      ["sections", "run", "memory", "dress", "warmup"],
      ["sections", "opening-close", "run", "memory", "dress", "warmup"],
    ]);
  });

  // A week out: every phase in order, then the full rehearsal and the warm-up
  it("goes through every phase in order a week out", () => {
    // Confirm the week
    expect(kinds(7)).toEqual(["sections", "sections", "opening-close", "run", "keywords", "memory", "dress", "warmup"]);
  });

  // Phases never go backwards, however long the plan
  it("keeps the phases in order for a month", () => {
    // The order of phases
    const order = ["sections", "opening-close", "run", "keywords", "memory", "dress", "warmup"];
    // The month's plan as phase positions
    const positions = (kinds(30) ?? []).map((kind) => order.indexOf(kind));
    // Confirm 31 days, never stepping back
    expect([positions.length, positions.every((position, index) => index === 0 || position >= (positions[index - 1] ?? 0))]).toEqual([31, true]);
  });

  // More than 30 days out: no full plan yet
  it("offers open practice more than 30 days out", () => {
    // Confirm the single step
    expect(kinds(31)).toEqual(["early"]);
  });
});

// Group the checks about what to do today
describe("stepTasks", () => {
  // Section practice: each section once, with the text
  it("practises each section once on a sections day", () => {
    // Confirm one task per section
    expect(stepTasks({ kind: "sections" }, 3)).toEqual([
      { sectionIndex: 0, ladder: "full", times: 1, label: "Section 1" },
      { sectionIndex: 1, ladder: "full", times: 1, label: "Section 2" },
      { sectionIndex: 2, ladder: "full", times: 1, label: "Section 3" },
    ]);
  });

  // Openings and closes: the first and last sections twice each
  it("practises the opening and the close twice each", () => {
    // Confirm the two tasks
    expect(stepTasks({ kind: "opening-close" }, 3)).toEqual([
      { sectionIndex: 0, ladder: "full", times: 2, label: "The opening" },
      { sectionIndex: 2, ladder: "full", times: 2, label: "The close" },
    ]);
  });

  // A one-section talk has no separate opening and close
  it("runs a one-section talk twice instead of opening and close", () => {
    // Confirm the whole talk twice
    expect(stepTasks({ kind: "opening-close" }, 1)).toEqual([{ sectionIndex: null, ladder: "full", times: 2, label: "The whole talk" }]);
  });

  // Whole runs move down the memory ladder
  it("moves whole runs down the memory ladder", () => {
    // Confirm the rung for each kind of run
    expect(["run", "keywords", "memory", "dress", "warmup", "early"].map((kind) => stepTasks({ kind } as Parameters<typeof stepTasks>[0], 3)[0]?.ladder)).toEqual(["full", "keywords", "none", "none", "keywords", "full"]);
  });
});

// Group the checks about progress on today's tasks
describe("taskProgress", () => {
  // Rehearsals of a section count for that section; whole runs count for the whole talk
  it("counts today's rehearsals against each task", () => {
    // Today's rehearsals: the opening twice and one whole run
    const today = [makeSession({ mode: "rehearse", sectionIndex: 0 }), makeSession({ mode: "rehearse", sectionIndex: 0 }), makeSession({ mode: "rehearse", sectionIndex: null })];
    // Confirm the counts, never past what was asked
    expect(taskProgress(stepTasks({ kind: "opening-close" }, 3), today)).toEqual([2, 0]);
    // Confirm the whole run counts for a run day
    expect(taskProgress(stepTasks({ kind: "run" }, 3), today)).toEqual([1]);
  });

  // Sessions from before sections existed are whole runs
  it("counts a rehearsal without a section as a whole run", () => {
    // Confirm it counts
    expect(taskProgress(stepTasks({ kind: "run" }, 3), [makeSession({ mode: "rehearse" })])).toEqual([1]);
  });
});

// Group the checks about the sentence on the home screen
describe("prepHeadline", () => {
  // Days to go and today's step
  it("says how long is left and what to do today", () => {
    // Confirm a week out
    expect(prepHeadline(7, { kind: "sections" })).toBe("Your talk is in 7 days. Today: rehearse each section once, with the text.");
    // Confirm the day before
    expect(prepHeadline(1, { kind: "dress" })).toBe("Your talk is tomorrow. Today: a full rehearsal, from memory, timed.");
    // Confirm the day itself
    expect(prepHeadline(0, { kind: "warmup" })).toBe("Your talk is today. Warm up with the tongue twisters, then one easy run from keywords.");
  });
});

// Group the checks about the list of coming days
describe("stepText", () => {
  // Each later day as its own sentence
  it("writes a later day as a sentence, and names the day of the talk", () => {
    // Confirm two kinds
    expect([stepText("keywords"), stepText("warmup")]).toEqual(["One whole run from keywords only.", "The day of the talk: warm up, then one easy run from keywords."]);
  });
});

// Group the checks about run times
describe("runTimes", () => {
  // Whole runs only, oldest first, in seconds
  it("lists the length of each whole run, oldest first", () => {
    // Two whole runs and one section run
    const sessions = [
      makeSession({ id: "b", mode: "rehearse", promptId: "talk1", createdAt: "2026-10-14T10:00:00.000Z", durationSec: 302 }),
      makeSession({ id: "a", mode: "rehearse", promptId: "talk1", createdAt: "2026-10-12T10:00:00.000Z", durationSec: 341 }),
      makeSession({ id: "c", mode: "rehearse", promptId: "talk1", sectionIndex: 1, durationSec: 60 }),
      makeSession({ id: "d", mode: "rehearse", promptId: "talk2", durationSec: 90 }),
    ];
    // Confirm the two runs of talk 1
    expect(runTimes(sessions, "talk1")).toEqual([
      { id: "a", createdAt: "2026-10-12T10:00:00.000Z", seconds: 341 },
      { id: "b", createdAt: "2026-10-14T10:00:00.000Z", seconds: 302 },
    ]);
  });
});
