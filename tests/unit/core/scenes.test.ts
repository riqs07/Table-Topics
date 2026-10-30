// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { moodFor, nextScene, sceneAfter, sceneResult, sceneWarmth } from "@/core/scenes";
// Load the scenes
import { SCENES, findScene, sceneLines } from "@/content/scenes";
// Load the people, to check each scene's person exists
import { findPersona } from "@/content/conversations";
// Load the record type
import type { SceneProgress } from "@/data/records";

// A progress entry last played at a time
const played = (lastAt: string): SceneProgress => ({ plays: 1, firstAt: lastAt, lastAt, lastWarmth: 0, bestWarmth: 0, lastPassed: 0, checkCount: 3 });

// Group the checks about the scenes as written (decision 149)
describe("SCENES", () => {
  // Unique ids, a real person, three replies per choice with exactly one best, the best not always in the same place
  it("has well-formed scenes", () => {
    // The ids
    const ids = SCENES.map((scene) => scene.id);
    // Where the best reply sits in every choice
    const places = SCENES.flatMap((scene) => [scene.first, scene.second].map((options) => options.findIndex((option) => option.tier === "best")));
    // Confirm each rule
    expect([new Set(ids).size === ids.length, SCENES.every((scene) => findPersona(scene.personaId) !== undefined), SCENES.every((scene) => [scene.first, scene.second].every((options) => options.length === 3 && options.filter((option) => option.tier === "best").length === 1)), new Set(places).size > 1, SCENES.length]).toEqual([true, true, true, true, 8]);
  });

  // Two scenes for each of the four people
  it("gives each person two scenes", () => {
    // How many each person has
    const counts = SCENES.reduce<Record<string, number>>((all, scene) => ({ ...all, [scene.personaId]: (all[scene.personaId] ?? 0) + 1 }), {});
    // Confirm two each
    expect(counts).toEqual({ priya: 2, chris: 2, maya: 2, theo: 2 });
  });

  // Every line has a unique id, words and a delivery tag; no tag in the words
  it("gives every line a unique id, words and a tag", () => {
    // Every line
    const lines = SCENES.flatMap(sceneLines);
    // Confirm unique ids, eleven a scene, tags in brackets and none left in the words
    expect([new Set(lines.map((line) => line.id)).size, lines.length, lines.every((line) => /^\[[^\]]+\]$/.test(line.tag) && line.text.length > 0 && !line.text.includes("["))]).toEqual([lines.length, SCENES.length * 11, true]);
  });

  // Each scene's own example reply passes every spoken check, so the checks can be met and the example teaches them
  it("has an example reply that passes every check", () => {
    // Scenes whose example fails a check, and which
    const failing = SCENES.flatMap((scene) => sceneResult(scene, ["best", "best"], scene.example).checks.filter((check) => !check.passed).map((check) => `${scene.id}: ${check.id}`));
    // Confirm none
    expect(failing).toEqual([]);
  });

  // Finding a scene by id
  it("finds a scene by id", () => {
    // A real id and a missing one
    expect([findScene("sn-lisbon")?.title, findScene("nope")]).toEqual(["The Lisbon offer", undefined]);
  });
});

// Group the checks about warmth and mood
describe("warmth", () => {
  // Best adds two, good one, flat nothing, a misstep takes one away; the mood follows
  it("adds up the choices and turns warmth into a mood", () => {
    // Two bests, a best and a misstep, a misstep and a flat, nothing
    expect([sceneWarmth(["best", "best"]), sceneWarmth(["best", "misstep"]), sceneWarmth(["misstep", "flat"]), sceneWarmth([])]).toEqual([4, 1, -1, 0]);
    // Moods at the edges
    expect([moodFor(2), moodFor(1), moodFor(0), moodFor(-1)]).toEqual(["pleased", "easy", "easy", "deflated"]);
  });
});

// Group the checks about how a scene ends
describe("sceneResult", () => {
  // A good spoken turn closes warmly and pleased, even after missteps; a poor one closes flat, its mood capped at ease
  it("closes warmly on a good spoken turn and flat on a poor one", () => {
    // The long week
    const scene = findScene("sn-long-week")!;
    // Two missteps, then a good reply
    const recovered = sceneResult(scene, ["misstep", "misstep"], "Every week it never calms down? That sounds exhausting. How are you holding up?");
    // Two bests, then advice
    const advised = sceneResult(scene, ["best", "best"], "You should just quit.");
    // Two missteps, then silence
    const silent = sceneResult(scene, ["misstep", "misstep"], "");
    // Confirm the closings and moods
    expect([[recovered.warm, recovered.mood, recovered.warmth], [advised.warm, advised.mood, advised.warmth], [silent.warm, silent.mood]]).toEqual([[true, "pleased", -2], [false, "easy", 4], [false, "deflated"]]);
  });
});

// Group the checks about which scene comes next
describe("nextScene", () => {
  // The first not played, then the one played longest ago; a damaged entry without a time counts as oldest
  it("offers the first unplayed, then the oldest played", () => {
    // Nothing played: the first
    const first = nextScene({});
    // The first played: the second
    const second = nextScene({ [SCENES[0]!.id]: played("2026-10-30T10:00:00Z") });
    // All played, the third longest ago
    const all = Object.fromEntries(SCENES.map((scene, index) => [scene.id, played(index === 2 ? "2026-10-01T10:00:00Z" : "2026-10-29T10:00:00Z")]));
    // All played, one damaged
    const damaged = { ...all, [SCENES[5]!.id]: { plays: 1 } as unknown as SceneProgress };
    // Confirm each
    expect([first.id, second.id, nextScene(all).id, nextScene(damaged).id]).toEqual([SCENES[0]!.id, SCENES[1]!.id, SCENES[2]!.id, SCENES[5]!.id]);
  });

  // The scene after another, wrapping round at the end
  it("finds the scene after another, wrapping round", () => {
    // After the first, after the last
    expect([sceneAfter(SCENES[0]!.id).id, sceneAfter(SCENES.at(-1)!.id).id]).toEqual([SCENES[1]!.id, SCENES[0]!.id]);
  });
});
