// Asks the weekly summary route for this week's summary and saves it (decision 90): only when the profile opens, the passphrase is set, the last summary is a week old, and there were a few takes this week

// Load the passphrase header name
import { PASSPHRASE_HEADER } from "@/config/headers";
// Load the profile builder
import { buildProfile } from "@/core/analysis/profile";
// Load the weekly summary rules
import { MIN_TAKES_FOR_SUMMARY, SUMMARY_EVERY_DAYS, buildSummaryInput, checkInSummaryInput, summaryDue } from "@/core/weeklySummary";
// Load the check-in grouping and comparison (decision 100)
import { groupCheckIns, readCheckInSettings, recordedCheckIns } from "@/core/checkIn";
import { compareCheckIns, pickPair } from "@/core/checkInCompare";
// Load the pause-word setting rule
import { pauseWordsShown } from "@/core/pauseWords";
// Load the record type
import type { SummaryRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// What happened when a summary was asked for
export type SummaryOutcome =
  // A new summary was saved
  | { status: "saved"; summary: SummaryRecord }
  // Nothing to do: the last one is recent, there is no passphrase, or too few takes this week
  | { status: "not-due" | "needs-passphrase" | "too-few" }
  // The route refused or failed; the reason is shown quietly and it is tried again next time
  | { status: "failed"; reason: string };

// What a request needs
export interface SummaryOptions {
  // The passphrase for the AI routes ("" if not set)
  passphrase: string;
  // The current moment
  now: Date;
  // Network function (the real fetch in the app, a fake in tests)
  fetchFn?: typeof fetch;
}

// Ask for this week's summary when one is due, and save it
export async function requestWeeklySummary(repository: Repository, { passphrase, now, fetchFn = fetch }: SummaryOptions): Promise<SummaryOutcome> {
  // The summaries so far, newest first
  const summaries = await repository.listSummaries();
  // Not due yet
  if (!summaryDue(summaries[0], now)) return { status: "not-due" };
  // Without a passphrase nothing is sent
  if (!passphrase) return { status: "needs-passphrase" };
  // Every session and analysis
  const [sessions, analyses] = [await repository.listSessions(), await repository.listAnalyses()];
  // The analysed takes this week
  const analysed = new Set(analyses.map((analysis) => analysis.sessionId));
  // How many
  const thisWeek = sessions.filter((session) => analysed.has(session.id) && now.getTime() - new Date(session.createdAt).getTime() < SUMMARY_EVERY_DAYS * 86_400_000).length;
  // Too few to say anything about the week
  if (thisWeek < MIN_TAKES_FOR_SUMMARY) return { status: "too-few" };
  // The check-ins so far, and the first against the latest when there are two (decision 100)
  const settings = await repository.getSettings(now);
  // (grouped)
  const checkIns = groupCheckIns(sessions, readCheckInSettings(settings.checkIn));
  // (the pair)
  const pair = pickPair(checkIns, null, null);
  // The table to send, with the check-in's numbers when there are two
  const input = { ...buildSummaryInput(buildProfile(sessions, analyses, now), sessions, analyses, summaries[0], now), ...(pair ? { checkIn: checkInSummaryInput(compareCheckIns(pair.a, pair.b, new Map(analyses.map((analysis) => [analysis.sessionId, analysis])), { pauseWords: pauseWordsShown(settings) }), recordedCheckIns(checkIns).length) } : {}) };
  // Send it, treating a network failure as a failure to try again later
  let response: Response;
  // Try the network
  try {
    // Post the table
    response = await fetchFn("/api/summary", { method: "POST", headers: { "content-type": "application/json", [PASSPHRASE_HEADER]: passphrase }, body: JSON.stringify(input) });
  } catch {
    // Offline or unreachable
    return { status: "failed", reason: "The weekly summary could not be reached. It will be tried again next time." };
  }
  // A refusal or failure, with the server's reason when it gave one
  if (!response.ok) {
    // The reason, if readable
    const body = (await response.json().catch(() => ({}))) as { error?: unknown };
    // Reported
    return { status: "failed", reason: typeof body.error === "string" ? body.error : "The weekly summary is unavailable right now." };
  }
  // The summary and the model that wrote it
  const { summary, model } = (await response.json()) as { summary: Omit<SummaryRecord, "id" | "createdAt" | "model">; model: string };
  // The record to keep
  const record: SummaryRecord = { id: crypto.randomUUID(), createdAt: now.toISOString(), headline: summary.headline, improved: summary.improved, pattern: summary.pattern, focus: summary.focus, suggestedDrill: summary.suggestedDrill, model };
  // Saved
  await repository.saveSummary(record);
  // Reported
  return { status: "saved", summary: record };
}
