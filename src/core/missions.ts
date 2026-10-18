// Missions: which one comes next, where today stands, and how the outcome compared with the prediction

// Load the missions
import { MISSIONS, findMission, type Mission } from "@/content/missions";
// Load the calendar-day key
import { dayKey } from "@/core/dates";
// Load the record type
import type { MissionRecord } from "@/data/records";

// Where today's mission stands
export type MissionState =
  // Nothing answered today: offer the next mission
  | { kind: "offer"; mission: Mission }
  // Accepted (today or earlier) and waiting for its debrief
  | { kind: "debrief"; mission: Mission; record: MissionRecord }
  // Answered today: debriefed, or skipped
  | { kind: "answered"; mission: Mission; record: MissionRecord };

// The next mission to offer: the first in the ladder not yet tried; after "too much", the one before the last mission instead
export function nextMission(records: ReadonlyArray<MissionRecord>): Mission {
  // The last debrief
  const last = [...records].reverse().find((record) => record.status === "done");
  // It felt like too much: step back one rung from it
  if (last?.tooMuch) {
    // Its place in the ladder
    const index = MISSIONS.findIndex((mission) => mission.id === last.missionId);
    // The one before (or the first)
    return MISSIONS[Math.max(0, index - 1)]!;
  }
  // Missions tried at least once
  const tried = new Set(records.filter((record) => record.status === "done" && record.tried).map((record) => record.missionId));
  // The first not yet tried, or (all tried) the one after the last tried, round again
  return MISSIONS.find((mission) => !tried.has(mission.id)) ?? MISSIONS[(MISSIONS.findIndex((mission) => mission.id === last?.missionId) + 1) % MISSIONS.length]!;
}

// Where today stands: a mission waiting for its debrief comes first (from any day), then today's answer, otherwise an offer
export function missionToday(records: ReadonlyArray<MissionRecord>, now: Date): MissionState {
  // The newest accepted mission still waiting
  const waiting = [...records].reverse().find((record) => record.status === "accepted");
  // Debrief it
  if (waiting) return { kind: "debrief", mission: findMission(waiting.missionId) ?? MISSIONS[0]!, record: waiting };
  // Today's answer, if any
  const today = [...records].reverse().find((record) => record.day === dayKey(now));
  // Answered today
  if (today) return { kind: "answered", mission: findMission(today.missionId) ?? MISSIONS[0]!, record: today };
  // Otherwise offer the next
  return { kind: "offer", mission: nextMission(records) };
}

// How the outcome compared with the prediction, in one plain sentence
export function compareLine(record: MissionRecord): string {
  // Not tried, or nothing to compare
  if (!record.tried || record.outcome === null || record.predicted === null) return "No comparison this time. The mission will be offered again.";
  // The two numbers
  const said = `You expected ${record.predicted} of 5. It went ${record.outcome} of 5.`;
  // Better than feared
  if (record.outcome > record.predicted) return `${said} Better than you feared, which is common: people underestimate how well these go.`;
  // As expected
  if (record.outcome === record.predicted) return `${said} About what you expected.`;
  // Harder than hoped
  return `${said} Harder than you hoped. That happens; next time is a new try.`;
}

// The days a mission was tried and debriefed (they count for the streak and the week strip)
export function missionDays(records: ReadonlyArray<MissionRecord>): Date[] {
  // Debriefed tries
  return records.filter((record) => record.status === "done" && record.tried && record.debriefedAt).map((record) => new Date(record.debriefedAt!));
}

// The debriefed tries, newest first, for the predicted-against-actual view
export function triedMissions(records: ReadonlyArray<MissionRecord>): MissionRecord[] {
  // Tried and rated, newest first
  return records.filter((record) => record.status === "done" && record.tried && record.outcome !== null).reverse();
}

// How many tries went better than predicted, out of those rated
export function betterThanFeared(records: ReadonlyArray<MissionRecord>): { better: number; total: number } {
  // The rated tries
  const rated = triedMissions(records).filter((record) => record.predicted !== null);
  // Better than predicted
  return { better: rated.filter((record) => record.outcome! > record.predicted!).length, total: rated.length };
}
