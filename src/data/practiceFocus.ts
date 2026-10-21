// Saving what the user wants to get better at most (decision 97), kept with the settings so it goes into exports and comes back on import

// Load the focus type and the reader that makes a saved one safe
import { readPracticeFocus, type FocusAreaId } from "@/core/practiceFocus";
// Load the repository type
import type { Repository } from "@/data/repository";

// The saved focus: missing when never asked, otherwise the areas (none means asked and left open)
export async function loadPracticeFocus(repository: Repository, now: Date): Promise<FocusAreaId[] | undefined> {
  // Read the settings and clean the choice
  return readPracticeFocus((await repository.getSettings(now)).practiceFocus);
}

// Save the focus (an empty list records that the question was answered or put aside)
export async function savePracticeFocus(repository: Repository, focus: ReadonlyArray<FocusAreaId>, now: Date): Promise<void> {
  // The settings as they are now, so nothing else is overwritten with an old copy
  const settings = await repository.getSettings(now);
  // Save them with the cleaned choice
  await repository.saveSettings({ ...settings, practiceFocus: readPracticeFocus([...focus]) ?? [] });
}
