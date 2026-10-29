"use client";
// Every guided course (decision 131): the ones for your focus first, each with how far through you are

// Load the icon for a course
import { LightningIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
import { CourseCard } from "@/components/script/CourseCard";
import { Skeleton } from "@/components/script/Skeleton";
import { CourseLoadFailed } from "@/components/script/CourseLoadFailed";
// Load the shared looks
import { SECTION_HEADING } from "@/components/script/textStyles";
import { PAGE } from "@/components/script/layout";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the course data and the tab title helper
import { useCourseData } from "@/components/screens/useCourseData";
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the course rules
import { courseCount, coursePlaces, type CourseProgress } from "@/core/courses";
// Load the courses
import { COURSES, type Course } from "@/content/courses";

// One course as a card
export function CourseRow({ course, progress, note }: { course: Course; progress: CourseProgress; note?: string }) {
  // How far through
  const count = courseCount(course, progress);
  // The card
  return <CourseCard href={`/courses/course?id=${course.id}`} name={course.title} blurb={course.blurb} icon={LightningIcon} done={count.done} total={count.total} note={note ?? (count.done > 0 && count.done < count.total ? "In progress" : undefined)} count={`${course.lessons.length} lessons · ${coursePlaces(course).length} parts`} />;
}

// Draw the list
export function CoursesScreen(props: ScreenProps) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // Name the tab
  usePageTitle("Courses");
  // Progress
  const data = useCourseData(repo, today);
  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* Title, in the Practice section */}
      <Masthead title="VoiceLab" section="practice" />
      {/* Heading */}
      <h1 className="mt-6 font-display text-statement tracking-tight">Courses</h1>
      {/* What they are */}
      <p className="mt-2 max-w-[52ch] text-lede text-ink-muted">Guided lessons built from the practice you already know. Every lesson is open; go in any order.</p>
      {/* Loading, failed, or the list */}
      {data.status === "loading" && <Skeleton blocks={["h-24", "h-24"]} />}
      {data.status === "failed" && <CourseLoadFailed retry={data.retry} />}
      {data.status === "ready" && (
        <section aria-labelledby="all-courses" className="mt-8">
          {/* Heading */}
          <h2 id="all-courses" className={SECTION_HEADING}>All courses</h2>
          {/* The cards */}
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {/* Each course */}
            {COURSES.map((course) => <li key={course.id}><CourseRow course={course} progress={data.progress} /></li>)}
          </ul>
        </section>
      )}
    </main>
  );
}
