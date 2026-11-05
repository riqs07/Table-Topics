// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a component
import { cleanup, render } from "@testing-library/react";
// Load what is being checked
import { COURSE_TILE_NAMES, CourseTile } from "@/components/scenes/CourseTile";

// Remove the drawn component after each check
afterEach(cleanup);

// Every tile
const NAMES = COURSE_TILE_NAMES;

// Group the checks about the course tiles (decision 142)
describe("CourseTile", () => {
  // Each tile draws the warm blob with its shade and at least one moving part, hidden from screen readers, on the 200 square
  it("draws every tile with the shaded blob and something that moves", () => {
    // Draw each and read what it drew
    const drawn = NAMES.map((name) => {
      // Draw it
      const { container, unmount } = render(<CourseTile name={name} />);
      // Its root
      const svg = container.querySelector("svg");
      // Its name, whether hidden, its square, whether it has the blob and its shade, and a moving part
      const result = [svg?.getAttribute("data-course-tile"), svg?.getAttribute("aria-hidden"), svg?.getAttribute("viewBox"), !!container.querySelector("path.fill-warm"), !!container.querySelector("path.fill-warm-shade"), container.querySelectorAll(".s-move").length > 0];
      // Clear it
      unmount();
      // Hand it back
      return result;
    });
    // Confirm each
    expect(drawn).toEqual(NAMES.map((name) => [name, "true", "0 0 200 200", true, true, true]));
  });

  // How much it moves is carried for the styles to read: always by default, or a few rounds, or only blinking
  it("carries how much it moves", () => {
    // Read the setting for each choice
    const motion = (choice?: "few" | "still") => {
      // Draw it
      const { container, unmount } = render(<CourseTile name="land-it" motion={choice} />);
      // The setting
      const result = container.querySelector("svg")?.getAttribute("data-motion");
      // Clear it
      unmount();
      // Hand it back
      return result;
    };
    // Confirm the default and the two others
    expect([motion(), motion("few"), motion("still")]).toEqual(["loop", "few", "still"]);
  });

  // The Illustration Study's richer rendering: the tile turns the light on for its blob, lights its ground with a gradient of its own and lays a grain over it, all named after its own clip
  it("lights each tile: its blob's light, a lit ground and a grain", () => {
    // Draw one
    const { container } = render(<CourseTile name="buy-a-beat" />);
    // Its root
    const svg = container.querySelector("svg") as SVGSVGElement;
    // Its clip's id
    const id = container.querySelector("clipPath")?.id;
    // The switch for the blob's lit details, the blob's light, the lit ground and the grain
    const result = [svg.style.getPropertyValue("--vl-art-on"), svg.style.getPropertyValue("--vl-art-lit"), !!container.querySelector(`[fill="url(#${id}-ground)"]`), !!container.querySelector(`[filter="url(#${id}-grain)"]`)];
    // Confirm each, the ground's gradient made from its own role
    expect(result).toEqual(["1", `url(#${id}-lit)`, true, true]);
    // Confirm the ground's gradient reads the theme's colour, not a raw one
    expect(container.querySelector(`#${id}-ground stop`)?.getAttribute("style")).toContain("var(--vl-art-leaf)");
  });

  // Two tiles on one page each keep their background shapes inside their own tile
  it("gives each tile its own clip", () => {
    // Draw two
    const { container } = render(<><CourseTile name="stop-freezing" /><CourseTile name="the-run" /></>);
    // Their clips' ids
    const ids = [...container.querySelectorAll("clipPath")].map((clip) => clip.id);
    // Every shape clipped to a tile names one of them
    const used = [...container.querySelectorAll("[clip-path]")].map((shape) => shape.getAttribute("clip-path"));
    // Confirm two different ids, safe in url(), and every clipped shape pointing at one
    expect([ids.length, new Set(ids).size, ids.every((id) => /^tile-[a-zA-Z0-9-]+$/.test(id)), used.every((url) => ids.some((id) => url === `url(#${id})`))]).toEqual([2, 2, true, true]);
  });
});
