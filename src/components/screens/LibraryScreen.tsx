// The practice library: every speech, passage, pause drill and word list, to read aloud any time

// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
// Load the texts
import { PASSAGES, PAUSE_DRILLS, TRICKY_WORDS, type Passage } from "@/content/prompts";

// One section of the library: a heading, a line on what it is for, its texts, and the kind of session they open
interface Shelf {
  // Section heading
  heading: string;
  // What the section is for
  note: string;
  // The texts in it
  items: ReadonlyArray<Passage>;
  // The session kind they open as
  mode: "read" | "pause";
}

// The sections, in order
const SHELVES: ReadonlyArray<Shelf> = [
  // Famous speeches
  { heading: "Famous speeches", note: "Public-domain speeches worth saying out loud.", items: PASSAGES.filter((passage) => passage.kind === "speech"), mode: "read" },
  // Practice passages
  { heading: "Practice passages", note: "Short texts written for one skill each.", items: PASSAGES.filter((passage) => passage.kind === "practice"), mode: "read" },
  // Pause drills
  { heading: "Pause drills", note: "Pause for about a second at each ‖.", items: PAUSE_DRILLS, mode: "pause" },
  // Tricky words
  { heading: "Tricky words", note: "Words that are easy to stumble on. Say each one cleanly.", items: TRICKY_WORDS, mode: "read" },
];

// Draw the page
export function LibraryScreen() {
  // One column of sections
  return (
    <main className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Navigation and title */}
      <Masthead title="Practice library" section="library" />
      {/* What this is */}
      <p className="mt-6 max-w-[52ch] text-lede">Pick anything and read it aloud, as often as you like. Repeat a text on another day to hear then and now.</p>
      {/* Each section */}
      {SHELVES.map((shelf) => (
        // One section
        <section key={shelf.heading} className="mt-10">
          {/* Heading */}
          <h2 className="font-display text-cue">{shelf.heading}</h2>
          {/* What it is for */}
          <p className="text-footnote italic text-ink-muted">{shelf.note}</p>
          {/* Its texts */}
          <ul className="mt-3 divide-y divide-rule border-y border-rule">
            {/* One row per text */}
            {shelf.items.map((item) => (
              // One row
              <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-4 py-3">
                {/* Title and source */}
                <Link href={`/session?mode=${shelf.mode}&prompt=${item.id}`} className="underline underline-offset-4">{item.title}</Link>
                {/* Who gave it, for speeches */}
                {item.kind === "speech" && <span className="text-footnote italic text-ink-muted">{item.source}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
