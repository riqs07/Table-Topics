// The app's one repository in the browser, stored in IndexedDB and created on first use

// Load the IndexedDB store
import { IndexedDbStore } from "@/data/indexedDbStore";
// Load the repository builder and type
import { createRepository, type Repository } from "@/data/repository";

// The channel tabs use to tell each other the stored data changed, so a shared read is made again (decision 99); app-specific, like every storage name here
const CHANGES_CHANNEL = "voicelab-practice-journal-changes";

// The shared repository, once created
let shared: Repository | null = null;

// Get the shared browser repository, creating it the first time
export function browserRepository(): Repository {
  // Create it on first use and reuse it afterwards, with the tab channel where the browser has one
  shared ??= createRepository(new IndexedDbStore(), { channel: typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANGES_CHANNEL) });
  // Hand it back
  return shared;
}
