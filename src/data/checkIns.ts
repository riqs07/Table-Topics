// The weekly check-in's reads and writes (decision 100): every check-in from one read of the sessions, skipping a part, putting the reminder aside, and the analyses of just the takes being compared

// Load the check-in rules
import { checkInSchedule, firstUseOf, groupCheckIns, readCheckInSettings, withSeen, withSkip, type CheckIn, type CheckInSchedule } from "@/core/checkIn";
// Load the filter that leaves out private moment notes
import { practiceSessions } from "@/core/sessionHome";
// Load the record types
import type { AnalysisRecord, CheckInPart, SessionRecord, SettingsRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// Everything the check-in pages need, from one read of the sessions
export interface CheckInData {
  // Every session that counts (moment notes left out)
  sessions: SessionRecord[];
  // The settings
  settings: SettingsRecord;
  // Every check-in, oldest first
  checkIns: CheckIn[];
  // Whether today is a check-in day
  schedule: CheckInSchedule;
}

// Read the sessions once, and work out the check-ins and today's schedule
export async function loadCheckIns(repository: Repository, now: Date): Promise<CheckInData> {
  // Every session that counts
  const sessions = practiceSessions(await repository.listSessions());
  // The settings
  const settings = await repository.getSettings(now);
  // The check-in settings, made safe
  const checkInSettings = readCheckInSettings(settings.checkIn);
  // Every check-in
  const checkIns = groupCheckIns(sessions, checkInSettings);
  // Today's schedule
  const schedule = checkInSchedule({ today: now, firstUse: firstUseOf(sessions), checkIns, settings: checkInSettings });
  // Together
  return { sessions, settings, checkIns, schedule };
}

// Skip one part of a check-in, so the check-in moves on and the comparison shows it as skipped
export async function skipCheckInPart(repository: Repository, id: string, part: CheckInPart, now: Date): Promise<void> {
  // The settings, where skips are kept
  const settings = await repository.getSettings(now);
  // With this part added
  await repository.saveSettings({ ...settings, checkIn: withSkip(readCheckInSettings(settings.checkIn), id, part) });
}

// Put the "Hear how far you've come" reminder aside (or note that it was opened), so it does not come back
export async function markReminderSeen(repository: Repository, days: number, now: Date): Promise<void> {
  // The settings
  const settings = await repository.getSettings(now);
  // With this reminder seen
  await repository.saveSettings({ ...settings, checkIn: withSeen(readCheckInSettings(settings.checkIn), days) });
}

// The analyses of a few takes, by session id (only those, never every analysis)
export async function analysesFor(repository: Repository, ids: ReadonlyArray<string>): Promise<Map<string, AnalysisRecord>> {
  // Read just these
  const found = await repository.getAnalyses(ids);
  // By session id, leaving out takes with none
  return new Map(found.filter((analysis): analysis is AnalysisRecord => analysis !== undefined).map((analysis) => [analysis.sessionId, analysis]));
}
