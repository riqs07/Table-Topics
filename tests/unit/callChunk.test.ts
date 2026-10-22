// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the check being tested
import { callOnlyChunk } from "../../scripts/build-sw.mjs";
// Load Node's file reader
import { readFileSync } from "node:fs";

// Group the checks on leaving the phone call's SDK out of the offline set (decision 121)
describe("callOnlyChunk", () => {
  // The SDK's own bundle is recognised; the app's scripts are not
  it("recognises the SDK and nothing else", () => {
    // The installed SDK's browser bundle, and one of the app's own files
    expect([callOnlyChunk(readFileSync("node_modules/@elevenlabs/client/dist/lib.iife.js", "utf8")), callOnlyChunk(readFileSync("src/audio/liveCall.ts", "utf8")), callOnlyChunk(readFileSync("src/components/screens/ConversationScreen.tsx", "utf8"))]).toEqual([true, false, false]);
  });
});
