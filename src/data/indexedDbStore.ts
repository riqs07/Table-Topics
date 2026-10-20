// The real browser store, built on IndexedDB (the browser's built-in database)

// Load the collection types
import { COLLECTION_NAMES, type CollectionName, type Collections } from "@/data/records";
// Load the storage contract
import type { Store } from "@/data/store";

// The app's own database name: distinctive, so it cannot collide with another app run on the same address (one user had a "voicelab" database from another project on localhost)
const DATABASE_NAME = "voicelab-practice-journal";

// Whether an error means the connection was closed under us (Safari closes idle ones), so a fresh one may work
function connectionClosed(error: unknown): boolean {
  // The browser reports a closed or closing connection as an invalid state
  return error instanceof DOMException && error.name === "InvalidStateError";
}

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

  // Remember which database to use; the app's own name by default, unique names in tests
  constructor(private readonly name = DATABASE_NAME) {}

  // Open the database once, adding any missing collections
  private open(): Promise<IDBDatabase> {
    // Reuse the database if it is already opening or open
    if (this.database) return this.database;
    // Open whatever version exists (another app on the same address may have left a higher one), then fill gaps
    this.database = this.openAt(undefined).then((database) => {
      // Collections this app needs that the database lacks
      const missing = COLLECTION_NAMES.filter((collection) => !database.objectStoreNames.contains(collection));
      // A collection with the right name but a different layout belongs to another app: refuse rather than mix data
      this.checkLayout(database);
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

  // Make sure every existing collection stores records the way this app does (keys kept outside the record)
  private checkLayout(database: IDBDatabase): void {
    // Our collections that already exist
    const present = COLLECTION_NAMES.filter((collection) => database.objectStoreNames.contains(collection));
    // Nothing to check in a new database
    if (present.length === 0) return;
    // Look at each one in a single read-only transaction
    const transaction = database.transaction(present, "readonly");
    // Find any collection that keeps its keys inside the records
    const foreign = present.filter((collection) => transaction.objectStore(collection).keyPath !== null);
    // All fine
    if (foreign.length === 0) return;
    // Release the database before failing
    database.close();
    // Explain in plain words
    throw new Error(`The browser database "${this.name}" belongs to something else on this address (its ${foreign.join(", ")} collection is laid out differently), so VoiceLab will not write to it.`);
  }

  // Close and forget the database when another tab needs to upgrade it, or when the browser closes it (decision 86), so the next use opens it afresh instead of failing until a reload
  private watch(database: IDBDatabase): IDBDatabase {
    // Another tab asks for a newer version
    database.onversionchange = () => {
      // Step aside
      database.close();
      // Reopen on next use
      this.database = null;
    };
    // The browser closed it by itself (Safari does this to idle or backgrounded pages)
    database.onclose = () => {
      // Reopen on next use
      this.database = null;
    };
    // Hand it back
    return database;
  }

  // Run one operation on a collection, opening the database afresh once if the connection was closed under us
  private async run<T>(collection: CollectionName, mode: IDBTransactionMode, operation: (area: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    // The open database
    const database = await this.open();
    // Start a transaction on the collection
    let transaction: IDBTransaction;
    // Starting one fails at once if the connection is closed or closing
    try {
      // Start it
      transaction = database.transaction(collection, mode);
    } catch (error) {
      // Any other problem is reported as it is
      if (!connectionClosed(error)) throw error;
      // Forget the closed connection, if it is still the one kept
      if (this.database && (await this.database.catch(() => null)) === database) this.database = null;
      // Nothing was started, so trying once more on a fresh connection is safe
      return this.transact((await this.open()).transaction(collection, mode), collection, operation);
    }
    // Run it
    return this.transact(transaction, collection, operation);
  }

  // Run one operation inside a started transaction and wait for it to finish
  private async transact<T>(transaction: IDBTransaction, collection: CollectionName, operation: (area: IDBObjectStore) => IDBRequest<T>): Promise<T> {
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
