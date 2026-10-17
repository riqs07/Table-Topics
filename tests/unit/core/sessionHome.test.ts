// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the rule being checked
import { sessionHome, speechSessions } from "@/core/sessionHome";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// Group the checks about where a session belongs
describe("sessionHome", () => {
  // Each kind of session goes back to its own section, and anything in today's practice to Today
  it("leads each kind of session back to its section", () => {
    // A reading, a Table Topic, a rehearsal, and a reading inside the plan
    const homes = [sessionHome("read", "r001", false), sessionHome("talk", "t1", false), sessionHome("rehearse", "talk 1", false), sessionHome("read", "r001", true)].map((home) => [home.section, home.href]);
    // Confirm each
    expect(homes).toEqual([["skills", "/skills"], ["practice", "/practice"], ["practice", "/talk?id=talk%201"], ["today", "/"]]);
  });

  // Small talk and moment notes are kept apart from the speech practice
  it("keeps small talk and moments out of the speech practice", () => {
    // One of each
    const sessions = [makeSession({ id: "a", mode: "talk" }), makeSession({ id: "b", mode: "smalltalk" }), makeSession({ id: "c", mode: "moment" })];
    // Confirm only the Table Topic stays, and the others close back to Small talk
    expect([speechSessions(sessions).map((session) => session.id), sessionHome("moment", "moment", false).href]).toEqual([["a"], "/small-talk"]);
  });
});
