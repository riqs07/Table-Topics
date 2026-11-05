// A course counted in lessons, for the second design pass's course cards and path (Desktop Screens "Courses" and "CoursePath"): how many lessons are done, a lesson's minutes, and each lesson's place on the path

// Load the part rules
import { isPartDone, lessonCount, nextPart, partMinutes, type CourseProgress } from "@/core/courses";
// Load the course types
import type { Course, CourseLesson } from "@/content/courses";

// Where a lesson stands on the path: every part done, the one with the next part, or still open
export type LessonState = "done" | "next" | "open";

// How many lessons have every part done, out of all
export function lessonsDone(course: Course, progress: CourseProgress): { done: number; total: number } {
  // A lesson counts once all its parts are done
  return { done: course.lessons.filter((lesson) => lesson.parts.every((part) => isPartDone(progress, part.id))).length, total: course.lessons.length };
}

// A lesson's length in minutes, its parts added up
export function lessonMinutes(lesson: CourseLesson): number {
  // Each part's minutes
  return lesson.parts.reduce((sum, part) => sum + partMinutes(part), 0);
}

// Each lesson's state: done, next (the lesson holding the course's next part), or open
export function lessonStates(course: Course, progress: CourseProgress): LessonState[] {
  // The next part, if any
  const next = nextPart(course, progress);
  // Each lesson
  return course.lessons.map((lesson, index) => (next && next.lessonNumber === index + 1 ? "next" : lessonCount(lesson, progress).done === lesson.parts.length ? "done" : "open"));
}

// How hard a lesson is, from 1 to 3, rising along the course (the dots under each lesson on a phone)
export function lessonLevel(index: number, total: number): 1 | 2 | 3 {
  // The share of the way along
  const along = total > 1 ? index / (total - 1) : 0;
  // A third at a time
  return along < 1 / 3 ? 1 : along < 2 / 3 ? 2 : 3;
}
