// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the import check
import { parseExport } from "@/data/exportFile";
// Load a session maker
import { makeSession } from "../../support/fixtures";

// The fixed "now"
const NOW = new Date(Date.UTC(2026, 9, 22, 10));

// A file around some sessions
function file(sessions: unknown[]): string {
  // As exported
  return JSON.stringify({ format: "voicelab-export", version: 1, exportedAt: NOW.toISOString(), sessions, challenges: [], settings: { focusIndex: 0, focusStartedOn: NOW.toISOString(), audioRetention: 30 } });
}

// Whether a file is accepted
function accepted(text: string): boolean {
  // Parsing can refuse
  try {
    // Parsed
    parseExport(text);
    // Accepted
    return true;
  } catch {
    // Refused
    return false;
  }
}

// Group the checks on a conversation's times, difficulty and turn mode in exports (decision 120)
describe("conversation times in exports", () => {
  // Kept as they are; wrong kinds refused
  it("keeps the times, difficulty and mode, and refuses wrong kinds", () => {
    // Timed turns
    const turns = [{ who: "them" as const, text: "Hi", seconds: 2, at: 0, end: 2, cut: true }, { who: "you" as const, text: "hey", seconds: 1, at: 2.4, end: 3.4 }];
    // A conversation with them
    const session = makeSession({ id: "c1", mode: "conversation", promptId: "maya", conversation: { turns, difficulty: "hard", turnMode: "live" } });
    // Broken versions
    const [badTime, badDifficulty, badMode] = [{ ...session, conversation: { turns: [{ ...turns[0], at: "soon" }] } }, { ...session, conversation: { turns, difficulty: "brutal" } }, { ...session, conversation: { turns, turnMode: "telepathy" } }];
    // Kept, and each broken one refused
    expect([parseExport(file([session])).sessions[0]?.conversation, accepted(file([badTime])), accepted(file([badDifficulty])), accepted(file([badMode]))]).toEqual([{ turns, difficulty: "hard", turnMode: "live" }, false, false, false]);
  });
});
