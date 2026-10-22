// A take's pitch in its words, from whatever the take has (decision 111): the deeper analysis's words when it ran (exact), the known script's words for a reading or a lesson, or the phone's own word times (rough); and why nothing is drawn when it cannot be (readings dropped, never recorded, or too little voice)

// Load the script splitter
import { readingTokens } from "@/core/liveReading";
// Load the word matcher, to give a script's words the service's exact times
import { matchWords } from "@/core/wordMatch";
// Load the word placement
import { alignFromDevice, alignFromScript, alignFromServer, cleanWord, type Alignment } from "@/core/wordAlign";
// Load the phrase builder
import { pitchWords, type PitchWords } from "@/core/pitchPhrases";
// Load the cleaning, for a take with no words
import { cleanSteps } from "@/core/pitchClean";
// Load the spacing of the readings
import { LOUDNESS_TICK_MS } from "@/core/recordingRules";
// Load the record types
import type { FullSession, ServerWord } from "@/data/records";

// What can be drawn for a take
export type TakePitch =
  // Its readings were dropped by the retention rule (decision 98)
  | { state: "trimmed" }
  // It never had pitch readings (older takes, voice drills saved without them)
  | { state: "none" }
  // Too little voice to draw (whispered, noisy, or very short)
  | { state: "quiet" }
  // Voice but no words to place (nothing was caught)
  | { state: "no-words"; steps: (number | null)[] }
  // Ready: the phrases and how sure the word times are
  | { state: "ready"; pitch: PitchWords };

// The numbered words of a script as shown (with their punctuation), in order
export function scriptTexts(body: string): string[] {
  // Every numbered word's text
  return readingTokens(body).flatMap((token) => (token.kind === "text" && token.word !== null ? [token.text] : []));
}

// A script's words given the service's exact times, matched word for word (words the service did not hear are left out)
export function alignScriptWithServer(texts: ReadonlyArray<string>, words: ReadonlyArray<ServerWord>): Alignment {
  // Matched in order by their cleaned form
  const pairs = matchWords(texts.map(cleanWord), words.map((word) => cleanWord(word.w || word.text)));
  // Each matched script word with the service's times
  return { words: pairs.map(([script, heard]) => ({ text: texts[script]!, w: cleanWord(texts[script]!), start: words[heard]!.s, end: Math.max(words[heard]!.e, words[heard]!.s + 0.08), ref: script })), precision: "exact", punctuated: true };
}

// Where a take's words were said: exact from the service when it ran, the script's words for a reading, otherwise the phone's word times; null without any
export function takeAlignment(session: FullSession, options: { serverWords?: ReadonlyArray<ServerWord> | null; script?: string | null } = {}): Alignment | null {
  // The script's words, for a reading or a lesson
  const texts = options.script ? scriptTexts(options.script) : null;
  // The service's words, when it ran
  const server = options.serverWords && options.serverWords.length > 0 ? options.serverWords : null;
  // A script with the service's times
  if (texts && server) return alignScriptWithServer(texts, server);
  // The service's own words
  if (server) return alignFromServer(server);
  // A script with the times each word was first read
  if (texts && session.scriptTimes && session.scriptTimes.some((time) => time !== null)) return alignFromScript(texts, session.scriptTimes, session.loudness ?? [], LOUDNESS_TICK_MS);
  // The phone's transcript with its word times
  if (session.spokenTimes && session.spokenTimes.length > 0 && session.transcript.trim() !== "") return alignFromDevice(session.transcript, session.spokenTimes, session.loudness ?? [], LOUDNESS_TICK_MS);
  // Nothing to place
  return null;
}

// What can be drawn for a take's pitch in its words
export function takePitch(session: FullSession, options: { serverWords?: ReadonlyArray<ServerWord> | null; script?: string | null } = {}): TakePitch {
  // Readings dropped
  if (session.trimmedAt) return { state: "trimmed" };
  // Never recorded
  if (!session.pitch || session.pitch.length === 0) return { state: "none" };
  // Where the words were said
  const alignment = takeAlignment(session, options);
  // No words: the voice alone, when there is enough of it
  if (!alignment || alignment.words.length === 0) {
    // Cleaned
    const { steps } = cleanSteps(session.pitch, LOUDNESS_TICK_MS);
    // Enough voice to draw
    return steps.filter((step) => step !== null).length >= 10 ? { state: "no-words", steps } : { state: "quiet" };
  }
  // The phrases
  const pitch = pitchWords({ pitch: session.pitch, alignment, tickMs: LOUDNESS_TICK_MS });
  // Too little voice, or ready
  return pitch ? { state: "ready", pitch } : { state: "quiet" };
}
