"use client";
// The 4/3/2 drill as its own page (decision 126; the loop itself is decision 118): say the same content three times in one sitting, each round shorter, on today's prepared-speech topic, today's story, or one of the user's own stories told again. It left the story set-up and the recording page, where it was an option

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the page heading with the main navigation, and the page title
import { Masthead } from "@/components/script/Masthead";
import { PageTitle } from "@/components/script/PageTitle";
// Load the shared row link
import { RowLink } from "@/components/script/Buttons";
// Load the shared screen set-up
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the day's prepared-speech topic and story prompt
import { promptForDay } from "@/content/prompts";
import { findStoryTemplate, storyPromptForDay, suggestedTemplate } from "@/content/stories";
// Load the loop's addresses and times
import { loopHref, targetWords } from "@/core/fourThreeTwo";
// Load the user's stories
import { storyLibrary, type LibraryStory } from "@/core/storyLibrary";
// Load the shared heading and card looks
import { CARD_LIST, SECTION_HEADING } from "@/components/script/textStyles";
// Load the shared page shell
import { PAGE } from "@/components/script/layout";

// How many of the user's stories to offer
const STORIES_SHOWN = 5;

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
      {/* The page's name and what it is */}
      <PageTitle title="4/3/2">Say the same thing three times, each round shorter. The squeeze makes it flow.</PageTitle>

      {/* The day's two */}
      <section aria-labelledby="loop-today" className="mt-8">
        {/* Heading */}
        <h2 id="loop-today" className={SECTION_HEADING}>Today</h2>
        {/* The rows */}
        <ul aria-label="Today's 4/3/2" className={`mt-2 ${CARD_LIST}`}>
          {/* Today's prepared speech */}
          {topic && <li><RowLink href={loopHref({ mode: "response", promptId: topic.id }, "new", 1)} label={`Prepared speech: ${topic.text}`}><span className="block font-semibold">Prepared speech</span><span className="block text-footnote text-ink-muted">{topic.text}</span><span className="block text-footnote text-accent">{targetWords("response")}</span></RowLink></li>}
          {/* Today's story, with its suggested template */}
          {story && <li><RowLink href={loopHref({ mode: "story", promptId: story.id, story: { template: suggestedTemplate(story.id), focus: null, length: "full" } }, "new", 1)} label={`Story: ${story.text}`}><span className="block font-semibold">A story</span><span className="block text-footnote text-ink-muted">{story.text}</span><span className="block text-footnote text-accent">{findStoryTemplate(suggestedTemplate(story.id)).name} · {targetWords("story", "full")}</span></RowLink></li>}
        </ul>
      </section>

      {/* The user's own stories, told again three times */}
      {stories.length > 0 && (
        <section aria-labelledby="loop-yours" className="mt-10">
          {/* Heading */}
          <h2 id="loop-yours" className={SECTION_HEADING}>Your stories</h2>
          {/* The rows */}
          <ul aria-label="Your stories" className={`mt-2 ${CARD_LIST}`}>
            {/* Each story, with the set-up it was last told with */}
            {stories.slice(0, STORIES_SHOWN).map((item) => {
              // The set-up it was last told with (a story from before set-ups were saved gets its suggested template)
              const take = item.latest.story ?? { template: suggestedTemplate(item.id), focus: null, length: "full" as const };
              // One row
              return <li key={item.id}><RowLink href={loopHref({ mode: "story", promptId: item.id, story: take, retryOf: item.latest.id }, "new", 1)} label={`Your story: ${item.title}`}><span className="block font-semibold">{item.title}</span><span className="block text-footnote text-accent">{targetWords("story", take.length)}</span></RowLink></li>;
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
