// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the pieces being checked
import { ChunkCollector, applyTurn, downsample, onlyListening, parseStreamingMessage, startTurnWords, streamingUrl, toPcm16, turnText, turnTranscript } from "@/core/liveStreaming";

// Group the checks on the streaming protocol's pure parts (decision 119)
describe("live streaming protocol", () => {
  // The address carries the token, the format, the model and the patient turn settings
  it("builds the socket address with every setting", () => {
    // The address
    const url = new URL(streamingUrl("tok"));
    // Each part
    expect([url.origin + url.pathname, Object.fromEntries(url.searchParams)]).toEqual(["wss://streaming.assemblyai.com/v3/ws", { token: "tok", sample_rate: "16000", encoding: "pcm_s16le", speech_model: "universal-streaming-english", end_of_turn_confidence_threshold: "0.6", min_turn_silence: "560", max_turn_silence: "2400", format_turns: "false" }]);
  });

  // Averaging 48 kHz down to 16 kHz keeps a third of the samples, each the mean of three
  it("downsamples by averaging", () => {
    // Six samples at 48 kHz
    const out = downsample(new Float32Array([0, 0.3, 0.6, 1, 1, 1]), 48_000);
    // Two at 16 kHz
    expect(Array.from(out).map((value) => Math.round(value * 100) / 100)).toEqual([0.3, 1]);
  });

  // Already at 16 kHz: unchanged
  it("leaves 16 kHz samples alone", () => {
    // The same array
    const samples = new Float32Array([0.1, 0.2]);
    // Untouched
    expect(downsample(samples, 16_000)).toBe(samples);
  });

  // The ends of the range and beyond are clipped
  it("turns samples into 16-bit numbers, clipping the ends", () => {
    // Full scale both ways, silence, and beyond
    expect(Array.from(toPcm16(new Float32Array([1, -1, 0, 2, -3, 0.5])))).toEqual([32767, -32768, 0, 32767, -32768, 16384]);
  });

  // Chunks of at least 100 ms, the rest kept for later
  it("sends chunks of 1,600 samples", () => {
    // A collector
    const collector = new ChunkCollector();
    // 1,000 then 2,500 samples
    const [first, second] = [collector.push(new Int16Array(1_000)), collector.push(new Int16Array(2_500))];
    // None, then two full chunks (300 left over)
    expect([first.length, second.map((chunk) => chunk.length)]).toEqual([0, [1_600, 1_600]]);
  });

  // The service's messages are read; anything else is ignored
  it("reads the server's messages and ignores the rest", () => {
    // A begin, a turn, a heartbeat, broken JSON and binary
    expect([parseStreamingMessage(JSON.stringify({ type: "Begin", id: "s1", expires_at: 1 }))?.type, parseStreamingMessage(JSON.stringify({ type: "Turn", turn_order: 0, transcript: "hi", end_of_turn: false, end_of_turn_confidence: 0.1, words: [] }))?.type, parseStreamingMessage(JSON.stringify({ type: "Heartbeat" })), parseStreamingMessage("{"), parseStreamingMessage(new ArrayBuffer(2))]).toEqual(["Begin", "Turn", null, null, null]);
  });

  // A turn of yours spanning two of the service's turns keeps both, a repeated end is not added twice
  it("keeps one turn's words across the service's turns", () => {
    // Words arriving
    let state = startTurnWords();
    // Partial, ended, a repeat of the end, then a new partial
    state = applyTurn(state, { turn_order: 0, transcript: "I went", end_of_turn: false });
    // (ended)
    state = applyTurn(state, { turn_order: 0, transcript: "I went climbing", end_of_turn: true });
    // (repeat)
    state = applyTurn(state, { turn_order: 0, transcript: "I went climbing", end_of_turn: true });
    // (new partial)
    state = applyTurn(state, { turn_order: 1, transcript: "on Saturday", end_of_turn: false });
    // Settled and still going, and the whole
    expect([turnText(state), turnTranscript(state), state.ended]).toEqual([{ final: "I went climbing", interim: "on Saturday" }, "I went climbing on Saturday", false]);
  });

  // Starting a turn keeps words still going (you talked over them), but not a finished turn's
  it("starts a turn with the words still going", () => {
    // Still going
    const going = applyTurn(startTurnWords(), { turn_order: 3, transcript: "wait actually", end_of_turn: false });
    // Finished
    const finished = applyTurn(startTurnWords(), { turn_order: 3, transcript: "yeah", end_of_turn: true });
    // Kept; not kept
    expect([turnTranscript(startTurnWords(going)), turnTranscript(startTurnWords(finished))]).toEqual(["wait actually", ""]);
  });

  // Listening sounds do not count as talking over someone
  it("tells listening sounds from real words", () => {
    // Sounds, and words
    expect([onlyListening("mm-hm"), onlyListening("Yeah, right."), onlyListening(""), onlyListening("wait that's not"), onlyListening("yeah yeah yeah yeah")]).toEqual([true, true, true, false, false]);
  });
});
