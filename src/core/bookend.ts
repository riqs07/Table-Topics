// What an openings and closings drill measured, as two sentences (plan step B2)

// Load the content type for which end of a talk was practised
import type { BookendPart } from "@/content/prompts";
// Load the filler finder
import { markFillers } from "@/core/fillers";
// Load the shared opening-pause sentence and the length of a closing
import { CLOSING_WORDS, openingPauseSentence } from "@/core/lessonCheck";
// Load the fading-ending finder
import { fadingEnds } from "@/core/pauses";
// Load the spacing of loudness readings
import { LOUDNESS_TICK_MS } from "@/core/recordingRules";
// Load the session record type
import type { SessionRecord } from "@/data/records";

// The two sentences shown after a drill
export interface BookendResult {
  // The main finding
  headline: string;
  // A second finding in smaller type
  detail: string;
}

// How many of the first words to quote back
const QUOTED_WORDS = 4;

// How the talk began: the fillers it started with, or its first few words
function openingWords(transcript: string): string {
  // Split into fillers and other text
  const pieces = markFillers(transcript.trim());
  // How many characters of leading fillers and the punctuation between them
  let length = 0;
  // Whether any filler led the opening
  let ledByFiller = false;
  // Walk the leading pieces
  for (const piece of pieces) {
    // A filler, or only spaces and punctuation between fillers
    if (piece.filler || /^[\s,.;:!?…-]*$/.test(piece.text)) {
      // Count it
      length += piece.text.length;
      // Note a filler
      ledByFiller ||= piece.filler;
    } else break;
  }
  // The fillers it started with
  if (ledByFiller) return `You opened with “${transcript.trim().slice(0, length).trim()}”. Start on your first real word instead.`;
  // Otherwise its first words
  return `You opened with “${transcript.trim().split(/\s+/).slice(0, QUOTED_WORDS).join(" ")}”.`;
}

// Fillers in the last words of the talk, as a sentence
function closingFillers(transcript: string): string {
  // The closing words
  const closing = transcript.trim().split(/\s+/).slice(-CLOSING_WORDS).join(" ");
  // Fillers among them, as said
  const fillers = markFillers(closing).filter((piece) => piece.filler).map((piece) => piece.text);
  // None, or the list
  return fillers.length === 0 ? "No fillers in your closing." : `Fillers crept into your closing: ${fillers.join(", ")}.`;
}

// The result of an opening or closing drill
export function bookendResult(part: BookendPart, session: SessionRecord): BookendResult {
  // Loudness readings, if recorded
  const loudness = session.loudness ?? [];
  // An opening: the pause before the first word, then the first words
  if (part === "opening") return { headline: loudness.length ? openingPauseSentence(loudness) : "Loudness was not recorded, so the opening pause could not be measured.", detail: openingWords(session.transcript) };
  // A close: fillers in the last words, then whether sentences faded
  const { faded, stretches } = loudness.length ? fadingEnds(loudness, LOUDNESS_TICK_MS) : { faded: 0, stretches: 0 };
  // The ending sentence
  const ending = !loudness.length ? "Loudness was not recorded, so endings could not be checked." : faded === 0 ? "None of your sentences faded at the end." : `${faded} of ${stretches} stretches faded at the end. Keep your voice up to the last word.`;
  // Both sentences
  return { headline: closingFillers(session.transcript), detail: ending };
}
