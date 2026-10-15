// The masthead at the top of every screen: the main navigation, then the title in small capitals with an italic note or links on the right

// Load Next.js's link component
import Link from "next/link";
// Load the type for content passed in
import type { ReactNode } from "react";

// The sections the main navigation leads to
export type Section = "home" | "lessons" | "library" | "rehearse" | "history" | "settings";

// Each section's name and address, in order
const SECTIONS: ReadonlyArray<{ id: Section; name: string; href: string }> = [
  // The starting page
  { id: "home", name: "Home", href: "/" },
  // The skill path
  { id: "lessons", name: "Lessons", href: "/lessons" },
  // The practice library
  { id: "library", name: "Library", href: "/library" },
  // Rehearse my talk
  { id: "rehearse", name: "Rehearse", href: "/rehearse" },
  // Past sessions
  { id: "history", name: "History", href: "/history" },
  // Settings
  { id: "settings", name: "Settings", href: "/settings" },
];

// What the masthead shows
interface MastheadProps {
  // Title on the left
  title: string;
  // Italic note or links on the right
  children?: ReactNode;
  // The section this screen belongs to, marked in the navigation (none for a session page)
  section?: Section;
  // Whether to show the main navigation (hidden while recording, so a stray click cannot lose a take)
  nav?: boolean;
}

// Draw the masthead
export function Masthead({ title, children, section, nav = true }: MastheadProps) {
  // Navigation row, then a baseline-aligned title row over a solid hairline
  return (
    <>
      {/* The main navigation: the same places on every screen (wrapping onto a second line on a narrow phone if needed) */}
      {nav && (
        <nav aria-label="Main" className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-footnote md:mb-4 md:gap-x-5">
          {/* One link per section */}
          {SECTIONS.map((item) => (
            // The current section is marked and shown in ink without an underline; the others are quiet links
            <Link key={item.id} href={item.href} aria-current={item.id === section ? "page" : undefined} className={item.id === section ? "text-ink" : "text-ink-muted underline underline-offset-4 hover:text-ink"}>
              {item.name}
            </Link>
          ))}
        </nav>
      )}
      {/* Header landmark with the ink rule underneath */}
      <header className="flex items-baseline justify-between gap-4 border-b border-ink pb-2 md:pb-3">
        {/* Title in small capitals */}
        <span className="text-lg tracking-wide [font-variant-caps:small-caps] md:text-xl">{title}</span>
        {/* Note or links in italic */}
        <span className="italic text-ink-muted">{children}</span>
      </header>
    </>
  );
}
