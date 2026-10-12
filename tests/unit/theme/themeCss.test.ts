// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load Node's file reader to inspect the global stylesheet
import { readFileSync } from "node:fs";
// Load the role list
import { ROLES } from "@/theme/roles";
// Load the stylesheet builder being checked
import { themeCss } from "@/theme/themeCss";
// Load the themes
import { THEMES } from "@/theme/themes";

// Build the stylesheet once for all checks
const css = themeCss();

// Group the checks about the generated theme stylesheet
describe("themeCss", () => {
  // Each theme is switched on by a data-theme attribute
  it("has a block for each theme", () => {
    // Check every theme id
    for (const id of Object.keys(THEMES)) expect(css).toContain(`[data-theme="${id}"] {`);
  });

  // Every role becomes a CSS variable with the theme's light value
  it("sets every role variable to the light value by default", () => {
    // Check every role in the notebook theme
    for (const role of ROLES) expect(css).toContain(`--vl-${role}: ${THEMES.notebook.colors.light[role]};`);
  });

  // Dark mode follows the phone's setting unless light is forced
  it("switches to dark colors when the phone prefers dark", () => {
    // Confirm the media query and the selector that respects a forced light mode
    expect(css).toContain(`@media (prefers-color-scheme: dark) {\n[data-theme="notebook"]:not([data-mode="light"]) {`);
    // Confirm a dark value is present
    expect(css).toContain(`--vl-paper: ${THEMES.notebook.colors.dark.paper};`);
  });

  // The style page needs to show dark mode regardless of the phone's setting
  it("can force dark mode with a data-mode attribute", () => {
    // Confirm the forced-dark selector exists
    expect(css).toContain(`[data-theme="notebook"][data-mode="dark"] {`);
  });

  // Fonts are part of the theme too
  it("sets the body and display font variables", () => {
    // Confirm the notebook body font stack is set
    expect(css).toContain(`--vl-font-body: ${THEMES.notebook.fonts.body};`);
    // Confirm the notebook display font stack is set
    expect(css).toContain(`--vl-font-display: ${THEMES.notebook.fonts.display};`);
  });
});

// Group the checks that the global stylesheet exposes every role to Tailwind
describe("globals.css", () => {
  // Read the global stylesheet
  const globals = readFileSync("src/app/globals.css", "utf8");

  // Every role must be usable as a Tailwind class such as bg-paper
  it("maps every role to a Tailwind color", () => {
    // Check every role
    for (const role of ROLES) expect(globals).toContain(`--color-${role}: var(--vl-${role});`);
  });

  // Tailwind's built-in palette must be switched off so raw colors like bg-blue-500 do not exist
  it("switches off Tailwind's built-in colors and fonts", () => {
    // Confirm the built-in colors are cleared
    expect(globals).toContain("--color-*: initial;");
    // Confirm the built-in fonts are cleared
    expect(globals).toContain("--font-*: initial;");
  });

  // Nested themed areas (like the style page previews) must get their own colors, not the page's
  it("reads theme variables directly in page-wide defaults, not the Tailwind aliases", () => {
    // Take only the base-layer defaults
    const base = globals.slice(globals.indexOf("@layer base"));
    // Confirm no default reads an alias, which would be fixed to the page root's theme
    expect(base).not.toMatch(/var\(--(color|font)-/);
  });
});
