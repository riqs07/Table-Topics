// Every text to read aloud in one place: the short passages and highlights, and each part of the full speeches

// Load the full speeches
import { FULL_SPEECHES, type FullSpeech } from "@/content/speeches";
// Load the short passages and their lookup
import { findPassage, type Passage } from "@/content/prompts";

// The id of one part of a speech, such as "jfk-inaugural-2"
export function partId(speech: FullSpeech, part: number): string {
  // The speech's id and the part's number
  return `${speech.id}-${part}`;
}

// A full speech by id
export function findSpeech(id: string): FullSpeech | undefined {
  // Look it up
  return FULL_SPEECHES.find((speech) => speech.id === id);
}

// Which speech and part an id names, if it names one
export function partOf(id: string): { speech: FullSpeech; part: number } | undefined {
  // A speech id followed by a part number
  const match = /^(.+)-(\d+)$/.exec(id);
  // The speech
  const speech = match ? findSpeech(match[1] ?? "") : undefined;
  // The part number
  const part = match ? Number(match[2]) : 0;
  // Only a part that exists
  return speech && part >= 1 && part <= speech.parts.length ? { speech, part } : undefined;
}

// Any text to read by id: a short passage, a highlight, or one part of a full speech
export function findReading(id: string): Passage | undefined {
  // A short passage or highlight
  const passage = findPassage(id);
  // Found
  if (passage) return passage;
  // Otherwise a part of a full speech
  const found = partOf(id);
  // Not one either
  if (!found) return undefined;
  // Its title, with the part when there is more than one
  const title = found.speech.parts.length > 1 ? `${found.speech.title}, part ${found.part} of ${found.speech.parts.length}` : found.speech.title;
  // The part as a passage to read
  return { id, kind: "speech", title, text: title, source: `${found.speech.speaker}, ${found.speech.year}`, body: found.speech.parts[found.part - 1] ?? "" };
}
