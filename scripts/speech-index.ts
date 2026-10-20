// Writes src/content/speechIndex.ts: each full speech's id, title, speaker, year, kind and number of parts, without the text (decision 88).
// Today and the recording page need only these, and the full texts are most of the app's download, so they load the index instead.
// Run it with `pnpm speech-index` after changing src/content/speeches.ts; a unit test fails until the index matches.

// Load Node's file writer
import { writeFileSync } from "node:fs";
// Load the full speeches
import { FULL_SPEECHES } from "@/content/speeches";

// The index file's lines
const lines = [
  "// Each full speech without its text: id, title, speaker, year, kind and number of parts (decision 88). Written by `pnpm speech-index` from src/content/speeches.ts; do not edit by hand",
  "",
  "// One speech in the index",
  "export interface SpeechSummary {",
  "  // Id, such as \"jfk-inaugural\" (a part's id adds its number: \"jfk-inaugural-2\")",
  "  id: string;",
  "  // The speech's name",
  "  title: string;",
  "  // Who gave it",
  "  speaker: string;",
  "  // The year it was given",
  "  year: number;",
  "  // Whether it was a graduation (commencement) address",
  "  commencement: boolean;",
  "  // How many parts it is read in",
  "  partCount: number;",
  "}",
  "",
  "// Every full speech, oldest first, in the same order as FULL_SPEECHES",
  "export const SPEECH_INDEX: ReadonlyArray<SpeechSummary> = [",
  // One line per speech, with a comment naming it
  ...FULL_SPEECHES.flatMap((speech) => [`  // ${speech.title}, ${speech.speaker}, ${speech.year}`, `  { id: ${JSON.stringify(speech.id)}, title: ${JSON.stringify(speech.title)}, speaker: ${JSON.stringify(speech.speaker)}, year: ${speech.year}, commencement: ${speech.commencement}, partCount: ${speech.parts.length} },`]),
  "];",
  "",
];

// Save the file
writeFileSync("src/content/speechIndex.ts", lines.join("\n"));
// Say what was written
console.log(`Speech index written: ${FULL_SPEECHES.length} speeches`);
