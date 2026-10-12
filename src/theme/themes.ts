// All theme colors and fonts live in this one file, so a palette change is one edit (decision 11)

// Load the role names every theme must fill in
import type { Role } from "@/theme/roles";

// A color for every role
export type Palette = Record<Role, string>;

// One complete theme
export interface Theme {
  // Name shown on the style page
  name: string;
  // One-line description shown on the style page
  description: string;
  // Colors for light and dark mode
  colors: { light: Palette; dark: Palette };
  // CSS font stacks; the variables are set by the font loader in theme/fonts.ts
  fonts: { body: string; display: string };
}

// The phone's own fonts, used as a fallback in every stack
const SYSTEM_SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
// A serif fallback for display text
const SYSTEM_SERIF = "Georgia, 'Times New Roman', serif";

// Every theme, keyed by id
export const THEMES = {
  // Warm paper and ink with a terracotta accent (recommended direction)
  notebook: {
    // Name shown on the style page
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
        // Filler words in a transcript
        "filler": "#736a61",
        // Keyboard focus outline
        "focus-ring": "#2f5d50",
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
        // Filler words in a transcript
        "filler": "#a59a8b",
        // Keyboard focus outline
        "focus-ring": "#8fc7b6",
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
    // Name shown on the style page
    name: "Calm studio",
    // What the theme is going for
    description: "Cool stone grays, one forest green accent, minimal and quiet. Chosen at C6.",
    // Colors for each mode
    colors: {
      // Daytime colors
      light: {
        // Page background
        "paper": "#f3f4f2",
        // Lifted surfaces
        "paper-raised": "#fcfcfb",
        // Main text
        "ink": "#1e2320",
        // Secondary text
        "ink-muted": "#59615c",
        // Dividing lines
        "rule": "#d4d9d5",
        // Record button and your one fix
        "accent": "#2d5a3d",
        // Text on the accent
        "accent-ink": "#fcfcfb",
        // Filler words in a transcript
        "filler": "#666e69",
        // Keyboard focus outline
        "focus-ring": "#2c5a88",
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
        // Filler words in a transcript
        "filler": "#959d98",
        // Keyboard focus outline
        "focus-ring": "#9cc3e8",
      },
    },
    // One modern sans for everything
    fonts: {
      // Font for running text
      body: `var(--font-figtree), ${SYSTEM_SANS}`,
      // Font for headings and the daily prompt
      display: `var(--font-figtree), ${SYSTEM_SANS}`,
    },
  },
  // Neutral grayscale for building screens before a palette is chosen
  gray: {
    // Name shown on the style page
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
        // Filler words in a transcript
        "filler": "#6b6b6b",
        // Keyboard focus outline
        "focus-ring": "#3d3d3d",
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
        // Filler words in a transcript
        "filler": "#949494",
        // Keyboard focus outline
        "focus-ring": "#f2f2f2",
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
