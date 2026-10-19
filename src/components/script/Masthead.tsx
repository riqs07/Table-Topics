// The masthead at the top of every screen: the main navigation, then the title in the display face with a note or links on the right (decision 69)

// Load Next.js's link component
import Link from "next/link";
// Load the tab icons
import { GearIcon, LightbulbIcon, MicrophoneIcon, SunIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
// Load the icon type
import type { Icon } from "@phosphor-icons/react";
// Load the type for content passed in
import type { ReactNode } from "react";
// Load the shared press effect
import { PRESS } from "./Buttons";

// The sections a page can belong to (Settings is the gear in the title row, not a tab; Skills is a page inside Practice)
export type Section = "today" | "practice" | "skills" | "learn" | "settings";

// Each tab's name and address, in order: four, always labelled (decision 48; History moved into Settings, decision 56)
const SECTIONS: ReadonlyArray<{ id: Section; name: string; href: string; icon: Icon }> = [
  // Today's practice
  { id: "today", name: "Today", href: "/", icon: SunIcon },
  // Every kind of practice, picked freely (Skills' lessons and readings are a page inside it)
  { id: "practice", name: "Practice", href: "/practice", icon: MicrophoneIcon },
  // What research says, in short cards
  { id: "learn", name: "Learn", href: "/learn", icon: LightbulbIcon },
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
  // Navigation row, then the title row
  return (
    <>
      {/* The main navigation: a tab bar fixed to the bottom of a phone, a row of tabs above the title on a computer, the current one in a filled pill */}
      {nav && (
        <nav aria-label="Main" data-tabbar className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-rule bg-paper-raised pb-[env(safe-area-inset-bottom)] md:static md:mb-6 md:flex md:gap-x-2 md:border-0 md:bg-transparent md:p-0">
          {/* One link per section */}
          {SECTIONS.map((item) => {
            // Whether this is the current section
            const current = item.id === section || (item.id === "practice" && section === "skills");
            // The section's icon
            const TabIcon = item.icon;
            // On a phone: icon over a small label, at least 44 pixels tall; on a computer: a text link
            return (
              <Link key={item.id} href={item.href} aria-current={current ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-tab md:min-h-11 md:flex-row md:rounded-full md:px-4 md:text-footnote ${current ? "font-semibold text-ink md:bg-fill md:text-fill-ink" : "text-ink-muted hover:text-ink"}`}>
                {/* The icon, phone only, in a filled pill for the current section */}
                <span aria-hidden="true" className={`flex h-8 w-14 items-center justify-center rounded-full md:hidden ${current ? "bg-fill text-fill-ink" : ""}`}>
                  {/* The icon (filled for the current section) */}
                  <TabIcon weight={current ? "fill" : "regular"} className="size-5" />
                </span>
                {/* The name */}
                {item.name}
              </Link>
            );
          })}
        </nav>
      )}
      {/* Header landmark (centred, so the gear or cross lines up with the title) */}
      <header className="flex min-h-11 items-center justify-between gap-4 pb-1">
        {/* Title in the display face */}
        <span className="font-display text-xl font-semibold tracking-tight md:text-2xl">{title}</span>
        {/* Note or links, then the settings gear or the way out */}
        <span className="flex items-center gap-3">
          {/* The note */}
          <span className="text-ink-muted">{children}</span>
          {/* Settings, wherever the navigation shows (filled on the settings page) */}
          {nav && (
            <Link href="/settings" aria-label="Settings" aria-current={section === "settings" ? "page" : undefined} className={`inline-flex size-11 flex-none items-center justify-center rounded-[14px] ${PRESS} ${section === "settings" ? "bg-fill text-fill-ink" : "bg-paper text-ink-muted hover:text-ink"}`}>
              {/* The gear */}
              <GearIcon aria-hidden="true" weight={section === "settings" ? "fill" : "regular"} className="size-5" />
            </Link>
          )}
          {/* While practising: a way out instead */}
          {!nav && close && (
            <Link href={close.href} aria-label={close.label} className={`inline-flex size-11 flex-none items-center justify-center rounded-[14px] bg-paper text-ink ${PRESS}`}>
              {/* The cross */}
              <XIcon aria-hidden="true" weight="bold" className="size-5" />
            </Link>
          )}
        </span>
      </header>
    </>
  );
}
