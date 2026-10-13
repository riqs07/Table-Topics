// The app's one repository in the browser, stored in IndexedDB and created on first use

// Load the IndexedDB store
import { IndexedDbStore } from "@/data/indexedDbStore";
// Load the repository builder and type
import { createRepository, type Repository } from "@/data/repository";

// The shared repository, once created
let shared: Repository | null = null;

// Get the shared browser repository, creating it the first time
export function browserRepository(): Repository {
  // Create it on first use and reuse it afterwards
  shared ??= createRepository(new IndexedDbStore());
  // Hand it back
  return shared;
}
