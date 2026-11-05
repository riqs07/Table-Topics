// The story's plan as a small card (decisions 92 and 126): the template's beats in order (or, for a story told before templates, its shape's), any focus for this telling, and the three things every good story does; shown while choosing and planning, and while telling unless switched off (decision 130)

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
    <section aria-label="Three things every good story does" data-story-pointers className="mt-4 max-w-md rounded-[22px] bg-accent-tint p-4">
      {/* Heading */}
      <p className="text-footnote font-extrabold text-accent-tint-ink">Three things every good story does</p>
      {/* The three */}
      <ul className="mt-2 flex flex-col gap-1 text-footnote">
        {/* Each one */}
        {STORY_POINTERS.map((pointer) => <li key={pointer.lead}><b>{pointer.lead}</b> {pointer.rest}</li>)}
      </ul>
    </section>
  );
}

// Draw the card
export function StoryPlanCard({ take }: { take: StoryTake }) {
  // The beats
  const plan = planBeats(take);
  // The focus, if any
  const focus = findStoryFocus(take.focus);
  // The name, the beats numbered, and the focus with its tip (laid out as the template card in Desktop Screens "StoryTell")
  return (
    <section aria-label="Your beats" data-story-plan="full" className={`mt-6 max-w-lg px-5 py-5 md:px-6 ${CARD}`}>
      {/* Name and what it is for */}
      <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><span className="font-display text-xl font-semibold">{plan.name}</span><span className="text-sm font-bold text-ink-muted">{plan.about}</span></p>
      {/* The beats */}
      <ol className="mt-3 flex flex-col">
        {/* Each beat, numbered in a ring */}
        {plan.beats.map((beat, index) => (
          // One beat
          <li key={`${index}-${beat}`} className="flex min-h-12 items-center gap-3.5 border-t-2 border-rule py-2 first:border-t-0">
            {/* Its number */}
            <span aria-hidden="true" className="grid size-8 flex-none place-items-center rounded-full border-2 border-rule font-display text-sm font-semibold text-ink-muted">{index + 1}</span>
            {/* The beat */}
            <span className="text-lg font-bold">{beat}</span>
          </li>
        ))}
      </ol>
      {/* The focus for this telling */}
      {focus && (
        <div className="mt-3 rounded-2xl bg-warm-tint px-4 py-3 text-warm-ink">
          {/* Small heading */}
          <p className="text-xs font-extrabold uppercase tracking-[.07em]">Your focus</p>
          {/* The focus and how */}
          <p className="mt-1 font-extrabold">{focus.name}</p>
          {/* How to do it */}
          <p className="text-sm font-semibold">{focus.tip}</p>
        </div>
      )}
    </section>
  );
}
