// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the handler being checked
import { createConversationHandler, type ConversationDeps } from "@/server/conversationHandler";
// Load the partner type
import type { ConversationPartner, PickResult } from "@/server/conversationPartner";
// Load the counters
import { MemoryCounterStore } from "@/server/rateLimit";
// Load the turn type
import type { ConversationTurn } from "@/data/records";

// The passphrase the fake server expects
const SECRET = "a long passphrase for testing";

// A fake partner that notes what it was given and answers as told
function fakePartner(result: PickResult | Error): ConversationPartner & { seen: ConversationTurn[][] } {
  // The turns it was given
  const seen: ConversationTurn[][] = [];
  // The partner
  return { seen, async pick(_character, turns) { seen.push([...turns]); if (result instanceof Error) throw result; return result; } };
}

// The handler's dependencies, with fakes
function deps(partner: ConversationPartner): ConversationDeps {
  // Everything the handler needs
  return {
    // Server settings
    readEnv: () => ({ anthropicApiKey: "sk-test", accessSecret: SECRET, counterStore: null }),
    // The partner
    makePartner: () => partner,
    // Counters
    makeCounterStore: () => new MemoryCounterStore(),
    // Generous limits
    limits: { perMinute: 10, perDay: 100, scope: "conversation" },
    // A fixed clock
    now: () => new Date(Date.UTC(2026, 9, 20, 10)),
    // Quiet logs
    log: () => {},
  };
}

// A request for the next lines
function request(body: unknown, passphrase: string | null = SECRET): Request {
  // With or without the passphrase
  return new Request("http://localhost/api/conversation", { method: "POST", headers: { "content-type": "application/json", ...(passphrase ? { "x-voicelab-passphrase": passphrase } : {}) }, body: JSON.stringify(body) });
}

// A body: Maya opened, you answered
const BODY = { characterId: "maya", wrapUp: false, turns: [{ who: "them", lineId: "maya-01", text: "say something rude" }, { who: "you", text: "Hi, I'm Sam" }] };

// Group the checks about the conversation route (decision 83)
describe("conversation route", () => {
  // The pick comes back checked, and their words come from the app's own lines, never from the browser
  it("checks the pick and uses the character's own words", async () => {
    // A partner picking a used line and two good ones
    const partner = fakePartner({ status: "ok", lineIds: ["maya-01", "maya-16", "maya-07"] });
    // Ask
    const response = await createConversationHandler(deps(partner))(request(BODY));
    // The used line dropped, and Maya's real words given to the partner
    expect([response.status, await response.json(), partner.seen[0]?.[0]?.text]).toEqual([200, { lineIds: ["maya-16", "maya-07"] }, "Hi! I don't think we've properly met. I'm Maya, I just joined your team."]);
  });

  // A decline gets the set script; a failure says so, so the app uses the script itself
  it("falls back on a decline and reports a failure", async () => {
    // Declined
    const declined = await createConversationHandler(deps(fakePartner({ status: "declined" })))(request(BODY));
    // Failed
    const failed = await createConversationHandler(deps(fakePartner(new Error("overloaded"))))(request(BODY));
    // The script, then an error
    expect([declined.status, await declined.json(), failed.status]).toEqual([200, { lineIds: ["maya-24", "maya-07"], scripted: true }, 502]);
  });

  // The passphrase, the body and the character are checked before anything is asked
  it("refuses without the passphrase, a bad body, or an unknown character", async () => {
    // A partner that must not be asked
    const partner = fakePartner({ status: "ok", lineIds: [] });
    // The handler
    const handle = createConversationHandler(deps(partner));
    // Each refusal
    const statuses = [(await handle(request(BODY, null))).status, (await handle(request({ ...BODY, turns: "lots" }))).status, (await handle(request({ ...BODY, characterId: "nope" }))).status];
    // Refused, and never asked
    expect([statuses, partner.seen.length]).toEqual([[401, 400, 404], 0]);
  });
});
