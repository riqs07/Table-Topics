// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load React's tool for turning a component into plain HTML text
import { renderToStaticMarkup } from "react-dom/server";
// Load the style page component being checked
import StylePage from "@/app/style/page";
// Load the themes so the check covers every one
import { THEMES } from "@/theme/themes";

// Render the page once for all checks
const html = renderToStaticMarkup(<StylePage />);

// Group the checks about the style page (checkpoint C6)
describe("style page", () => {
  // Each theme gets a preview in light and in dark
  it("previews every theme in light and dark mode", () => {
    // Check every theme
    for (const id of Object.keys(THEMES)) {
      // Confirm a forced-light preview exists
      expect(html).toContain(`data-theme="${id}" data-mode="light"`);
      // Confirm a forced-dark preview exists
      expect(html).toContain(`data-theme="${id}" data-mode="dark"`);
    }
  });

  // Each preview is labeled with the theme's name
  it("names every theme", () => {
    // Check every theme name appears
    for (const theme of Object.values(THEMES)) expect(html).toContain(theme.name);
  });

  // The previews show the real building blocks of a session
  it("shows a prompt, a transcript with marked fillers, the one fix, and the record button", () => {
    // Confirm the sample prompt appears
    expect(html).toContain("Today’s prompt");
    // Confirm filler words are marked with the filler role
    expect(html).toContain('class="text-filler');
    // Confirm the one-fix block appears
    expect(html).toContain("Your one fix");
    // Confirm the record button appears
    expect(html).toContain("Record");
  });

  // The page proves readability by showing the measured contrast
  it("shows the measured text contrast for each preview", () => {
    // Confirm contrast ratios are printed, such as "14.2:1"
    expect(html).toMatch(/\d+\.\d:1/);
  });
});
