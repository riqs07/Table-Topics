// Deeper-analysis check (decision 91; rule T13): reads the same settings the app's /api/analyse route reads, says what is wrong by name, checks the AssemblyAI key with a free request, and sends a one-second test tone to the voice worker with the secret.
// Run it yourself with `pnpm analysis-check` after putting ASSEMBLYAI_API_KEY, VOICE_WORKER_URL and VOICE_WORKER_SECRET in .env.local. It never prints a key or the secret; share its output, not the keys.

// Load the app's settings reader
import { readAnalysisSettings } from "@/server/env";
// Load the app's voice worker client
import { createHttpVoiceWorker } from "@/server/voiceWorker";

// A one-second 150 Hz tone as a 16-bit mono WAV file, made here so nothing personal is sent
function testTone(): ArrayBuffer {
  // 16 kHz, one second
  const [rate, count] = [16_000, 16_000];
  // The file: a 44-byte header and the samples
  const view = new DataView(new ArrayBuffer(44 + count * 2));
  // Write text at a position
  const text = (at: number, value: string) => [...value].forEach((letter, index) => view.setUint8(at + index, letter.charCodeAt(0)));
  // The RIFF header, the format (PCM, mono, 16 kHz, 16-bit) and the data header
  text(0, "RIFF"); view.setUint32(4, 36 + count * 2, true); text(8, "WAVE"); text(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, "data"); view.setUint32(40, count * 2, true);
  // The tone, with a few harmonics so it sounds voiced
  for (let index = 0; index < count; index++) view.setInt16(44 + index * 2, Math.round(8000 * [1, 2, 3, 4].reduce((sum, harmonic) => sum + Math.sin((2 * Math.PI * 150 * harmonic * index) / rate) / harmonic, 0)), true);
  // The file
  return view.buffer;
}

// Check each part
async function main() {
  // The settings, read as the app reads them
  const settings = readAnalysisSettings(process.env);
  // What is wrong, by name
  for (const problem of settings.problems) console.log(`Problem: ${problem}`);
  // The transcription key
  if (!settings.assemblyAiKey) console.log("Transcription: not set up (ASSEMBLYAI_API_KEY is empty).");
  // (checked with a free request that lists no more than one transcript)
  else {
    // Ask
    const response = await fetch("https://api.assemblyai.com/v2/transcript?limit=1", { headers: { authorization: settings.assemblyAiKey } });
    // The answer
    console.log(response.ok ? "Transcription: the AssemblyAI key works." : `Transcription: AssemblyAI answered ${response.status} (401 means the key is wrong).`);
  }
  // The worker
  if (!settings.voiceWorker) console.log("Voice worker: not set up (VOICE_WORKER_URL and VOICE_WORKER_SECRET).");
  // (sent the test tone)
  else {
    // Measured
    try {
      // The reply
      const reply = await createHttpVoiceWorker(settings.voiceWorker.url, settings.voiceWorker.secret).analyse(testTone(), "audio/wav", AbortSignal.timeout(120_000));
      // What it found
      console.log(`Voice worker: works (version ${reply.version}, Praat ${reply.praat_version}); the test tone's pitch was ${reply.f0?.median_hz ?? "not found"} Hz (150 expected); audEERING module ${reply.emotion ? "on" : "off"}.`);
    } catch (error) {
      // Why not (401 means the secrets differ)
      console.log(`Voice worker: ${(error as Error).message} (401 means VOICE_WORKER_SECRET differs from the worker's; 503 means the worker has none).`);
    }
  }
}

// Run, and exit with an error code if anything failed
main().catch((error: unknown) => {
  // The reason, never a key
  console.error(`Analysis check failed: ${(error as Error).message}`);
  // Signal failure to the shell
  process.exit(1);
});
