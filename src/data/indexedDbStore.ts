// The real browser store, built on IndexedDB (the browser's built-in database)

// Load the collection types
import { COLLECTION_NAMES, type CollectionName, type Collections } from "@/data/records";
// Load the storage contract
import type { Store } from "@/data/store";

// Version of the database layout; raise it when collections change
const DATABASE_VERSION = 1;

// Turn an IndexedDB request into a promise that settles when it finishes
function settle<T>(request: IDBRequest<T>): Promise<T> {
  // Wrap the request's success and error events
  return new Promise((resolve, reject) => {
    // Hand back the result on success
    request.onsuccess = () => resolve(request.result);
    // Pass the error on failure
    request.onerror = () => reject(request.error);
  });
}

// A store that keeps records in the browser's IndexedDB
export class IndexedDbStore implements Store {
  // The open database, created on first use
  private database: Promise<IDBDatabase> | null = null;

  // Remember which database to use; "voicelab" in the app, unique names in tests
  constructor(private readonly name = "voicelab") {}

  // Open the database once, creating its collections the first time
  private open(): Promise<IDBDatabase> {
    // Reuse the database if it is already opening or open
    if (this.database) return this.database;
    // Ask the browser to open (or create) the database
    const request = indexedDB.open(this.name, DATABASE_VERSION);
    // Create any missing collections when the database is new or upgraded
    request.onupgradeneeded = () => {
      // Check each collection
      for (const collection of COLLECTION_NAMES) {
        // Create it if it does not exist yet
        if (!request.result.objectStoreNames.contains(collection)) request.result.createObjectStore(collection);
      }
    };
    // Keep the pending database so later calls share it
    this.database = settle(request);
    // Hand it back
    return this.database;
  }

  // Run one operation on a collection inside a transaction and wait for it to finish
  private async run<T>(collection: CollectionName, mode: IDBTransactionMode, operation: (area: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    // Get the open database
    const database = await this.open();
    // Start a transaction on the collection
    const transaction = database.transaction(collection, mode);
    // Start the operation
    const result = settle(operation(transaction.objectStore(collection)));
    // Wait until the transaction is fully committed, so the data is really saved
    const committed = new Promise<void>((resolve, reject) => {
      // Finish when the transaction completes
      transaction.oncomplete = () => resolve();
      // Fail if the transaction fails
      transaction.onerror = () => reject(transaction.error);
      // Fail if the transaction is aborted
      transaction.onabort = () => reject(transaction.error);
    });
    // Wait for both, so an error from either is reported once and never left unhandled
    const [value] = await Promise.all([result, committed]);
    // Hand back the operation's result
    return value;
  }

  // Load one record
  async get<C extends CollectionName>(collection: C, key: string): Promise<Collections[C] | undefined> {
    // Read the record by key
    return (await this.run(collection, "readonly", (area) => area.get(key))) as Collections[C] | undefined;
  }

  // Save a record under a key
  async put<C extends CollectionName>(collection: C, key: string, value: Collections[C]): Promise<void> {
    // Write the record (IndexedDB stores a copy)
    await this.run(collection, "readwrite", (area) => area.put(value, key));
  }

  // Remove one record
  async delete(collection: CollectionName, key: string): Promise<void> {
    // Delete the record by key
    await this.run(collection, "readwrite", (area) => area.delete(key));
  }

  // Load every record in a collection
  async getAll<C extends CollectionName>(collection: C): Promise<Array<Collections[C]>> {
    // Read all records
    return (await this.run(collection, "readonly", (area) => area.getAll())) as Array<Collections[C]>;
  }

  // Remove every record in a collection
  async clear(collection: CollectionName): Promise<void> {
    // Empty the collection
    await this.run(collection, "readwrite", (area) => area.clear());
  }
}
