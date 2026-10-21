// The size limits on what the app sends to its own server, shared by the server's checks and the app (decision 86), so a session the app can make is never refused for being too long

// Load the longest each kind of session can run
import { maxSeconds } from "@/core/recordingRules";
// Load the list of session kinds
import { SESSION_MODES } from "@/data/records";

// The longest recording any kind of session allows, in seconds (a rehearsal's 30 minutes)
export const LONGEST_RECORDING_SECONDS = Math.max(...SESSION_MODES.map((mode) => maxSeconds(mode)));

// The longest transcript sent for feedback, in characters: a fast 30-minute rehearsal is about 6,000 words, or about 36,000 characters
export const TRANSCRIPT_MAX_CHARS = 40_000;

// The longest note of your own sent to the coach, in characters (also the most the notes box takes)
export const NOTE_MAX_CHARS = 500;

// The longest single conversation turn sent, in characters (a fast minute is about 200 words, or about 1,100 characters)
export const TURN_MAX_CHARS = 1_000;

// The most conversation turns sent at once
export const MAX_TURNS = 60;

// The most text one feedback request may carry in all, in characters, so the caps above cannot stack into one very costly call: a fast 30-minute rehearsal (about 36,000) with full notes and a previous change still fits
export const REQUEST_TEXT_MAX_CHARS = 45_000;

// The parts of a feedback request that carry text, as both the app and the server see them
export interface RequestText {
  // What was said
  transcript: string;
  // The change given last time, on a retry
  previousChange?: string | null;
  // A Q&A question
  question?: string;
  // A short speech's plan
  outline?: { topic: string; points: string[] };
  // The speaker's own notes
  notes?: { worked: string; change: string; tags: string[] };
  // A conversation's turns (a recorded line may carry no text)
  conversation?: { turns: { text?: string }[] };
}

// How many characters of text a feedback request carries in all
export function requestTextLength(body: RequestText): number {
  // Every piece of text, missing ones as empty
  const pieces = [
    // The transcript
    body.transcript,
    // The previous change
    body.previousChange ?? "",
    // The question
    body.question ?? "",
    // The plan's topic and points
    body.outline?.topic ?? "", ...(body.outline?.points ?? []),
    // The notes and their tags
    body.notes?.worked ?? "", body.notes?.change ?? "", ...(body.notes?.tags ?? []),
    // Each turn's words
    ...(body.conversation?.turns ?? []).map((turn) => turn.text ?? ""),
  ];
  // Their lengths added up
  return pieces.reduce((total, piece) => total + piece.length, 0);
}

// How long the transcript may be once everything else in the request is counted, so the app never sends more than the server takes
export function transcriptRoom(rest: Omit<RequestText, "transcript">): number {
  // What is left of the total after the rest, never below nothing and never over the transcript's own cap
  return Math.min(TRANSCRIPT_MAX_CHARS, Math.max(0, REQUEST_TEXT_MAX_CHARS - requestTextLength({ ...rest, transcript: "" })));
}

// Text cut to a limit, at the last whole word that fits when it is too long
export function withinLimit(text: string, max: number): string {
  // Short enough already
  if (text.length <= max) return text;
  // The part that fits
  const cut = text.slice(0, max);
  // The last space in it, so a word is not split
  const space = cut.lastIndexOf(" ");
  // Up to that space, or the cut itself when there is none
  return (space > 0 ? cut.slice(0, space) : cut).trimEnd();
}

// A length in seconds kept within what the server takes
export function withinDuration(seconds: number): number {
  // Never over the longest recording
  return Math.min(seconds, LONGEST_RECORDING_SECONDS);
}

// The most audio sent for deeper analysis in one upload, in bytes (decision 91): under the 4.5 MB request limit of Vercel's functions. Recordings are 32 kbit/s (about 240 KB a minute), so takes up to about 16 minutes fit; longer ones keep the phone's measures only and say so
export const ANALYSE_MAX_BYTES = 4_000_000;

// The kinds of audio the deeper-analysis route takes (what browsers record: WebM or Ogg with Opus in Chrome and Firefox, MP4 with AAC in Safari), without their parameters
export const ANALYSE_AUDIO_TYPES: ReadonlyArray<string> = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-wav", "audio/aac"];

// The weekly summary's limits (decision 90): a compact table of numbers and a few short quotes, never whole transcripts
export const SUMMARY_SIZE = {
  // Families of practice in one request (six since stories joined; decision 92)
  families: 6,
  // Measure rows per family
  rowsPerFamily: 30,
  // Patterns, and the longest one in characters
  patterns: 10,
  // (characters)
  patternChars: 300,
  // Quotes, and the longest one in characters
  quotes: 5,
  // (characters)
  quoteChars: 200,
  // Word swaps and favourite words
  swaps: 3,
  // (favourite words)
  words: 10,
  // All the text in one request, in characters
  totalChars: 12_000,
} as const;
