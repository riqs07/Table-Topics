// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load Node's hashing, to work out the expected fingerprint independently
import { createHash } from "node:crypto";
// Load the passphrase checks being checked
import { passphraseFingerprint, passphraseWarnings } from "@/core/passphraseCheck";

// Group the checks about the passphrase fingerprint and warnings
describe("passphrase checks", () => {
  // The fingerprint is the first six characters of the passphrase's SHA-256, the same in the browser and on the server
  it("gives a short fingerprint that reveals nothing useful", async () => {
    // Work out the expected value with Node's own hashing
    const expected = createHash("sha256").update("walnut-harbor-quietly-71").digest("hex").slice(0, 6);
    // Confirm it matches
    expect(await passphraseFingerprint("walnut-harbor-quietly-71")).toBe(expected);
  });

  // Characters that text editors slip in, and that make a passphrase never match, are pointed out
  it("warns about curly quotes, wrapping quotes, spaces, and short passphrases", () => {
    // Confirm each case
    expect([
      // Curly quotes from a word processor
      passphraseWarnings("“walnut-harbor-quietly-71”").length > 0,
      // Straight quotes wrapping the whole value
      passphraseWarnings("'walnut-harbor-quietly-71'").length > 0,
      // A space at the end
      passphraseWarnings("walnut-harbor-quietly-71 ").length > 0,
      // Too short
      passphraseWarnings("short").length > 0,
      // A clean passphrase
      passphraseWarnings("walnut-harbor-quietly-71"),
    ]).toEqual([true, true, true, true, []]);
  });
});
