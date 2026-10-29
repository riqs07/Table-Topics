// A hand-drawn person (decision 134): an Open Peeps character (CC0, by Pablo Stanley) kept as a file in public/illustrations, shown for a few big moments only. Each is ink lines on white fills; the page blends the white into whatever is behind it, and in dark mode turns the lines light, so one file suits every theme. Decorative: the words beside it carry the meaning

// Load Next.js's image, which leaves SVG files as they are
import Image from "next/image";

// The drawings there are, by where they are used: the file, and its size as the file gives it (so the page keeps its place before it loads)
export const DRAWINGS = {
  // The welcome: someone mid-explanation, smiling
  welcome: { src: "/illustrations/peep-welcome.svg", width: 746, height: 1173 },
  // A finished course: someone with arms open, delighted
  courseDone: { src: "/illustrations/peep-course-done.svg", width: 1189, height: 1266 },
} as const;

// Which drawing
export type DrawingName = keyof typeof DRAWINGS;

// Draw one, sized by the class given (its shape is kept)
export function Drawing({ name, className = "" }: { name: DrawingName; className?: string }) {
  // Which file, and its size
  const { src, width, height } = DRAWINGS[name];
  // The image, unnamed for screen readers, blended into the page
  return <Image src={src} alt="" width={width} height={height} data-drawing={name} className={`vl-drawing w-auto ${className}`} />;
}
