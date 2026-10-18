// Scenario questions: which three to practise next, and how first tries are going (decision 54)

// Load the scenarios
import { SCENARIOS, type Scenario } from "@/content/scenarios";
// Load the record type
import type { ScenarioProgress } from "@/data/records";

// How many scenarios a quick practice holds
export const QUICK_COUNT = 3;

// The next scenarios to practise: for a move missed last time, a new situation with the same move (or the same one again if there is no other); then ones not yet seen, in order; then the rest, least recently answered first
export function nextScenarios(progress: Readonly<Record<string, ScenarioProgress>>, count = QUICK_COUNT): Scenario[] {
  // Chosen so far
  const chosen: Scenario[] = [];
  // Add one if it is not in already
  const add = (scenario: Scenario | undefined) => {
    // Skip missing or repeated
    if (scenario && !chosen.includes(scenario)) chosen.push(scenario);
  };
  // Missed last time (anything but the best reply)
  const missed = SCENARIOS.filter((scenario) => progress[scenario.id] && progress[scenario.id]!.lastTier !== "best");
  // For each, a new situation with the same move, or the same one again
  for (const scenario of missed) add(SCENARIOS.find((other) => other.move === scenario.move && !progress[other.id] && !chosen.includes(other)) ?? scenario);
  // Then the unseen ones, in order
  for (const scenario of SCENARIOS.filter((item) => !progress[item.id])) add(scenario);
  // Then the rest, least recently answered first
  for (const scenario of SCENARIOS.filter((item) => progress[item.id]).sort((a, b) => progress[a.id]!.lastAt.localeCompare(progress[b.id]!.lastAt))) add(scenario);
  // The first few
  return chosen.slice(0, count);
}

// First tries: how many scenarios have been answered, and how many with the best reply the first time
export function firstTries(progress: Readonly<Record<string, ScenarioProgress>>): { best: number; total: number } {
  // The answered ones
  const answered = Object.values(progress);
  // Best first time, out of all answered
  return { best: answered.filter((item) => item.firstTier === "best").length, total: answered.length };
}
