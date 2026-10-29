"use client";
// Every way to practise on one page, for development (decision 132): grouped, each with what it is, where it opens and whether it is on Practice's main list or extended; not linked for users unless switched on

// Load React's state and external-store tools
import { useState, useSyncExternalStore } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
import { CheckRow } from "@/components/script/CheckRow";
// Load the shared looks
import { CARD_LIST, SECTION_HEADING } from "@/components/script/textStyles";
import { PAGE } from "@/components/script/layout";
// Load the never-firing subscription used to tell the browser apart from the server
import { subscribeToNothing } from "@/components/screens/screenBasics";
// Load the tab title helper
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the list
import { MODE_CATALOGUE } from "@/content/modeCatalogue";
// Load the switch for the link in Settings
import { readDevTools, saveDevTools } from "@/data/devTools";

// Draw the page
export function DevModesScreen() {
  // Name the tab
  usePageTitle("All modes");
  // Whether the link shows in Settings: the saved choice, read only in the browser so the first draw matches the server's (T4)
  const saved = useSyncExternalStore(subscribeToNothing, readDevTools, () => false);
  // A choice made on this page, which wins over the saved one
  const [changed, setChanged] = useState<boolean | null>(null);
  // The choice in force
  const linked = changed ?? saved;
  // How many there are, and how many are extended
  const entries = MODE_CATALOGUE.flatMap((group) => group.entries);
  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* Title and a way back to Settings */}
      <Masthead title="All modes" nav={false} close={{ href: "/settings", label: "Close, back to Settings" }} />
      {/* What this page is */}
      <p className="mt-6 text-footnote font-semibold text-accent">For development</p>
      {/* Heading */}
      <h1 className="mt-1 font-display text-statement tracking-tight">Every way to practise</h1>
      {/* The counts */}
      <p className="mt-2 max-w-[52ch] text-lede text-ink-muted">{entries.length} in all: {entries.filter((entry) => entry.main).length} on Practice’s main list, {entries.filter((entry) => !entry.main).length} extended. Extended ones will move into lessons over time.</p>
      {/* The link in Settings */}
      <div className="mt-4">
        <CheckRow
          checked={linked}
          onChange={(event) => {
            // Remember it
            saveDevTools(event.target.checked);
            // Show it
            setChanged(event.target.checked);
          }}
          detail="On this browser only. A build run on your own computer always shows it."
        >
          Show a link to this page in Settings
        </CheckRow>
      </div>
      {/* The groups */}
      {MODE_CATALOGUE.map((group) => (
        // One group
        <section key={group.name} aria-labelledby={`group-${group.name}`} className="mt-8">
          {/* Its heading */}
          <h2 id={`group-${group.name}`} className={SECTION_HEADING}>{group.name}</h2>
          {/* Its entries */}
          <ul className={`mt-3 ${CARD_LIST}`}>
            {/* Each */}
            {group.entries.map((entry) => (
              // One entry, the whole row a link
              <li key={entry.href + entry.name}>
                <Link href={entry.href} data-catalogue-entry={entry.main ? "main" : "extended"} className="flex min-h-14 flex-col gap-0.5 py-3">
                  {/* Name, its tag and its count */}
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    {/* Name */}
                    <span className="font-display text-xl font-semibold leading-tight tracking-tight">{entry.name}</span>
                    {/* Tag */}
                    <span className={`rounded-full px-2 py-0.5 text-footnote ${entry.main ? "bg-fill text-fill-ink" : "bg-paper text-ink-muted"}`}>{entry.main ? "On Practice" : "Extended"}</span>
                    {/* Count */}
                    {entry.count && <span className="text-footnote text-ink-muted">{entry.count}</span>}
                  </span>
                  {/* What it is */}
                  <span className="text-footnote text-ink-muted">{entry.what}</span>
                  {/* Where it opens */}
                  <span className="break-all font-mono text-footnote text-ink-muted">{entry.href}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
