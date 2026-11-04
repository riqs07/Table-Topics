// The mode's picture at the top of the screen a Practice card opens (decision 141; a mode tile since the UI rewrite): a tinted panel with the tile beside the mode's name (left out where the page's own title already says it) and a short line

// Load the scene names
import type { SceneName } from "@/components/scenes/Scene";
// Load the mode tile and its tints (UI rewrite: the panel shows the same tile as the Practice card)
import { GROUND_TINT, ModeTile } from "@/components/scenes/ModeTile";
// Load each kind's tile
import { SCENE_TILES } from "@/components/scenes/modeTileFor";

// Draw the panel
export function ScenePanel({ scene, name, line, className = "mt-6 md:mt-0" }: { scene: SceneName; name?: string; line: string; className?: string }) {
  // The kind's tile
  const tile = SCENE_TILES[scene];
  // The tile on the left, the words on the right
  return (
    <div data-scene-panel={scene} className={`flex items-center gap-4 rounded-[22px] border-2 border-rule p-3 pr-5 md:max-w-md ${GROUND_TINT[tile.ground]} ${className}`}>
      {/* The tile, playing three rounds as the screen opens, then still */}
      <ModeTile ground={tile.ground} prop={tile.prop} face={tile.face} tilt={-4} className="size-24" />
      {/* The words */}
      <p className="min-w-0">
        {/* The mode, unless the page's title says it */}
        {name && <span className="block font-display text-2xl font-semibold">{name}</span>}
        {/* What it is (larger when it stands alone) */}
        <span className={`block ${name ? "text-footnote font-bold text-ink-muted" : "text-lede leading-snug font-semibold"}`}>{line}</span>
      </p>
    </div>
  );
}
