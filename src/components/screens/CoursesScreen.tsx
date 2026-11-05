"use client";
// The Courses tab (decisions 131 and 148): your course first (one started, else the first for your focus), then every other course, each with how far through you are. Courses has its own tab, before Learn, which it is to replace

// Load the icon for a course
import { LightningIcon } from "@phosphor-icons/react/dist/ssr";
// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
import { PageTitle } from "@/components/script/PageTitle";
import { CourseCard } from "@/components/script/CourseCard";
import { Skeleton } from "@/components/script/Skeleton";
import { CourseLoadFailed } from "@/components/script/CourseLoadFailed";
// Load the shared looks
import { SECTION_HEADING } from "@/components/script/textStyles";
import { TileRow } from "@/components/script/TileRow";
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
import { courseCount, coursePlaces, courseToOffer, type CourseProgress } from "@/core/courses";
// Load the focus areas, for the course to offer first
import { readPracticeFocus, type FocusAreaId } from "@/core/practiceFocus";
// Load the courses
import { COURSES, type Course } from "@/content/courses";

// One course as a card
export function CourseRow({ course, progress, note, layout = "row" }: { course: Course; progress: CourseProgress; note?: string; layout?: "row" | "stacked" | "hero" }) {
  // How far through
  const count = courseCount(course, progress);
  // Its tile, if it has one
  const tile = courseTile(course.id);
  // The card
  return <CourseCard href={`/courses/course?id=${course.id}`} name={course.title} blurb={course.blurb} icon={LightningIcon} art={tile ? <CourseTile name={tile} motion="few" className={layout === "row" ? "size-18" : "size-28"} /> : undefined} layout={layout} done={count.done} total={count.total} note={note ?? (count.done > 0 && count.done < count.total ? "In progress" : undefined)} count={`${course.lessons.length} lessons · ${coursePlaces(course).length} parts`} />;
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
  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* Title and navigation, in the Courses tab */}
      <Masthead title="VoiceLab" section="courses" />
      {/* The page's name, and what courses are */}
      <PageTitle title="Courses">Guided lessons built from the practice you already know. Every lesson is open; go in any order.</PageTitle>
      {/* Loading, failed, or the lists */}
      {data.status === "loading" && <Skeleton blocks={["h-24", "h-24"]} />}
      {data.status === "failed" && <CourseLoadFailed retry={data.retry} />}
      {data.status === "ready" && (
        <>
          {/* Your course, when there is one */}
          {yours && (
            <section aria-labelledby="your-course" data-wide className="mt-8">
              {/* Heading */}
              <h2 id="your-course" className={SECTION_HEADING}>Keep going</h2>
              {/* The big card */}
              <div className="mt-3"><CourseRow course={yours} progress={data.progress} layout="hero" note={courseCount(yours, data.progress).done > 0 ? "Carry on" : "For your focus"} /></div>
            </section>
          )}
          {/* Every other course */}
          <section aria-labelledby="all-courses" data-wide className="mt-8">
            {/* Heading */}
            <h2 id="all-courses" className={SECTION_HEADING}>{yours ? "More courses" : "All courses"}</h2>
            {/* The cards */}
            <ul className="mt-3 grid grid-cols-2 gap-3.5 md:gap-5 lg:grid-cols-3">
              {/* Each course, your focus's marked */}
              {COURSES.filter((course) => course !== yours).map((course) => <li key={course.id}><CourseRow layout="stacked" course={course} progress={data.progress} note={focus.includes(course.focus) ? "For your focus" : undefined} /></li>)}
            </ul>
          </section>
          {/* Learn's cards, as quick reads: one idea and a move to try (UI rewrite: Learn lives under Courses) */}
          <section aria-labelledby="quick-reads" data-wide className="mt-8">
            {/* Heading */}
            <h2 id="quick-reads" className={SECTION_HEADING}>Quick reads</h2>
            {/* The way in */}
            <div className="mt-3 md:max-w-xl"><TileRow href="/learn" label="Learn" title="Quick reads" detail="One idea and a move to try, about a minute each" ground="plum" prop="book" face="wonder" tilt={4} /></div>
          </section>
        </>
      )}
    </main>
  );
}
