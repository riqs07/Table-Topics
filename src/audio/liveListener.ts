// Live conversations, step A (decision 119): one AssemblyAI streaming socket for the whole conversation. It sends the microphone as 16 kHz PCM while it is your turn (and, with headphones, while the persona talks, so you can talk over them), silence otherwise, so the persona's voice from a speaker is never heard as yours. Each of your turns reads its words from the socket, and the service's end-of-turn model says when the turn is over. Closed on the conversation's end, the page hiding, an error, or the granted time running out, since the service bills for every second the socket is open

// Load the recording contracts
import type { LiveTranscriber } from "@/audio/services";
// Load the protocol's pure parts
import { ChunkCollector, FORCE_ENDPOINT, STREAMING_SAMPLE_RATE, TERMINATE, applyTurn, downsample, onlyListening, parseStreamingMessage, startTurnWords, streamingUrl, toPcm16, turnText, turnTranscript, type TurnWords } from "@/core/liveStreaming";

// What is sent while it is not your turn: the microphone (your turn), the microphone but only to notice you talking over the persona (headphones), or silence
export type LiveMode = "listen" | "barge" | "silence";

// Why the socket closed by itself
export type LiveDrop = "error" | "closed";

// What the conversation hears from the listener
export interface LiveEvents {
  // The service decided your turn has ended
  onEndOfTurn(): void;
  // You started talking over the persona (headphones only), with the words heard so far
  onBargeIn(words: string): void;
  // The socket closed by itself (a network drop, a refusal, or the granted time ran out)
  onDropped(why: LiveDrop): void;
}

// What the conversation uses: your turns' words, what to send, and closing
export interface LiveTurns {
  // A transcriber for one turn of yours, reading from the socket
  turnTranscriber(): LiveTranscriber;
  // What to send now
  setMode(mode: LiveMode): void;
  // Close the socket and the microphone; hands back how many seconds the socket was open
  close(): Promise<number>;
}

// The pieces the listener is built from (the browser's, or fakes in tests)
export interface LiveListenerOptions {
  // The single-use token from our server
  token: string;
  // What the conversation hears
  events: LiveEvents;
  // Open a socket to an address (the browser's WebSocket)
  createSocket?: (url: string) => WebSocket;
  // Start sending microphone samples: each batch with its sample rate; hands back how to stop
  startAudio?: (onSamples: (samples: Float32Array, rate: number) => void) => Promise<() => void>;
  // The clock, in milliseconds
  now?: () => number;
  // How long to wait for the session to begin, in milliseconds
  connectTimeoutMs?: number;
}

// How long to wait for the session to begin before giving up, in milliseconds
const CONNECT_TIMEOUT_MS = 5_000;
// How long a Done tap waits for the last words after asking the service to end the turn, in milliseconds
const FORCE_WAIT_MS = 1_500;

// Open the microphone and hand its samples over in batches (a script processor: it needs no module file, so it works under the strict content policy); hands back how to stop
export async function startMicrophoneSamples(onSamples: (samples: Float32Array, rate: number) => void): Promise<() => void> {
  // The microphone, with the browser's echo cancellation and noise suppression on
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  // An audio graph at 16 kHz where the browser can (some refuse a chosen rate, or a microphone at another rate), otherwise at its own rate, downsampled later
  const graph = (sampleRate?: number) => {
    // The graph
    const made = sampleRate ? new AudioContext({ sampleRate }) : new AudioContext();
    // Connecting can fail
    try {
      // The microphone in it
      return { context: made, source: made.createMediaStreamSource(stream) };
    } catch (error) {
      // Not kept
      void made.close().catch(() => undefined);
      // Failed
      throw error;
    }
  };
  // The graph and the microphone in it
  let built: { context: AudioContext; source: MediaStreamAudioSourceNode };
  // At the streaming rate first
  try {
    // 16 kHz
    built = graph(STREAMING_SAMPLE_RATE);
  } catch {
    // The browser's rate
    built = graph();
  }
  // The pieces
  const { context, source } = built;
  // Running (a graph made after a wait can start paused)
  void context.resume().catch(() => undefined);
  // Batches of samples
  const processor = context.createScriptProcessor(2_048, 1, 1);
  // A silent output, so the processor keeps running without playing anything
  const mute = context.createGain();
  // Silent
  mute.gain.value = 0;
  // Each batch handed over
  processor.onaudioprocess = (event) => onSamples(new Float32Array(event.inputBuffer.getChannelData(0)), context.sampleRate);
  // Wired up
  source.connect(processor);
  // (to the silent output)
  processor.connect(mute);
  // (and on)
  mute.connect(context.destination);
  // How to stop: everything let go
  return () => {
    // No more batches
    processor.onaudioprocess = null;
    // Unwired
    source.disconnect();
    // (the processor)
    processor.disconnect();
    // The microphone let go
    for (const track of stream.getTracks()) track.stop();
    // The graph closed
    void context.close().catch(() => undefined);
  };
}

// Open a live listener: the socket opens, the session begins, and the microphone starts; throws when any of that fails, so the conversation falls back to ending turns on the phone
export async function openLiveListener({ token, events, createSocket = (url) => new WebSocket(url), startAudio = startMicrophoneSamples, now = () => Date.now(), connectTimeoutMs = CONNECT_TIMEOUT_MS }: LiveListenerOptions): Promise<LiveTurns> {
  // The socket
  const socket = createSocket(streamingUrl(token));
  // Binary chunks as array buffers
  socket.binaryType = "arraybuffer";
  // When it opened
  const openedAt = now();
  // What to send
  let mode: LiveMode = "silence";
  // Whether it is closed (by us or by itself)
  let closed = false;
  // How to stop the microphone, once started
  let stopAudio: (() => void) | null = null;
  // The turn under way, if any
  let turn: { words: TurnWords; onText: (text: { final: string; interim: string }) => void } | null = null;
  // Words of the service's turn still going while it is not your turn (for talking over the persona)
  let between: TurnWords = startTurnWords();
  // Waiting for the end of a turn after a Done tap
  let waiting: (() => void) | null = null;
  // Chunks of at least 100 ms
  const chunks = new ChunkCollector();

  // Close everything; how many seconds it was open
  const shutDown = (sendTerminate: boolean): number => {
    // Once
    if (!closed) {
      // Closed
      closed = true;
      // The microphone let go
      stopAudio?.();
      // Ending cleanly, so billing stops at once
      if (sendTerminate && socket.readyState === 1) socket.send(TERMINATE);
      // The socket closed
      try {
        // Closed normally
        socket.close(1000);
      } catch {
        // Already closing
      }
      // Anyone waiting stops waiting
      waiting?.();
    }
    // Seconds open
    return Math.round((now() - openedAt) / 100) / 10;
  };

  // The session beginning, or failing
  await new Promise<void>((resolve, reject) => {
    // Give up after a while
    const timer = setTimeout(() => {
      // Closed
      shutDown(false);
      // Failed
      reject(new Error("The live session did not begin in time."));
    }, connectTimeoutMs);
    // Each message
    socket.addEventListener("message", (event: MessageEvent) => {
      // Read
      const message = parseStreamingMessage(event.data);
      // Begun
      if (message?.type === "Begin") {
        // No longer waiting
        clearTimeout(timer);
        // Ready
        resolve();
      }
      // Refused
      if (message?.type === "Error") {
        // No longer waiting
        clearTimeout(timer);
        // Failed
        reject(new Error(message.error));
      }
    });
    // Closed before beginning
    socket.addEventListener("close", () => {
      // No longer waiting
      clearTimeout(timer);
      // Failed
      reject(new Error("The live session closed before it began."));
    });
  });

  // Words from the service
  socket.addEventListener("message", (event: MessageEvent) => {
    // Read
    const message = parseStreamingMessage(event.data);
    // Only turns
    if (message?.type !== "Turn") return;
    // Your turn: its words, and the end when the service says so
    if (turn) {
      // Taken in
      turn.words = applyTurn(turn.words, message);
      // Shown
      turn.onText(turnText(turn.words));
      // The end of a turn with words in it ends yours
      if (message.end_of_turn) {
        // A Done tap waiting for it
        waiting?.();
        // Ended by the service
        if (turnTranscript(turn.words) !== "") events.onEndOfTurn();
      }
      // Nothing more
      return;
    }
    // Not your turn: kept, so a turn started by talking over the persona keeps its first words
    between = applyTurn(between, message);
    // Talking over the persona with real words (not "mm-hm"), with headphones on
    if (mode === "barge" && !message.end_of_turn && !onlyListening(message.transcript)) events.onBargeIn(message.transcript);
  });
  // Closed by itself
  socket.addEventListener("close", () => {
    // Already closed by us
    if (closed) return;
    // Closed
    shutDown(false);
    // Said (the conversation ends a turn under way with what was heard, and carries on with turns ending on the phone)
    events.onDropped("closed");
  });
  // An error
  socket.addEventListener("error", () => {
    // Already closed by us
    if (closed) return;
    // Closed
    shutDown(false);
    // Said
    events.onDropped("error");
  });

  // The microphone, sent as PCM (or silence of the same length)
  try {
    // Started
    stopAudio = await startAudio((samples, rate) => {
      // Not once closed or before the socket is open
      if (closed || socket.readyState !== 1) return;
      // At 16 kHz, as 16-bit numbers; silence when not listening
      const pcm = mode === "silence" ? new Int16Array(Math.floor((samples.length * STREAMING_SAMPLE_RATE) / rate)) : toPcm16(downsample(samples, rate));
      // Sent in chunks of at least 100 ms
      for (const chunk of chunks.push(pcm)) socket.send(chunk);
    });
  } catch (error) {
    // Closed
    shutDown(true);
    // Failed
    throw error;
  }

  // What the conversation uses
  return {
    // A transcriber for one turn of yours
    turnTranscriber: () => ({
      // Start: keep the words already going (you may have started by talking over the persona)
      start(onText) {
        // The turn (a dropped socket is said through onDropped, not as a recording problem)
        turn = { words: startTurnWords(between), onText };
        // Nothing kept between turns now
        between = startTurnWords();
        // What is there already, shown
        onText(turnText(turn.words));
      },
      // Stop: if the service's turn is still going, ask it to end now and wait a moment for the last words
      async stop(maxWaitMs = FORCE_WAIT_MS) {
        // The turn
        const current = turn;
        // None
        if (!current) return "";
        // Still going: end it now
        if (!current.words.ended && !closed && socket.readyState === 1) {
          // Asked to end
          socket.send(FORCE_ENDPOINT);
          // Wait for the end, or give up after a moment
          await new Promise<void>((resolve) => {
            // Give up
            const timer = setTimeout(resolve, maxWaitMs);
            // Or the end
            waiting = () => {
              // No longer waiting
              clearTimeout(timer);
              // (once)
              waiting = null;
              // Done
              resolve();
            };
          });
        }
        // No longer your turn
        turn = null;
        // Every word of it
        return turnTranscript(current.words);
      },
    }),
    // What to send now
    setMode(next) {
      // Kept
      mode = next;
    },
    // Close, ending the session cleanly
    async close() {
      // Seconds open
      return shutDown(true);
    },
  };
}
