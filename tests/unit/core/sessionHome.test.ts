// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the rule being checked
import { sessionHome, practiceSessions } from "@/core/sessionHome";
// Load the voice-home lists
import { PAUSE_DRILLS, TRICKY_WORDS } from "@/content/prompts";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// Group the checks about where a session belongs
describe("sessionHome", () => {
  // Each kind of session goes back to its own section, and anything in today's practice to Today
  it("leads each kind of session back to its section", () => {
    // A reading, a Table Topic, a rehearsal, a reading inside the plan, and a lesson
    const homes = [sessionHome("read", "r001", false), sessionHome("talk", "t1", false), sessionHome("rehearse", "talk 1", false), sessionHome("read", "r001", true), sessionHome("lesson", "l001", false)].map((home) => [home.section, home.href]);
    // Confirm each (a lesson goes back to its set in Learn; decision 107)
    expect(homes).toEqual([["skills", "/skills"], ["practice", "/practice"], ["practice", "/talk?id=talk%201"], ["today", "/"], ["learn", "/learn/set?id=skills"]]);
  });

  // Voice drills, pause drills and tricky-word lists close back to Your voice (decision 80)
  it("leads voice, pause and tricky-word sessions back to Your voice", () => {
    // One of each
    const homes = [sessionHome("voice", "v01", false), sessionHome("pause", PAUSE_DRILLS[0]!.id, false), sessionHome("read", TRICKY_WORDS[0]!.id, false)].map((home) => home.href);
    // Confirm each
    expect(homes).toEqual(["/voice", "/voice", "/voice"]);
  });

  // A conversation closes back to the list of people (decision 83)
  it("leads a conversation back to Conversations", () => {
    // Outside and inside today's practice
    expect([sessionHome("conversation", "maya", false).href, sessionHome("conversation", "maya", true).href]).toEqual(["/conversations", "/"]);
  });

  // Small talk and moment notes are kept apart from the speech practice
  it("leaves out only private moment notes, and closes small talk back to its page", () => {
    // One of each
    const sessions = [makeSession({ id: "a", mode: "talk" }), makeSession({ id: "b", mode: "smalltalk" }), makeSession({ id: "c", mode: "moment" })];
    // Confirm the moment is left out, small talk closes back to its page, and inside today's practice back to Today
    expect([practiceSessions(sessions).map((session) => session.id), sessionHome("moment", "moment", false).href, sessionHome("smalltalk", "st01", true).href, sessionHome("smalltalk", "sa01", false).href]).toEqual([["a", "b"], "/small-talk/unit?id=answering", "/", "/small-talk/unit?id=asking"]);
  });
});
