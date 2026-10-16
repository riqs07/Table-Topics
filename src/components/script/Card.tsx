// A card: a square-cornered panel on the plain paper with a hairline edge, for one thing a person can choose

// Load React's types
import type { ReactNode } from "react";
// Load the icon type
import type { Icon } from "@phosphor-icons/react";

// Draw a card, named by its heading for screen readers, with an optional icon at the top
export function Card({ labelledBy, icon: IconShape, children }: { labelledBy: string; icon?: Icon; children: ReactNode }) {
  // A named region, laid out top to bottom so actions can sit at the bottom
  return (
    <section aria-labelledby={labelledBy} className="flex flex-col border border-rule bg-paper p-5">
      {/* The icon, in the accent */}
      {IconShape && <IconShape aria-hidden="true" className="mb-3 size-7 text-accent" />}
      {/* The card's contents */}
      {children}
    </section>
  );
}
