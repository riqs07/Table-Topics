// The passphrase gate on the AI routes, so strangers cannot use them (risk R4)

// Load Node's tools for hashing and timing-safe comparison
import { createHash, timingSafeEqual } from "node:crypto";

// Load and pass on the shared header name, so existing imports keep working
export { PASSPHRASE_HEADER } from "@/config/headers";

// Turn text into a fixed-length fingerprint so comparisons always take the same time
function fingerprint(text: string): Buffer {
  // Hash the text with SHA-256
  return createHash("sha256").update(text).digest();
}

// Check a provided passphrase against the real one without leaking how close it was
export function passphraseMatches(provided: string | null, secret: string): boolean {
  // A missing or empty passphrase never matches
  if (!provided) return false;
  // Compare fingerprints in constant time
  return timingSafeEqual(fingerprint(provided), fingerprint(secret));
}
