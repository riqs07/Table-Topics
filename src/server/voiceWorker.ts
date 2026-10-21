// The voice worker for deeper analysis (decision 91): our own small Python service (voice-worker/) that measures voice quality, spectral tilt, creak and syllable rate with Praat and librosa, and optionally audEERING's arousal, dominance and valence (personal use only). Reached with a shared secret; behind an interface so tests use a fake

// Load the schema library, to check the worker's reply
import { z } from "zod";

// The header carrying the shared secret (the worker compares it in constant time)
export const WORKER_SECRET_HEADER = "x-worker-secret";

// A number, or null when the take had too little voice to measure it
const Measure = z.number().finite().nullable();

// The worker's reply, as voice-worker/app/main.py sends it
export const WorkerReplySchema = z.object({
  // The worker's version
  version: z.string().max(40),
  // The Praat version inside it
  praat_version: z.string().max(40),
  // Voice quality
  jitter_local_pct: Measure, shimmer_local_db: Measure, hnr_db: Measure,
  // Spectral tilt
  alpha_ratio_db: Measure, hammarberg_db: Measure,
  // Creak, as a percentage of voiced time
  creak_pct: Measure,
  // Syllables and rates
  syllables: Measure, speech_rate_sps: Measure, articulation_rate_sps: Measure,
  // Pitch
  f0: z.object({ median_hz: z.number(), p10_hz: z.number(), p90_hz: z.number(), range_st: z.number(), sd_st: z.number() }).nullable(),
  // The optional audEERING scores
  emotion: z.object({ arousal: z.number(), dominance: z.number(), valence: z.number(), model: z.string().max(120) }).nullable(),
});

// What the worker found
export type WorkerReply = z.infer<typeof WorkerReplySchema>;

// Something that measures a voice
export interface VoiceWorker {
  // Measure the audio (of the given kind); stops early when the signal is aborted
  analyse(audio: ArrayBuffer, contentType: string, signal: AbortSignal): Promise<WorkerReply>;
}

// Make the client for the worker at an address
export function createHttpVoiceWorker(url: string, secret: string, fetchFn: typeof fetch = fetch): VoiceWorker {
  // The client
  return {
    // Send the audio and read the findings
    async analyse(audio, contentType, signal) {
      // Post the audio with the secret
      const response = await fetchFn(`${url}/analyse`, { method: "POST", headers: { "content-type": contentType, [WORKER_SECRET_HEADER]: secret }, body: audio, signal });
      // A refusal or failure, by status only
      if (!response.ok) throw new Error(`The voice worker answered ${response.status}.`);
      // The findings, checked
      return WorkerReplySchema.parse(await response.json());
    },
  };
}
