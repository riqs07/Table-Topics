"use client";
// The Courses tab (decisions 131 and 148; second design pass, Desktop Screens "Courses" and storyboard 19): "Keep going" as a wide card (the course tile, the next lesson and its minutes, a chunky bar counted in lessons, Continue), "For you" as picture cards with how many lessons (your focus's and started courses first, the rest one tap away), then Learn's card sets as "Quick reads"

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the icon for a course
import { LightningIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
import { CourseCard } from "@/components/script/CourseCard";
import { Skeleton } from "@/components/script/Skeleton";
import { CourseLoadFailed } from "@/components/script/CourseLoadFailed";
// Load the shared looks
import { CARD, SECTION_HEADING } from "@/components/script/textStyles";
import { PRESS, TEXT_LINK } from "@/components/script/Buttons";
import { PAGE } from "@/components/script/layout";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the course data and the tab title helper
import { useCourseData } from "@/components/screens/useCourseData";
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the course tiles and which one stands for a course (decision 142)
import { CourseTile } from "@/components/scenes/CourseTile";
import { courseTile } from "@/components/scenes/tileFor";
// Load the course rules
import { courseCount, courseToOffer, nextPart, type CourseProgress } from "@/core/courses";
import { lessonMinutes, lessonsDone } from "@/core/coursePath";
// Load the focus areas, for the course to offer first
import { focusAreas, readPracticeFocus, type FocusAreaId } from "@/core/practiceFocus";
// Load the courses
import { COURSES, type Course } from "@/content/courses";
// Load Learn's sets, their icons and their card counts
import { LEARN_SETS } from "@/content/learn";
import { LEARN_SET_ICONS } from "@/components/script/learnSetIcons";
import { setProgress } from "@/core/learn";

// How many courses "For you" shows before "All"
const FOR_YOU = 5;
// How many quick reads show
const READS = 3;
// The quick reads' icon squares, in turn
const READ_COLOURS: ReadonlyArray<string> = ["bg-art-plum text-art-cream", "bg-art-bloom text-on-warm", "bg-art-leaf text-on-warm"];

// One course as a card (the wide one for "Keep going", a picture card otherwise)
export function CourseRow({ course, progress, note, layout = "stacked" }: { course: Course; progress: CourseProgress; note?: string; layout?: "row" | "stacked" | "hero" }) {
  // How far through, in lessons
  const lessons = lessonsDone(course, progress);
  // The next part
  const next = nextPart(course, progress);
  // Its tile, if it has one
  const tile = courseTile(course.id);
  // The line: the next lesson and its minutes on the wide card, else what the course does
  const line = layout === "hero" && next ? `Next: Lesson ${next.lessonNumber}, ${next.lesson.title} · about ${lessonMinutes(next.lesson)} minutes` : course.blurb;
  // The card
  return <CourseCard href={`/courses/course?id=${course.id}`} name={course.title} blurb={line} icon={LightningIcon} art={tile ? <CourseTile name={tile} motion="few" className={layout === "hero" ? "size-22 md:size-38" : layout === "row" ? "size-18" : "size-24 md:size-32"} /> : undefined} layout={layout} done={layout === "row" ? courseCount(course, progress).done : lessons.done} total={layout === "row" ? courseCount(course, progress).total : lessons.total} unit="lessons" note={note} count={`${course.lessons.length} lessons`} />;
}

// Draw the tab
export function CoursesScreen(props: ScreenProps) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // Name the tab
  usePageTitle("Courses");
  // Progress
  const data = useCourseData(repo, today);
  // What the user wants to get better at most (none until read, or when it cannot be read)
  const [focus, setFocus] = useState<FocusAreaId[]>([]);
  // Whether every course is showing
  const [all, setAll] = useState(false);
  // Read the focus once in the browser
  useEffect(() => {
    // Wait for the browser
    if (!today) return;
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the settings, keeping no focus if they cannot be read
    repo.getSettings(today).then((settings) => {
      // Keep the focus if still open
      if (!cancelled) setFocus(readPracticeFocus(settings.practiceFocus) ?? []);
    }, () => undefined);
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today]);
  // Your course: one started, else the first unfinished for your focus, else none (the same rule as Today)
  const yours = data.status === "ready" ? courseToOffer(focus, data.progress) : null;
  // The other courses: started ones first, then your focus's, then the rest in their usual order
  const others = data.status === "ready" ? COURSES.filter((course) => course !== yours).map((course, index) => ({ course, rank: (courseCount(course, data.progress).done > 0 ? 0 : focus.includes(course.focus) ? 1 : 2) * 100 + index })).sort((a, b) => a.rank - b.rank).map((item) => item.course) : [];
  // The courses shown
  const shown = all ? others : others.slice(0, FOR_YOU);
  // The quick reads: your focus's sets first, then the rest
  const focusSets = focusAreas(focus).flatMap((area) => area.learnSets);
  // (in that order)
  const reads = [...LEARN_SETS].sort((a, b) => (focusSets.includes(a.id) ? 0 : 1) - (focusSets.includes(b.id) ? 0 : 1)).slice(0, READS);
  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* Title and navigation, in the Courses tab */}
      <Masthead title="VoiceLab" section="courses" />
      {/* The page's name, and what courses are */}
      <div className="mt-4 flex flex-col gap-1 md:-mt-12">
        {/* The name */}
        <h1 className="font-display text-statement leading-none font-semibold motion-safe:animate-rise">Courses</h1>
        {/* One short line */}
        <p className="font-bold text-ink-muted">Short lessons that build on each other. Every one is open.</p>
      </div>
      {/* Loading, failed, or the lists */}
      {data.status === "loading" && <Skeleton blocks={["h-40", "h-56"]} />}
      {data.status === "failed" && <CourseLoadFailed retry={data.retry} />}
      {data.status === "ready" && (
        <>
          {/* Your course, when there is one */}
          {yours && (
            <section aria-label="Keep going" data-wide className="mt-5 md:mt-8">
              {/* The wide card */}
              <CourseRow course={yours} progress={data.progress} layout="hero" note={courseCount(yours, data.progress).done > 0 ? "Keep going" : "For your focus"} />
            </section>
          )}
          {/* The other courses */}
          <section aria-labelledby="for-you" data-wide className="mt-7 md:mt-8">
            {/* Heading, and every course */}
            <div className="flex items-baseline justify-between gap-4">
              {/* Heading */}
              <h2 id="for-you" className={SECTION_HEADING}>{yours || focus.length > 0 ? "For you" : "All courses"}</h2>
              {/* Every course, opened here */}
              {others.length > FOR_YOU && <button type="button" aria-expanded={all} aria-controls="course-cards" onClick={() => setAll(!all)} className={`${TEXT_LINK} text-footnote`}>{all ? "Show fewer" : `All ${others.length}`}</button>}
            </div>
            {/* The cards */}
            <ul id="course-cards" className="mt-3 grid grid-cols-2 gap-3.5 md:mt-4 md:grid-cols-3 md:gap-5 lg:grid-cols-5">
              {/* Each course, your focus's marked (four on a phone, two by two, until "All") */}
              {shown.map((course, index) => <li key={course.id} className={!all && index === FOR_YOU - 1 ? "hidden md:block" : undefined}><CourseRow course={course} progress={data.progress} note={focus.includes(course.focus) ? "For your focus" : undefined} /></li>)}
            </ul>
          </section>
          {/* Learn's sets, as quick reads: one idea and a move to try (UI rewrite: Learn lives under Courses) */}
          <section aria-labelledby="quick-reads" data-wide className="mt-7 md:mt-8">
            {/* Heading, and every set */}
            <div className="flex items-baseline justify-between gap-4">
              {/* Heading */}
              <h2 id="quick-reads" className={SECTION_HEADING}>Quick reads</h2>
              {/* Every set, on Learn's page */}
              <Link href="/learn" className={`${TEXT_LINK} text-footnote`}>All {LEARN_SETS.length} sets</Link>
            </div>
            {/* A few sets */}
            <ul className="mt-3 grid gap-3 md:mt-4 md:grid-cols-3 md:gap-4.5">
              {/* Each one */}
              {reads.map((set, index) => {
                // Its icon
                const SetIcon = LEARN_SET_ICONS[set.id];
                // How many cards
                const cards = setProgress(set.id, {}).total;
                // The row
                return (
                  <li key={set.id}>
                    <Link href={`/learn/set?id=${set.id}`} className={`flex min-h-18 items-center gap-3.5 px-4 py-3.5 ${CARD} ${PRESS} hover:-translate-y-0.5`}>
                      {/* The icon on its colour */}
                      <span aria-hidden="true" className={`flex size-12 flex-none items-center justify-center rounded-[14px] ${READ_COLOURS[index % READ_COLOURS.length]}`}><SetIcon weight="bold" className="size-6" /></span>
                      {/* The name and how many */}
                      <span className="flex min-w-0 flex-col"><span className="text-lg leading-tight font-extrabold">{set.name}</span><span className="text-footnote font-bold text-ink-muted">{cards} {cards === 1 ? "card" : "cards"} · about a minute each</span></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
