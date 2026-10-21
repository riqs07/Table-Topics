// Keeping storage small (decision 98): deletes recordings past the chosen number of days and drops detailed readings past 30 days, a small batch at a time, only when the app is idle (never while a take is being saved or a page is loading). Running it again changes nothing.

// Load the retention rules
import { audioToDrop, keptWhole, readingsToDrop, recordingDays } from "@/core/retention";
// Load the record types
import type { SessionRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";
// Load the storage contract types
import type { StoreOp } from "@/data/store";

// Takes changed in one transaction
const BATCH_SIZE = 20;

// What the upkeep can be given: the batch size and the pause between batches
export interface TidyOptions {
  // Takes per transaction
  batchSize?: number;
  // A pause between batches, so the page stays responsive
  pause?: () => Promise<void>;
}

// Give the page a turn between batches
function nextTurn(): Promise<void> {
  // After whatever is waiting
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// The changes that delete one take's recording, decided again from the session as stored inside the transaction (a take starred meanwhile keeps it)
function dropAudioOps(session: SessionRecord): StoreOp[] {
  // The recording's key as the list saw it
  const key = session.audioKey as string;
  // Whether the session change went ahead, handed to the second change
  const decided = { drop: false };
  // Two changes, run in order
  return [
    // The session loses its link, unless it is now kept whole or links elsewhere
    {
      kind: "update", collection: "sessions", key: session.id, change: (stored: SessionRecord | undefined) => {
        // Gone, kept whole, or no longer linked to this recording: left alone
        if (!stored || keptWhole(stored) || stored.audioKey !== key) return undefined;
        // Going ahead
        decided.drop = true;
        // Unlinked
        return { ...stored, audioKey: null };
      },
    },
    // The recording itself, removed only when the session change went ahead
    { kind: "update", collection: "audio", key, change: () => (decided.drop ? null : undefined) },
  ];
}

// The changes that drop one take's detailed readings, decided again from the session as stored inside the transaction
function dropReadingsOps(session: SessionRecord, at: string): StoreOp[] {
  // Whether the session change went ahead, handed to the second change
  const decided = { drop: false };
  // Two changes, run in order
  return [
    // The session is marked, so its page says the charts are not kept, unless it is now kept whole
    {
      kind: "update", collection: "sessions", key: session.id, change: (stored: SessionRecord | undefined) => {
        // Kept whole (starred meanwhile): left alone
        if (stored && keptWhole(stored)) return undefined;
        // Going ahead (a session already deleted still loses its leftover readings)
        decided.drop = true;
        // Marked when it is there
        return stored ? { ...stored, trimmedAt: at } : undefined;
      },
    },
    // The readings, removed only when the session change went ahead
    { kind: "update", collection: "signals", key: session.id, change: () => (decided.drop ? null : undefined) },
  ];
}

// Apply changes for a list of takes, a batch per transaction, with a pause between batches
async function inBatches(repository: Repository, sessions: ReadonlyArray<SessionRecord>, opsFor: (session: SessionRecord) => StoreOp[], options: TidyOptions): Promise<void> {
  // Takes per transaction
  const size = options.batchSize ?? BATCH_SIZE;
  // A batch at a time
  for (let start = 0; start < sessions.length; start += size) {
    // Changed together
    await repository.store.batch(sessions.slice(start, start + size).flatMap(opsFor));
    // Shared reads made again
    repository.changed();
    // Let the page breathe
    await (options.pause ?? nextTurn)();
  }
}

// Delete recordings and readings the retention rule no longer keeps; returns how many takes lost each (counted from the list read at the start)
export async function tidyRecordings(repository: Repository, now: Date, options: TidyOptions = {}): Promise<{ audio: number; readings: number }> {
  // How many days of recordings the user keeps
  const days = recordingDays(await repository.getSettings(now));
  // Every take (shared with the page's own read)
  const sessions = await repository.listSessions();
  // The takes whose recording goes
  const audio = audioToDrop(sessions, now, days);
  // Deleted a batch at a time
  await inBatches(repository, audio, dropAudioOps, options);
  // The takes that still have readings, by key alone (no records read)
  const withReadings = new Set(await repository.store.keys("signals"));
  // The takes whose readings go
  const readings = readingsToDrop(sessions, withReadings, now);
  // When they were dropped
  const at = now.toISOString();
  // Dropped a batch at a time
  await inBatches(repository, readings, (session) => dropReadingsOps(session, at), options);
  // The counts
  return { audio: audio.length, readings: readings.length };
}
