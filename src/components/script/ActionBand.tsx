// The one main action on a screen: a square accent band, full width on a phone, column width on a computer

// Load Next.js's link component
import Link from "next/link";

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
    <Link href={href} className={`-mx-6 flex items-baseline justify-between gap-4 px-6 pt-5 md:mx-0 md:max-w-md ${quiet ? "border-t-2 border-ink pb-5 text-ink md:mb-3 md:border-2" : "bg-accent pb-8 text-accent-ink md:mb-10 md:pb-5"}`}>
      {/* The action, large italic */}
      <span className="whitespace-nowrap text-band italic">{action}</span>
      {/* The aside (wraps on a narrow phone rather than running off the edge) */}
      <span className="text-right text-sm">{aside}</span>
    </Link>
  );
}

// The same band as a button, for actions that happen on this page (start, stop)
export function ActionButton({ action, aside, onClick, disabled = false }: { action: string; aside: string; onClick: () => void; disabled?: boolean }) {
  // Accent band that bleeds to the screen edges on a phone
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="-mx-6 flex items-baseline justify-between gap-4 bg-accent px-6 pb-8 pt-5 text-left text-accent-ink disabled:opacity-60 md:mx-0 md:mb-10 md:w-full md:max-w-md md:pb-5">
      {/* The action, large italic */}
      <span className="whitespace-nowrap text-band italic">{action}</span>
      {/* The aside (wraps on a narrow phone rather than running off the edge) */}
      <span className="text-right text-sm">{aside}</span>
    </button>
  );
}
