// Planned stress (decision 111): where a text marks the word to lean on (a *starred* word in a lesson, a passage's stress marks, a stress drill's take), each clause with a target is checked: did the highest point of the voice land on it? Pure, so the targets and the verdicts are tested on made-up takes

// Load the script splitter
import { readingTokens } from "@/core/liveReading";
// Load the phrase types and the word helpers
import { bare, type PhraseWord, type PitchWords } from "@/core/pitchPhrases";

// A target counts as lifted when it is within this many steps of the clause's highest word
const NEAR_TOP = 0.5;

// One clause with at least one key word: its words by number in the script, and which are targets
export interface StressRow {
  // The first word's number
  from: number;
  // The last word's number
  to: number;
  // The key words' numbers
  targets: number[];
  // Each word's text as shown, by number (from..to)
  texts: string[];
}

// The clauses of a marked text (split at commas, semicolons, colons, dashes and full stops) that have a key word in them, so each row stays short
export function stressRows(body: string): StressRow[] {
  // The rows found
  const rows: StressRow[] = [];
  // The clause being collected
  let current: { from: number; targets: number[]; texts: string[] } | null = null;
  // Each numbered word
  for (const token of readingTokens(body)) {
    // Only words count
    if (token.kind !== "text" || token.word === null) continue;
    // A new clause starts with this word
    current ??= { from: token.word, targets: [], texts: [] };
    // Its text
    current.texts.push(token.text);
    // A key word
    if (token.style === "stress") current.targets.push(token.word);
    // A clause ends after it
    if (/[.,;:?!…—]["'”’)\]]*$/.test(token.text)) {
      // Kept when it has a key word
      if (current.targets.length > 0) rows.push({ from: current.from, to: token.word, targets: current.targets, texts: current.texts });
      // Start afresh
      current = null;
    }
  }
  // A last clause without a mark
  if (current && current.targets.length > 0) rows.push({ from: current.from, to: current.from + current.texts.length - 1, targets: current.targets, texts: current.texts });
  // Hand them back
  return rows;
}

// How one clause's stress went
export interface StressResult {
  // The clause
  row: StressRow;
  // Its words that were heard, with their pitch, in order
  words: PhraseWord[];
  // The word the voice was highest on, or null when too little was heard
  highest: PhraseWord | null;
  // Whether the lift landed on a key word, or null when it cannot be judged
  hit: boolean | null;
  // One plain line
  line: { tone: "good" | "work" | "plain"; text: string };
}

// Words quoted and joined: “a”, “a” and “b”
function quoted(words: ReadonlyArray<string>): string {
  // Each in quotes, the last joined with "and"
  return words.map((word) => `“${word}”`).join(", ").replace(/, (“[^”]*”)$/, " and $1");
}

// Judge each clause: the highest word against the key words
export function judgeStress(rows: ReadonlyArray<StressRow>, pitch: PitchWords): StressResult[] {
  // Every heard word by its number in the script
  const byRef = new Map(pitch.phrases.flatMap((phrase) => phrase.words.map((word) => [word.ref, word] as const)));
  // Each clause
  return rows.map((row) => {
    // Its heard words, in order
    const words = Array.from({ length: row.to - row.from + 1 }, (_, place) => byRef.get(row.from + place)).filter((word): word is PhraseWord => word !== undefined);
    // The key words as said
    const targets = row.targets.map((ref) => bare(row.texts[ref - row.from] ?? ""));
    // With a pitch
    const measured = words.filter((word) => word.step !== null);
    // The key words that were heard with a pitch
    const heardTargets = measured.filter((word) => row.targets.includes(word.ref));
    // Too little to judge
    if (measured.length < 2 || heardTargets.length === 0) return { row, words, highest: null, hit: null, line: { tone: "plain", text: `${quoted(targets)} ${targets.length === 1 ? "wasn’t" : "weren’t"} heard clearly, so the lift can’t be checked.` } };
    // The highest word
    const highest = [...measured].sort((a, b) => b.step! - a.step!)[0]!;
    // Whether a key word got the lift
    const hit = heardTargets.some((word) => word.step! >= highest.step! - NEAR_TOP);
    // The line
    const line = hit ? { tone: "good" as const, text: `Your lift landed on ${quoted(targets)}, as planned.` } : { tone: "work" as const, text: `Your lift went to “${bare(highest.text)}”. Lean on ${quoted(targets)}, and let “${bare(highest.text)}” stay low.` };
    // The result
    return { row, words, highest, hit, line };
  });
}

// One line over several clauses, or null for one
export function stressCount(results: ReadonlyArray<StressResult>): string | null {
  // The clauses that could be judged
  const judged = results.filter((result) => result.hit !== null);
  // Only for several
  if (results.length < 2 || judged.length === 0) return null;
  // How many landed
  return `${judged.filter((result) => result.hit).length} of ${judged.length} key words got your lift.`;
}
