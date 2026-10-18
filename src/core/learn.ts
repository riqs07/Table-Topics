// Learn: when each card's recall question comes back, the order its answers are shown in, and progress per set

// Load the cards
import { LEARN_CARDS, type LearnCard, type LearnSetId } from "@/content/learn";
// Load the stored shape of a card's progress
import type { LearnCardProgress } from "@/data/records";

// What is kept about one card (stored with the settings)
export type CardProgress = LearnCardProgress;

// Every card's progress, by card id
export type LearnProgress = Readonly<Record<string, CardProgress>>;

// Days until the next recall, by how many times in a row it was right: a day, a week, a month, then three months
export const RECALL_DAYS: ReadonlyArray<number> = [1, 7, 30, 90];

// One day in milliseconds
const DAY_MS = 86_400_000;

// A moment a number of days after another, as ISO text
const daysAfter = (now: Date, days: number) => new Date(now.getTime() + days * DAY_MS).toISOString();

// A card read for the first time, with no recall answered yet: due again tomorrow
export function firstRead(now: Date): CardProgress {
  // Read now, due in a day
  return { readAt: now.toISOString(), box: 0, dueAt: daysAfter(now, RECALL_DAYS[0] ?? 1), lastResult: null };
}

// The progress after answering a card's recall question: right moves it further out, wrong brings it back tomorrow
export function afterRecall(previous: CardProgress | undefined, right: boolean, now: Date): CardProgress {
  // A card answered without having been read counts as read now
  const start = previous ?? firstRead(now);
  // Right: one step further; wrong: back to the start
  const box = right ? Math.min(start.box + 1, RECALL_DAYS.length) : 0;
  // The wait for this box (the longest once past the end)
  const days = RECALL_DAYS[Math.min(box, RECALL_DAYS.length - 1)] ?? 1;
  // The new progress
  return { readAt: start.readAt, box, dueAt: daysAfter(now, days), lastResult: right ? "right" : "wrong", recalledAt: now.toISOString() };
}

// The cards whose recall question is due now, the longest overdue first
export function dueCards(progress: LearnProgress, now: Date): LearnCard[] {
  // Cards with progress that is due
  return LEARN_CARDS.filter((card) => progress[card.id] && new Date(progress[card.id]!.dueAt) <= now).sort((a, b) => progress[a.id]!.dueAt.localeCompare(progress[b.id]!.dueAt));
}

// A small, stable number from a text, so a card's answers are shuffled the same way every time
function seed(text: string): number {
  // A simple rolling hash
  let hash = 0;
  // Each character
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  // The hash
  return hash;
}

// A card's recall answers in a stable shuffled order, with the right one's new position
export function shuffledRecall(card: LearnCard): { options: string[]; answer: number } {
  // Pair each answer with its place
  const items = card.recall.options.map((option, index) => ({ option, right: index === card.recall.answer }));
  // A stable random source from the card's id
  let state = seed(card.id) || 1;
  // Shuffle (Fisher-Yates), using the stable source
  for (let index = items.length - 1; index > 0; index--) {
    // The next number
    state = (state * 1103515245 + 12345) >>> 0;
    // A place to swap with
    const other = state % (index + 1);
    // Swap
    [items[index], items[other]] = [items[other]!, items[index]!];
  }
  // The answers and where the right one ended up
  return { options: items.map((item) => item.option), answer: items.findIndex((item) => item.right) };
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
