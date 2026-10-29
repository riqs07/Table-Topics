// The app's theme as plain CSS for the videos: every colour role as a variable and as the few utility classes the drawings use (the app gets these from Tailwind)

// Load the role names and the themes
import { ROLES } from "@/theme/roles";
import { DEFAULT_THEME, THEMES } from "@/theme/themes";

// The app's own theme, in daytime colours
const palette = THEMES[DEFAULT_THEME].colors.light;
// The opacity steps the drawings use
const OPACITIES = [10, 15, 20, 30, 35, 45, 50, 55, 60, 75, 85, 90];

// The stylesheet
export const THEME_CSS = [
  // Every role as a variable, and the display face for numbers in scenes
  `:root { ${ROLES.map((role) => `--color-${role}: ${palette[role]};`).join(" ")} --vl-font-display: "Fraunces Variable", Georgia, serif; }`,
  // Fill, stroke and text colour for every role
  ...ROLES.map((role) => `.fill-${role} { fill: var(--color-${role}); } .stroke-${role} { stroke: var(--color-${role}); } .text-${role} { color: var(--color-${role}); }`),
  // The current colour
  ".fill-current { fill: currentColor; } .stroke-current { stroke: currentColor; } .overflow-visible { overflow: visible; }",
  // Opacity steps
  ...OPACITIES.map((step) => `.opacity-${step} { opacity: ${step / 100}; }`),
].join("\n");

// A colour role as a CSS value, for inline styles
export const role = (name: (typeof ROLES)[number]): string => `var(--color-${name})`;

// A colour role see-through, as a CSS value (percent of the colour kept)
export const tint = (name: (typeof ROLES)[number], percent: number): string => `color-mix(in srgb, var(--color-${name}) ${percent}%, transparent)`;
