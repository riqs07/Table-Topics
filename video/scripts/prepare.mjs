// Prepares what a render needs (run before every render): the app's scene animations as plain CSS, and the voiceover's phrases and loudness, frame by frame

// Load Node's file, path and process tools
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";

// Frames a second, matching the composition
const FPS = 30;
// The voiceover
const VOICE = path.resolve("public/take-a.mp3");
// Where the prepared files go
const OUT = path.resolve("src/generated");
// Make the folder
mkdirSync(OUT, { recursive: true });

// The app's stylesheet
const css = readFileSync(path.resolve("../src/app/globals.css"), "utf8");
// Where the scene rules start and where the next section begins (the scenes and course tiles, with their keyframes)
const [from, to] = [css.indexOf("/* The blob scenes (decision 136)"), css.indexOf("/* Ticking off a step on Today (decision 141)")];
// Stop with a clear message if globals.css was reorganised
if (from < 0 || to < from) throw new Error("Could not find the scene rules in src/app/globals.css: update the markers in video/scripts/prepare.mjs");
// Keep that stretch
writeFileSync(path.join(OUT, "scene.css"), css.slice(from, to));

// The voiceover as raw 16-bit mono samples at 16 kHz
const pcm = execFileSync("ffmpeg", ["-v", "error", "-i", VOICE, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], { maxBuffer: 1 << 28 });
// The samples, as numbers
const samples = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length / 2);
// Samples in one frame
const perFrame = 16000 / FPS;
// The loudness (root mean square, 0 to 1) of each frame
const loudness = [];
// Each frame in turn
for (let start = 0; start < samples.length; start += perFrame) {
  // Add up the squares in this frame
  let sum = 0;
  // (each sample)
  for (let index = Math.floor(start); index < Math.min(samples.length, start + perFrame); index += 1) sum += (samples[index] / 32768) ** 2;
  // Keep the root of the mean, rounded
  loudness.push(Math.round(Math.sqrt(sum / perFrame) * 1000) / 1000);
}

// The quiet gaps between phrases, from ffmpeg's silence finder (it writes its report to the error stream)
const log = spawnSync("ffmpeg", ["-hide_banner", "-i", VOICE, "-af", "silencedetect=noise=-35dB:d=0.25", "-f", "null", "-"], { encoding: "utf8" }).stderr;
// Each gap's start and end
const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((match) => Number(match[1]));
// (ends)
const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((match) => Number(match[1]));
// The voice's length in seconds
const duration = samples.length / 16000;
// The spoken stretches between the gaps
const phrases = [0, ...ends].map((start, index) => ({ start: Math.round(start * 1000) / 1000, end: Math.round((starts[index] ?? duration) * 1000) / 1000 })).filter((phrase) => phrase.end - phrase.start > 0.15);

// Save the timings and loudness
writeFileSync(path.join(OUT, "voice.json"), JSON.stringify({ fps: FPS, duration, phrases, loudness }));
// Say what was found
console.log(`Prepared ${phrases.length} phrases over ${duration.toFixed(2)} s and the scene CSS.`);
