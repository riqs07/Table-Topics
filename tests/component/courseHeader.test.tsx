// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a component
import { cleanup, render } from "@testing-library/react";
// Load what is being checked
import { COURSE_HEADER_IDS, CourseHeader, hasCourseHeader } from "@/components/scenes/CourseHeader";
// Load the shaded blob, to check its lit look stays off outside a lit drawing
import { Body } from "@/components/scenes/tiles/parts";
// Load the courses
import { COURSES } from "@/content/courses";

// Remove the drawn component after each check
afterEach(cleanup);

// Group the checks about the course headers (the Illustration Study)
describe("CourseHeader", () => {
  // Every course in the app has its own header scene, and no header is left over
  it("has a header for every course", () => {
    // Confirm the same ids, in any order
    expect([...COURSE_HEADER_IDS].sort()).toEqual(COURSES.map((course) => course.id).sort());
  });

  // A header carries meaning: an image with a label, the warm blob in it, filling its width at 5:2
  it("draws each course's scene as a labelled image", () => {
    // Draw each and read what it drew
    const drawn = COURSES.map((course) => {
      // Draw it
      const { container, unmount } = render(<CourseHeader course={course.id} />);
      // Its root
      const svg = container.querySelector("svg");
      // Its course, role, whether it has a label, its shape, whether it has the blob, and whether it fills the width
      const result = [svg?.getAttribute("data-course-header"), svg?.getAttribute("role"), (svg?.getAttribute("aria-label") ?? "").length > 10, svg?.getAttribute("viewBox"), !!container.querySelector("path.fill-warm"), svg?.classList.contains("w-full")];
      // Clear it
      unmount();
      // Hand it back
      return result;
    });
    // Confirm each
    expect(drawn).toEqual(COURSES.map((course) => [course.id, "img", true, "0 0 1200 480", true, true]));
  });

  // Behind words, it can fill a box of any shape, cropped round its middle; a label can replace its own
  it("can cover its box and take a label", () => {
    // Draw it to cover, with a label
    const { container } = render(<CourseHeader course="stop-freezing" fit="cover" label="Stop freezing" />);
    // Its root
    const svg = container.querySelector("svg");
    // Confirm cropped, filling its box, and labelled
    expect([svg?.getAttribute("preserveAspectRatio"), svg?.classList.contains("size-full"), svg?.getAttribute("aria-label")]).toEqual(["xMidYMid slice", true, "Stop freezing"]);
  });

  // Two headers on one page keep their own gradients
  it("gives each header its own ids", () => {
    // Draw two
    const { container } = render(<><CourseHeader course="stop-freezing" /><CourseHeader course="stories-that-land" /></>);
    // Every id drawn
    const ids = [...container.querySelectorAll("[id]")].map((element) => element.id);
    // Confirm none repeats
    expect(new Set(ids).size).toBe(ids.length);
  });

  // An unknown course draws nothing
  it("draws nothing for a course without a header", () => {
    // Draw one
    const { container } = render(<CourseHeader course="no-such-course" />);
    // Confirm empty, and the check agrees
    expect([container.innerHTML, hasCourseHeader("no-such-course"), hasCourseHeader("stop-freezing")]).toEqual(["", false, true]);
  });
});

// Group the checks about the blob's lit look
describe("Body", () => {
  // Outside a lit drawing (the cast, the videos) the lit details read a switch that is off by default, so the blob stays flat
  it("keeps its lit details behind the drawing's switch", () => {
    // Draw a blob on its own
    const { container } = render(<svg><Body x={0} y={0} r={50} face="ready" /></svg>);
    // The cheeks', shadow's and catchlights' switch
    const switches = [...container.querySelectorAll("[style*='--vl-art-on']")].map((element) => element.getAttribute("style"));
    // Confirm there are some, each off unless a drawing turns it on
    expect([switches.length >= 3, switches.every((style) => style?.includes("var(--vl-art-on, 0)"))]).toEqual([true, true]);
  });

  // The flat look leaves the lit details out altogether
  it("draws no lit details when asked to stay flat", () => {
    // Draw a flat blob
    const { container } = render(<svg><Body x={0} y={0} r={50} face="ready" look="flat" /></svg>);
    // Confirm none
    expect(container.querySelectorAll("[style*='--vl-art']").length).toBe(0);
  });
});
