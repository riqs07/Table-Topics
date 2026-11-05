"use client";
// Before telling a story (decisions 92 and 126): the prompt, the moment, or a guided story's facts (decision 93), then the template to tell it with (the one suited to the prompt chosen first, its beats and a short worked example shown) and a length; the planning minute and the telling happen on the recording page. The 4/3/2 loop is its own drill now (decision 126)

// Load React's state and effect tools
// Load the scene panel (decision 141)
// Load the page fade round a glide (decision 141)
import { PageFade } from "@/components/scenes/SharedScene";
import { ScenePanel } from "@/components/scenes/ScenePanel";
import { useEffect, useState } from "react";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { PRACTICE_BODY, PRACTICE_MAIN, PracticeBar } from "@/components/script/PracticeBar";
// Load the shared button looks
import { PRESS, TEXT_LINK } from "@/components/script/Buttons";
// Load the shared card and label looks
import { CARD, LAB } from "@/components/script/textStyles";
// Load the shared screen set-up
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the story content
import { STORY_FOCUSES, STORY_LENGTHS, STORY_TEMPLATES, findStoryFocus, findStoryPrompt, findStoryTemplate, momentIdOf, storyTakeQuery, suggestedTemplate } from "@/content/stories";
// Load the record types
import type { StoryFocus, StoryLength, StoryTake, StoryTemplate } from "@/data/records";
// Load the guided stories and their card (decision 93)
import { findGuidedStory, guidedLevel } from "@/content/guidedStories";
// Load the setup screen's scene for a story's kind (decisions 152 and 153)
import { storyScene } from "@/components/scenes/sceneFor";
import { GuidedStoryCard } from "@/components/script/GuidedStoryCard";
// Load the page that is not there
import { NotFound } from "@/components/script/SageSays";
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

// The look of a choice card: white with a ledge, edged in the accent with a green ledge when chosen
const choice = (chosen: boolean) => `min-h-14 rounded-[18px] border-2 bg-card px-4 py-3 text-left ${PRESS} ${chosen ? "border-accent shadow-picked" : "border-rule shadow-card hover:border-ink-muted"}`;

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
  // One thing to try (storyboard 13's chips): the one the link asked for, else the one a guided story suits, else none until picked
  const [focus, setFocus] = useState<StoryFocus | null>(initialFocus ?? guided?.focus ?? null);
  // The length (full by default; short inside today's practice, which keeps to a few minutes, or when the link asks for under a minute)
  const [length, setLength] = useState<StoryLength>(planStep || initialFocus === "minute" ? "short" : "full");
  // The chosen template's details
  const chosen = findStoryTemplate(template);
  // Whether every template shows, or only the chosen one's family (everyday, or the stories you'll need; decision 152)
  const [showAll, setShowAll] = useState(false);
  // The templates shown
  const shown = showAll ? STORY_TEMPLATES : STORY_TEMPLATES.filter((item) => item.family === chosen.family);
  // The set-up as it will be told
  const take: StoryTake = { template, focus, length };
  // The focus picked, with how to do it
  const focusInfo = findStoryFocus(focus);
  // Name the tab
  usePageTitle("Tell a story");

  // Pick one thing to try, or tap the picked one again for none; "Under a minute" also picks the short length, as a link asking for it does
  function pickFocus(next: StoryFocus) {
    // The same one again clears it
    const picked = focus === next ? null : next;
    // Kept
    setFocus(picked);
    // A minute's story is a short one
    if (picked === "minute") setLength("short");
  }

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
    <PageFade>
      <main id="main" className={PRACTICE_MAIN}>
        {/* The bar: the way out, the first of three steps (set up, plan, tell) */}
        <PracticeBar close={close} progress={unknown ? undefined : 1 / 3} label={unknown ? "Tell a story" : `${planStep ? `Today’s practice · step ${planStep} · ` : ""}${guided ? "Guided story" : "Tell a story"} · step 1 of 3`} />
        {/* A story that cannot be found */}
        {unknown ? (
          <div className={PRACTICE_BODY}>
            {/* Sage says so, as the page's heading, with the way back */}
            <NotFound title="This story is not here." back={{ href: "/stories", label: "Back to Stories" }} className="mt-4" />
          </div>
        ) : (
          <div className={`${PRACTICE_BODY} grid items-start gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-10`}>
            {/* The story: its prompt (or facts), and the scene carried over */}
            <div className="flex min-w-0 flex-col gap-5">
              {/* The prompt, a guided story's title, or the moment in the user's words, on the story's coral card */}
              <div>
                {/* Where it came from (above the card, where small words keep their contrast) */}
                <p className={LAB}>{momentId ? "From your moment" : guided ? "Guided story" : "Today’s story"}</p>
                {/* The words, large on the coral card */}
                <h1 className={`mt-2 rounded-[22px] bg-art-coral px-6 py-5 font-display font-semibold text-fill-ink shadow-ledge ${momentId ? "text-cue" : "text-cue md:text-statement"}`}>{prompt ? prompt.text : guided ? guided.title : moment.status === "loading" ? "…" : moment.text}</h1>
              </div>
              {/* A guided story's facts and nudges, with the template named (decision 93) */}
              {guided && <GuidedStoryCard story={guided} take={take} />}
              {/* The scene, carried over from the Practice card (decision 141): a story you'll need's own, Story dice, the signpost for another guided story, the campfire otherwise (decisions 152 and 153) */}
              <ScenePanel scene={storyScene({ neededTemplate: findStoryTemplate(suggested).family === "needed" ? suggested : null, guidedLevel: guided ? guidedLevel(guided) : null })} name={guided ? (guided.level === "connect" ? "Story dice" : "Guided story") : findStoryTemplate(suggested).family === "needed" ? findStoryTemplate(suggested).name : undefined} line="Plan it in a minute, then tell it." className="" />
            </div>

            {/* The set-up: the template, the length, an example, then start */}
            <div className="flex min-w-0 flex-col gap-6">
              {/* The template */}
              <div role="group" aria-labelledby="template-label">
                {/* Label */}
                <p id="template-label" className={LAB}>Template</p>
                {/* The templates, as cards, two across; the chosen one shows what it is for */}
                <div className="mt-2.5 grid grid-cols-2 gap-3">
                  {shown.map((item) => (
                    // One template, edged in the accent when chosen
                    <button key={item.id} type="button" aria-pressed={template === item.id} onClick={() => setTemplate(item.id)} className={choice(template === item.id)}>
                      {/* Its name (the suggested one is chosen at the start, so it needs no label) */}
                      <span className="block font-display text-lg font-semibold leading-tight">{item.name}</span>
                      {/* Its beats in one line */}
                      <span className="mt-1 block text-sm font-bold text-ink-muted">{item.beats.map((beat, index) => (index === 0 ? beat.name : beat.name.charAt(0).toLowerCase() + beat.name.slice(1))).join(", ")}</span>
                      {/* The chosen one: what it is for */}
                      {template === item.id && <span className="mt-1.5 block text-sm font-extrabold text-accent-tint-ink">{item.forWhat}</span>}
                    </button>
                  ))}
                </div>
                {/* The other family's templates, a tap away */}
                {!showAll && <button type="button" onClick={() => setShowAll(true)} className={`${TEXT_LINK} text-footnote`}>Show all templates</button>}
                {/* What a story you'll need needs, in a line (decision 152) */}
                {chosen.needs && <p data-template-needs className="mt-2 rounded-2xl border-2 border-rule bg-accent-tint px-4 py-3 shadow-ledge text-footnote font-bold text-accent-tint-ink">{chosen.needs}</p>}
              </div>

              {/* The length, before the example so the Start band never covers it on a phone */}
              <div role="group" aria-labelledby="length-label">
                {/* Label */}
                <p id="length-label" className={LAB}>Length</p>
                {/* The two lengths */}
                <div className="mt-2.5 grid max-w-md grid-cols-2 gap-3">
                  {STORY_LENGTHS.map((item) => (
                    // One length, edged when chosen
                    <button key={item.id} type="button" aria-pressed={length === item.id} onClick={() => setLength(item.id)} className={choice(length === item.id)}>
                      {/* Its name */}
                      <span className="block font-display text-lg font-semibold">{item.name}</span>
                      {/* How long */}
                      <span className="block text-sm font-bold text-ink-muted">{item.detail}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* One thing to try, as pills (storyboard 13), after the length so the first phone screen stays under its word budget; none is fine, and the one picked shows how */}
              <div role="group" aria-labelledby="focus-label">
                {/* Label */}
                <p id="focus-label" className={LAB}>One thing to try</p>
                {/* The focuses */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {STORY_FOCUSES.map((item) => (
                    // One focus, in the warm tint when picked
                    <button key={item.id} type="button" aria-pressed={focus === item.id} onClick={() => pickFocus(item.id)} className={`inline-flex min-h-11 items-center rounded-full border-2 px-4 text-sm font-extrabold ${PRESS} ${focus === item.id ? "border-warm bg-warm-tint text-warm-ink" : "border-rule bg-card text-ink shadow-ledge hover:border-ink-muted"}`}>{item.name}</button>
                  ))}
                </div>
                {/* How to do the one picked */}
                {focusInfo && <p data-focus-tip className="mt-2 text-footnote font-bold text-ink-muted">{focusInfo.tip}</p>}
              </div>

              {/* A short worked example of the chosen template, each beat named */}
              <section aria-label={`Example: ${chosen.name}`} data-template-example className={`p-5 ${CARD}`}>
                {/* Heading */}
                <p className={LAB}>Example · {chosen.name}</p>
                {/* The example, beat by beat */}
                <p className="mt-2 leading-relaxed">{chosen.example.map((piece, index) => <span key={index}>{piece} <b className="text-sm font-extrabold text-accent-tint-ink">({chosen.beats[index]!.name.toLowerCase()})</b> </span>)}</p>
              </section>

              {/* Start: a minute to plan, then tell it */}
              <ActionBand action="Start planning" aside="a minute, then tell it" href={tellSessionHref(storyId, take, planStep)} />
            </div>
          </div>
        )}
      </main>
    </PageFade>
  );
}
