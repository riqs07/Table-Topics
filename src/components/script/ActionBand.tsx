// The one main action on a screen (decision 69; second design pass: the chunky green button of the references, story-13's "PLAN IT" and desk-CoursePath's "START PART 1"): its label centred in capitals, the aside as one small line under it, pinned over the bottom of a phone screen and in place at the end of the column on a computer

// Load Next.js's link component
import Link from "next/link";
// Load the shared press effect
import { PRESS } from "./Buttons";

// The main band: pinned just above the bottom of a phone screen (and the tab bar, if any) so it is always in reach, with the page padded below by its height so the last content scrolls clear of it (globals.css); on a computer it sits in place at the end of the column, never over the content (decision 89). The chunky look: green, a darker solid underside it presses into, the label centred in the display face
const STICKY_BAND = `fixed inset-x-4 bottom-[calc(var(--vl-tabbar-h)+0.75rem)] z-20 flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl px-5 py-2 text-center shadow-chunky transition-[transform,box-shadow] duration-100 hover:brightness-105 motion-safe:active:translate-y-[3px] active:shadow-chunky-pressed md:static md:w-full md:max-w-md`;

// Its space on a computer: on its own at the end of the column, or tucked into a card (a side column's "Up next")
const SPACE = (inCard: boolean) => (inCard ? "md:mt-4" : "md:mt-8 md:mb-10");

// The label: large capitals in the display face
const LABEL = "font-display text-band leading-tight font-semibold uppercase tracking-[.03em]";

// The aside: one small line under the label, in plain words, never wrapping (cut with an ellipsis on a narrow phone; the label keeps the action)
const ASIDE = "block max-w-full truncate text-xs font-bold normal-case opacity-90";

// What the band shows and where it goes
interface ActionBandProps {
  // The action, shown large
  action: string;
  // A short aside, one small line under the action
  aside: string;
  // Where the action goes
  href: string;
  // A second, quieter choice: outlined instead of filled, sitting just above the main band
  quiet?: boolean;
  // Tucked into a card on a computer (less space around it)
  inCard?: boolean;
}

// Draw the action as a link styled as the chunky button
export function ActionBand({ action, aside, href, quiet = false, inCard = false }: ActionBandProps) {
  // The chunky green button (or an outlined quiet one)
  return (
    <Link href={href} data-action-band={quiet ? undefined : true} className={quiet ? `flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-rule bg-card px-5 py-3 text-center text-ink shadow-ledge md:mb-3 md:max-w-md ${PRESS}` : `${STICKY_BAND} ${SPACE(inCard)} bg-fill text-fill-ink`}>
      {/* The action, large in the display face */}
      <span className={LABEL}>{action}</span>
      {/* The aside, small, under it */}
      <span className={ASIDE}>{aside}</span>
    </Link>
  );
}

// The same button for actions that happen on this page; "stop" is ink rather than accent, so recording never looks like the start; while it cannot be used it turns a solid quiet grey with no ledge, as PRIMARY does
export function ActionButton({ action, aside, onClick, disabled = false, variant = "start", inCard = false }: { action: string; aside: string; onClick: () => void; disabled?: boolean; variant?: "start" | "stop"; inCard?: boolean }) {
  // The chunky button, pinned on a phone (inset from both edges, never wider than the screen)
  return (
    <button type="button" onClick={onClick} disabled={disabled} data-action-band data-variant={variant} className={`${STICKY_BAND} ${SPACE(inCard)} disabled:cursor-not-allowed disabled:bg-rule disabled:text-ink-muted disabled:shadow-none disabled:hover:brightness-100 disabled:active:translate-y-0 ${variant === "stop" ? "bg-ink text-paper-raised" : "bg-fill text-fill-ink"}`}>
      {/* The action, large in the display face */}
      <span className={LABEL}>{action}</span>
      {/* The aside, small, under it */}
      <span className={ASIDE}>{aside}</span>
    </button>
  );
}
