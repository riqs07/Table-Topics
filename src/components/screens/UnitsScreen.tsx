"use client";
// Every Connect unit on one page, as course cards with lessons done, the next one marked: reached from Practice's "See all" (decision 95; the address was a redirect to Learn since decision 66) Second design pass: the title on the conversation tile's tint and each unit as a card with its own mode tile, as a job's list of ways on Practice

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the chevron for the way back
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
// Load the masthead, page title and course card
import { Masthead } from "@/components/script/Masthead";
// Load the mode tile and its tints, the conversation's tile, and each unit's tile (second design pass)
import { GROUND_TINT, ModeTile } from "@/components/scenes/ModeTile";
import { SCENE_TILES } from "@/components/scenes/modeTileFor";
import { UNIT_TILES } from "@/components/scenes/groundLooks";
import { CourseCard } from "@/components/script/CourseCard";
// Load the loading placeholder
import { Skeleton } from "@/components/script/Skeleton";
// Load the shared link look
import { TEXT_LINK } from "@/components/script/Buttons";
// Load the page shell
import { PAGE } from "@/components/script/layout";
// Load the units' icons
import { UNIT_ICONS } from "@/components/script/unitIcons";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the units' progress and the next one
import { nextUnit, unitProgress, type UnitProgress } from "@/core/units";

// Draw the page
export function UnitsScreen(props: ScreenProps) {
  // The repository
  const { repo } = useScreenBasics(props);
  // Each unit's progress, and the next unit's id (null while loading)
  const [units, setUnits] = useState<{ all: UnitProgress[]; next: string } | null>(null);

  // Read the sessions once in the browser
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read them, and work out each unit's progress; a failure shows every unit as new
    repo.listSessions().then((sessions) => {
      // Keep them if still open
      if (!cancelled) setUnits({ all: unitProgress(sessions), next: nextUnit(sessions).unit.id });
    }, () => {
      // Every unit as new
      if (!cancelled) setUnits({ all: unitProgress([]), next: nextUnit([]).unit.id });
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo]);

  // Draw it
  return (
    <main id="main" className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="VoiceLab" section="practice" />
      {/* Back to Practice */}
      <p className="mt-1 md:-mt-12"><Link href="/practice" className={`${TEXT_LINK} -ml-1 gap-1 text-footnote text-ink-muted`}><CaretLeftIcon aria-hidden="true" weight="bold" className="size-4" />Practice</Link></p>
      {/* The page's name on the conversation tile's tint, as a job's list of ways on Practice */}
      <div data-wide className={`mt-3 flex items-center gap-4 rounded-[22px] p-4 md:gap-5 md:p-5 ${GROUND_TINT[SCENE_TILES.conversation.ground]}`}>
        {/* The conversation tile */}
        <ModeTile ground={SCENE_TILES.conversation.ground} prop={SCENE_TILES.conversation.prop} face={SCENE_TILES.conversation.face} tilt={-4} motion="loop" className="size-20 md:size-24" />
        {/* The name and what is here */}
        <div className="min-w-0">
          {/* The name */}
          <h1 className="font-display text-statement leading-tight font-semibold">Everyday conversation</h1>
          {/* One short line */}
          <p className="font-bold text-ink">Seven skills, each with short lessons, a drill and missions to try for real.</p>
        </div>
      </div>
      {/* Until the sessions are read, a quiet placeholder (decision 76) */}
      {!units && <Skeleton blocks={["h-20", "h-20", "h-20"]} />}
      {/* The units, in order */}
      {units && (
        <ul aria-label="Units" data-wide className="mt-5 grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {/* Each unit's card */}
          {units.all.map((item) => (
            // One unit
            <li key={item.unit.id}>
              <CourseCard href={`/small-talk/unit?id=${item.unit.id}`} name={item.unit.name} blurb={item.unit.when} icon={UNIT_ICONS[item.unit.id]} art={<ModeTile ground={UNIT_TILES[item.unit.id].ground} prop={UNIT_TILES[item.unit.id].prop} face={UNIT_TILES[item.unit.id].face} tilt={item.unit.id.length % 2 ? -4 : 4} className="size-18" />} done={item.lessonsDone} total={item.lessonsTotal} note={item.unit.id === units.next ? "Next up" : undefined} count={`${item.lessonsTotal} lessons`} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
