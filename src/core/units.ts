// The Connect units as a path: how far through each unit's lessons you are, and which unit comes next (decision 95)

// Load the units, their lessons and the prompt lookup
import { SMALL_TALK_LESSONS, UNITS, lessonsFor, unitOf, type Unit, type UnitId } from "@/content/smallTalk";
// Load the record type
import type { SessionRecord } from "@/data/records";

// How far through one unit's lessons
export interface UnitProgress {
  // The unit
  unit: Unit;
  // Lessons answered at least once
  lessonsDone: number;
  // Lessons in the unit
  lessonsTotal: number;
  // The first lesson not yet answered (null once all are)
  nextLesson: { id: string; number: number; title: string } | null;
  // Drills done in the unit (lessons not counted)
  drills: number;
}

// Each unit's progress, in the units' order, from the saved sessions (only small-talk answers count)
export function unitProgress(sessions: ReadonlyArray<SessionRecord>): UnitProgress[] {
  // The small-talk answers
  const answers = sessions.filter((session) => session.mode === "smalltalk");
  // The prompts answered
  const answered = new Set(answers.map((session) => session.promptId));
  // Drills per unit
  const drills = new Map<UnitId, number>();
  // Count each answer that is not a lesson in its unit
  for (const answer of answers) if (!SMALL_TALK_LESSONS.some((lesson) => lesson.id === answer.promptId)) drills.set(unitOf(answer.promptId), (drills.get(unitOf(answer.promptId)) ?? 0) + 1);
  // One entry per unit
  return UNITS.map((unit) => {
    // Its lessons
    const lessons = lessonsFor(unit.id);
    // The first not answered
    const next = lessons.find((lesson) => !answered.has(lesson.id));
    // The entry
    return { unit, lessonsDone: lessons.filter((lesson) => answered.has(lesson.id)).length, lessonsTotal: lessons.length, nextLesson: next ? { id: next.id, number: next.number, title: next.title } : null, drills: drills.get(unit.id) ?? 0 };
  });
}

// The unit to suggest next: the first whose lessons are not all done; once every lesson is done, the unit with the fewest drills done (the earlier one on a tie)
export function nextUnit(sessions: ReadonlyArray<SessionRecord>): UnitProgress {
  // Every unit's progress
  const all = unitProgress(sessions);
  // The first with a lesson to do
  const unfinished = all.find((item) => item.nextLesson !== null);
  // That one
  if (unfinished) return unfinished;
  // Otherwise the least practised, the earliest on a tie
  return all.reduce((least, item) => (item.drills < least.drills ? item : least));
}
