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
  // Since the script-page direction was chosen, wireframes use the app's real theme so the type can be judged
  it("draws the screens in the app theme", () => {
    // Confirm the calm studio theme wraps the screens
    expect(html).toContain('data-theme="calm-studio"');
  });

  // The five screens of the core loop are shown and named
  it("shows home, recording, feedback, retry result, and history", () => {
    // Confirm there are exactly five captioned screens
    expect(html.match(/<figcaption/g)).toHaveLength(5);
    // Check each screen's caption text
    for (const name of ["Home", "Recording", "Feedback", "Retry result", "History"]) expect(html).toContain(name);
  });

  // The feedback screen has exactly the three parts from the PRD, written as run-in headings
  it("shows keep, change, and retry cue on the feedback screen", () => {
    // Check each heading
    for (const label of ["What to keep.", "One change.", "Before you try again"]) expect(html).toContain(label);
  });

  // History shows progress against the first recording
  it("marks the baseline in history", () => {
    // Confirm the baseline label
    expect(html).toContain("first recording");
  });

  // The recording screen shows a live level meter (borrowed from the tape-recorder direction)
  it("shows a level meter while recording", () => {
    // Confirm the meter is labeled for screen readers
    expect(html).toContain('aria-label="Microphone level"');
  });

  // The script-page direction drops the patterns that read as template-made
  it("avoids pill buttons and uppercase micro-labels", () => {
    // Confirm no fully rounded buttons
    expect(html).not.toContain("rounded-full");
    // Confirm no uppercase letter-spaced labels
    expect(html).not.toContain("uppercase");
  });
});
