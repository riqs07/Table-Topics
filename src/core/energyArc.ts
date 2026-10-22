// The energy arc (decision 115): a long take's loudness and pitch variety by thirds of its speech, put together as one energy number per third (each against the take's own average, so a quiet speaker is not judged by a loud one), drawn as a smooth curve, with one plain line on its shape. Pure

// Load the speech threshold
import { speechThreshold } from "@/core/pauses";
// Load the cleaned pitch in steps
import { cleanSteps } from "@/core/pitchClean";

// Fewest voiced readings in each third before the arc is drawn
const MIN_PER_THIRD = 10;
// Energies within this of each other read as steady
const STEADY = 0.12;

// The arc
export interface EnergyArc {
  // Energy in the beginning, middle and end, each about 1 for the take's average
  thirds: [number, number, number];
  // One plain line on its shape
  line: string;
}

// The spread of some numbers (standard deviation)
function spread(values: ReadonlyArray<number>): number {
  // The average
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  // The root of the average squared distance
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
}

// The line for a shape
export function arcLine(thirds: readonly [number, number, number]): string {
  // The highest and lowest thirds
  const [high, low] = [thirds.indexOf(Math.max(...thirds)), thirds.indexOf(Math.min(...thirds))];
  // All about the same
  if (Math.max(...thirds) - Math.min(...thirds) < STEADY) return "Steady energy from start to finish.";
  // Built to the end
  if (high === 2) return "Energy built to the end.";
  // Faded at the end, after a strong middle
  if (low === 2 && high === 1) return "Strongest in the middle, quieter at the end. Give your last line the most energy.";
  // Faded from a strong start
  if (low === 2) return "Strongest at the start, quieter by the end. Give your last line the most energy.";
  // A quiet start
  if (low === 0) return high === 1 ? "A quiet start, strongest in the middle." : "A quiet start that built up.";
  // A dip in the middle
  return "Strong at the start and end, with a dip in the middle.";
}

// The arc of a take, or null without enough voice in each third
export function energyArc(levels: ReadonlyArray<number>, pitch: ReadonlyArray<number | null>, tickMs: number): EnergyArc | null {
  // Below this is silence
  const threshold = speechThreshold(levels);
  // The first and last speech readings
  const [first, last] = [levels.findIndex((level) => level >= threshold), levels.length - 1 - [...levels].reverse().findIndex((level) => level >= threshold)];
  // No speech
  if (first === -1 || last <= first) return null;
  // The cleaned pitch in steps
  const steps = cleanSteps(pitch, tickMs).steps;
  // Each third's loudness and pitch variety
  const parts = [0, 1, 2].map((third) => {
    // Its readings
    const [from, to] = [first + Math.floor(((last - first + 1) * third) / 3), first + Math.floor(((last - first + 1) * (third + 1)) / 3)];
    // Its speech loudness
    const loud = levels.slice(from, to).filter((level) => level >= threshold);
    // Its voiced pitch
    const voiced = steps.slice(from, to).filter((step): step is number => step !== null);
    // Both, or null when too little
    return loud.length >= MIN_PER_THIRD && voiced.length >= MIN_PER_THIRD ? { loud: loud.reduce((sum, level) => sum + level, 0) / loud.length, variety: spread(voiced) } : null;
  });
  // Too little in a third
  if (parts.some((part) => part === null)) return null;
  // The averages over the thirds
  const [loudMean, varietyMean] = [parts.reduce((sum, part) => sum + part!.loud, 0) / 3, parts.reduce((sum, part) => sum + part!.variety, 0) / 3];
  // Each third's energy: loudness and variety against their averages, half each
  const thirds = parts.map((part) => Math.round(((part!.loud / Math.max(1e-6, loudMean) + part!.variety / Math.max(1e-6, varietyMean)) / 2) * 100) / 100) as [number, number, number];
  // The arc
  return { thirds, line: arcLine(thirds) };
}
