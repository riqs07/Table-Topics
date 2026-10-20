// What a recording's voice showed (decision 81): how far the pitch moved, how phrases ended, and how the volume held up. Everything is against the speaker's own voice: pitch in steps around their usual pitch, volume against their own other phrases (phone microphones are not calibrated, so never "too quiet")

// Load the pitch rules
import { summarizePitch, usualPitch } from "@/core/pitch";
// Load the phrase finder and the fading rule
import { fadingEnds, speechStretches } from "@/core/pauses";
// Load the loudness comparisons
import { levelStep, speechLevel, type LevelStep } from "@/core/voiceFindings";
// Load the shared limits for fading
import { FADING, MIN_ENDINGS } from "@/core/notesCheck";
// Load the spacing of the readings
import { LOUDNESS_TICK_MS } from "@/core/recordingRules";
// Load the record type
import type { SessionRecord } from "@/data/records";

// Fewest voiced readings (three seconds of voice) before the pitch range is judged
const MIN_VOICED = 30;
// Below this many steps the pitch counts as fairly flat
export const FLAT_STEPS = 3;
// From this many steps it counts as lively
const LIVELY_STEPS = 6;
// A range this far from the speaker's usual counts as livelier or flatter
const USUAL_DIFFERENCE = 2;
// Fewest phrases with a readable ending before endings are judged
export const MIN_PHRASES = 4;
// Share of phrases ending rising before it is mentioned as something to work on
const RISING_SHARE = 0.4;
// Share of phrases ending low before it is mentioned as a strength, with few rising
const FALLING_SHARE = 0.6;
// Most phrases that may rise for the low endings still to count as a strength
const FEW_RISING = 0.2;
// Shortest recording, in seconds, before the last third is compared with the rest
const MIN_SECONDS_FOR_THIRDS = 30;
// Fewest phrases before the spread of volume is judged
const MIN_PHRASES_FOR_SPREAD = 4;
// Shortest phrase, in readings, whose volume counts for the spread
const MIN_PHRASE_READINGS = 10;
// Below this many decibels between the loudest and quietest phrase, the volume counts as very even
const EVEN_DB = 2.5;

// Which measure a line is about
export type VoiceLineKind = "range" | "ends" | "drop" | "even" | "fading";

// One plain line about the voice
export interface VoiceLine {
  // What it is about
  kind: VoiceLineKind;
  // The words
  text: string;
  // Something that went well, or something to work on
  tone: "good" | "work";
}

// What a recording's voice showed
export interface VoiceReport {
  // The pitch, when there was enough voice: the range in steps, the speaker's usual range from earlier recordings (or null), and how phrases ended
  pitch: { rangeSteps: number; usualRange: number | null; ends: { fall: number; level: number; rise: number } } | null;
  // The volume, when loudness was recorded: phrases that faded at the end, and (only without the browser's levelling) the last third against the rest and the spread across phrases in decibels
  volume: { faded: number; stretches: number; lastThird: LevelStep | null; spreadDb: number | null } | null;
  // The lines to show, most useful first
  lines: VoiceLine[];
}

// The pitch range of a recording in steps, or null without enough voice
export function rangeOf(session: SessionRecord): number | null {
  // No pitch saved (older recordings)
  if (!session.pitch || session.pitch.length === 0) return null;
  // The summary against the recording's own usual pitch
  const summary = summarizePitch(session.pitch);
  // Only with enough voice
  return summary.voiced >= MIN_VOICED ? summary.rangeSteps : null;
}

// The speaker's usual range: the middle of their earlier recordings' ranges, from three or more (null before then)
export function usualRange(earlier: ReadonlyArray<SessionRecord>): number | null {
  // The ranges that could be read
  const ranges = earlier.map(rangeOf).filter((range): range is number => range !== null).sort((a, b) => a - b);
  // Too few to call usual
  if (ranges.length < 3) return null;
  // The middle one
  return ranges[Math.floor(ranges.length / 2)]!;
}

// How each phrase ended, from the pitch readings within it
function phraseEnds(levels: ReadonlyArray<number>, pitches: ReadonlyArray<number | null>): { fall: number; level: number; rise: number } {
  // The speaker's usual pitch across the whole recording
  const usual = usualPitch(pitches);
  // The counts
  const ends = { fall: 0, level: 0, rise: 0 };
  // Each phrase
  for (const stretch of speechStretches(levels, LOUDNESS_TICK_MS)) {
    // Its ending, against the usual pitch
    const end = summarizePitch(pitches.slice(stretch.start, stretch.end + 1), usual).end;
    // Counted when readable
    if (end) ends[end] += 1;
  }
  // Hand them back
  return ends;
}

// Volume spread across phrases, in decibels between the loudest and quietest (null with too few phrases)
function spreadOf(levels: ReadonlyArray<number>): number | null {
  // Each long enough phrase's typical level
  const phrases = speechStretches(levels, LOUDNESS_TICK_MS).filter((stretch) => stretch.levels.length >= MIN_PHRASE_READINGS).map((stretch) => stretch.levels.reduce((sum, level) => sum + level, 0) / stretch.levels.length).filter((level) => level > 0);
  // Too few to judge
  if (phrases.length < MIN_PHRASES_FOR_SPREAD) return null;
  // Between the loudest and the quietest, to a tenth of a decibel
  return Math.round(20 * Math.log10(Math.max(...phrases) / Math.min(...phrases)) * 10) / 10;
}

// What a recording's voice showed, against the speaker's usual range (fluency false leaves out fading, as "I stammer" asks; decision 79)
export function voiceReport(session: SessionRecord, usual: number | null, options: { fluency?: boolean } = {}): VoiceReport {
  // The loudness readings, when recorded
  const levels = session.loudness && session.loudness.length > 0 ? session.loudness : null;
  // The pitch readings, when recorded alongside them
  const pitches = levels && session.pitch && session.pitch.length > 0 ? session.pitch : null;
  // The range, with enough voice
  const range = rangeOf(session);
  // The pitch findings
  const pitch = range !== null && pitches && levels ? { rangeSteps: range, usualRange: usual, ends: phraseEnds(levels, pitches) } : null;
  // Whether loudness changes across the take are real (the browser's levelling was off)
  const unlevelled = session.autoGain === false;
  // The volume findings
  const volume = levels ? { ...fadingEnds(levels, LOUDNESS_TICK_MS), lastThird: unlevelled && session.durationSec >= MIN_SECONDS_FOR_THIRDS ? thirdsStep(levels) : null, spreadDb: unlevelled ? spreadOf(levels) : null } : null;
  // The lines
  const lines: VoiceLine[] = [];
  // How the phrases ended, when enough could be read
  if (pitch) {
    // The phrases with a readable ending
    const judged = pitch.ends.fall + pitch.ends.level + pitch.ends.rise;
    // Many rising: can sound unsure
    if (judged >= MIN_PHRASES && pitch.ends.rise / judged >= RISING_SHARE) lines.push({ kind: "ends", text: `${pitch.ends.rise} of ${judged} phrases ended rising, which can sound unsure. Land your statements low.`, tone: "work" });
    // Mostly falling, few rising: sounds sure
    else if (judged >= MIN_PHRASES && pitch.ends.fall / judged >= FALLING_SHARE && pitch.ends.rise / judged <= FEW_RISING) lines.push({ kind: "ends", text: `${pitch.ends.fall} of ${judged} phrases ended low, which sounds sure.`, tone: "good" });
  }
  // The range
  if (pitch) lines.push(rangeLine(pitch.rangeSteps, usual));
  // The volume
  if (volume) {
    // Dropping in the last third
    if (volume.lastThird === "clear-down") lines.push({ kind: "drop", text: "Your volume dropped in the last third. Keep your energy to the end.", tone: "work" });
    // Very even across phrases
    else if (volume.spreadDb !== null && volume.spreadDb < EVEN_DB) lines.push({ kind: "even", text: "Your volume stayed very even. Drop quieter for one line, or lift for your main point.", tone: "work" });
    // Phrases fading at the end (left out when fluency is not judged)
    if (options.fluency !== false && volume.stretches >= MIN_ENDINGS && volume.faded / volume.stretches >= FADING) lines.push({ kind: "fading", text: `${volume.faded} of ${volume.stretches} phrases faded at the end. Land the last word.`, tone: "work" });
    // Every phrase kept its strength
    else if (options.fluency !== false && volume.stretches >= MIN_ENDINGS && volume.faded === 0) lines.push({ kind: "fading", text: "You kept your strength to the end of every phrase.", tone: "good" });
  }
  // Things to work on first
  return { pitch, volume, lines: [...lines.filter((line) => line.tone === "work"), ...lines.filter((line) => line.tone === "good")] };
}

// The last third's level against the first two thirds
function thirdsStep(levels: ReadonlyArray<number>): LevelStep {
  // Where the last third starts
  const cut = Math.floor((levels.length * 2) / 3);
  // The first two thirds against the last
  return levelStep(speechLevel(levels.slice(0, cut)), speechLevel(levels.slice(cut)));
}

// The line about the pitch range, with the speaker's usual when known
function rangeLine(range: number, usual: number | null): VoiceLine {
  // Against the usual, when known
  const compared = usual === null ? "" : range >= usual + USUAL_DIFFERENCE ? `, livelier than your usual ${usual}` : range <= usual - USUAL_DIFFERENCE ? `, flatter than your usual ${usual}` : `, about your usual`;
  // Fairly flat
  if (range < FLAT_STEPS) return { kind: "range", text: `Fairly flat: your pitch moved across ${range} ${range === 1 ? "step" : "steps"}${compared}. Lift the key word in each sentence.`, tone: "work" };
  // Lively, or in between
  return { kind: "range", text: `${range >= LIVELY_STEPS ? "Lively: your" : "Your"} pitch moved across ${range} steps${compared}.`, tone: "good" };
}

// The voice numbers sent to the coach (decision 81): only what was measured, against the speaker's own voice
export interface CoachVoice {
  // The pitch range in steps (semitones), or null with too little voice
  rangeSteps: number | null;
  // The speaker's usual range from earlier recordings, or null
  usualRange: number | null;
  // How the phrases ended, or null with too little voice
  ends: { fall: number; level: number; rise: number } | null;
  // Phrases that faded at the end, of those judged, or null with too few phrases
  faded: { count: number; of: number } | null;
  // The volume in the last third against the rest, only when the browser did not level it
  lastThird: "louder" | "same" | "quieter" | null;
}

// The voice numbers for the coach, or null when nothing was measured
export function coachVoice(session: SessionRecord, usual: number | null): CoachVoice | null {
  // What the voice showed (fading always measured; whether to mention it is the coach's instructions' call)
  const report = voiceReport(session, usual);
  // The last third, in words
  const third = report.volume?.lastThird;
  // The numbers
  const voice: CoachVoice = {
    // The range
    rangeSteps: report.pitch?.rangeSteps ?? null,
    // The usual range, only alongside a range
    usualRange: report.pitch ? usual : null,
    // The endings
    ends: report.pitch?.ends ?? null,
    // Fading, with enough phrases
    faded: report.volume && report.volume.stretches >= MIN_ENDINGS ? { count: report.volume.faded, of: report.volume.stretches } : null,
    // The last third
    lastThird: !third ? null : third === "clear-down" ? "quieter" : third === "clear-up" ? "louder" : "same",
  };
  // Nothing measured
  return voice.rangeSteps === null && voice.faded === null && voice.lastThird === null ? null : voice;
}
