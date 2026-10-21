// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load the client being checked
import { conversationMinutes, isRefusal, nextLine, type LineRequest, type LineSegment, type WrittenLine } from "@/data/conversationClient";
// Load the stream's line format
import { encodeEvent, type StreamEvent } from "@/core/conversationStream";

// Theo opened in the meeting, you answered
const REQUEST: LineRequest = { personaId: "theo", scenarioId: "meeting", twist: 1, stage: "talk", heard: true, turns: [{ who: "them", text: "Hey.", seconds: 1 }, { who: "you", text: "Hi, I'm Sam", seconds: 2 }], conversationId: "c0ffee00-1234", elapsedSec: 42.5 };

// A streamed reply made of the given events, sent in chunks of the given size; broken off with an error after them when asked
function streamed(events: StreamEvent[], options: { chunk?: number; breakAfter?: boolean } = {}): Response {
  // The whole text
  const text = events.map(encodeEvent).join("");
  // As bytes
  const bytes = new TextEncoder().encode(text);
  // The size of each chunk
  const size = options.chunk ?? 7;
  // Where reading has got to
  let at = 0;
  // The body
  const body = new ReadableStream<Uint8Array>({
    // The next chunk
    pull(controller) {
      // All sent
      if (at >= bytes.length) {
        // Broken off, or ended
        if (options.breakAfter) controller.error(new Error("connection reset"));
        // (ended)
        else controller.close();
        // Nothing more
        return;
      }
      // The next chunk
      controller.enqueue(bytes.slice(at, at + size));
      // Moved on
      at += size;
    },
  });
  // The reply
  return new Response(body, { status: 200, headers: { "content-type": "application/x-ndjson" } });
}

// What a request sent
const sentBody = (network: ReturnType<typeof vi.fn>, call = 0) => JSON.parse(String((network.mock.calls[call] as unknown as [string, RequestInit])[1].body)) as Record<string, unknown>;

// Group the checks about asking for the next line (decisions 84 and 102)
describe("nextLine", () => {
  // The words of each turn are sent, never their lengths or audio; the words, audio and goodbye come back
  it("sends the turns' words, and hands back the line with its audio", async () => {
    // A network answering with a line and three bytes of audio
    const network = vi.fn(async () => Response.json({ text: "Oh, hi.", audio: "AQID", goodbye: false }));
    // Ask, not streamed
    const line = (await nextLine(REQUEST, { passphrase: "secret", fetchFn: network })) as WrittenLine;
    // The body, the words, the audio's bytes and type, and the goodbye
    expect([sentBody(network), line.text, new Uint8Array(await line.audio!.arrayBuffer()), line.audio?.type, line.goodbye]).toEqual([{ personaId: "theo", scenarioId: "meeting", twist: 1, stage: "talk", heard: true, conversationId: "c0ffee00-1234", elapsedSec: 42.5, stream: false, turns: [{ who: "them", text: "Hey." }, { who: "you", text: "Hi, I'm Sam" }] }, "Oh, hi.", new Uint8Array([1, 2, 3]), "audio/mpeg", false]);
  });

  // Regression (decision 86): a fast minute can run past the route's 1,000 characters a turn, so each turn is cut to size before sending (the saved turn keeps every word)
  it("cuts a very long turn to the route's limit", async () => {
    // A network answering with a line
    const network = vi.fn(async () => Response.json({ text: "Oh, hi.", audio: null, goodbye: false }));
    // A turn of about 1,500 characters
    const long = "word ".repeat(300).trim();
    // Ask
    await nextLine({ ...REQUEST, turns: [{ who: "you", text: long, seconds: 60 }] }, { passphrase: "secret", fetchFn: network });
    // What was sent
    const body = sentBody(network) as { turns: Array<{ text: string }> };
    // Within the limit, cut at a whole word
    expect([body.turns[0]!.text.length <= 1_000, body.turns[0]!.text.endsWith("word"), long.length > 1_000]).toEqual([true, true, true]);
  });

  // Words without audio come back with no audio, so the phone's own voice says them
  it("hands back the words alone when there is no audio", async () => {
    // No audio
    const line = await nextLine(REQUEST, { passphrase: "secret", fetchFn: vi.fn(async () => Response.json({ text: "Mm.", audio: null, goodbye: true })) });
    // The words, no audio, a goodbye
    expect(line).toEqual({ text: "Mm.", audio: null, goodbye: true });
  });

  // No passphrase, a refusal, a strange reply, or no network all hand back nothing
  it("hands back nothing when it cannot get a line", async () => {
    // No passphrase
    const none = await nextLine(REQUEST, { passphrase: "", fetchFn: vi.fn() });
    // Refused
    const refused = await nextLine(REQUEST, { passphrase: "secret", fetchFn: vi.fn(async () => new Response("{}", { status: 502 })) });
    // A strange reply
    const strange = await nextLine(REQUEST, { passphrase: "secret", fetchFn: vi.fn(async () => Response.json({ text: 3 })) });
    // Offline
    const offline = await nextLine(REQUEST, { passphrase: "secret", fetchFn: vi.fn(async () => { throw new TypeError("offline"); }) });
    // All nothing
    expect([none, refused, strange, offline]).toEqual([null, null, null, null]);
  });

  // The month's minutes used up, and the conversation's cap, come back as reasons the page explains
  it("says why when the minutes are used up or the cap is reached", async () => {
    // Out of minutes
    const budget = await nextLine(REQUEST, { passphrase: "secret", fetchFn: vi.fn(async () => Response.json({ error: "used up", budget: true }, { status: 429 })) });
    // Past the cap
    const cap = await nextLine(REQUEST, { passphrase: "secret", fetchFn: vi.fn(async () => Response.json({ error: "limit", capped: true }, { status: 409 })) });
    // A plain rate limit is not a reason
    const busy = await nextLine(REQUEST, { passphrase: "secret", fetchFn: vi.fn(async () => Response.json({ error: "Too many requests." }, { status: 429 })) });
    // Each
    expect([budget, cap, busy, isRefusal(budget), isRefusal(busy)]).toEqual([{ refused: "budget" }, { refused: "cap" }, null, true, false]);
  });

  // Streamed: asked for a stream, each piece handed on in order as it arrives (across chunk boundaries), then the whole line
  it("hands on each piece of a streamed line in order", async () => {
    // A network answering with two pieces and the end
    const network = vi.fn(async () => streamed([{ type: "segment", index: 0, text: "No way!", audio: "AQID" }, { type: "segment", index: 1, text: "Where do you climb?", audio: null }, { type: "done", text: "No way! Where do you climb?", goodbye: false }]));
    // The pieces handed on
    const pieces: LineSegment[] = [];
    // Ask
    const line = await nextLine(REQUEST, { passphrase: "secret", fetchFn: network, onSegment: (segment) => pieces.push(segment) });
    // Asked for a stream, the pieces in order with the first's audio, and the whole line marked as already played
    expect([sentBody(network).stream, pieces.map((piece) => [piece.index, piece.text, piece.audio?.type ?? null]), line]).toEqual([true, [[0, "No way!", "audio/mpeg"], [1, "Where do you climb?", null]], { text: "No way! Where do you climb?", audio: null, goodbye: false, streamed: true }]);
  });

  // Broken after a piece: what arrived stands, and nothing is asked again
  it("keeps what arrived when a stream breaks part-way", async () => {
    // A network whose stream breaks after the first piece
    const network = vi.fn(async () => streamed([{ type: "segment", index: 0, text: "No way!", audio: null }], { breakAfter: true }));
    // Ask
    const line = await nextLine(REQUEST, { passphrase: "secret", fetchFn: network, onSegment: () => undefined });
    // The first piece as the line, asked once
    expect([line, network.mock.calls.length]).toEqual([{ text: "No way!", audio: null, goodbye: false, streamed: true }, 1]);
  });

  // Broken before any piece: asked once more without streaming (the fallback), and that whole line comes back
  it("falls back to the whole line when a stream breaks before any piece", async () => {
    // A network whose first stream breaks at once, then answers whole
    const network = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => (JSON.parse(String(init?.body)) as { stream: boolean }).stream ? streamed([], { breakAfter: true }) : Response.json({ text: "Oh, hi.", audio: null, goodbye: false }));
    // Ask
    const line = await nextLine(REQUEST, { passphrase: "secret", fetchFn: network, onSegment: () => undefined });
    // The whole line, asked twice: streamed, then not
    expect([line, [sentBody(network, 0).stream, sentBody(network, 1).stream]]).toEqual([{ text: "Oh, hi.", audio: null, goodbye: false }, [true, false]]);
  });

  // Cancelled ("I wasn't finished"): nothing, and no fallback
  it("hands back nothing when cancelled", async () => {
    // A way to cancel
    const controller = new AbortController();
    // A network that notices the cancel
    const network = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      // Cancelled first
      controller.abort();
      // As fetch does
      if (init?.signal?.aborted) throw new DOMException("aborted", "AbortError");
      // Not reached
      return Response.json({});
    });
    // Ask
    const line = await nextLine(REQUEST, { passphrase: "secret", fetchFn: network, signal: controller.signal, onSegment: () => undefined });
    // Nothing, asked once
    expect([line, network.mock.calls.length]).toEqual([null, 1]);
  });

  // A whole reply to a streamed request (an older server) is read as a line
  it("reads a whole reply to a streamed request", async () => {
    // A network answering whole
    const line = await nextLine(REQUEST, { passphrase: "secret", fetchFn: vi.fn(async () => Response.json({ text: "Oh, hi.", audio: null, goodbye: false })), onSegment: () => undefined });
    // The line
    expect(line).toEqual({ text: "Oh, hi.", audio: null, goodbye: false });
  });
});

// Group the checks about the month's minutes (decision 102)
describe("conversationMinutes", () => {
  // The numbers come back; no passphrase, a refusal, a strange reply or no network give nothing
  it("reads the minutes left", async () => {
    // A network answering with the minutes
    const network = vi.fn(async () => Response.json({ minutesUsed: 30, minutesPerMonth: 150, minutesLeft: 120 }));
    // Each case
    expect([await conversationMinutes("secret", network), await conversationMinutes("", network), await conversationMinutes("secret", vi.fn(async () => new Response("{}", { status: 401 }))), await conversationMinutes("secret", vi.fn(async () => Response.json({ minutesLeft: "lots" }))), await conversationMinutes("secret", vi.fn(async () => { throw new TypeError("offline"); }))]).toEqual([{ minutesUsed: 30, minutesPerMonth: 150, minutesLeft: 120 }, null, null, null, null]);
  });
});
