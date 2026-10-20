// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the rule being checked
import { FIRST_TAKES_KEPT, audioToPrune, firstTakesToKeep } from "@/core/audioRetention";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// A timestamp on the nth day of October 2026 at the given hour
const at = (day: number, hour = 12) => new Date(2026, 9, day, hour).toISOString();

// Group the checks about which recordings keep their audio (decision 88)
describe("audio retention", () => {
  // A prompt recorded only once has nothing to compare, so its first take follows the setting like any other
  it("keeps no first take for a prompt recorded once", () => {
    // One take of one prompt
    const sessions = [makeSession({ id: "a", promptId: "p1", createdAt: at(1), audioKey: "k-a" })];
    // Confirm nothing is kept for comparing and, with no recent ones kept, it is pruned
    expect([[...firstTakesToKeep(sessions)], audioToPrune(sessions, 0).map((session) => session.id)]).toEqual([[], ["a"]]);
  });

  // A retry the same day has its own comparison screen, so only a take on a later day earns the first one a place
  it("keeps a first take only when the prompt was recorded again on a later day", () => {
    // p1 twice on one day, p2 on two days
    const sessions = [makeSession({ id: "p2-later", promptId: "p2", createdAt: at(3) }), makeSession({ id: "p2-first", promptId: "p2", createdAt: at(2) }), makeSession({ id: "p1-retry", promptId: "p1", createdAt: at(1, 13) }), makeSession({ id: "p1-first", promptId: "p1", createdAt: at(1, 12) })];
    // Confirm only p2's first take is kept
    expect([...firstTakesToKeep(sessions)]).toEqual(["p2-first"]);
  });

  // Rehearsal sections and Q&A questions are compared apart, as "then and now" pairs them
  it("treats each section of a talk as its own prompt", () => {
    // Section 1 on two days, section 2 once
    const sessions = [makeSession({ id: "s1-later", promptId: "talk", sectionIndex: 0, createdAt: at(4) }), makeSession({ id: "s2", promptId: "talk", sectionIndex: 1, createdAt: at(3) }), makeSession({ id: "s1-first", promptId: "talk", sectionIndex: 0, createdAt: at(2) })];
    // Confirm only section 1's first take is kept
    expect([...firstTakesToKeep(sessions)]).toEqual(["s1-first"]);
  });

  // Hundreds of prompts used to keep a first take each, so storage grew without end; now only the 20 practised most recently do
  it("keeps first takes for at most the 20 most recently practised prompts", () => {
    // 25 prompts, each first recorded on day 1 and again on a later day (prompt n on day n + 1), newest first
    const sessions = Array.from({ length: 25 }, (_, index) => [makeSession({ id: `p${index}-again`, promptId: `p${index}`, createdAt: at(index + 2) }), makeSession({ id: `p${index}-first`, promptId: `p${index}`, createdAt: at(1, index % 12) })]).flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    // The kept first takes
    const kept = firstTakesToKeep(sessions);
    // Confirm the cap, and that the five practised longest ago lost their place
    expect([kept.size, FIRST_TAKES_KEPT, ["p0-first", "p4-first", "p5-first", "p24-first"].map((id) => kept.has(id))]).toEqual([20, 20, [false, false, true, true]]);
  });

  // The very first recording always keeps its audio, and the newest ones follow the setting
  it("never prunes the baseline or the recent ones the setting keeps", () => {
    // Newest first: two recent, one old, and the baseline
    const sessions = [makeSession({ id: "new", promptId: "x", createdAt: at(9), audioKey: "k1" }), makeSession({ id: "newer-old", promptId: "y", createdAt: at(8), audioKey: "k2" }), makeSession({ id: "old", promptId: "z", createdAt: at(5), audioKey: "k3" }), makeSession({ id: "base", promptId: "w", createdAt: at(1), audioKey: "k4", isBaseline: true })];
    // Confirm only the old one goes when two recent ones are kept
    expect(audioToPrune(sessions, 2).map((session) => session.id)).toEqual(["old"]);
  });

  // Sessions whose audio is already gone are not counted again
  it("skips sessions without audio", () => {
    // An old session with no audio
    const sessions = [makeSession({ id: "gone", promptId: "x", createdAt: at(1), audioKey: null })];
    // Confirm nothing to prune
    expect(audioToPrune(sessions, 0)).toEqual([]);
  });
});
