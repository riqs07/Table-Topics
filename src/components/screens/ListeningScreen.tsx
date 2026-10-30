"use client";
// Active listening (decision 150): the next story to hear, then every story by level, with who tells it and how many details you last caught

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the page fade round a glide (decision 141)
import { PageFade } from "@/components/scenes/SharedScene";
// Load the masthead and the page title
import { Masthead } from "@/components/script/Masthead";
import { PageTitle } from "@/components/script/PageTitle";
// Load the scene panel (decision 141)
import { ScenePanel } from "@/components/scenes/ScenePanel";
// Load the main button link and the shared press effect
import { PRESS, PrimaryLink } from "@/components/script/Buttons";
// Load the card looks and the small label look
import { CARD, CARD_LIST, LABEL } from "@/components/script/textStyles";
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
        <Masthead title="Practice" section="practice" />
        {/* The page's name */}
        <PageTitle title="Active listening">Someone tells you a story, once. Answer out loud, then see which details you caught and whether you heard what mattered.</PageTitle>
        {/* The scene, carried over from the Practice card */}
        <ScenePanel scene="listening" line="Listen for what happened, how it felt, and what matters to them." className="mt-6" />
        {/* The next one */}
        <section aria-label="Next story" className={`mt-6 p-5 ${CARD}`}>
          {/* What it is */}
          <p className={LABEL}>Next up</p>
          {/* The pick, once known (its name stays hidden until afterwards, so it gives nothing away) */}
          {next ? (
            <>
              {/* Who tells it */}
              <p data-next-story={next.id} className="mt-1 font-display text-2xl font-semibold tracking-tight">A story from {findPersona(next.personaId)?.name}</p>
              {/* The level */}
              <p className="text-footnote text-ink-muted">{LEVELS[next.level].name} · about 2 min</p>
              {/* Go */}
              <div className="mt-4"><PrimaryLink href={listenHref(next.id)}>Listen</PrimaryLink></div>
            </>
          ) : (
            // Still reading
            <p className="mt-1 text-footnote text-ink-muted">Getting ready…</p>
          )}
        </section>
        {/* Reading failed: the list still works */}
        {failed && <p role="alert" className="mt-3 text-footnote">Your past answers couldn’t be read, so every story shows as new. Listening still works.</p>}
        {/* Every level */}
        {([1, 2, 3] as ListenLevel[]).map((level) => (
          <section key={level} aria-labelledby={`level-${level}`} className="mt-8">
            {/* The level's name */}
            <h2 id={`level-${level}`} className="font-display text-xl font-semibold tracking-tight">{LEVELS[level].name}</h2>
            {/* What it asks */}
            <p className="text-footnote text-ink-muted">{LEVELS[level].about}</p>
            {/* Its stories */}
            <ul className={`mt-3 ${CARD_LIST}`}>
              {/* Each story */}
              {LISTEN_STORIES.filter((story) => story.level === level).map((story) => {
                // How it went
                const heard = progress?.[story.id];
                // Its row (the title only once heard, so a new story gives nothing away)
                return (
                  <li key={story.id}>
                    {/* The row, a link into the story */}
                    <Link href={listenHref(story.id)} className={`flex min-h-16 flex-col justify-center py-3 ${PRESS}`}>
                      {/* Its name once heard, or who tells it */}
                      <span className="font-semibold">{heard ? story.title : `A story from ${findPersona(story.personaId)?.name}`}</span>
                      {/* How it last went */}
                      <span className="text-footnote text-ink-muted">{heard ? `${findPersona(story.personaId)?.name} · best: ${heard.bestCaught} of ${heard.detailCount} details${heard.lastCore ? " · heard what mattered" : ""}` : "Not heard yet"}</span>
                    </Link>
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
