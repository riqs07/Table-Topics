// Color contrast using the WCAG 2 formula, used to test that every theme is readable (risk R13)

// Turn a hex color such as "#1a2b3c" or "#abc" into red, green and blue values from 0 to 255
function hexToRgb(hex: string): [number, number, number] {
  // Accept only "#" followed by three or six hex digits
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  // Refuse anything else so a typo in a theme fails loudly
  if (!match?.[1]) throw new Error(`Not a hex color: ${hex}`);
  // Expand three-digit shorthand to six digits
  const digits = match[1].length === 3 ? [...match[1]].map((d) => d + d).join("") : match[1];
  // Read each pair of digits as one channel
  return [0, 2, 4].map((start) => parseInt(digits.slice(start, start + 2), 16)) as [number, number, number];
}

// How bright a color looks to the eye, from 0 (black) to 1 (white)
function relativeLuminance(hex: string): number {
  // Convert each channel to the 0-1 range and undo the screen's brightness curve
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    // Scale the channel to 0-1
    const c = channel / 255;
    // Apply the standard sRGB conversion
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  // Weight the channels by how sensitive the eye is to each
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Contrast between two colors, from 1 (none) to 21 (black on white)
export function contrastRatio(first: string, second: string): number {
  // Work out the brightness of both colors
  const a = relativeLuminance(first);
  // Brightness of the second color
  const b = relativeLuminance(second);
  // Divide the lighter by the darker, with the standard offset for screen glare
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
