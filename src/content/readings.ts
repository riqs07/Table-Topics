// Every text to read aloud in one place, with its text: the short passages and highlights, and each part of the full speeches (pages that need only names use readingIndex.ts, which leaves the speeches' text out; decision 88)

// Load the full speeches
import { FULL_SPEECHES, type FullSpeech } from "@/content/speeches";
// Load the short passages and their lookup
import { findPassage, type Passage } from "@/content/prompts";
// Load the part ids and titles, shared with the index so names always agree
import { partId, speechPartOf, speechPartTitle } from "@/content/readingIndex";

// The part id maker, for pages that already load the full speeches
export { partId };

// A full speech by id
export function findSpeech(id: string): FullSpeech | undefined {
  // Look it up
  return FULL_SPEECHES.find((speech) => speech.id === id);
}

// Which speech and part an id names, if it names one
export function partOf(id: string): { speech: FullSpeech; part: number } | undefined {
  // The part, from the index
  const found = speechPartOf(id);
  // The full speech it belongs to
  const speech = found ? findSpeech(found.speech.id) : undefined;
  // Only a part that exists
  return found && speech ? { speech, part: found.part } : undefined;
}

// Any text to read by id: a short passage, a highlight, or one part of a full speech
export function findReading(id: string): Passage | undefined {
  // A short passage or highlight
  const passage = findPassage(id);
  // Found
  if (passage) return passage;
  // Otherwise a part of a full speech
  const found = speechPartOf(id);
  // The full speech it belongs to
  const speech = found ? findSpeech(found.speech.id) : undefined;
  // Not one either
  if (!found || !speech) return undefined;
  // Its title, with the part when there is more than one
  const title = speechPartTitle(found.speech, found.part);
  // The part as a passage to read
  return { id, kind: "speech", title, text: title, source: `${speech.speaker}, ${speech.year}`, body: speech.parts[found.part - 1] ?? "" };
}
