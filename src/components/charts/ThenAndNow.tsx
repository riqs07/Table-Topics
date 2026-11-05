// The Chart Kit's then and now (second design pass): two takes of the same words as ribbons, one under the other: the earlier one grey (the ghost), this one in your voice's colour, each with its pauses and pause words, and an optional big number for the change

// Load the ribbon type
import type { Ribbon } from "@/core/chartKit";
// Load the ribbon
import { VoiceRibbon } from "@/components/charts/VoiceRibbon";

// What the pair needs
export interface ThenAndNowProps {
  // The earlier take
  before: Ribbon;
  // This take
  after: Ribbon;
  // What each is called, such as "Last try" and "This try"
  names: { before: string; after: string };
  // Whether pause words are shown (decision 79)
  pauseWords?: boolean;
  // A big number with what it counts and the earlier one, such as 2.3 / "pause words a minute today" / "day 1: 6.1"
  stat?: { value: string; caption: string; then: string } | null;
}

// Where the pause words came, in words (the tiny copy keeps each place once), or the ribbon alone when they are hidden
function places(ribbon: Ribbon, pauseWords: boolean): string {
  // Hidden: just the ribbon
  if (!pauseWords) return "your voice as a ribbon";
  // How many places
  const count = ribbon.ums.length;
  // The words
  return count === 0 ? "no pause words" : `pause words in ${count} ${count === 1 ? "place" : "places"}`;
}

// The pair
export function ThenAndNow({ before, after, names, pauseWords = true, stat = null }: ThenAndNowProps) {
  // The number, then the two ribbons
  return (
    <div data-then-now className="flex flex-col gap-2">
      {/* The big number and what it compares with */}
      {stat && (
        <p className="flex items-baseline gap-4">
          {/* The number */}
          <span className="font-display text-statement font-semibold tabular-nums">{stat.value}</span>
          {/* What it counts, and the earlier one */}
          <span className="text-footnote text-ink-muted">{stat.caption}<br />{stat.then}</span>
        </p>
      )}
      {/* The earlier take, grey */}
      <p className="text-footnote text-ink-muted">{names.before}</p>
      <VoiceRibbon ribbon={before} height={36} tone="ghost" pauseWords={pauseWords} marks={false} draw={false} label={`${names.before}, drawn grey: ${places(before, pauseWords)}.`} />
      {/* This take, in your voice's colour */}
      <p className="text-footnote text-ink-muted">{names.after}</p>
      <VoiceRibbon ribbon={after} height={36} pauseWords={pauseWords} label={`${names.after}: ${places(after, pauseWords)}.`} />
    </div>
  );
}
