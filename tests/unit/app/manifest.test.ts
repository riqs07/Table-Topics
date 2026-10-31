// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the manifest being checked
import manifest from "@/app/manifest";
// Load the themes, so colors are checked against the theme file
import { DEFAULT_THEME, THEMES } from "@/theme/themes";

// Build the manifest once
const result = manifest();

// Group the checks about the installable-app manifest
describe("web app manifest", () => {
  // Installed, it opens like an app at the home screen
  it("opens standalone at the home page", () => {
    // Confirm the name
    expect(result.name).toBe("VoiceLab");
    // Confirm it opens at Home
    expect(result.start_url).toBe("/");
    // Confirm it opens without browser bars
    expect(result.display).toBe("standalone");
  });

  // Splash and status colors come from the theme file, not raw values here
  it("takes its colors from the app theme", () => {
    // Confirm the background matches the theme's paper
    expect(result.background_color).toBe(THEMES[DEFAULT_THEME].colors.light["paper-raised"]);
    // Confirm the theme color matches the accent
    expect(result.theme_color).toBe(THEMES[DEFAULT_THEME].colors.light.accent);
  });

  // Long-press shortcuts lead to pages the app has
  it("offers shortcuts to pages that exist", () => {
    // The shortcut addresses
    const urls = (manifest().shortcuts ?? []).map((shortcut) => shortcut.url);
    // Confirm two, each a real page
    expect(urls).toEqual(["/", "/practice"]);
  });

  // Phones need 192 and 512 pixel icons, plus a maskable one for Android shapes
  it("lists 192 and 512 pixel icons, including a maskable one", () => {
    // Collect the sizes
    const sizes = (result.icons ?? []).map((icon) => icon.sizes);
    // Confirm both sizes
    expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    // Confirm a maskable icon
    expect((result.icons ?? []).some((icon) => icon.purpose === "maskable")).toBe(true);
  });
});
