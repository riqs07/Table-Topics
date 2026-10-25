// The story's plan as a small card (decisions 92 and 126): the template's beats in order (or, for a story told before templates, its shape's), any focus for this telling, and the three things every good story does; full while choosing and planning, one line beside the voice shape while telling

// Load the template, shape and focus lookups, and the pointers
import { STORY_POINTERS, findStoryFocus, findStoryShape, findStoryTemplate } from "@/content/stories";
// Load the story set-up type
import type { StoryTake } from "@/data/records";
// Load the shared card look
import { CARD } from "@/components/script/textStyles";

// The beats to show: the template's, or an older story's shape's
export function planBeats(take: StoryTake): { name: string; about: string; beats: string[] } {
  // An older story told with a shape
  if (!take.template && take.shape) {
    // Its shape
    const shape = findStoryShape(take.shape);
    // Its name, blurb and beats
    return { name: shape.name, about: shape.blurb, beats: [...shape.beats] };
  }
  // The template
  const template = findStoryTemplate(take.template);
  // Its name, what it is for, and its beats
  return { name: template.name, about: template.forWhat, beats: template.beats.map((beat) => beat.name) };
}

// The three things every good story does, as a quiet card
export function StoryPointers() {
  // The card
  return (
    <section aria-label="Three things every good story does" data-story-pointers className="mt-4 max-w-md rounded-[22px] bg-accent/10 p-4">
      {/* Heading */}
      <p className="text-footnote font-semibold text-accent">Three things every good story does</p>
      {/* The three */}
      <ul className="mt-2 flex flex-col gap-1 text-footnote">
        {/* Each one */}
        {STORY_POINTERS.map((pointer) => <li key={pointer.lead}><b>{pointer.lead}</b> {pointer.rest}</li>)}
      </ul>
    </section>
  );
}

// Draw the card
export function StoryPlanCard({ take, compact = false }: { take: StoryTake; compact?: boolean }) {
  // The beats
  const plan = planBeats(take);
  // The focus, if any
  const focus = findStoryFocus(take.focus);
  // While telling: the beats on one line, and the focus under them
  if (compact) {
    // The margin version
    return (
      <div data-story-plan="compact" className="mt-6 border-t border-rule pt-3">
        {/* The beats on one line */}
        <p>{plan.beats.join(" · ")}</p>
        {/* The focus */}
        {focus && <p className="mt-2 font-semibold text-ink">{focus.name}</p>}
      </div>
    );
  }
  // While choosing and planning: the name, the beats numbered, and the focus with its tip
  return (
    <section aria-label="Your beats" data-story-plan="full" className={`mt-6 max-w-md p-4 ${CARD}`}>
      {/* Name and what it is for */}
      <p className="text-footnote text-ink-muted"><span className="font-semibold text-ink">{plan.name}</span> · {plan.about}</p>
      {/* The beats */}
      <ol className="mt-3 flex flex-col gap-1.5 text-lede">
        {/* Each beat, numbered */}
        {plan.beats.map((beat, index) => (
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
