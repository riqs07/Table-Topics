// Writes src/content/learnIndex.ts: each Learn card's id, set and title, without its text (decision 99).
// Today's plan and the Learn pages' "next card" need only these, and the cards' text is about 40 KB of download, so they load the index instead (the same idea as the speech index, decision 88).
// Run it with `pnpm learn-index` after changing src/content/learn.ts; a unit test fails until the index matches.

// Load Node's file writer
import { writeFileSync } from "node:fs";
// Load the full cards
import { LEARN_CARDS } from "@/content/learn";

// The index file's lines
const lines = [
  "// Each Learn card without its text: id, set and title (decision 99). Written by `pnpm learn-index` from src/content/learn.ts; do not edit by hand",
  "",
  "// Load the set type",
  'import type { LearnSetId } from "@/content/learn";',
  "",
  "// One card in the index",
  "export interface LearnCardSummary {",
  "  // Stable id",
  "  id: string;",
  "  // Its set",
  "  set: LearnSetId;",
  "  // Its title, as on the card",
  "  title: string;",
  "}",
  "",
  "// Every card, in the same order as LEARN_CARDS",
  "export const LEARN_INDEX: ReadonlyArray<LearnCardSummary> = [",
  // One line per card, with a comment naming it
  ...LEARN_CARDS.flatMap((card) => [`  // ${card.set}: ${card.id}`, `  { id: ${JSON.stringify(card.id)}, set: ${JSON.stringify(card.set)}, title: ${JSON.stringify(card.title)} },`]),
  "];",
  "",
];

// Save the file
writeFileSync("src/content/learnIndex.ts", lines.join("\n"));
// Say what was written
console.log(`Learn index written: ${LEARN_CARDS.length} cards`);
