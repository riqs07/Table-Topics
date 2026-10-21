// The transcript's words, each with the time it was first heard (decision 90); a module of its own so storage can rebuild an analysis's words without loading the measures (decision 98)

// Load the record type
import type { TimedWord } from "@/data/records";

// The transcript's words, split as the word times were (one time per space-separated piece), each cleaned to lower-case letters and apostrophes
export function timedWords(transcript: string, times: ReadonlyArray<number> | undefined): TimedWord[] {
  // The pieces
  const pieces = transcript.split(/\s+/).filter((piece) => piece !== "");
  // Each with its time and the next word's time
  return pieces.map((piece, index) => ({ w: piece.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z']+/g, ""), s: times?.[index] ?? null, e: times?.[index + 1] ?? null }));
}
