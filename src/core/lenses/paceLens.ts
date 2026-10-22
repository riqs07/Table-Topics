// The pace lens (decision 115): how fast each stretch of the take was said, against the speaker's usual pace. Each phrase is marked slow, usual or fast (the page spaces slow words out a little and draws fast ones a little closer), and a speed line runs through the take against a shaded usual band. Speed is words a minute over a six-second window, pauses included, the same measure as the take's overall pace, so the band can be the speaker's usual overall pace (their earlier takes of the same kind). Pure

// Load the phrase splitter
import { splitPhrases } from "@/core/pitchPhrases";
// Load the middle and spread helpers
import { median, robustSpread } from "@/core/analysis/stats";
// Load the family rule, so a take is only compared with its own kind (decision 90)
import { familyOf } from "@/core/analysis/profile";
// Load the words' type
import type { LensText } from "@/core/lenses/lensWords";
// Load the record type
import type { SessionRecord } from "@/data/records";

// The window speed is counted over, in seconds
const WINDOW_SECONDS = 6;
// Seconds between points on the speed line
const LINE_STEP = 1;
// Fewest earlier takes of the same kind before their pace is the band
const MIN_USUAL_TAKES = 5;
// The narrowest half-band, in words a minute
const MIN_HALF_BAND = 10;
// Without enough earlier takes, the band is this share either side of this take's own middle pace
const OWN_SHARE = 0.15;
// Fewest timed words before pace is shown
const MIN_WORDS = 8;

// How fast a stretch was, against the band
export type PaceMark = "slow" | "usual" | "fast";

// The usual band: words a minute, low to high, and whether it is the speaker's own usual or this take's middle
export interface PaceBand {
  // Bottom of the band
  low: number;
  // Top of the band
  high: number;
  // From earlier takes of the same kind (true), or this take's own middle pace (false)
  usual: boolean;
}

// The lens's findings
export interface PaceLens {
  // Each phrase's word places (from, to inclusive) and its pace
  phrases: Array<{ from: number; to: number; pace: PaceMark; wpm: number }>;
  // The speed line: a point every second, its moment and its words a minute
  line: Array<{ t: number; wpm: number }>;
  // The band
  band: PaceBand;
  // One plain line on where the pace left the band
  summary: string;
}

// The usual overall pace of earlier takes of the same kind (median and spread), or null with too few
export function usualPace(sessions: ReadonlyArray<SessionRecord>, take: Pick<SessionRecord, "id" | "mode" | "createdAt">): { usual: number; spread: number } | null {
  // The family of practice
  const family = familyOf(take.mode);
  // Earlier takes of the same family with a pace
  const values = sessions.filter((session) => session.id !== take.id && session.createdAt < take.createdAt && familyOf(session.mode) === family && family !== null && session.wordsPerMinute > 0).map((session) => session.wordsPerMinute);
  // Too few
  if (values.length < MIN_USUAL_TAKES) return null;
  // Their middle and spread
  return { usual: median(values)!, spread: robustSpread(values) ?? 0 };
}

// Words a minute in the window around a moment, the window kept inside the speech
function wpmAround(starts: ReadonlyArray<number>, at: number, first: number, last: number): number {
  // The window, held inside the speech
  const from = Math.max(first, Math.min(at - WINDOW_SECONDS / 2, last - WINDOW_SECONDS));
  // Its end
  const to = Math.min(last, from + WINDOW_SECONDS);
  // Its length (at least a second)
  const span = Math.max(1, to - from);
  // Words starting inside it, a minute
  return (starts.filter((start) => start >= from && start < to).length * 60) / span;
}

// Which side of the band a pace sits
function markFor(wpm: number, band: PaceBand): PaceMark {
  // Below
  if (wpm < band.low) return "slow";
  // Above
  if (wpm > band.high) return "fast";
  // Inside
  return "usual";
}

// Which part of the take a moment is in, in words
function partName(share: number): string {
  // The first third
  if (share < 1 / 3) return "near the start";
  // The last third
  if (share > 2 / 3) return "near the end";
  // The middle
  return "in the middle";
}

// The lens for a take, given the speaker's usual pace (or null to use this take's own middle)
export function paceLens(text: LensText, usual: { usual: number; spread: number } | null): PaceLens | null {
  // Only timed words
  if (!text.timed || text.words.length < MIN_WORDS) return null;
  // Each word's start
  const starts = text.words.map((word) => word.start ?? 0);
  // The speech's first and last moments
  const [first, last] = [starts[0]!, text.words.at(-1)!.end ?? starts.at(-1)!];
  // Too short to judge
  if (last - first < 2) return null;
  // The speed line
  const line: Array<{ t: number; wpm: number }> = [];
  // A point every second
  for (let t = first; t <= last + 1e-9; t += LINE_STEP) line.push({ t: Math.round(t * 10) / 10, wpm: Math.round(wpmAround(starts, t, first, last)) });
  // The band: the usual, or this take's own middle
  const own = median(line.map((point) => point.wpm)) ?? 0;
  // Its half-width
  const half = usual ? Math.max(MIN_HALF_BAND, usual.spread) : Math.max(MIN_HALF_BAND, own * OWN_SHARE);
  // The band
  const band: PaceBand = { low: Math.round((usual?.usual ?? own) - half), high: Math.round((usual?.usual ?? own) + half), usual: usual !== null };
  // Each phrase, by the pace at its middle
  const groups = splitPhrases(text.words.map((word, ref) => ({ text: word.text, w: word.w, start: word.start ?? 0, end: word.end ?? 0, ref })), text.punctuated);
  // Marked
  const phrases = groups.map((group) => {
    // Its middle moment
    const middle = (group[0]!.start + group.at(-1)!.end) / 2;
    // The pace there
    const wpm = Math.round(wpmAround(starts, middle, first, last));
    // Its words' places and its pace
    return { from: group[0]!.ref, to: group.at(-1)!.ref, pace: markFor(wpm, band), wpm };
  });
  // Where the line went above or below the band
  const outside = line.map((point, index) => ({ index, side: markFor(point.wpm, band) })).filter((point) => point.side !== "usual");
  // The share of points above and below
  const [fast, slow] = [outside.filter((point) => point.side === "fast"), outside.filter((point) => point.side === "slow")];
  // The band's name
  const named = band.usual ? "your usual pace" : "this take’s middle pace";
  // Mostly inside
  if (outside.length <= line.length * 0.2) return { phrases, line, band, summary: `You stayed close to ${named} throughout.` };
  // Where it was fastest
  const side = fast.length >= slow.length ? fast : slow;
  // The middle of those points, as a share of the take
  const at = side[Math.floor(side.length / 2)]!.index / Math.max(1, line.length - 1);
  // The line
  return { phrases, line, band, summary: fast.length >= slow.length ? `You sped up ${partName(at)}, above ${named}.` : `You slowed down ${partName(at)}, below ${named}.` };
}
