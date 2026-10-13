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
}

// Draw the action as a link styled as a band
export function ActionBand({ action, aside, href }: ActionBandProps) {
  // Accent band that bleeds to the screen edges on a phone
  return (
    <Link href={href} className="-mx-6 flex items-baseline justify-between gap-4 bg-accent px-6 pb-8 pt-5 text-accent-ink md:mx-0 md:mb-10 md:max-w-md md:pb-5">
      {/* The action, large italic */}
      <span className="whitespace-nowrap text-band italic">{action}</span>
      {/* The aside */}
      <span className="whitespace-nowrap text-sm">{aside}</span>
    </Link>
  );
}
