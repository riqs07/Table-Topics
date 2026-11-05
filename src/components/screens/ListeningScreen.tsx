"use client";
// Active listening (decision 150): the next story to hear, then every story by level, with who tells it and how many details you last caught. Laid out in the UI rewrite's second pass from Desktop Screens "Practice": "‹ Practice", the title, the next story as the sky band, then each level's stories as tile cards (an ear on the level's ground, the blob pleased once you heard what mattered)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the page fade round a glide (decision 141)
import { PageFade } from "@/components/scenes/SharedScene";
// Load the masthead
import { Masthead } from "@/components/script/Masthead";
// Load the list page's title and the next-up band
import { HubTitle } from "@/components/script/HubTitle";
import { NextUpBand } from "@/components/script/NextUpBand";
// Load the card with a tile
import { TileRow } from "@/components/script/TileRow";
// Load the cast
import { Cast } from "@/components/scenes/Cast";
// Load the tile grounds
import type { TileGround } from "@/components/scenes/ModeTile";
// Load the shared heading look
import { SECTION_HEADING } from "@/components/script/textStyles";
// Load the page shell
import { PAGE } from "@/components/script/layout";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the stories and their levels
import { LEVELS, LISTEN_STORIES, type ListenLevel } from "@/content/listening";
// Load the people, for their names
import { findPersona } from "@/content/conversations";
// Load the next story and the address
import { listenHref, nextStory } from "@/core/listening";
// Load the progress loader
import { loadListenProgress } from "@/data/practiceProgress";
// Load the record type
import type { ListenProgress } from "@/data/records";

// Each level's ground for its stories' tiles, so the levels read apart at a glance
const LEVEL_GROUNDS: Readonly<Record<ListenLevel, TileGround>> = { 1: "sky", 2: "leaf", 3: "plum" };

// Draw the page
export function ListeningScreen(props: ScreenProps) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // Every story's progress (null while loading)
  const [progress, setProgress] = useState<Record<string, ListenProgress> | null>(null);
  // Whether reading it failed
  const [failed, setFailed] = useState(false);

  // Read the progress once in the browser
  useEffect(() => {
    // Wait for the date
    if (!today) return;
    // Ignore the result if closed first
    let cancelled = false;
    // Read it, showing the list without progress if that fails
    loadListenProgress(repo, today)
      .then((loaded) => {
        // Keep it if still open
        if (!cancelled) setProgress(loaded);
      })
      .catch(() => {
        // Say so, and carry on with none
        if (!cancelled) {
          // Noted
          setFailed(true);
          // Treated as nothing heard
          setProgress({});
        }
      });
    // Mark as closed
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [repo, today]);

  // The story to hear next, once progress is read
  const next = progress ? nextStory(progress) : null;

  // Draw it
  return (
    <PageFade>
      <main id="main" className={PAGE}>
        {/* Heading and navigation */}
        <Masthead title="VoiceLab" section="practice" />
        {/* The way back, the page's name, and the two of you, one telling and one listening */}
        <HubTitle title="Active listening" line="Someone tells you a story, once. Answer out loud, then see which details you caught and whether you heard what mattered." figure={<span className="flex items-end gap-1"><Cast who="friend" face="happy" className="size-16" /><Cast who="you" face="listen" className="size-18" /></span>} />
        {/* The next one, on the sky (its name stays hidden until afterwards, so it gives nothing away; the tile carried over from the Practice card, decision 141) */}
        <div data-wide className="mt-5 md:mt-7">
          <NextUpBand scene="listening" ariaLabel="Next story" label={next ? `Next up · ${LEVELS[next.level].name} · about 2 min` : "Next up"} name={next ? <span data-next-story={next.id}>A story from {findPersona(next.personaId)?.name}</span> : null} line="Listen for what happened, how it felt, and what matters to them." href={next ? listenHref(next.id) : null} go="Listen" />
        </div>
        {/* Reading failed: the list still works */}
        {failed && <p role="alert" className="mt-3 text-footnote font-bold">Your past answers couldn’t be read, so every story shows as new. Listening still works.</p>}
        {/* Every level */}
        {([1, 2, 3] as ListenLevel[]).map((level) => (
          <section key={level} aria-labelledby={`level-${level}`} data-wide className="mt-8">
            {/* The level's name */}
            <h2 id={`level-${level}`} className={SECTION_HEADING}>{LEVELS[level].name}</h2>
            {/* What it asks */}
            <p className="mt-1 text-footnote font-bold text-ink-muted">{LEVELS[level].about}</p>
            {/* Its stories, as tile cards, three across on a computer */}
            <ul className="mt-4 grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
              {/* Each story */}
              {LISTEN_STORIES.filter((story) => story.level === level).map((story, index) => {
                // How it went
                const heard = progress?.[story.id];
                // Who tells it
                const name = findPersona(story.personaId)?.name;
                // Its card (the title only once heard, so a new story gives nothing away)
                return (
                  <li key={story.id}>
                    <TileRow href={listenHref(story.id)} label={heard ? story.title : `A story from ${name}`} title={heard ? story.title : `A story from ${name}`} detail={heard ? `${name} · best: ${heard.bestCaught} of ${heard.detailCount} details${heard.lastCore ? " · heard what mattered" : ""}` : "Not heard yet"} ground={LEVEL_GROUNDS[level]} prop="ear" face={heard ? (heard.lastCore ? "happy" : "ready") : "listen"} tilt={index % 2 ? 4 : -4} />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>
    </PageFade>
  );
}
