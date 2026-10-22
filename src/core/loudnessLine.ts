// Loudness as thickness (decision 111, the volume drills only): the pitch curve is drawn in short pieces, each as thick as the voice was loud there, against the loudest reading of the drill, so "louder" can be seen along the line

// Load the placement of a moment across a row, and the height rule
import { xForTime, yForStep, type WordSlot } from "@/core/pitchPhrases";

// Thinnest piece, in pixels
const THIN = 2;
// Thickest piece, in pixels
const THICK = 10;

// One piece of the line: from one reading to the next, with its thickness
export interface ThickPiece {
  // Start across
  x1: number;
  // Start down
  y1: number;
  // End across
  x2: number;
  // End down
  y2: number;
  // Thickness in pixels
  width: number;
}

// The pieces of a take's line across a row of words: each pair of neighbouring voiced readings, as thick as the louder of the two against the loudest given
export function thickPieces(steps: ReadonlyArray<number | null>, levels: ReadonlyArray<number>, loudest: number, tickMs: number, slots: ReadonlyArray<WordSlot>, words: ReadonlyArray<{ start: number; end: number }>): ThickPiece[] {
  // Nothing to draw against
  if (slots.length === 0 || loudest <= 0) return [];
  // The row's time
  const [start, end] = [words[slots[0]!.index]!.start, words[slots.at(-1)!.index]!.end];
  // Seconds per reading
  const tick = tickMs / 1000;
  // The pieces
  const pieces: ThickPiece[] = [];
  // Each reading inside the row and the one after it
  for (let index = Math.max(0, Math.floor(start / tick)); index < Math.min(steps.length - 1, Math.ceil(end / tick)); index++) {
    // Both readings' pitch
    const [from, to] = [steps[index] ?? null, steps[index + 1] ?? null];
    // A gap in the voice
    if (from === null || to === null) continue;
    // The louder of the two, against the loudest
    const share = Math.min(1, Math.max(levels[index] ?? 0, levels[index + 1] ?? 0) / loudest);
    // The piece
    pieces.push({ x1: Math.round(xForTime(index * tick, slots, words) * 10) / 10, y1: yForStep(from), x2: Math.round(xForTime((index + 1) * tick, slots, words) * 10) / 10, y2: yForStep(to), width: Math.round((THIN + (THICK - THIN) * share) * 10) / 10 });
  }
  // Hand them back
  return pieces;
}
