"use client";
// One guided course (decision 131; second design pass, Desktop Screens "CoursePath" and storyboard 20): "‹ All courses", the course's header band on its colour (the label with the lesson you are on, the name, its line, a bar counted in lessons), then the lessons along a dotted winding path (a green tick done, the sun with a play button next, cream and numbered while open, a flag for the last), the blob beside it saying every lesson is open. On a computer the right column shows the chosen lesson's card (its tile, its parts as numbered rows, "Start part n") and Sage with what you can do by the end; on a phone each lesson is a card down the path, the tiles getting harder toward the last, opening its parts in place. Once every part is done, your first take against your latest

// Load React's state tool and node type
import { useState, type ReactNode } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the icons on the path
import { CaretLeftIcon, CheckIcon, FlagIcon, PlayIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
import { Player } from "@/components/script/Player";
import { Skeleton } from "@/components/script/Skeleton";
import { CourseLoadFailed } from "@/components/script/CourseLoadFailed";
// Load the shared looks
import { BUBBLE, CARD, LAB, PBAR, SECTION_HEADING } from "@/components/script/textStyles";
import { PRESS, PRIMARY, TEXT_LINK } from "@/components/script/Buttons";
import { Buddy } from "@/components/scenes/Buddy";
import { GROUND_TINT, type TileGround } from "@/components/scenes/ModeTile";
import { PAGE } from "@/components/script/layout";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the course data, the audio loader and the tab title helper
import { useCourseData } from "@/components/screens/useCourseData";
import { useAudioUrl } from "@/components/screens/useAudioUrl";
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the course rules
import { compareLine, findCourse, isPartDone, nextPart, partHref, partMinutes, type CourseProgress } from "@/core/courses";
import { lessonLevel, lessonMinutes, lessonsDone, lessonStates, type LessonState } from "@/core/coursePath";
// Load the courses
import { COURSES, type Course, type CourseLesson } from "@/content/courses";
// Load the record and repository types
import type { SessionRecord } from "@/data/records";
import type { Repository } from "@/data/repository";
// Load the course tiles and which one stands for a course or lesson (decision 142)
import { CourseTile, courseTileGround } from "@/components/scenes/CourseTile";
import { courseTile, lessonTile } from "@/components/scenes/tileFor";
// Load the hand-drawn celebration (decision 134)
import { Drawing } from "@/components/script/Drawing";

// The header band's colours for each ground: the full colour where its words read clearly on it, else its soft tint with ink words (plum, bloom and coral are too mid-toned for small words in either light or dark)
const BAND: Readonly<Record<TileGround, { band: string; track: string; fill: string }>> = {
  // Blue, light words
  sky: { band: "bg-art-sky text-art-cream shadow-band", track: "bg-art-cream/30", fill: "bg-art-cream" },
  // Yellow, dark words
  sun: { band: "bg-art-sun text-on-warm shadow-band", track: "bg-on-warm/15", fill: "bg-on-warm" },
  // Green, dark words
  leaf: { band: "bg-art-leaf text-on-warm shadow-band", track: "bg-on-warm/15", fill: "bg-on-warm" },
  // Pink, on its tint
  bloom: { band: `${GROUND_TINT.bloom} text-ink shadow-card`, track: "bg-card", fill: "bg-art-bloom" },
  // Purple, on its tint
  plum: { band: `${GROUND_TINT.plum} text-ink shadow-card`, track: "bg-card", fill: "bg-art-plum" },
  // Coral, on its tint
  coral: { band: `${GROUND_TINT.coral} text-ink shadow-card`, track: "bg-card", fill: "bg-art-coral" },
};

// Where each lesson sits across the path, as a share of its width, in turn
const PATH_X: ReadonlyArray<number> = [0.3, 0.7, 0.46, 0.26, 0.46, 0.64, 0.42];
// The path's width and the step down between lessons, in pixels
const PATH = { width: 440, step: 118, top: 40 };

// A course's ground, from its tile (sky when it has none)
function courseGround(course: Course): TileGround {
  // Its tile
  const tile = courseTile(course.id);
  // Its ground role without the prefix
  return tile ? (courseTileGround(tile).replace(/^art-/, "") as TileGround) : "sky";
}

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
      {/* Someone delighted, arms open (decision 134) */}
      <Drawing name="courseDone" className="mx-auto mb-3 block h-44" />
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
      {next && <p className="mt-4"><Link href={`/courses/course?id=${next.id}`} className={TEXT_LINK}>Next: {next.title}</Link></p>}
    </section>
  );
}

// A lesson's round marker on the path: a green tick when done, the sun with a play button when next (in a soft ring), cream with its number while open, a flag for the last
function PathDisc({ state, number, last }: { state: LessonState; number: number; last: boolean }) {
  // The disc's look
  const look = state === "done" ? "bg-fill text-fill-ink shadow-disc-done" : state === "next" ? "bg-art-sun text-on-warm shadow-disc-sun" : "bg-rule text-ink shadow-disc";
  // The disc, with the ring round the next one
  return (
    <span aria-hidden="true" className="relative flex h-16.5 w-18 items-center justify-center">
      {/* The ring */}
      {state === "next" && <span className="absolute -inset-2.5 rounded-full border-5 border-art-sun/40" />}
      {/* The disc */}
      <span className={`flex size-full items-center justify-center rounded-full ${look}`}>
        {state === "done" ? <CheckIcon weight="bold" className="size-7" /> : state === "next" ? <PlayIcon weight="fill" className="size-7" /> : last ? <FlagIcon weight="bold" className="size-6.5" /> : <b className="font-display text-2xl font-semibold">{number}</b>}
      </span>
    </span>
  );
}

// What a lesson's state says under its name
const STATE_WORDS: Readonly<Record<LessonState, string>> = { done: "Done", next: "Up next", open: "" };

// The lessons on a winding dotted path (on a computer): each a button that shows its card in the right column
function LessonPath({ course, states, chosen, choose }: { course: Course; states: ReadonlyArray<LessonState>; chosen: number; choose: (index: number) => void }) {
  // Each lesson's centre on the path
  const points = course.lessons.map((_, index) => ({ x: Math.round((PATH_X[index % PATH_X.length] ?? 0.5) * PATH.width), y: PATH.top + index * PATH.step + 33 }));
  // The path's height
  const height = PATH.top + course.lessons.length * PATH.step + 40;
  // The section
  return (
    <section aria-label="Lessons" className="relative hidden flex-none lg:block" style={{ width: PATH.width, height }}>
      {/* The dotted path through the lessons */}
      <svg aria-hidden="true" width={PATH.width} height={height} viewBox={`0 0 ${PATH.width} ${height}`} className="absolute inset-0 stroke-rule">
        <path d={`M${points.map((point) => `${point.x} ${point.y}`).join(" L")}`} strokeWidth="10" strokeDasharray="2 18" strokeLinecap="round" fill="none" />
      </svg>
      {/* Each lesson */}
      <ol>
        {course.lessons.map((lesson, index) => (
          <li key={lesson.id} className="absolute w-36 -translate-x-1/2" style={{ left: points[index]!.x, top: points[index]!.y - 33 }}>
            {/* The marker and its name, as one button */}
            <button type="button" aria-pressed={chosen === index} onClick={() => choose(index)} data-lesson-node={lesson.id} className={`flex w-full flex-col items-center gap-2 rounded-2xl pb-1 ${PRESS}`}>
              {/* The marker */}
              <PathDisc state={states[index]!} number={index + 1} last={index === course.lessons.length - 1} />
              {/* The name, and done or up next */}
              <span className="text-center text-sm leading-tight font-extrabold">
                <span className="sr-only">Lesson {index + 1}:</span>{" "}<span className={chosen === index && states[index] !== "next" ? "underline decoration-2 underline-offset-4" : ""}>{lesson.title}</span>
                {STATE_WORDS[states[index]!] && <span className="block font-bold text-ink-muted">{STATE_WORDS[states[index]!]}</span>}
              </span>
            </button>
          </li>
        ))}
      </ol>
      {/* The blob beside the path, wondering */}
      <Buddy face="wow" className="absolute top-65 left-82 size-24" />
      {/* What it says */}
      <p className="absolute bottom-8 left-0 w-48 rounded-[18px] border-2 border-rule bg-card px-3.5 py-2.5 text-sm font-bold">Every lesson is open. Skip ahead any time.</p>
    </section>
  );
}

// A lesson's parts as numbered rows, each opening its part
function PartRows({ lesson, progress, nextId }: { lesson: CourseLesson; progress: CourseProgress; nextId: string | undefined }) {
  // The rows
  return (
    <ol className="flex flex-col divide-y-2 divide-rule">
      {/* Each part */}
      {lesson.parts.map((part, index) => {
        // Done, next, or open
        const mark = isPartDone(progress, part.id) ? "done" : nextId === part.id ? "next" : "open";
        // The row
        return (
          <li key={part.id}>
            <Link href={partHref(part.id)} data-course-part={part.id} className={`flex min-h-16 items-center gap-3.5 py-3 hover:text-accent ${PRESS}`}>
              {/* Its number, done or next */}
              <span className={`flex size-9 flex-none items-center justify-center rounded-xl font-display font-semibold ${mark === "done" ? "bg-fill text-fill-ink" : mark === "next" ? "bg-art-sun text-on-warm" : "bg-rule text-ink"}`}>{mark === "done" ? <><CheckIcon aria-hidden="true" weight="bold" className="size-4.5" /><span className="sr-only">Done</span></> : index + 1}</span>
              {/* Its name and idea */}
              <span className="flex min-w-0 flex-1 flex-col">
                {/* The name */}
                <span className="font-extrabold">{part.title}</span>
                {/* The idea, and up next */}
                <span className="text-footnote font-bold text-ink-muted">{mark === "next" && <span className="sr-only">Up next. </span>}{part.learn.headline}</span>
              </span>
              {/* Its length */}
              <span className="flex-none text-footnote font-extrabold whitespace-nowrap text-ink-muted">{partMinutes(part)} min</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

// The chosen lesson's card: its tile, label, name and length, its parts, and a chunky Start
function LessonCard({ course, lesson, index, state, progress, nextId }: { course: Course; lesson: CourseLesson; index: number; state: LessonState; progress: CourseProgress; nextId: string | undefined }) {
  // Its tile
  const tile = lessonTile(course.id, lesson.id);
  // The part to start: the first not done, else the first
  const start = lesson.parts.findIndex((part) => !isPartDone(progress, part.id));
  // (its number from 0)
  const from = start === -1 ? 0 : start;
  // The card
  return (
    <section aria-labelledby="lesson-name" data-lesson-card={lesson.id} className={`flex flex-col gap-4 px-5 py-5 md:px-6.5 md:py-6 ${CARD}`}>
      {/* The tile and the words */}
      <div className="flex items-center gap-4.5">
        {/* The tile */}
        {tile && <CourseTile name={tile} motion="few" className="size-24 flex-none md:size-28" />}
        {/* The words */}
        <div className="flex min-w-0 flex-col gap-1">
          {/* Which lesson, and where it stands */}
          <span className={LAB}>Lesson {index + 1}{STATE_WORDS[state] ? ` · ${STATE_WORDS[state]}` : ""}</span>
          {/* Its name */}
          <h2 id="lesson-name" className="font-display text-3xl leading-tight font-semibold">{lesson.title}</h2>
          {/* Its parts and length */}
          <span className="font-bold text-ink-muted">{lesson.parts.length} {lesson.parts.length === 1 ? "part" : "parts"} · about {lessonMinutes(lesson)} minutes</span>
        </div>
      </div>
      {/* Its parts */}
      <PartRows lesson={lesson} progress={progress} nextId={nextId} />
      {/* Start it */}
      <Link href={partHref(lesson.parts[from]!.id)} className={`${PRIMARY} w-full`}>{start === -1 ? "Do part 1 again" : `Start part ${from + 1}`}</Link>
    </section>
  );
}

// The lessons down the path on a phone: each a card (tile, "Lesson n", name, how hard, a tick when done or Start when next), opening its parts in place
function LessonCards({ course, states, progress, nextId }: { course: Course; states: ReadonlyArray<LessonState>; progress: CourseProgress; nextId: string | undefined }) {
  // The lesson whose parts are open, if any
  const [open, setOpen] = useState<string | null>(null);
  // The list, a dotted line down its middle
  return (
    <ol aria-label="Lessons" className="relative mt-5 flex flex-col gap-4 before:absolute before:top-8 before:bottom-8 before:left-1/2 before:border-l-4 before:border-dotted before:border-rule lg:hidden">
      {/* Each lesson, stepping left and right */}
      {course.lessons.map((lesson, index) => {
        // Its state
        const state = states[index]!;
        // Its tile
        const tile = lessonTile(course.id, lesson.id);
        // How hard, from 1 to 3
        const level = lessonLevel(index, course.lessons.length);
        // The first part not done (for Start)
        const first = lesson.parts.find((part) => !isPartDone(progress, part.id)) ?? lesson.parts[0]!;
        // The card
        return (
          <li key={lesson.id} data-lesson-card={lesson.id} className={`relative w-[92%] rounded-[22px] border-2 bg-card ${index % 2 ? "self-end" : "self-start"} ${state === "next" ? "border-art-sun shadow-next" : "border-rule shadow-card"}`}>
            <div className="flex items-center gap-3 p-3.5">
              {/* The tile, label, name and dots, as one button opening the parts */}
              <button type="button" aria-expanded={open === lesson.id} aria-controls={`parts-${lesson.id}`} onClick={() => setOpen(open === lesson.id ? null : lesson.id)} className={`flex min-w-0 flex-1 items-center gap-3 text-left ${PRESS}`}>
                {/* The tile */}
                {tile && <CourseTile name={tile} motion="still" className="size-16 flex-none" />}
                {/* The words */}
                <span className="flex min-w-0 flex-col gap-0.5">
                  {/* Which lesson */}
                  <span className={LAB}>Lesson {index + 1}</span>
                  {/* Its name */}
                  <span className="font-display text-lg leading-tight font-semibold">{lesson.title}{state === "done" && <span className="sr-only">, done</span>}</span>
                  {/* How hard: three dots, more filled toward the last lesson */}
                  <span aria-hidden="true" className="mt-1 flex gap-1">{[1, 2, 3].map((dot) => <span key={dot} className={`size-2 rounded-full ${dot <= level ? "bg-art-sun" : "bg-rule"}`} />)}</span>
                </span>
              </button>
              {/* A tick when done, Start when next */}
              {state === "done" && <span aria-hidden="true" className="flex size-9 flex-none items-center justify-center rounded-full bg-fill text-fill-ink"><CheckIcon weight="bold" className="size-5" /></span>}
              {state === "next" && <Link href={partHref(first.id)} className="inline-flex min-h-11 flex-none items-center rounded-[14px] bg-fill px-4 font-display text-lg font-semibold tracking-[.03em] text-fill-ink uppercase shadow-chunky">Start{" "}<span className="sr-only">lesson {index + 1}</span></Link>}
            </div>
            {/* Its parts, once opened */}
            {open === lesson.id && <div id={`parts-${lesson.id}`} className="border-t-2 border-rule px-3.5"><PartRows lesson={lesson} progress={progress} nextId={nextId} /></div>}
          </li>
        );
      })}
    </ol>
  );
}

// Draw a course; header is a slot in the band for an illustrated course header
export function CourseScreen({ courseId, header, ...props }: ScreenProps & { courseId: string; header?: ReactNode }) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // The course
  const course = findCourse(courseId);
  // Name the tab after it
  usePageTitle(course?.title);
  // Progress and takes
  const data = useCourseData(repo, today);
  // The lesson chosen on the path (the next one until another is chosen)
  const [picked, setPicked] = useState<number | null>(null);

  // No such course
  if (!course) {
    // Say so, with a way back
    return (
      <main id="main" className={PAGE}>
        {/* Title and navigation, in Courses */}
        <Masthead title="Course" section="courses" />
        {/* The page's heading */}
        <h1 className="mt-4 font-display text-statement font-semibold md:-mt-12">Course</h1>
        {/* The message */}
        <p className="mt-2 text-lede">This course could not be found. <Link href="/courses" className={TEXT_LINK} data-inline>Back to Courses</Link></p>
      </main>
    );
  }

  // Progress once loaded
  const progress = data.status === "ready" ? data.progress : {};
  // The next part, the lessons done, and each lesson's state
  const [next, lessons, states] = [nextPart(course, progress), lessonsDone(course, progress), lessonStates(course, progress)];
  // The lesson shown in the right column: the one chosen, else the next, else the last
  const chosen = picked ?? (next ? next.lessonNumber - 1 : course.lessons.length - 1);
  // The band's colours
  const band = BAND[courseGround(course)];

  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* Title and navigation, in Courses */}
      <Masthead title="Course" section="courses" />
      {/* The way back */}
      <p className="mt-1 md:-mt-12"><Link href="/courses" className={`${TEXT_LINK} -ml-1 gap-1 text-footnote text-ink-muted`}><CaretLeftIcon aria-hidden="true" weight="bold" className="size-4" />All courses</Link></p>
      {/* The header band on the course's colour */}
      <div data-wide data-course-band className={`mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-3xl px-5 py-4 pb-5 md:px-6.5 md:py-5 md:pb-6 ${band.band}`}>
        {/* The label, name and line */}
        <div className="flex min-w-0 flex-[1_1_18rem] flex-col gap-1">
          {/* The course and the lesson you are on */}
          <p className="text-xs font-extrabold tracking-[.07em] uppercase">Course{course.draft ? " · draft lessons" : ""}{data.status === "ready" ? ` · lesson ${next ? next.lessonNumber : course.lessons.length} of ${course.lessons.length}` : ""}</p>
          {/* Its name */}
          <h1 className="font-display text-3xl leading-tight font-semibold md:text-4xl">{course.title}</h1>
          {/* What it does */}
          <p className="max-w-[56ch] font-bold">{course.blurb}</p>
        </div>
        {/* How far, in lessons */}
        {data.status === "ready" && (
          <div aria-hidden="true" className="flex min-w-60 flex-[0_1_18rem] items-center gap-3">
            {/* The bar */}
            <span className={`${PBAR} flex-1 ${band.track}`}><span className={`block h-full rounded-full ${band.fill} motion-safe:animate-fill`} style={{ width: `${Math.max((lessons.done / lessons.total) * 100, lessons.done > 0 ? 6 : 0)}%` }} /></span>
            {/* The count */}
            <span className="font-extrabold whitespace-nowrap tabular-nums">{lessons.done} of {lessons.total}</span>
          </div>
        )}
        {/* The count, said */}
        {data.status === "ready" && <p className="sr-only">{lessons.done} of {lessons.total} lessons done.</p>}
        {/* A slot for an illustrated course header */}
        {header && <div data-course-header-slot className="w-full">{header}</div>}
      </div>
      {/* Loading, failed, or the lessons */}
      {data.status === "loading" && <Skeleton blocks={["h-40", "h-40"]} />}
      {data.status === "failed" && <CourseLoadFailed retry={data.retry} />}
      {data.status === "ready" && (
        <>
          {/* Every part done: first against latest */}
          {!next && <div data-wide><CourseDone repo={repo} course={course} takes={data.takes} /></div>}
          {/* The path and the chosen lesson (on a computer) */}
          <div data-wide className="mt-6 hidden items-start gap-9 lg:flex">
            {/* The path */}
            <LessonPath course={course} states={states} chosen={chosen} choose={setPicked} />
            {/* The chosen lesson, and what the course is for */}
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              {/* The lesson */}
              <LessonCard course={course} lesson={course.lessons[chosen]!} index={chosen} state={states[chosen]!} progress={progress} nextId={next?.part.id} />
              {/* Sage, with what you can do by the end */}
              {course.outcomes.length > 0 && <Outcomes outcomes={course.outcomes} />}
            </div>
          </div>
          {/* The lessons as cards down the path (on a phone) */}
          <div data-wide className="lg:hidden">
            <LessonCards course={course} states={states} progress={progress} nextId={next?.part.id} />
            {/* The blob, keeping you company */}
            <div className="mt-6 flex items-end gap-3">
              {/* The blob, wondering */}
              <Buddy face="wow" className="size-16 flex-none" />
              {/* What it says */}
              <p className={`${BUBBLE} mb-2 max-w-[30ch] text-footnote`}>Every lesson is open. Skip ahead any time.</p>
            </div>
            {/* What you can do by the end */}
            {course.outcomes.length > 0 && <div className="mt-6"><Outcomes outcomes={course.outcomes} /></div>}
          </div>
        </>
      )}
    </main>
  );
}

// Sage beside "By the end you will" and the course's outcomes
function Outcomes({ outcomes }: { outcomes: ReadonlyArray<string> }) {
  // Sage and the card
  return (
    <section aria-label="By the end" className="flex items-start gap-3.5">
      {/* Sage, encouraging */}
      <Buddy who="sage" mood="encouraging" className="size-16 flex-none md:size-22" />
      {/* The card */}
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 rounded-[22px] border-2 border-rule bg-card px-5 py-4.5">
        {/* Heading */}
        <p className={LAB}>By the end you will</p>
        {/* The outcomes */}
        <ul className="flex list-disc flex-col gap-1.5 pl-5 font-bold">
          {/* Each */}
          {outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}
        </ul>
      </div>
    </section>
  );
}
