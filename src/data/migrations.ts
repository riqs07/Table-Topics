// Moving stored records to the current layout (decision 98): layout 2 keeps each take's detailed readings in their own "signals" record instead of on the session, saves the take's pitch range on the session, and stores analyses without their words.
// It works a batch at a time, each batch in one transaction, so an interrupted move (a closed tab, a crash) leaves every record either moved or untouched, and the next start carries on where it stopped. Reads work on either layout meanwhile.

// Load the rules that split a session's readings out (decision 98)
import { hasInlineSignals, splitSignals } from "@/core/sessionSignals";
// Load the pitch range rule
import { rangeOf } from "@/core/voiceFeedback";
// Load the record types
import type { AnalysisRecord, SessionRecord, SignalsRecord } from "@/data/records";
// Load the repository type and the stored form of an analysis
import { storedAnalysis, type Repository } from "@/data/repository";
// Load the storage contract types
import type { StoreOp } from "@/data/store";

// The layout the app writes now
export const CURRENT_SCHEMA = 2;
// The key of the layout record in the "meta" collection
const SCHEMA_KEY = "schema";
// Records moved in one transaction
const BATCH_SIZE = 100;

// What the move can be given: the batch size, the pause between batches, and the clock
export interface MigrateOptions {
  // Records per transaction
  batchSize?: number;
  // A pause between batches, so the page stays responsive
  pause?: () => Promise<void>;
  // When it runs
  now?: Date;
}

// Whether the stored records are already in the current layout
export async function isMigrated(repository: Repository): Promise<boolean> {
  // The layout record
  const meta = await repository.store.get("meta", SCHEMA_KEY);
  // At the current layout or later
  return (meta?.schema ?? 1) >= CURRENT_SCHEMA;
}

// The changes that move one session's readings out, worked out from the record as stored inside the transaction (so a session saved meanwhile is never overwritten with an older copy)
function sessionMoveOps(id: string): StoreOp[] {
  // The readings found on the session, handed from the first change to the second within the same transaction
  const found: { signals: SignalsRecord | null } = { signals: null };
  // Two changes, run in order
  return [
    // The session: its readings taken off, its pitch range saved
    {
      kind: "update", collection: "sessions", key: id, change: (stored: SessionRecord | undefined) => {
        // Gone, or already moved: nothing to do
        if (!stored || !hasInlineSignals(stored)) return undefined;
        // The pitch range, from the readings still on it
        const range = stored.pitchRange ?? rangeOf(stored);
        // The small record and the readings
        const parts = splitSignals(stored);
        // Handed to the next change
        found.signals = parts.signals;
        // The small record, with the range when there is one
        return range === null ? parts.session : { ...parts.session, pitchRange: range };
      },
    },
    // The readings: saved under the session's id, joined with any already there (the session's own are the same data)
    { kind: "update", collection: "signals", key: id, change: (stored: SignalsRecord | undefined) => (found.signals ? { ...(stored ?? {}), ...found.signals } : undefined) },
  ];
}

// The change that stores an analysis without its words
function analysisStripOp(sessionId: string): StoreOp {
  // From the record as stored now
  return { kind: "update", collection: "analyses", key: sessionId, change: (stored: AnalysisRecord | undefined) => (stored && stored.raw.timedWords !== undefined ? storedAnalysis(stored) : undefined) };
}

// Give the page a turn between batches
function nextTurn(): Promise<void> {
  // After whatever is waiting
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Move every stored record to the current layout; returns how many sessions and analyses were changed (none when already moved)
export async function migrate(repository: Repository, options: MigrateOptions = {}): Promise<{ sessions: number; analyses: number }> {
  // Already done
  if (await isMigrated(repository)) return { sessions: 0, analyses: 0 };
  // The store underneath
  const store = repository.store;
  // Records per transaction
  const size = options.batchSize ?? BATCH_SIZE;
  // The pause between batches
  const pause = options.pause ?? nextTurn;
  // How many were changed
  const counts = { sessions: 0, analyses: 0 };
  // Every session's key
  const sessionKeys = await store.keys("sessions");
  // A batch at a time
  for (let start = 0; start < sessionKeys.length; start += size) {
    // This batch's sessions
    const batch = await store.getMany("sessions", sessionKeys.slice(start, start + size));
    // The ones still carrying readings
    const toMove = batch.filter((session): session is SessionRecord => !!session && hasInlineSignals(session));
    // Moved together
    if (toMove.length > 0) await store.batch(toMove.flatMap((session) => sessionMoveOps(session.id)));
    // Counted
    counts.sessions += toMove.length;
    // Shared reads made again (here and in other tabs)
    if (toMove.length > 0) repository.changed();
    // Let the page breathe
    await pause();
  }
  // Every analysis's key
  const analysisKeys = await store.keys("analyses");
  // A batch at a time
  for (let start = 0; start < analysisKeys.length; start += size) {
    // This batch's analyses
    const batch = await store.getMany("analyses", analysisKeys.slice(start, start + size));
    // The ones still storing their words
    const toStrip = batch.filter((analysis): analysis is AnalysisRecord => !!analysis && analysis.raw.timedWords !== undefined);
    // Stored without them, together
    if (toStrip.length > 0) await store.batch(toStrip.map((analysis) => analysisStripOp(analysis.sessionId)));
    // Counted
    counts.analyses += toStrip.length;
    // Shared reads made again
    if (toStrip.length > 0) repository.changed();
    // Let the page breathe
    await pause();
  }
  // Everything moved: note the layout, so the next start skips all of this
  await store.put("meta", SCHEMA_KEY, { schema: CURRENT_SCHEMA, migratedAt: (options.now ?? new Date()).toISOString() });
  // The counts
  return counts;
}
