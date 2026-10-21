// Saving each take's analysis (decision 90): when a take is saved, when the coach's rubric arrives, and for older takes that have none yet, a few at a time so the page stays responsive

// Load the analysis builders
import { buildAnalysis, isAnalysed, needsAnalysis, withRubric } from "@/core/analysis/analysis";
// Load the rule that joins a take's readings back to its session (decision 98)
import { joinSignals } from "@/core/sessionSignals";
// Load the record types
import type { AnalysisRecord, FullSession, RubricRecord, SessionRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// Takes analysed in one batch before giving the page a turn
const BATCH_SIZE = 8;

// Work out and save one take's analysis, keeping a rubric already saved; never throws, since a failed analysis must not stop a take being saved (rule T1: the take is what matters)
export async function analyseSession(repository: Repository, session: FullSession, now: Date): Promise<boolean> {
  // Kinds that are not analysed
  if (!isAnalysed(session.mode)) return false;
  // Working it out or saving it can fail
  try {
    // The analysis already saved, if any
    const existing = await repository.getAnalysis(session.id);
    // Saved, built afresh from the session and its readings
    await repository.saveAnalysis(buildAnalysis(session, now, existing));
    // Done
    return true;
  } catch (error) {
    // Say why in the console, and carry on
    console.warn(`The analysis of a take could not be saved: ${error instanceof Error ? error.message : String(error)}`);
    // Not done
    return false;
  }
}

// Give the page a turn between batches
function nextTurn(): Promise<void> {
  // After whatever is waiting
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// What the backfill can be given: the batch size, the pause between batches, and lists already read by the page (so it reads nothing twice; decision 99)
export interface BackfillOptions {
  // Takes per batch
  batchSize?: number;
  // The pause between batches
  pause?: () => Promise<void>;
}

// Analyse every take that has no analysis yet (or one from an older definition, unless its readings were dropped: it keeps its values, decision 98), a batch at a time; returns how many were analysed
export async function backfillAnalyses(repository: Repository, now: Date, options: BackfillOptions = {}): Promise<number> {
  // Every take (shared with the page's own read)
  const sessions = await repository.listSessions();
  // The analyses already saved, by session id (shared the same way)
  const saved = new Map((await repository.listAnalyses()).map((analysis) => [analysis.sessionId, analysis]));
  // The takes that need one
  const waiting = sessions.filter((session) => needsAnalysis(session, saved.get(session.id)));
  // How many were analysed
  let done = 0;
  // The batch size
  const size = options.batchSize ?? BATCH_SIZE;
  // A batch at a time
  for (let start = 0; start < waiting.length; start += size) {
    // The batch's takes
    const batch = waiting.slice(start, start + size);
    // Their readings, read together
    const signals = await Promise.all(batch.map((session) => repository.getSignals(session.id)));
    // Each take in the batch, with its readings joined back
    for (const [index, session] of batch.entries()) if (await analyseSession(repository, joinSignals(session, signals[index]), now)) done += 1;
    // Let the page breathe before the next batch
    await (options.pause ?? nextTurn)();
  }
  // The count
  return done;
}

// The analysis to add to: the saved one with its words rebuilt when the take still has them, or a fresh one from the session and its readings
export async function workingAnalysis(repository: Repository, session: SessionRecord, now: Date): Promise<AnalysisRecord> {
  // The saved one, ready to be worked on
  const saved = await repository.getWorkingAnalysis(session.id);
  // Used when there is one
  if (saved) return saved;
  // Otherwise built from the session with its readings (as stored now, or as given)
  return buildAnalysis((await repository.getFullSession(session.id)) ?? session, now);
}

// Save the coach's rubric into a take's analysis, building the analysis first if it has none
export async function saveRubric(repository: Repository, session: SessionRecord, rubric: RubricRecord, now: Date): Promise<void> {
  // The analysis there, or a fresh one
  const analysis = await workingAnalysis(repository, session, now);
  // Saved with the rubric
  await repository.saveAnalysis(withRubric(analysis, rubric));
}
