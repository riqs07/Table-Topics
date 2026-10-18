// Saves how scenario questions went, kept with the settings so it travels in exports

// Load the tier type
import type { Tier } from "@/content/scenarios";
// Load the record type
import type { ScenarioProgress } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// Every scenario's progress
export async function loadScenarioProgress(repository: Repository, now: Date): Promise<Record<string, ScenarioProgress>> {
  // From the settings, or none yet
  return (await repository.getSettings(now)).scenarios ?? {};
}

// Save an answer: the first answer is kept as the first try, the latest as the last
export async function saveScenarioAnswer(repository: Repository, scenarioId: string, tier: Tier, now: Date): Promise<Record<string, ScenarioProgress>> {
  // The settings as they are now
  const settings = await repository.getSettings(now);
  // Progress so far
  const scenarios = settings.scenarios ?? {};
  // This scenario's earlier progress
  const earlier = scenarios[scenarioId];
  // With this answer
  const next = { ...scenarios, [scenarioId]: earlier ? { ...earlier, lastTier: tier, lastAt: now.toISOString() } : { firstTier: tier, lastTier: tier, firstAt: now.toISOString(), lastAt: now.toISOString() } };
  // Save it
  await repository.saveSettings({ ...settings, scenarios: next });
  // Hand it back
  return next;
}
