// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { courseTile, lessonTile } from "@/components/scenes/tileFor";
// Load the courses
import { COURSES } from "@/content/courses";

// The courses and lessons whose tiles are still to be drawn (decision 144: the words came first, the tiles come next). Take each one off as its tile is drawn
const TO_DRAW = ["stop-freezing/back", ...COURSES.filter((course) => course.id !== "stop-freezing").flatMap((course) => [course.id, ...course.lessons.map((lesson) => `${course.id}/${lesson.id}`)])];

// Group the checks about which tile stands for a course or lesson (decision 142)
describe("tileFor", () => {
  // Every course and every lesson has a tile, except those listed as still to draw, so none falls back to a plain icon or heading by accident
  it("gives every course and lesson a tile", () => {
    // The courses and lessons without one
    const missing = COURSES.flatMap((course) => [...(courseTile(course.id) ? [] : [course.id]), ...course.lessons.filter((lesson) => !lessonTile(course.id, lesson.id)).map((lesson) => `${course.id}/${lesson.id}`)]);
    // Confirm only the ones still to draw
    expect(missing).toEqual(TO_DRAW);
  });

  // An unknown course or lesson has none
  it("gives none to an unknown course or lesson", () => {
    // Confirm both
    expect([courseTile("nope"), lessonTile("stop-freezing", "nope")]).toEqual([null, null]);
  });
});
