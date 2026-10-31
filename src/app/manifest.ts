// The web app manifest: lets phones install VoiceLab to the home screen (milestone 10)

// Load the manifest type
import type { MetadataRoute } from "next";
// Load the app name
import { APP_NAME } from "@/core/appInfo";
// Load the theme, so splash and status colors follow the theme file
import { DEFAULT_THEME, THEMES } from "@/theme/themes";

// The light palette of the app's theme
const palette = THEMES[DEFAULT_THEME].colors.light;

// Describe the installed app
export default function manifest(): MetadataRoute.Manifest {
  // Name, start page, colors, and icons
  return {
    // Full name
    name: APP_NAME,
    // Name under the home-screen icon
    short_name: APP_NAME,
    // One-line description
    description: "Private public-speaking practice.",
    // Open at Home
    start_url: "/",
    // Open without browser bars
    display: "standalone",
    // Splash screen color: the page color
    background_color: palette["paper-raised"],
    // Status bar color: the accent
    theme_color: palette.accent,
    // Long-press shortcuts on the installed icon (Android and desktop): straight into today's practice, or a Rapid Fire
    shortcuts: [
      // Today's practice
      { name: "Today’s practice", short_name: "Today", url: "/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
      // A surprise question (Practice picks the day's topic)
      { name: "Rapid Fire question", short_name: "Rapid Fire", url: "/practice", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
    ],
    // Home-screen icons
    icons: [
      // Standard small icon
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      // Standard large icon
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      // Large icon with safe margins, for Android's shaped icons
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
