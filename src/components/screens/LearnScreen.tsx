"use client";
// The Learn page: today's mission, quick scenarios, then each set as a card that opens its own page (decisions 57, 66 and 67) Second design pass, extrapolated from Desktop Screens "Courses": "‹ Courses", the title as on Courses, the mission as storyboard 23's card, Quick scenarios with the conversation tile, and each set as a row with its icon on its own colour (as Courses' "Quick reads")

// Load React's tools
import { useEffect, useState } from "react";
// Load the scenarios icon
import { CardsIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Masthead } from "@/components/script/Masthead";
// Load Next.js's link component, and the chevron for the way back
import Link from "next/link";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
// Load the shared link look
import { TEXT_LINK } from "@/components/script/Buttons";
// Load the mode tile, the conversation's tile, and each set's colour
import { ModeTile } from "@/components/scenes/ModeTile";
import { SCENE_TILES } from "@/components/scenes/modeTileFor";
import { GROUND_SQUARE, learnSetGround } from "@/components/scenes/groundLooks";
import { CourseCard } from "@/components/script/CourseCard";
import { LEARN_SET_ICONS } from "@/components/script/learnSetIcons";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the cards
import { LEARN_GROUPS, LEARN_SETS } from "@/content/learn";
// Load the scenarios, for their count
import { SCENARIOS } from "@/content/scenarios";
// Load how many scenarios a round has, so the card says what the round will show
import { QUICK_COUNT } from "@/core/scenarios";
// Load the rules
import { nextCard, setProgress, type LearnProgress } from "@/core/learn";
// Load progress
import { loadLearnProgress } from "@/data/learnProgress";
import { loadScenarioProgress } from "@/data/scenarioProgress";
// Load the scenario progress type
import type { ScenarioProgress } from "@/data/records";
// Load what the user wants to get better at most, and the order it gives the sets (decision 97)
import { focusAreas, orderLearnGroups, readPracticeFocus, type FocusAreaId } from "@/core/practiceFocus";
// Load the shared heading look
import { SECTION_HEADING } from "@/components/script/textStyles";
// Load the shared page shell
import { PAGE } from "@/components/script/layout";
// Load today's mission and past tries
import { MissionSection } from "@/components/script/MissionSection";
// Load the loading placeholder and the mission record type
import { Skeleton } from "@/components/script/Skeleton";
import type { MissionRecord } from "@/data/records";

// Draw the Learn page
export function LearnScreen(props: ScreenProps) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // Progress, once loaded
  const [progress, setLoaded] = useState<LearnProgress | null>(null);
  // Scenario progress, once loaded
  const [scenarios, setScenarios] = useState<Record<string, ScenarioProgress> | null>(null);
  // Mission tries, once loaded (read here so the whole page appears at once; decision 76)
  const [missions, setMissions] = useState<MissionRecord[] | null>(null);
  // What the user wants to get better at most (none until read; decision 97)
  const [focus, setFocus] = useState<FocusAreaId[]>([]);

  // Load progress once in the browser
  useEffect(() => {
    // Wait for the browser
    if (!today) return;
    // Ignore the result if closed first
    let cancelled = false;
    // Load it
    loadLearnProgress(repo, today).then((loaded) => {
      // Keep it if still open
      if (!cancelled) setLoaded(loaded);
    });
    // And the scenarios'
    loadScenarioProgress(repo, today).then((loaded) => {
      // Keep it if still open
      if (!cancelled) setScenarios(loaded);
    });
    // And the mission tries
    repo.getSettings(today).then((settings) => {
      // Keep them if still open
      if (!cancelled) setMissions(settings.missions ?? []);
      // And the focus
      if (!cancelled) setFocus(readPracticeFocus(settings.practiceFocus) ?? []);
    });
    // Mark as closed
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [repo, today]);

  // The next card to read, from the focus's sets first
  const upNext = progress ? nextCard(progress, focusAreas(focus).flatMap((area) => area.learnSets)) : undefined;

  // The set the next card is in
  const nextSet = upNext ? LEARN_SETS.find((set) => set.id === upNext.set) : undefined;

  // Draw the page
  return (
    <main id="main" data-area="learn" className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="VoiceLab" section="learn" />
      {/* The way back to Courses, where Learn lives (UI rewrite) */}
      <p className="mt-1 md:-mt-12"><Link href="/courses" className={`${TEXT_LINK} -ml-1 gap-1 text-footnote text-ink-muted`}><CaretLeftIcon aria-hidden="true" weight="bold" className="size-4" />Courses</Link></p>
      {/* The page's name, and what is here, as on Courses */}
      <div className="flex flex-col gap-1">
        {/* The name */}
        <h1 className="font-display text-statement leading-none font-semibold motion-safe:animate-rise">Quick reads</h1>
        {/* One short line */}
        <p className="font-bold text-ink-muted">What the research says, and one move to try for real each day.</p>
      </div>

      {/* Until everything is read, a quiet placeholder, so nothing jumps (decision 76) */}
      {!(today && progress && scenarios && missions) && <Skeleton blocks={["h-72", "h-24", "h-28", "h-28"]} />}
      {/* Everything else, at once */}
      {today && progress && scenarios && missions && (<>
      {/* Today's mission, and how tries have gone (decision 66) */}
      <MissionSection repo={repo} today={today} initial={missions} />


      {/* Practice: quick scenarios */}
      <h2 className={`${SECTION_HEADING} mt-8`}>Practise</h2>
      {/* The scenarios card, with the conversation tile */}
      <div className="mt-3">
        {/* (Its count says a round is three of the whole bank, so it agrees with the "1 of 3" the round shows) */}
        <CourseCard href="/learn/scenarios" name="Quick scenarios" blurb="Choose the best reply, then say it aloud." icon={CardsIcon} art={<ModeTile ground={SCENE_TILES.conversation.ground} prop={SCENE_TILES.conversation.prop} face={SCENE_TILES.conversation.face} tilt={-4} className="size-18" />} done={scenarios ? Object.keys(scenarios).length : 0} total={SCENARIOS.length} count={`${QUICK_COUNT} at a time, ${SCENARIOS.length} in all`} />
      </div>

      {/* The sets, as cards in two groups (Speaking, People); each opens its own page (decision 79); with a focus, its sets come first as "For your focus" (decision 97); each set's icon on its own colour, as Courses' "Quick reads" */}
      {orderLearnGroups(focus, LEARN_GROUPS).map((group) => (
        <section key={group.name} aria-labelledby={`group-${group.name.replace(/\s+/g, "-")}`}>
          {/* The group's heading */}
          <h2 id={`group-${group.name.replace(/\s+/g, "-")}`} className={`${SECTION_HEADING} mt-8`}>{group.name}</h2>
          {/* Its sets */}
          <ul aria-label={`${group.name} sets`} className="mt-3 grid gap-3 md:grid-cols-2 md:gap-4">
            {/* Each set */}
            {group.sets.map((id) => {
              // The set
              const set = LEARN_SETS.find((item) => item.id === id);
              // Not found (cannot happen with the fixed list)
              if (!set) return null;
              // How far through
              const done = setProgress(set.id, progress);
              // One set's card
              return (
                <li key={set.id}>
                  <CourseCard href={`/learn/set?id=${set.id}`} name={set.name} blurb={set.blurb} icon={LEARN_SET_ICONS[set.id]} tone={GROUND_SQUARE[learnSetGround(set.id)]} done={done.read} total={done.total} note={set.id === nextSet?.id ? "Next up" : undefined} count={done.total === 1 ? "1 card" : `${done.total} cards`} />
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      </>)}

      {/* The main action: the next card */}
      {upNext && <ActionBand action="Next card" aside={nextSet?.name ?? "about a minute"} href={`/learn/card?id=${upNext.id}`} />}
    </main>
  );
}
