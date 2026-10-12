// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the passphrase check being checked
import { passphraseMatches } from "@/server/accessGate";

// The passphrase used in these checks
const SECRET = "correct horse battery staple";

// Group the checks about the passphrase gate
describe("passphraseMatches", () => {
  // The right passphrase gets in
  it("accepts the exact passphrase", () => {
    // Confirm a match
    expect(passphraseMatches(SECRET, SECRET)).toBe(true);
  });

  // Anything else is refused
  it("rejects a wrong passphrase", () => {
    // Confirm a near miss is refused
    expect(passphraseMatches("correct horse battery stapler", SECRET)).toBe(false);
  });

  // A missing header is refused
  it("rejects a missing passphrase", () => {
    // Confirm null is refused
    expect(passphraseMatches(null, SECRET)).toBe(false);
    // Confirm empty text is refused
    expect(passphraseMatches("", SECRET)).toBe(false);
  });
});
