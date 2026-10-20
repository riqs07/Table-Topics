// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load the client being checked
import { nextLine, type LineRequest } from "@/data/conversationClient";

// Theo opened in the meeting, you answered
const REQUEST: LineRequest = { personaId: "theo", scenarioId: "meeting", twist: 1, stage: "talk", heard: true, turns: [{ who: "them", text: "Hey.", seconds: 1 }, { who: "you", text: "Hi, I'm Sam", seconds: 2 }] };

// Group the checks about asking for the next line (decision 84)
describe("nextLine", () => {
  // The words of each turn are sent, never their lengths or audio; the words, audio and goodbye come back
  it("sends the turns' words, and hands back the line with its audio", async () => {
    // A network answering with a line and three bytes of audio
    const network = vi.fn(async () => Response.json({ text: "Oh, hi.", audio: "AQID", goodbye: false }));
    // Ask
    const line = await nextLine(REQUEST, { passphrase: "secret", fetchFn: network });
    // What was sent
    const body = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body)) as unknown;
    // The body, the words, the audio's bytes and type, and the goodbye
    expect([body, line?.text, new Uint8Array(await line!.audio!.arrayBuffer()), line?.audio?.type, line?.goodbye]).toEqual([{ personaId: "theo", scenarioId: "meeting", twist: 1, stage: "talk", heard: true, turns: [{ who: "them", text: "Hey." }, { who: "you", text: "Hi, I'm Sam" }] }, "Oh, hi.", new Uint8Array([1, 2, 3]), "audio/mpeg", false]);
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
    const body = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body)) as { turns: Array<{ text: string }> };
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
});
