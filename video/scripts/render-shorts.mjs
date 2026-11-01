// Renders every course short (decision 145) to out/social/shorts/<course id>.mp4, one after another, with Remotion's command line

// Load Node's process and file tools
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";

// Where the videos go
mkdirSync("out/social/shorts", { recursive: true });
// The courses with a voiceover
const ids = readdirSync("public/social/courses").filter((name) => name.endsWith(".mp3")).map((name) => name.replace(/\.mp3$/, "")).sort();
// A browser to render with, when one is installed (a cloud session's Chromium)
const browser = process.env.CHROMIUM_PATH ? ["--browser-executable", process.env.CHROMIUM_PATH] : [];
// Each in turn
for (const id of ids) {
  // Said
  console.log(`Rendering ${id}…`);
  // Rendered
  execFileSync("npx", ["remotion", "render", "src/index.ts", `short-${id}`, `out/social/shorts/${id}.mp4`, ...browser], { stdio: "inherit" });
}
