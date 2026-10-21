// Two weekly check-ins side by side (decision 100): for each part, a table of measures and a few plain lines on what changed. Measures are compared like with like, as the profile does: two values from the same kind of engine, or the phone's own values for both when one take had deeper analysis; otherwise the row says they were measured differently and makes no judgement

// Load the measure registry
import { findMetric, type MetricDefinition } from "@/core/analysis/metrics";
// Load the number formatter the profile uses
import { formatValue } from "@/core/analysis/profile";
// Load the check-in rules and parts
import { CHECK_IN_PARTS, CHECK_IN_PART_INFO, recordedCheckIns, type CheckIn } from "@/core/checkIn";
// Load the timing windows and the clock format
import { STORY_WINDOWS, TOPIC_WINDOW, formatClock, type SpeakingWindow } from "@/core/recordingRules";
// Load the record types
import type { AnalysisRecord, CheckInPart, MetricValue, SessionRecord } from "@/data/records";

// One measure in a part's comparison, and the words for its two directions
interface MeasureSpec {
  // The measure's id
  id: string;
  // The word when it went up, and when it went down
  up: string;
  // (down)
  down: string;
  // Shown only when either take has it (measures from deeper analysis)
  optional?: boolean;
  // A pause-word measure, left out when pause words are hidden (decision 79)
  pauseWords?: boolean;
  // Only fair without the browser's levelling (decision 81)
  levelled?: boolean;
}

// The measures every part compares: pace, pause words, pauses, pitch range, volume variety, and clarity when deeper analysis ran
const COMMON: ReadonlyArray<MeasureSpec> = [
  // Pace while speaking
  { id: "flu.articulation_rate_wpm", up: "faster", down: "slower" },
  // Pause words
  { id: "lang.fillers_per_min", up: "more", down: "fewer", pauseWords: true },
  // Pauses
  { id: "flu.pause_rate", up: "more pauses", down: "fewer pauses" },
  // Pauses in the middle of a sentence
  { id: "flu.midclause_pause_share", up: "more of them mid-sentence", down: "fewer of them mid-sentence" },
  // Pitch range
  { id: "pro.f0_range_st", up: "wider", down: "narrower" },
  // Volume variety
  { id: "pro.loudness_cv", up: "more varied", down: "steadier", levelled: true },
  // Articulation clarity, from deeper analysis
  { id: "pro.articulation_clarity", up: "clearer", down: "less clear", optional: true },
];

// The story part adds the phone's story checks (decision 92)
const STORY_CHECKS: ReadonlyArray<MeasureSpec> = [
  // A start in the action
  { id: "story.starts_in_action", up: "now there", down: "not this time" },
  // Someone's words
  { id: "story.dialogue", up: "now there", down: "not this time" },
  // Details
  { id: "story.details", up: "more", down: "fewer" },
  // A turn
  { id: "story.turn", up: "now there", down: "not this time" },
  // An ending on the point
  { id: "story.ends_on_point", up: "now there", down: "not this time" },
];

// Where a time sits against a part's window
export type TimeStatus = "short" | "inside" | "grace" | "long";

// Each timed part's window: the pitch's light runs from 1:15 (yellow) to 2:00 (red); the story is a short one; the surprise question is Rapid Fire's 1:00 to 2:00
const PART_WINDOWS: Readonly<Partial<Record<CheckInPart, SpeakingWindow>>> = {
  // The pitch: aim to finish between the yellow light and the two-minute goal
  pitch: { start: 75, yellow: 75, end: 120, limit: 135 },
  // A short story (decision 92)
  story: STORY_WINDOWS.short,
  // Rapid Fire's window
  surprise: TOPIC_WINDOW,
};

// A part's window, or null for the reading, which has none
export function partWindow(part: CheckInPart): SpeakingWindow | null {
  // The window, if the part has one
  return PART_WINDOWS[part] ?? null;
}

// Where a length sits against a part's window, or null for a part without one
export function timeStatus(part: CheckInPart, seconds: number): TimeStatus | null {
  // The window
  const window = partWindow(part);
  // None for reading
  if (!window) return null;
  // Under the start
  if (seconds < window.start) return "short";
  // Inside
  if (seconds <= window.end) return "inside";
  // In the grace after
  if (seconds <= window.limit) return "grace";
  // Over
  return "long";
}

// The window in words, such as "1:00 to 2:00"
export function windowWords(part: CheckInPart): string | null {
  // The window
  const window = partWindow(part);
  // In words, or nothing
  return window ? `${formatClock(window.start)} to ${formatClock(window.end)}` : null;
}

// How one measure compares
export interface CompareRow {
  // The measure
  metric: MetricDefinition;
  // The earlier and later values (null when not measured)
  a: number | null;
  // (later)
  b: number | null;
  // Better, worse, changed (no better side), about the same, or null when it cannot be judged
  verdict: "better" | "worse" | "changed" | "same" | null;
  // Why it cannot be judged, or how it was compared, in a few words (null when there is nothing to say)
  note: string | null;
  // The word for the change ("faster", "now there"), when it changed
  word: string | null;
}

// One part compared
export interface PartComparison {
  // The part
  part: CheckInPart;
  // The earlier take and the later one (null when skipped or not recorded)
  a: SessionRecord | null;
  // (later)
  b: SessionRecord | null;
  // The measures
  rows: CompareRow[];
  // The time against the window, for each take
  time: { a: TimeStatus | null; b: TimeStatus | null };
  // A few plain lines on what changed
  lines: string[];
}

// Two check-ins compared
export interface CheckInComparison {
  // The earlier check-in and the later one
  a: CheckIn;
  // (later)
  b: CheckIn;
  // Days between them
  days: number;
  // Each part
  parts: PartComparison[];
}

// The phone's own value of a measure in an analysis: shown, or kept aside when a server value replaced it (decision 91)
function phoneValue(analysis: AnalysisRecord | undefined, id: string): MetricValue | undefined {
  // The shown value when the phone measured it
  const shown = analysis?.metrics[id];
  // Otherwise the replaced one
  return shown?.source === "device" ? shown : analysis?.superseded?.[id];
}

// Two values of a measure taken like with like: the same source, else the phone's for both, else marked as measured differently
function likeWithLike(a: AnalysisRecord | undefined, b: AnalysisRecord | undefined, id: string): { a: MetricValue | undefined; b: MetricValue | undefined; note: string | null; comparable: boolean } {
  // The shown values
  const [shownA, shownB] = [a?.metrics[id], b?.metrics[id]];
  // Missing on either side: nothing to judge
  if (!shownA || !shownB || shownA.value === null || shownB.value === null) return { a: shownA, b: shownB, note: null, comparable: false };
  // The same kind of engine
  if (shownA.source === shownB.source) return { a: shownA, b: shownB, note: null, comparable: true };
  // The phone's own values for both
  const [phoneA, phoneB] = [phoneValue(a, id), phoneValue(b, id)];
  // Both there: compared that way
  if (phoneA && phoneB && phoneA.value !== null && phoneB.value !== null) return { a: phoneA, b: phoneB, note: "phone’s measure", comparable: true };
  // Otherwise shown, not judged
  return { a: shownA, b: shownB, note: "measured differently", comparable: false };
}

// The smallest change that counts for a measure: a twentieth of the earlier value, any change for yes/no and counts
function enough(metric: MetricDefinition, before: number): number {
  // Yes/no and counts: any change
  if (metric.unit === "yes/no" || metric.unit === "count") return 0;
  // Otherwise a twentieth, never nothing
  return Math.max(Math.abs(before) * 0.05, 1e-9);
}

// Compare one measure between two takes
function compareMeasure(spec: MeasureSpec, a: { session: SessionRecord; analysis: AnalysisRecord | undefined }, b: { session: SessionRecord; analysis: AnalysisRecord | undefined }): CompareRow | null {
  // The measure's definition (always present for the listed ids)
  const metric = findMetric(spec.id);
  // An unknown id cannot be compared
  if (!metric) return null;
  // The values, like with like
  const pair = likeWithLike(a.analysis, b.analysis, spec.id);
  // The numbers
  const [valueA, valueB] = [pair.a?.value ?? null, pair.b?.value ?? null];
  // An optional measure neither take has is left out
  if (spec.optional && valueA === null && valueB === null) return null;
  // Volume variety is only fair when the browser levelled neither take (decision 81)
  const levelled = spec.levelled && (a.session.autoGain !== false || b.session.autoGain !== false);
  // The row without a judgement
  const plain = { metric, a: valueA, b: valueB, word: null };
  // Levelled: shown, not judged
  if (levelled && valueA !== null && valueB !== null) return { ...plain, verdict: null, note: "levelled by the browser" };
  // Not comparable
  if (!pair.comparable || valueA === null || valueB === null) return { ...plain, verdict: null, note: pair.note };
  // The change
  const moved = valueB - valueA;
  // Too small to count
  if (Math.abs(moved) <= enough(metric, valueA)) return { ...plain, verdict: "same", note: pair.note };
  // Its direction
  const up = moved > 0;
  // Better, worse, or just changed
  const verdict = metric.better === "neither" ? "changed" : up === (metric.better === "higher") ? "better" : "worse";
  // The row
  return { metric, a: valueA, b: valueB, verdict, note: pair.note, word: up ? spec.up : spec.down };
}

// A value in plain words for a line: yes/no as words, the rest with its unit
function said(value: number | null, unit: string): string {
  // Nothing
  if (value === null) return "–";
  // Yes or no
  if (unit === "yes/no") return value >= 1 ? "yes" : "no";
  // A number with its unit
  return formatValue(value, unit);
}

// One plain line for a row that changed, such as "Speaking pace: 182 → 158 words/min, slower."
function rowLine(row: CompareRow): string {
  // Yes/no checks read as a sentence
  if (row.metric.unit === "yes/no") return `${row.metric.name}: ${row.word}.`;
  // The numbers and the word
  return `${row.metric.name}: ${said(row.a, row.metric.unit)} → ${said(row.b, row.metric.unit)}, ${row.word}.`;
}

// How big a change is, for choosing the lines to show: the share it moved by (yes/no counts as a whole change)
function size(row: CompareRow): number {
  // Yes/no: a whole change
  if (row.metric.unit === "yes/no") return 1;
  // The share of the earlier value (or the change itself from zero)
  return row.a === null || row.b === null ? 0 : Math.abs(row.b - row.a) / Math.max(Math.abs(row.a), 1e-9);
}

// The line about time, when where it sits changed or it moved by more than 15 seconds
function timeLine(part: CheckInPart, a: SessionRecord, b: SessionRecord): string | null {
  // Where each sits
  const [before, after] = [timeStatus(part, a.durationSec), timeStatus(part, b.durationSec)];
  // The two lengths
  const lengths = `${formatClock(a.durationSec)} → ${formatClock(b.durationSec)}`;
  // A part with a window whose place changed
  if (before !== after && after !== null) return `Time: ${lengths}, ${after === "inside" ? `now inside the ${windowWords(part)} window` : after === "short" ? "now under the window" : "now past the window"}.`;
  // A real change in length
  if (Math.abs(b.durationSec - a.durationSec) > 15) return `Time: ${lengths}.`;
  // Nothing to say
  return null;
}

// Compare one part of two check-ins
function comparePart(part: CheckInPart, a: CheckIn, b: CheckIn, analyses: ReadonlyMap<string, AnalysisRecord>, pauseWords: boolean): PartComparison {
  // The two takes
  const [takeA, takeB] = [a.takes[part] ?? null, b.takes[part] ?? null];
  // Where each sits against the window
  const time = { a: takeA ? timeStatus(part, takeA.durationSec) : null, b: takeB ? timeStatus(part, takeB.durationSec) : null };
  // Missing on one side: nothing to compare
  if (!takeA || !takeB) return { part, a: takeA, b: takeB, rows: [], time, lines: ["Skipped or not recorded in one of these check-ins, so there is nothing to compare."] };
  // The measures for this part, without pause words when they are hidden
  const specs = [...COMMON, ...(part === "story" ? STORY_CHECKS : [])].filter((spec) => pauseWords || !spec.pauseWords);
  // Each compared
  const rows = specs.map((spec) => compareMeasure(spec, { session: takeA, analysis: analyses.get(takeA.id) }, { session: takeB, analysis: analyses.get(takeB.id) })).filter((row): row is CompareRow => row !== null);
  // The changes worth a line, biggest first, at most three
  const changed = rows.filter((row) => row.verdict !== null && row.verdict !== "same" && row.word).sort((x, y) => size(y) - size(x)).slice(0, 3);
  // The line about time, first
  const timing = timeLine(part, takeA, takeB);
  // The lines, or one saying nothing much moved
  const lines = [...(timing ? [timing] : []), ...changed.map(rowLine)];
  // The part
  return { part, a: takeA, b: takeB, rows, time, lines: lines.length > 0 ? lines : ["About the same on every measure."] };
}

// Compare two check-ins, part by part
export function compareCheckIns(a: CheckIn, b: CheckIn, analyses: ReadonlyMap<string, AnalysisRecord>, options: { pauseWords: boolean }): CheckInComparison {
  // Days between them
  const days = Math.round((new Date(`${b.day}T12:00:00`).getTime() - new Date(`${a.day}T12:00:00`).getTime()) / 86_400_000);
  // Each part in order
  return { a, b, days, parts: CHECK_IN_PARTS.map((part) => comparePart(part, a, b, analyses, options.pauseWords)) };
}

// The two check-ins to compare: the ones named, or by default the first and the latest; null with fewer than two
export function pickPair(checkIns: ReadonlyArray<CheckIn>, aId: string | null, bId: string | null): { a: CheckIn; b: CheckIn } | null {
  // Those with takes
  const recorded = recordedCheckIns(checkIns);
  // Fewer than two: nothing to compare
  if (recorded.length < 2) return null;
  // The named ones, if they exist
  const [namedA, namedB] = [recorded.find((checkIn) => checkIn.id === aId), recorded.find((checkIn) => checkIn.id === bId)];
  // Defaults: the latest
  const b = namedB ?? recorded.at(-1)!;
  // And the first; the same one twice takes the one before it instead, or the one after
  const first = namedA ?? recorded[0]!;
  // (checked)
  const a = first.id === b.id ? (recorded[recorded.indexOf(b) - 1] ?? recorded[1]!) : first;
  // Earlier first
  return a.day <= b.day ? { a, b } : { a: b, b: a };
}

// The ids of every take in two check-ins, for reading just their analyses
export function takeIds(...checkIns: ReadonlyArray<CheckIn>): string[] {
  // Each take's id
  return checkIns.flatMap((checkIn) => Object.values(checkIn.takes).map((session) => session!.id));
}

// A part's name, for pages and the coach
export function partName(part: CheckInPart): string {
  // From the part's details
  return CHECK_IN_PART_INFO[part].name;
}
