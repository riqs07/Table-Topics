// The lesson path's marks: done for practised lessons, next for the first one not yet done

// How a lesson shows on the path
export type LessonMark = "done" | "next" | "open";

// Mark each lesson in order, from how many times each has been practised (by id)
export function lessonPath(lessonIds: ReadonlyArray<string>, counts: ReadonlyMap<string, number>): LessonMark[] {
  // The first lesson not yet practised
  const next = lessonIds.find((id) => (counts.get(id) ?? 0) === 0);
  // Done, next, or still open
  return lessonIds.map((id) => ((counts.get(id) ?? 0) > 0 ? "done" : id === next ? "next" : "open"));
}
