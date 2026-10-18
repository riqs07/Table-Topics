// Reads and saves Learn progress, which is kept with the settings so it travels in exports

// Load the progress rules
import { afterRecall, firstRead, type LearnProgress } from "@/core/learn";
// Load the repository type
import type { Repository } from "@/data/repository";

// Every card's progress
export async function loadLearnProgress(repository: Repository, now: Date): Promise<LearnProgress> {
  // From the settings, or none yet
  return (await repository.getSettings(now)).learn ?? {};
}

// Note that a card was read (keeping any progress it already has)
export async function markCardRead(repository: Repository, cardId: string, now: Date): Promise<LearnProgress> {
  // The settings as they are now
  const settings = await repository.getSettings(now);
  // The progress so far
  const learn = settings.learn ?? {};
  // Already read: nothing to change
  if (learn[cardId]) return learn;
  // With this card read
  const next = { ...learn, [cardId]: firstRead(now) };
  // Save it
  await repository.saveSettings({ ...settings, learn: next });
  // Hand it back
  return next;
}

// Save how a card's recall question went
export async function saveRecall(repository: Repository, cardId: string, right: boolean, now: Date): Promise<LearnProgress> {
  // The settings as they are now
  const settings = await repository.getSettings(now);
  // The progress so far
  const learn = settings.learn ?? {};
  // With this answer
  const next = { ...learn, [cardId]: afterRecall(learn[cardId], right, now) };
  // Save it
  await repository.saveSettings({ ...settings, learn: next });
  // Hand it back
  return next;
}
