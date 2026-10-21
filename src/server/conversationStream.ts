// Streams a persona's line (decision 102): reads the writer's words as they come, cuts the first sentence off as soon as it is complete and has it spoken at once, and has the rest spoken as soon as the writer finishes, so the phone can start playing before the whole line exists. If the writer stops part-way, the first sentence stands as the line; if the voice fails for a piece, that piece comes without audio (the phone's own voice says it)

// Load the line tidier
import { cleanLine } from "@/core/conversationTurn";
// Load the streaming helpers
import { firstPiece, firstSentenceEnd, readStreamed, restAfter, type LinePiece, type StreamEvent } from "@/core/conversationStream";

// What the writer streams: pieces of text, then the end (declined when the model refused)
export type WriterEvent = { type: "text"; text: string } | { type: "end"; declined: boolean };

// How long each step took, in milliseconds from the start (durations only, never words)
export interface StreamTiming {
  // Until the first sentence (or the whole line) was ready
  writerFirstMs: number | null;
  // Until the writer finished
  writerMs: number | null;
  // Until the first piece's audio was ready
  voiceFirstMs: number | null;
  // Until the last event was sent
  totalMs: number | null;
}

// How a streamed line starts
export type StreamStart =
  // The model declined
  | { kind: "declined" }
  // The writer failed before the first sentence
  | { kind: "failed"; reason: string }
  // Nothing usable was written
  | { kind: "empty" }
  // The first piece and its audio are ready; the rest follows from events()
  | { kind: "ready"; goodbye: boolean; timing: StreamTiming; events: () => AsyncGenerator<StreamEvent> };

// What the stream needs: the writer's events, a voice (base64 MP3 for some words, or null; it never throws), a clock, and where to log
export interface StreamParts {
  // The writer's events
  events: AsyncIterable<WriterEvent>;
  // Speak some words
  speak: (spoken: string) => Promise<string | null>;
  // Milliseconds now
  now: () => number;
  // Log a line (durations and reasons only)
  log: (line: string) => void;
}

// What the rest of the writing produced
interface Remainder {
  // The line's body in full (or as far as it got)
  body: string;
  // Whether it stopped early (a failure or a decline part-way)
  broken: boolean;
}

// Start streaming a line: read until the first sentence is ready and spoken, then hand back the rest as events
export async function startStreamedLine({ events, speak, now, log }: StreamParts): Promise<StreamStart> {
  // When it started
  const started = now();
  // The timings
  const timing: StreamTiming = { writerFirstMs: null, writerMs: null, voiceFirstMs: null, totalMs: null };
  // The writer's events, one at a time
  const iterator = events[Symbol.asyncIterator]();
  // The text so far
  let buffer = "";
  // The first piece, once cut
  let first: LinePiece | null = null;
  // Whether the writer has finished
  let ended = false;
  // Whether a first sentence is too long to say on its own, so the whole line is waited for
  let noEarlyCut = false;
  // Read until the first piece is ready or the writer ends
  while (first === null && !ended) {
    // The next event
    let next: IteratorResult<WriterEvent>;
    // The writer can fail
    try {
      // Read it
      next = await iterator.next();
    } catch (error) {
      // Failed before anything could be said
      return { kind: "failed", reason: (error as Error).message };
    }
    // The writer finished without an end event
    if (next.done) {
      // Ended
      ended = true;
      // Nothing more
      break;
    }
    // A decline, or the end
    if (next.value.type === "end") {
      // Declined
      if (next.value.declined) return { kind: "declined" };
      // Ended
      ended = true;
      // Nothing more
      break;
    }
    // More words
    buffer += next.value.text;
    // Read so far
    const read = readStreamed(buffer);
    // The header still coming, or no early cut wanted
    if (!read.ready || noEarlyCut) continue;
    // The first sentence's end, if complete
    const end = firstSentenceEnd(read.body);
    // Not yet
    if (end === null) continue;
    // The piece, checked
    first = firstPiece(read.body, end);
    // Too long to say alone: wait for the whole line
    if (first === null) noEarlyCut = true;
  }
  // The header and body so far
  const read = readStreamed(buffer);
  // Ended before a first piece was cut: the whole line is the first piece
  if (first === null) {
    // Tidied
    const whole = cleanLine(read.body);
    // Nothing to say
    if (!whole.shown) return { kind: "empty" };
    // The whole line
    first = whole;
  }
  // The first piece is ready
  timing.writerFirstMs = now() - started;
  // The first piece, fixed
  const opening: LinePiece = first;
  // Read the rest of the writing in the background (never fails: a failure part-way keeps what came)
  const remaining: Promise<Remainder> = ended ? Promise.resolve({ body: read.body, broken: false }) : (async () => {
    // The text so far
    let text = buffer;
    // Read on
    try {
      // Each event
      for (;;) {
        // The next
        const next = await iterator.next();
        // Finished
        if (next.done) break;
        // The end: a decline part-way breaks the line off
        if (next.value.type === "end") {
          // Declined part-way: keep only the first piece
          if (next.value.declined) {
            // Logged
            log("Conversation line declined part-way; the first sentence stands.");
            // Broken off
            return { body: readStreamed(text).body, broken: true };
          }
          // Done
          break;
        }
        // More words
        text += next.value.text;
      }
    } catch (error) {
      // Logged, never the words
      log(`Conversation line stopped part-way: ${(error as Error).message}`);
      // Broken off
      return { body: readStreamed(text).body, broken: true };
    }
    // The whole body
    return { body: readStreamed(text).body, broken: false };
  })();
  // When the writer finished
  void remaining.then(() => {
    // Noted
    timing.writerMs = now() - started;
  });
  // The rest to say, worked out as soon as the writing is complete, and its audio started at once
  const restPlan = remaining.then(async (rest) => {
    // Broken off, or the line was the first piece: nothing more
    if (rest.broken || ended) return null;
    // The rest after the first piece, checked with the whole line
    const piece = restAfter(cleanLine(rest.body), opening);
    // Nothing more
    if (!piece) return null;
    // Spoken
    return { piece, audio: await speak(piece.spoken) };
  });
  // The first piece's audio
  const firstAudio = await speak(opening.spoken);
  // Ready
  timing.voiceFirstMs = now() - started;
  // The goodbye header, as far as it was read
  const goodbye = read.goodbye;
  // The events to send
  async function* stream(): AsyncGenerator<StreamEvent> {
    // The first piece at once
    yield { type: "segment", index: 0, text: opening.shown, audio: firstAudio };
    // The rest, when ready
    const rest = await restPlan;
    // Sent
    if (rest) yield { type: "segment", index: 1, text: rest.piece.shown, audio: rest.audio };
    // The end: everything said, and whether it ends the conversation
    yield { type: "done", text: rest ? `${opening.shown} ${rest.piece.shown}` : opening.shown, goodbye };
    // Finished
    timing.totalMs = now() - started;
  }
  // Ready
  return { kind: "ready", goodbye, timing, events: stream };
}
