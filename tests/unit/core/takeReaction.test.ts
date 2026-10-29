// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { takeReaction } from "@/core/takeReaction";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// Three earlier Rapid Fire takes, the best at 2.3 pause words a minute
const EARLIER = [2.3, 3.1, 4].map((rate, index) => makeSession({ id: `e${index}`, mode: "talk", promptId: "t001", durationSec: 70, fillersPerMinute: rate, createdAt: `2026-10-2${index}T10:00:00.000Z` }));
// A take after them
const take = (overrides: Parameters<typeof makeSession>[0]) => makeSession({ id: "now", mode: "talk", promptId: "t002", durationSec: 77, fillersPerMinute: 1.1, createdAt: "2026-10-28T10:00:00.000Z", ...overrides });

// Group the checks about the blob's reaction on the results page (decision 141)
describe("takeReaction", () => {
  // Fewer pause words than every earlier take is a best, with the before and after
  it("calls a personal best", () => {
    // Confirm
    expect(takeReaction(take({}), [...EARLIER, take({})], true)).toEqual({ kind: "best", line: "Your fewest pause words yet.", before: "2.3", after: "1.1" });
  });

  // No best when counts are hidden, too few earlier takes, a take too short, the same rate as shown, or worse
  it("holds back a best that would not mean much", () => {
    // Each case's kind
    const kinds = [takeReaction(take({}), EARLIER, false), takeReaction(take({}), EARLIER.slice(0, 2), true), takeReaction(take({ durationSec: 20 }), EARLIER, true), takeReaction(take({ fillersPerMinute: 2.26 }), EARLIER, true), takeReaction(take({ fillersPerMinute: 5 }), EARLIER, true)].map((reaction) => reaction.kind);
    // Confirm: inside the window for the full-length ones, plain for the short one
    expect(kinds).toEqual(["window", "window", "done", "window", "window"]);
  });

  // The first recording, inside the window, and otherwise a plain word
  it("falls back to the first take, the window, then a plain word", () => {
    // Confirm each line
    expect([takeReaction(take({ isBaseline: true }), [], true).line, takeReaction(take({}), [], true).line, takeReaction(take({ durationSec: 40 }), [], true).line, takeReaction(take({ mode: "read", promptId: "lincoln-second-inaugural-1" }), [], true).kind]).toEqual(["Your first one! That’s the hardest one done.", "Nice one. 1:17, right in the window.", "One more in the bank. Here’s one thing to try.", "done"]);
  });
});
