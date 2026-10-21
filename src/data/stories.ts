// Saving the user's stories (decision 92): a story record is made the first time a seed is told, and its title can be changed

// Load the title rules
import { cleanStoryTitle, defaultStoryTitle } from "@/core/storyLibrary";
// Load the record type
import type { StoryRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// Make sure a story has its record, made with its starting title the first time it is told; returns the record
export async function ensureStory(repository: Repository, storyId: string, now: Date): Promise<StoryRecord> {
  // The record already here
  const existing = await repository.getStory(storyId);
  // Kept as it is
  if (existing) return existing;
  // A new one, titled from its prompt or moment
  const story: StoryRecord = { id: storyId, title: defaultStoryTitle(storyId, await repository.listSessions()), createdAt: now.toISOString(), updatedAt: now.toISOString() };
  // Saved
  await repository.saveStory(story);
  // Handed back
  return story;
}

// Change a story's title; an empty title puts back the starting one. Returns the saved record
export async function renameStory(repository: Repository, storyId: string, text: string, now: Date): Promise<StoryRecord> {
  // The record (made if it is missing)
  const story = await ensureStory(repository, storyId, now);
  // The new title, or the starting one when it was cleared
  const title = cleanStoryTitle(text) ?? defaultStoryTitle(storyId, await repository.listSessions());
  // The record with it
  const renamed = { ...story, title, updatedAt: now.toISOString() };
  // Saved
  await repository.saveStory(renamed);
  // Handed back
  return renamed;
}
