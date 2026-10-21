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

  // Light is the default; dark follows the phone only when the user chose Auto (decision 70)
  it("switches to dark colors when the phone prefers dark only when following the device", () => {
    // Confirm the media query applies only with data-mode="system", never without an attribute
    expect([css.includes(`@media (prefers-color-scheme: dark) {\n[data-theme="notebook"][data-mode="system"] {`), css.includes(`:not([data-mode="light"])`)]).toEqual([true, false]);
    // Confirm a dark value is present
    expect(css).toContain(`--vl-paper: ${THEMES.notebook.colors.dark.paper};`);
  });

  // A forced-dark panel needs to show dark mode regardless of the phone's setting
  it("can force dark mode with a data-mode attribute", () => {
    // Confirm the forced-dark selector exists
    expect(css).toContain(`[data-theme="notebook"][data-mode="dark"] {`);
  });

  // An area (the recording stage) gets its own surfaces, and the whole page takes them while it shows (decision 69)
  it("writes each area's colours for the area and for the page around it, in light and dark", () => {
    // Confirm the light, forced-dark and preferred-dark selectors
    expect([css.includes(`[data-theme="calm-studio"]:has([data-area="stage"]), [data-theme="calm-studio"] [data-area="stage"] {`), css.includes(`[data-theme="calm-studio"][data-mode="dark"]:has([data-area="stage"])`), css.includes(`[data-theme="calm-studio"][data-mode="system"]:has([data-area="stage"])`), css.includes(`--vl-paper-raised: ${THEMES["calm-studio"].areas.stage.light["paper-raised"]};`)]).toEqual([true, true, true, true]);
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

  // Nested themed areas (a themed panel inside the page) must get their own colors, not the page's
  it("reads theme variables directly in page-wide defaults, not the Tailwind aliases", () => {
    // Take only the base-layer defaults
    const base = globals.slice(globals.indexOf("@layer base"));
    // Confirm no default reads an alias, which would be fixed to the page root's theme
    expect(base).not.toMatch(/var\(--(color|font)-/);
  });
});
