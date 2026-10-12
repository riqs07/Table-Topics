// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load React's tool for turning a component into plain HTML text
import { renderToStaticMarkup } from "react-dom/server";
// Load the home page component being checked
import HomePage from "@/app/page";

// Render the page once for all checks
const html = renderToStaticMarkup(<HomePage />);

// Group the checks about the placeholder home page
describe("home page", () => {
  // The page should greet the user with the app's name as its main heading
  it("shows the app name as the main heading", () => {
    // Confirm there is a main heading that reads VoiceLab
    expect(html).toMatch(/<h1[^>]*>VoiceLab<\/h1>/);
  });

  // While building, the style page must be easy to reach for checkpoint C6
  it("links to the style page", () => {
    // Confirm a link to /style exists
    expect(html).toContain('href="/style"');
  });
});
