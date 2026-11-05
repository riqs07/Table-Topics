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
export const PRIMARY = `inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-fill px-6 font-display text-button font-semibold uppercase tracking-[.03em] text-fill-ink shadow-chunky transition-[transform,box-shadow] duration-100 hover:brightness-105 motion-safe:active:translate-y-[3px] active:shadow-chunky-pressed disabled:cursor-not-allowed disabled:bg-rule disabled:text-ink-muted disabled:shadow-none disabled:hover:brightness-100 disabled:active:translate-y-0`;
// A second choice beside it: outlined in ink
export const SECONDARY = `inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] border-2 border-rule bg-card px-5 font-extrabold text-ink shadow-ledge transition-[transform,box-shadow] duration-100 hover:border-ink-muted motion-safe:active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:text-ink-muted disabled:shadow-none`;
// A way out or a "not now": a quiet outlined button, so it reads as a choice and not as a footnote
export const QUIET = `inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] border-2 border-rule bg-card px-4 font-bold text-ink-muted shadow-ledge transition-[transform,box-shadow] duration-100 hover:text-ink motion-safe:active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed`;
// A link to another page or section, in plain words
export const TEXT_LINK = "inline-flex min-h-11 items-center font-extrabold text-accent-tint-ink underline decoration-transparent underline-offset-4 hover:decoration-current";

// What a button-styled link needs
interface ButtonLinkProps {
  // Where it goes
  href: string;
  // Its words
  children: ReactNode;
  // More for screen readers when the words alone are not enough: read after the words on a button ("Rehearse" + "section 2"), before them on a row ("Tell it properly:" + the moment). Never replaces the words, so the name a screen reader hears always holds what is seen (WCAG 2.5.3)
  label?: string;
}

// The primary action inside a page: filled with the accent
export function PrimaryLink({ href, children, label }: ButtonLinkProps) {
  // A filled, rounded button
  return (
    <Link href={href} className={PRIMARY}>
      {children}
      {/* The extra, read after the words */}
      {label && <span className="sr-only"> {label}</span>}
    </Link>
  );
}

// A secondary action: outlined in ink
export function SecondaryLink({ href, children, label }: ButtonLinkProps) {
  // An outlined, rounded button
  return (
    <Link href={href} className={SECONDARY}>
      {children}
      {/* The extra, read after the words */}
      {label && <span className="sr-only"> {label}</span>}
    </Link>
  );
}

// A whole row that leads somewhere, with a chevron at the end
export function RowLink({ href, children, label, meta }: ButtonLinkProps & { meta?: ReactNode }) {
  // The full row is the tap target
  return (
    <Link href={href} className={`flex min-h-14 items-center gap-3 py-2 hover:text-accent ${PRESS}`}>
      {/* The lead-in, read before the words */}
      {label && <span className="sr-only">{label} </span>}
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
