// All theme colors and fonts live in this one file, so a palette change is one edit (decision 11)

// Load the role names every theme must fill in
import type { Role } from "@/theme/roles";

// A color for every role
export type Palette = Record<Role, string>;

// One complete theme
export interface Theme {
  // The theme's name
  name: string;
  // One line on what the theme is
  description: string;
  // Colors for light and dark mode
  colors: { light: Palette; dark: Palette };
  // CSS font stacks; the variables are set by the font loader in theme/fonts.ts
  fonts: { body: string; display: string };
  // Optional per-area overrides (an element with data-area="learn" and so on), for light and dark (decision 69)
  areas?: Partial<Record<AreaId, { light: Partial<Palette>; dark: Partial<Palette> }>>;
}

// The areas that can carry their own surfaces
export type AreaId = "learn" | "results" | "stage";

// The phone's own fonts, used as a fallback in every stack
const SYSTEM_SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
// A serif fallback for display text
const SYSTEM_SERIF = "Georgia, 'Times New Roman', serif";

// Every theme, keyed by id
export const THEMES = {
  // Warm paper and ink with a terracotta accent (recommended direction)
  notebook: {
    // The theme's name
    name: "Notebook",
    // What the theme is going for
    description: "Warm paper, ink text, one terracotta accent. A private practice journal.",
    // Colors for each mode
    colors: {
      // Daytime colors
      light: {
        // Page background
        "paper": "#f6f1e7",
        // Lifted surfaces
        "paper-raised": "#fffcf6",
        // Main text
        "ink": "#2a2420",
        // Secondary text
        "ink-muted": "#685d53",
        // Dividing lines
        "rule": "#ddd3c2",
        // Record button and your one fix
        "accent": "#a94a28",
        // Text on the accent
        "accent-ink": "#fffcf6",
        // Large filled areas: the action band, main buttons, icon tiles
        "fill": "#a94a28",
        // Text on large filled areas
        "fill-ink": "#fffcf6",
        // Cards lifted off the page
        "card": "#ffffff",
        // The warm accent, for highlights and celebration shapes
        "warm": "#e8935c",
        // Text on the warm tint
        "warm-ink": "#7a3418",
        // A soft warm background for what is next
        "warm-tint": "#f8e3d2",
        // Marks drawn on the warm accent
        "on-warm": "#2a2420",
        // Filler words in a transcript
        "filler": "#736a61",
        // Keyboard focus outline
        "focus-ring": "#2f5d50",
        // Table Topics timing light (green)
        "light-green": "#2e7d32",
        // Table Topics timing light (yellow)
        "light-yellow": "#a87a00",
        // Table Topics timing light (red)
        "light-red": "#c0392b",
        // The blob's shaded side on course tiles
        "warm-shade": "#cf7440",
        // Course tile colours: sky, sun, bloom, leaf, plum, coral and cream
        "art-sky": "#4a68e0",
        // (sun)
        "art-sun": "#f4b73b",
        // (bloom)
        "art-bloom": "#e86aae",
        // (leaf)
        "art-leaf": "#7cc46a",
        // (plum)
        "art-plum": "#8a63e0",
        // (coral)
        "art-coral": "#ec6a55",
        // (cream)
        "art-cream": "#fff6e6",
      },
      // Night colors: warm charcoal, not blue-black
      dark: {
        // Page background
        "paper": "#1d1a17",
        // Lifted surfaces
        "paper-raised": "#27231f",
        // Main text
        "ink": "#ede6da",
        // Secondary text
        "ink-muted": "#b5aa9b",
        // Dividing lines
        "rule": "#3b352f",
        // Record button and your one fix
        "accent": "#e08a66",
        // Text on the accent
        "accent-ink": "#1d1a17",
        // Large filled areas: the action band, main buttons, icon tiles
        "fill": "#e08a66",
        // Text on large filled areas
        "fill-ink": "#1d1a17",
        // Cards lifted off the page
        "card": "#2f2a25",
        // The warm accent, for highlights and celebration shapes
        "warm": "#e8935c",
        // Text on the warm tint
        "warm-ink": "#f2c3a1",
        // A soft warm background for what is next
        "warm-tint": "#3a2b20",
        // Marks drawn on the warm accent
        "on-warm": "#1d1a17",
        // Filler words in a transcript
        "filler": "#a59a8b",
        // Keyboard focus outline
        "focus-ring": "#8fc7b6",
        // Table Topics timing light (green)
        "light-green": "#66bb6a",
        // Table Topics timing light (yellow)
        "light-yellow": "#e8b923",
        // Table Topics timing light (red)
        "light-red": "#f26b5b",
        // The blob's shaded side on course tiles
        "warm-shade": "#c46a38",
        // Course tile colours: sky, sun, bloom, leaf, plum, coral and cream
        "art-sky": "#3f5bc9",
        // (sun)
        "art-sun": "#e0a530",
        // (bloom)
        "art-bloom": "#d45c9d",
        // (leaf)
        "art-leaf": "#66ad57",
        // (plum)
        "art-plum": "#7656cc",
        // (coral)
        "art-coral": "#d85c48",
        // (cream)
        "art-cream": "#f3e9d6",
      },
    },
    // Readable body face and a soft serif for headings and prompts
    fonts: {
      // Font for running text
      body: `var(--font-atkinson), ${SYSTEM_SANS}`,
      // Font for headings and the daily prompt
      display: `var(--font-young-serif), ${SYSTEM_SERIF}`,
    },
  },
  // Cool stone grays with a forest green accent (chosen at C6)
  "calm-studio": {
    // The theme's name
    name: "Calm studio",
    // What the theme is going for
    description: "Warm cream, forest green and apricot, Fraunces headlines over Atkinson Hyperlegible text. Chosen at C6, warmed up in decision 69.",
    // Colors for each mode
    colors: {
      // Daytime colors
      light: {
        // Page background
        "paper": "#f3ece2",
        // Lifted surfaces
        "paper-raised": "#fbf6ef",
        // Main text
        "ink": "#1e2320",
        // Secondary text
        "ink-muted": "#59615c",
        // Dividing lines
        "rule": "#e6dccf",
        // Record button and your one fix
        "accent": "#2d5a3d",
        // Text on the accent
        "accent-ink": "#fcfcfb",
        // Large filled areas: the action band, main buttons, icon tiles
        "fill": "#2d5a3d",
        // Text on large filled areas
        "fill-ink": "#fcfcfb",
        // Cards lifted off the page
        "card": "#ffffff",
        // The warm accent, for highlights and celebration shapes
        "warm": "#f4a46c",
        // Text on the warm tint
        "warm-ink": "#8a3f1f",
        // A soft warm background for what is next
        "warm-tint": "#fce7d6",
        // Marks drawn on the warm accent
        "on-warm": "#1e2320",
        // Filler words in a transcript
        "filler": "#5f6762",
        // Keyboard focus outline
        "focus-ring": "#2c5a88",
        // Table Topics timing light (green)
        "light-green": "#2e7d32",
        // Table Topics timing light (yellow)
        "light-yellow": "#a87a00",
        // Table Topics timing light (red)
        "light-red": "#c0392b",
        // The blob's shaded side on course tiles
        "warm-shade": "#d9844c",
        // Course tile colours: sky, sun, bloom, leaf, plum, coral and cream
        "art-sky": "#4a68e0",
        // (sun)
        "art-sun": "#f4b73b",
        // (bloom)
        "art-bloom": "#e86aae",
        // (leaf)
        "art-leaf": "#7cc46a",
        // (plum)
        "art-plum": "#8a63e0",
        // (coral)
        "art-coral": "#ec6a55",
        // (cream)
        "art-cream": "#fff6e6",
      },
      // Night colors
      dark: {
        // Page background
        "paper": "#161917",
        // Lifted surfaces
        "paper-raised": "#1f2320",
        // Main text
        "ink": "#e5eae6",
        // Secondary text
        "ink-muted": "#a7afaa",
        // Dividing lines
        "rule": "#333934",
        // Record button and your one fix
        "accent": "#6fae84",
        // Text on the accent
        "accent-ink": "#161917",
        // Large filled areas: the action band, main buttons, icon tiles
        "fill": "#3d6b4e",
        // Text on large filled areas
        "fill-ink": "#eef2ef",
        // Cards lifted off the page
        "card": "#242925",
        // The warm accent, for highlights and celebration shapes
        "warm": "#e8935c",
        // Text on the warm tint
        "warm-ink": "#f2c3a1",
        // A soft warm background for what is next
        "warm-tint": "#3a2b20",
        // Marks drawn on the warm accent
        "on-warm": "#161917",
        // Filler words in a transcript
        "filler": "#959d98",
        // Keyboard focus outline
        "focus-ring": "#9cc3e8",
        // Table Topics timing light (green)
        "light-green": "#66bb6a",
        // Table Topics timing light (yellow)
        "light-yellow": "#e8b923",
        // Table Topics timing light (red)
        "light-red": "#f26b5b",
        // The blob's shaded side on course tiles
        "warm-shade": "#c46a38",
        // Course tile colours: sky, sun, bloom, leaf, plum, coral and cream
        "art-sky": "#3f5bc9",
        // (sun)
        "art-sun": "#e0a530",
        // (bloom)
        "art-bloom": "#d45c9d",
        // (leaf)
        "art-leaf": "#66ad57",
        // (plum)
        "art-plum": "#7656cc",
        // (coral)
        "art-coral": "#d85c48",
        // (cream)
        "art-cream": "#f3e9d6",
      },
    },
    // One editorial serif for everything (script-page direction)
    // Each area's own surfaces and, for the recording stage, its own ink (decision 69)
    areas: {
      // Learn: warm sand
      learn: { light: { "paper-raised": "#f6efe3", "paper": "#efe4d3" }, dark: { "paper-raised": "#211e19", "paper": "#1a1814" } },
      // A session's results: pale green
      results: { light: { "paper-raised": "#f3f7f2", "paper": "#e3eee6" }, dark: { "paper-raised": "#1b221d", "paper": "#151a16" } },
      // The recording stage: deep green with light ink, in both modes
      stage: {
        light: { "paper-raised": "#12291c", "paper": "#0c1f15", "ink": "#f4f1ea", "ink-muted": "#b9c9be", "rule": "#3c5a47", "accent": "#8bd3a0", "fill": "#f4f1ea", "fill-ink": "#12291c", "filler": "#a9bcb0", "card": "#1b3626", "accent-ink": "#12291c", "warm-tint": "#3a2b20", "warm-ink": "#f2c3a1", "focus-ring": "#9cc3e8", "light-green": "#66bb6a", "light-yellow": "#e8b923", "light-red": "#f26b5b" },
        dark: { "paper-raised": "#0e1e15", "paper": "#09160f", "ink": "#f4f1ea", "ink-muted": "#b9c9be", "rule": "#33503e", "accent": "#8bd3a0", "fill": "#f4f1ea", "fill-ink": "#12291c", "filler": "#a9bcb0", "card": "#173022", "accent-ink": "#12291c", "warm-tint": "#3a2b20", "warm-ink": "#f2c3a1", "focus-ring": "#9cc3e8", "light-green": "#66bb6a", "light-yellow": "#e8b923", "light-red": "#f26b5b" },
      },
    },
    fonts: {
      // Font for running text
      body: `var(--font-atkinson), ${SYSTEM_SANS}`,
      // Font for headings and the daily prompt
      display: `var(--font-fraunces), ${SYSTEM_SERIF}`,
    },
  },
  // Neutral grayscale for building screens before a palette is chosen
  gray: {
    // The theme's name
    name: "Gray",
    // What the theme is going for
    description: "Neutral grayscale. Kept for comparison.",
    // Colors for each mode
    colors: {
      // Daytime colors
      light: {
        // Page background
        "paper": "#f4f4f4",
        // Lifted surfaces
        "paper-raised": "#ffffff",
        // Main text
        "ink": "#1a1a1a",
        // Secondary text
        "ink-muted": "#595959",
        // Dividing lines
        "rule": "#d4d4d4",
        // Record button and your one fix
        "accent": "#333333",
        // Text on the accent
        "accent-ink": "#ffffff",
        // Large filled areas: the action band, main buttons, icon tiles
        "fill": "#333333",
        // Text on large filled areas
        "fill-ink": "#ffffff",
        // Cards lifted off the page
        "card": "#ffffff",
        // The warm accent, for highlights and celebration shapes
        "warm": "#b0b0b0",
        // Text on the warm tint
        "warm-ink": "#1f1f1f",
        // A soft warm background for what is next
        "warm-tint": "#ececec",
        // Marks drawn on the warm accent
        "on-warm": "#161616",
        // Filler words in a transcript
        "filler": "#6b6b6b",
        // Keyboard focus outline
        "focus-ring": "#3d3d3d",
        // Table Topics timing light (green)
        "light-green": "#2e7d32",
        // Table Topics timing light (yellow)
        "light-yellow": "#a87a00",
        // Table Topics timing light (red)
        "light-red": "#c0392b",
        // The blob's shaded side on course tiles
        "warm-shade": "#8f8f8f",
        // Course tile colours: sky, sun, bloom, leaf, plum, coral and cream
        "art-sky": "#6e6e6e",
        // (sun)
        "art-sun": "#c8c8c8",
        // (bloom)
        "art-bloom": "#a0a0a0",
        // (leaf)
        "art-leaf": "#b8b8b8",
        // (plum)
        "art-plum": "#7a7a7a",
        // (coral)
        "art-coral": "#909090",
        // (cream)
        "art-cream": "#f4f4f4",
      },
      // Night colors
      dark: {
        // Page background
        "paper": "#161616",
        // Lifted surfaces
        "paper-raised": "#202020",
        // Main text
        "ink": "#ededed",
        // Secondary text
        "ink-muted": "#a8a8a8",
        // Dividing lines
        "rule": "#363636",
        // Record button and your one fix
        "accent": "#d9d9d9",
        // Text on the accent
        "accent-ink": "#161616",
        // Large filled areas: the action band, main buttons, icon tiles
        "fill": "#d9d9d9",
        // Text on large filled areas
        "fill-ink": "#161616",
        // Cards lifted off the page
        "card": "#262626",
        // The warm accent, for highlights and celebration shapes
        "warm": "#8a8a8a",
        // Text on the warm tint
        "warm-ink": "#f0f0f0",
        // A soft warm background for what is next
        "warm-tint": "#333333",
        // Marks drawn on the warm accent
        "on-warm": "#161616",
        // Filler words in a transcript
        "filler": "#949494",
        // Keyboard focus outline
        "focus-ring": "#f2f2f2",
        // Table Topics timing light (green)
        "light-green": "#66bb6a",
        // Table Topics timing light (yellow)
        "light-yellow": "#e8b923",
        // Table Topics timing light (red)
        "light-red": "#f26b5b",
        // The blob's shaded side on course tiles
        "warm-shade": "#6e6e6e",
        // Course tile colours: sky, sun, bloom, leaf, plum, coral and cream
        "art-sky": "#555555",
        // (sun)
        "art-sun": "#9a9a9a",
        // (bloom)
        "art-bloom": "#7c7c7c",
        // (leaf)
        "art-leaf": "#8c8c8c",
        // (plum)
        "art-plum": "#5e5e5e",
        // (coral)
        "art-coral": "#707070",
        // (cream)
        "art-cream": "#e6e6e6",
      },
    },
    // The phone's own fonts
    fonts: { body: SYSTEM_SANS, display: SYSTEM_SANS },
  },
} satisfies Record<string, Theme>;

// One theme id
export type ThemeId = keyof typeof THEMES;

// The app's theme, chosen at checkpoint C6
export const DEFAULT_THEME: ThemeId = "calm-studio";
