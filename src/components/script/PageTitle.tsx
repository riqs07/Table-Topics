// A main page's title: its name, large, with at most one short muted line under it (design pass, decision 59)

// Load the type for content passed in
import type { ReactNode } from "react";

// Draw the title
export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  // The name, then the line
  return (
    <>
      {/* The page's name */}
      <h1 className="mt-6 font-display text-statement tracking-tight">{title}</h1>
      {/* One short line on what is here */}
      {children && <p className="mt-2 max-w-[52ch] text-ink-muted">{children}</p>}
    </>
  );
}
