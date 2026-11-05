// Which mode tile stands for each kind of practice (UI rewrite): a ground, a prop and the blob's face, chosen so neighbouring cards differ

// Load the scene names (each kind of practice already has one)
import type { FaceName, SceneName } from "@/components/scenes/Scene";
// Load the tile's parts
import type { TileGround, TileProp } from "@/components/scenes/ModeTile";
// Load the step type
import type { PlanStep } from "@/core/planSteps";
// Load the scene for a step
import { stepScene } from "@/components/scenes/sceneFor";

// One mode tile's look
export interface ModeTileLook {
  // The ground colour
  ground: TileGround;
  // The prop that tells the idea
  prop: TileProp;
  // The blob's face
  face: FaceName;
}

// Each kind of practice's tile
export const SCENE_TILES: Readonly<Record<SceneName, ModeTileLook>> = {
  // A surprise question
  "rapid-fire": { ground: "sky", prop: "bolt", face: "wow" },
  // Plan, then speak
  "prepared-speech": { ground: "plum", prop: "three", face: "ready" },
  // Read a passage
  "read-aloud": { ground: "leaf", prop: "book", face: "sing" },
  // The same story three times, shorter each time
  "four-three-two": { ground: "sun", prop: "loop", face: "ready" },
  // Talk about anything
  "free-talk": { ground: "sun", prop: "mic", face: "sing" },
  // A short speech
  "short-speech": { ground: "plum", prop: "flag", face: "ready" },
  // A talk coming up
  "your-talk": { ground: "coral", prop: "flag", face: "ready" },
  // A story
  story: { ground: "coral", prop: "fire", face: "happy" },
  // Tell it again
  "tell-again": { ground: "coral", prop: "loop", face: "happy" },
  // Guided stories
  "guided-stories": { ground: "coral", prop: "book", face: "happy" },
  // A moment from your day
  moment: { ground: "sun", prop: "star", face: "happy" },
  // Conversations and small talk
  conversation: { ground: "bloom", prop: "chat", face: "ready" },
  // The voice warm-up
  "warm-up": { ground: "leaf", prop: "waves", face: "sing" },
  // A Learn card
  learn: { ground: "plum", prop: "star", face: "wonder" },
  // Scenes: choose a reply
  scenes: { ground: "plum", prop: "door", face: "wonder" },
  // Active listening
  listening: { ground: "sky", prop: "ear", face: "ready" },
  // Who I am
  "who-i-am": { ground: "sun", prop: "star", face: "happy" },
  // An interview story
  interview: { ground: "sky", prop: "q", face: "ready" },
  // A toast
  toast: { ground: "sun", prop: "glass", face: "happy" },
  // A choice that mattered
  choice: { ground: "leaf", prop: "flag", face: "wonder" },
  // Story dice
  "story-dice": { ground: "bloom", prop: "three", face: "wow" },
};

// A step's tile: its kind's, or for a course part a bullseye and for the check-in a calendar
export function stepTile(step: Pick<PlanStep, "kind" | "label" | "mode">): ModeTileLook {
  // The weekly check-in
  if (step.kind === "checkin") return { ground: "sun", prop: "cal", face: "ready" };
  // A course part
  if (step.kind === "course") return { ground: "sky", prop: "target", face: "ready" };
  // Its kind's scene, when it has one
  const scene = stepScene(step);
  // That scene's tile, or a microphone
  return scene ? SCENE_TILES[scene] : { ground: "sky", prop: "mic", face: "ready" };
}
