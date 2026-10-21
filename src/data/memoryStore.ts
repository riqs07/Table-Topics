// An in-memory store for tests; behaves like IndexedDB by keeping copies of what is saved

// Load the collection types
import { COLLECTION_NAMES, type CollectionName, type Collections } from "@/data/records";
// Load the storage contract
import type { Store, StoreOp } from "@/data/store";

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

  // Load copies of several records by key
  async getMany<C extends CollectionName>(collection: C, keys: ReadonlyArray<string>): Promise<Array<Collections[C] | undefined>> {
    // Each in turn
    return Promise.all(keys.map((key) => this.get(collection, key)));
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

  // Load copies of the records whose field has a value
  async getAllWhere<C extends CollectionName>(collection: C, field: string, value: string): Promise<Array<Collections[C]>> {
    // Every record, kept when the field matches
    return (await this.getAll(collection)).filter((record) => (record as unknown as Record<string, unknown>)[field] === value);
  }

  // Every key in a collection, in order (as IndexedDB sorts them)
  async keys(collection: CollectionName): Promise<string[]> {
    // The keys, sorted
    return [...this.area(collection).keys()].sort();
  }

  // Remove every record in a collection
  async clear(collection: CollectionName): Promise<void> {
    // Empty the collection's map
    this.area(collection).clear();
  }

  // Apply several changes together: worked out on copies first, so a failure leaves everything as it was
  async batch(ops: ReadonlyArray<StoreOp>): Promise<void> {
    // The collections touched, copied
    const drafts = new Map<CollectionName, Map<string, unknown>>();
    // A collection's draft, copied on first use
    const draft = (collection: CollectionName) => {
      // Copy it once
      if (!drafts.has(collection)) drafts.set(collection, new Map(this.area(collection)));
      // Hand it back
      return drafts.get(collection) as Map<string, unknown>;
    };
    // Each change in order
    for (const op of ops) {
      // The collection's draft
      const area = draft(op.collection);
      // Save
      if (op.kind === "put") area.set(op.key, structuredClone(op.value));
      // Remove
      else if (op.kind === "delete") area.delete(op.key);
      // Change from the stored value
      else {
        // The stored value, copied
        const stored = area.get(op.key);
        // The new value
        const next = (op.change as (value: unknown) => unknown)(stored === undefined ? undefined : structuredClone(stored));
        // Removed when asked
        if (next === null) area.delete(op.key);
        // Saved when there is a new value
        else if (next !== undefined) area.set(op.key, structuredClone(next));
      }
    }
    // Every change worked: keep the drafts
    for (const [collection, area] of drafts) this.areas.set(collection, area);
  }
}
