// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load the listener being checked
import { openLiveListener, type LiveEvents } from "@/audio/liveListener";

// A stand-in socket: notes what was sent, and lets the check play the server
class FakeSocket {
  // Open at once (1), closed (3)
  readyState = 1;
  // Set by the listener
  binaryType = "blob";
  // What was sent
  sent: Array<string | ArrayBufferView> = [];
  // How it was closed
  closedWith: number | null = null;
  // Listeners by type
  private listeners = new Map<string, Array<(event: unknown) => void>>();
  // Remember the address
  constructor(readonly url: string) {}
  // Add a listener
  addEventListener(type: string, listener: (event: unknown) => void) {
    // Kept
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  // Send
  send(data: string | ArrayBufferView) {
    // Noted
    this.sent.push(data);
  }
  // Close
  close(code: number) {
    // Noted
    this.closedWith = code;
    // Closed
    this.readyState = 3;
  }
  // The server sends a message
  serverSays(message: unknown) {
    // To each message listener
    for (const listener of this.listeners.get("message") ?? []) listener({ data: JSON.stringify(message) });
  }
  // The server closes
  serverCloses() {
    // Closed
    this.readyState = 3;
    // To each close listener
    for (const listener of this.listeners.get("close") ?? []) listener({ code: 1006 });
  }
  // The text messages sent
  texts(): string[] {
    // Only text
    return this.sent.filter((item): item is string => typeof item === "string");
  }
  // The audio chunks sent
  chunks(): Int16Array[] {
    // Only audio
    return this.sent.filter((item): item is Int16Array => item instanceof Int16Array);
  }
}

// Events that note what happened
function noting(): LiveEvents & { seen: string[] } {
  // What happened
  const seen: string[] = [];
  // The events
  return {
    // Noted
    seen,
    // Turn ended
    onEndOfTurn: () => void seen.push("end"),
    // Talked over
    onBargeIn: (words) => void seen.push(`barge:${words}`),
    // Dropped
    onDropped: (why) => void seen.push(`dropped:${why}`),
  };
}

// Open a listener with a stand-in socket and microphone; the session begins at once unless told otherwise
async function open(options: { begin?: boolean; timeoutMs?: number; audioFails?: boolean } = {}) {
  // The socket made
  let socket: FakeSocket | null = null;
  // The microphone's feed, once started
  const mic: { feed: ((samples: Float32Array, rate: number) => void) | null; stopped: boolean } = { feed: null, stopped: false };
  // The events
  const events = noting();
  // A clock
  let time = 1_000;
  // Opening
  const opening = openLiveListener({
    // The token
    token: "tok",
    // The events
    events,
    // The stand-in socket, beginning a moment later
    createSocket: (url) => {
      // Made
      socket = new FakeSocket(url);
      // The session begins
      if (options.begin !== false) queueMicrotask(() => socket!.serverSays({ type: "Begin", id: "s1", expires_at: 0 }));
      // Handed over
      return socket as unknown as WebSocket;
    },
    // The stand-in microphone
    startAudio: async (onSamples) => {
      // Failing
      if (options.audioFails) throw new DOMException("denied", "NotAllowedError");
      // Kept
      mic.feed = onSamples;
      // How to stop
      return () => {
        // Stopped
        mic.stopped = true;
      };
    },
    // The clock, moved by the check
    now: () => time,
    // A short wait
    connectTimeoutMs: options.timeoutMs ?? 1_000,
  });
  // Opened
  const live = await opening;
  // Everything the check needs
  return { live, socket: socket! as FakeSocket, mic, events, advance: (ms: number) => void (time += ms) };
}

// Group the checks on the live listener (decision 119)
describe("live listener", () => {
  // Silence while not listening, the microphone on your turn, in chunks of 1,600 samples
  it("sends silence until your turn, then the microphone", async () => {
    // Opened
    const { live, socket, mic } = await open();
    // A loud batch while not listening
    mic.feed!(new Float32Array(1_600).fill(0.5), 16_000);
    // Your turn
    live.setMode("listen");
    // A loud batch
    mic.feed!(new Float32Array(1_600).fill(0.5), 16_000);
    // The first chunk all silence, the second loud
    expect(socket.chunks().map((chunk) => [chunk.length, chunk[0]])).toEqual([[1_600, 0], [1_600, 16384]]);
  });

  // The address has the token; a 48 kHz microphone is brought down to 16 kHz
  it("connects with the token and downsamples", async () => {
    // Opened
    const { live, socket, mic } = await open();
    // Listening
    live.setMode("listen");
    // 4,800 samples at 48 kHz
    mic.feed!(new Float32Array(4_800).fill(0.25), 48_000);
    // One chunk of 1,600
    expect([new URL(socket.url).searchParams.get("token"), socket.binaryType, socket.chunks().map((chunk) => chunk.length)]).toEqual(["tok", "arraybuffer", [1_600]]);
  });

  // A turn's words arrive, and the service's end of turn ends it
  it("reads your turn's words and ends it when the service says so", async () => {
    // Opened
    const { live, socket, events } = await open();
    // A turn
    const transcriber = live.turnTranscriber();
    // Words shown
    const shown: Array<{ final: string; interim: string }> = [];
    // Started
    transcriber.start((text) => void shown.push(text), () => undefined);
    // Partial, then the end
    socket.serverSays({ type: "Turn", turn_order: 0, transcript: "I went climbing", end_of_turn: false, words: [] });
    // (the end)
    socket.serverSays({ type: "Turn", turn_order: 0, transcript: "I went climbing on Saturday", end_of_turn: true, words: [] });
    // Stopped: no need to ask again
    const transcript = await transcriber.stop(500);
    // The words, the end, and no ForceEndpoint sent
    expect([transcript, events.seen, shown.at(-1), socket.texts()]).toEqual(["I went climbing on Saturday", ["end"], { final: "I went climbing on Saturday", interim: "" }, []]);
  });

  // An end of turn with no words does not end yours
  it("ignores an empty end of turn", async () => {
    // Opened
    const { live, socket, events } = await open();
    // A turn
    live.turnTranscriber().start(() => undefined, () => undefined);
    // An empty end
    socket.serverSays({ type: "Turn", turn_order: 0, transcript: "", end_of_turn: true, words: [] });
    // Nothing
    expect(events.seen).toEqual([]);
  });

  // Done mid-sentence asks the service to end the turn now and waits for the last words
  it("forces the end of the turn on Done and waits for the last words", async () => {
    // Opened
    const { live, socket } = await open();
    // A turn
    const transcriber = live.turnTranscriber();
    // Started
    transcriber.start(() => undefined, () => undefined);
    // Partial words
    socket.serverSays({ type: "Turn", turn_order: 0, transcript: "so anyway", end_of_turn: false, words: [] });
    // Stopping
    const stopping = transcriber.stop(2_000);
    // The service ends it
    socket.serverSays({ type: "Turn", turn_order: 0, transcript: "so anyway yes", end_of_turn: true, words: [] });
    // The last words, and the request sent
    expect([await stopping, socket.texts()]).toEqual(["so anyway yes", [JSON.stringify({ type: "ForceEndpoint" })]]);
  });

  // The service never answering the Done: the words so far after the wait (stand-ins must be able to hang, T2)
  it("gives up waiting after the limit", async () => {
    // Fake timers for the wait
    vi.useFakeTimers();
    // Opened (the begin arrives by microtask)
    const { live, socket } = await open();
    // A turn
    const transcriber = live.turnTranscriber();
    // Started
    transcriber.start(() => undefined, () => undefined);
    // Partial
    socket.serverSays({ type: "Turn", turn_order: 0, transcript: "half a", end_of_turn: false, words: [] });
    // Stopping
    const stopping = transcriber.stop(1_500);
    // The wait passes
    await vi.advanceTimersByTimeAsync(1_600);
    // What was heard
    expect(await stopping).toBe("half a");
    // Real timers again
    vi.useRealTimers();
  });

  // Headphones: real words over the persona stop them; listening sounds and other modes do not
  it("notices you talking over the persona only with headphones and real words", async () => {
    // Opened
    const { live, socket, events } = await open();
    // Not barging: words ignored
    socket.serverSays({ type: "Turn", turn_order: 0, transcript: "hang on", end_of_turn: false, words: [] });
    // Headphones on while they talk
    live.setMode("barge");
    // A listening sound, then words
    socket.serverSays({ type: "Turn", turn_order: 1, transcript: "mm-hm", end_of_turn: false, words: [] });
    // (words)
    socket.serverSays({ type: "Turn", turn_order: 1, transcript: "wait that reminds me", end_of_turn: false, words: [] });
    // Then your turn keeps those words
    const transcriber = live.turnTranscriber();
    // The words shown at the start
    const shown: string[] = [];
    // Started
    transcriber.start((text) => void shown.push(text.interim), () => undefined);
    // Only the real words barged in, and the turn starts with them
    expect([events.seen, shown]).toEqual([["barge:wait that reminds me"], ["wait that reminds me"]]);
  });

  // Closing ends the session cleanly, lets the microphone go, and reports the seconds open
  it("closes cleanly and reports the seconds open", async () => {
    // Opened
    const { live, socket, mic, advance } = await open();
    // 42 seconds later
    advance(42_000);
    // Closed
    const seconds = await live.close();
    // Terminate sent, closed normally, microphone let go, 42 s
    expect([socket.texts(), socket.closedWith, mic.stopped, seconds]).toEqual([[JSON.stringify({ type: "Terminate" })], 1000, true, 42]);
  });

  // The server closing by itself says so, and lets the microphone go
  it("says when the socket drops", async () => {
    // Opened
    const { socket, mic, events } = await open();
    // Dropped
    socket.serverCloses();
    // Said, and let go
    expect([events.seen, mic.stopped]).toEqual([["dropped:closed"], true]);
  });

  // The session never beginning: a failure, and the socket closed (never left open and billed)
  it("fails when the session does not begin in time", async () => {
    // Fake timers
    vi.useFakeTimers();
    // Opening, with no begin
    const opening = open({ begin: false, timeoutMs: 2_000 });
    // Caught as it happens
    const failed = expect(opening).rejects.toThrow("The live session did not begin in time.");
    // The wait passes
    await vi.advanceTimersByTimeAsync(2_100);
    // Failed
    await failed;
    // Real timers again
    vi.useRealTimers();
  });

  // The server refusing at the start: a failure with its words
  it("fails when the service refuses", async () => {
    // The socket made
    let made: FakeSocket | null = null;
    // Opening
    const opening = openLiveListener({ token: "tok", events: noting(), createSocket: (url) => {
      // Made
      made = new FakeSocket(url);
      // Refused
      queueMicrotask(() => made!.serverSays({ type: "Error", error: "Invalid token" }));
      // Handed over
      return made as unknown as WebSocket;
    }, startAudio: async () => () => undefined });
    // Failed with the reason
    await expect(opening).rejects.toThrow("Invalid token");
  });

  // The microphone refused: a failure, and the socket closed at once
  it("closes the socket when the microphone fails", async () => {
    // The socket made
    let made: FakeSocket | null = null;
    // Opening
    const opening = openLiveListener({ token: "tok", events: noting(), createSocket: (url) => {
      // Made
      made = new FakeSocket(url);
      // Begun
      queueMicrotask(() => made!.serverSays({ type: "Begin", id: "s1" }));
      // Handed over
      return made as unknown as WebSocket;
    }, startAudio: async () => { throw new DOMException("denied", "NotAllowedError"); } });
    // Failed
    await expect(opening).rejects.toThrow("denied");
    // Closed
    expect((made as FakeSocket | null)?.closedWith).toBe(1000);
  });
});
