// Live conversations, step A (decision 119): the pure parts of talking to AssemblyAI's Universal-Streaming v3 socket. The address and its settings, turning microphone samples into 16 kHz 16-bit PCM in chunks of at least 100 ms, reading the server's messages (Begin, Turn, Termination, Error), and keeping the words of one turn of yours. Message and setting names were checked in AssemblyAI's own SDK (assemblyai 4.41.7: StreamingTranscriber, TurnEvent, StreamingForceEndpoint); the docs site was not reachable from the build environment

// Load the schema library, to read the server's messages
import { z } from "zod";
// Load the streaming model's id
import { LIVE_STREAMING_MODEL } from "@/config/models";

// The socket's address
export const STREAMING_SOCKET_URL = "wss://streaming.assemblyai.com/v3/ws";
// The sample rate sent
export const STREAMING_SAMPLE_RATE = 16_000;
// The shortest chunk sent, in samples (100 ms; the service takes chunks of 50 to 1,000 ms)
export const STREAMING_CHUNK_SAMPLES = 1_600;

// How patient the end-of-turn model is (decision 119): a little more patient than the service's defaults, since people practising pause to think (decision 101's reasoning). The confidence the model needs to end a turn, the silence it then waits for, and the longest silence before a turn ends regardless, in milliseconds
export const LIVE_TURN_SETTINGS = { endOfTurnConfidenceThreshold: 0.6, minTurnSilenceMs: 560, maxTurnSilenceMs: 2_400 } as const;

// The message that ends a turn at once (a Done tap)
export const FORCE_ENDPOINT = JSON.stringify({ type: "ForceEndpoint" });
// The message that ends the session cleanly, so billing stops
export const TERMINATE = JSON.stringify({ type: "Terminate" });

// The socket's address for a token, with the settings as query parameters
export function streamingUrl(token: string, base: string = STREAMING_SOCKET_URL): string {
  // The settings, as the service names them
  const query = new URLSearchParams({
    // The single-use token from our server
    token,
    // 16 kHz, 16-bit little-endian PCM
    sample_rate: String(STREAMING_SAMPLE_RATE), encoding: "pcm_s16le",
    // The model
    speech_model: LIVE_STREAMING_MODEL,
    // How patient the end of a turn is
    end_of_turn_confidence_threshold: String(LIVE_TURN_SETTINGS.endOfTurnConfidenceThreshold), min_turn_silence: String(LIVE_TURN_SETTINGS.minTurnSilenceMs), max_turn_silence: String(LIVE_TURN_SETTINGS.maxTurnSilenceMs),
    // Unformatted words: quicker, and recognition text is unformatted everywhere else in the app
    format_turns: "false",
  });
  // The address
  return `${base}?${query.toString()}`;
}

// Average the samples down to the target rate (a simple box filter, enough for speech)
export function downsample(samples: Float32Array, fromRate: number, toRate: number = STREAMING_SAMPLE_RATE): Float32Array {
  // Already at the rate (or below it): as they are
  if (fromRate <= toRate) return samples;
  // How many input samples make one output sample
  const ratio = fromRate / toRate;
  // The output
  const out = new Float32Array(Math.floor(samples.length / ratio));
  // Each output sample
  for (let index = 0; index < out.length; index += 1) {
    // The input samples it covers
    const from = Math.floor(index * ratio);
    // (up to)
    const to = Math.min(samples.length, Math.floor((index + 1) * ratio));
    // Their total
    let total = 0;
    // Added up
    for (let at = from; at < to; at += 1) total += samples[at]!;
    // Their average
    out[index] = to > from ? total / (to - from) : 0;
  }
  // Done
  return out;
}

// Turn samples from -1 to 1 into 16-bit whole numbers, clipped at the ends
export function toPcm16(samples: Float32Array): Int16Array {
  // The output
  const out = new Int16Array(samples.length);
  // Each sample
  for (let index = 0; index < samples.length; index += 1) {
    // Kept within -1 to 1
    const value = Math.max(-1, Math.min(1, samples[index]!));
    // Scaled to the 16-bit range
    out[index] = value < 0 ? Math.round(value * 0x8000) : Math.round(value * 0x7fff);
  }
  // Done
  return out;
}

// Collects samples into chunks of at least the shortest length, so each one sent is long enough
export class ChunkCollector {
  // Samples waiting
  private pending: number[] = [];
  // Build with the chunk length
  constructor(private readonly chunkSamples: number = STREAMING_CHUNK_SAMPLES) {}
  // Add samples; hand back the full chunks ready to send
  push(samples: Int16Array): Int16Array<ArrayBuffer>[] {
    // Kept
    for (const sample of samples) this.pending.push(sample);
    // The full chunks
    const chunks: Int16Array<ArrayBuffer>[] = [];
    // While a chunk is full
    while (this.pending.length >= this.chunkSamples) chunks.push(new Int16Array(this.pending.splice(0, this.chunkSamples)));
    // Ready
    return chunks;
  }
}

// The server's messages that matter here
const StreamingMessage = z.discriminatedUnion("type", [
  // The session began
  z.object({ type: z.literal("Begin"), id: z.string(), expires_at: z.number().optional() }),
  // Words of a turn so far, and whether the turn ended
  z.object({ type: z.literal("Turn"), turn_order: z.number(), transcript: z.string(), end_of_turn: z.boolean(), end_of_turn_confidence: z.number().optional() }),
  // The session ended
  z.object({ type: z.literal("Termination"), audio_duration_seconds: z.number().optional(), session_duration_seconds: z.number().optional() }),
  // A problem
  z.object({ type: z.literal("Error"), error: z.string(), error_code: z.number().optional() }),
]);

// One message read from the server
export type StreamingMessage = z.infer<typeof StreamingMessage>;

// Read one message from the server, or null when it is not one of these (heartbeats, warnings, anything new)
export function parseStreamingMessage(data: unknown): StreamingMessage | null {
  // Only text messages
  if (typeof data !== "string") return null;
  // Parsing can fail
  try {
    // Checked
    const parsed = StreamingMessage.safeParse(JSON.parse(data));
    // The message, or nothing
    return parsed.success ? parsed.data : null;
  } catch {
    // Not JSON
    return null;
  }
}

// The words of one turn of yours: the service's turns that ended inside it, and the one still going
export interface TurnWords {
  // Words of the service's turns that ended, in order
  done: string[];
  // The service turn ended last, so a repeat of it is not added twice
  lastOrder: number | null;
  // Words of the service's turn still going
  partial: string;
  // Whether the last message ended a turn (nothing still going)
  ended: boolean;
}

// Nothing heard yet, keeping any turn still going (a turn you started by talking over the persona keeps its first words)
export function startTurnWords(previous?: TurnWords): TurnWords {
  // Empty, apart from the words still going
  return { done: [], lastOrder: previous?.lastOrder ?? null, partial: previous && !previous.ended ? previous.partial : "", ended: previous ? previous.ended : true };
}

// Take in one Turn message
export function applyTurn(state: TurnWords, turn: { turn_order: number; transcript: string; end_of_turn: boolean }): TurnWords {
  // Still going: the latest words of it
  if (!turn.end_of_turn) return { ...state, partial: turn.transcript.trim(), ended: false };
  // Ended, but already counted (a repeat of the same turn)
  if (state.lastOrder === turn.turn_order) return { ...state, partial: "", ended: true };
  // Ended: its words join the rest
  return { done: turn.transcript.trim() ? [...state.done, turn.transcript.trim()] : state.done, lastOrder: turn.turn_order, partial: "", ended: true };
}

// The words so far, as the recorder shows them: settled and still being worked out
export function turnText(state: TurnWords): { final: string; interim: string } {
  // Settled, and the rest
  return { final: state.done.join(" "), interim: state.partial };
}

// The whole of the turn's words
export function turnTranscript(state: TurnWords): string {
  // Settled then still going
  return [...state.done, state.partial].filter(Boolean).join(" ");
}

// Words that are only listening sounds ("mm-hm", "yeah", "right"), which do not start a turn of yours when you talk over the persona
const LISTENING_WORDS = new Set(["mm", "mhm", "mm-hm", "mmhm", "uh-huh", "uhhuh", "hmm", "yeah", "yes", "yep", "right", "okay", "ok", "oh", "ah", "sure", "wow", "really", "huh", "uh", "um"]);

// Whether some words are only a listening sound (or nothing)
export function onlyListening(words: string): boolean {
  // The words, lowercase, without punctuation
  const parts = words.toLowerCase().replace(/[^a-z' -]/g, " ").split(/\s+/).filter(Boolean);
  // Every one a listening sound, and only a few of them
  return parts.length <= 3 && parts.every((part) => LISTENING_WORDS.has(part));
}
