// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { courseTile, lessonTile } from "@/components/scenes/tileFor";
// Load the courses
import { COURSES } from "@/content/courses";

// Group the checks about which tile stands for a course or lesson (decision 142)
describe("tileFor", () => {
  // Every course and every lesson has a tile, so none falls back to a plain icon or heading by accident
  it("gives every course and lesson a tile", () => {
    // The courses and lessons without one
    const missing = COURSES.flatMap((course) => [...(courseTile(course.id) ? [] : [course.id]), ...course.lessons.filter((lesson) => !lessonTile(course.id, lesson.id)).map((lesson) => `${course.id}/${lesson.id}`)]);
    // Confirm none
    expect(missing).toEqual([]);
  });

  // Each tile stands for one course or lesson only, so no two look the same on a page (decision 145)
  it("uses each tile once", () => {
    // Every tile used, for courses and lessons
    const used = COURSES.flatMap((course) => [courseTile(course.id), ...course.lessons.map((lesson) => lessonTile(course.id, lesson.id))]);
    // Confirm none repeats
    expect(used.filter((name, index) => used.indexOf(name) !== index)).toEqual([]);
  });

  // An unknown course or lesson has none
  it("gives none to an unknown course or lesson", () => {
    // Confirm both
    expect([courseTile("nope"), lessonTile("stop-freezing", "nope")]).toEqual([null, null]);
  });
});
