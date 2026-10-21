// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the content lookup and every bank of prompts
import { ASKING_DRILLS, DEEPER_DRILLS, LISTENING_STORIES, NEWS_DRILLS, ROOM_DRILLS, SMALL_TALK_LESSONS, SMALL_TALK_QUESTIONS, STARTING_DRILLS, unitOf } from "@/content/smallTalk";
// Load the light lookup by id alone
import { unitOf as unitFromId } from "@/content/smallTalkUnit";

// Group the checks about the light unit lookup (decision 99)
describe("unit from a prompt's id", () => {
  // It must agree with the content for every small-talk prompt, so moving it never changes which unit a take belongs to
  it("agrees with the content for every question, drill and lesson", () => {
    // Every small-talk prompt's id
    const ids = [...SMALL_TALK_QUESTIONS, ...SMALL_TALK_LESSONS, ...ASKING_DRILLS, ...NEWS_DRILLS, ...LISTENING_STORIES, ...ROOM_DRILLS, ...STARTING_DRILLS, ...DEEPER_DRILLS].map((item) => item.id);
    // Confirm there are many, and each agrees
    expect([ids.length > 100, ids.filter((id) => unitFromId(id) !== unitOf(id))]).toEqual([true, []]);
  });

  // Other modes' prompt ids are answering, as the content lookup says
  it("calls any other id answering", () => {
    // A Rapid Fire prompt, a story prompt, a guided story, a moment, a conversation persona and nonsense
    const ids = ["t001", "sp01", "gs01", "moment", "maya", "sa", "stx1"];
    // Confirm each agrees with the content
    expect(ids.map(unitFromId)).toEqual(ids.map(unitOf));
  });
});
