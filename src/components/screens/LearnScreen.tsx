"use client";
// The Learn page: today's mission, quick scenarios, then each set as a card that opens its own page (decisions 57, 66 and 67)

// Load React's tools
import { useEffect, useState } from "react";
// Load the scenarios icon
import { CardsIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Masthead } from "@/components/script/Masthead";
// Load the shared page title
import { PageTitle } from "@/components/script/PageTitle";
import { CourseCard } from "@/components/script/CourseCard";
import { LEARN_SET_ICONS } from "@/components/script/learnSetIcons";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the cards
import { LEARN_CARDS, LEARN_SETS } from "@/content/learn";
// Load the scenarios, for their count
import { SCENARIOS } from "@/content/scenarios";
// Load the rules
import { nextCard, setProgress, type LearnProgress } from "@/core/learn";
// Load progress
import { loadLearnProgress } from "@/data/learnProgress";
import { loadScenarioProgress } from "@/data/scenarioProgress";
// Load the scenario progress type
import type { ScenarioProgress } from "@/data/records";
// Load the shared heading look
import { SECTION_HEADING } from "@/components/script/textStyles";
// Load the shared page shell
import { PAGE } from "@/components/script/layout";
// Load today's mission and past tries
import { MissionSection } from "@/components/script/MissionSection";

// Draw the Learn page
export function LearnScreen(props: ScreenProps) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // Progress, once loaded
  const [progress, setLoaded] = useState<LearnProgress | null>(null);
  // Scenario progress, once loaded
  const [scenarios, setScenarios] = useState<Record<string, ScenarioProgress> | null>(null);

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
    // Mark as closed
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [repo, today]);

  // The next card to read
  const upNext = progress ? nextCard(progress) : undefined;

  // The set the next card is in
  const nextSet = upNext ? LEARN_SETS.find((set) => set.id === upNext.set) : undefined;

  // Draw the page
  return (
    <main data-area="learn" className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="VoiceLab" section="learn" />
      {/* The page's name, and what is here */}
      <PageTitle title="Learn">What the research says, and one move to try for real each day.</PageTitle>

      {/* Today's mission, and how tries have gone (decision 66) */}
      {today && <MissionSection repo={repo} today={today} />}


      {/* Practice: quick scenarios */}
      <h2 className={`${SECTION_HEADING} mt-6`}>Practise</h2>
      {/* The scenarios card */}
      <div className="mt-2">
        <CourseCard href="/learn/scenarios" name="Quick scenarios" blurb="Choose the best reply, then say it aloud." icon={CardsIcon} done={scenarios ? Object.keys(scenarios).length : 0} total={SCENARIOS.length} count={`${SCENARIOS.length} scenarios`} />
      </div>

      {/* The sets, as cards; each opens its own page */}
      <h2 className={`${SECTION_HEADING} mt-8`}>Sets</h2>
      {/* The cards */}
      <ul aria-label="Sets" className="mt-2 grid gap-3 md:grid-cols-2">
        {/* Each set */}
        {LEARN_SETS.map((set) => {
          // How far through
          const done = progress ? setProgress(set.id, progress) : { read: 0, total: LEARN_CARDS.filter((card) => card.set === set.id).length };
          // One set's card
          return (
            <li key={set.id}>
              <CourseCard href={`/learn/set?id=${set.id}`} name={set.name} blurb={set.blurb} icon={LEARN_SET_ICONS[set.id]} done={done.read} total={done.total} note={set.id === nextSet?.id ? "Next up" : undefined} count={done.total === 1 ? "1 card" : `${done.total} cards`} />
            </li>
          );
        })}
      </ul>

      {/* The main action: the next card */}
      {upNext && <ActionBand action="Next card" aside={nextSet?.name ?? "about a minute"} href={`/learn/card?id=${upNext.id}`} />}
    </main>
  );
}
