// A guided story's card (decision 93): the plain facts in order, the twist marked, the nudges toward what to add, and the template (or an older story's shape) and focus by name in one line; shown while choosing and planning, and while telling unless switched off (decision 130). It takes the place of the shape card, so a phone shows one card, not two

// Load the focus lookup
import { findStoryFocus, findStoryTemplate } from "@/content/stories";
// Load the plan's name (the template, or an older story's shape)
import { planBeats } from "@/components/script/StoryPlanCard";
// Load the guided story type and its level (decision 153)
import { findGuidedLevel, guidedLevel, type GuidedStory } from "@/content/guidedStories";
// Load the story set-up type
import type { StoryTake } from "@/data/records";
// Load the shared card and label looks, and the plus
import { CARD, LAB } from "@/components/script/textStyles";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
// Load the guided stories' tile, for the card's heading while telling (storyboard 14)
import { ModeTile } from "@/components/scenes/ModeTile";
import { SCENE_TILES } from "@/components/scenes/modeTileFor";

// Draw the card
export function GuidedStoryCard({ story, take, titled = false }: { story: GuidedStory; take: StoryTake; titled?: boolean }) {
  // The template or shape, by name
  const shape = planBeats(take);
  // The focus, if any
  const focus = findStoryFocus(take.focus);
  // Its level on the dial: the heading, and whether the details come in story order (decision 153)
  const level = findGuidedLevel(guidedLevel(story));
  // The facts numbered, the twist, the nudges, then the shape and focus by name (laid out as the storyboard's "Guided story")
  return (
    <section aria-label="Your facts" data-guided-card="full" className="mt-6 flex max-w-lg flex-col gap-4">
      {/* The facts, on their own card */}
      <div className={`px-5 py-5 ${CARD}`}>
        {/* When asked (while telling, storyboard 14): the guided stories' tile beside the story's title */}
        {titled && (
          <div className="mb-3 flex items-center gap-3.5">
            {/* The tile */}
            <ModeTile ground={SCENE_TILES["guided-stories"].ground} prop={SCENE_TILES["guided-stories"].prop} face={SCENE_TILES["guided-stories"].face} still className="size-14 flex-none" />
            {/* The title */}
            <p className="font-display text-2xl leading-tight font-semibold">{story.title}</p>
          </div>
        )}
        {/* "Make it a…": the kind of story to tell (decision 153) */}
        {story.template && <p data-make-it className="mb-2 font-display text-cue font-semibold leading-tight">{findStoryTemplate(story.template).makeIt ?? `Make it a ${findStoryTemplate(story.template).name.toLowerCase()}`}</p>}
        {/* Small heading: the facts in order, out of order, or four things to use */}
        <p className={LAB}>{level.heading}</p>
        {/* The facts */}
        <ol className="mt-3 flex flex-col gap-2 text-lg font-bold" data-ordered={level.ordered}>
          {/* Each fact, numbered */}
          {story.facts.map((fact, index) => (
            // One fact
            <li key={fact} className="flex items-start gap-3">
              {/* Its number in story order, or a plain mark when the details are loose */}
              <span aria-hidden="true" className="mt-0.5 grid size-7 flex-none place-items-center rounded-full bg-warm-tint font-display text-sm font-semibold text-warm-ink">{level.ordered ? index + 1 : "•"}</span>
              {/* The fact */}
              <span>{fact}</span>
            </li>
          ))}
          {/* The twist, marked */}
          {story.twist && (
            <li data-twist className="flex items-start gap-3">
              {/* The mark */}
              <span className="flex-none rounded-full bg-fill px-2.5 py-0.5 text-chip font-extrabold uppercase tracking-[.05em] text-fill-ink">Twist</span>
              {/* The twist */}
              <span>{story.twist}</span>
            </li>
          )}
        </ol>
        {/* The template and the focus, by name (the facts are the beats here) */}
        <p className="mt-4 border-t-2 border-rule pt-3 text-sm font-bold"><span className="text-ink-muted">Template:</span> <span>{shape.name}</span>{focus && <> · <span className="text-ink-muted">Focus:</span> <span>{focus.name}</span></>}</p>
      </div>
      {/* What to add, each nudge a row with a plus */}
      <div>
        {/* Small heading */}
        <p className={LAB}>Make it yours</p>
        {/* The nudges */}
        <ul className="mt-2 flex flex-col gap-2">
          {/* Each nudge */}
          {story.nudges.map((nudge) => <li key={nudge} className="flex items-start gap-3 rounded-[18px] border-2 border-rule bg-card px-4 py-3 font-bold shadow-ledge"><PlusIcon aria-hidden="true" weight="bold" className="mt-1 size-4 flex-none text-art-plum" />{nudge}</li>)}
        </ul>
      </div>
    </section>
  );
}
