// Guided courses' rules (decision 131): finding a part, the next part to do, which course to offer, when a part's prompt comes back, the steps of a part, its addresses, and comparing two takes on the part's measure. Pure

// Load the courses and their types
import { COURSES, type Course, type CourseLesson, type CourseMeasure, type CoursePart } from "@/content/courses";
// Load the record types
import type { CoursePartProgress, CourseTake, SessionRecord } from "@/data/records";
// Load the focus area type
import type { FocusAreaId } from "@/core/practiceFocus";

// Progress across every course: each finished part by its id
export type CourseProgress = Readonly<Record<string, CoursePartProgress>>;

// Where a part sits: its course and lesson, and their numbers counted from 1
export interface PartPlace {
  // The course
  course: Course;
  // The lesson
  lesson: CourseLesson;
  // The part
  part: CoursePart;
  // The lesson's number in the course
  lessonNumber: number;
  // The part's number in the lesson
  partNumber: number;
}

// The steps a part can have, in order
export type PartStep = "learn" | "see" | "try" | "wrap";

// Days before a part's prompt comes back
export const REVISIT_AFTER_DAYS = 3;

// A course by its id
export function findCourse(id: string, courses: ReadonlyArray<Course> = COURSES): Course | undefined {
  // The match
  return courses.find((course) => course.id === id);
}

// Every part of a course with its place, in order
export function coursePlaces(course: Course): PartPlace[] {
  // Each lesson's parts, numbered
  return course.lessons.flatMap((lesson, lessonIndex) => lesson.parts.map((part, partIndex) => ({ course, lesson, part, lessonNumber: lessonIndex + 1, partNumber: partIndex + 1 })));
}

// A part and its place by the part's id
export function findPart(partId: string, courses: ReadonlyArray<Course> = COURSES): PartPlace | undefined {
  // Looked for in every course
  for (const course of courses) {
    // The match in this course
    const place = coursePlaces(course).find((item) => item.part.id === partId);
    // Found
    if (place) return place;
  }
  // None
  return undefined;
}

// Whether a part was finished, before a moment when one is given (so today's plan stays the same all day)
export function isPartDone(progress: CourseProgress, partId: string, before?: Date): boolean {
  // Its progress
  const done = progress[partId];
  // Finished, and before the moment when there is one
  return !!done && (!before || new Date(done.doneAt) < before);
}

// Course progress read safely from storage or a backup: only entries with a finish time and a take id (or none) are kept, so values from an older version or another app never break a page
export function readCourseProgress(value: unknown): Record<string, CoursePartProgress> {
  // Not a map: nothing
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  // The kept entries
  const kept: Record<string, CoursePartProgress> = {};
  // Each entry
  for (const [partId, entry] of Object.entries(value as Record<string, unknown>)) {
    // Must be an object
    if (typeof entry !== "object" || entry === null) continue;
    // Its fields, whatever shape
    const { doneAt, takeId, revisitedAt, revisitTakeId } = entry as Record<string, unknown>;
    // A finish time that reads as a date, and a take id or none
    if (typeof doneAt !== "string" || Number.isNaN(Date.parse(doneAt)) || !(typeof takeId === "string" || takeId === null)) continue;
    // Kept, with the comeback only when both of its fields are sound
    kept[partId] = { doneAt, takeId, ...(typeof revisitedAt === "string" && typeof revisitTakeId === "string" ? { revisitedAt, revisitTakeId } : {}) };
  }
  // The safe map
  return kept;
}

// The first part of a course not yet finished (before a moment, when given), or null when every part is done
export function nextPart(course: Course, progress: CourseProgress, before?: Date): PartPlace | null {
  // The first open one
  return coursePlaces(course).find((place) => !isPartDone(progress, place.part.id, before)) ?? null;
}

// How many of a course's parts are finished, out of how many
export function courseCount(course: Course, progress: CourseProgress): { done: number; total: number } {
  // Every part
  const places = coursePlaces(course);
  // Counted
  return { done: places.filter((place) => isPartDone(progress, place.part.id)).length, total: places.length };
}

// How many of a lesson's parts are finished, out of how many
export function lessonCount(lesson: CourseLesson, progress: CourseProgress): { done: number; total: number } {
  // Counted
  return { done: lesson.parts.filter((part) => isPartDone(progress, part.id)).length, total: lesson.parts.length };
}

// The course to offer on Today: one already started and not finished comes first, otherwise the first unfinished course for one of the user's focus areas; null when there is none (before a moment, when given)
export function courseToOffer(focus: ReadonlyArray<FocusAreaId>, progress: CourseProgress, before?: Date, courses: ReadonlyArray<Course> = COURSES): Course | null {
  // Courses with parts left
  const open = courses.filter((course) => nextPart(course, progress, before) !== null);
  // One already started
  const started = open.find((course) => coursePlaces(course).some((place) => isPartDone(progress, place.part.id, before)));
  // That one, or the first for a focus
  return started ?? open.find((course) => focus.includes(course.focus)) ?? null;
}

// A part's steps: learning, seeing when it has something to see, trying when it has practice, and wrapping up
export function partSteps(part: CoursePart): PartStep[] {
  // In order, leaving out the ones it lacks
  return ["learn", ...(part.see ? (["see"] as const) : []), ...(part.practice ? (["try"] as const) : []), "wrap"];
}

// A part's length in minutes: a minute to learn, one to see, two for each try
export function partMinutes(part: CoursePart): number {
  // Added up
  return 1 + (part.see ? 1 : 0) + (part.practice ? part.practice.tries * 2 : 0);
}

// A part's page, at a step (and a try, for a second try)
export function partHref(partId: string, step: PartStep = "learn", attempt = 1): string {
  // The page, with the step unless it is the first, and the try unless it is the first
  return `/courses/part?id=${partId}${step === "learn" ? "" : `&step=${step}`}${attempt > 1 ? `&try=${attempt}` : ""}`;
}

// The recording page for a part's try, or for its prompt coming back
export function takeHref(part: CoursePart, attempt: number, revisit = false): string | null {
  // No practice: nothing to record
  if (!part.practice) return null;
  // The kind of session and its prompt, with the course part and the try (or the comeback)
  return `/session?mode=${part.practice.mode}&prompt=${part.practice.promptId}&course=${part.id}${revisit ? "&revisit=1" : `&try=${attempt}`}`;
}

// Where a take inside a course goes once saved: the comparison for a comeback, the next try, or the wrap-up
export function afterTakeHref(take: CourseTake, sessionId: string): string {
  // The part
  const place = findPart(take.part);
  // A comeback: its comparison
  if (take.revisit) return `/courses/revisit?id=${take.part}&take=${sessionId}`;
  // Tries left: the next one
  if (place?.part.practice && take.attempt < place.part.practice.tries) return partHref(take.part, "try", take.attempt + 1);
  // Otherwise the wrap-up
  return partHref(take.part, "wrap");
}

// A course take read from the address, or null when it names no part or a bad try
export function courseTakeFromQuery(params: { get(name: string): string | null }): CourseTake | null {
  // The part named
  const partId = params.get("course");
  // A part that exists and has practice
  if (!partId || !findPart(partId)?.part.practice) return null;
  // A comeback
  if (params.get("revisit") === "1") return { part: partId, attempt: 1, revisit: true };
  // The try, 1 by default
  const attempt = Number(params.get("try") ?? "1");
  // A whole try from 1 to 2
  return Number.isInteger(attempt) && attempt >= 1 && attempt <= 2 ? { part: partId, attempt } : null;
}

// Parts whose prompt is due to come back: finished with a take at least three days ago and not yet answered again, oldest first
export function revisitsDue(progress: CourseProgress, now: Date): PartPlace[] {
  // The cut-off: three days back
  const cutoff = now.getTime() - REVISIT_AFTER_DAYS * 24 * 60 * 60 * 1000;
  // The due parts with their progress
  return Object.entries(progress)
    .filter(([, item]) => item.takeId !== null && !item.revisitedAt && new Date(item.doneAt).getTime() <= cutoff)
    .sort(([, a], [, b]) => a.doneAt.localeCompare(b.doneAt))
    .map(([partId]) => findPart(partId))
    .filter((place): place is PartPlace => !!place && !!place.part.practice);
}

// A take's value on a measure, or null when it has none
export function measureValue(measure: CourseMeasure, session: SessionRecord): number | null {
  // Pause words a minute
  if (measure === "fillers") return Number.isFinite(session.fillersPerMinute) ? session.fillersPerMinute : null;
  // Words a minute
  if (measure === "pace") return session.wordsPerMinute > 0 ? session.wordsPerMinute : null;
  // Seconds
  return session.durationSec > 0 ? session.durationSec : null;
}

// A measure's name
export const MEASURE_NAMES: Readonly<Record<CourseMeasure, string>> = { fillers: "Pause words a minute", pace: "Words a minute", length: "Length" };

// A value on a measure, in words
export function measureText(measure: CourseMeasure, value: number): string {
  // Length as minutes and seconds
  if (measure === "length") return `${Math.floor(Math.round(value) / 60)}:${String(Math.round(value) % 60).padStart(2, "0")}`;
  // Pause words to one decimal place
  if (measure === "fillers") return String(Math.round(value * 10) / 10);
  // Pace as a whole number
  return String(Math.round(value));
}

// One line comparing two takes on a measure, in neutral words, or null when either has no value
export function compareLine(measure: CourseMeasure, before: SessionRecord, after: SessionRecord): string | null {
  // The two values
  const [first, second] = [measureValue(measure, before), measureValue(measure, after)];
  // Both needed
  if (first === null || second === null) return null;
  // Pause words: fewer is the aim
  if (measure === "fillers") return second < first ? `Fewer pause words: ${measureText(measure, first)} a minute, then ${measureText(measure, second)}.` : second > first ? `More pause words this time: ${measureText(measure, first)} a minute, then ${measureText(measure, second)}.` : `Pause words held at ${measureText(measure, second)} a minute.`;
  // Pace: just the change
  if (measure === "pace") return `Pace: ${measureText(measure, first)} words a minute, then ${measureText(measure, second)}.`;
  // Length: just the change
  return `Length: ${measureText(measure, first)}, then ${measureText(measure, second)}.`;
}
