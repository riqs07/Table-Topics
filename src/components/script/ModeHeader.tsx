// A mode's name and plain description: what it is, how long, what you do, what you get afterwards

// Load the catalogue entry type
import type { ModeInfo } from "@/content/modes";

// Draw the heading and its description
export function ModeHeader({ mode }: { mode: ModeInfo }) {
  // Name, subtitle and length, then the two sentences
  return (
    <>
      {/* The name, with its subtitle and length beside it */}
      <h2 id={mode.id} className="font-display text-cue">{mode.name}</h2>
      {/* What it is and how long */}
      <p className="text-footnote italic text-ink-muted">{mode.subtitle} · {mode.length}</p>
      {/* What you do and what you get */}
      <p className="mt-2 max-w-[56ch] text-footnote">
        {/* What you do */}
        {mode.youDo}{" "}
        {/* What you get, quieter */}
        <span className="text-ink-muted">Afterwards: {mode.youGet.charAt(0).toLowerCase() + mode.youGet.slice(1)}</span>
      </p>
    </>
  );
}
