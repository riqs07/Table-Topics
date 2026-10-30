// Which blob scene stands for a thing elsewhere in the app (decision 137): a focus area at the welcome, and a step of today's practice. Steps whose kind has no scene yet (lessons, pause and voice drills, the check-in) get none and keep their number; a Learn card has the light bulb (decision 139)

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

// The stories you'll need as Today steps, by their names, and their scenes (decision 154)
const NEEDED_STEP_SCENES: Readonly<Record<string, SceneName>> = { "Who I am": "who-i-am", "Interview answer": "interview", Toast: "toast", "A choice I made": "choice" };

// A step's scene, or none: the voice warm-up, quick scenarios, scenes and stories by their kind, a guided story by its label, otherwise by the kind of session it records
export function stepScene(step: Pick<PlanStep, "kind" | "label" | "mode">): SceneName | null {
  // The warm-up routine, which records nothing
  if (step.kind === "warmup") return "warm-up";
  // A round of quick scenarios: a conversation
  if (step.kind === "scenarios") return "conversation";
  // A scene and an Active listening story: their own drawings (decisions 149 and 150)
  if (step.kind === "scene") return "scenes";
  // (the story)
  if (step.kind === "listening") return "listening";
  // A Learn card: the light bulb (decision 139)
  if (step.kind === "card") return "learn";
  // The check-in has none yet
  if (step.kind === "checkin") return null;
  // A story you'll need: its own scene, by its name (decision 154)
  if (step.mode === "story" && NEEDED_STEP_SCENES[step.label]) return NEEDED_STEP_SCENES[step.label]!;
  // A story: the signpost when guided, the campfire otherwise
  if (step.mode === "story") return step.label === "Guided story" ? "guided-stories" : "story";
  // Otherwise by its kind of session (a course part too), if that has one
  return step.mode ? MODE_SCENES[step.mode] ?? null : null;
}

// The scene for a story's setup screen (decisions 152 and 153): Story dice for a "Connect these", a kind's own scene for a story you'll need (or a guided story that asks for one), the signpost for other guided stories, the campfire otherwise
export function storyScene(story: { neededTemplate: string | null; guidedLevel: string | null }): SceneName {
  // A story you'll need, or a "Make it a…" guided story: its kind's scene
  if (story.neededTemplate && NEEDED_TEMPLATE_SCENES[story.neededTemplate]) return NEEDED_TEMPLATE_SCENES[story.neededTemplate]!;
  // Story dice
  if (story.guidedLevel === "connect") return "story-dice";
  // Another guided story, or an open one
  return story.guidedLevel ? "guided-stories" : "story";
}

// The stories you'll need by template, and their scenes
const NEEDED_TEMPLATE_SCENES: Readonly<Record<string, SceneName>> = { "who-i-am": "who-i-am", interview: "interview", toast: "toast", choice: "choice" };
