// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { FOCUS_SCENES, stepScene } from "@/components/scenes/sceneFor";
// Load the focus areas
import { FOCUS_AREAS } from "@/core/practiceFocus";
// Load the step type
import type { PlanStep } from "@/core/planSteps";

// A step of a kind, label and session kind
const step = (kind: PlanStep["kind"], mode: PlanStep["mode"], label = "Step"): Pick<PlanStep, "kind" | "label" | "mode"> => ({ kind, mode, label });

// Group the checks about which scene stands for what (decision 137)
describe("sceneFor", () => {
  // Every focus area has a scene
  it("gives every focus area a scene", () => {
    // Confirm each area has one
    expect(FOCUS_AREAS.map((area) => typeof FOCUS_SCENES[area.id])).toEqual(FOCUS_AREAS.map(() => "string"));
  });

  // Steps take their scene from their kind, a guided story from its label, else from what they record
  it("picks each step's scene", () => {
    // Confirm a spread of steps
    expect([
      stepScene(step("session", "talk")),
      stepScene(step("session", "response")),
      stepScene(step("session", "read", "Warm up")),
      stepScene(step("session", "story", "Story")),
      stepScene(step("session", "story", "Guided story")),
      stepScene(step("session", "free")),
      stepScene(step("session", "smalltalk")),
      stepScene(step("warmup", "voice")),
      stepScene(step("scenarios", null)),
      stepScene(step("course", "talk")),
      stepScene(step("card", null, "Learn")),
    ]).toEqual(["rapid-fire", "prepared-speech", "read-aloud", "story", "guided-stories", "free-talk", "conversation", "warm-up", "conversation", "rapid-fire", "learn"]);
  });

  // Kinds with no scene yet keep their number
  it("gives none to lessons, drills and the check-in", () => {
    // Confirm each
    expect([stepScene(step("session", "lesson")), stepScene(step("session", "pause")), stepScene(step("session", "voice")), stepScene(step("checkin", null)), stepScene(step("session", null))]).toEqual([null, null, null, null, null]);
  });
});
