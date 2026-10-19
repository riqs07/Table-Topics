// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the rules being checked
import { firstRead, nextCard, setProgress } from "@/core/learn";
// Load the cards
import { EVIDENCE_LABELS, LEARN_CARDS, LEARN_SETS, findCard } from "@/content/learn";
// Load the lessons, to check the cards' links to them
import { findLesson } from "@/content/lessons";

// A fixed "now"
const NOW = new Date(2026, 9, 18, 9);

// Group the checks about Learn's rules
describe("learn", () => {
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

  // Decision 71: the new sets, each card with a small step to try for real, and links that lead somewhere
  it("adds voice, point, minds and hard conversations, every new card with a real-world step and working lesson links", () => {
    // The new sets
    const added = ["voice", "point", "minds", "hard"];
    // Their cards, plus the ones added to older sets
    const fresh = LEARN_CARDS.filter((card) => added.includes(card.set) || ["nerves-own-name", "warm-thanks-note", "body-look-away", "body-stillness", "body-not-face", "body-voice-feelings", "body-read-room"].includes(card.id));
    // Lesson links that name a lesson that does not exist
    const broken = LEARN_CARDS.flatMap((card) => (card.tryIt?.href.startsWith("/session?mode=lesson&prompt=") && !findLesson(card.tryIt.href.split("prompt=")[1] ?? "") ? [card.id] : []));
    // Confirm each new set has at least five cards, every new card has its step, and no link is broken
    expect([added.map((set) => LEARN_CARDS.filter((card) => card.set === set).length >= 5), fresh.length, fresh.filter((card) => !card.outThere).map((card) => card.id), broken]).toEqual([[true, true, true, true], 27, [], []]);
  });
});
