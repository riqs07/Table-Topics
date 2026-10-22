// Writes src/content/shadowPitch.ts: the model voice's pitch for every shadowing step, read once from its saved recording in public/clips with the app's own pitch reader, ten readings a second (decision 111).
// Shadowing draws it under your own curve. Run it with `pnpm shadow-pitch` after a shadowing clip is recorded again (it needs ffmpeg to decode the MP3s); a unit test fails while a step has no readings.

// Load Node's process runner and file writer
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
// Load the app's pitch reader
import { detectPitch } from "@/core/pitch";
// Load the shadowing passages and their steps
import { SHADOW_PASSAGES, shadowSteps } from "@/content/voice";
// Load the saved recordings' list
import { VOICE_CLIPS } from "@/content/voiceClips";

// The rate the clips are decoded at
const RATE = 48_000;
// Samples between readings (a tenth of a second)
const HOP = RATE / 10;
// Slices read within each tenth of a second (one every 20 ms; the reading is their middle voiced pitch, which steadies a voice the reader only catches now and then)
const LOOKS = 5;
// Samples in each slice read (about 43 ms, as the phone reads the microphone)
const SLICE = 2048;

// One clip's readings: decoded to mono samples, read every tenth of a second, the silence before and after trimmed
function readClip(file: string): (number | null)[] {
  // The raw 32-bit samples from ffmpeg
  const raw = execFileSync("ffmpeg", ["-v", "error", "-i", `public/clips/${file}.mp3`, "-f", "f32le", "-ac", "1", "-ar", String(RATE), "-"], { maxBuffer: 64 * 1024 * 1024 });
  // As numbers
  const samples = new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.byteLength / 4));
  // One reading per tenth of a second, in whole hertz
  const readings: (number | null)[] = [];
  // Each tenth of a second
  for (let start = 0; start + SLICE <= samples.length; start += HOP) {
    // The voiced pitches of its slices
    const found = Array.from({ length: LOOKS }, (_, look) => start + (look * HOP) / LOOKS).filter((at) => at + SLICE <= samples.length).map((at) => detectPitch(samples.subarray(at, at + SLICE), RATE)).filter((hertz): hertz is number => hertz !== null).sort((a, b) => a - b);
    // Their middle, kept whole
    readings.push(found.length === 0 ? null : Math.round(found[Math.floor(found.length / 2)]!));
  }
  // The first and last voiced readings
  const [first, last] = [readings.findIndex((value) => value !== null), readings.length - 1 - [...readings].reverse().findIndex((value) => value !== null)];
  // Trimmed
  return first === -1 ? [] : readings.slice(first, last + 1);
}

// Each step's readings, by its recording's id
const entries = SHADOW_PASSAGES.flatMap((passage) => shadowSteps(passage)).map((step) => [step.voiceId, readClip(VOICE_CLIPS[step.voiceId]!.file)] as const);
// The file's lines
const lines = [
  "// The model voice's pitch for each shadowing step, ten readings a second in whole hertz (null where unvoiced), read from its saved recording with the app's own pitch reader (decision 111). Written by `pnpm shadow-pitch`; do not edit by hand",
  "",
  "// Each step's readings, by its recording's id",
  "export const SHADOW_PITCH: Readonly<Record<string, ReadonlyArray<number | null>>> = {",
  // One line per step, with a comment naming it
  ...entries.flatMap(([id, readings]) => [`  // ${id}`, `  ${JSON.stringify(id)}: [${readings.map((value) => (value === null ? "null" : String(value))).join(", ")}],`]),
  "};",
  "",
];
// Save the file
writeFileSync("src/content/shadowPitch.ts", lines.join("\n"));
// Say what was written
console.log(`Wrote the model pitch for ${entries.length} shadowing steps.`);
