// The choice of what to get better at most (decision 97): six areas as toggle buttons, one or two picked, used at the welcome, on Today and in Settings; the full-size picker shows each area's blob scene, which plays a few rounds when picked (decision 137)

// Load the shared press effect
import { PRESS } from "@/components/script/Buttons";
// Load the areas and the tap rule
import { FOCUS_AREAS, toggleFocus, type FocusAreaId } from "@/core/practiceFocus";
// Load the blob scenes and each area's one
import { Scene } from "@/components/scenes/Scene";
import { FOCUS_SCENES } from "@/components/scenes/sceneFor";

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
    <div role="group" aria-label={label} className={`mt-3 grid gap-2 ${compact ? "grid-cols-2" : "sm:grid-cols-2"}`}>
      {/* Each area */}
      {FOCUS_AREAS.map((area) => {
        // Whether it is picked
        const picked = value.includes(area.id);
        // One choice: filled once picked
        return (
          <button key={area.id} type="button" aria-pressed={picked} onClick={() => onChange(toggleFocus(value, area.id))} className={`min-h-12 rounded-[14px] border-2 text-left ${compact ? "px-4 py-2" : "grid grid-cols-[auto_1fr] content-center gap-x-3 py-2 pr-4 pl-2"} ${PRESS} ${picked ? "border-fill bg-fill text-fill-ink" : "border-rule bg-card hover:border-ink"}`}>
            {/* Its name (first, so it names the button), beside the scene on the full-size picker */}
            <span className={`block font-semibold leading-snug ${compact ? "" : "col-start-2 self-end"}`}>{area.name}</span>
            {/* What it covers (left out on the short card) */}
            {!compact && <span className={`col-start-2 block self-start text-footnote ${picked ? "text-fill-ink" : "text-ink-muted"}`}>{area.detail}</span>}
            {/* Its scene on a tinted tile, in the first column across both lines: still until picked, then a few rounds (not on the short card) */}
            {!compact && <span aria-hidden="true" className="col-start-1 row-span-2 row-start-1 flex size-14 items-center justify-center self-center rounded-xl bg-warm-tint"><Scene name={FOCUS_SCENES[area.id]} motion={picked ? "few" : "still"} className="size-14" /></span>}
          </button>
        );
      })}
    </div>
  );
}
