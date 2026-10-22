// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load Node's file reader
import { readFileSync } from "node:fs";
// Load where the page loads them from
import { CALL_WORKLETS } from "@/audio/liveCall";

// Group the checks on the ElevenLabs SDK's audio worklets served from this site (decision 121)
describe("call worklets", () => {
  // The copies in public/ are the installed SDK's own files, so an SDK upgrade that changes them fails here until they are copied again
  it("serves exact copies of the SDK's worklets", () => {
    // Each worklet: the served copy against the installed one
    expect(Object.values(CALL_WORKLETS).map((path) => readFileSync(`public${path}`, "utf8") === readFileSync(`node_modules/@elevenlabs/client/worklets/${path.split("/").at(-1)}`, "utf8"))).toEqual([true, true]);
  });
});
