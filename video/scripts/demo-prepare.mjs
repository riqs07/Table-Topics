// Prepares the two-person demo (a one-off test, not a lesson): joins the six voiced lines into one track and measures each speaker's loudness frame by frame, for the mouths

// Load Node's file and process tools
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

// Frames a second, matching the composition
const FPS = 30;
// Samples a second used for measuring and joining
const RATE = 44100;
// Quiet before the first line and after the last, in seconds
const [LEAD, TAIL] = [0.4, 1.2];
// Quiet between two lines, in seconds
const GAP = 0.12;
// The lines in order: who speaks (a: afro, b: brunette) and what they say, as captions
const LINES = [
  // 1
  ["a", "Okay, I have to tell you. I finally signed up for that pottery class."],
  // 2
  ["b", "No way! The one on Saturday mornings?"],
  // 3
  ["a", "That one. First lesson, my bowl collapsed. Twice."],
  // 4
  ["b", "Twice? Okay, I need to see this bowl."],
  // 5
  ["a", "Come with me next week and make your own."],
  // 6
  ["b", "Deal. Worst bowl buys the coffee."],
];

// A file's samples as numbers from -1 to 1
function samplesOf(file) {
  // Raw 16-bit mono samples
  const pcm = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", String(RATE), "-f", "s16le", "-"], { maxBuffer: 1 << 28 });
  // As numbers
  return Array.from(new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length / 2), (value) => value / 32768);
}

// The joined track, its timings and each speaker's samples on the same clock
const [track, timings, bySpeaker] = [[], [], { a: [], b: [] }];
// Start with quiet
for (let i = 0; i < LEAD * RATE; i++) track.push(0);
// Each line in turn
LINES.forEach(([speaker, text], index) => {
  // Its tightened recording
  const samples = samplesOf(`public/demo/tight/line${index + 1}.wav`);
  // Where it starts, in seconds
  const start = track.length / RATE;
  // Add it
  for (const value of samples) track.push(value);
  // Note its timing
  timings.push({ speaker, text, start: Number(start.toFixed(3)), end: Number((track.length / RATE).toFixed(3)) });
  // Then a short quiet (a longer one after the last)
  for (let i = 0; i < (index === LINES.length - 1 ? TAIL : GAP) * RATE; i++) track.push(0);
});
// Each speaker's loudness per frame: silent unless it is their line
const frames = Math.ceil((track.length / RATE) * FPS);
// (per frame)
const perFrame = RATE / FPS;
// Fill both
for (const speaker of ["a", "b"]) {
  // Each frame
  for (let frame = 0; frame < frames; frame++) {
    // The frame's time in seconds
    const time = frame / FPS;
    // Whether this speaker is talking then
    const line = timings.find((timing) => timing.speaker === speaker && time >= timing.start && time < timing.end);
    // Not talking: silent
    if (!line) { bySpeaker[speaker].push(0); continue; }
    // The frame's samples
    const slice = track.slice(Math.floor(frame * perFrame), Math.floor((frame + 1) * perFrame));
    // Their root mean square
    const rms = Math.sqrt(slice.reduce((sum, value) => sum + value * value, 0) / Math.max(1, slice.length));
    // Kept as measured for now
    bySpeaker[speaker].push(rms);
  }
  // The speaker's loud frames, quietest first, so each voice is scaled to its own level
  const sorted = bySpeaker[speaker].filter((value) => value > 0).sort((x, y) => x - y);
  // A loud but not the loudest frame sets full open
  const peak = sorted[Math.floor(sorted.length * 0.92)] || 1;
  // Scale to 0 to 1, rounded to keep the file small
  bySpeaker[speaker] = bySpeaker[speaker].map((value) => Number(Math.min(1, value / peak).toFixed(3)));
}
// Write the joined track as 16-bit samples, then let ffmpeg wrap it as a WAV
const pcm = Buffer.alloc(track.length * 2);
// Each sample
track.forEach((value, i) => pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(value * 32767))), i * 2));
// Wrap and save
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "s16le", "-ar", String(RATE), "-ac", "1", "-i", "-", "public/demo/conversation.wav"], { input: pcm });
// Save the timings and loudness for the composition
writeFileSync("src/demo/conversation.json", JSON.stringify({ fps: FPS, frames, lines: timings, loud: bySpeaker }));
// Report
console.log(`${frames} frames (${(frames / FPS).toFixed(1)} s)`, timings.map((t) => `${t.speaker} ${t.start}-${t.end}`).join(", "));
