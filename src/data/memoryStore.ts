// An in-memory store for tests; behaves like IndexedDB by keeping copies of what is saved

// Load the collection types
import { COLLECTION_NAMES, type CollectionName, type Collections } from "@/data/records";
// Load the storage contract
import type { Store } from "@/data/store";

// A store that keeps everything in memory and forgets it when the page closes
export class MemoryStore implements Store {
  // One map of key to value for each collection
  private readonly areas = new Map<CollectionName, Map<string, unknown>>(COLLECTION_NAMES.map((name) => [name, new Map()]));

  // Find the map for a collection (always present because every collection is created up front)
  private area(collection: CollectionName): Map<string, unknown> {
    // Look up the collection's map
    return this.areas.get(collection) as Map<string, unknown>;
  }

  // Load one record, handing back a copy
  async get<C extends CollectionName>(collection: C, key: string): Promise<Collections[C] | undefined> {
    // Look up the value
    const value = this.area(collection).get(key) as Collections[C] | undefined;
    // Copy it so the caller cannot change what is stored
    return value === undefined ? undefined : structuredClone(value);
  }

  // Save a copy of a record
  async put<C extends CollectionName>(collection: C, key: string, value: Collections[C]): Promise<void> {
    // Store a copy so later changes to the original do not leak in
    this.area(collection).set(key, structuredClone(value));
  }

  // Remove one record
  async delete(collection: CollectionName, key: string): Promise<void> {
    // Drop the key from the collection
    this.area(collection).delete(key);
  }

  // Load copies of every record in a collection
  async getAll<C extends CollectionName>(collection: C): Promise<Array<Collections[C]>> {
    // Copy each stored value
    return [...this.area(collection).values()].map((value) => structuredClone(value) as Collections[C]);
  }

  // Remove every record in a collection
  async clear(collection: CollectionName): Promise<void> {
    // Empty the collection's map
    this.area(collection).clear();
  }
}
