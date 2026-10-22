// Tiny fingerprints for takes saved before decision 115: made once at idle from each take's readings, a small batch at a time, so History can draw every take's shape from the session list alone (decision 99: History never reads the readings)

// Load the tiny fingerprint maker
import { sessionMiniFingerprint } from "@/core/fingerprint";
// Load the record types
import type { SessionRecord, SignalsRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// Takes read and changed in one transaction
const BATCH_SIZE = 20;
// Kinds of take with no readings to draw: voice drills, conversations and moment notes
const NO_SHAPE: ReadonlyArray<SessionRecord["mode"]> = ["voice", "conversation", "moment"];

// Give the page a turn between batches
function nextTurn(): Promise<void> {
  // After whatever is waiting
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Make the missing fingerprints; returns how many takes were given one (or marked as having none to draw)
export async function backfillFingerprints(repository: Repository, options: { batchSize?: number; pause?: () => Promise<void> } = {}): Promise<number> {
  // Every take (shared with the page's own read)
  const sessions = await repository.listSessions();
  // The takes that still have readings, by key alone
  const withReadings = new Set(await repository.store.keys("signals"));
  // The takes still without one, whose readings are kept
  const missing = sessions.filter((session) => session.fingerprint === undefined && !session.trimmedAt && !NO_SHAPE.includes(session.mode) && withReadings.has(session.id));
  // Takes per batch
  const size = options.batchSize ?? BATCH_SIZE;
  // A batch at a time
  for (let start = 0; start < missing.length; start += size) {
    // This batch
    const batch = missing.slice(start, start + size);
    // Their readings, one record each
    const readings = await Promise.all(batch.map((session) => repository.store.get("signals", session.id) as Promise<SignalsRecord | undefined>));
    // Each take's fingerprint, written only if the stored take still has none
    await repository.store.batch(batch.map((session, index) => {
      // The fingerprint from its loudness and pause words (null when there is nothing to draw)
      const fingerprint = sessionMiniFingerprint({ transcript: session.transcript, loudness: readings[index]?.loudness ?? [], spokenTimes: readings[index]?.spokenTimes ?? [] });
      // The change
      return { kind: "update" as const, collection: "sessions" as const, key: session.id, change: (stored: SessionRecord | undefined) => (stored && stored.fingerprint === undefined ? { ...stored, fingerprint } : undefined) };
    }));
    // Shared reads made again
    repository.changed();
    // Let the page breathe
    await (options.pause ?? nextTurn)();
  }
  // How many
  return missing.length;
}
