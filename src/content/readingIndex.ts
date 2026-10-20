// Names and ids of every text to read aloud, without the full speeches' text (decision 88): Today, History and the recording page need only these, and the speeches' text is most of the app's download. The text itself is in readings.ts, loaded where it is read

// Load the short passages' lookup
import { findPassage } from "@/content/prompts";
// Load the speeches' index (ids, titles and part counts, no text)
import { SPEECH_INDEX, type SpeechSummary } from "@/content/speechIndex";

// The id of one part of a speech, such as "jfk-inaugural-2"
export function partId(speech: { id: string }, part: number): string {
  // The speech's id and the part's number
  return `${speech.id}-${part}`;
}

// A speech's summary by id
export function findSpeechSummary(id: string): SpeechSummary | undefined {
  // Look it up
  return SPEECH_INDEX.find((speech) => speech.id === id);
}

// Which speech and part an id names, if it names one
export function speechPartOf(id: string): { speech: SpeechSummary; part: number } | undefined {
  // A speech id followed by a part number
  const match = /^(.+)-(\d+)$/.exec(id);
  // The speech
  const speech = match ? findSpeechSummary(match[1] ?? "") : undefined;
  // The part number
  const part = match ? Number(match[2]) : 0;
  // Only a part that exists
  return speech && part >= 1 && part <= speech.partCount ? { speech, part } : undefined;
}

// A part's title: the speech's, with the part when there is more than one
export function speechPartTitle(speech: SpeechSummary, part: number): string {
  // "Title, part 3 of 12", or the title alone
  return speech.partCount > 1 ? `${speech.title}, part ${part} of ${speech.partCount}` : speech.title;
}

// Any text's title by id: a short passage, a highlight, or one part of a full speech
export function readingTitle(id: string): string | undefined {
  // A short passage or highlight
  const passage = findPassage(id);
  // Found
  if (passage) return passage.title;
  // Otherwise a part of a full speech
  const found = speechPartOf(id);
  // Its title, if it is one
  return found ? speechPartTitle(found.speech, found.part) : undefined;
}
