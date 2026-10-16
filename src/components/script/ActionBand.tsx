// The one main action on a screen: a square accent band, fixed to the bottom of a phone screen, column width on a computer

// Load Next.js's link component
import Link from "next/link";

// The main band: fixed to the bottom of a phone screen (above the tab bar, if any) so it is always in reach; in the page flow on a computer
const STICKY_BAND = "fixed inset-x-0 bottom-[var(--vl-tabbar-h)] z-20 flex min-h-20 items-center justify-between gap-4 px-6 md:static md:mb-10 md:min-h-0 md:max-w-md md:items-baseline md:pb-5 md:pt-5";

// What the band shows and where it goes
interface ActionBandProps {
  // The action, shown large in italic
  action: string;
  // A short aside on the right
  aside: string;
  // Where the action goes
  href: string;
  // A second, quieter choice: outlined instead of filled (a rule above it on a phone, a box on a computer), sitting just above the main band
  quiet?: boolean;
}

// Draw the action as a link styled as a band
export function ActionBand({ action, aside, href, quiet = false }: ActionBandProps) {
  // Filled accent band (or an outlined quiet one) that bleeds to the screen edges on a phone
  return (
    <Link href={href} data-action-band={quiet ? undefined : true} className={quiet ? "-mx-6 flex min-h-11 items-baseline justify-between gap-4 border-t-2 border-ink px-6 pb-5 pt-5 text-ink md:mx-0 md:mb-3 md:max-w-md md:border-2" : `${STICKY_BAND} bg-accent text-accent-ink`}>
      {/* The action, large italic */}
      <span className="whitespace-nowrap text-band italic">{action}</span>
      {/* The aside (wraps on a narrow phone rather than running off the edge) */}
      <span className="text-right text-sm">{aside}</span>
    </Link>
  );
}

// The same band as a button, for actions that happen on this page; "stop" is ink rather than accent, so recording never looks like the start
export function ActionButton({ action, aside, onClick, disabled = false, variant = "start" }: { action: string; aside: string; onClick: () => void; disabled?: boolean; variant?: "start" | "stop" }) {
  // Accent band that bleeds to the screen edges on a phone
  return (
    <button type="button" onClick={onClick} disabled={disabled} data-action-band data-variant={variant} className={`${STICKY_BAND} w-full text-left disabled:opacity-60 ${variant === "stop" ? "bg-ink text-paper-raised" : "bg-accent text-accent-ink"}`}>
      {/* The action, large italic */}
      <span className="whitespace-nowrap text-band italic">{action}</span>
      {/* The aside (wraps on a narrow phone rather than running off the edge) */}
      <span className="text-right text-sm">{aside}</span>
    </button>
  );
}
