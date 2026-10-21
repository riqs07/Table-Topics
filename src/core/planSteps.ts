// One step of today's practice and the small rules about steps (keys, addresses, the next one, the time), kept apart from the plan itself so pages that only link between steps do not load the content the plan is worked out from (decision 88)

// Load the kind-of-session type
import type { SessionMode } from "@/data/records";

// Where a step of the day's practice comes from: the Learn card, the warm-up, one of the bank's three groups (speaking on the spot, delivery skills, conversation), or the weekly check-in (decision 100)
export type PlanLane = "learn" | "warmup" | "spot" | "delivery" | "connection" | "checkin";

// One step of today's practice
export interface PlanStep {
  // Its lane
  lane: PlanLane;
  // A recorded session, a Learn card, a round of quick scenarios (decision 72), a warm-up routine, which records nothing (decision 80), or the weekly check-in, four recordings in a row (decision 100)
  kind: "session" | "card" | "scenarios" | "warmup" | "checkin";
  // The step's short name, such as "Warm up"
  label: string;
  // What it is, such as "Inaugural Address, part 3 of 12"
  title: string;
  // The kind of session it records (none for a card)
  mode: SessionMode | null;
  // The prompt, text, lesson or talk it uses
  promptId: string;
  // Speaking time in minutes, for the total
  minutes: number;
  // Where it starts (without the plan marker)
  href: string;
}

// A step's key, the same all day: its kind, its kind of session and what it uses
export function stepKey(step: PlanStep): string {
  // Joined with colons
  return `${step.kind}:${step.mode ?? ""}:${step.promptId}`;
}

// The next step to offer: the first neither done nor put off today (-1 when none is left)
export function nextStepIndex(done: ReadonlyArray<boolean>, skipped: ReadonlyArray<boolean>): number {
  // The first open one
  return done.findIndex((isDone, index) => !isDone && !skipped[index]);
}

// The plan's total: the steps' own minutes added up, so the total always matches the steps listed under it (it once doubled speaking steps for listening back, and four 1-minute steps read "about 7 min"; decision 89)
export function planMinutes(plan: ReadonlyArray<PlanStep>): number {
  // Each step's minutes, added up
  return plan.reduce((total, step) => total + step.minutes, 0);
}

// A step's address inside the plan (numbered from 1), so the pages after it know which step comes next
export function planHref(step: PlanStep, number: number): string {
  // The step's own address with the plan marker (after a ? when the address has no query yet)
  return `${step.href}${step.href.includes("?") ? "&" : "?"}plan=${number}`;
}
