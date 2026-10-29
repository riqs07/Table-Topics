// The mode's scene at the top of its start screen (decision 141): a tinted panel with the scene, carried over from the Practice card that opened it, beside the mode's name and what it is

// Load the scenes
import { Scene, type SceneName } from "@/components/scenes/Scene";
// Load the carried-over wrapper
import { SharedScene } from "@/components/scenes/SharedScene";

// Draw the panel
export function ScenePanel({ scene, name, line }: { scene: SceneName; name: string; line: string }) {
  // The scene on the left, the words on the right
  return (
    <div data-scene-panel={scene} className="mt-6 flex items-center gap-3 rounded-[26px] bg-warm-tint p-2 pr-5 md:mt-0 md:max-w-md">
      {/* The scene, playing three rounds as the screen opens, then still */}
      <SharedScene scene={scene}><span aria-hidden="true" className="flex size-32 flex-none items-center justify-center"><Scene name={scene} motion="few" className="size-32" /></span></SharedScene>
      {/* The words */}
      <p className="min-w-0">
        {/* The mode */}
        <span className="block font-display text-2xl font-semibold tracking-tight">{name}</span>
        {/* What it is */}
        <span className="block text-footnote text-ink-muted">{line}</span>
      </p>
    </div>
  );
}
