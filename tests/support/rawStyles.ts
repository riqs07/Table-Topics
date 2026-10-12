// Finds raw colors and fonts in source text, so components can be held to theme roles only

// Tailwind class prefixes that take a color
const COLOR_PREFIXES = "bg|text|border|border-[trblxy]|ring|fill|stroke|from|via|to|outline|decoration|divide|placeholder|accent|caret|shadow";
// Tailwind's built-in palette names
const PALETTE = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

// Every raw-style pattern, combined so matches come back in the order they appear
const RAW_STYLE = new RegExp(
  [
    // Arbitrary Tailwind values such as bg-[#123] or font-['Inter'] (checked first so they are reported whole)
    String.raw`\b(?:${COLOR_PREFIXES}|font)-\[[^\]]*\]`,
    // Built-in palette classes such as bg-blue-500
    String.raw`\b(?:${COLOR_PREFIXES})-(?:${PALETTE})-\d{2,3}\b`,
    // Built-in black and white classes such as text-white
    String.raw`\b(?:${COLOR_PREFIXES})-(?:white|black)\b`,
    // Hex colors such as #fff or #1a2b3c
    String.raw`(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b`,
    // CSS color functions such as rgb( or oklch(
    String.raw`\b(?:rgba?|hsla?|oklch|oklab)\(`,
    // Inline font choices
    String.raw`\bfontFamily\b|\bfont-family\b`,
  ].join("|"),
  // Find every match, not just the first
  "g",
);

// List every raw color or font found in a piece of source text
export function findRawStyles(source: string): string[] {
  // Collect the matched text of every hit, in order
  return [...source.matchAll(RAW_STYLE)].map((match) => match[0]);
}
