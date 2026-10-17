// Shared action styles (UX round, option B): one primary and one secondary look, and whole-row links, all at least 44 pixels tall

// Load Next.js's link component
import Link from "next/link";
// Load the chevron that marks a row as tappable
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
// Load the type for content passed in
import type { ReactNode } from "react";

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
  // A filled, square-cornered button
  return (
    <Link href={href} aria-label={label} className="inline-flex min-h-11 items-center bg-accent px-5 text-accent-ink hover:opacity-90">
      {children}
    </Link>
  );
}

// A secondary action: outlined in ink
export function SecondaryLink({ href, children, label }: ButtonLinkProps) {
  // An outlined, square-cornered button
  return (
    <Link href={href} aria-label={label} className="inline-flex min-h-11 items-center border border-ink px-4 text-ink hover:bg-paper">
      {children}
    </Link>
  );
}

// A whole row that leads somewhere, with a chevron at the end
export function RowLink({ href, children, label, meta }: ButtonLinkProps & { meta?: ReactNode }) {
  // The full row is the tap target
  return (
    <Link href={href} aria-label={label} className="flex min-h-14 items-center gap-3 py-2 hover:text-accent">
      {/* The main words */}
      <span className="min-w-0 flex-1">{children}</span>
      {/* Anything quieter on the right */}
      {meta && <span className="text-footnote italic text-ink-muted">{meta}</span>}
      {/* The chevron */}
      <CaretRightIcon aria-hidden="true" className="size-5 flex-none text-ink-muted" />
    </Link>
  );
}

// A whole row as a button, matching RowLink, for actions that stay on the page
export function RowButton({ onClick, children, meta }: { onClick: () => void; children: ReactNode; meta?: ReactNode }) {
  // The row, at least 56 pixels tall, with a chevron at the end
  return (
    <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center gap-3 py-2 text-left hover:text-accent">
      {/* The main words */}
      <span className="min-w-0 flex-1">{children}</span>
      {/* Anything quieter on the right */}
      {meta && <span className="text-footnote italic text-ink-muted">{meta}</span>}
      {/* The chevron */}
      <CaretRightIcon aria-hidden="true" className="size-5 flex-none text-ink-muted" />
    </button>
  );
}
