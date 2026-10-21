"use client";
// Before telling a story (decision 92): the prompt, the moment, or a guided story's facts (decision 93), then an optional shape, one focus and a length; the planning minute and the telling happen on the recording page

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Masthead } from "@/components/script/Masthead";
// Load the shared button looks
import { PRESS, TEXT_LINK } from "@/components/script/Buttons";
// Load the plan card, to preview the chosen shape
import { StoryPlanCard } from "@/components/script/StoryPlanCard";
// Load the shared screen set-up
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the story content
import { STORY_FOCUSES, STORY_LENGTHS, STORY_SHAPES, findStoryPrompt, momentIdOf } from "@/content/stories";
// Load the record types
import type { StoryFocus, StoryLength, StoryShape } from "@/data/records";
// Load the guided stories and their card (decision 93)
import { findGuidedStory } from "@/content/guidedStories";
import { GuidedStoryCard } from "@/components/script/GuidedStoryCard";
// Load the tab title helper
import { usePageTitle } from "@/components/screens/usePageTitle";

// What the screen is given
interface TellStoryProps extends ScreenProps {
  // The story's seed: a prompt id from the bank, or "moment-" and a moment note's id
  storyId: string;
  // Inside today's practice: which step this is, or null
  planStep?: number | null;
}

// The look of a choice button: filled when chosen
const choice = (chosen: boolean) => `min-h-11 rounded-xl border-2 px-3 py-2 text-left ${PRESS} ${chosen ? "border-fill bg-fill text-fill-ink" : "border-rule bg-card"}`;

// The address that starts the planning minute and the telling
export function tellSessionHref(storyId: string, shape: StoryShape, focus: StoryFocus | null, length: StoryLength, planStep: number | null = null): string {
  // The seed and set-up, and the plan step when inside today's practice
  return `/session?mode=story&prompt=${encodeURIComponent(storyId)}&shape=${shape}${focus ? `&focus=${focus}` : ""}&length=${length}${planStep ? `&plan=${planStep}` : ""}`;
}

// Draw the screen
export function TellStoryScreen({ storyId, planStep = null, ...props }: TellStoryProps) {
  // The repository
  const { repo } = useScreenBasics(props);
  // The prompt from the bank, if the story came from one
  const prompt = findStoryPrompt(storyId);
  // The guided story, if it is one (decision 93)
  const guided = findGuidedStory(storyId);
  // The moment note's id, if it came from one
  const momentId = momentIdOf(storyId);
  // The moment's words (null while loading or when there is none)
  const [moment, setMoment] = useState<{ status: "loading" | "found" | "missing"; text: string }>({ status: momentId ? "loading" : "missing", text: "" });
  // The shape (Classic by default)
  const [shape, setShape] = useState<StoryShape>("classic");
  // The focus: none by default, or the one a guided story suits (the user can change it)
  const [focus, setFocus] = useState<StoryFocus | null>(guided?.focus ?? null);
  // The length (full by default; short inside today's practice, which keeps to a few minutes)
  const [length, setLength] = useState<StoryLength>(planStep ? "short" : "full");
  // Name the tab
  usePageTitle("Tell a story");

  // For a moment note, load its words
  useEffect(() => {
    // Nothing to load
    if (!momentId) return;
    // Ignore a late answer once the screen closes
    let cancelled = false;
    // Read it (a failure reads as missing, with the way back below)
    repo.getSession(momentId).then((session) => {
      // Keep it if still open
      if (!cancelled) setMoment(session && session.mode === "moment" ? { status: "found", text: session.transcript } : { status: "missing", text: "" });
    }, () => {
      // Shown as missing
      if (!cancelled) setMoment({ status: "missing", text: "" });
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [momentId, repo]);

  // Pick a focus: "Under a minute" also picks the short length
  function pickFocus(next: StoryFocus | null) {
    // The focus
    setFocus(next);
    // A minute means the short length
    if (next === "minute") setLength("short");
  }

  // Where the close button leads
  const close = planStep ? { href: "/", label: "Close, back to Today" } : { href: "/stories", label: "Close, back to Stories" };
  // Neither a known prompt nor a moment note that exists
  const unknown = !prompt && !guided && (!momentId || moment.status === "missing");

  // Draw the page
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-3xl flex-col bg-paper-raised px-6 pt-6 pb-10 md:px-14 md:pt-10">
      {/* Title, with a way back */}
      <Masthead title="Tell a story" nav={false} close={close} />
      {/* A story that cannot be found */}
      {unknown ? (
        <p role="alert" className="mt-6 max-w-[48ch] text-lede">This story is not here. <Link href="/stories" className={TEXT_LINK}>Back to Stories</Link></p>
      ) : (
        <>
          {/* Where it came from */}
          <p className="mt-6 text-footnote text-ink-muted">{momentId ? "From your moment" : guided ? "Guided story" : "Your story"}</p>
          {/* The prompt, a guided story's title, or the moment in the user's words */}
          <h1 className={`mt-1 font-display tracking-tight ${momentId ? "text-statement" : "text-prompt"} md:max-w-[24ch]`}>{prompt ? prompt.text : guided ? guided.title : moment.status === "loading" ? "…" : moment.text}</h1>
          {/* A guided story's facts and nudges, with the shape and focus as chosen below (decision 93) */}
          {guided && <GuidedStoryCard story={guided} take={{ shape, focus, length }} />}

          {/* The shape */}
          <div role="group" aria-labelledby="shape-label" className="mt-8">
            {/* Label */}
            <p id="shape-label" className="font-semibold">A shape <span className="font-normal text-ink-muted">(optional)</span></p>
            {/* The shapes */}
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {STORY_SHAPES.map((item) => (
                // One shape, filled when chosen
                <button key={item.id} type="button" aria-pressed={shape === item.id} onClick={() => setShape(item.id)} className={choice(shape === item.id)}>
                  {/* Its name */}
                  <span className="block font-semibold">{item.name}</span>
                  {/* What it is */}
                  <span className="block text-footnote opacity-80">{item.blurb}</span>
                </button>
              ))}
            </div>
          </div>

          {/* The focus */}
          <div role="group" aria-labelledby="focus-label" className="mt-6">
            {/* Label */}
            <p id="focus-label" className="font-semibold">One thing to try <span className="font-normal text-ink-muted">(optional)</span></p>
            {/* None, then the focuses */}
            <div className="mt-2 flex flex-wrap gap-2">
              {/* None */}
              <button type="button" aria-pressed={focus === null} onClick={() => pickFocus(null)} className={choice(focus === null)}>Just tell it</button>
              {/* Each focus */}
              {STORY_FOCUSES.map((item) => <button key={item.id} type="button" aria-pressed={focus === item.id} onClick={() => pickFocus(item.id)} className={choice(focus === item.id)}>{item.name}</button>)}
            </div>
          </div>

          {/* The length */}
          <div role="group" aria-labelledby="length-label" className="mt-6">
            {/* Label */}
            <p id="length-label" className="font-semibold">How long?</p>
            {/* The two lengths */}
            <div className="mt-2 grid max-w-sm grid-cols-2 gap-2">
              {STORY_LENGTHS.map((item) => (
                // One length, filled when chosen
                <button key={item.id} type="button" aria-pressed={length === item.id} onClick={() => setLength(item.id)} className={choice(length === item.id)}>
                  {/* Its name */}
                  <span className="block font-semibold">{item.name}</span>
                  {/* How long */}
                  <span className="block text-footnote opacity-80">{item.detail}</span>
                </button>
              ))}
            </div>
          </div>

          {/* The plan as it will show while planning (a guided story's card above already shows it) */}
          {!guided && <StoryPlanCard take={{ shape, focus, length }} />}

          {/* Push the band down */}
          <div className="flex-1" />
          {/* Start: a minute to plan, then tell it */}
          <ActionBand action="Start" aside="up to a minute to plan" href={tellSessionHref(storyId, shape, focus, length, planStep)} />
        </>
      )}
    </main>
  );
}
