// Seeded takes with realistic pitch for the browser checks of pitch in your words (decision 111), labelled as seeded: the stand-in microphone's tone is flat, so these are made up (tests/support/pitchTake.ts) and written straight into the database
import { buildAnalysis } from "@/core/analysis/analysis";
// Load the made-up takes
import { madeSession, makeTake, ZOO_AGAIN_PHRASES, ZOO_PHRASES, type MadeTake, type SaidPhrase } from "../../support/pitchTake";
// Load the tiny fingerprint maker (decision 115)
import { sessionMiniFingerprint } from "@/core/fingerprint";
// Load the seed type
import type { Seed } from "./seed";
// Load the record types
import type { AnalysisRecord, FullSession } from "@/data/records";

// Today, at noon, as ISO text a number of days back
function daysAgo(days: number): string {
  // Noon today
  const day = new Date();
  // Moved back
  day.setDate(day.getDate() - days);
  // At noon
  day.setHours(12, 0, 0, 0);
  // As text
  return day.toISOString();
}

// An analysis with the service's words, so the times are exact
function exactAnalysis(session: FullSession, take: MadeTake): AnalysisRecord {
  // The usual analysis with a server part
  return { ...buildAnalysis(session, new Date(session.createdAt)), server: { transcript: { engine: "seeded", text: take.transcript, words: take.serverWords, at: session.createdAt }, voice: null } };
}

// The zoo story, gliding between words like a voice (decision 114), told once (exact) and told again as a second try (exact, "me" now falling), plus an older take whose readings were dropped
export function zooSeed(): Seed {
  // The two tellings
  const [first, again] = [makeTake(ZOO_PHRASES, { glide: true }), makeTake(ZOO_AGAIN_PHRASES, { glide: true })];
  // The first: a Rapid Fire take with its recording
  const zoo = madeSession("seeded-zoo", first, { createdAt: daysAgo(2), mode: "talk", promptId: "t001", audioKey: "seeded-zoo-audio", feedback: { keep: "You ended on the gorilla.", change: "Let “me” drop at the end.", retryCue: "Land the ending low." } });
  // The second try
  const retry = madeSession("seeded-again", again, { createdAt: daysAgo(1), mode: "talk", promptId: "t001", retryOf: "seeded-zoo", audioKey: "seeded-again-audio", feedback: { keep: "The ending landed.", change: "Keep the peak on “stole”.", retryCue: "Same again." } });
  // An older take: readings dropped by the retention rule
  const old = madeSession("seeded-old", first, { createdAt: daysAgo(60), mode: "talk", promptId: "t002", trimmedAt: daysAgo(30), pitch: undefined, loudness: undefined, spokenTimes: undefined, feedback: { keep: "Clear opening.", change: "Slow down.", retryCue: "Breathe." } });
  // The seed
  return { sessions: [zoo, retry, old], analyses: [exactAnalysis(zoo, first), exactAnalysis(retry, again)], audio: [{ key: "seeded-zoo-audio", seconds: first.durationSec }, { key: "seeded-again-audio", seconds: again.durationSec }] };
}

// The "Stress the key word" lesson read with the phone's own word times: the first two sentences, the lift on "she" as planned, then on "said" instead of "took"
export function lessonSeed(): Seed {
  // One sentence with the lift on a word
  const sentence = (lift: string) => "I never said she took the money.".split(" ").map((text) => ({ text, step: text === lift ? 5 : 0, ...(text === "money." ? { to: -3 } : {}) }));
  // The take
  const take = makeTake([{ words: sentence("she"), pauseAfter: 0.6 }, { words: sentence("said"), pauseAfter: 0.6 }]);
  // Saved as the lesson, each script word read when heard
  return { sessions: [madeSession("seeded-lesson", take, { createdAt: daysAgo(0), mode: "lesson", promptId: "l006", scriptTimes: take.spokenTimes, feedback: { keep: "Clear.", change: "Lean on the key word.", retryCue: "Higher on the key word." } })] };
}

// The words of a phrase with a beat before "stole": "and a seagull… stole it right out of my hand."
const BEAT_PHRASES: ReadonlyArray<SaidPhrase> = [{ words: [{ text: "and", step: 0 }, { text: "a", step: 0 }, { text: "seagull", step: 0.5 }], pauseAfter: 0.7 }, { words: [{ text: "stole", step: 7, level: 0.35 }, { text: "it", step: 1 }, { text: "right", step: 0.5 }, { text: "out", step: 0.4 }, { text: "of", step: 0.2 }, { text: "my", step: 0 }, { text: "hand.", step: -1, to: -4 }], pauseAfter: 1 }];
// The zoo story with an "um" before the gorilla, gliding like a voice
const ZOO_WITH_UM: ReadonlyArray<SaidPhrase> = ZOO_PHRASES.map((phrase, index) => (index === 3 ? { ...phrase, words: [phrase.words[0]!, { text: "um", step: -0.5, level: 0.12 }, ...phrase.words.slice(1)] } : phrase));

// The takes for focus first (decision 115), labelled as seeded: a 40-second Rapid Fire answer with an "um", a three-minute prepared speech with deeper analysis, a pause drill, and an older take saved before tiny fingerprints (made at idle)
export function lensSeed(): Seed {
  // About 40 seconds: the zoo story twice, with an "um"
  const short = makeTake([...ZOO_WITH_UM, ...ZOO_PHRASES], { glide: true });
  // About three minutes: the story and the beat, eight times
  const long = makeTake(Array.from({ length: 8 }, () => [...ZOO_PHRASES, ...BEAT_PHRASES]).flat(), { glide: true });
  // A pause drill read with the phone's word times
  const drill = makeTake(ZOO_PHRASES, { glide: true });
  // The Rapid Fire answer, with its tiny fingerprint
  const rapid = madeSession("seeded-rapid", short, { createdAt: daysAgo(0), mode: "talk", promptId: "t001", audioKey: "seeded-rapid-audio", fingerprint: sessionMiniFingerprint(short) });
  // The prepared speech, with its tiny fingerprint and the service's words
  const speech = madeSession("seeded-speech", long, { createdAt: daysAgo(1), mode: "response", promptId: "p001", audioKey: "seeded-speech-audio", fingerprint: sessionMiniFingerprint(long) });
  // The pause drill
  const pause = madeSession("seeded-pause", drill, { createdAt: daysAgo(2), mode: "pause", promptId: "d001", audioKey: "seeded-pause-audio" });
  // An older take saved before fingerprints were kept
  const older = madeSession("seeded-older", drill, { createdAt: daysAgo(3), mode: "talk", promptId: "t002" });
  // The service was unsure of "stared" and "gorilla" once each, as it is of a few words in real speech
  const unsure = { ...long, serverWords: long.serverWords.map((word, index) => ((word.w === "stared" && index < 60) || (word.w === "gorilla" && index > 200 && index < 260) ? { ...word, conf: 0.42 } : word)) };
  // The seed
  return { sessions: [rapid, speech, pause, older], analyses: [exactAnalysis(speech, unsure)], audio: [{ key: "seeded-rapid-audio", seconds: short.durationSec }, { key: "seeded-speech-audio", seconds: long.durationSec }, { key: "seeded-pause-audio", seconds: drill.durationSec }] };
}
