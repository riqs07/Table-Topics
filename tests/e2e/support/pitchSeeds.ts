// Seeded takes with realistic pitch for the browser checks of pitch in your words (decision 111), labelled as seeded: the stand-in microphone's tone is flat, so these are made up (tests/support/pitchTake.ts) and written straight into the database
import { buildAnalysis } from "@/core/analysis/analysis";
// Load the made-up takes
import { madeSession, makeTake, ZOO_AGAIN_PHRASES, ZOO_PHRASES, type MadeTake } from "../../support/pitchTake";
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

// The zoo story, told once (exact) and told again as a second try (exact, "me" now falling), plus an older take whose readings were dropped
export function zooSeed(): Seed {
  // The two tellings
  const [first, again] = [makeTake(ZOO_PHRASES), makeTake(ZOO_AGAIN_PHRASES)];
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
