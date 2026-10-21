// Reading a rubric that came from outside the app's own code (the feedback route's reply, or an imported file), checked field by field (decision 90)

// Load the record type
import type { RubricRecord, RubricScore, StoryRubric } from "@/data/records";

// Check that a value is a plain object
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

// A score of 0 to 3 with a quote, or null when the shape is wrong
function readScore(value: unknown): RubricScore | null {
  // Must be an object with a whole score in range and a quote
  if (!isObject(value) || typeof value.score !== "number" || !Number.isInteger(value.score) || value.score < 0 || value.score > 3 || typeof value.quote !== "string") return null;
  // The score
  return { score: value.score, quote: value.quote };
}

// A told story's scores, each checked, or null when any is wrong (decision 92)
function readStoryRubric(value: unknown): StoryRubric | null {
  // Must be an object
  if (!isObject(value)) return null;
  // The six scores
  const [hook, stakes, detail, dialogue, turn, point] = [readScore(value.hook), readScore(value.stakes), readScore(value.detail), readScore(value.dialogue), readScore(value.turn), readScore(value.point)];
  // A guided story's score for bringing the facts to life, when there is one (decision 93)
  const alive = value.alive === undefined ? undefined : readScore(value.alive);
  // Every one must read, the guided score too when it is there
  return hook && stakes && detail && dialogue && turn && point && alive !== null ? { hook, stakes, detail, dialogue, turn, point, ...(alive ? { alive } : {}) } : null;
}

// A rubric with every field checked, stamped with when it was saved when it carries none, or null when anything is wrong
export function readRubric(value: unknown, at: string): RubricRecord | null {
  // Must be an object
  if (!isObject(value)) return null;
  // The six scores
  const [pointFirst, structure, ending, concreteExample, wordChoice] = [readScore(value.pointFirst), readScore(value.structure), readScore(value.ending), readScore(value.concreteExample), readScore(value.wordChoice)];
  // Answers the question: a score, or null when nothing was asked
  const answersQuestion = value.answersQuestion === null ? null : readScore(value.answersQuestion);
  // Any broken score
  if (!pointFirst || !structure || !ending || !concreteExample || !wordChoice || (value.answersQuestion !== null && !answersQuestion)) return null;
  // The tags and the swaps
  const devices = Array.isArray(value.devices) && value.devices.every((device) => typeof device === "string") ? (value.devices as string[]) : null;
  // The swaps, each with three pieces of text
  const wordSwaps = Array.isArray(value.wordSwaps) && value.wordSwaps.every((swap) => isObject(swap) && typeof swap.said === "string" && typeof swap.stronger === "string" && typeof swap.why === "string") ? (value.wordSwaps as RubricRecord["wordSwaps"]) : null;
  // Any broken list, count or name
  if (!devices || !wordSwaps || typeof value.unnecessaryHedges !== "number" || !Number.isFinite(value.unnecessaryHedges) || typeof value.model !== "string") return null;
  // A told story's scores, when present, must read cleanly too
  const story = value.story === undefined ? undefined : readStoryRubric(value.story);
  // (a broken one spoils the rubric)
  if (story === null) return null;
  // The rubric
  return { ...(story ? { story } : {}), pointFirst, answersQuestion, structure, ending, concreteExample, wordChoice, devices, unnecessaryHedges: value.unnecessaryHedges, wordSwaps, model: value.model, at: typeof value.at === "string" ? value.at : at };
}
