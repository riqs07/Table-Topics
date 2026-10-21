// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the stream being checked
import { startStreamedLine, type WriterEvent } from "@/server/conversationStream";
// Load the event type
import type { StreamEvent } from "@/core/conversationStream";

// A writer that streams the given pieces in turn, waiting for each gate first when given, then ends (or throws, or declines)
async function* writer(pieces: string[], ending: "end" | "throw" | "decline" = "end", gates: Array<Promise<void> | undefined> = []): AsyncGenerator<WriterEvent> {
  // Each piece
  for (const [index, text] of pieces.entries()) {
    // Wait when asked
    await gates[index];
    // The piece
    yield { type: "text", text };
  }
  // A failure part-way
  if (ending === "throw") throw new Error("connection reset");
  // The end
  yield { type: "end", declined: ending === "decline" };
}

// A voice that notes each piece and returns its words as the "audio"
function voice(said: string[]) {
  // Speak
  return async (spoken: string) => {
    // Noted
    said.push(spoken);
    // The "audio"
    return `audio:${spoken}`;
  };
}

// Read every event of a ready stream
async function collect(start: Awaited<ReturnType<typeof startStreamedLine>>): Promise<StreamEvent[]> {
  // Not ready: nothing
  if (start.kind !== "ready") return [];
  // The events
  const events: StreamEvent[] = [];
  // Each one
  for await (const event of start.events()) events.push(event);
  // All of them
  return events;
}

// A steady clock
const now = () => 0;

// Group the checks about streaming a line (decision 102)
describe("startStreamedLine", () => {
  // Two sentences: the first is spoken before the writer has finished, then the rest, then the end
  it("speaks the first sentence before the writer finishes", async () => {
    // What was spoken, in order, with the moment the writer finished
    const said: string[] = [];
    // Holds the writer's last piece until released
    let release: () => void = () => undefined;
    // (the gate)
    const gate = new Promise<void>((resolve) => { release = resolve; });
    // Start
    const start = await startStreamedLine({ events: writer(["goodbye: no\n[laughs] No way, you climb?", " I tried once", " and fell off."], "end", [undefined, undefined, gate]), speak: voice(said), now, log: () => undefined });
    // The first piece was spoken while the writer still waits
    const spokenBeforeEnd = [...said];
    // Let the writer finish
    release();
    // Every event
    const events = await collect(start);
    // The first audio came before the writer finished; then both pieces and the end in order
    expect([spokenBeforeEnd, events]).toEqual([
      ["[laughs] No way, you climb?"],
      [
        { type: "segment", index: 0, text: "No way, you climb?", audio: "audio:[laughs] No way, you climb?" },
        { type: "segment", index: 1, text: "I tried once and fell off.", audio: "audio:I tried once and fell off." },
        { type: "done", text: "No way, you climb? I tried once and fell off.", goodbye: false },
      ],
    ]);
  });

  // One sentence: one piece, with the goodbye header read
  it("sends a one-sentence goodbye as one piece", async () => {
    // Start
    const start = await startStreamedLine({ events: writer(["goodbye: yes\n", "See you", " Monday!"]), speak: voice([]), now, log: () => undefined });
    // Every event
    expect([start.kind === "ready" && start.goodbye, await collect(start)]).toEqual([true, [{ type: "segment", index: 0, text: "See you Monday!", audio: "audio:See you Monday!" }, { type: "done", text: "See you Monday!", goodbye: true }]]);
  });

  // A failure before the first sentence: nothing can be said, so the route refuses as before
  it("fails when the writer fails before the first sentence", async () => {
    // Start
    const start = await startStreamedLine({ events: writer(["goodbye: no\nOh"], "throw"), speak: voice([]), now, log: () => undefined });
    // Failed, with the reason
    expect(start).toEqual({ kind: "failed", reason: "connection reset" });
  });

  // A failure after the first sentence: the first sentence stands as the line, and the failure is logged without words
  it("keeps the first sentence when the writer fails part-way", async () => {
    // Log lines
    const logged: string[] = [];
    // Start
    const start = await startStreamedLine({ events: writer(["goodbye: no\nOh hi there, I'm Maya.", " I work in"], "throw"), speak: voice([]), now, log: (line) => logged.push(line) });
    // The events
    const events = await collect(start);
    // One piece and the end, and a log line with no words of the line in it
    expect([events.map((event) => event.type), events.at(-1), logged]).toEqual([["segment", "done"], { type: "done", text: "Oh hi there, I'm Maya.", goodbye: false }, ["Conversation line stopped part-way: connection reset"]]);
  });

  // A decline before anything: declined; part-way: the first sentence stands
  it("handles a decline before and after the first sentence", async () => {
    // Before
    const before = await startStreamedLine({ events: writer([], "decline"), speak: voice([]), now, log: () => undefined });
    // After
    const after = await startStreamedLine({ events: writer(["goodbye: no\nOh hi there, I'm Maya.", " And then"], "decline"), speak: voice([]), now, log: () => undefined });
    // Declined, then the first sentence alone
    expect([before.kind, (await collect(after)).at(-1)]).toEqual(["declined", { type: "done", text: "Oh hi there, I'm Maya.", goodbye: false }]);
  });

  // Nothing usable (only directions): empty
  it("says when nothing usable was written", async () => {
    // Start
    const start = await startStreamedLine({ events: writer(["goodbye: no\n[sighs] [made up]"]), speak: voice([]), now, log: () => undefined });
    // Empty
    expect(start.kind).toBe("empty");
  });

  // A voice that gives nothing: pieces without audio (the phone's own voice says them)
  it("sends pieces without audio when the voice gives none", async () => {
    // Start
    const start = await startStreamedLine({ events: writer(["Oh hi there, I'm Maya. Welcome!"]), speak: async () => null, now, log: () => undefined });
    // Every event
    expect((await collect(start)).map((event) => (event.type === "segment" ? event.audio : event.type))).toEqual([null, null, "done"]);
  });

  // The timings are filled in as it goes
  it("records how long each step took", async () => {
    // A clock that moves 10 ms each read
    let time = 0;
    // Start
    const start = await startStreamedLine({ events: writer(["Oh hi there, I'm Maya. Welcome!"]), speak: voice([]), now: () => (time += 10), log: () => undefined });
    // Every event
    await collect(start);
    // All four, rising
    const timing = start.kind === "ready" ? start.timing : null;
    // Present and in order
    expect([timing?.writerFirstMs !== null, (timing?.voiceFirstMs ?? 0) >= (timing?.writerFirstMs ?? 0), (timing?.totalMs ?? 0) >= (timing?.voiceFirstMs ?? 0), timing?.writerMs !== null]).toEqual([true, true, true, true]);
  });
});
