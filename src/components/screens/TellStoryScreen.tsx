"use client";
// Before telling a story (decisions 92 and 126): the prompt, the moment, or a guided story's facts (decision 93), then the template to tell it with (the one suited to the prompt chosen first, its beats and a short worked example shown) and a length; the planning minute and the telling happen on the recording page. The 4/3/2 loop is its own drill now (decision 126)

// Load React's state and effect tools
// Load the scene panel (decision 141)
import { ScenePanel } from "@/components/scenes/ScenePanel";
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Masthead } from "@/components/script/Masthead";
// Load the shared button looks
import { PRESS, TEXT_LINK } from "@/components/script/Buttons";
// Load the shared card look
import { CARD } from "@/components/script/textStyles";
// Load the shared screen set-up
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the story content
import { STORY_LENGTHS, STORY_TEMPLATES, findStoryPrompt, findStoryTemplate, momentIdOf, storyTakeQuery, suggestedTemplate } from "@/content/stories";
// Load the record types
import type { StoryFocus, StoryLength, StoryTake, StoryTemplate } from "@/data/records";
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
  // A template to start on, from the Stories page or a link, or null for the one suggested
  initialTemplate?: StoryTemplate | null;
  // A focus carried in from a Learn card's link (decision 94), or null for the story's own
  initialFocus?: StoryFocus | null;
}

// The look of a choice button: filled when chosen
const choice = (chosen: boolean) => `min-h-11 rounded-xl border-2 px-3 py-2 text-left ${PRESS} ${chosen ? "border-fill bg-fill text-fill-ink" : "border-rule bg-card"}`;

// The address that starts the planning minute and the telling
export function tellSessionHref(storyId: string, take: StoryTake, planStep: number | null = null): string {
  // The seed and set-up, and the plan step when inside today's practice
  return `/session?mode=story&prompt=${encodeURIComponent(storyId)}${storyTakeQuery(take)}${planStep ? `&plan=${planStep}` : ""}`;
}

// Draw the screen
export function TellStoryScreen({ storyId, planStep = null, initialTemplate = null, initialFocus = null, ...props }: TellStoryProps) {
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
  // The template suggested for this story
  const suggested = suggestedTemplate(storyId);
  // The template (the one asked for, else the suggested one)
  const [template, setTemplate] = useState<StoryTemplate>(initialTemplate ?? suggested);
  // The focus carried in: the one the link asked for, else the one a guided story suits, else none
  const focus: StoryFocus | null = initialFocus ?? guided?.focus ?? null;
  // The length (full by default; short inside today's practice, which keeps to a few minutes, or when the link asks for under a minute)
  const [length, setLength] = useState<StoryLength>(planStep || initialFocus === "minute" ? "short" : "full");
  // The chosen template's details
  const chosen = findStoryTemplate(template);
  // The set-up as it will be told
  const take: StoryTake = { template, focus, length };
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
          {/* The scene, carried over from the Practice card: the signpost for a guided story, the campfire otherwise (decision 141) */}
          <ScenePanel scene={guided ? "guided-stories" : "story"} name={guided ? "Guided story" : "Tell a story"} line="Plan it in a minute, then tell it." className="mt-6" />
          {/* Where it came from */}
          {(momentId || guided) && <p className="mt-6 text-footnote text-ink-muted">{momentId ? "From your moment" : "Guided story"}</p>}
          {/* The prompt, a guided story's title, or the moment in the user's words */}
          <h1 className={`${momentId || guided ? "mt-1" : "mt-6"} font-display tracking-tight ${momentId ? "text-statement" : "text-prompt"} md:max-w-[24ch]`}>{prompt ? prompt.text : guided ? guided.title : moment.status === "loading" ? "…" : moment.text}</h1>
          {/* A guided story's facts and nudges, with the template named (decision 93) */}
          {guided && <GuidedStoryCard story={guided} take={take} />}

          {/* The template */}
          <div role="group" aria-labelledby="template-label" className="mt-8">
            {/* Label */}
            <p id="template-label" className="font-semibold">Template</p>
            {/* The templates, only the chosen one showing what it is for and its beats */}
            <div className="mt-2 grid max-w-xl gap-2">
              {STORY_TEMPLATES.map((item) => (
                // One template, filled when chosen
                <button key={item.id} type="button" aria-pressed={template === item.id} onClick={() => setTemplate(item.id)} className={choice(template === item.id)}>
                  {/* Its name (the suggested one is chosen at the start, so it needs no label) */}
                  <span className="block font-semibold">{item.name}</span>
                  {/* The chosen one: what it is for, and its beats in one line (the others' are a tap away, so the first screen stays short) */}
                  {template === item.id && <><span className="block text-footnote opacity-80">{item.forWhat}</span><span className="mt-1 block text-footnote">{item.beats.map((beat, index) => (index === 0 ? beat.name : beat.name.charAt(0).toLowerCase() + beat.name.slice(1))).join(", ")}</span></>}
                </button>
              ))}
            </div>
          </div>

          {/* A short worked example of the chosen template, each beat named */}
          <section aria-label={`Example: ${chosen.name}`} data-template-example className={`mt-4 max-w-xl p-4 ${CARD}`}>
            {/* Heading */}
            <p className="text-footnote font-semibold">Example · {chosen.name}</p>
            {/* The example, beat by beat */}
            <p className="mt-1 text-footnote">{chosen.example.map((piece, index) => <span key={index}>{piece} <b className="text-accent">({chosen.beats[index]!.name.toLowerCase()})</b> </span>)}</p>
          </section>

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

          {/* Push the band down */}
          <div className="flex-1" />
          {/* Start: a minute to plan, then tell it */}
          <ActionBand action="Start" aside="a minute to plan" href={tellSessionHref(storyId, take, planStep)} />
        </>
      )}
    </main>
  );
}
