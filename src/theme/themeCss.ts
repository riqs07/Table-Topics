// Builds the CSS that turns each theme into variables, so components only ever name roles

// Load the role list
import { ROLES } from "@/theme/roles";
// Load the themes and their types
import { THEMES, type Palette, type Theme } from "@/theme/themes";

// Write one CSS variable line per role for a palette
function paletteVariables(palette: Palette): string {
  // Turn each role into "--vl-role: value;"
  return ROLES.map((role) => `--vl-${role}: ${palette[role]};`).join("\n");
}

// Write the CSS blocks for one theme
function themeBlocks(id: string, theme: Theme): string {
  // Selector that switches this theme on
  const base = `[data-theme="${id}"]`;
  // Put all the pieces together
  return [
    // Light colors and fonts by default
    `${base} {\n${paletteVariables(theme.colors.light)}\n--vl-font-body: ${theme.fonts.body};\n--vl-font-display: ${theme.fonts.display};\ncolor-scheme: light;\n}`,
    // Dark colors when dark mode is forced (used by the style page)
    `${base}[data-mode="dark"] {\n${paletteVariables(theme.colors.dark)}\ncolor-scheme: dark;\n}`,
    // Dark colors when the phone prefers dark, unless light is forced
    `@media (prefers-color-scheme: dark) {\n${base}:not([data-mode="light"]) {\n${paletteVariables(theme.colors.dark)}\ncolor-scheme: dark;\n}\n}`,
  ].join("\n");
}

// The full theme stylesheet for every theme
export function themeCss(): string {
  // Join the blocks for each theme
  return Object.entries(THEMES)
    .map(([id, theme]) => themeBlocks(id, theme))
    .join("\n");
}
