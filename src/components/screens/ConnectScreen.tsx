"use client";
// Connect: today's mission with how missions have gone, then the four units as cards that open their own pages, and one moment a day (decision 57)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the moment icon
import { SunHorizonIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { CourseCard } from "@/components/script/CourseCard";
import { Masthead } from "@/components/script/Masthead";
// Load the shared page title
import { PageTitle } from "@/components/script/PageTitle";
import { MissionCard } from "@/components/script/MissionCard";
import { UNIT_ICONS } from "@/components/script/unitIcons";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the small-talk content
import { MOMENT_PROMPT, SMALL_TALK_LESSONS, UNITS, lessonsFor } from "@/content/smallTalk";
// Load the missions
import { findMission } from "@/content/missions";
// Load the mission rules
import { betterThanFeared, missionToday, triedMissions } from "@/core/missions";
// Load the day label and calendar-day key
import { dayLabel } from "@/core/copy";
import { dayKey } from "@/core/dates";
// Load the record types
import type { MissionRecord, SessionRecord } from "@/data/records";
// Load the shared heading look
import { SECTION_HEADING } from "@/components/script/textStyles";

// How many recent missions to list
const RECENT_MISSIONS = 5;

// Draw the Connect page
export function ConnectScreen(props: ScreenProps) {
  // The repository and today (null until in the browser)
  const { repo, today } = useScreenBasics(props);
  // The user's small-talk answers, newest first (null while loading)
  const [answers, setAnswers] = useState<SessionRecord[] | null>(null);
  // The user's moment notes, newest first
  const [moments, setMoments] = useState<SessionRecord[]>([]);
  // The mission tries, oldest first (null while loading)
  const [missions, setMissions] = useState<MissionRecord[] | null>(null);

  // Load once in the browser
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the sessions
    repo.listSessions().then((sessions) => {
      // Stop if closed
      if (cancelled) return;
      // The answers
      setAnswers(sessions.filter((session) => session.mode === "smalltalk"));
      // The moments
      setMoments(sessions.filter((session) => session.mode === "moment"));
    });
    // Read the mission tries
    repo.getSettings(new Date()).then((settings) => {
      // Keep them if still open
      if (!cancelled) setMissions(settings.missions ?? []);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo]);

  // The lessons answered at least once
  const answered = new Set((answers ?? []).map((answer) => answer.promptId));
  // The first lesson not yet done, across the units in order (none once all are)
  const nextLesson = SMALL_TALK_LESSONS.find((lesson) => !answered.has(lesson.id));
  // Today's moments
  const momentsToday = today ? moments.filter((moment) => dayKey(new Date(moment.createdAt)) === dayKey(today)).length : 0;

  // Draw the page
  return (
    <main className="mx-auto min-h-dvh max-w-5xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Heading and navigation */}
      <Masthead title="VoiceLab" section="smalltalk" />
      {/* The page's name, and what is here */}
      <PageTitle title="Connect">Everyday conversation, practised out loud, then tried for real.</PageTitle>

      {/* Today's mission, and how missions have gone against what you expected */}
      {today && missions && (
        <section id="missions" aria-labelledby="missions-heading" className="mt-6 scroll-mt-6">
          {/* Small heading */}
          <h2 id="missions-heading" className="sr-only">Try it for real</h2>
          {/* The card */}
          <MissionCard key={missions.length} repo={repo} now={today} state={missionToday(missions, today)} onChange={setMissions} />
          {/* Expected against actual, for the latest tries */}
          {triedMissions(missions).length > 0 && (
            <>
              {/* The headline */}
              <p className="mt-4 text-lede">{betterThanFeared(missions).better} of {betterThanFeared(missions).total} went better than you expected.</p>
              {/* The latest */}
              <ul aria-label="Your missions" className="mt-2 divide-y divide-rule border-y border-rule">
                {/* Each try */}
                {triedMissions(missions).slice(0, RECENT_MISSIONS).map((record) => (
                  // One try: the move, then expected against actual as two short bars
                  <li key={record.id} className="flex items-center gap-4 py-3">
                    {/* The move and day */}
                    <span className="min-w-0 flex-1">
                      {/* The move */}
                      <span className="block">{findMission(record.missionId)?.move ?? "Mission"}</span>
                      {/* The day */}
                      <span className="block text-footnote text-ink-muted">{dayLabel(new Date(record.debriefedAt ?? record.day), today)}</span>
                    </span>
                    {/* Expected against actual */}
                    <span aria-label={`Expected ${record.predicted} of 5, went ${record.outcome} of 5`} className="flex w-32 flex-none flex-col gap-1">
                      {/* Expected */}
                      <span aria-hidden="true" className="flex items-center gap-2 text-footnote text-ink-muted"><span className="w-10">said</span><span className="h-1.5 bg-rule" style={{ width: `${(record.predicted ?? 0) * 12}px` }} /></span>
                      {/* Actual */}
                      <span aria-hidden="true" className="flex items-center gap-2 text-footnote"><span className="w-10">went</span><span className="h-1.5 bg-accent" style={{ width: `${(record.outcome ?? 0) * 12}px` }} /></span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {/* The units, as cards; each opens its own page */}
      <h2 className={`${SECTION_HEADING} mt-8`}>Skills</h2>
      {/* The cards */}
      <ul aria-label="Units" className="mt-2 grid gap-3 md:grid-cols-2">
        {/* Each unit */}
        {UNITS.map((unit) => {
          // Its lessons
          const lessons = lessonsFor(unit.id);
          // One unit's card
          return (
            <li key={unit.id}>
              <CourseCard href={`/small-talk/unit?id=${unit.id}`} name={unit.name} blurb={unit.when} icon={UNIT_ICONS[unit.id]} done={lessons.filter((lesson) => answered.has(lesson.id)).length} total={lessons.length} note={unit.id === nextLesson?.unit ? "Next up" : undefined} count={lessons.length === 1 ? "1 lesson" : `${lessons.length} lessons`} />
            </li>
          );
        })}
      </ul>

      {/* One moment a day */}
      <h2 className={`${SECTION_HEADING} mt-8`}>Every day</h2>
      {/* Its card */}
      <div className="mt-2">
        <CourseCard href={`/session?mode=moment&prompt=${MOMENT_PROMPT.id}`} name="One moment a day" blurb={momentsToday > 0 ? "Today’s moment is saved. Add another?" : "Note one thing from today worth telling."} icon={SunHorizonIcon} done={Math.min(momentsToday, 1)} total={1} />
      </div>

      {/* The main action: the next lesson, across the units */}
      {nextLesson && <ActionBand action={`${UNITS.find((unit) => unit.id === nextLesson.unit)?.name} lesson ${nextLesson.number}`} aside={nextLesson.title} href={`/session?mode=smalltalk&prompt=${nextLesson.id}`} />}
    </main>
  );
}
