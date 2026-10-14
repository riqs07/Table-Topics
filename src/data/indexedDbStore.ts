// The real browser store, built on IndexedDB (the browser's built-in database)

// Load the collection types
import { COLLECTION_NAMES, type CollectionName, type Collections } from "@/data/records";
// Load the storage contract
import type { Store } from "@/data/store";

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

  // Open the database once, adding any missing collections
  private open(): Promise<IDBDatabase> {
    // Reuse the database if it is already opening or open
    if (this.database) return this.database;
    // Open whatever version exists (another app on the same address may have left a higher one), then fill gaps
    this.database = this.openAt(undefined).then((database) => {
      // Collections this app needs that the database lacks
      const missing = COLLECTION_NAMES.filter((collection) => !database.objectStoreNames.contains(collection));
      // Everything is there: use it as is
      if (missing.length === 0) return this.watch(database);
      // Note the current version before closing
      const version = database.version;
      // Close it so it can be upgraded
      database.close();
      // Reopen one version higher, which lets new collections be created
      return this.openAt(version + 1).then((upgraded) => this.watch(upgraded));
    });
    // Forget a failed open, so the next call tries again
    this.database.catch(() => (this.database = null));
    // Hand it back
    return this.database;
  }

  // Open the database at a version (or the current one), creating any missing collections during an upgrade
  private openAt(version: number | undefined): Promise<IDBDatabase> {
    // Ask the browser to open (or create) the database
    const request = version === undefined ? indexedDB.open(this.name) : indexedDB.open(this.name, version);
    // Create any missing collections when the database is new or upgraded; existing ones are left alone
    request.onupgradeneeded = () => {
      // Check each collection
      for (const collection of COLLECTION_NAMES) {
        // Create it if it does not exist yet
        if (!request.result.objectStoreNames.contains(collection)) request.result.createObjectStore(collection);
      }
    };
    // Wait for it to open
    return settle(request);
  }

  // Close and forget the database when another tab needs to upgrade it, so neither tab gets stuck
  private watch(database: IDBDatabase): IDBDatabase {
    // Another tab asks for a newer version
    database.onversionchange = () => {
      // Step aside
      database.close();
      // Reopen on next use
      this.database = null;
    };
    // Hand it back
    return database;
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
