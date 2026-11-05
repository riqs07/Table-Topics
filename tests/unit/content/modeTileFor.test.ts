// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { SCENE_TILES, stepTile } from "@/components/scenes/modeTileFor";

// Group the checks about which mode tile stands for a kind of practice (the UI rewrite)
describe("modeTileFor", () => {
  // The check-in, a course part, a Learn card and a Rapid Fire step each get their own picture
  it("gives each kind of step its tile", () => {
    // The tiles' props for four kinds of step
    const props = [
      stepTile({ kind: "checkin", label: "Weekly check-in", mode: null }).prop,
      stepTile({ kind: "course", label: "Course", mode: null }).prop,
      stepTile({ kind: "card", label: "Learn", mode: null }).prop,
      stepTile({ kind: "session", label: "Rapid Fire", mode: "talk" }).prop,
    ];
    // Confirm a calendar, a bullseye, Learn's star and Rapid Fire's bolt
    expect(props).toEqual(["cal", "target", "star", "bolt"]);
  });

  // The five main ways on Practice sit side by side, so no two share a ground colour
  it("gives the five main ways different grounds", () => {
    // Their grounds
    const grounds = (["rapid-fire", "prepared-speech", "story", "conversation", "read-aloud"] as const).map((scene) => SCENE_TILES[scene].ground);
    // Confirm all different
    expect(new Set(grounds).size).toBe(5);
  });
});
