// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the rules being checked
import { betterThanFeared, compareLine, missionDays, missionToday, nextMission, triedMissions } from "@/core/missions";
// Load the missions
import { MISSIONS, findMission } from "@/content/missions";
// Load the card lookup, to check missions point at real cards
import { findCard } from "@/content/learn";
// Load the record type
import type { MissionRecord } from "@/data/records";

// A fixed "now"
const NOW = new Date(2026, 9, 18, 9);

// A try, with defaults
const record = (overrides: Partial<MissionRecord> = {}): MissionRecord => ({ id: "r1", missionId: "m01", day: "2026-10-17", status: "done", predicted: 2, tried: true, outcome: 4, note: "", tooMuch: false, debriefedAt: new Date(2026, 9, 17, 20).toISOString(), ...overrides });

// Group the checks about missions
describe("missions", () => {
  // The ladder hangs together
  it("has unique ids, climbs in level, and links only to real cards", () => {
    // The ids
    const ids = MISSIONS.map((mission) => mission.id);
    // Confirm unique, levels never go down, and every card exists
    expect([new Set(ids).size === ids.length, MISSIONS.every((mission, index) => index === 0 || mission.level >= MISSIONS[index - 1]!.level), MISSIONS.every((mission) => mission.cardId === null || !!findCard(mission.cardId)), MISSIONS.every((mission) => mission.drop.startsWith("Don't"))]).toEqual([true, true, true, true]);
  });

  // The next mission is the first not yet tried; a miss keeps it; "too much" steps back one
  it("offers the first untried mission, and steps back after too much", () => {
    // Nothing yet, one tried, one not tried, and the second felt like too much
    expect([nextMission([]).id, nextMission([record()]).id, nextMission([record({ tried: false, outcome: null })]).id, nextMission([record(), record({ id: "r2", missionId: "m02", tried: false, outcome: null, tooMuch: true })]).id]).toEqual(["m01", "m02", "m01", "m01"]);
  });

  // Today: a waiting debrief comes first, then today's answer, otherwise an offer
  it("works out where today stands", () => {
    // Waiting from yesterday
    const waiting = missionToday([record({ status: "accepted", tried: null, outcome: null, debriefedAt: null })], NOW);
    // Skipped today
    const skipped = missionToday([record({ day: "2026-10-18", status: "skipped", predicted: null, tried: null, outcome: null, debriefedAt: null })], NOW);
    // Done yesterday
    const offer = missionToday([record()], NOW);
    // Confirm each
    expect([waiting.kind, skipped.kind, offer.kind, offer.mission.id]).toEqual(["debrief", "answered", "offer", "m02"]);
  });

  // The comparison says it plainly, and "better than you feared" is named
  it("compares the outcome with the prediction", () => {
    // Better, the same, worse, and not tried
    expect([compareLine(record()), compareLine(record({ outcome: 2 })), compareLine(record({ outcome: 1 })), compareLine(record({ tried: false, outcome: null }))]).toEqual([
      "You expected 2 of 5. It went 4 of 5. Better than you feared, which is common: people underestimate how well these go.",
      "You expected 2 of 5. It went 2 of 5. About what you expected.",
      "You expected 2 of 5. It went 1 of 5. Harder than you hoped. That happens; next time is a new try.",
      "No comparison this time. The mission will be offered again.",
    ]);
  });

  // Only tried missions count, for the streak and for the record
  it("counts tried missions for the streak and the record", () => {
    // Tried, not tried, and accepted
    const records = [record(), record({ id: "r2", tried: false, outcome: null }), record({ id: "r3", status: "accepted", tried: null, outcome: null, debriefedAt: null }), record({ id: "r4", predicted: 4, outcome: 3 })];
    // Confirm two days, two tried (newest first), and one of two better than expected
    expect([missionDays(records).length, triedMissions(records).map((item) => item.id), betterThanFeared(records), findMission("m14")?.move]).toEqual([2, ["r4", "r1"], { better: 1, total: 2 }, "Remember a name"]);
  });
});
