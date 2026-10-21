// Saving each take's analysis (decision 90): when a take is saved, when the coach's rubric arrives, and for older takes that have none yet, a few at a time so the page stays responsive

// Load the analysis builders
import { buildAnalysis, isAnalysed, needsAnalysis, withRubric } from "@/core/analysis/analysis";
// Load the record types
import type { RubricRecord, SessionRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// Takes analysed in one batch before giving the page a turn
const BATCH_SIZE = 8;

// Work out and save one take's analysis, keeping a rubric already saved; never throws, since a failed analysis must not stop a take being saved (rule T1: the take is what matters)
export async function analyseSession(repository: Repository, session: SessionRecord, now: Date): Promise<boolean> {
  // Kinds that are not analysed
  if (!isAnalysed(session.mode)) return false;
  // Working it out or saving it can fail
  try {
    // The analysis already saved, if any
    const existing = await repository.getAnalysis(session.id);
    // Saved, built afresh from the session
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

// Analyse every take that has no analysis yet (or one from an older definition), a batch at a time; returns how many were analysed
export async function backfillAnalyses(repository: Repository, now: Date, options: { batchSize?: number; pause?: () => Promise<void> } = {}): Promise<number> {
  // Every take
  const sessions = await repository.listSessions();
  // The analyses already saved, by session id
  const saved = new Map((await repository.listAnalyses()).map((analysis) => [analysis.sessionId, analysis]));
  // The takes that need one
  const waiting = sessions.filter((session) => needsAnalysis(session, saved.get(session.id)));
  // How many were analysed
  let done = 0;
  // A batch at a time
  for (let start = 0; start < waiting.length; start += options.batchSize ?? BATCH_SIZE) {
    // Each take in the batch
    for (const session of waiting.slice(start, start + (options.batchSize ?? BATCH_SIZE))) if (await analyseSession(repository, session, now)) done += 1;
    // Let the page breathe before the next batch
    await (options.pause ?? nextTurn)();
  }
  // The count
  return done;
}

// Save the coach's rubric into a take's analysis, building the analysis first if it has none
export async function saveRubric(repository: Repository, session: SessionRecord, rubric: RubricRecord, now: Date): Promise<void> {
  // The analysis there, or a fresh one
  const analysis = (await repository.getAnalysis(session.id)) ?? buildAnalysis(session, now);
  // Saved with the rubric
  await repository.saveAnalysis(withRubric(analysis, rubric));
}
