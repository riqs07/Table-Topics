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
  // Filler words in a transcript: quiet, never alarming
  "filler",
  // Keyboard focus outline
  "focus-ring",
  // Timing light near the goal of a talk (yellow)
  "caution",
  // Timing light past the goal of a talk (red)
  "over",
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
  // The accent shape must stand out from both surfaces
  { foreground: "accent", background: "paper", minimum: NON_TEXT },
  // (same, on lifted surfaces)
  { foreground: "accent", background: "paper-raised", minimum: NON_TEXT },
  // The focus outline must be visible on both surfaces
  { foreground: "focus-ring", background: "paper", minimum: NON_TEXT },
  // (same, on lifted surfaces)
  { foreground: "focus-ring", background: "paper-raised", minimum: NON_TEXT },
  // The yellow timing light must stand out from both surfaces
  { foreground: "caution", background: "paper", minimum: NON_TEXT },
  // (same, on lifted surfaces)
  { foreground: "caution", background: "paper-raised", minimum: NON_TEXT },
  // The red timing light must stand out from both surfaces
  { foreground: "over", background: "paper", minimum: NON_TEXT },
  // (same, on lifted surfaces)
  { foreground: "over", background: "paper-raised", minimum: NON_TEXT },
];
