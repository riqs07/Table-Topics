// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load the client being checked
import { nextLines } from "@/data/conversationClient";
// Load the turn type
import type { ConversationTurn } from "@/data/records";

// Maya opened, you answered
const TURNS: ConversationTurn[] = [{ who: "them", text: "Hi! I'm Maya.", lineId: "maya-01", seconds: 3 }, { who: "you", text: "Hi, I'm Sam", seconds: 2 }];

// Group the checks about asking for the next lines (decision 83)
describe("nextLines", () => {
  // Your words and their line ids are sent, never their words; the ids come back
  it("sends your words and their ids, and hands back the ids", async () => {
    // A network answering with two ids
    const network = vi.fn(async () => Response.json({ lineIds: ["maya-16", "maya-07"] }));
    // Ask
    const ids = await nextLines("maya", TURNS, false, { passphrase: "secret", fetchFn: network });
    // What was sent
    const body = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body)) as unknown;
    // The ids, and the body
    expect([ids, body]).toEqual([["maya-16", "maya-07"], { characterId: "maya", wrapUp: false, turns: [{ who: "them", lineId: "maya-01" }, { who: "you", text: "Hi, I'm Sam" }] }]);
  });

  // No passphrase, a refusal, a strange reply, or no network all hand back nothing
  it("hands back nothing when it cannot get the lines", async () => {
    // No passphrase
    const none = await nextLines("maya", TURNS, false, { passphrase: "", fetchFn: vi.fn() });
    // Refused
    const refused = await nextLines("maya", TURNS, false, { passphrase: "secret", fetchFn: vi.fn(async () => new Response("{}", { status: 502 })) });
    // A strange reply
    const strange = await nextLines("maya", TURNS, false, { passphrase: "secret", fetchFn: vi.fn(async () => Response.json({ lineIds: [1, 2] })) });
    // Offline
    const offline = await nextLines("maya", TURNS, false, { passphrase: "secret", fetchFn: vi.fn(async () => { throw new TypeError("offline"); }) });
    // All nothing
    expect([none, refused, strange, offline]).toEqual([null, null, null, null]);
  });
});
