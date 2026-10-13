// The masthead line at the top of every screen: title in small capitals, an italic note or links on the right

// Load the type for content passed in
import type { ReactNode } from "react";

// What the masthead shows
interface MastheadProps {
  // Title on the left
  title: string;
  // Italic note or links on the right
  children?: ReactNode;
}

// Draw the masthead
export function Masthead({ title, children }: MastheadProps) {
  // A baseline-aligned row over a solid hairline
  return (
    // Header landmark with the ink rule underneath
    <header className="flex items-baseline justify-between gap-4 border-b border-ink pb-2 md:pb-3">
      {/* Title in small capitals */}
      <span className="text-lg tracking-wide [font-variant-caps:small-caps] md:text-xl">{title}</span>
      {/* Note or links in italic */}
      <span className="italic text-ink-muted">{children}</span>
    </header>
  );
}
