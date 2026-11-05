// The top of a role play's list page (UI rewrite, second pass; extrapolated from Desktop Screens "Practice" and the job lists): "‹ Practice", the page's name with one short line, and the cast member it is with beside it on a computer

// Load Next.js's link component
import Link from "next/link";
// Load the back arrow
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
// Load the type for content passed in
import type { ReactNode } from "react";
// Load the shared link look
import { TEXT_LINK } from "@/components/script/Buttons";

// The way back, the name and the line, and the figure
export function HubTitle({ title, line, figure }: { title: string; line: string; figure?: ReactNode }) {
  // The block
  return (
    <>
      {/* The way back to Practice */}
      <p className="mt-1 md:-mt-12"><Link href="/practice" className={`${TEXT_LINK} -ml-1 gap-1 text-footnote`}><CaretLeftIcon aria-hidden="true" weight="bold" className="size-4" />Practice</Link></p>
      {/* The name and line, with the figure beside them on a computer */}
      <div data-wide className="mt-2 flex items-center justify-between gap-4">
        {/* The words */}
        <div className="flex min-w-0 flex-col gap-1">
          {/* The page's name */}
          <h1 className="font-display text-statement leading-none font-semibold motion-safe:animate-rise">{title}</h1>
          {/* One short line */}
          <p className="max-w-[60ch] font-bold text-ink-muted">{line}</p>
        </div>
        {/* The figure, on a computer */}
        {figure && <span aria-hidden="true" className="hidden flex-none md:flex">{figure}</span>}
      </div>
    </>
  );
}
