// A short speech the user plans themselves: a topic, a few points and a length; and which points the transcript covered (decision 73)

// The plan for a short speech
export interface Outline {
  // What it is about
  topic: string;
  // The points to make, in order (one to four)
  points: string[];
  // How long to speak, in minutes
  goalMinutes: number;
}

// The most points a short speech holds
export const MAX_POINTS = 4;
// The longest topic or point, in characters
export const MAX_TEXT = 140;
// The lengths to choose from, in minutes
export const OUTLINE_LENGTHS = [1, 2, 3, 5] as const;

// Tidy a plan: trimmed text, empty points dropped, at most four, a known length (null when there is no topic or no point)
export function cleanOutline(topic: string, points: ReadonlyArray<string>, goalMinutes: number): Outline | null {
  // The topic, trimmed and capped
  const cleanTopic = topic.trim().slice(0, MAX_TEXT);
  // The points, trimmed, capped and without empty ones
  const cleanPoints = points.map((point) => point.trim().slice(0, MAX_TEXT)).filter((point) => point !== "").slice(0, MAX_POINTS);
  // Nothing to speak about yet
  if (cleanTopic === "" || cleanPoints.length === 0) return null;
  // A length from the list, or two minutes
  const goal = (OUTLINE_LENGTHS as ReadonlyArray<number>).includes(goalMinutes) ? goalMinutes : 2;
  // The plan
  return { topic: cleanTopic, points: cleanPoints, goalMinutes: goal };
}

// The plan as an address query, so the recording page can read it back
export function outlineQuery(outline: Outline): string {
  // Topic, each point, and the length
  const params = new URLSearchParams([["topic", outline.topic], ...outline.points.map((point) => ["point", point]), ["goal", String(outline.goalMinutes)]]);
  // As text
  return params.toString();
}

// Read a plan back from an address query (null when it has no topic or no point)
export function outlineFromQuery(params: { get: (name: string) => string | null; getAll: (name: string) => string[] }): Outline | null {
  // Tidied the same way as when it was written
  return cleanOutline(params.get("topic") ?? "", params.getAll("point"), Number(params.get("goal") ?? "2"));
}

// Short words that say nothing about a point
const STOP_WORDS = new Set(["about", "after", "again", "also", "because", "been", "before", "being", "could", "does", "doing", "from", "have", "having", "here", "into", "just", "like", "make", "more", "most", "much", "only", "other", "really", "should", "some", "such", "than", "that", "their", "them", "then", "there", "these", "they", "thing", "things", "this", "those", "very", "want", "what", "when", "where", "which", "while", "will", "with", "would", "your"]);

// The words that carry a piece of text, cut to their first five letters so "practising" and "practise" match
function keyWords(text: string): string[] {
  // Lower case words of four letters or more, not stop words, shortened
  return (text.toLowerCase().match(/[a-z']+/g) ?? []).filter((word) => word.length >= 4 && !STOP_WORDS.has(word)).map((word) => word.slice(0, 5));
}

// Which points the speech covered: a point counts when at least half of its key words (and at least one) were said
export function pointsCovered(points: ReadonlyArray<string>, transcript: string): boolean[] {
  // Everything said, as key words
  const said = new Set(keyWords(transcript));
  // Each point
  return points.map((point) => {
    // Its key words, each once
    const words = [...new Set(keyWords(point))];
    // A point with no key words cannot be checked, so it counts as covered when anything was said
    if (words.length === 0) return said.size > 0;
    // At least half of them said
    return words.filter((word) => said.has(word)).length * 2 >= words.length;
  });
}
