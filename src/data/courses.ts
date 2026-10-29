// Saving progress through guided courses (decision 131): kept in the settings record, like Learn cards and missions, read safely so older or foreign values never break a page

// Load the safe reader and the progress type
import { readCourseProgress, type CourseProgress } from "@/core/courses";
// Load the repository type
import type { Repository } from "@/data/repository";

// Every finished part, read safely
export async function loadCourseProgress(repository: Repository, now: Date): Promise<CourseProgress> {
  // From the settings
  return readCourseProgress((await repository.getSettings(now)).courses);
}

// Mark a part finished, with its last try's take (or none); a part finished before keeps its first finish and comeback, and only takes the newer take
export async function markPartDone(repository: Repository, partId: string, takeId: string | null, now: Date): Promise<CourseProgress> {
  // The settings
  const settings = await repository.getSettings(now);
  // Progress so far, read safely
  const progress = readCourseProgress(settings.courses);
  // This part's earlier finish, if any
  const earlier = progress[partId];
  // The part's new progress: its first finish kept, the newest take when there is one
  const next = { ...progress, [partId]: earlier ? { ...earlier, takeId: takeId ?? earlier.takeId } : { doneAt: now.toISOString(), takeId } };
  // Save it
  await repository.saveSettings({ ...settings, courses: next });
  // Hand it back
  return next;
}

// Mark a part's prompt as answered again, with that answer's take
export async function markRevisited(repository: Repository, partId: string, takeId: string, now: Date): Promise<CourseProgress> {
  // The settings
  const settings = await repository.getSettings(now);
  // Progress so far, read safely
  const progress = readCourseProgress(settings.courses);
  // The part's progress
  const earlier = progress[partId];
  // Not finished: nothing to mark
  if (!earlier) return progress;
  // The comeback added
  const next = { ...progress, [partId]: { ...earlier, revisitedAt: now.toISOString(), revisitTakeId: takeId } };
  // Save it
  await repository.saveSettings({ ...settings, courses: next });
  // Hand it back
  return next;
}
