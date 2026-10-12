// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the contrast calculator
import { contrastRatio } from "@/theme/contrast";
// Load the role list and the readability rules
import { CONTRAST_RULES, ROLES } from "@/theme/roles";
// Load the themes being checked
import { DEFAULT_THEME, THEMES } from "@/theme/themes";

// Every theme, as id and definition pairs
const themeEntries = Object.entries(THEMES);
// Both color modes each theme must define
const MODES = ["light", "dark"] as const;

// Group the checks about the theme set
describe("themes", () => {
  // The design system calls for three starter themes
  it("offers the three starter themes", () => {
    // Confirm the theme ids
    expect(Object.keys(THEMES).sort()).toEqual(["calm-studio", "gray", "notebook"]);
  });

  // Calm studio was chosen at checkpoint C6
  it("uses the calm studio theme chosen at C6", () => {
    // Confirm the app theme
    expect(DEFAULT_THEME).toBe("calm-studio");
  });

  // At C6 the accent was changed from sage to forest green
  it("gives calm studio a forest green accent", () => {
    // Confirm the light accent
    expect(THEMES["calm-studio"].colors.light.accent).toBe("#2d5a3d");
    // Confirm the dark accent
    expect(THEMES["calm-studio"].colors.dark.accent).toBe("#6fae84");
  });

  // Every role must be filled in, or a component would show no color
  it.each(themeEntries)("%s defines every role in both modes with a valid hex color", (_id, theme) => {
    // Check light and dark
    for (const mode of MODES) {
      // Confirm the roles match the official list exactly
      expect(Object.keys(theme.colors[mode]).sort()).toEqual([...ROLES].sort());
      // Confirm every value is a hex color
      for (const value of Object.values(theme.colors[mode])) expect(value).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  // Every text and background pair must be readable (WCAG AA), in every theme and mode
  it.each(themeEntries)("%s passes every contrast rule in both modes", (_id, theme) => {
    // Collect any failures so the message lists them all at once
    const failures: string[] = [];
    // Check light and dark
    for (const mode of MODES) {
      // Check each rule
      for (const rule of CONTRAST_RULES) {
        // Work out the contrast for this pair
        const ratio = contrastRatio(theme.colors[mode][rule.foreground], theme.colors[mode][rule.background]);
        // Record the pair if it falls short
        if (ratio < rule.minimum) failures.push(`${mode}: ${rule.foreground} on ${rule.background} is ${ratio.toFixed(2)}, needs ${rule.minimum}`);
      }
    }
    // Confirm there were no failures
    expect(failures).toEqual([]);
  });

  // Each theme names a body font and a display font
  it.each(themeEntries)("%s names a body and a display font", (_id, theme) => {
    // Confirm the body font is set
    expect(theme.fonts.body.length).toBeGreaterThan(0);
    // Confirm the display font is set
    expect(theme.fonts.display.length).toBeGreaterThan(0);
  });
});
