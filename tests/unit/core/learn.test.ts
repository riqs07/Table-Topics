// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the rules being checked
import { RECALL_DAYS, afterRecall, dueCards, firstRead, nextCard, setProgress, shuffledRecall } from "@/core/learn";
// Load the cards
import { EVIDENCE_LABELS, LEARN_CARDS, LEARN_SETS, findCard } from "@/content/learn";

// A fixed "now"
const NOW = new Date(2026, 9, 18, 9);
// Days after now
const later = (days: number) => new Date(NOW.getTime() + days * 86_400_000);

// Group the checks about Learn's rules
describe("learn", () => {
  // Recall spacing: a day, a week, a month, three months; a miss starts again
  it("spaces recall out after right answers and resets after a miss", () => {
    // Read, then right three times, then wrong
    const read = firstRead(NOW);
    // First right
    const one = afterRecall(read, true, NOW);
    // Second right
    const two = afterRecall(one, true, NOW);
    // Third right
    const three = afterRecall(two, true, NOW);
    // A miss
    const missed = afterRecall(three, false, NOW);
    // Days until due for each
    const days = [read, one, two, three, missed].map((progress) => Math.round((new Date(progress.dueAt).getTime() - NOW.getTime()) / 86_400_000));
    // Confirm the spacing and the reset
    expect([days, three.box, missed.box, RECALL_DAYS]).toEqual([[1, 7, 30, 90, 1], 3, 0, [1, 7, 30, 90]]);
  });

  // Due cards come up once their time has come, longest overdue first
  it("lists due cards, longest overdue first", () => {
    // Two cards read on different days
    const progress = { "body-93": { ...firstRead(NOW), dueAt: later(2).toISOString() }, "talk-follow-ups": { ...firstRead(NOW), dueAt: later(1).toISOString() } };
    // Confirm none yet, then both in order
    expect([dueCards(progress, NOW).length, dueCards(progress, later(3)).map((card) => card.id)]).toEqual([0, ["talk-follow-ups", "body-93"]]);
  });

  // Shuffled answers keep track of the right one, and stay the same each time
  it("shuffles recall answers stably and keeps the right answer", () => {
    // Every card
    const ok = LEARN_CARDS.every((card) => {
      // Shuffled twice
      const first = shuffledRecall(card);
      // Again
      const second = shuffledRecall(card);
      // Same order, and the right answer moved with it
      return JSON.stringify(first) === JSON.stringify(second) && first.options[first.answer] === card.recall.options[card.recall.answer];
    });
    // The right answer is not always first after shuffling
    const firsts = LEARN_CARDS.filter((card) => shuffledRecall(card).answer === 0).length;
    // Confirm
    expect([ok, firsts < LEARN_CARDS.length * 0.6]).toEqual([true, true]);
  });

  // Progress per set, and the next unread card
  it("counts each set's read cards and finds the next card", () => {
    // One body-language card read
    const progress = { "body-93": firstRead(NOW) };
    // Confirm the count and that the next card is the very first
    expect([setProgress("body", progress), nextCard(progress)?.id]).toEqual([{ read: 1, total: LEARN_CARDS.filter((card) => card.set === "body").length }, LEARN_CARDS[0]?.id]);
  });

  // The cards are complete: unique ids, every set used, three answers with a valid right one, a label and a source
  it("has complete cards", () => {
    // Problems found
    const problems = LEARN_CARDS.filter((card) => !card.finding || !card.meaning || !card.doThis || !card.keyLine || card.recall.options.length !== 3 || card.recall.answer < 0 || card.recall.answer > 2 || !EVIDENCE_LABELS[card.evidence] || !card.source.text || (card.kind === "myth-or-fact" && !card.verdict) || (card.kind === "try-it" && !card.exercise)).map((card) => card.id);
    // Every id once
    const ids = LEARN_CARDS.map((card) => card.id);
    // Confirm
    expect([problems, new Set(ids).size === ids.length, LEARN_SETS.every((set) => LEARN_CARDS.some((card) => card.set === set.id)), LEARN_CARDS.length >= 35, findCard("body-faces")?.evidence]).toEqual([[], true, true, true, "strong"]);
  });
});
