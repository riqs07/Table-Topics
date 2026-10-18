// A mode's name with what it is and how long, in one quiet line (the longer "what you do" sentences were cut, decision 63)

// Load the catalogue entry type
import type { ModeInfo } from "@/content/modes";
// Load the shared heading look
import { SECTION_HEADING } from "@/components/script/textStyles";

// Draw the heading and its line
export function ModeHeader({ mode }: { mode: ModeInfo }) {
  // Name, then subtitle and length
  return (
    <>
      {/* The name */}
      <h2 id={mode.id} className={SECTION_HEADING}>{mode.name}</h2>
      {/* What it is and how long */}
      <p className="text-footnote text-ink-muted">{mode.subtitle} · {mode.length}</p>
    </>
  );
}
