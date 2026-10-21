// The minimal storage contract the repository is written against, so tests can swap in a fake

// Load the collection types
import type { CollectionName, Collections } from "@/data/records";

// One change in a batch: save a record, remove one, or change one from what is stored at that moment (so a change never writes back a stale copy)
export type StoreOp =
  // Save a record under a key
  | { [C in CollectionName]: { kind: "put"; collection: C; key: string; value: Collections[C] } }[CollectionName]
  // Remove a record
  | { kind: "delete"; collection: CollectionName; key: string }
  // Change a record from its stored value (undefined when missing); returning undefined leaves it as it is, and null removes it. Changes in one batch run in the order given, so a later change can depend on what an earlier one decided
  | { [C in CollectionName]: { kind: "update"; collection: C; key: string; change: (stored: Collections[C] | undefined) => Collections[C] | undefined | null } }[CollectionName];

// A key-value store with one area per collection
export interface Store {
  // Load one record, or undefined if there is none
  get<C extends CollectionName>(collection: C, key: string): Promise<Collections[C] | undefined>;
  // Load several records by key, in the same order (undefined where there is none)
  getMany<C extends CollectionName>(collection: C, keys: ReadonlyArray<string>): Promise<Array<Collections[C] | undefined>>;
  // Save a record under a key, replacing any existing one
  put<C extends CollectionName>(collection: C, key: string, value: Collections[C]): Promise<void>;
  // Remove one record
  delete(collection: CollectionName, key: string): Promise<void>;
  // Load every record in a collection
  getAll<C extends CollectionName>(collection: C): Promise<Array<Collections[C]>>;
  // Load the records whose field has a value, through the database's lookup for that field (only fields listed in COLLECTION_INDEXES)
  getAllWhere<C extends CollectionName>(collection: C, field: string, value: string): Promise<Array<Collections[C]>>;
  // Every key in a collection, without reading the records
  keys(collection: CollectionName): Promise<string[]>;
  // Remove every record in a collection
  clear(collection: CollectionName): Promise<void>;
  // Apply several changes together: all of them are saved, or none (decision 98)
  batch(ops: ReadonlyArray<StoreOp>): Promise<void>;
}
