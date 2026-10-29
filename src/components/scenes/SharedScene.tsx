// A scene that carries over between pages (decision 141): wrapped in React's view transition with a name for its scene, so a Practice card's scene glides into the same scene on the screen it opens. Browsers without view transitions simply change page; only one element on a page may carry a given name, so only places where each scene appears once use it

// Load React's view transition
import { ViewTransition, type ReactNode } from "react";
// Load the scene names
import type { SceneName } from "@/components/scenes/Scene";

// The transition name for a scene
export function sceneTransitionName(scene: SceneName): string {
  // One per scene
  return `scene-${scene}`;
}

// Wrap a scene so it morphs into the same scene on the next page
export function SharedScene({ scene, children }: { scene: SceneName; children: ReactNode }) {
  // A named morph, and nothing on unrelated transitions
  return <ViewTransition name={sceneTransitionName(scene)} share="vl-scene-morph" default="none">{children}</ViewTransition>;
}
