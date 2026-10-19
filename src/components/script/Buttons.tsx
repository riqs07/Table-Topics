// Shared action styles: primary, secondary, quiet and text-link looks, and whole-row links, all at least 44 pixels tall; every button and action link uses one of these (design pass, decision 59)

// Load Next.js's link component
import Link from "next/link";
// Load the chevron that marks a row as tappable
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
// Load the type for content passed in
import type { ReactNode } from "react";

// A small squash when pressed, so a tap feels answered (decision 69; motion-safe, so reduced motion keeps it still)
export const PRESS = "transition-transform duration-100 motion-safe:active:scale-[.97]";
// The main action inside a page: filled, rounded, at least 44 pixels tall; when it cannot be used yet it turns a solid quiet gray (never see-through)
export const PRIMARY = `inline-flex min-h-11 items-center justify-center rounded-2xl bg-fill px-5 font-semibold ${PRESS} text-fill-ink hover:opacity-90 disabled:cursor-not-allowed disabled:bg-rule disabled:text-ink-muted disabled:hover:opacity-100`;
// A second choice beside it: outlined in ink
export const SECONDARY = `inline-flex min-h-11 items-center justify-center rounded-2xl border-2 border-ink px-4 text-ink hover:bg-paper disabled:cursor-not-allowed disabled:border-rule disabled:text-ink-muted ${PRESS}`;
// A way out or a "not now": a quiet outlined button, so it reads as a choice and not as a footnote
export const QUIET = `inline-flex min-h-11 items-center justify-center rounded-2xl border-2 border-rule px-4 text-ink-muted hover:border-ink hover:text-ink disabled:cursor-not-allowed ${PRESS}`;
// A link to another page or section, in plain words
export const TEXT_LINK = "inline-flex min-h-11 items-center underline decoration-ink-muted underline-offset-4 hover:decoration-ink";

// What a button-styled link needs
interface ButtonLinkProps {
  // Where it goes
  href: string;
  // Its words
  children: ReactNode;
  // A fuller name for screen readers, when the words alone are not enough
  label?: string;
}

// The primary action inside a page: filled with the accent
export function PrimaryLink({ href, children, label }: ButtonLinkProps) {
  // A filled, rounded button
  return (
    <Link href={href} aria-label={label} className={PRIMARY}>
      {children}
    </Link>
  );
}

// A secondary action: outlined in ink
export function SecondaryLink({ href, children, label }: ButtonLinkProps) {
  // An outlined, rounded button
  return (
    <Link href={href} aria-label={label} className={SECONDARY}>
      {children}
    </Link>
  );
}

// A whole row that leads somewhere, with a chevron at the end
export function RowLink({ href, children, label, meta }: ButtonLinkProps & { meta?: ReactNode }) {
  // The full row is the tap target
  return (
    <Link href={href} aria-label={label} className={`flex min-h-14 items-center gap-3 py-2 hover:text-accent ${PRESS}`}>
      {/* The main words */}
      <span className="min-w-0 flex-1">{children}</span>
      {/* Anything quieter on the right */}
      {meta && <span className="text-footnote text-ink-muted">{meta}</span>}
      {/* The chevron */}
      <CaretRightIcon aria-hidden="true" className="size-5 flex-none text-ink-muted" />
    </Link>
  );
}

// A whole row as a button, matching RowLink, for actions that stay on the page
export function RowButton({ onClick, children, meta }: { onClick: () => void; children: ReactNode; meta?: ReactNode }) {
  // The row, at least 56 pixels tall, with a chevron at the end
  return (
    <button type="button" onClick={onClick} className={`flex min-h-14 w-full items-center gap-3 py-2 text-left hover:text-accent ${PRESS}`}>
      {/* The main words */}
      <span className="min-w-0 flex-1">{children}</span>
      {/* Anything quieter on the right */}
      {meta && <span className="text-footnote text-ink-muted">{meta}</span>}
      {/* The chevron */}
      <CaretRightIcon aria-hidden="true" className="size-5 flex-none text-ink-muted" />
    </button>
  );
}
