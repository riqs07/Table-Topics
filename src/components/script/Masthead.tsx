// The masthead at the top of every screen: the main navigation, then the title in small capitals with an italic note or links on the right

// Load Next.js's link component
import Link from "next/link";
// Load the tab icons
import { ChatsCircleIcon, ClockCounterClockwiseIcon, GearIcon, GraduationCapIcon, MicrophoneIcon, SunIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
// Load the icon type
import type { Icon } from "@phosphor-icons/react";
// Load the type for content passed in
import type { ReactNode } from "react";

// The sections the main navigation leads to (Settings is the gear in the title row, not a tab)
export type Section = "today" | "practice" | "skills" | "smalltalk" | "history" | "settings";

// Each tab's name and address, in order (five, always labelled; decision 41, plus Small talk)
const SECTIONS: ReadonlyArray<{ id: Section; name: string; href: string; icon: Icon }> = [
  // Today's practice
  { id: "today", name: "Today", href: "/", icon: SunIcon },
  // Your talks, and speaking on the spot
  { id: "practice", name: "Practice", href: "/practice", icon: MicrophoneIcon },
  // Lessons and readings
  { id: "skills", name: "Skills", href: "/skills", icon: GraduationCapIcon },
  // Everyday conversation, kept apart from the speech practice
  { id: "smalltalk", name: "Small talk", href: "/small-talk", icon: ChatsCircleIcon },
  // Past sessions
  { id: "history", name: "History", href: "/history", icon: ClockCounterClockwiseIcon },
];

// What the masthead shows
interface MastheadProps {
  // Title on the left
  title: string;
  // Italic note or links on the right
  children?: ReactNode;
  // The section this screen belongs to, marked in the navigation (none for a session page)
  section?: Section;
  // Whether to show the main navigation and the settings gear (hidden while practising, so a stray tap cannot lose a take)
  nav?: boolean;
  // In place of the navigation, a way out of a practice page (focus mode)
  close?: { href: string; label: string } | null;
}

// Draw the masthead
export function Masthead({ title, children, section, nav = true, close = null }: MastheadProps) {
  // Navigation row, then a baseline-aligned title row over a solid hairline
  return (
    <>
      {/* The main navigation: a tab bar fixed to the bottom of a phone, a quiet row of links above the title on a computer */}
      {nav && (
        <nav aria-label="Main" data-tabbar className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-rule bg-paper-raised pb-[env(safe-area-inset-bottom)] md:static md:mb-4 md:flex md:gap-x-5 md:border-0 md:bg-transparent md:p-0">
          {/* One link per section */}
          {SECTIONS.map((item) => {
            // Whether this is the current section
            const current = item.id === section;
            // The section's icon
            const TabIcon = item.icon;
            // On a phone: icon over a small label, at least 44 pixels tall; on a computer: a text link
            return (
              <Link key={item.id} href={item.href} aria-current={current ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-tab md:min-h-0 md:text-footnote ${current ? "text-accent md:text-ink" : "text-ink-muted hover:text-ink md:underline md:underline-offset-4"}`}>
                {/* The icon, phone only (filled for the current section) */}
                <TabIcon aria-hidden="true" weight={current ? "fill" : "regular"} className="size-6 md:hidden" />
                {/* The name */}
                {item.name}
              </Link>
            );
          })}
        </nav>
      )}
      {/* Header landmark with the ink rule underneath (centred, so the gear or cross lines up with the title) */}
      <header className="flex min-h-11 items-center justify-between gap-4 border-b border-ink pb-2 md:pb-3">
        {/* Title in small capitals */}
        <span className="text-lg tracking-wide [font-variant-caps:small-caps] md:text-xl">{title}</span>
        {/* Note or links in italic, then the settings gear or the way out */}
        <span className="flex items-center gap-3">
          {/* The note */}
          <span className="italic text-ink-muted">{children}</span>
          {/* Settings, wherever the navigation shows (filled on the settings page) */}
          {nav && (
            <Link href="/settings" aria-label="Settings" aria-current={section === "settings" ? "page" : undefined} className={`-my-2 inline-flex size-11 flex-none items-center justify-center ${section === "settings" ? "text-accent" : "text-ink-muted hover:text-ink"}`}>
              {/* The gear */}
              <GearIcon aria-hidden="true" weight={section === "settings" ? "fill" : "regular"} className="size-6" />
            </Link>
          )}
          {/* While practising: a way out instead */}
          {!nav && close && (
            <Link href={close.href} aria-label={close.label} className="-my-2 inline-flex size-11 flex-none items-center justify-center text-ink-muted hover:text-ink">
              {/* The cross */}
              <XIcon aria-hidden="true" className="size-6" />
            </Link>
          )}
        </span>
      </header>
    </>
  );
}
