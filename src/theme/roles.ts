// The named purposes every theme must fill in; components use these names, never raw colors

// Every color role, in a fixed order (see documents/design/design-system.md)
export const ROLES = [
  // Page background
  "paper",
  // Slightly lifted surfaces such as sheets and the record panel
  "paper-raised",
  // Main text
  "ink",
  // Secondary text and captions
  "ink-muted",
  // Thin dividing lines and borders
  "rule",
  // The record button and "your one fix" only
  "accent",
  // Text placed on the accent color
  "accent-ink",
  // Large filled areas: the action band, main buttons and icon tiles (quieter than the accent in dark mode)
  "fill",
  // Text placed on a large filled area
  "fill-ink",
  // Cards lifted off the page (white in light mode; decision 69)
  "card",
  // The warm accent, for highlights, "next" marks and celebration shapes (never for text)
  "warm",
  // Text on the warm tint
  "warm-ink",
  // A soft warm background for what is next and for today's mission
  "warm-tint",
  // Marks (ticks, icons) drawn on the warm accent
  "on-warm",
  // Filler words in a transcript: quiet, never alarming
  "filler",
  // Keyboard focus outline
  "focus-ring",
  // Table Topics timing light: the minimum is met (green)
  "light-green",
  // Table Topics timing light: start wrapping up (yellow)
  "light-yellow",
  // Table Topics timing light: finish now (red)
  "light-red",
] as const;

// One color role name
export type Role = (typeof ROLES)[number];

// A minimum contrast one color must have against another
export interface ContrastRule {
  // The color in front (text, icon, or outline)
  foreground: Role;
  // The color behind it
  background: Role;
  // The lowest acceptable WCAG contrast ratio
  minimum: number;
}

// WCAG AA: 4.5 for normal text, 3 for large controls and focus outlines
const TEXT = 4.5;
// The lower WCAG AA threshold for non-text elements
const NON_TEXT = 3;

// Every pairing that appears in the app and must stay readable
export const CONTRAST_RULES: ReadonlyArray<ContrastRule> = [
  // Main text on both surfaces
  { foreground: "ink", background: "paper", minimum: TEXT },
  // (same, on lifted surfaces)
  { foreground: "ink", background: "paper-raised", minimum: TEXT },
  // Secondary text on both surfaces
  { foreground: "ink-muted", background: "paper", minimum: TEXT },
  // (same, on lifted surfaces)
  { foreground: "ink-muted", background: "paper-raised", minimum: TEXT },
  // Filler words are still text, so they must stay readable on both surfaces
  { foreground: "filler", background: "paper", minimum: TEXT },
  // (same, on lifted surfaces)
  { foreground: "filler", background: "paper-raised", minimum: TEXT },
  // Text on the record button and fix highlight
  { foreground: "accent-ink", background: "accent", minimum: TEXT },
  // Text on the action band, main buttons and icon tiles
  { foreground: "fill-ink", background: "fill", minimum: TEXT },
  // Text on cards
  { foreground: "ink", background: "card", minimum: TEXT },
  // (secondary text too)
  { foreground: "ink-muted", background: "card", minimum: TEXT },
  // Text on the warm tint
  { foreground: "warm-ink", background: "warm-tint", minimum: TEXT },
  // Main text on the warm tint
  { foreground: "ink", background: "warm-tint", minimum: TEXT },
  // (secondary text too, as in the mission card)
  { foreground: "ink-muted", background: "warm-tint", minimum: TEXT },
  // Numbers, ticks and icons drawn on the warm accent
  { foreground: "on-warm", background: "warm", minimum: TEXT },
  // Muted numbers on the plain paper tiles inside a card
  { foreground: "ink-muted", background: "paper", minimum: TEXT },
  // Progress bars and rings in the accent must show on a card
  { foreground: "accent", background: "card", minimum: NON_TEXT },
  // The accent shape must stand out from both surfaces
  { foreground: "accent", background: "paper", minimum: NON_TEXT },
  // (same, on lifted surfaces)
  { foreground: "accent", background: "paper-raised", minimum: NON_TEXT },
  // The focus outline must be visible on both surfaces
  { foreground: "focus-ring", background: "paper", minimum: NON_TEXT },
  // (same, on lifted surfaces)
  { foreground: "focus-ring", background: "paper-raised", minimum: NON_TEXT },
  // The green timing light must stand out from both surfaces
  { foreground: "light-green", background: "paper", minimum: NON_TEXT },
  // (same, on lifted surfaces)
  { foreground: "light-green", background: "paper-raised", minimum: NON_TEXT },
  // The yellow timing light must stand out from both surfaces
  { foreground: "light-yellow", background: "paper", minimum: NON_TEXT },
  // (same, on lifted surfaces)
  { foreground: "light-yellow", background: "paper-raised", minimum: NON_TEXT },
  // The red timing light must stand out from both surfaces
  { foreground: "light-red", background: "paper", minimum: NON_TEXT },
  // (same, on lifted surfaces)
  { foreground: "light-red", background: "paper-raised", minimum: NON_TEXT },
];
