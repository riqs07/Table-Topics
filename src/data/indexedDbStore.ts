// The real browser store, built on IndexedDB (the browser's built-in database)

// Load the collection types
import { COLLECTION_INDEXES, COLLECTION_NAMES, type CollectionName, type Collections } from "@/data/records";
// Load the storage contract
import type { Store, StoreOp } from "@/data/store";

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
      // Everything is there, lookups included: use it as is
      if (missing.length === 0 && !this.lacksIndexes(database)) return this.watch(database);
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
    // Create any missing collections and lookups when the database is new or upgraded; existing records are left alone
    request.onupgradeneeded = () => {
      // Check each collection
      for (const collection of COLLECTION_NAMES) {
        // Create it if it does not exist yet, or open it within the upgrade
        const area = request.result.objectStoreNames.contains(collection) ? (request.transaction as IDBTransaction).objectStore(collection) : request.result.createObjectStore(collection);
        // Its lookups, each by the field it looks up (decision 99)
        for (const field of COLLECTION_INDEXES[collection] ?? []) {
          // Made when missing; the browser fills it from the records already there
          if (!area.indexNames.contains(field)) area.createIndex(field, field);
        }
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

  // Whether any of our collections lacks a lookup this app needs (a database made before decisions 98 and 99)
  private lacksIndexes(database: IDBDatabase): boolean {
    // The collections that should have lookups
    const indexed = COLLECTION_NAMES.filter((collection) => (COLLECTION_INDEXES[collection] ?? []).length > 0);
    // Look at them in one read-only transaction
    const transaction = database.transaction(indexed, "readonly");
    // Any lookup missing
    return indexed.some((collection) => (COLLECTION_INDEXES[collection] ?? []).some((field) => !transaction.objectStore(collection).indexNames.contains(field)));
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

  // Start a transaction on some collections, opening the database afresh once if the connection was closed under us
  private async begin(collections: ReadonlyArray<CollectionName>, mode: IDBTransactionMode): Promise<IDBTransaction> {
    // The open database
    const database = await this.open();
    // Starting one fails at once if the connection is closed or closing
    try {
      // Start it
      return database.transaction([...collections], mode);
    } catch (error) {
      // Any other problem is reported as it is
      if (!connectionClosed(error)) throw error;
      // Forget the closed connection, if it is still the one kept
      if (this.database && (await this.database.catch(() => null)) === database) this.database = null;
      // Nothing was started, so trying once more on a fresh connection is safe
      return (await this.open()).transaction([...collections], mode);
    }
  }

  // Wait until a transaction is fully committed, so the data is really saved (or fail with its error)
  private committed(transaction: IDBTransaction): Promise<void> {
    // Settle on its end
    return new Promise<void>((resolve, reject) => {
      // Finish when the transaction completes
      transaction.oncomplete = () => resolve();
      // Fail if the transaction fails
      transaction.onerror = () => reject(transaction.error);
      // Fail if the transaction is aborted
      transaction.onabort = () => reject(transaction.error);
    });
  }

  // Run one operation on a collection and wait for it and its transaction to finish
  private async run<T>(collection: CollectionName, mode: IDBTransactionMode, operation: (area: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    // A transaction on the collection
    const transaction = await this.begin([collection], mode);
    // Start the operation
    const result = settle(operation(transaction.objectStore(collection)));
    // Wait for both, so an error from either is reported once and never left unhandled
    const [value] = await Promise.all([result, this.committed(transaction)]);
    // Hand back the operation's result
    return value;
  }

  // Load one record
  async get<C extends CollectionName>(collection: C, key: string): Promise<Collections[C] | undefined> {
    // Read the record by key
    return (await this.run(collection, "readonly", (area) => area.get(key))) as Collections[C] | undefined;
  }

  // Load several records by key in one transaction
  async getMany<C extends CollectionName>(collection: C, keys: ReadonlyArray<string>): Promise<Array<Collections[C] | undefined>> {
    // Nothing asked for
    if (keys.length === 0) return [];
    // One read-only transaction
    const transaction = await this.begin([collection], "readonly");
    // The collection
    const area = transaction.objectStore(collection);
    // One read per key, all started at once
    const reads = keys.map((key) => settle(area.get(key)));
    // Wait for the reads and the transaction
    const [values] = await Promise.all([Promise.all(reads), this.committed(transaction)]);
    // In the order asked
    return values as Array<Collections[C] | undefined>;
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

  // Load the records whose field has a value, through the collection's lookup for that field
  async getAllWhere<C extends CollectionName>(collection: C, field: string, value: string): Promise<Array<Collections[C]>> {
    // Read through the lookup
    return (await this.run(collection, "readonly", (area) => area.index(field).getAll(value))) as Array<Collections[C]>;
  }

  // Every key in a collection, in key order, without reading the records
  async keys(collection: CollectionName): Promise<string[]> {
    // Read the keys alone
    return (await this.run(collection, "readonly", (area) => area.getAllKeys())).map(String);
  }

  // Remove every record in a collection
  async clear(collection: CollectionName): Promise<void> {
    // Empty the collection
    await this.run(collection, "readwrite", (area) => area.clear());
  }

  // Apply several changes in one transaction, so all are saved or none (a change reads the stored record inside the same transaction)
  async batch(ops: ReadonlyArray<StoreOp>): Promise<void> {
    // Nothing to do
    if (ops.length === 0) return;
    // The collections touched, each once
    const collections = [...new Set(ops.map((op) => op.collection))];
    // One read-write transaction over them
    const transaction = await this.begin(collections, "readwrite");
    // A change's own failure (such as a bad record), kept to report
    let failure: unknown = null;
    // Start each change in order (IndexedDB runs them in the order asked)
    for (const op of ops) {
      // The collection
      const area = transaction.objectStore(op.collection);
      // Save
      if (op.kind === "put") area.put(op.value, op.key);
      // Remove
      else if (op.kind === "delete") area.delete(op.key);
      // Change from what is stored now
      else {
        // Read it inside this transaction
        const read = area.get(op.key);
        // Once read, work out the new value and save it in the same transaction
        read.onsuccess = () => {
          // The change can fail
          try {
            // The new value
            const next = (op.change as (value: unknown) => unknown)(read.result);
            // Removed when asked
            if (next === null) area.delete(op.key);
            // Saved when there is a new value
            else if (next !== undefined) area.put(next, op.key);
          } catch (error) {
            // Keep the reason, and undo everything
            failure = error;
            // Abort the transaction
            transaction.abort();
          }
        };
      }
    }
    // Wait for the commit, reporting a change's own failure first
    await this.committed(transaction).catch((error: unknown) => {
      // The change's reason, or the database's
      throw failure ?? error;
    });
  }
}
