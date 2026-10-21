// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the full cards and the index made from them
import { LEARN_CARDS } from "@/content/learn";
import { LEARN_INDEX } from "@/content/learnIndex";

// Group the checks about the Learn cards' index (decision 99)
describe("learn index", () => {
  // The index is written from the cards; if they change without it, Today would offer the wrong next card
  it("matches the cards exactly (run pnpm learn-index after changing learn.ts)", () => {
    // Confirm each entry matches its card, in order
    expect(LEARN_INDEX).toEqual(LEARN_CARDS.map((card) => ({ id: card.id, set: card.set, title: card.title })));
  });
});
