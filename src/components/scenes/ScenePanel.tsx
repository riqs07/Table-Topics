// The mode's scene at the top of the screen a Practice card opens (decision 141): a tinted panel with the scene, carried over from the card, beside the mode's name (left out where the page's own title already says it) and a short line

// Load the scenes
import { Scene, type SceneName } from "@/components/scenes/Scene";
// Load the carried-over wrapper
import { SharedScene } from "@/components/scenes/SharedScene";

// Draw the panel
export function ScenePanel({ scene, name, line, className = "mt-6 md:mt-0" }: { scene: SceneName; name?: string; line: string; className?: string }) {
  // The scene on the left, the words on the right
  return (
    <div data-scene-panel={scene} className={`flex items-center gap-3 rounded-[26px] bg-warm-tint p-2 pr-5 md:max-w-md ${className}`}>
      {/* The scene, playing three rounds as the screen opens, then still */}
      <SharedScene scene={scene}><span aria-hidden="true" className="flex size-32 flex-none items-center justify-center"><Scene name={scene} motion="few" className="size-32" /></span></SharedScene>
      {/* The words */}
      <p className="min-w-0">
        {/* The mode, unless the page's title says it */}
        {name && <span className="block font-display text-2xl font-semibold tracking-tight">{name}</span>}
        {/* What it is (larger when it stands alone) */}
        <span className={`block ${name ? "text-footnote text-ink-muted" : "text-lede leading-snug"}`}>{line}</span>
      </p>
    </div>
  );
}
