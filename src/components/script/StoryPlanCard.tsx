// The story's plan as a small card (decision 92): the chosen shape's beats in order, and the focus for this telling; full while planning, one line beside the voice shape while telling

// Load the shape and focus lookups
import { findStoryFocus, findStoryShape } from "@/content/stories";
// Load the story set-up type
import type { StoryTake } from "@/data/records";
// Load the shared card look
import { CARD } from "@/components/script/textStyles";

// Draw the card
export function StoryPlanCard({ take, compact = false }: { take: StoryTake; compact?: boolean }) {
  // The shape
  const shape = findStoryShape(take.shape);
  // The focus, if any
  const focus = findStoryFocus(take.focus);
  // While telling: the beats on one line, and the focus under them
  if (compact) {
    // The margin version
    return (
      <div data-story-plan="compact" className="mt-6 border-t border-rule pt-3">
        {/* The beats on one line */}
        <p>{shape.beats.join(" · ")}</p>
        {/* The focus */}
        {focus && <p className="mt-2 font-semibold text-ink">{focus.name}</p>}
      </div>
    );
  }
  // While planning: the shape's name, its beats numbered, and the focus with its tip
  return (
    <section aria-label="Your story's shape" data-story-plan="full" className={`mt-6 max-w-md p-4 ${CARD}`}>
      {/* Name and what it is */}
      <p className="text-footnote text-ink-muted"><span className="font-semibold text-ink">{shape.name}</span> · {shape.blurb}</p>
      {/* The beats */}
      <ol className="mt-3 flex flex-col gap-1.5 text-lede">
        {/* Each beat, numbered */}
        {shape.beats.map((beat, index) => (
          // One beat
          <li key={beat} className="flex items-start gap-3">
            {/* Its number */}
            <span aria-hidden="true" className="flex size-6 flex-none items-center justify-center rounded-lg bg-warm-tint text-footnote font-semibold text-warm-ink">{index + 1}</span>
            {/* The beat */}
            <span>{beat}</span>
          </li>
        ))}
      </ol>
      {/* The focus for this telling */}
      {focus && (
        <div className="mt-4 border-t border-rule pt-3">
          {/* Small heading */}
          <p className="text-footnote text-ink-muted">Your focus</p>
          {/* The focus and how */}
          <p className="mt-1 font-semibold">{focus.name}</p>
          {/* How to do it */}
          <p className="text-footnote text-ink-muted">{focus.tip}</p>
        </div>
      )}
    </section>
  );
}
