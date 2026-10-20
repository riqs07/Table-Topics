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
