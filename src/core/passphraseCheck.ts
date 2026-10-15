// Passphrase checks for finding a mismatch without ever showing the passphrase: a short fingerprint and warnings about stray characters

// Load the shortest passphrase allowed
import { MIN_PASSPHRASE_LENGTH } from "@/config/headers";

// The first six hex characters of the passphrase's SHA-256: the same in the browser, the server, and the check script, and useless for guessing it
export async function passphraseFingerprint(passphrase: string): Promise<string> {
  // Hash the text with the built-in Web Crypto (in browsers and in Node)
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(passphrase));
  // Turn the first three bytes into six hex characters
  return Array.from(new Uint8Array(digest).slice(0, 3), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Plain warnings about things that make a passphrase never match what is typed in Settings
export function passphraseWarnings(passphrase: string): string[] {
  // Collected warnings
  const warnings: string[] = [];
  // Curly quotes and other non-keyboard characters, usually added by a word processor such as TextEdit
  if (/[^\x20-\x7e]/.test(passphrase)) warnings.push("It contains characters that are not on a plain keyboard (often curly quotes added by a text editor). Retype it in a plain-text editor.");
  // Straight quotes wrapping the whole value
  if (/^["'].*["']$/.test(passphrase)) warnings.push("It is wrapped in quotes. Remove the quotes.");
  // Spaces at either end
  if (passphrase !== passphrase.trim()) warnings.push("It starts or ends with a space. Remove the space.");
  // Too short for the server
  if (passphrase.trim().length < MIN_PASSPHRASE_LENGTH) warnings.push(`It is shorter than ${MIN_PASSPHRASE_LENGTH} characters.`);
  // Hand back the list
  return warnings;
}
