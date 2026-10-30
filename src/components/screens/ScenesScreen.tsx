"use client";
// Scenes (decision 149): the next scene to play, then every scene with who it is with and how it last went

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
// Load the scenes
import { SCENES } from "@/content/scenes";
// Load the people, for their names
import { findPersona } from "@/content/conversations";
// Load the next scene and the moods
import { moodFor, nextScene, sceneHref } from "@/core/scenes";
// Load the progress loader
import { loadSceneProgress } from "@/data/practiceProgress";
// Load the record type
import type { SceneProgress } from "@/data/records";

// The skill each scene practises, as shown (the four units scenes use)
const SKILLS: Readonly<Record<string, string>> = { answering: "Answering", asking: "Asking", listening: "Listening", news: "Good news" };

// How the best play left them, as shown
const MOOD_WORDS = { pleased: "at best they were pleased", easy: "at best they were at ease", deflated: "they ended deflated" } as const;

// Draw the page
export function ScenesScreen(props: ScreenProps) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // Every scene's progress (null while loading)
  const [progress, setProgress] = useState<Record<string, SceneProgress> | null>(null);
  // Whether reading it failed
  const [failed, setFailed] = useState(false);

  // Read the progress once in the browser
  useEffect(() => {
    // Wait for the date
    if (!today) return;
    // Ignore the result if closed first
    let cancelled = false;
    // Read it, showing the list without progress if that fails
    loadSceneProgress(repo, today)
      .then((loaded) => {
        // Keep it if still open
        if (!cancelled) setProgress(loaded);
      })
      .catch(() => {
        // Say so, and carry on with none
        if (!cancelled) {
          // Noted
          setFailed(true);
          // Treated as nothing played
          setProgress({});
        }
      });
    // Mark as closed
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [repo, today]);

  // The scene to play next, once progress is read
  const next = progress ? nextScene(progress) : null;

  // Draw it
  return (
    <PageFade>
      <main id="main" className={PAGE}>
        {/* Heading and navigation */}
        <Masthead title="Practice" section="practice" />
        {/* The page's name */}
        <PageTitle title="Scenes">A short conversation. Choose your replies and they answer to what you chose. The last reply is yours, out loud.</PageTitle>
        {/* The scene, carried over from the Practice card */}
        <ScenePanel scene="scenes" line="Every reply changes how they answer." className="mt-6" />
        {/* The next one */}
        <section aria-label="Next scene" className={`mt-6 p-5 ${CARD}`}>
          {/* What it is */}
          <p className={LABEL}>Next up</p>
          {/* The pick, once known */}
          {next ? (
            <>
              {/* Its name and who it is with */}
              <p data-next-scene={next.id} className="mt-1 font-display text-2xl font-semibold tracking-tight">{next.title}</p>
              {/* Who, and the skill */}
              <p className="text-footnote text-ink-muted">With {findPersona(next.personaId)?.name} · {SKILLS[next.unit] ?? next.unit} · about 2 min</p>
              {/* Go */}
              <div className="mt-4"><PrimaryLink href={sceneHref(next.id)}>Play this scene</PrimaryLink></div>
            </>
          ) : (
            // Still reading
            <p className="mt-1 text-footnote text-ink-muted">Getting ready…</p>
          )}
        </section>
        {/* Reading failed: the list still works */}
        {failed && <p role="alert" className="mt-3 text-footnote">Your past plays couldn’t be read, so every scene shows as new. Playing still works.</p>}
        {/* Every scene */}
        <section aria-labelledby="all-scenes" className="mt-8">
          {/* The heading */}
          <h2 id="all-scenes" className="font-display text-xl font-semibold tracking-tight">All scenes</h2>
          {/* The list */}
          <ul className={`mt-3 ${CARD_LIST}`}>
            {/* Each scene */}
            {SCENES.map((scene) => {
              // How it went
              const played = progress?.[scene.id];
              // Its row
              return (
                <li key={scene.id}>
                  {/* The row, a link into the scene */}
                  <Link href={sceneHref(scene.id)} className={`flex min-h-16 flex-col justify-center py-3 ${PRESS}`}>
                    {/* Its name */}
                    <span className="font-semibold">{scene.title}</span>
                    {/* Who, the skill, and how it last went */}
                    <span className="text-footnote text-ink-muted">
                      {findPersona(scene.personaId)?.name} · {SKILLS[scene.unit] ?? scene.unit}
                      {played ? ` · played ${played.plays === 1 ? "once" : `${played.plays} times`}, ${MOOD_WORDS[moodFor(Number(played.bestWarmth) || 0)]}` : ""}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </PageFade>
  );
}
