// The one main action on a screen: a rounded accent band floating over the bottom of a phone screen, column width on a computer (decision 69)

// Load Next.js's link component
import Link from "next/link";
// Load the shared press effect
import { PRESS } from "./Buttons";

// The main band: floating just above the bottom of a phone screen (and the tab bar, if any) so it is always in reach; on a computer it ends the column and sticks to the bottom of the window until reached, so the main action is never below the fold (decision 79)
const STICKY_BAND = `fixed inset-x-4 bottom-[calc(var(--vl-tabbar-h)+0.5rem)] z-20 flex min-h-16 items-center justify-between gap-4 rounded-[20px] px-5 shadow-card md:sticky md:bottom-6 md:mt-8 md:mb-10 md:min-h-0 md:max-w-md md:pb-5 md:pt-5 ${PRESS}`;

// What the band shows and where it goes
interface ActionBandProps {
  // The action, shown large
  action: string;
  // A short aside on the right
  aside: string;
  // Where the action goes
  href: string;
  // A second, quieter choice: outlined instead of filled, sitting just above the main band
  quiet?: boolean;
}

// Draw the action as a link styled as a band
export function ActionBand({ action, aside, href, quiet = false }: ActionBandProps) {
  // Filled accent band (or an outlined quiet one) that bleeds to the screen edges on a phone
  return (
    <Link href={href} data-action-band={quiet ? undefined : true} className={quiet ? `flex min-h-14 items-center justify-between gap-4 rounded-[20px] border-2 border-ink px-5 py-4 text-ink md:mb-3 md:max-w-md ${PRESS}` : `${STICKY_BAND} bg-fill text-fill-ink`}>
      {/* The action, large in the display face */}
      <span className="whitespace-nowrap font-display text-band font-semibold">{action}</span>
      {/* The aside (wraps on a narrow phone rather than running off the edge) */}
      <span className="text-right text-sm">{aside}</span>
    </Link>
  );
}

// The same band as a button, for actions that happen on this page; "stop" is ink rather than accent, so recording never looks like the start
export function ActionButton({ action, aside, onClick, disabled = false, variant = "start" }: { action: string; aside: string; onClick: () => void; disabled?: boolean; variant?: "start" | "stop" }) {
  // Rounded accent band floating over the bottom of a phone screen
  return (
    <button type="button" onClick={onClick} disabled={disabled} data-action-band data-variant={variant} className={`${STICKY_BAND} w-full text-left disabled:cursor-not-allowed disabled:bg-rule disabled:text-ink-muted ${variant === "stop" ? "bg-ink text-paper-raised" : "bg-fill text-fill-ink"}`}>
      {/* The action, large in the display face */}
      <span className="whitespace-nowrap font-display text-band font-semibold">{action}</span>
      {/* The aside (wraps on a narrow phone rather than running off the edge) */}
      <span className="text-right text-sm">{aside}</span>
    </button>
  );
}
