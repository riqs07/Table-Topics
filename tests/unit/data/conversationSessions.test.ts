// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the save being checked
import { saveConversationSession } from "@/data/conversationSessions";
// Load the turn type
import type { ConversationTurn } from "@/data/records";

// A fixed "now" for predictable output
const NOW = new Date(Date.UTC(2026, 9, 20, 18));

// Group the checks about saving a conversation (decision 83)
describe("saveConversationSession", () => {
  // Saved as a conversation waiting for the coach, with its situation, your words as the transcript and your rate over your own speaking time
  it("saves the turns, your words and your rate", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Theo opened, you spoke twice (one take heard nothing), Theo answered
    const turns: ConversationTurn[] = [{ who: "them", text: "Oh, hi.", lineId: "theo-01", seconds: 2 }, { who: "you", text: "hi there how is your week going", seconds: 3 }, { who: "you", text: "", seconds: 4 }, { who: "them", text: "Pretty quiet.", lineId: "theo-09", seconds: 1 }];
    // Save a 70-second conversation
    const session = await saveConversationSession(repository, { id: "c1", characterId: "theo", scenarioId: "class", twist: 2, turns, durationSec: 70.4 }, NOW);
    // Confirm what was saved, and that it is stored
    expect([session.mode, session.promptId, session.transcript, session.durationSec, session.wordsPerMinute, session.feedbackStatus, session.audioKey, session.createdAt, session.conversation?.turns.length, session.conversation?.scenarioId, session.conversation?.twist, (await repository.getSession("c1"))?.id]).toEqual(["conversation", "theo", "hi there how is your week going", 70, 60, "pending", null, "2026-10-20T17:58:50.000Z", 4, "class", 2, "c1"]);
  });
});
