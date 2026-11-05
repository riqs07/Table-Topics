// A folded group as a card: a row with its name, a short line and a count, that opens to its list (decision 79; used on Skills, Openings and closings, and Small talk)

// Load React's effect tool
import { useEffect } from "react";
// Load the chevron
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
// Load the type for content passed in
import type { ReactNode } from "react";
// Load the shared press effect
import { PRESS } from "./Buttons";
// Load the card look
import { CARD } from "./textStyles";
// Load the mode tile and its look type
import { ModeTile } from "@/components/scenes/ModeTile";
import type { ModeTileLook } from "@/components/scenes/modeTileFor";

// What a fold shows
interface FoldCardProps {
  // Its id, so a link such as /voice#pausing can open it
  id?: string;
  // Its name
  name: string;
  // A short line under the name
  detail?: string;
  // How many things are inside
  count?: number;
  // A mode tile beside the name (second design pass), when the group is a kind of practice
  look?: ModeTileLook;
  // The list
  children: ReactNode;
  // A picture at the start of the row, such as a mode tile (second design pass; optional, the row's words take the display face beside it)
  art?: ReactNode;
}

// Draw the fold
export function FoldCard({ id, name, detail, count, look, children, art }: FoldCardProps) {
  // A card that opens and closes
  return (
    <details id={id} className={`group scroll-mt-6 px-4 open:col-span-full ${CARD}`}>
      {/* The row */}
      <summary className={`flex min-h-14 cursor-pointer list-none items-center gap-3 py-2 [&::-webkit-details-marker]:hidden ${PRESS}`}>
        {/* The group's tile or picture, when it has one (still, apart from blinking) */}
        {look && <ModeTile ground={look.ground} prop={look.prop} face={look.face} still className="size-12 flex-none" />}
        {art}
        {/* Name and what it is */}
        <span className="min-w-0 flex-1"><span className="block font-display text-lg leading-tight font-semibold">{name}</span>{detail && <span className="block text-footnote font-bold text-ink-muted">{detail}</span>}</span>
        {/* How many */}
        {count !== undefined && <span className="text-footnote font-extrabold text-ink-muted">{count}</span>}
        {/* The chevron, turning down when open */}
        <CaretRightIcon aria-hidden="true" className="size-5 flex-none text-ink-muted transition-transform group-open:rotate-90" />
      </summary>
      {/* The list */}
      <div className="pb-4">{children}</div>
    </details>
  );
}

// Open the fold a link points at (such as /voice#pausing), and bring it into view; also when the address's # changes
export function useOpenFoldFromAddress(): void {
  // Once in the browser
  useEffect(() => {
    // Open the fold named in the address, if any
    const openFromAddress = () => {
      // The fold
      const fold = document.getElementById(window.location.hash.slice(1));
      // Only a fold
      if (!(fold instanceof HTMLDetailsElement)) return;
      // Open it
      fold.open = true;
      // Into view
      fold.scrollIntoView?.({ block: "start" });
    };
    // Now
    openFromAddress();
    // And when the address changes
    window.addEventListener("hashchange", openFromAddress);
    // Stop listening when leaving
    return () => window.removeEventListener("hashchange", openFromAddress);
  }, []);
}
