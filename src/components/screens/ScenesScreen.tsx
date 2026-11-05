"use client";
// Scenes (decision 149): the next scene to play, then every scene with who it is with and how it last went. Laid out in the UI rewrite's second pass from Desktop Screens "Practice": "‹ Practice", the title, the next scene as the sky band, then every scene as a tile card (its skill's tile, the blob's face from how it last went)

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
// Load each skill's tile
import { skillTile } from "@/components/scenes/skillTileFor";
// Load the face names
import type { FaceName } from "@/components/scenes/Scene";
// Load the shared heading look
import { SECTION_HEADING } from "@/components/script/textStyles";
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

// The blob's face on a scene's tile, from how the best play left them
const MOOD_FACES: Readonly<Record<keyof typeof MOOD_WORDS, FaceName>> = { pleased: "happy", easy: "ready", deflated: "flat" };

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
        <Masthead title="VoiceLab" section="practice" />
        {/* The way back, the page's name, and the two of you */}
        <HubTitle title="Scenes" line="A short conversation. Choose your replies and they answer to what you chose. The last reply is yours, out loud." figure={<span className="flex items-end gap-1"><Cast who="you" face="wonder" className="size-18" /><Cast who="friend" face="ready" className="size-16" /></span>} />
        {/* The next one, on the sky (the tile carried over from the Practice card, decision 141) */}
        <div data-wide className="mt-5 md:mt-7">
          <NextUpBand scene="scenes" ariaLabel="Next scene" label="Next up · about 2 min" name={next ? <span data-next-scene={next.id}>{next.title}</span> : null} line={next ? `With ${findPersona(next.personaId)?.name} · ${SKILLS[next.unit] ?? next.unit}` : undefined} href={next ? sceneHref(next.id) : null} go="Play this scene" />
        </div>
        {/* Reading failed: the list still works */}
        {failed && <p role="alert" className="mt-3 text-footnote font-bold">Your past plays couldn’t be read, so every scene shows as new. Playing still works.</p>}
        {/* Every scene */}
        <section aria-labelledby="all-scenes" data-wide className="mt-8">
          {/* The heading */}
          <h2 id="all-scenes" className={SECTION_HEADING}>All scenes</h2>
          {/* The cards, two across on a computer */}
          <ul className="mt-4 grid gap-3 md:grid-cols-2 md:gap-4">
            {/* Each scene */}
            {SCENES.map((scene, index) => {
              // How it went
              const played = progress?.[scene.id];
              // How the best play left them
              const mood = played ? moodFor(Number(played.bestWarmth) || 0) : null;
              // Its skill's tile
              const look = skillTile(scene.unit);
              // Who, the skill, and how it last went
              const detail = `${SKILLS[scene.unit] ?? scene.unit}${played && mood ? ` · played ${played.plays === 1 ? "once" : `${played.plays} times`}, ${MOOD_WORDS[mood]}` : " · not played yet"}`;
              // Its card, a link into the scene
              return (
                <li key={scene.id}>
                  <TileRow href={sceneHref(scene.id)} label={`With ${findPersona(scene.personaId)?.name}`} title={scene.title} detail={detail} ground={look.ground} prop={look.prop} face={mood ? MOOD_FACES[mood] : look.face} tilt={index % 2 ? 4 : -4} />
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </PageFade>
  );
}
