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

// Write CSS variable lines for only the roles an area overrides
function partialVariables(palette: Partial<Palette>): string {
  // Each role the area sets
  return ROLES.filter((role) => palette[role] !== undefined).map((role) => `--vl-${role}: ${palette[role]};`).join("\n");
}

// Write the CSS blocks for one theme
function themeBlocks(id: string, theme: Theme): string {
  // Selector that switches this theme on
  const base = `[data-theme="${id}"]`;
  // Put all the pieces together
  return [
    // Light colors and fonts by default
    `${base} {\n${paletteVariables(theme.colors.light)}\n--vl-font-body: ${theme.fonts.body};\n--vl-font-display: ${theme.fonts.display};\ncolor-scheme: light;\n}`,
    // Dark colors when dark mode is forced (for a themed panel that must stay dark)
    `${base}[data-mode="dark"] {\n${paletteVariables(theme.colors.dark)}\ncolor-scheme: dark;\n}`,
    // Dark colors when the user chose to follow the device and it prefers dark (light is the default, decision 70)
    `@media (prefers-color-scheme: dark) {\n${base}[data-mode="system"] {\n${paletteVariables(theme.colors.dark)}\ncolor-scheme: dark;\n}\n}`,
    // Each area's own surfaces, light, forced dark, and dark when the phone prefers it; the whole page takes them while an area is showing, so the tab bar and the edges match (decision 69)
    ...Object.entries(theme.areas ?? {}).flatMap(([area, palettes]) => [
      // Light
      `${base}:has([data-area="${area}"]), ${base} [data-area="${area}"] {\n${partialVariables(palettes.light)}\n}`,
      // Forced dark
      `${base}[data-mode="dark"]:has([data-area="${area}"]), ${base}[data-mode="dark"] [data-area="${area}"] {\n${partialVariables(palettes.dark)}\n}`,
      // Preferred dark, when following the device
      `@media (prefers-color-scheme: dark) {\n${base}[data-mode="system"]:has([data-area="${area}"]), ${base}[data-mode="system"] [data-area="${area}"] {\n${partialVariables(palettes.dark)}\n}\n}`,
    ]),
  ].join("\n");
}

// The full theme stylesheet for every theme
export function themeCss(): string {
  // Join the blocks for each theme
  return Object.entries(THEMES)
    .map(([id, theme]) => themeBlocks(id, theme))
    .join("\n");
}
