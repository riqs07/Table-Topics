// Filler bake-off (decision 91, research section "Test them yourself"): send your own takes, with "um" counts you made by ear, through the transcription service and see how many it kept.
// It uses the same AssemblyAI client and the same hesitation-sound rule as the app, so a good result here means a good result in the app.
//
// How to use it (it costs about a cent a take; nothing is kept at AssemblyAI, each transcript is deleted after reading):
// 1. Record about 10 takes of a minute or two on your phone or computer (any format ffmpeg reads; the app's own WebM or MP4 files are fine). Say a known number of "um"s and "uh"s in each, or count them by ear afterwards.
// 2. Put them in a folder named bakeoff/ in this project (it is git-ignored, so your voice is never committed), with a file bakeoff/counts.json like:
//      { "take01.webm": 12, "take02.m4a": 7 }
//    where each number is how many um/uh/er/erm sounds you counted.
// 3. Put ASSEMBLYAI_API_KEY in .env.local, then run:  pnpm bakeoff        (or: pnpm bakeoff path/to/folder)
// 4. It prints, per take, your count, the service's count and the share it kept (recall), then the total. Share the output (never the key).
// Deepgram Nova-3 (filler_words=true) and ElevenLabs Scribe v2 are the backups: to compare them, add a Transcriber for each in src/server/ and list it in TRANSCRIBERS below.

// Load Node's file tools
import { readFileSync, readdirSync } from "node:fs";
// Load Node's path joiner
import { join } from "node:path";
// Load the app's AssemblyAI client
import { createAssemblyAiTranscriber, type Transcriber } from "@/server/transcriber";
// Load the app's settings reader
import { readAnalysisSettings } from "@/server/env";
// Load the app's hesitation-sound rule and word cleaner
import { isHesitationSound } from "@/core/fillers";
// Load the word cleaner
import { cleanWord } from "@/core/analysis/server";

// The folder of takes
const folder = process.argv[2] ?? "bakeoff";

// The services compared (name and client); AssemblyAI only until a backup is added
function transcribers(): Array<{ name: string; client: Transcriber }> {
  // The key, as the app reads it
  const key = readAnalysisSettings(process.env).assemblyAiKey;
  // Without it nothing can run
  if (!key) throw new Error("ASSEMBLYAI_API_KEY is not set. Add it to .env.local.");
  // The list
  return [{ name: "AssemblyAI", client: createAssemblyAiTranscriber(key) }];
}

// Run every take through every service and print the counts
async function main() {
  // Your counts by file name
  const counts = JSON.parse(readFileSync(join(folder, "counts.json"), "utf8")) as Record<string, number>;
  // The takes that have a count
  const files = readdirSync(folder).filter((name) => name in counts);
  // None
  if (files.length === 0) throw new Error(`No takes in ${folder}/ are listed in ${folder}/counts.json.`);
  // Each service
  for (const { name, client } of transcribers()) {
    // Totals for recall
    let [heard, said] = [0, 0];
    // Heading
    console.log(`\n${name}\n${"take".padEnd(24)} by ear  heard  kept`);
    // Each take in turn
    for (const file of files) {
      // The audio
      const audio = readFileSync(join(folder, file));
      // Transcribed, with up to four minutes to finish
      const result = await client.transcribe(audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength) as ArrayBuffer, AbortSignal.timeout(240_000));
      // Its hesitation sounds, by the app's rule
      const found = result.words.filter((word) => isHesitationSound(cleanWord(word.text))).length;
      // Added up
      [heard, said] = [heard + Math.min(found, counts[file]!), said + counts[file]!];
      // One line
      console.log(`${file.padEnd(24)} ${String(counts[file]).padStart(6)} ${String(found).padStart(6)}  ${counts[file]! > 0 ? `${Math.round((found / counts[file]!) * 100)}%` : "–"}`);
    }
    // The total recall (extra sounds beyond your count are not counted as kept)
    console.log(`Recall over ${files.length} takes: ${said > 0 ? Math.round((heard / said) * 100) : 0}% of ${said} sounds kept.`);
  }
}

// Run, and exit with an error code if anything failed
main().catch((error: unknown) => {
  // The reason, never a key
  console.error(`Bake-off failed: ${(error as Error).message}`);
  // Signal failure to the shell
  process.exit(1);
});
