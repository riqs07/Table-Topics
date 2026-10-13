// A footnote: a thin rule and smaller text for anything secondary

// Load the type for content passed in
import type { ReactNode } from "react";

// Draw a footnote line
export function Footnote({ children }: { children: ReactNode }) {
  // A row of smaller text with a thin rule above
  return <div className="flex items-start gap-3 border-t border-rule py-3 text-footnote leading-snug">{children}</div>;
}
