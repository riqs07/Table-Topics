// The server's deeper analysis turned into measures (decision 91): the transcription service's verbatim, punctuated, timed transcript and the voice worker's findings each fill in stage-B measures, and replace three phone guesses (pause placement and the pause-word count) with better ones. Pure: it reads what the server returned and the phone's raw features, and returns measures

// Load the schema library, for checking a server analysis from outside the app's own code
import { z } from "zod";
// Load the filler counter and the hesitation-sound check
import { countFillers, isHesitationSound } from "@/core/fillers";
// Load the statistics helpers
import { mean, round } from "@/core/analysis/stats";
// Load the record types
import type { AnalysisRaw, MetricSource, MetricValue, ServerAnalysis, ServerTranscript, ServerVoice, ServerWord, SessionMode } from "@/data/records";

// The shortest silence between two words that counts as a pause, in seconds (the same as the phone's)
const PAUSE_SECONDS = 0.25;
// Fewest words before the average word confidence means anything
const MIN_WORDS_FOR_CLARITY = 5;
// Kinds of session read from a text: words in the text are not pause words, so only hesitation sounds the phone missed are added to its count
const SCRIPTED: ReadonlyArray<SessionMode> = ["read", "pause", "lesson", "rehearse"];
// Punctuation after a word that marks the end of a clause or sentence (with any closing quote or bracket after it); a trailing hyphen marks a word cut off, not a clause end
const CLAUSE_END = /[.,;:?!…—–]["'”’)\]]*$/;
// The discourse markers counted from the verbatim transcript, as the filler counter names them
const DISCOURSE_MARKERS: ReadonlyArray<string> = ["like", "you know", "so", "i mean"];

// The engine stored with the pause placement read from the transcript's punctuation
export function placementEngine(transcript: ServerTranscript): string {
  // Named after the transcript's engine
  return `${transcript.engine}-punctuation-v1`;
}

// The engine stored with the voice worker's measures
export function voiceEngine(voice: ServerVoice): string {
  // The worker's version and the Praat inside it
  return `${voice.engine}+praat-${voice.praat}`;
}

// Whether a transcript word is a hesitation sound such as "um"
export function isSound(word: ServerWord): boolean {
  // Judged on the cleaned word
  return word.w !== "" && isHesitationSound(word.w);
}

// The position of the nearest word before a position that is not a hesitation sound, or -1 when there is none (sounds are looked through, so "and, um," is judged by "and")
function previousSpoken(words: ReadonlyArray<ServerWord>, index: number): number {
  // Walk back
  for (let position = index - 1; position >= 0; position--) {
    // A real word
    if (words[position]!.w !== "" && !isSound(words[position]!)) return position;
  }
  // None before it
  return -1;
}

// Whether a word ends a clause or sentence, by the punctuation the service put after it
export function endsClause(word: ServerWord): boolean {
  // Its written form ends in clause punctuation
  return CLAUSE_END.test(word.text.trim());
}

// Pauses between words (a quarter second or more from one word's end to the next word's start), each placed at a boundary or inside a clause by the punctuation before it; a pause before the first real word cannot be placed
export function placeServerPauses(words: ReadonlyArray<ServerWord>): { boundary: number; midClause: number } {
  // The counts
  const counts = { boundary: 0, midClause: 0 };
  // Each gap between two words
  for (let index = 1; index < words.length; index++) {
    // Too short to be a pause
    if (words[index]!.s - words[index - 1]!.e < PAUSE_SECONDS) continue;
    // The last real word before it
    const before = previousSpoken(words, index);
    // Nothing to judge it by
    if (before === -1) continue;
    // Count it on its side
    if (endsClause(words[before]!)) counts.boundary += 1;
    // (inside a clause)
    else counts.midClause += 1;
  }
  // Hand them back
  return counts;
}

// Hesitation sounds placed the same way: at a boundary when they open the take or follow the end of a clause, otherwise inside a clause
export function placeServerSounds(words: ReadonlyArray<ServerWord>): { boundary: number; midClause: number } {
  // The counts
  const counts = { boundary: 0, midClause: 0 };
  // Each sound
  words.forEach((word, index) => {
    // Only sounds
    if (!isSound(word)) return;
    // The last real word before it
    const before = previousSpoken(words, index);
    // At the start, or after a clause ends
    if (before === -1 || endsClause(words[before]!)) counts.boundary += 1;
    // (inside a clause)
    else counts.midClause += 1;
  });
  // Hand them back
  return counts;
}

// Per minute over a length in seconds, or null without a length
function perMinute(count: number, seconds: number): number | null {
  // Scaled to a minute
  return seconds > 0 ? (count * 60) / seconds : null;
}

// The pause-word count from the verbatim transcript: for talk, the app's own filler counter over the service's words (the same definition as the phone's, with the "um"s the browser dropped); for reading, the phone's count plus the hesitation sounds it missed, since words in the text are never pause words
export function serverFillerCount(transcript: ServerTranscript, raw: AnalysisRaw): number {
  // Read from a text: the phone's count plus the extra sounds
  if (SCRIPTED.includes(raw.mode)) {
    // Sounds the service heard
    const heard = transcript.words.filter(isSound).length;
    // Sounds in the phone's transcript (none counted when the take's words were dropped with its readings, decision 98; only a backup brought in later can add a server part to such a take)
    const phone = (raw.timedWords ?? []).filter((word) => word.w !== "" && isHesitationSound(word.w)).length;
    // The phone's count (from its saved rate) and the difference
    return Math.round((raw.fillersPerMinute * raw.durationSec) / 60) + Math.max(0, heard - phone);
  }
  // Talk: counted afresh
  return countFillers(transcript.text).total;
}

// Every measure the verbatim transcript gives
export function transcriptMetrics(transcript: ServerTranscript, raw: AnalysisRaw): Record<string, MetricValue> {
  // The measures
  const metrics: Record<string, MetricValue> = {};
  // Store one measure (rounded to two decimals) with its source and engine
  const put = (id: string, value: number | null, unit: string, engine = transcript.engine, source: MetricSource = "transcript") => {
    // Kept with where it came from
    metrics[id] = { value: value === null || !Number.isFinite(value) ? null : round(value, 2), unit, source, engine };
  };
  // The real words (no hesitation sounds, no pieces without letters)
  const spoken = transcript.words.filter((word) => word.w !== "" && !isSound(word));
  // Pause words: counted from the verbatim transcript
  const fillers = serverFillerCount(transcript, raw);
  // Pause words a minute
  put("lang.fillers_per_min", perMinute(fillers, raw.durationSec), "/min");
  // The phone's count, from its saved rate
  const phoneFillers = Math.round((raw.fillersPerMinute * raw.durationSec) / 60);
  // How many more the service heard than the phone (risk R1)
  put("lang.filler_source_ratio", phoneFillers > 0 ? fillers / phoneFillers : null, "ratio");
  // Discourse markers a minute, for talk (a text being read may contain them)
  const byFiller = countFillers(transcript.text).byFiller;
  // (counted)
  put("lang.discourse_markers_per_min", SCRIPTED.includes(raw.mode) ? null : perMinute(DISCOURSE_MARKERS.reduce((sum, name) => sum + (byFiller[name] ?? 0), 0), raw.durationSec), "/min");
  // Where pauses fall, by the punctuation
  const placed = placeServerPauses(transcript.words);
  // How many could be placed
  const placedCount = placed.boundary + placed.midClause;
  // The placement engine
  const placing = placementEngine(transcript);
  // Mid-clause share
  put("flu.midclause_pause_share", placedCount > 0 ? (placed.midClause / placedCount) * 100 : null, "%", placing);
  // Boundary share
  put("flu.boundary_pause_share", placedCount > 0 ? (placed.boundary / placedCount) * 100 : null, "%", placing);
  // Words between boundary pauses
  put("lang.mean_clause_words", placedCount > 0 && spoken.length > 0 ? spoken.length / (placed.boundary + 1) : null, "words", placing);
  // Where pause words fall
  const sounds = placeServerSounds(transcript.words);
  // How many sounds
  const soundCount = sounds.boundary + sounds.midClause;
  // Mid-clause share of pause words
  put("flu.filler_midclause_share", soundCount > 0 ? (sounds.midClause / soundCount) * 100 : null, "%", placing);
  // How sure the service was of the real words, on average, as a percentage
  put("pro.articulation_clarity", spoken.length >= MIN_WORDS_FOR_CLARITY ? mean(spoken.map((word) => word.conf))! * 100 : null, "%");
  // Every measure
  return metrics;
}

// Every measure the voice worker gives (the audEERING scores only when that module ran)
export function voiceMetrics(voice: ServerVoice): Record<string, MetricValue> {
  // The measures
  const metrics: Record<string, MetricValue> = {};
  // The worker's engine
  const engine = voiceEngine(voice);
  // Store one measure (rounded to two decimals) with its source and engine
  const put = (id: string, value: number | null, unit: string, by = engine) => {
    // Kept with where it came from
    metrics[id] = { value: value === null || !Number.isFinite(value) ? null : round(value, 2), unit, source: "voice", engine: by };
  };
  // Voice quality from Praat
  put("pro.jitter_local", voice.jitterLocalPct, "%");
  // (shimmer)
  put("pro.shimmer_local_db", voice.shimmerLocalDb, "dB");
  // (harmonics to noise)
  put("pro.hnr_db", voice.hnrDb, "dB");
  // Spectral tilt
  put("pro.alpha_ratio", voice.alphaRatioDb, "dB");
  // (Hammarberg)
  put("pro.hammarberg", voice.hammarbergDb, "dB");
  // Creak
  put("pro.creak_share", voice.creakPct, "%");
  // Syllable rates from loudness peaks
  put("flu.articulation_rate", voice.articulationRate, "syll/s");
  // (over the whole take)
  put("flu.speech_rate", voice.speechRate, "syll/s");
  // The audEERING scores (personal use only), when the module ran
  if (voice.emotion) {
    // Arousal
    put("pro.arousal", voice.emotion.arousal, "0–1", voice.emotion.model);
    // Dominance
    put("pro.dominance", voice.emotion.dominance, "0–1", voice.emotion.model);
    // Valence
    put("pro.valence", voice.emotion.valence, "0–1", voice.emotion.model);
  }
  // Every measure
  return metrics;
}

// Every measure the server's analysis gives, transcript first, then voice
export function serverMetrics(server: ServerAnalysis, raw: AnalysisRaw): Record<string, MetricValue> {
  // Both parts, each when present
  return { ...(server.transcript ? transcriptMetrics(server.transcript, raw) : {}), ...(server.voice ? voiceMetrics(server.voice) : {}) };
}

// Put the measures together: the phone's, the rubric's, then the server's. A server value replaces a phone value only when it has a number, and the phone value it replaced is handed back too, so no phone value is ever lost
export function mergeMetrics(device: Record<string, MetricValue>, rubric: Record<string, MetricValue>, server: Record<string, MetricValue>): { metrics: Record<string, MetricValue>; superseded: Record<string, MetricValue> } {
  // Start from the phone and the rubric
  const metrics: Record<string, MetricValue> = { ...device, ...rubric };
  // The phone values replaced
  const superseded: Record<string, MetricValue> = {};
  // Each server measure
  for (const [id, value] of Object.entries(server)) {
    // The phone has this measure
    const phone = device[id];
    // An empty server value never hides a phone value
    if (phone && value.value === null) continue;
    // Keep the phone value it replaces
    if (phone) superseded[id] = phone;
    // The server value
    metrics[id] = value;
  }
  // Both
  return { metrics, superseded };
}

// One word as the transcription service returns it (times in milliseconds)
export interface ServiceWord {
  // The word as written
  text: string;
  // Start, in milliseconds
  start: number;
  // End, in milliseconds
  end: number;
  // Confidence, 0 to 1
  confidence: number;
}

// A word cleaned the way the phone cleans its words: lower case, letters and apostrophes only
export function cleanWord(text: string): string {
  // Lower case, curly apostrophes made straight, everything else dropped
  return text.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z']+/g, "");
}

// The service's transcript in the shape kept on the phone: times in seconds (to the hundredth), confidence to the hundredth, and each word cleaned
export function toServerTranscript(text: string, words: ReadonlyArray<ServiceWord>, engine: string, at: string): ServerTranscript {
  // Each word converted
  return { engine, text, at, words: words.map((word) => ({ text: word.text, w: cleanWord(word.text), s: round(word.start / 1000, 2), e: round(word.end / 1000, 2), conf: round(Math.min(1, Math.max(0, word.confidence)), 2) })) };
}

// The voice worker's reply, as it names things
export interface WorkerFindings {
  // Versions
  version: string; praat_version: string;
  // Voice quality
  jitter_local_pct: number | null; shimmer_local_db: number | null; hnr_db: number | null;
  // Spectral tilt
  alpha_ratio_db: number | null; hammarberg_db: number | null;
  // Creak
  creak_pct: number | null;
  // Syllables and rates
  syllables: number | null; speech_rate_sps: number | null; articulation_rate_sps: number | null;
  // Pitch
  f0: { median_hz: number; p10_hz: number; p90_hz: number; range_st: number; sd_st: number } | null;
  // The optional audEERING scores
  emotion: { arousal: number; dominance: number; valence: number; model: string } | null;
}

// The worker's findings in the shape kept on the phone
export function toServerVoice(reply: WorkerFindings, at: string): ServerVoice {
  // Renamed field by field
  return {
    // The worker and its Praat
    engine: `voice-worker-${reply.version}`, praat: reply.praat_version,
    // Voice quality
    jitterLocalPct: reply.jitter_local_pct, shimmerLocalDb: reply.shimmer_local_db, hnrDb: reply.hnr_db,
    // Spectral tilt
    alphaRatioDb: reply.alpha_ratio_db, hammarbergDb: reply.hammarberg_db,
    // Creak
    creakPct: reply.creak_pct,
    // Syllables and rates
    syllables: reply.syllables, speechRate: reply.speech_rate_sps, articulationRate: reply.articulation_rate_sps,
    // Pitch
    f0: reply.f0 ? { medianHz: reply.f0.median_hz, p10Hz: reply.f0.p10_hz, p90Hz: reply.f0.p90_hz, rangeSt: reply.f0.range_st, sdSt: reply.f0.sd_st } : null,
    // The optional scores
    emotion: reply.emotion,
    // When
    at,
  };
}

// A number, or null
const Measure = z.number().finite().nullable();

// The shape of a kept verbatim transcript, for checking the route's reply and imported files
export const ServerTranscriptSchema = z.object({
  // The engine
  engine: z.string().max(80),
  // The whole text
  text: z.string().max(200_000),
  // Every word
  words: z.array(z.object({ text: z.string().max(200), w: z.string().max(200), s: z.number().finite(), e: z.number().finite(), conf: z.number().min(0).max(1) })).max(20_000),
  // When
  at: z.string().max(40),
});

// The shape of kept voice findings
export const ServerVoiceSchema = z.object({
  // The worker and its Praat
  engine: z.string().max(80), praat: z.string().max(40),
  // Voice quality
  jitterLocalPct: Measure, shimmerLocalDb: Measure, hnrDb: Measure,
  // Spectral tilt
  alphaRatioDb: Measure, hammarbergDb: Measure,
  // Creak
  creakPct: Measure,
  // Syllables and rates
  syllables: Measure, speechRate: Measure, articulationRate: Measure,
  // Pitch
  f0: z.object({ medianHz: z.number(), p10Hz: z.number(), p90Hz: z.number(), rangeSt: z.number(), sdSt: z.number() }).nullable(),
  // The optional scores
  emotion: z.object({ arousal: z.number(), dominance: z.number(), valence: z.number(), model: z.string().max(120) }).nullable(),
  // When
  at: z.string().max(40),
});

// The shape of the server's whole analysis
export const ServerAnalysisSchema = z.object({ transcript: ServerTranscriptSchema.nullable(), voice: ServerVoiceSchema.nullable() });

// Read a server analysis from outside the app's own code (the route's reply or an imported file), or null when its shape is wrong
export function readServerAnalysis(value: unknown): ServerAnalysis | null {
  // Checked
  const parsed = ServerAnalysisSchema.safeParse(value);
  // The analysis, or nothing
  return parsed.success ? parsed.data : null;
}
