// Saves how Scenes and Active listening went (decisions 149 and 150), kept with the settings so it travels in exports; neither mode saves a session or audio

// Load the record types
import type { ListenProgress, SceneProgress } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// Every scene's progress
export async function loadSceneProgress(repository: Repository, now: Date): Promise<Record<string, SceneProgress>> {
  // From the settings, or none yet
  return (await repository.getSettings(now)).scenes ?? {};
}

// Every story's progress
export async function loadListenProgress(repository: Repository, now: Date): Promise<Record<string, ListenProgress>> {
  // From the settings, or none yet
  return (await repository.getSettings(now)).listening ?? {};
}

// Save a finished scene: one more play, its warmth and checks, the best warmth kept
export async function saveSceneResult(repository: Repository, sceneId: string, result: { warmth: number; passed: number; checkCount: number }, now: Date): Promise<Record<string, SceneProgress>> {
  // The settings as they are now (read fresh, so nothing saved meanwhile is written over)
  const settings = await repository.getSettings(now);
  // Progress so far
  const scenes = settings.scenes ?? {};
  // This scene's earlier progress
  const earlier = scenes[sceneId];
  // The time
  const at = now.toISOString();
  // With this play
  const next = { ...scenes, [sceneId]: { plays: (earlier?.plays ?? 0) + 1, firstAt: earlier?.firstAt ?? at, lastAt: at, lastWarmth: result.warmth, bestWarmth: Math.max(earlier?.bestWarmth ?? result.warmth, result.warmth), lastPassed: result.passed, checkCount: result.checkCount } };
  // Save it
  await repository.saveSettings({ ...settings, scenes: next });
  // Hand it back
  return next;
}

// Save an answered story: one more play, the details caught, the most kept
export async function saveListenResult(repository: Repository, storyId: string, result: { caught: number; detailCount: number; core: boolean }, now: Date): Promise<Record<string, ListenProgress>> {
  // The settings as they are now
  const settings = await repository.getSettings(now);
  // Progress so far
  const listening = settings.listening ?? {};
  // This story's earlier progress
  const earlier = listening[storyId];
  // The time
  const at = now.toISOString();
  // With this answer
  const next = { ...listening, [storyId]: { plays: (earlier?.plays ?? 0) + 1, firstAt: earlier?.firstAt ?? at, lastAt: at, lastCaught: result.caught, bestCaught: Math.max(earlier?.bestCaught ?? result.caught, result.caught), detailCount: result.detailCount, lastCore: result.core } };
  // Save it
  await repository.saveSettings({ ...settings, listening: next });
  // Hand it back
  return next;
}
