// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the functions being checked
import { mergeMetrics, placeServerPauses, placeServerSounds, readServerAnalysis, serverFillerCount, serverMetrics, toServerTranscript, toServerVoice, transcriptMetrics, voiceMetrics } from "@/core/analysis/server";
// Load the raw-feature builder, to make the phone's side
import { extractRaw } from "@/core/analysis/device";
// Load the sample records
import { makeSession } from "../../../support/fixtures";
import { makeTranscript, makeVoice, wordsFrom } from "../../../support/serverAnalysis";
// Load the record types
import type { MetricValue } from "@/data/records";

// The phone's raw features for a one-minute talk the browser heard as "the dog ran home" (no "um": the browser dropped it)
const RAW = extractRaw(makeSession({ mode: "talk", transcript: "the dog ran home", fillersPerMinute: 0, durationSec: 60 }));

// One measure as the phone would store it
const phone = (value: number | null, engine = "device-heuristic-v1"): MetricValue => ({ value, unit: "%", source: "device", engine });

// Group the checks about reading the server's analysis (decision 91)
describe("server analysis measures", () => {
  // Pauses are placed by the punctuation before them, looking through hesitation sounds
  it("places a pause after a comma or full stop at a boundary and any other inside a clause", async () => {
    // "the dog | ran." is mid-clause; "ran. | Then," is at a boundary; "then, um, | we" is judged by "then," (a boundary)
    expect(placeServerPauses(wordsFrom("The dog | ran. | Then, um, | we left"))).toEqual({ boundary: 2, midClause: 1 });
  });

  // A pause before the first real word cannot be placed, and short gaps are not pauses
  it("leaves out a pause before the first real word and gaps under a quarter second", async () => {
    // "um | the" has only a sound before it; the other gaps are a tenth of a second
    expect(placeServerPauses(wordsFrom("Um | the dog ran"))).toEqual({ boundary: 0, midClause: 0 });
  });

  // A trailing hyphen is a word cut off, not a clause end
  it("counts a pause after a cut-off word as inside a clause", async () => {
    // "wen- | went"
    expect(placeServerPauses(wordsFrom("I wen- | went home"))).toEqual({ boundary: 0, midClause: 1 });
  });

  // Hesitation sounds at the start or after a clause end are at a boundary; others are mid-clause
  it("places pause words the same way", async () => {
    // "Um" opens (boundary); "home. Uh" (boundary); "the um dog" (mid-clause)
    expect(placeServerSounds(wordsFrom("Um I went home. Uh the um dog"))).toEqual({ boundary: 2, midClause: 1 });
  });

  // Talk: the app's own filler counter runs over the verbatim text
  it("counts pause words in talk with the app's own counter", async () => {
    // Two sounds and "you know"
    expect(serverFillerCount(makeTranscript("Um the dog, uh, ran home, you know."), RAW)).toBe(3);
  });

  // Reading: the phone's count plus only the hesitation sounds it missed (words in the text never count)
  it("adds only the missed hesitation sounds to the phone's count for a reading", async () => {
    // A reading where the phone counted 2 pause words in a minute and heard one "um"
    const raw = extractRaw(makeSession({ mode: "read", transcript: "um you know the text", fillersPerMinute: 2, durationSec: 60 }));
    // The service heard two "um"s and an "uh" (and the text's own "you know")
    expect(serverFillerCount(makeTranscript("Um, you know, the um text uh"), raw)).toBe(2 + 2);
  });

  // Every transcript measure, with its engine, from one take
  it("works out every transcript measure with its engine", async () => {
    // A take with a mid-clause pause, a boundary pause, two sounds (one mid-clause) and a lower-confidence word
    const transcript = makeTranscript("So the dog | ran. | Um, then the uh cat sat");
    // The measures
    const metrics = transcriptMetrics(transcript, RAW);
    // Values and engines
    expect(Object.fromEntries(Object.entries(metrics).map(([id, value]) => [id, [value.value, value.engine, value.source]]))).toEqual({
      // Two sounds and "so" opening the sentence, in one minute
      "lang.fillers_per_min": [3, "assemblyai-universal-3-pro", "transcript"],
      // The phone heard none, so no ratio
      "lang.filler_source_ratio": [null, "assemblyai-universal-3-pro", "transcript"],
      // "so" as a discourse marker
      "lang.discourse_markers_per_min": [1, "assemblyai-universal-3-pro", "transcript"],
      // One of two pauses mid-clause
      "flu.midclause_pause_share": [50, "assemblyai-universal-3-pro-punctuation-v1", "transcript"],
      // (the other at a boundary)
      "flu.boundary_pause_share": [50, "assemblyai-universal-3-pro-punctuation-v1", "transcript"],
      // Eight real words over two boundary-separated runs
      "lang.mean_clause_words": [4, "assemblyai-universal-3-pro-punctuation-v1", "transcript"],
      // "Um" after "ran." is at a boundary; "uh" after "the" is mid-clause
      "flu.filler_midclause_share": [50, "assemblyai-universal-3-pro-punctuation-v1", "transcript"],
      // Average confidence of the real words
      "pro.articulation_clarity": [90, "assemblyai-universal-3-pro", "transcript"],
    });
  });

  // Too few words: no clarity; no sounds: no mid-clause share of sounds
  it("leaves clarity and the sound placement empty when there is too little to judge", async () => {
    // Three words
    const metrics = transcriptMetrics(makeTranscript("Hello there friend"), RAW);
    // Both empty
    expect([metrics["pro.articulation_clarity"]?.value, metrics["flu.filler_midclause_share"]?.value]).toEqual([null, null]);
  });

  // The filler recall check divides the service's count by the phone's
  it("compares the service's pause-word count with the phone's", async () => {
    // The phone counted one a minute; the service hears three
    const raw = extractRaw(makeSession({ mode: "talk", transcript: "um the dog", fillersPerMinute: 1, durationSec: 60 }));
    // Three times as many
    expect(transcriptMetrics(makeTranscript("Um the uh dog er"), raw)["lang.filler_source_ratio"]?.value).toBe(3);
  });

  // The voice worker's numbers become measures, with its engine; the optional scores only when present
  it("turns the voice findings into measures, adding the optional scores only when they came", async () => {
    // Without and with the audEERING scores
    const [plain, scored] = [voiceMetrics(makeVoice()), voiceMetrics(makeVoice({ emotion: { arousal: 0.61, dominance: 0.55, valence: 0.48, model: "audeering-w2v2-msp-dim" } }))];
    // The plain set, its engine, and the scores' own engine
    expect([Object.keys(plain).sort(), plain["pro.jitter_local"], scored["pro.arousal"], "pro.arousal" in plain]).toEqual([
      ["flu.articulation_rate", "flu.speech_rate", "pro.alpha_ratio", "pro.creak_share", "pro.hammarberg", "pro.hnr_db", "pro.jitter_local", "pro.shimmer_local_db"],
      { value: 1.2, unit: "%", source: "voice", engine: "voice-worker-1+praat-6.1.38" },
      { value: 0.61, unit: "0–1", source: "voice", engine: "audeering-w2v2-msp-dim" },
      false,
    ]);
  });

  // Either part may be missing
  it("uses whichever parts came back", async () => {
    // Only the voice
    const metrics = serverMetrics({ transcript: null, voice: makeVoice() }, RAW);
    // Voice measures, no transcript ones
    expect(["pro.hnr_db" in metrics, "lang.fillers_per_min" in metrics]).toEqual([true, false]);
  });
});

// Group the checks about merging the sources
describe("merging the phone's and the server's measures", () => {
  // A server value replaces the phone's, and the phone's is kept aside
  it("replaces a phone value with a server value and keeps the phone value", async () => {
    // Merged
    const merged = mergeMetrics({ "flu.midclause_pause_share": phone(40), "lang.wpm": phone(120) }, {}, { "flu.midclause_pause_share": { value: 25, unit: "%", source: "transcript", engine: "server" } });
    // The server's value shown, the phone's kept, the rest untouched
    expect(merged).toEqual({ metrics: { "flu.midclause_pause_share": { value: 25, unit: "%", source: "transcript", engine: "server" }, "lang.wpm": phone(120) }, superseded: { "flu.midclause_pause_share": phone(40) } });
  });

  // An empty server value never hides a phone value
  it("never lets an empty server value hide a phone value", async () => {
    // Merged
    const merged = mergeMetrics({ "flu.midclause_pause_share": phone(40) }, {}, { "flu.midclause_pause_share": { value: null, unit: "%", source: "transcript", engine: "server" }, "pro.hnr_db": { value: null, unit: "dB", source: "voice", engine: "w" } });
    // The phone value stays; a measure only the server has is kept, even empty
    expect([merged.metrics["flu.midclause_pause_share"], merged.metrics["pro.hnr_db"]?.value, merged.superseded]).toEqual([phone(40), null, {}]);
  });
});

// Group the checks about the shapes kept on the phone
describe("server analysis shapes", () => {
  // Milliseconds become seconds, words are cleaned, confidence is kept in range
  it("converts the service's words into the kept shape", async () => {
    // Converted
    const transcript = toServerTranscript("Um, hi.", [{ text: "Um,", start: 120, end: 380, confidence: 0.81234 }, { text: "Hi.", start: 900, end: 1150, confidence: 1.2 }], "assemblyai-universal-3-pro", "2026-10-21T12:00:00.000Z");
    // Seconds, cleaned words, rounded confidence
    expect(transcript.words).toEqual([{ text: "Um,", w: "um", s: 0.12, e: 0.38, conf: 0.81 }, { text: "Hi.", w: "hi", s: 0.9, e: 1.15, conf: 1 }]);
  });

  // The worker's names become the kept names
  it("converts the worker's reply into the kept shape", async () => {
    // Converted
    const voice = toServerVoice({ version: "1", praat_version: "6.1.38", jitter_local_pct: 1.2, shimmer_local_db: 0.5, hnr_db: 14.2, alpha_ratio_db: -18.4, hammarberg_db: 24.1, creak_pct: 6.5, syllables: 120, speech_rate_sps: 3.1, articulation_rate_sps: 4.2, f0: { median_hz: 130, p10_hz: 100, p90_hz: 180, range_st: 10.2, sd_st: 3.1 }, emotion: null }, "2026-10-21T12:00:00.000Z");
    // The same as the sample
    expect(voice).toEqual(makeVoice());
  });

  // A reply of the wrong shape is refused
  it("reads a server analysis only when its shape is right", async () => {
    // A good one, one with a broken word, and nonsense
    expect([readServerAnalysis({ transcript: makeTranscript("Hi there"), voice: null }) !== null, readServerAnalysis({ transcript: { ...makeTranscript("Hi"), words: [{ text: "hi" }] }, voice: null }), readServerAnalysis("nope")]).toEqual([true, null, null]);
  });
});
