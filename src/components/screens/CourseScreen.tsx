"use client";
// One guided course (decision 131): what it does, what you can do by the end, every lesson and its parts (all open, the next one marked), a way to carry on, and once every part is done, your first take against your latest

// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
import { ActionBand } from "@/components/script/ActionBand";
import { PathMark } from "@/components/script/PathMark";
import { Player } from "@/components/script/Player";
import { Skeleton } from "@/components/script/Skeleton";
import { CourseLoadFailed } from "@/components/script/CourseLoadFailed";
// Load the shared looks
import { CARD, SECTION_HEADING } from "@/components/script/textStyles";
import { PAGE } from "@/components/script/layout";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the course data, the audio loader and the tab title helper
import { useCourseData } from "@/components/screens/useCourseData";
import { useAudioUrl } from "@/components/screens/useAudioUrl";
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the course rules
import { compareLine, courseCount, findCourse, isPartDone, lessonCount, nextPart, partHref, partMinutes } from "@/core/courses";
// Load the courses
import { COURSES, type Course } from "@/content/courses";
// Load the record and repository types
import type { SessionRecord } from "@/data/records";
import type { Repository } from "@/data/repository";

// One take to play, with its label
function TakePlayer({ repo, take, label }: { repo: Repository; take: SessionRecord; label: string }) {
  // Its audio, when still kept
  const audio = useAudioUrl(repo, take.audioKey);
  // A label over the player, or a note when the audio is gone
  return (
    <div className="mt-3">
      {/* The label */}
      <p className="text-footnote text-ink-muted">{label}</p>
      {/* The player, or why there is none */}
      {audio.url ? <div className="mt-1"><Player src={audio.url} label={label} name={label.toLowerCase()} durationSec={take.durationSec} /></div> : <p className="mt-1 text-footnote text-ink-muted">{audio.missing || !take.audioKey ? "This recording is no longer kept." : "Loading…"}</p>}
    </div>
  );
}

// The course's first take against its latest, once every part is done
function CourseDone({ repo, course, takes }: { repo: Repository; course: Course; takes: ReadonlyArray<SessionRecord> }) {
  // This course's tries (not comebacks), oldest first
  const own = takes.filter((take) => take.course && !take.course.revisit && course.lessons.some((lesson) => lesson.parts.some((part) => part.id === take.course!.part)));
  // The first and the latest
  const [first, last] = [own[0], own[own.length - 1]];
  // Another course for the same focus, not this one
  const next = COURSES.find((item) => item.id !== course.id && item.focus === course.focus);
  // The section
  return (
    <section aria-labelledby="course-done" data-course-done className={`mt-6 p-5 ${CARD}`}>
      {/* Heading */}
      <h2 id="course-done" className={SECTION_HEADING}>Course complete</h2>
      {/* First against latest, when there are two takes */}
      {first && last && first.id !== last.id ? (
        <>
          {/* What changed */}
          <p className="mt-2 text-lede">{compareLine("fillers", first, last) ?? "Hear your first take against your latest."}</p>
          {/* Both takes */}
          <TakePlayer repo={repo} take={first} label="Your first take" />
          <TakePlayer repo={repo} take={last} label="Your latest take" />
        </>
      ) : (
        <p className="mt-2 text-lede">Every part is done.</p>
      )}
      {/* The next course, when there is one */}
      {next && <p className="mt-4"><Link href={`/courses/course?id=${next.id}`} className="underline underline-offset-4">Next: {next.title}</Link></p>}
    </section>
  );
}

// Draw a course
export function CourseScreen({ courseId, ...props }: ScreenProps & { courseId: string }) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // The course
  const course = findCourse(courseId);
  // Name the tab after it
  usePageTitle(course?.title);
  // Progress and takes
  const data = useCourseData(repo, today);

  // No such course
  if (!course) {
    // Say so, with a way back
    return (
      <main id="main" className={PAGE}>
        {/* Title and close */}
        <Masthead title="Course" nav={false} close={{ href: "/practice", label: "Close, back to Practice" }} />
        {/* The message */}
        <p className="mt-8 text-lede">This course could not be found. <Link href="/practice" className="underline underline-offset-4">Back to Practice</Link></p>
      </main>
    );
  }

  // Progress once loaded
  const progress = data.status === "ready" ? data.progress : {};
  // The next part, and the count
  const [next, count] = [nextPart(course, progress), courseCount(course, progress)];

  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* Title and a way back to Practice */}
      <Masthead title="Course" nav={false} close={{ href: "/practice", label: "Close, back to Practice" }} />
      {/* The course */}
      <p className="mt-6 text-footnote font-semibold text-accent">Course{course.draft ? " · draft lessons" : ""}</p>
      {/* Its name */}
      <h1 className="mt-1 font-display text-statement tracking-tight">{course.title}</h1>
      {/* What it does, and how it is paced */}
      <p className="mt-2 max-w-[52ch] text-lede">{course.blurb} {course.lessons.length} lessons, each in a few short parts. Do as many as you like.</p>
      {/* What you can do by the end */}
      {course.outcomes.length > 0 && (
        <section aria-label="By the end" className="mt-5 max-w-md rounded-2xl bg-warm-tint p-4 text-warm-ink">
          {/* Heading */}
          <p className="text-footnote font-semibold">By the end you will</p>
          {/* The outcomes */}
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink">
            {/* Each */}
            {course.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}
          </ul>
        </section>
      )}
      {/* Loading, failed, or the lessons */}
      {data.status === "loading" && <Skeleton blocks={["h-40", "h-40"]} />}
      {data.status === "failed" && <CourseLoadFailed retry={data.retry} />}
      {data.status === "ready" && (
        <>
          {/* Every part done: first against latest */}
          {!next && <CourseDone repo={repo} course={course} takes={data.takes} />}
          {/* The lessons */}
          <ol className="mt-6 flex flex-col gap-6">
            {/* Each lesson */}
            {course.lessons.map((lesson, lessonIndex) => (
              // One lesson with its parts
              <li key={lesson.id}>
                {/* Its heading and count */}
                <h2 className={SECTION_HEADING}>{lessonIndex + 1}. {lesson.title}</h2>
                {/* Its line and how far through */}
                <p className="text-footnote text-ink-muted">{lesson.blurb} · {lessonCount(lesson, progress).done} of {lesson.parts.length} {lesson.parts.length === 1 ? "part" : "parts"} done</p>
                {/* Its parts */}
                <ol className="mt-2 divide-y divide-rule">
                  {/* Each part, open to start whatever is done */}
                  {lesson.parts.map((part, partIndex) => (
                    // One part
                    <li key={part.id}>
                      {/* The whole row is the link */}
                      <Link href={partHref(part.id)} data-course-part={part.id} className="flex min-h-14 items-center gap-3 py-2">
                        {/* Done, next, or open */}
                        <PathMark mark={isPartDone(progress, part.id) ? "done" : next?.part.id === part.id ? "next" : "open"} number={partIndex + 1} />
                        {/* Its name and length */}
                        <span className="min-w-0 flex-1">
                          {/* Name */}
                          <span className="block font-medium">{part.title}</span>
                          {/* Length, and "Up next" on the next one */}
                          <span className="block text-footnote text-ink-muted">{next?.part.id === part.id ? "Up next · " : ""}about {partMinutes(part)} min</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
          {/* Carry on, or start */}
          {next && <div className="mt-8"><ActionBand action={count.done === 0 ? "Start" : "Continue"} aside={`Lesson ${next.lessonNumber}, part ${next.partNumber}`} href={partHref(next.part.id)} /></div>}
        </>
      )}
    </main>
  );
}
