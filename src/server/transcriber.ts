// The transcription service for deeper analysis (decision 91): AssemblyAI's Universal model, asked for a verbatim, punctuated transcript with every word's times and confidence. Upload the audio, ask for a transcript, wait for it, then delete it at AssemblyAI so nothing is kept there. Behind an interface so tests use a fake. Backups if it disappoints: Deepgram Nova-3 (filler_words) or ElevenLabs Scribe v2

// Load the schema library, to check the service's replies
import { z } from "zod";
// Load the model name
import { TRANSCRIPTION_MODEL } from "@/config/models";
// Load how often to ask whether the transcript is ready
import { TRANSCRIPT_POLL_MS } from "@/config/limits";

// One word as the service returns it: the text with punctuation, start and end in milliseconds, and confidence from 0 to 1
export interface TranscriptWord {
  // The word as written
  text: string;
  // When it started, in milliseconds
  start: number;
  // When it ended, in milliseconds
  end: number;
  // How sure the service was
  confidence: number;
}

// A finished transcript
export interface TranscriptResult {
  // The whole text
  text: string;
  // Every word
  words: TranscriptWord[];
}

// Something that turns audio into a timed transcript
export interface Transcriber {
  // Transcribe the audio; stops early when the signal is aborted
  transcribe(audio: ArrayBuffer, signal: AbortSignal): Promise<TranscriptResult>;
}

// What the client can be given (tests replace the network and the wait)
export interface AssemblyAiOptions {
  // Network function
  fetchFn?: typeof fetch;
  // The address of the API (AssemblyAI's EU address can be used instead)
  baseUrl?: string;
  // Milliseconds between checks
  pollMs?: number;
  // Wait a while, stopping early when the signal is aborted
  sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
}

// The upload reply: where the audio now is
const UploadReply = z.object({ upload_url: z.string() });
// The reply when a transcript is asked for: its id
const SubmitReply = z.object({ id: z.string() });
// The reply when checking a transcript: its status, and the text, words or error once there
const PollReply = z.object({
  // Queued, processing, completed or error
  status: z.string(),
  // The text, once completed
  text: z.string().nullish(),
  // The words, once completed
  words: z.array(z.object({ text: z.string(), start: z.number(), end: z.number(), confidence: z.number() })).nullish(),
  // Why it failed
  error: z.string().nullish(),
});

// Wait, stopping early when the signal is aborted
function wait(ms: number, signal: AbortSignal): Promise<void> {
  // A timer that the signal can cancel
  return new Promise((resolve, reject) => {
    // Already stopped
    if (signal.aborted) return reject(signal.reason);
    // The timer
    const timer = setTimeout(resolve, ms);
    // Stop it on abort
    signal.addEventListener("abort", () => {
      // Cancel the timer
      clearTimeout(timer);
      // And give up
      reject(signal.reason);
    }, { once: true });
  });
}

// Make the AssemblyAI client
export function createAssemblyAiTranscriber(apiKey: string, options: AssemblyAiOptions = {}): Transcriber {
  // The network, the address, the pause between checks and the wait
  const { fetchFn = fetch, baseUrl = "https://api.assemblyai.com", pollMs = TRANSCRIPT_POLL_MS, sleep = wait } = options;
  // Send one request and read its JSON reply, failing with the status (never the key)
  async function call(path: string, init: RequestInit, signal: AbortSignal): Promise<unknown> {
    // Ask, with the key
    const response = await fetchFn(`${baseUrl}${path}`, { ...init, headers: { authorization: apiKey, ...init.headers }, signal });
    // A refusal or failure
    if (!response.ok) throw new Error(`AssemblyAI answered ${response.status} to ${init.method ?? "GET"} ${path.replace(/\/[^/]{20,}$/, "/…")}.`);
    // The reply
    return response.json();
  }
  // The client
  return {
    // Upload, ask, wait, read, delete
    async transcribe(audio, signal) {
      // Upload the audio as it is
      const upload = UploadReply.parse(await call("/v2/upload", { method: "POST", headers: { "content-type": "application/octet-stream" }, body: audio }, signal));
      // Ask for a verbatim transcript: hesitation sounds kept, punctuation and word times on
      const submitted = SubmitReply.parse(await call("/v2/transcript", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ audio_url: upload.upload_url, speech_models: [TRANSCRIPTION_MODEL], language_code: "en", disfluencies: true, punctuate: true, format_text: true }) }, signal));
      // Its address
      const path = `/v2/transcript/${encodeURIComponent(submitted.id)}`;
      // Check until done, then delete it at AssemblyAI whatever happened (nothing is kept there; decision 91)
      try {
        // Until it finishes or the signal stops it
        for (;;) {
          // Its state
          const state = PollReply.parse(await call(path, { method: "GET" }, signal));
          // Finished
          if (state.status === "completed") return { text: state.text ?? "", words: state.words ?? [] };
          // Failed, with the service's reason
          if (state.status === "error") throw new Error(`AssemblyAI could not transcribe the take: ${state.error ?? "no reason given"}.`);
          // Not yet: wait
          await sleep(pollMs, signal);
        }
      } finally {
        // Delete the transcript (and with it the text) at AssemblyAI; a failure here is not fatal, and the account's own data-retention setting is the backstop (setup-requirements.md)
        await fetchFn(`${baseUrl}${path}`, { method: "DELETE", headers: { authorization: apiKey } }).catch(() => undefined);
      }
    },
  };
}
