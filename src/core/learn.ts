// Learn: which cards are read, progress per set, and the next card (the recall quiz and its review went with decision 67)

// Load the cards
import { LEARN_CARDS, type LearnCard, type LearnSetId } from "@/content/learn";
// Load the stored shape of a card's progress
import type { LearnCardProgress } from "@/data/records";

// What is kept about one card (stored with the settings)
export type CardProgress = LearnCardProgress;

// Every card's progress, by card id
export type LearnProgress = Readonly<Record<string, CardProgress>>;

// A card read for the first time
export function firstRead(now: Date): CardProgress {
  // Read now (the recall fields stay for older saved progress; cards have no quiz since decision 67)
  return { readAt: now.toISOString(), box: 0, dueAt: now.toISOString(), lastResult: null };
}

// How far through a set the user is: cards read, out of all
export function setProgress(set: LearnSetId, progress: LearnProgress): { read: number; total: number } {
  // The set's cards
  const cards = LEARN_CARDS.filter((card) => card.set === set);
  // Read ones out of all
  return { read: cards.filter((card) => progress[card.id]).length, total: cards.length };
}

// The next card to read: the first unread card, in set order
export function nextCard(progress: LearnProgress): LearnCard | undefined {
  // The first without progress
  return LEARN_CARDS.find((card) => !progress[card.id]);
}
