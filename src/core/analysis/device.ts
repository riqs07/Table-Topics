// The phone's own measures of a take (decision 90): first the raw features are taken from the session (timed words, pauses, loudness and pitch summaries), then every measure is worked out from those features alone, so it can be worked out again later without the audio

// Load the language and vocabulary measures
import { contentWordCounts, countRepairs, languageMeasures } from "@/core/analysis/language";
// Load the pause placement rule
import { PLACEMENT_ENGINE, placePauses, wordAfter } from "@/core/analysis/placement";
// Load the statistics helpers
import { coefficientOfVariation, mean, median, quantile, round, standardDeviation } from "@/core/analysis/stats";
// Load the loudness threshold and the fading rule
import { fadingEnds, speechThreshold } from "@/core/pauses";
// Load the pitch helpers
import { toSteps, usualPitch } from "@/core/pitch";
// Load the conversation measures
import { measureConversation } from "@/core/conversationMeasures";
// Load the conversation's timing measures (decision 120)
import { conversationTiming } from "@/core/conversationTiming";
// Load the timing engine's name
import { TIMING_ENGINE } from "@/config/models";
// Load the story checks (decision 92)
import { storyRaw } from "@/core/storyChecks";
// Load the guided stories and their comparison with the facts (decision 93)
import { factsOf, findGuidedStory } from "@/content/guidedStories";
import { guidedRaw } from "@/core/guidedStory";
// Load the voice report, for how phrases ended
import { voiceReport } from "@/core/voiceFeedback";
// Load the spacing of the loudness readings
import { LOUDNESS_TICK_MS } from "@/core/recordingRules";
// Load the word splitter, to take the words from the transcript
import { timedWords } from "@/core/analysis/timedWords";
// Load the measure registry, for units
import { findMetric } from "@/core/analysis/metrics";
// Load the record types
import type { AnalysisRaw, MetricSource, MetricValue, PauseSpan, FullSession, TimedWord } from "@/data/records";

// The device engine's version, stored with every analysis
export const DEVICE_ENGINE_VERSION = "1";
// The plain device engine name
const DEVICE = `device-v${DEVICE_ENGINE_VERSION}`;
// The shortest silence that counts as a pause, in seconds (de Jong and Bosker 2013)
export const PAUSE_SECONDS = 0.25;
// A pause this long or longer counts as long
export const LONG_PAUSE_SECONDS = 1;
// Without loudness readings, a gap between word times this long counts as a pause (word times are rough, so a longer gap is needed)
const WORD_GAP_SECONDS = 0.8;
// Fewest words, and seconds, before the pace across thirds is judged
const MIN_WORDS_FOR_THIRDS = 30;
// (seconds)
const MIN_SECONDS_FOR_THIRDS = 20;
// Fewest voiced pitch readings (three seconds of voice) before pitch is summed up
const MIN_VOICED = 30;
// The opening stretch compared with the rest, in seconds
const OPENING_SECONDS = 30;

// The transcript's words with their times, kept in a small module of its own so storage code can rebuild them without loading the measures (decision 98)
export { timedWords } from "@/core/analysis/timedWords";

// The pauses of a quarter second or more in the loudness readings, between the first and last speech, with the first word heard after each
function loudnessPauses(levels: ReadonlyArray<number>, words: ReadonlyArray<TimedWord>): { pauses: PauseSpan[]; speech: { first: number; last: number } | null } {
  // Below this is silence
  const threshold = speechThreshold(levels);
  // Which readings are speech
  const speaking = levels.map((level) => level >= threshold);
  // The first and last speech readings
  const [first, last] = [speaking.indexOf(true), speaking.lastIndexOf(true)];
  // No speech at all
  if (first === -1) return { pauses: [], speech: null };
  // Seconds per reading
  const tick = LOUDNESS_TICK_MS / 1000;
  // Readings that make a pause
  const minTicks = Math.ceil(PAUSE_SECONDS / tick - 1e-9);
  // The pauses found
  const pauses: PauseSpan[] = [];
  // Where the current silence started, or -1
  let silentFrom = -1;
  // Walk the readings between the first and last speech
  for (let index = first; index <= last; index++) {
    // Silence starts or goes on
    if (!speaking[index]) {
      // Note where it started
      if (silentFrom === -1) silentFrom = index;
      // Next reading
      continue;
    }
    // Speech after a long enough silence closes a pause
    if (silentFrom !== -1 && index - silentFrom >= minTicks) pauses.push({ start: round(silentFrom * tick, 2), end: round(index * tick, 2), nextWord: wordAfter(words, index * tick) });
    // No silence now
    silentFrom = -1;
  }
  // The pauses and the span of speech
  return { pauses, speech: { first: round(first * tick, 2), last: round((last + 1) * tick, 2) } };
}

// Pauses from gaps between word times, for takes without loudness readings
function wordGapPauses(words: ReadonlyArray<TimedWord>): PauseSpan[] {
  // The pauses found
  const pauses: PauseSpan[] = [];
  // Each word with a time and a next time
  words.forEach((word, index) => {
    // A long enough gap before the next word
    if (word.s !== null && word.e !== null && word.e - word.s >= WORD_GAP_SECONDS) pauses.push({ start: word.s, end: word.e, nextWord: index + 1 });
  });
  // Hand them back
  return pauses;
}

// Pitch summed up: usual pitch, range and spread in semitones (slips dropped), and how phrases ended; null with too little voice
function pitchSummary(session: FullSession): AnalysisRaw["pitch"] {
  // The readings
  const readings = session.pitch ?? [];
  // The usual pitch
  const usual = usualPitch(readings);
  // No voice
  if (usual === null) return null;
  // The voiced readings in semitones
  const steps = toSteps(readings, usual).filter((step): step is number => step !== null);
  // Too little voice
  if (steps.length < MIN_VOICED) return null;
  // How phrases ended (needs loudness to find the phrases)
  const ends = voiceReport(session, null).pitch?.ends ?? { fall: 0, level: 0, rise: 0 };
  // The summary
  return { medianHz: Math.round(usual), rangeSt: round(quantile(steps, 0.9)! - quantile(steps, 0.1)!, 1), sdSt: round(standardDeviation(steps)!, 2), ends };
}

// Loudness while speaking summed up: the average, its spread as a share of the average, and each third's average
function loudnessSummary(levels: ReadonlyArray<number>, autoGain: boolean | undefined): AnalysisRaw["loudness"] {
  // Below this is silence
  const threshold = speechThreshold(levels);
  // The speech readings
  const voiced = levels.filter((level) => level >= threshold && level > 0);
  // Too few to judge
  if (voiced.length < 10) return null;
  // The average of the speech readings in one stretch, or 0
  const speechMean = (part: ReadonlyArray<number>) => mean(part.filter((level) => level >= threshold && level > 0)) ?? 0;
  // A third of the readings
  const third = Math.floor(levels.length / 3);
  // Each third's average, when the take is long enough to split
  const thirds: [number, number, number] | null = third >= 10 ? [round(speechMean(levels.slice(0, third)), 3), round(speechMean(levels.slice(third, 2 * third)), 3), round(speechMean(levels.slice(2 * third)), 3)] : null;
  // The summary
  return { mean: round(mean(voiced)!, 3), cv: round(coefficientOfVariation(voiced) ?? 0, 3), thirds, autoGain: typeof autoGain === "boolean" ? autoGain : null };
}

// Words a minute, or 0 when there is no time
function rate(words: number, seconds: number): number {
  // Per minute
  return seconds > 0 ? (words * 60) / seconds : 0;
}

// The first 30 seconds against the rest: pace and pauses a minute, for takes of a minute or more with word times
function firstPartSummary(words: ReadonlyArray<TimedWord>, pauses: ReadonlyArray<PauseSpan>, speech: { first: number; last: number } | null, durationSec: number): AnalysisRaw["firstPart"] {
  // The timed words
  const timed = words.filter((word) => word.s !== null && word.w !== "");
  // Too short, or no times
  if (durationSec < 2 * OPENING_SECONDS || timed.length < MIN_WORDS_FOR_THIRDS) return null;
  // Where the take's speech starts
  const start = speech?.first ?? timed[0]!.s!;
  // The cut
  const cut = start + OPENING_SECONDS;
  // The end of speech
  const end = speech?.last ?? timed.at(-1)!.s!;
  // Not enough after the cut
  if (end - cut < 10) return null;
  // Words before and after the cut
  const firstWords = timed.filter((word) => word.s! < cut).length;
  // (after)
  const restWords = timed.length - firstWords;
  // Pauses before and after the cut
  const firstPauses = pauses.filter((pause) => pause.start < cut).length;
  // (after)
  const restPauses = pauses.length - firstPauses;
  // The two halves
  return { firstWpm: round(rate(firstWords, OPENING_SECONDS), 1), restWpm: round(rate(restWords, end - cut), 1), firstPausesPerMin: round(rate(firstPauses, OPENING_SECONDS), 2), restPausesPerMin: round(rate(restPauses, end - cut), 2) };
}

// Take the raw features from a session (the loudness and pitch readings themselves stay on the session)
export function extractRaw(session: FullSession): AnalysisRaw & { timedWords: TimedWord[] } {
  // The words, with their times when saved
  const words = timedWords(session.transcript, session.spokenTimes);
  // The loudness readings, when recorded
  const levels = session.loudness && session.loudness.length > 0 ? session.loudness : null;
  // Pauses and the span of speech from the loudness, or from word-time gaps, or none
  const found = levels ? loudnessPauses(levels, words) : { pauses: session.spokenTimes && session.spokenTimes.length > 1 ? wordGapPauses(words) : [], speech: null };
  // Where the pauses came from
  const pauseSource: AnalysisRaw["pauseSource"] = levels ? "loudness" : session.spokenTimes && session.spokenTimes.length > 1 ? "word-gaps" : "none";
  // The span of speech: from the loudness, or from the first and last word times
  const speech = found.speech ?? (words.length > 0 && words[0]!.s !== null && words.at(-1)!.s !== null ? { first: words[0]!.s!, last: words.at(-1)!.s! } : null);
  // Fading phrase ends, from the loudness
  const fading = levels ? (({ faded, stretches }) => ({ faded, stretches }))(fadingEnds(levels, LOUDNESS_TICK_MS)) : null;
  // The conversation measures, on a conversation
  const conversation = session.conversation ? measureConversation(session.conversation.turns) : undefined;
  // Everything kept
  return {
    // The kind of session and its length
    mode: session.mode, durationSec: session.durationSec,
    // The saved pause-word rate
    fillersPerMinute: session.fillersPerMinute,
    // The words and pauses
    timedWords: words, pauses: found.pauses, pauseSource, speech,
    // Loudness and pitch summaries
    loudness: levels ? loudnessSummary(levels, session.autoGain) : null, pitch: pitchSummary(session), fading,
    // The opening against the rest
    firstPart: firstPartSummary(words, found.pauses, speech, session.durationSec),
    // Content-word counts
    contentWords: contentWordCounts(words.map((word) => word.w).filter(Boolean)),
    // A conversation's measures
    ...(conversation ? { conversation: { share: conversation.share, questions: conversation.questions, followUps: conversation.followUps, turns: conversation.turns, timing: conversationTiming(session.conversation!.turns) } } : {}),
    // A told story's checks (decision 92)
    ...(session.mode === "story" ? { story: storyChecksRaw(session) } : {}),
  };
}

// A told story's checks for the analysis, with a guided story's comparison against its facts added (decision 93)
function storyChecksRaw(session: FullSession): NonNullable<AnalysisRaw["story"]> {
  // The guided story it told, if it was one
  const guided = findGuidedStory(session.promptId);
  // The checks, plus the comparison when guided
  return { ...storyRaw(session.transcript), ...(guided ? { guided: guidedRaw(session.transcript, factsOf(guided)) } : {}) };
}

// Pace in each third of the span of speech, from the word times, or null when too short
function thirdsRates(words: ReadonlyArray<TimedWord>): [number, number, number] | null {
  // The times heard
  const times = words.filter((word) => word.s !== null && word.w !== "").map((word) => word.s!);
  // The span
  const [first, last] = [times[0] ?? 0, times.at(-1) ?? 0];
  // Too short to judge
  if (times.length < MIN_WORDS_FOR_THIRDS || last - first < MIN_SECONDS_FOR_THIRDS) return null;
  // A third of the span
  const third = (last - first) / 3;
  // Words in each third, per minute
  return [0, 1, 2].map((part) => rate(times.filter((time) => time >= first + part * third && (part === 2 ? time <= last : time < first + (part + 1) * third)).length, third)) as [number, number, number];
}

// Work out every phone measure from the raw features alone (with their words, which are rebuilt while a take keeps its readings; decision 98)
export function deviceMetrics(raw: AnalysisRaw & { timedWords: TimedWord[] }): Record<string, MetricValue> {
  // The measures, with their units
  const metrics: Record<string, MetricValue> = {};
  // Store one measure (rounded to two decimals), with its source and engine
  const put = (id: string, value: number | null, unit: string, engine = DEVICE, source: MetricSource = "device") => {
    // Kept with where it came from
    metrics[id] = { value: value === null || !Number.isFinite(value) ? null : round(value, 2), unit, source, engine };
  };
  // The cleaned words
  const words = raw.timedWords.map((word) => word.w).filter(Boolean);
  // Positions in the cleaned words of the timed words (pieces without letters are skipped)
  const positions: number[] = [];
  // Count the cleaned words seen so far
  let seen = 0;
  // Each timed word's position, or the next word's position for a piece without letters
  for (const word of raw.timedWords) {
    // Its place among the cleaned words
    positions.push(seen);
    // Count it when it has letters
    if (word.w) seen += 1;
  }
  // Pauses with their next word moved onto the cleaned words
  const pauses = raw.pauses.map((pause) => ({ ...pause, nextWord: pause.nextWord === null ? null : (positions[pause.nextWord] ?? null) }));
  // Words followed by a pause (for tag questions)
  const breaks = new Set(pauses.filter((pause) => pause.nextWord !== null && pause.nextWord > 0).map((pause) => pause.nextWord! - 1));
  // The pause engine, named after where the pauses came from
  const pauseEngine = `device-${raw.pauseSource}-v${DEVICE_ENGINE_VERSION}`;
  // Whether any pause timing is known
  const timed = raw.pauseSource !== "none" && raw.speech !== null;

  // Language: the speaking rate and pause words
  put("lang.wpm", raw.durationSec > 0 ? rate(words.length, raw.durationSec) : null, "words/min");
  // (pause words, as saved on the session)
  put("lang.fillers_per_min", raw.fillersPerMinute, "/min", "device-browser-transcript-v1");
  // Every word-list measure
  for (const [id, value] of Object.entries(languageMeasures(words, breaks))) put(id, value, findMetric(id)?.unit ?? "", "device-wordlist-v1");

  // Fluency: the span of speech and the time spent speaking
  const span = raw.speech ? raw.speech.last - raw.speech.first : 0;
  // Time in pauses
  const pausedSeconds = pauses.reduce((sum, pause) => sum + (pause.end - pause.start), 0);
  // Time speaking
  const speaking = span - pausedSeconds;
  // Pace without pauses
  put("flu.articulation_rate_wpm", timed && speaking > 0 ? rate(words.length, speaking) : null, "words/min", pauseEngine);
  // Share of the span spent speaking
  put("flu.phonation_ratio", timed && span > 0 ? (speaking / span) * 100 : null, "%", pauseEngine);
  // Words per run between pauses
  put("flu.mlr_words", timed && words.length > 0 ? words.length / (pauses.length + 1) : null, "words", pauseEngine);
  // Pauses a minute
  put("flu.pause_rate", timed && span > 0 ? rate(pauses.length, span) : null, "/min", pauseEngine);
  // Pause lengths
  const lengths = pauses.map((pause) => pause.end - pause.start);
  // Average, typical and long pause
  put("flu.pause_mean_s", timed ? mean(lengths) : null, "s", pauseEngine);
  // (typical)
  put("flu.pause_median_s", timed ? median(lengths) : null, "s", pauseEngine);
  // (long)
  put("flu.pause_p90_s", timed ? quantile(lengths, 0.9) : null, "s", pauseEngine);
  // Share of long pauses
  put("flu.long_pause_share", timed && lengths.length > 0 ? (lengths.filter((length) => length >= LONG_PAUSE_SECONDS).length / lengths.length) * 100 : null, "%", pauseEngine);
  // Where pauses fall (heuristic)
  const placed = placePauses(pauses, words);
  // How many could be placed
  const placedCount = placed.boundary + placed.midClause;
  // Mid-clause share
  put("flu.midclause_pause_share", placedCount > 0 ? (placed.midClause / placedCount) * 100 : null, "%", PLACEMENT_ENGINE);
  // Boundary share
  put("flu.boundary_pause_share", placedCount > 0 ? (placed.boundary / placedCount) * 100 : null, "%", PLACEMENT_ENGINE);
  // Words between boundary pauses
  put("lang.mean_clause_words", placedCount > 0 && words.length > 0 ? words.length / (placed.boundary + 1) : null, "words", PLACEMENT_ENGINE);
  // Pace in thirds
  const thirds = thirdsRates(raw.timedWords);
  // How much it varied
  put("flu.rate_cv_thirds", thirds ? coefficientOfVariation(thirds) : null, "ratio");
  // The end against the start
  put("flu.pace_end_vs_start", thirds && thirds[0] > 0 ? thirds[2] / thirds[0] : null, "ratio");
  // Repeats and restarts a minute
  put("flu.repairs_per_min", raw.durationSec > 0 && words.length > 0 ? rate(countRepairs(words), raw.durationSec) : null, "/min", "device-wordlist-v1");
  // Silence before the first word
  put("flu.opening_latency_s", raw.speech ? raw.speech.first : null, "s", pauseEngine);
  // Opening pace against the rest
  put("flu.first30_wpm_vs_rest", raw.firstPart && raw.firstPart.restWpm > 0 ? raw.firstPart.firstWpm / raw.firstPart.restWpm : null, "ratio");

  // Voice: pitch
  put("pro.f0_range_st", raw.pitch?.rangeSt ?? null, "semitones");
  // (spread)
  put("pro.f0_sd_st", raw.pitch?.sdSt ?? null, "semitones");
  // (usual pitch)
  put("pro.f0_median_hz", raw.pitch?.medianHz ?? null, "Hz");
  // Endings
  const ends = raw.pitch ? raw.pitch.ends.fall + raw.pitch.ends.level + raw.pitch.ends.rise : 0;
  // Rising share
  put("pro.ends_rise_share", raw.pitch && ends > 0 ? (raw.pitch.ends.rise / ends) * 100 : null, "%");
  // Fading share
  put("pro.fade_share", raw.fading && raw.fading.stretches > 0 ? (raw.fading.faded / raw.fading.stretches) * 100 : null, "%");
  // Loudness: only real when the browser did not level it
  const unlevelled = raw.loudness !== null && raw.loudness.autoGain !== true;
  // Volume variety
  put("pro.loudness_cv", unlevelled ? raw.loudness!.cv : null, "ratio");
  // The last third against the first, in decibels
  put("pro.energy_drop_db", unlevelled && raw.loudness!.thirds && raw.loudness!.thirds[0] > 0 && raw.loudness!.thirds[2] > 0 ? 20 * Math.log10(raw.loudness!.thirds[2] / raw.loudness!.thirds[0]) : null, "dB");

  // Conversation
  if (raw.conversation) {
    // Talk share as a percentage
    put("conv.talk_share", raw.conversation.share === null ? null : raw.conversation.share * 100, "%");
    // Questions
    put("conv.questions", raw.conversation.questions, "count");
    // Follow-ups
    put("conv.followups", raw.conversation.followUps, "count");
    // Turns
    put("conv.turns", raw.conversation.turns, "count");
    // The timing measures, from the turns' saved times (decision 120; missing on analyses from before)
    const timing = raw.conversation.timing;
    // Only when worked out
    if (timing) {
      // The reply gap
      put("conv.reply_gap_median_s", timing.replyGapMedian, "s", TIMING_ENGINE);
      // Who cut whom short
      put("conv.interruptions_by_you", timing.interruptionsByYou, "count", TIMING_ENGINE);
      // (them)
      put("conv.interruptions_received", timing.interruptionsReceived, "count", TIMING_ENGINE);
      // Talking at once
      put("conv.overlap_s", timing.overlapSeconds, "s", TIMING_ENGINE);
      // Listening sounds, from the words alone
      put("conv.backchannels", timing.backchannels, "count", "device-wordlist-v1");
    }
  }
  // A told story's checks, as yes-or-no and counts (decision 92)
  if (raw.story) {
    // The story checks' own engine
    const storyEngine = "device-story-v1";
    // Yes as 1, no as 0
    const yes = (value: boolean) => (value ? 1 : 0);
    // Started in the action (unknown with no words)
    put("story.starts_in_action", raw.story.startsInAction === null ? null : yes(raw.story.startsInAction), "yes/no", storyEngine);
    // Someone's words
    put("story.dialogue", yes(raw.story.dialogue), "yes/no", storyEngine);
    // Specific details
    put("story.details", raw.story.details, "count", storyEngine);
    // A turn
    put("story.turn", yes(raw.story.turn), "yes/no", storyEngine);
    // "And then"
    put("story.and_then", raw.story.andThen, "count", storyEngine);
    // A feeling
    put("story.feeling", yes(raw.story.feeling), "yes/no", storyEngine);
    // Ended on the point
    put("story.ends_on_point", yes(raw.story.endsOnPoint), "yes/no", storyEngine);
    // A guided story: what was added beyond the facts, and the share of facts kept, by their own engine (decision 93)
    if (raw.story.guided) {
      // The comparison's engine
      const guidedEngine = "device-guided-v1";
      // Added beyond the facts
      put("story.added", raw.story.guided.added, "count", guidedEngine);
      // Facts kept, as a percentage
      put("story.facts_kept", raw.story.guided.facts > 0 ? (raw.story.guided.factsHeard / raw.story.guided.facts) * 100 : null, "%", guidedEngine);
    }
  }
  // Every measure
  return metrics;
}
