// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load React's tool for turning a component into plain HTML text
import { renderToStaticMarkup } from "react-dom/server";
// Load the home page component being checked
import HomePage from "@/app/page";

// Group the checks about the placeholder home page
describe("home page", () => {
  // The page should greet the user with the app's name as its main heading
  it("shows the app name as the main heading", () => {
    // Render the page to HTML text
    const html = renderToStaticMarkup(<HomePage />);
    // Confirm the main heading carries the app name
    expect(html).toContain("<h1>VoiceLab</h1>");
  });
});
