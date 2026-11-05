// The Chart Kit's geometry (second design pass): one chart language for the app, built from five marks (your voice as a ribbon of rounded bars, a gap in it for a real pause with a soft band, a dot below for each pause word, pitch as one soft line, your last time as a dashed ghost) and a target band. Everything here turns the app's real data into picture units, so the components only draw. Pure, so every rule is tested

// Load the speech threshold, so the ribbon's silences match the pauses found elsewhere
import { speechThreshold } from "@/core/pauses";
// Load the tiny copy kept on each session
import { MINI_BINS, MINI_LEVELS, type MiniFingerprint } from "@/core/miniFingerprint";

// How many bars a full ribbon has across a take
export const RIBBON_SLOTS = 64;
// The shortest silence drawn as a real pause (a soft band in the gap), in seconds; shorter gaps are breaths between words
export const REAL_PAUSE_SECONDS = 0.6;
// The lowest a spoken bar is drawn, as a share of the ribbon's height, so a quiet word still shows
const LOWEST_BAR = 0.18;

// A voice ribbon: how loud the speech was across a take, and when the pause words came
export interface Ribbon {
  // Loudness of speech in each equal slot of the take, 0 (silent) to 1 (the loudest slot)
  levels: number[];
  // The take's length in seconds (the slots are spread evenly over it)
  duration: number;
  // When pause words were said, in seconds
  ums: number[];
  // The real pauses' true times, when known from the readings (a gap's length is then theirs, not its slots')
  pauses?: Span[];
}

// A stretch of time, in seconds
export interface Span {
  // When it starts
  start: number;
  // When it ends
  end: number;
}

// How many slots a ribbon of a take this long has: about one for each three-quarters of a second, from 40 to 160
export function ribbonSlots(seconds: number): number {
  // Kept between the fewest and the most
  return Math.max(40, Math.min(160, Math.ceil(seconds / 0.75)));
}

// A ribbon from loudness readings: the speech in each slot (silent when mostly below the speaker's own threshold, or when a real pause is centred in it, so every real pause leaves a gap however long the take), against the loudest slot, with each real pause's true time kept; null when nothing was said
export function ribbonFromLevels(levels: ReadonlyArray<number>, tickMs: number, ums: ReadonlyArray<number> = [], slots = RIBBON_SLOTS): Ribbon | null {
  // Too few readings to fill the slots
  if (levels.length < slots || slots < 1) return null;
  // Below this is silence
  const threshold = speechThreshold(levels);
  // Readings per slot
  const per = levels.length / slots;
  // Seconds per reading
  const tick = tickMs / 1000;
  // The real pauses: runs of silence at least REAL_PAUSE_SECONDS long between speech, in readings
  const runs: Array<{ from: number; to: number }> = [];
  // The silent run being measured, and whether speech has been heard yet
  let [runFrom, heard] = [-1, false];
  // Each reading
  levels.forEach((level, index) => {
    // Silence starts or grows a run (only after the first speech)
    if (level < threshold) {
      // Start it
      if (heard && runFrom < 0) runFrom = index;
      // Next reading
      return;
    }
    // Speech closes a long enough run
    if (runFrom >= 0 && (index - runFrom) * tick >= REAL_PAUSE_SECONDS - 1e-9) runs.push({ from: runFrom, to: index });
    // Speech heard, no run now
    [runFrom, heard] = [-1, true];
  });
  // The slots that hold a real pause's middle
  const paused = new Set(runs.map((run) => Math.min(slots - 1, Math.floor((run.from + run.to) / 2 / per))));
  // Each slot's speech loudness (0 when silent)
  const raw = Array.from({ length: slots }, (_, slot) => {
    // A real pause's middle: silent
    if (paused.has(slot)) return 0;
    // Its readings
    const part = levels.slice(Math.floor(slot * per), Math.max(Math.floor(slot * per) + 1, Math.floor((slot + 1) * per)));
    // The speech among them
    const speech = part.filter((level) => level >= threshold);
    // Mostly silent: nothing
    if (speech.length * 2 < part.length) return 0;
    // The speech's average
    return speech.reduce((sum, level) => sum + level, 0) / speech.length;
  });
  // The loudest slot
  const loudest = Math.max(0, ...raw);
  // Nothing said
  if (loudest === 0) return null;
  // The ribbon, each slot against the loudest, the pause words in order, the real pauses' times
  return { levels: raw.map((value) => round2(value / loudest)), duration: levels.length * tick, ums: [...ums].sort((a, b) => a - b), pauses: runs.map((run) => ({ start: round2(run.from * tick), end: round2(run.to * tick) })) };
}

// A ribbon with no more than some slots, for a narrow chart: neighbouring slots merged, a merged slot silent when any of its slots was (so every real pause still leaves a gap), otherwise their average
export function thinRibbon(ribbon: Ribbon, most: number): Ribbon {
  // Slots merged into one
  const group = Math.ceil(ribbon.levels.length / Math.max(1, most));
  // Already few enough
  if (group <= 1) return ribbon;
  // The merged levels
  const levels = Array.from({ length: Math.ceil(ribbon.levels.length / group) }, (_, slot) => {
    // Its slots
    const part = ribbon.levels.slice(slot * group, (slot + 1) * group);
    // Silent when any is, otherwise their average
    return part.some((level) => level <= 0) ? 0 : round2(part.reduce((sum, level) => sum + level, 0) / part.length);
  });
  // The same take over fewer slots (the last one may hold fewer, so the length is scaled to whole slots)
  return { ...ribbon, levels, duration: (ribbon.duration / ribbon.levels.length) * levels.length * group };
}

// A ribbon from the tiny copy kept on a session (History draws it without the readings; decision 99): its 32 levels, and each pause word in the middle of its part
export function ribbonFromMini(mini: MiniFingerprint, duration: number): Ribbon {
  // Seconds per part (at least a little, so a take with no length still draws)
  const part = Math.max(0.01, duration) / MINI_BINS;
  // The ribbon
  return { levels: mini.bins.map((bin) => round2(bin / MINI_LEVELS)), duration: Math.max(0.01, duration), ums: [...mini.ums].sort((a, b) => a - b).map((bin) => round2((bin + 0.5) * part)) };
}

// A ribbon from stretches of speech that each have one level (the fingerprint's strip, when no readings are at hand): each slot takes the level of the stretch it falls in
export function ribbonFromStretches(stretches: ReadonlyArray<Span & { level: number }>, duration: number, ums: ReadonlyArray<number> = [], slots = RIBBON_SLOTS): Ribbon | null {
  // Nothing said
  if (stretches.length === 0 || duration <= 0) return null;
  // Seconds per slot
  const each = duration / slots;
  // Each slot's level: the stretch covering its middle, or silence
  const levels = Array.from({ length: slots }, (_, slot) => stretches.find((stretch) => (slot + 0.5) * each >= stretch.start && (slot + 0.5) * each <= stretch.end)?.level ?? 0);
  // The ribbon
  return { levels, duration, ums: [...ums].sort((a, b) => a - b) };
}

// One bar of the ribbon, in picture units
export interface RibbonBar {
  // Its slot
  slot: number;
  // Left edge
  x: number;
  // Top edge
  y: number;
  // Width
  width: number;
  // Height
  height: number;
}

// How a pause is drawn: a soft band (a real pause), lit (the one that mattered), or grey (a pause the headline does not praise, such as one mid-sentence: never red)
export type PauseKind = "well" | "lit" | "grey";

// One pause in the ribbon, in picture units and seconds
export interface RibbonPause {
  // Left edge of the gap
  x: number;
  // Its width
  width: number;
  // When it started, in seconds
  start: number;
  // How long it lasted, in seconds
  seconds: number;
  // How it is drawn
  kind: PauseKind;
}

// One pause word under the ribbon
export interface RibbonUm {
  // Across the picture
  x: number;
  // When it was said, in seconds
  at: number;
}

// The ribbon laid out in a box
export interface RibbonLayout {
  // The bars of speech
  bars: RibbonBar[];
  // The real pauses (gaps of at least REAL_PAUSE_SECONDS between speech)
  pauses: RibbonPause[];
  // The pause words
  ums: RibbonUm[];
}

// Whether two stretches of time overlap
function overlaps(a: Span, b: Span): boolean {
  // Each starts before the other ends
  return a.start < b.end && b.start < a.end;
}

// The ribbon laid out in a box: a thin rounded bar per spoken slot, centred and as tall as it was loud; the gaps between speech that last a real pause; and the pause words along the bottom. Pauses that overlap a lit span are lit, ones that overlap a grey span are grey, the rest a soft band
export function ribbonLayout(ribbon: Ribbon, box: { width: number; height: number }, marks: { lit?: ReadonlyArray<Span>; grey?: ReadonlyArray<Span> } = {}): RibbonLayout {
  // How many slots
  const count = Math.max(1, ribbon.levels.length);
  // Width of a slot
  const slotWidth = box.width / count;
  // A bar's width: most of the slot, with a gap of at least one unit, never thinner than one and a half nor wider than five (thin marks, however wide the chart)
  const barWidth = Math.min(5, Math.max(1.5, slotWidth - Math.max(1, slotWidth * 0.4)));
  // Seconds per slot
  const slotSeconds = ribbon.duration / count;
  // The bars, one per spoken slot
  const bars = ribbon.levels.flatMap((level, slot) => {
    // Silence: no bar
    if (level <= 0) return [];
    // Its height: at least the lowest share, at most the box
    const height = round2(Math.max(LOWEST_BAR, Math.min(1, level)) * box.height);
    // The bar, centred in its slot and in the box
    return [{ slot, x: round2(slot * slotWidth + (slotWidth - barWidth) / 2), y: round2((box.height - height) / 2), width: round2(barWidth), height }];
  });
  // The first and last spoken slots (silence before and after the take is not a pause)
  const [first, last] = [ribbon.levels.findIndex((level) => level > 0), ribbon.levels.length - 1 - [...ribbon.levels].reverse().findIndex((level) => level > 0)];
  // The pauses found
  const pauses: RibbonPause[] = [];
  // The silent run being measured
  let runStart = -1;
  // Walk the slots between the first and last speech
  for (let slot = first + 1; first >= 0 && slot <= last; slot++) {
    // A silent slot starts or grows a run
    if (ribbon.levels[slot]! <= 0) {
      // Start it
      if (runStart < 0) runStart = slot;
      // Next slot
      continue;
    }
    // Speech after a run closes it
    if (runStart >= 0) {
      // Its time by its slots
      const slotSpan = { start: runStart * slotSeconds, end: slot * slotSeconds };
      // The real pauses inside it, when known
      const inside = ribbon.pauses?.filter((pause) => overlaps(pause, slotSpan)) ?? [];
      // Its time: the real pauses' when known, otherwise its slots'
      const span = inside.length > 0 ? { start: inside[0]!.start, end: inside[0]!.start + inside.reduce((sum, pause) => sum + pause.end - pause.start, 0) } : slotSpan;
      // Long enough to be a real pause
      if (inside.length > 0 || span.end - span.start >= REAL_PAUSE_SECONDS - 1e-9) {
        // How it is drawn
        const kind: PauseKind = marks.lit?.some((lit) => overlaps(lit, span)) ? "lit" : marks.grey?.some((grey) => overlaps(grey, span)) ? "grey" : "well";
        // Kept
        pauses.push({ x: round2(runStart * slotWidth), width: round2((slot - runStart) * slotWidth), start: round2(span.start), seconds: round2(span.end - span.start), kind });
      }
      // None now
      runStart = -1;
    }
  }
  // The pause words along the bottom, kept inside the box
  const ums = ribbon.ums.map((at) => ({ x: round2(Math.max(0, Math.min(box.width, (at / Math.max(0.01, ribbon.duration)) * box.width))), at }));
  // The layout
  return { bars, pauses, ums };
}

// A sentence for a screen reader on what a ribbon shows
export function ribbonSentence(layout: RibbonLayout, options: { pauseWords?: boolean } = {}): string {
  // The real pauses
  const pauses = layout.pauses.length;
  // The pause words, unless hidden (decision 79)
  const ums = options.pauseWords === false ? null : layout.ums.length;
  // The sentence
  return `Your voice as a ribbon, with ${pauses === 0 ? "no real pauses" : `${pauses} real ${pauses === 1 ? "pause" : "pauses"}`}${ums === null ? "" : ` and ${ums === 0 ? "no pause words" : `${ums} pause ${ums === 1 ? "word" : "words"}`}`}.`;
}

// A headline split around the words to emphasise, so the key words can be drawn in the "went well" colour
export interface HeadlinePart {
  // The text
  text: string;
  // Whether it is emphasised
  em: boolean;
}

// Split a sentence around the first place a phrase appears (the whole sentence plain when it does not)
export function splitEmphasis(sentence: string, phrase: string | null): HeadlinePart[] {
  // Where the phrase starts
  const at = phrase ? sentence.indexOf(phrase) : -1;
  // Not there: all plain
  if (!phrase || at < 0) return [{ text: sentence, em: false }];
  // Before, the phrase, after (empty pieces left out)
  return [{ text: sentence.slice(0, at), em: false }, { text: phrase, em: true }, { text: sentence.slice(at + phrase.length), em: false }].filter((part) => part.text.length > 0);
}

// One point over weeks (or takes): its name and value, or null when there was none
export interface WeekPoint {
  // Such as "This week"
  label: string;
  // The value, or null
  value: number | null;
}

// The over-weeks line laid out in a box
export interface WeeksLayout {
  // Each point across, and down when it has a value
  points: Array<{ x: number; y: number | null; label: string; value: number | null }>;
  // The path through the points with values (broken where one is missing)
  path: string;
  // The ghost: where the first value sits, dashed across the chart
  ghostY: number | null;
  // The light grid: a few round values and where they sit
  grid: Array<{ value: number; y: number }>;
}

// Round values for a light grid from zero to a top, about three lines
export function gridValues(top: number): number[] {
  // A step that gives about three lines: 1, 2 or 5 times a power of ten
  const raw = Math.max(1e-6, top) / 3;
  // The power of ten
  const power = 10 ** Math.floor(Math.log10(raw));
  // The nicest step at least as big as the raw one
  const step = [1, 2, 5, 10].map((times) => times * power).find((candidate) => candidate >= raw - 1e-9)!;
  // From zero up to the top
  return Array.from({ length: Math.floor(top / step + 1e-9) + 1 }, (_, index) => round2(index * step));
}

// The over-weeks line in a box: one axis from zero, a light grid, the first value as a dashed ghost and the line through the rest (left and right edges kept clear for the dots)
export function weeksLayout(weeks: ReadonlyArray<WeekPoint>, box: { width: number; height: number; left: number; right: number; top: number; bottom: number }): WeeksLayout {
  // The values there are
  const values = weeks.flatMap((week) => (week.value === null ? [] : [week.value]));
  // The grid, from zero past the largest value
  const grid = gridValues(Math.max(1, ...values) * 1.15);
  // The top of the scale: the last grid line, or a little above the largest value when that is higher
  const top = Math.max(grid.at(-1) ?? 1, Math.max(0, ...values) * 1.15, 1e-6);
  // Down the picture for a value
  const y = (value: number) => round2(box.top + ((top - value) / top) * (box.height - box.top - box.bottom));
  // Across for a point
  const x = (index: number) => round2(box.left + (weeks.length === 1 ? 0.5 : index / (weeks.length - 1)) * (box.width - box.left - box.right));
  // The points
  const points = weeks.map((week, index) => ({ x: x(index), y: week.value === null ? null : y(week.value), label: week.label, value: week.value }));
  // The path, a gap where a value is missing
  let path = "";
  // Whether the pen is down
  let down = false;
  // Each point
  for (const point of points) {
    // A gap lifts the pen
    if (point.y === null) {
      // Lifted
      down = false;
      // Next
      continue;
    }
    // A move or a line to it
    path += `${down ? "L" : "M"}${point.x} ${point.y}`;
    // Down now
    down = true;
  }
  // The first value, the ghost
  const firstValue = values[0];
  // The layout
  return { points, path, ghostY: firstValue === undefined ? null : y(firstValue), grid: grid.map((value) => ({ value, y: y(value) })) };
}

// The over-weeks headline for pause words a minute: the change from the first week with a value to the latest, with the key words to emphasise (none before there are two values)
export function weeksHeadline(weeks: ReadonlyArray<WeekPoint>, noticeable = 0.2): { text: string; em: string | null } {
  // The first week with a value
  const first = weeks.find((week) => week.value !== null);
  // The latest week
  const latest = weeks.at(-1);
  // Not two values to compare
  if (!first || !latest || latest.value === null || first === latest) return { text: "Pause words a minute, first tries.", em: null };
  // The change
  const change = latest.value - first.value!;
  // Since when, in lower case
  const since = first.label.toLowerCase();
  // About the same
  if (Math.abs(change) < noticeable) return { text: `Pause words held steady since ${since}.`, em: "held steady" };
  // The size of the change, one decimal
  const size = Math.abs(change).toFixed(1);
  // Fewer
  if (change < 0) return { text: `${size} fewer pause words a minute than ${since}.`, em: `${size} fewer` };
  // More (said plainly, never as a failure)
  return { text: `${size} more pause words a minute than ${since}.`, em: `${size} more` };
}

// One pause bar: the word it came after, and how long it was (null when not heard)
export interface PauseBarInput {
  // The word before the pause
  after: string;
  // Its length in seconds, or null
  seconds: number | null;
}

// The pause bars laid out in a box
export interface PauseBarsLayout {
  // Each bar: its slot's middle, its top and height (zero when not heard), and whether it landed in the target
  bars: Array<{ x: number; width: number; y: number; height: number; seconds: number | null; inside: boolean; after: string }>;
  // The target band's top and height
  band: { y: number; height: number };
  // The baseline
  base: number;
  // The longest length the scale shows, in seconds
  scale: number;
}

// Pause bars against a target band: one bar per mark, as tall as the pause, the band from the shortest to the longest target length (a bar outside it is grey, never red)
export function pauseBarsLayout(gaps: ReadonlyArray<PauseBarInput>, target: { shortest: number; longest: number }, box: { width: number; height: number; top: number; bottom: number }): PauseBarsLayout {
  // The scale: past the target, and past the longest pause
  const scale = Math.ceil(Math.max(target.longest + 0.5, ...gaps.map((gap) => gap.seconds ?? 0)));
  // The baseline
  const base = box.height - box.bottom;
  // Height for a length
  const tall = (seconds: number) => round2((Math.max(0, seconds) / scale) * (base - box.top));
  // Width of a slot
  const slot = box.width / Math.max(1, gaps.length);
  // A bar's width: about half its slot, at most 40
  const width = round2(Math.min(40, slot * 0.55));
  // The bars
  const bars = gaps.map((gap, index) => {
    // Its height (none when not heard)
    const height = gap.seconds === null ? 0 : Math.max(3, tall(gap.seconds));
    // The bar
    return { x: round2(slot * (index + 0.5)), width, y: round2(base - height), height, seconds: gap.seconds, inside: gap.seconds !== null && gap.seconds >= target.shortest && gap.seconds <= target.longest, after: gap.after };
  });
  // The band
  return { bars, band: { y: round2(base - tall(target.longest)), height: round2(((target.longest - target.shortest) / scale) * (base - box.top)) }, base, scale };
}

// The emphasised words in a pause-lengths line ("3 of 4"), or null when none were measured or none landed (nothing to praise)
export function pauseLineEmphasis(line: string): string | null {
  // The count at the start
  const count = /^\d+ of \d+/.exec(line)?.[0] ?? null;
  // Kept unless none landed
  return count && !count.startsWith("0 ") ? count : null;
}

// Where a value sits across a band chart, as a share from 0 to 1 (clamped)
export function shareAcross(value: number, from: number, to: number): number {
  // The share, kept inside
  return Math.max(0, Math.min(1, (value - from) / Math.max(1e-6, to - from)));
}

// The usual-zone headline: how many measures the latest take kept inside the usual band, the count to emphasise (none when nothing landed inside)
export function usualHeadline(bars: ReadonlyArray<{ words: string }>): { text: string; em: string | null } {
  // Inside, and in all
  const [inside, total] = [bars.filter((bar) => bar.words === "inside your usual").length, bars.length];
  // All inside
  if (inside === total) return { text: "Your latest take sat inside your usual.", em: "inside your usual" };
  // Some or none
  return { text: `${inside} of ${total} inside your usual on your latest take.`, em: inside > 0 ? `${inside} of ${total}` : null };
}

// The key words in a take-at-a-glance headline: the part that went well (no pause words, or pauses between thoughts), or none
export function glanceEmphasis(headline: string): string | null {
  // No pause words at all
  if (headline.includes("no pause words")) return "no pause words";
  // Calm pauses, at the start
  if (/^Pauses between thoughts/.test(headline)) return "Pauses between thoughts";
  // Nothing to praise in the colour
  return null;
}

// The last drawn point of a curve (where a teal dot marks a clean fall), or null when nothing is drawn
export function endPoint<T extends { x: number; y: number }>(points: ReadonlyArray<T | null>): T | null {
  // From the end, the first point there is
  for (let index = points.length - 1; index >= 0; index--) if (points[index]) return points[index]!;
  // None
  return null;
}

// Round to two decimals, so the picture's numbers stay short
function round2(value: number): number {
  // Shift, round, shift back
  return Math.round(value * 100) / 100;
}
