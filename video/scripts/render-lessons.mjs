// Renders lesson clips (decision 147) and puts them in the app: each to out/lessons/<id>.mp4 at 864 by 1080, then copied to the app's public/lessons with a still of its closing card. Give clip ids to render only those; with none, every clip with a voiceover

// Load Node's process and file tools
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";

// Where the videos go
mkdirSync("out/lessons", { recursive: true });
// The clips asked for, or every one with a voiceover
const ids = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync("public/lessons").filter((name) => name.endsWith(".mp3")).map((name) => name.replace(/\.mp3$/, "")).sort();
// A browser to render with, when one is installed (a cloud session's Chromium)
const browser = process.env.CHROMIUM_PATH ? ["--browser-executable", process.env.CHROMIUM_PATH] : [];
// Each in turn
for (const id of ids) {
  // Said
  console.log(`Rendering ${id}…`);
  // Rendered small enough to load quickly on a phone (about 1 MB)
  execFileSync("npx", ["remotion", "render", "src/index.ts", `lesson-${id}`, `out/lessons/${id}.mp4`, "--scale=0.8", "--crf=28", "--audio-bitrate=64k", ...browser], { stdio: "inherit" });
  // Into the app
  copyFileSync(`out/lessons/${id}.mp4`, `../public/lessons/${id}.mp4`);
  // Its still: the closing card, a second before the end
  execFileSync("ffmpeg", ["-v", "error", "-y", "-sseof", "-1", "-i", `out/lessons/${id}.mp4`, "-frames:v", "1", "-q:v", "5", `../public/lessons/${id}-poster.jpg`]);
}
