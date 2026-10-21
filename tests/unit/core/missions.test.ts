// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the rules being checked
import { betterThanFeared, compareLine, missionDays, missionToday, missionsInUnit, nextMission, triedMissions } from "@/core/missions";
// Load the missions
import { LEVEL_WORDS, MISSIONS, findMission } from "@/content/missions";
// Load the units, to check each mission names a real one
import { UNITS } from "@/content/smallTalk";
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

  // The guess beforehand is optional: without one, the line says only how it went
  it("says how it went when no prediction was made", () => {
    // Tried with no prediction, and not tried with no prediction
    expect([compareLine(record({ predicted: null })), compareLine(record({ predicted: null, tried: false, outcome: null }))]).toEqual(["It went 4 of 5.", "No comparison this time. The mission will be offered again."]);
  });

  // Only tried missions count, for the streak and for the record
  it("counts tried missions for the streak and the record", () => {
    // Tried, not tried, and accepted
    const records = [record(), record({ id: "r2", tried: false, outcome: null }), record({ id: "r3", status: "accepted", tried: null, outcome: null, debriefedAt: null }), record({ id: "r4", predicted: 4, outcome: 3 })];
    // Confirm two days, two tried (newest first), and one of two better than expected
    expect([missionDays(records).length, triedMissions(records).map((item) => item.id), betterThanFeared(records), findMission("m14")?.move]).toEqual([2, ["r4", "r1"], { better: 1, total: 2 }, "Remember a name"]);
  });

  // The units added in decision 95: each has missions from easy to bold, with its own debrief question, and the name mission is the research-corrected one
  it("gives the new units their missions, each with its own debrief question", () => {
    // Missions naming a unit that does not exist
    const strays = MISSIONS.filter((mission) => mission.unit !== null && !UNITS.some((unit) => unit.id === mission.unit)).map((mission) => mission.id);
    // Each new unit's missions, in ladder order
    const byUnit = (unit: "room" | "starting" | "deeper") => missionsInUnit(unit, []).map((item) => item.mission.id);
    // The missions added in this change
    const added = ["m15", "m16", "m17", "m18", "m19"].map((id) => findMission(id)!);
    // Confirm: no strays; each unit's missions; every new one with a debrief question and a card; the name mission framed as memory; the level words
    expect([strays, byUnit("room"), byUnit("starting"), byUnit("deeper"), added.every((mission) => !!mission.notice && !!mission.cardId), findMission("m14")?.task, LEVEL_WORDS[1]]).toEqual([[], ["m15", "m16", "m17"], ["m18", "m09", "m13", "m14"], ["m10", "m11", "m19"], true, "Learn one new name and use it when you say goodbye.", "Easy"]);
  });

  // Saved tries are untouched: someone who had tried the first four easy missions is offered the new easy one next, and their tries still count
  it("keeps saved tries, and offers a new easy mission next", () => {
    // The four easy missions tried before this change
    const before = ["m01", "m02", "m03", "m04"].map((missionId, index) => record({ id: `r${index}`, missionId }));
    // Confirm the next mission, and the tries shown as done on the asking unit
    expect([nextMission(before).id, missionsInUnit("asking", before).map((item) => [item.mission.id, item.tried])]).toEqual(["m15", [["m01", true], ["m06", false]]]);
  });

  // Only tries that were debriefed as tried mark a mission done
  it("marks a unit's mission tried only after a debriefed try", () => {
    // Accepted but not debriefed, and debriefed but not tried
    const records = [record({ missionId: "m15", status: "accepted", tried: null, outcome: null, debriefedAt: null }), record({ id: "r2", missionId: "m16", tried: false, outcome: null })];
    // Confirm none tried
    expect(missionsInUnit("room", records).map((item) => item.tried)).toEqual([false, false, false]);
  });
});
