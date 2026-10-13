// The AI passphrase, kept in this browser only (never in the data export, never sent anywhere but our own route)

// Key the passphrase is stored under
const KEY = "voicelab-passphrase";

// Read the saved passphrase, or "" if none is saved or storage is unavailable
export function readPassphrase(): string {
  // Storage can be blocked (private browsing), so guard every access
  try {
    // Read and tidy the value
    return (localStorage.getItem(KEY) ?? "").trim();
  } catch {
    // Treat blocked storage as no passphrase
    return "";
  }
}

// Save the passphrase (an empty value removes it)
export function savePassphrase(passphrase: string): void {
  // Storage can be blocked, so guard the write
  try {
    // Tidy the value
    const value = passphrase.trim();
    // Remove it when empty, otherwise save it
    if (value) localStorage.setItem(KEY, value);
    else localStorage.removeItem(KEY);
  } catch {
    // Nothing more can be done if storage is blocked
  }
}
