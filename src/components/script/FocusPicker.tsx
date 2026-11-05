// The choice of what to get better at most (decision 97): six areas as toggle buttons, one or two picked, used at the welcome, on Today and in Settings; the short picker on Today shows each area with its small tile; the full-size picker is a column of big picture rows with a tick box (storyboard "What to work on"), each area's tile moving a few rounds once picked (decision 137)

// Load the shared press effect
import { PRESS } from "@/components/script/Buttons";
// Load the areas and the tap rule
import { FOCUS_AREAS, toggleFocus, type FocusAreaId } from "@/core/practiceFocus";
// Load the mode tile, each area's scene and that scene's tile
import { ModeTile } from "@/components/scenes/ModeTile";
import { FOCUS_SCENES } from "@/components/scenes/sceneFor";
import { SCENE_TILES } from "@/components/scenes/modeTileFor";
// Load the tick
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";

// What the picker needs
interface FocusPickerProps {
  // The areas picked now
  value: ReadonlyArray<FocusAreaId>;
  // Called with the new picks after each tap
  onChange: (next: FocusAreaId[]) => void;
  // The question it answers, for screen readers (the page shows it as a heading)
  label: string;
  // Names only, without the line under each (for the short card on Today)
  compact?: boolean;
}

// Draw the picker
export function FocusPicker({ value, onChange, label, compact = false }: FocusPickerProps) {
  // The areas, each a button that shows whether it is picked
  return (
    <div role="group" aria-label={label} className={`mt-3 grid ${compact ? "grid-cols-2 gap-2" : "gap-3 sm:grid-cols-2"}`}>
      {/* Each area */}
      {FOCUS_AREAS.map((area) => {
        // Whether it is picked
        const picked = value.includes(area.id);
        // Its scene, and that scene's tile
        const scene = FOCUS_SCENES[area.id];
        // (the tile's look)
        const tile = SCENE_TILES[scene];
        // The short card's choice: the name (first, so it names the button) and its small tile shown before it, edged in sky once picked
        if (compact) return <button key={area.id} type="button" aria-pressed={picked} onClick={() => onChange(toggleFocus(value, area.id))} className={`flex min-h-14 items-center gap-2 rounded-[16px] border-2 py-2 pr-2.5 pl-2 text-left sm:gap-3 ${PRESS} ${picked ? "border-art-sky bg-art-sky/10 shadow-sky" : "border-rule bg-card shadow-ledge hover:border-ink-muted"}`}><span className="order-2 min-w-0 flex-1 text-sm leading-snug font-extrabold sm:text-base">{area.name}</span><span aria-hidden="true" className="order-1 flex"><ModeTile ground={tile.ground} prop={tile.prop} face={tile.face} tilt={-4} motion="still" still className="size-9" /></span></button>;
        // A big row: the tile, the name (and what it covers), and the tick box; edged in sky once picked
        return (
          <button key={area.id} type="button" aria-pressed={picked} onClick={() => onChange(toggleFocus(value, area.id))} className={`grid min-h-18 grid-cols-[auto_1fr_auto] items-center gap-x-3.5 rounded-[18px] border-2 py-2.5 pr-4 pl-3 text-left ${PRESS} ${picked ? "border-art-sky bg-art-sky/10 shadow-sky" : "border-rule bg-card shadow-card hover:border-ink-muted"}`}>
            {/* Its name (first, so it names the button) */}
            <span className="col-start-2 row-start-1 self-end text-lg font-extrabold leading-snug">{area.name}</span>
            {/* What it covers, under it */}
            <span className="col-start-2 row-start-2 self-start text-footnote font-semibold text-ink-muted">{area.detail}</span>
            {/* Its tile: still until picked, then a few rounds */}
            <span aria-hidden="true" className="col-start-1 row-span-2 row-start-1 flex"><ModeTile ground={tile.ground} prop={tile.prop} face={tile.face} tilt={-4} scene={scene} motion={picked ? "few" : "still"} still={!picked} className="size-12" /></span>
            {/* The tick box */}
            <span aria-hidden="true" className={`col-start-3 row-span-2 row-start-1 flex size-7 items-center justify-center rounded-[8px] border-2 ${picked ? "border-art-sky bg-art-sky text-art-cream" : "border-rule bg-card"}`}>{picked && <CheckIcon weight="bold" className="size-4" />}</span>
          </button>
        );
      })}
    </div>
  );
}
