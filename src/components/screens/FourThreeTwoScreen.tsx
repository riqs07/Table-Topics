"use client";
// The 4/3/2 drill as its own page (decision 126; the loop itself is decision 118): say the same content three times in one sitting, each round shorter, on today's prepared-speech topic, today's story, or one of the user's own stories told again. It left the story set-up and the recording page, where it was an option. Second design pass, extrapolated from Desktop Screens "Practice" and "CoursePath": "‹ Speak on the spot" and the drill's tile in a header card with the three rounds as pills, then each thing to say as a row with its tile and its three times

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the chevron at the end of a row
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
// Load the page heading with the main navigation, and the list page's header
import { Masthead } from "@/components/script/Masthead";
import { HubHeader } from "@/components/script/HubHeader";
// Load the press effect
import { PRESS } from "@/components/script/Buttons";
// Load the mode tile, each kind's tile and the tile look type
import { ModeTile } from "@/components/scenes/ModeTile";
import { SCENE_TILES, type ModeTileLook } from "@/components/scenes/modeTileFor";
// Load the shared screen set-up
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the day's prepared-speech topic and story prompt
import { promptForDay } from "@/content/prompts";
import { findStoryTemplate, storyPromptForDay, suggestedTemplate } from "@/content/stories";
// Load the loop's addresses and times
import { loopHref, targetWords } from "@/core/fourThreeTwo";
// Load the user's stories
import { storyLibrary, type LibraryStory } from "@/core/storyLibrary";
// Load the shared heading, card and pill looks
import { CARD_LIST, CHIP, CHIP_GOOD, SECTION_HEADING } from "@/components/script/textStyles";
// Load the shared page shell
import { PAGE } from "@/components/script/layout";

// How many of the user's stories to offer
const STORIES_SHOWN = 5;

// The three rounds, in words
const ROUNDS = ["Round 1, the longest", "Round 2, shorter", "Round 3, shortest"];

// One thing to say three times: its tile, its name, what it is, and the three times, the whole row a link
function LoopRow({ href, look, name, detail, times }: { href: string; look: ModeTileLook; name: string; detail?: string; times: string }) {
  // The row
  return (
    <Link href={href} className={`flex min-h-18 items-center gap-4 py-3 hover:text-accent ${PRESS}`}>
      {/* Its tile (still, apart from blinking; decorative, so the link is named by its words) */}
      <ModeTile ground={look.ground} prop={look.prop} face={look.face} still className="size-14" />
      {/* The words */}
      <span className="min-w-0 flex-1">
        {/* The name */}
        <span className="block font-display text-lg leading-tight font-semibold">{name}</span>
        {/* What it is */}
        {detail && <span className="block text-footnote font-bold text-ink-muted">{detail}</span>}
        {/* The three times */}
        <span className="mt-1 block text-footnote font-extrabold text-accent-tint-ink">{times}</span>
      </span>
      {/* The chevron */}
      <CaretRightIcon aria-hidden="true" className="size-5 flex-none text-ink-muted" />
    </Link>
  );
}

// The page
export function FourThreeTwoScreen(props: ScreenProps) {
  // The repository and today (null until in the browser)
  const { repo, today } = useScreenBasics(props);
  // The user's stories, latest first (empty until read, and when reading fails: the day's two still start)
  const [stories, setStories] = useState<LibraryStory[]>([]);

  // Read the user's stories
  useEffect(() => {
    // Ignore a late answer once the page closes
    let cancelled = false;
    // Read the sessions and titles (a failure leaves the list empty)
    Promise.all([repo.listSessions(), repo.listStories()]).then(([sessions, saved]) => {
      // Keep them if still open
      if (!cancelled) setStories(storyLibrary(sessions, saved));
    }, () => undefined);
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo]);

  // Today's prepared-speech topic (one along from today's practice, as on Practice)
  const topic = today ? promptForDay(today, 1) : null;
  // Today's story prompt
  const story = today ? storyPromptForDay(today) : null;

  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="VoiceLab" section="practice" />
      {/* The way back, the drill's tile, its name and what it is */}
      <HubHeader back={{ href: "/practice/ways?job=on-the-spot", label: "Speak on the spot" }} look={SCENE_TILES["four-three-two"]} title="4/3/2" line="Say the same thing three times, each round shorter. The squeeze makes it flow.">
        {/* The three rounds, as pills: same content, less time */}
        <ol aria-label="The rounds" className="flex basis-full flex-wrap items-center gap-2">
          {/* Each round, the last in the accent's tint */}
          {ROUNDS.map((round, index) => <li key={round} className={index === ROUNDS.length - 1 ? CHIP_GOOD : CHIP}>{round}</li>)}
        </ol>
      </HubHeader>

      {/* The day's two */}
      <section aria-labelledby="loop-today" className="mt-8">
        {/* Heading */}
        <h2 id="loop-today" className={SECTION_HEADING}>Today</h2>
        {/* The rows */}
        <ul aria-label="Today's 4/3/2" className={`mt-3 ${CARD_LIST}`}>
          {/* Today's prepared speech */}
          {topic && <li><LoopRow href={loopHref({ mode: "response", promptId: topic.id }, "new", 1)} look={SCENE_TILES["prepared-speech"]} name="Prepared speech" detail={topic.text} times={targetWords("response")} /></li>}
          {/* Today's story, with its suggested template */}
          {story && <li><LoopRow href={loopHref({ mode: "story", promptId: story.id, story: { template: suggestedTemplate(story.id), focus: null, length: "full" } }, "new", 1)} look={SCENE_TILES.story} name="A story" detail={story.text} times={`${findStoryTemplate(suggestedTemplate(story.id)).name} · ${targetWords("story", "full")}`} /></li>}
        </ul>
      </section>

      {/* The user's own stories, told again three times */}
      {stories.length > 0 && (
        <section aria-labelledby="loop-yours" className="mt-9">
          {/* Heading */}
          <h2 id="loop-yours" className={SECTION_HEADING}>Your stories</h2>
          {/* The rows */}
          <ul aria-label="Your stories" className={`mt-3 ${CARD_LIST}`}>
            {/* Each story, with the set-up it was last told with */}
            {stories.slice(0, STORIES_SHOWN).map((item) => {
              // The set-up it was last told with (a story from before set-ups were saved gets its suggested template)
              const take = item.latest.story ?? { template: suggestedTemplate(item.id), focus: null, length: "full" as const };
              // One row
              return <li key={item.id}><LoopRow href={loopHref({ mode: "story", promptId: item.id, story: take, retryOf: item.latest.id }, "new", 1)} look={SCENE_TILES["tell-again"]} name={item.title} times={targetWords("story", take.length)} /></li>;
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
