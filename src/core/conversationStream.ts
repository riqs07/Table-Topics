// A persona's line streamed sentence by sentence (decision 102): the writer's plain-text format, cutting the first sentence early so its voice can start while the rest is written, and the newline-separated JSON the route sends the phone. Pure, so the cuts and the parsing are tested on their own

// Load the line tidier, so every piece keeps the same checks as a whole line
import { LONGEST_LINE, cleanLine } from "@/core/conversationTurn";

// How many characters to wait for a header before treating the reply as a line without one
const HEADER_WAIT = 24;
// The fewest words a first sentence needs before it is cut off and spoken on its own (a lone "Oh." is better said with what follows)
const FIRST_SENTENCE_WORDS = 3;

// What the writer has written so far, read: whether the header is known, whether it says goodbye, and the line's words
export interface StreamedText {
  // Whether the header has been read (or given up on)
  ready: boolean;
  // Whether the line ends the conversation
  goodbye: boolean;
  // The line so far, unchecked
  body: string;
}

// Read the writer's text so far: the "goodbye: yes/no" header, then the line. A reply without the header is read as a line that does not say goodbye
export function readStreamed(buffer: string): StreamedText {
  // Without spaces in front
  const text = buffer.replace(/^\s+/, "");
  // The header, once its line is complete
  const header = /^goodbye:\s*(yes|no)\b[^\n]*\n/i.exec(text);
  // Read
  if (header) return { ready: true, goodbye: header[1]!.toLowerCase() === "yes", body: text.slice(header[0].length) };
  // Still possibly a header on its way
  if (/^g(o(o(d(b(y(e(:[^\n]*)?)?)?)?)?)?)?$/i.test(text) && text.length < HEADER_WAIT) return { ready: false, goodbye: false, body: "" };
  // A header with no line after it yet
  if (/^goodbye:/i.test(text) && !text.includes("\n")) return { ready: false, goodbye: false, body: "" };
  // No header: the whole text is the line
  return { ready: true, goodbye: false, body: text };
}

// Where the first sentence ends in a line still being written: after its full stop, question or exclamation mark, once more text follows; null until then
export function firstSentenceEnd(body: string): number | null {
  // Whether inside a [direction]
  let bracket = false;
  // Each character
  for (let index = 0; index < body.length; index += 1) {
    // The character
    const character = body[index]!;
    // A direction opens
    if (character === "[") bracket = true;
    // A direction closes
    else if (character === "]") bracket = false;
    // A sentence end outside a direction, followed by a space and more
    else if (!bracket && /[.!?…]/.test(character) && /\s/.test(body[index + 1] ?? "") && body.slice(index + 1).trim() !== "") {
      // The sentence's words, without directions
      const words = body.slice(0, index + 1).replace(/\[[^\]]*\]/g, " ").trim().split(/\s+/).filter(Boolean);
      // Long enough to say on its own
      if (words.length >= FIRST_SENTENCE_WORDS) return index + 1;
    }
  }
  // Not yet
  return null;
}

// One piece of a line to speak: the words with directions (for the voice) and without (for the screen)
export interface LinePiece {
  // With directions
  spoken: string;
  // Without
  shown: string;
}

// The first sentence, checked like a whole line, or null when it should not be said on its own (too long, or nothing left once tidied)
export function firstPiece(body: string, end: number): LinePiece | null {
  // The sentence as written
  const sentence = body.slice(0, end);
  // Longer than a whole line may be: wait for the whole line, which the length check cuts at a sentence
  if (sentence.length > LONGEST_LINE) return null;
  // Tidied
  const piece = cleanLine(sentence);
  // Said on its own, unless nothing is left to show
  return piece.shown ? piece : null;
}

// The rest of a whole line after the first piece already spoken, checked with the whole line, or null when nothing is left (or the two do not line up, so nothing is said twice)
export function restAfter(whole: LinePiece, first: LinePiece): LinePiece | null {
  // The whole line must start with what was said
  if (!whole.spoken.startsWith(first.spoken)) return null;
  // What follows
  const spoken = whole.spoken.slice(first.spoken.length).trim();
  // Nothing
  if (!spoken) return null;
  // Its words for the screen
  const shown = spoken.replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
  // Only directions left: nothing to say
  return shown ? { spoken, shown } : null;
}

// What the route streams to the phone, one JSON object per line
export type StreamEvent =
  // A piece of the line, with its audio in the persona's voice as base64 MP3 (null: the phone's own voice says it)
  | { type: "segment"; index: number; text: string; audio: string | null }
  // The end: the whole line's words and whether it ends the conversation
  | { type: "done"; text: string; goodbye: boolean };

// The content type of the stream
export const STREAM_CONTENT_TYPE = "application/x-ndjson";

// One event as a line of the stream
export function encodeEvent(event: StreamEvent): string {
  // JSON and a newline
  return `${JSON.stringify(event)}\n`;
}

// Split text that arrived into whole lines and what is left over (part of a line still arriving)
export function splitLines(pending: string): { lines: string[]; rest: string } {
  // The pieces
  const parts = pending.split("\n");
  // The last is unfinished
  const rest = parts.pop() ?? "";
  // The whole lines, without blanks
  return { lines: parts.filter((line) => line.trim() !== ""), rest };
}

// Read one line of the stream as an event, or null when it is not one
export function decodeEvent(line: string): StreamEvent | null {
  // Parsing can fail
  try {
    // The object
    const value = JSON.parse(line) as Record<string, unknown>;
    // A piece
    if (value.type === "segment" && typeof value.index === "number" && typeof value.text === "string" && (typeof value.audio === "string" || value.audio === null)) return { type: "segment", index: value.index, text: value.text, audio: value.audio };
    // The end
    if (value.type === "done" && typeof value.text === "string" && typeof value.goodbye === "boolean") return { type: "done", text: value.text, goodbye: value.goodbye };
    // Anything else
    return null;
  } catch {
    // Not JSON
    return null;
  }
}
