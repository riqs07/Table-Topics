// Sample server analyses for tests (decision 91), so each test only spells out what it cares about

// Load the record types
import type { ServerTranscript, ServerVoice, ServerWord } from "@/data/records";
// Load the word cleaner
import { cleanWord } from "@/core/analysis/server";

// Words from a line like "So, um, the dog | ran." where each word is spoken a quarter second long, a "|" adds a half-second pause, and confidences default to 0.9
export function wordsFrom(line: string, confidence = 0.9): ServerWord[] {
  // The words
  const words: ServerWord[] = [];
  // When the next word starts
  let at = 0;
  // Each piece
  for (const piece of line.split(" ")) {
    // A pause marker
    if (piece === "|") {
      // Half a second of silence
      at += 0.5;
      // Next
      continue;
    }
    // The word, a quarter second long with a tenth of a second after it
    words.push({ text: piece, w: cleanWord(piece), s: Math.round(at * 100) / 100, e: Math.round((at + 0.25) * 100) / 100, conf: confidence });
    // Move on
    at += 0.35;
  }
  // Hand them back
  return words;
}

// A verbatim transcript of a line, overriding any field a test needs
export function makeTranscript(line: string, overrides: Partial<ServerTranscript> = {}): ServerTranscript {
  // The words, the text and the engine
  return { engine: "assemblyai-universal-3-pro", text: line.replace(/ \| /g, " "), words: wordsFrom(line), at: "2026-10-21T12:00:00.000Z", ...overrides };
}

// Voice findings, overriding any field a test needs
export function makeVoice(overrides: Partial<ServerVoice> = {}): ServerVoice {
  // Plausible numbers for a speaking voice, without the optional scores
  return { engine: "voice-worker-1", praat: "6.1.38", jitterLocalPct: 1.2, shimmerLocalDb: 0.5, hnrDb: 14.2, alphaRatioDb: -18.4, hammarbergDb: 24.1, creakPct: 6.5, syllables: 120, speechRate: 3.1, articulationRate: 4.2, f0: { medianHz: 130, p10Hz: 100, p90Hz: 180, rangeSt: 10.2, sdSt: 3.1 }, emotion: null, at: "2026-10-21T12:00:00.000Z", ...overrides };
}
