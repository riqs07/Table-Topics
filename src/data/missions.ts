// Reads and saves mission tries, kept with the settings so they travel in exports

// Load the calendar-day key
import { dayKey } from "@/core/dates";
// Load the record type
import type { MissionRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// Every mission try, oldest first
export async function loadMissions(repository: Repository, now: Date): Promise<MissionRecord[]> {
  // From the settings, or none yet
  return (await repository.getSettings(now)).missions ?? [];
}

// Replace or add one try, and save
async function saveRecord(repository: Repository, record: MissionRecord, now: Date): Promise<MissionRecord[]> {
  // The settings as they are now
  const settings = await repository.getSettings(now);
  // The tries so far
  const missions = settings.missions ?? [];
  // With this one replaced, or added at the end
  const next = missions.some((item) => item.id === record.id) ? missions.map((item) => (item.id === record.id ? record : item)) : [...missions, record];
  // Save
  await repository.saveSettings({ ...settings, missions: next });
  // Hand them back
  return next;
}

// Accept a mission with a prediction (1 to 5)
export function acceptMission(repository: Repository, missionId: string, predicted: number, now: Date): Promise<MissionRecord[]> {
  // A new try, waiting for its debrief
  return saveRecord(repository, { id: crypto.randomUUID(), missionId, day: dayKey(now), status: "accepted", predicted, tried: null, outcome: null, note: "", tooMuch: false, debriefedAt: null }, now);
}

// Skip a mission for today
export function skipMission(repository: Repository, missionId: string, now: Date): Promise<MissionRecord[]> {
  // A skipped try for today
  return saveRecord(repository, { id: crypto.randomUUID(), missionId, day: dayKey(now), status: "skipped", predicted: null, tried: null, outcome: null, note: "", tooMuch: false, debriefedAt: null }, now);
}

// What a debrief records
export interface Debrief {
  // Whether they tried it
  tried: boolean;
  // How it went, 1 to 5 (null when not tried)
  outcome: number | null;
  // What they noticed
  note: string;
  // Whether it felt like too much
  tooMuch: boolean;
}

// Debrief an accepted try
export function debriefMission(repository: Repository, record: MissionRecord, debrief: Debrief, now: Date): Promise<MissionRecord[]> {
  // The try, debriefed
  return saveRecord(repository, { ...record, status: "done", tried: debrief.tried, outcome: debrief.tried ? debrief.outcome : null, note: debrief.note.trim(), tooMuch: debrief.tooMuch, debriefedAt: now.toISOString() }, now);
}
