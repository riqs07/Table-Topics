// The masthead at the top of every screen and the main navigation (UI rewrite): the title row, then four sections, Today, Practice, Courses and Me, as a side rail on a computer and a tab bar on a phone

// Load Next.js's link component
import Link from "next/link";
// Load the tab icons and the cross
import { BookOpenTextIcon, HouseIcon, MicrophoneIcon, UserIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
// Load the icon type
import type { Icon } from "@phosphor-icons/react";
// Load the type for content passed in
import type { ReactNode } from "react";
// Load the shared press effect
import { PRESS } from "./Buttons";
// Load the blob, for the rail's name
import { Buddy } from "@/components/scenes/Buddy";
// Load the week card at the foot of the rail
import { RailWeek } from "./RailWeek";

// The sections a page can belong to (Learn is inside Courses, Skills inside Practice, and Settings, History and the profile inside Me)
export type Section = "today" | "practice" | "skills" | "courses" | "learn" | "settings" | "me";

// Each section's tab: its id, name, address and icon, always labelled
const SECTIONS: ReadonlyArray<{ id: "today" | "practice" | "courses" | "me"; name: string; href: string; icon: Icon }> = [
  // Today's steps
  { id: "today", name: "Today", href: "/", icon: HouseIcon },
  // Every kind of practice
  { id: "practice", name: "Practice", href: "/practice", icon: MicrophoneIcon },
  // Courses, and Learn's quick reads
  { id: "courses", name: "Courses", href: "/courses", icon: BookOpenTextIcon },
  // Your progress, your takes and settings
  { id: "me", name: "Me", href: "/profile", icon: UserIcon },
];

// Which tab a page's section lights up
function tabFor(section: Section | undefined): string | undefined {
  // Pages inside Practice
  if (section === "skills") return "practice";
  // Learn lives inside Courses
  if (section === "learn") return "courses";
  // Settings, History and the profile live inside Me
  if (section === "settings") return "me";
  // Everything else is its own tab
  return section;
}

// What the masthead takes
interface MastheadProps {
  // The page's name, shown in the display face
  title: string;
  // A note or links on the right
  children?: ReactNode;
  // Which section the page belongs to
  section?: Section;
  // Whether the navigation shows (hidden while practising, focus mode)
  nav?: boolean;
  // While practising: a cross leading out
  close?: { href: string; label: string } | null;
}

// The title row, and the navigation wherever it shows
export function Masthead({ title, children, section, nav = true, close = null }: MastheadProps) {
  // The tab to light up
  const currentTab = tabFor(section);
  // The row, then the navigation (fixed to the side or the bottom, so its place in the page does not matter)
  return (
    <>
      {/* Header landmark: the title and anything on the right */}
      <header className="flex min-h-11 items-center justify-between gap-4 pb-1">
        {/* Title in the display face (on a computer the rail already names the app and marks the section, and each page has its own heading, so it is left out there) */}
        <span className={`font-display text-xl font-semibold md:text-2xl ${nav ? "md:invisible" : ""}`}>{title}</span>
        {/* Note or links, then the way out while practising */}
        <span className="flex items-center gap-3">
          {/* The note */}
          <span className="font-bold text-ink-muted">{children}</span>
          {/* While practising: a way out */}
          {!nav && close && (
            <Link href={close.href} aria-label={close.label} className={`inline-flex size-11 flex-none items-center justify-center rounded-[14px] text-ink-muted hover:bg-paper hover:text-ink ${PRESS}`}>
              {/* The cross */}
              <XIcon aria-hidden="true" weight="bold" className="size-6" />
            </Link>
          )}
        </span>
      </header>
      {/* The main navigation: a tab bar along the bottom of a phone, a rail down the left of a computer */}
      {nav && (
        <nav aria-label="Main" data-tabbar className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t-2 border-rule bg-card pb-[env(safe-area-inset-bottom)] md:inset-x-auto md:inset-y-0 md:left-0 md:flex md:w-60 md:flex-col md:gap-1.5 md:border-t-0 md:border-r-2 md:px-4 md:pt-7 md:pb-7">
          {/* The app's name with the blob, on a computer */}
          <Link href="/" className="mb-6 hidden items-center gap-2.5 px-1.5 md:flex">
            {/* The blob */}
            <Buddy face="ready" still className="size-11" />
            {/* The name */}
            <span className="font-display text-2xl font-semibold">VoiceLab</span>
          </Link>
          {/* One link per section */}
          {SECTIONS.map((item) => {
            // Whether this is the page's section
            const current = item.id === currentTab;
            // The section's icon
            const TabIcon = item.icon;
            // The link: an icon over the name on a phone, beside it on a computer; the current one sits in a soft green pill
            return (
              <Link key={item.id} href={item.href} aria-current={current ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-tab font-extrabold md:min-h-12 md:flex-row md:justify-start md:gap-3.5 md:rounded-[14px] md:px-3.5 md:text-base ${current ? "text-accent-tint-ink md:bg-accent-tint" : "text-ink-muted hover:text-ink"}`}>
                {/* The icon, in a pill on a phone when current */}
                <span aria-hidden="true" className={`flex h-8 w-12 items-center justify-center rounded-[10px] md:w-auto ${current ? "bg-accent-tint md:bg-transparent" : ""}`}>
                  {/* The icon, filled when current */}
                  <TabIcon weight={current ? "fill" : "bold"} className="size-6" />
                </span>
                {/* The name */}
                {item.name}
              </Link>
            );
          })}
          {/* The week, on a computer */}
          <RailWeek />
        </nav>
      )}
    </>
  );
}
