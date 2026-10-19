// A folded group as a card: a row with its name, a short line and a count, that opens to its list (decision 79; used on Skills, Openings and closings, and Small talk)

// Load the chevron
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
// Load the type for content passed in
import type { ReactNode } from "react";
// Load the shared press effect
import { PRESS } from "./Buttons";
// Load the card look
import { CARD } from "./textStyles";

// What a fold shows
interface FoldCardProps {
  // Its id, so a link such as /skills#pause-drills can open it
  id?: string;
  // Its name
  name: string;
  // A short line under the name
  detail?: string;
  // How many things are inside
  count?: number;
  // The list
  children: ReactNode;
}

// Draw the fold
export function FoldCard({ id, name, detail, count, children }: FoldCardProps) {
  // A card that opens and closes
  return (
    <details id={id} className={`group scroll-mt-6 px-4 ${CARD}`}>
      {/* The row */}
      <summary className={`flex min-h-14 cursor-pointer list-none items-center gap-3 py-2 [&::-webkit-details-marker]:hidden ${PRESS}`}>
        {/* Name and what it is */}
        <span className="min-w-0 flex-1"><span className="block font-semibold">{name}</span>{detail && <span className="block text-footnote text-ink-muted">{detail}</span>}</span>
        {/* How many */}
        {count !== undefined && <span className="text-footnote text-ink-muted">{count}</span>}
        {/* The chevron, turning down when open */}
        <CaretRightIcon aria-hidden="true" className="size-5 flex-none text-ink-muted transition-transform group-open:rotate-90" />
      </summary>
      {/* The list */}
      <div className="pb-4">{children}</div>
    </details>
  );
}
