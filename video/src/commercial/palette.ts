// The commercial's colours and faces: the proposed "direction B" look (Playful) that the user chose in November 2026
// These are plain values, not the app's theme roles, because the app has not moved to this look yet; when it does, they become roles (see documents/design/design-system.md)

// Load the faces (Fredoka for headings and numbers, Nunito for text)
import "@fontsource/fredoka/500.css";
import "@fontsource/fredoka/600.css";
import "@fontsource/fredoka/700.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";

// The heading face
export const ROUND = "Fredoka, 'Nunito', sans-serif";
// The text face
export const TEXT = "Nunito, system-ui, sans-serif";

// Direction B's light colours
export const B = {
  // The page, cards, text, muted text and hairlines
  bg: "#fff7ef", card: "#ffffff", ink: "#2b2320", muted: "#7a6c64", line: "#f0e2d6",
  // The action green, its darker edge, and text on it
  accent: "#3fa66b", accentD: "#2c8050", onAccent: "#ffffff",
  // The paper of drawings
  hl: "#fff6e6",
  // The six illustration colours
  sky: "#4a68e0", sun: "#f4b73b", bloom: "#e86aae", leaf: "#7cc46a", plum: "#8a63e0", coral: "#ec6a55",
  // Soft panels: warm, green (good) and amber (rough, never red)
  soft: "#fbeee2", greenSoft: "#e4f5e8", greenInk: "#22704a", roughBg: "#fff0d6", roughInk: "#8a5410",
  // A pause word's highlight, and a path stop not reached yet
  hilite: "#ffe2a8", pathOff: "#eadbcd",
  // The characters' own colours: you (apricot), the friend (teal), Sage (pine)
  apricot: "#e8935c", teal: "#2fb3a4", pine: "#2d5a3d",
  // The dark stage (the boss and the opening)
  night: "#1d1916", nightCard: "#2a2420", nightInk: "#fbefe4",
} as const;

// A colour mixed towards another (for tinted panels), as CSS
export const mix = (color: string, percent: number, base: string = B.card): string => `color-mix(in srgb, ${color} ${percent}%, ${base})`;
