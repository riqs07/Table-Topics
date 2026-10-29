// Which blob scene stands for a thing elsewhere in the app (decision 137): a focus area at the welcome, and a step of today's practice. Steps whose kind has no scene yet (lessons, pause and voice drills, Learn cards, the check-in) get none and keep their plain row

// Load the scene names
import type { SceneName } from "@/components/scenes/Scene";
// Load the focus area ids
import type { FocusAreaId } from "@/core/practiceFocus";
// Load the step type
import type { PlanStep } from "@/core/planSteps";
// Load the kind-of-session type
import type { SessionMode } from "@/data/records";

// Each focus area's scene: the kind of practice it leads with
export const FOCUS_SCENES: Readonly<Record<FocusAreaId, SceneName>> = {
  // Telling stories: by the campfire
  stories: "story",
  // Small talk and conversations: two blobs chatting
  conversation: "conversation",
  // Thinking on my feet: Rapid Fire
  spot: "rapid-fire",
  // How I sound: the warm-up
  voice: "warm-up",
  // Speaking at work: points on a card
  work: "short-speech",
  // A talk coming up: at the lectern
  talk: "your-talk",
};

// The kinds of session that have a scene, and which
const MODE_SCENES: Partial<Record<SessionMode, SceneName>> = {
  // Rapid Fire
  talk: "rapid-fire",
  // A prepared speech
  response: "prepared-speech",
  // Reading aloud, the warm-up passage too
  read: "read-aloud",
  // Free talk
  free: "free-talk",
  // Rehearsing your own talk
  rehearse: "your-talk",
  // A small-talk lesson
  smalltalk: "conversation",
  // A moment worth telling
  moment: "moment",
};

// A step's scene, or none: the voice warm-up and quick scenarios by their kind, a guided story by its label, otherwise by the kind of session it records
export function stepScene(step: Pick<PlanStep, "kind" | "label" | "mode">): SceneName | null {
  // The warm-up routine, which records nothing
  if (step.kind === "warmup") return "warm-up";
  // A round of quick scenarios: a conversation
  if (step.kind === "scenarios") return "conversation";
  // Learn cards and the check-in have none yet
  if (step.kind === "card" || step.kind === "checkin") return null;
  // A story: the signpost when guided, the campfire otherwise
  if (step.mode === "story") return step.label === "Guided story" ? "guided-stories" : "story";
  // Otherwise by its kind of session (a course part too), if that has one
  return step.mode ? MODE_SCENES[step.mode] ?? null : null;
}
