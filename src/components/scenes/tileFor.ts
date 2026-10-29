// Which course tile stands for a course or one of its lessons (decision 142); one with none keeps its icon or plain heading

// Load the tile names
import type { CourseTileName } from "@/components/scenes/CourseTile";

// Each course's tile, by course id
const COURSE_TILES: Readonly<Record<string, CourseTileName>> = {
  // Stop freezing: breaking out of the ice
  "stop-freezing": "stop-freezing",
};

// Each lesson's tile, by course id and lesson id
const LESSON_TILES: Readonly<Record<string, CourseTileName>> = {
  // Buy a beat: a breath and a pause
  "stop-freezing/beat": "buy-a-beat",
  // Point first: the arrow in the bullseye
  "stop-freezing/point": "point-first",
  // Point, reason, example: three steps
  "stop-freezing/pre": "point-reason-example",
  // Land it: down on the target
  "stop-freezing/land": "land-it",
  // The run: all of it, at a run
  "stop-freezing/run": "the-run",
};

// A course's tile, or none
export function courseTile(courseId: string): CourseTileName | null {
  // Looked up by id
  return COURSE_TILES[courseId] ?? null;
}

// A lesson's tile, or none
export function lessonTile(courseId: string, lessonId: string): CourseTileName | null {
  // Looked up by both ids
  return LESSON_TILES[`${courseId}/${lessonId}`] ?? null;
}
