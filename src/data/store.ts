// The minimal storage contract the repository is written against, so tests can swap in a fake

// Load the collection types
import type { CollectionName, Collections } from "@/data/records";

// A key-value store with one area per collection
export interface Store {
  // Load one record, or undefined if there is none
  get<C extends CollectionName>(collection: C, key: string): Promise<Collections[C] | undefined>;
  // Save a record under a key, replacing any existing one
  put<C extends CollectionName>(collection: C, key: string, value: Collections[C]): Promise<void>;
  // Remove one record
  delete(collection: CollectionName, key: string): Promise<void>;
  // Load every record in a collection
  getAll<C extends CollectionName>(collection: C): Promise<Array<Collections[C]>>;
  // Remove every record in a collection
  clear(collection: CollectionName): Promise<void>;
}
