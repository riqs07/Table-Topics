// A guided story's card (decision 93): the plain facts in order, the twist marked, the nudges toward what to add, and the template (or an older story's shape) and focus by name in one line; shown while choosing and planning, and while telling unless switched off (decision 130). It takes the place of the shape card, so a phone shows one card, not two

// Load the focus lookup
import { findStoryFocus, findStoryTemplate } from "@/content/stories";
// Load the plan's name (the template, or an older story's shape)
import { planBeats } from "@/components/script/StoryPlanCard";
// Load the guided story type and its level (decision 153)
import { findGuidedLevel, guidedLevel, type GuidedStory } from "@/content/guidedStories";
// Load the story set-up type
import type { StoryTake } from "@/data/records";
// Load the shared card look
import { CARD } from "@/components/script/textStyles";

// Draw the card
export function GuidedStoryCard({ story, take }: { story: GuidedStory; take: StoryTake }) {
  // The template or shape, by name
  const shape = planBeats(take);
  // The focus, if any
  const focus = findStoryFocus(take.focus);
  // Its level on the dial: the heading, and whether the details come in story order (decision 153)
  const level = findGuidedLevel(guidedLevel(story));
  // The facts numbered, the twist, the nudges, then the shape and focus by name
  return (
    <section aria-label="Your facts" data-guided-card="full" className={`mt-6 max-w-md p-4 ${CARD}`}>
      {/* "Make it a…": the kind of story to tell (decision 153) */}
      {story.template && <p data-make-it className="mb-2 font-display text-cue font-semibold">{findStoryTemplate(story.template).makeIt ?? `Make it a ${findStoryTemplate(story.template).name.toLowerCase()}`}</p>}
      {/* Small heading: the facts in order, out of order, or four things to use */}
      <p className="text-footnote font-semibold">{level.heading}</p>
      {/* The facts */}
      <ol className="mt-3 flex flex-col gap-1.5 text-lede" data-ordered={level.ordered}>
        {/* Each fact, numbered */}
        {story.facts.map((fact, index) => (
          // One fact
          <li key={fact} className="flex items-start gap-3">
            {/* Its number in story order, or a plain mark when the details are loose */}
            <span aria-hidden="true" className="flex size-6 flex-none items-center justify-center rounded-lg bg-warm-tint text-footnote font-semibold text-warm-ink">{level.ordered ? index + 1 : "•"}</span>
            {/* The fact */}
            <span>{fact}</span>
          </li>
        ))}
        {/* The twist, marked */}
        {story.twist && (
          <li data-twist className="flex items-start gap-3">
            {/* The mark */}
            <span className="flex-none rounded-lg bg-fill px-1.5 py-0.5 text-footnote font-semibold text-fill-ink">Twist</span>
            {/* The twist */}
            <span className="font-semibold">{story.twist}</span>
          </li>
        )}
      </ol>
      {/* What to add */}
      <div className="mt-4 border-t border-rule pt-3">
        {/* Small heading */}
        <p className="text-footnote text-ink-muted">Make it yours</p>
        {/* The nudges */}
        <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-5">
          {/* Each nudge */}
          {story.nudges.map((nudge) => <li key={nudge}>{nudge}</li>)}
        </ul>
      </div>
      {/* The template and the focus, by name (the facts are the beats here) */}
      <p className="mt-4 border-t border-rule pt-3 text-footnote"><span className="text-ink-muted">Template:</span> <span className="font-semibold">{shape.name}</span>{focus && <> · <span className="text-ink-muted">Focus:</span> <span className="font-semibold">{focus.name}</span></>}</p>
    </section>
  );
}
