// Scenes (decision 149): how warm the other person is after your choices, how a scene ends, and which scene comes next

// Load the scenes
import { SCENES, type Scene } from "@/content/scenes";
// Load the reply tier type
import type { Tier } from "@/content/scenarios";
// Load the spoken-reply checks
import { mostPassed, replyChecks, type ReplyCheck } from "@/core/replyChecks";
// Load the record type
import type { SceneProgress } from "@/data/records";

// How much each tier warms them up: the best reply most, a misstep cools them
export const WARMTH: Readonly<Record<Tier, number>> = { best: 2, good: 1, flat: 0, misstep: -1 };

// How the other person looks: pleased, at ease, or deflated
export type SceneMood = "pleased" | "easy" | "deflated";

// The warmth at which they look pleased
const PLEASED_FROM = 2;

// The warmth from a list of choices
export function sceneWarmth(tiers: ReadonlyArray<Tier>): number {
  // Each choice's warmth, added up
  return tiers.reduce((total, tier) => total + WARMTH[tier], 0);
}

// How they look at a warmth: pleased from two, deflated below zero, at ease between
export function moodFor(warmth: number): SceneMood {
  // By the warmth
  return warmth >= PLEASED_FROM ? "pleased" : warmth < 0 ? "deflated" : "easy";
}

// How a scene went
export interface SceneResult {
  // The tier of each choice, in order
  tiers: Tier[];
  // The warmth the choices left
  warmth: number;
  // The spoken turn's checks
  checks: ReplyCheck[];
  // Whether they close warmly: most checks passed
  warm: boolean;
  // How they look at the end: pleased after a warm closing, otherwise as the choices left them (never above at ease)
  mood: SceneMood;
}

// How a scene went, from the two choices and what was said in the spoken turn
export function sceneResult(scene: Scene, tiers: ReadonlyArray<Tier>, transcript: string): SceneResult {
  // The spoken turn checked against their last line
  const checks = replyChecks(scene.final.checks, transcript, scene.prompt.text);
  // The warmth from the choices
  const warmth = sceneWarmth(tiers);
  // A warm closing when most checks passed
  const warm = mostPassed(checks);
  // Pleased after a warm closing; otherwise the choices' mood, capped at ease
  const mood: SceneMood = warm ? "pleased" : moodFor(Math.min(warmth, PLEASED_FROM - 1));
  // Together
  return { tiers: [...tiers], warmth, checks, warm, mood };
}

// The next scene to play: the first not played yet, in order, then the one played longest ago
export function nextScene(progress: Readonly<Record<string, SceneProgress>>, scenes: ReadonlyArray<Scene> = SCENES): Scene {
  // The first not played
  const fresh = scenes.find((scene) => !progress[scene.id]);
  // That one, or the one played longest ago (a damaged entry without a time counts as oldest)
  return fresh ?? [...scenes].sort((a, b) => String(progress[a.id]?.lastAt ?? "").localeCompare(String(progress[b.id]?.lastAt ?? "")))[0]!;
}

// The scene after a given one, in order, wrapping round (for "Next scene" on the result)
export function sceneAfter(id: string, scenes: ReadonlyArray<Scene> = SCENES): Scene {
  // Its place
  const index = scenes.findIndex((scene) => scene.id === id);
  // The next, wrapping
  return scenes[(index + 1) % scenes.length]!;
}

// A scene's address
export function sceneHref(id: string): string {
  // The play page with the scene
  return `/scenes/play?id=${id}`;
}
