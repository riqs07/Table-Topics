// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load React's tool for turning a component into plain HTML text
import { renderToStaticMarkup } from "react-dom/server";
// Load the wireframes page being checked
import WireframesPage from "@/app/wireframes/page";

// Render the page once for all checks
const html = renderToStaticMarkup(<WireframesPage />);

// Group the checks about the wireframes for checkpoint C11
describe("wireframes page", () => {
  // Wireframes are grayscale so the review is about layout, not color
  it("draws everything in the gray theme", () => {
    // Confirm the gray theme wraps the screens
    expect(html).toContain('data-theme="gray"');
  });

  // The five screens of the core loop are shown and named
  it("shows home, recording, feedback, retry result, and history", () => {
    // Confirm there are exactly five captioned screens
    expect(html.match(/<figcaption/g)).toHaveLength(5);
    // Check each screen's caption text
    for (const name of ["Home", "Recording", "Feedback", "Retry result", "History"]) expect(html).toContain(name);
  });

  // The feedback screen has exactly the three parts from the PRD
  it("shows keep, change, and retry cue on the feedback screen", () => {
    // Check each label
    for (const label of ["Keep", "Change", "Before you retry"]) expect(html).toContain(label);
  });

  // History shows progress against the first recording
  it("marks the baseline in history", () => {
    // Confirm the baseline label
    expect(html).toContain("First recording");
  });
});
