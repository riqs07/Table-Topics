// Make a simulated IndexedDB available in Node, as the browser would have
import "fake-indexeddb/auto";
// Load the test helpers from the test runner
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Load the in-memory store used by fast tests
import { MemoryStore } from "@/data/memoryStore";
// Load the real browser store
import { IndexedDbStore } from "@/data/indexedDbStore";
// Load the store contract type
import type { Store } from "@/data/store";
// Load a sample session record
import { makeSession } from "../../support/fixtures";

// Counter so each IndexedDB test gets a fresh, empty database
let databaseNumber = 0;

// Run the same contract checks against both stores, so the fake behaves like the real thing
describe.each([
  // The in-memory store
  ["MemoryStore", () => new MemoryStore()],
  // The IndexedDB store, each time with a new database name
  ["IndexedDbStore", () => new IndexedDbStore(`voicelab-test-${databaseNumber++}`)],
] as const)("%s", (_name, createStore) => {
  // The store under test
  let store: Store;

  // Start every check with an empty store
  beforeEach(() => {
    // Make a fresh store
    store = createStore();
  });

  // Saving then loading gives back the same record
  it("saves and loads a record by key", async () => {
    // Make a sample session
    const session = makeSession({ id: "s1" });
    // Save it
    await store.put("sessions", "s1", session);
    // Confirm it loads back unchanged
    expect(await store.get("sessions", "s1")).toEqual(session);
  });

  // Loading something never saved gives nothing
  it("returns undefined for a missing key", async () => {
    // Confirm a missing record is undefined
    expect(await store.get("sessions", "nope")).toBeUndefined();
  });

  // Changing an object after saving must not change what was saved (IndexedDB stores copies)
  it("stores a copy, not the original object", async () => {
    // Make and save a session
    const session = makeSession({ id: "s1", transcript: "before" });
    // Save it
    await store.put("sessions", "s1", session);
    // Change the original afterwards
    session.transcript = "after";
    // Confirm the saved copy kept the old text
    expect((await store.get("sessions", "s1"))?.transcript).toBe("before");
  });

  // Saving under an existing key replaces the record
  it("replaces a record saved under the same key", async () => {
    // Save a first version
    await store.put("sessions", "s1", makeSession({ id: "s1", transcript: "one" }));
    // Save a second version under the same key
    await store.put("sessions", "s1", makeSession({ id: "s1", transcript: "two" }));
    // Confirm only the second version remains
    expect((await store.getAll("sessions")).map((s) => s.transcript)).toEqual(["two"]);
  });

  // Every record in a collection can be listed
  it("lists all records in a collection", async () => {
    // Save two sessions
    await store.put("sessions", "a", makeSession({ id: "a" }));
    // Save the second
    await store.put("sessions", "b", makeSession({ id: "b" }));
    // Confirm both are listed
    expect((await store.getAll("sessions")).map((s) => s.id).sort()).toEqual(["a", "b"]);
  });

  // A single record can be removed
  it("deletes a record", async () => {
    // Save a session
    await store.put("sessions", "s1", makeSession({ id: "s1" }));
    // Delete it
    await store.delete("sessions", "s1");
    // Confirm it is gone
    expect(await store.get("sessions", "s1")).toBeUndefined();
  });

  // A whole collection can be emptied without touching the others
  it("clears one collection only", async () => {
    // Save a session
    await store.put("sessions", "s1", makeSession({ id: "s1" }));
    // Save a challenge
    await store.put("challenges", "c1", { id: "c1", weekStart: "2026-10-12", text: "Say hi", completedAt: null });
    // Empty the sessions
    await store.clear("sessions");
    // Confirm sessions are gone
    expect(await store.getAll("sessions")).toEqual([]);
    // Confirm challenges are untouched
    expect(await store.getAll("challenges")).toHaveLength(1);
  });

  // Recorded audio is stored as binary data
  it("saves and loads audio", async () => {
    // Make a small fake recording
    const audio = new Blob(["fake audio"], { type: "audio/mp4" });
    // Save it
    await store.put("audio", "a1", audio);
    // Load it back
    const loaded = await store.get("audio", "a1");
    // Confirm the content survived
    expect(await loaded?.text()).toBe("fake audio");
  });

  // Several records come back in the order asked, with gaps where there is none (decision 99)
  it("loads several records by key in order", async () => {
    // Two sessions
    await store.put("sessions", "a", makeSession({ id: "a" }));
    // (the second)
    await store.put("sessions", "b", makeSession({ id: "b" }));
    // Confirm the order and the gap
    expect((await store.getMany("sessions", ["b", "missing", "a"])).map((session) => session?.id ?? null)).toEqual(["b", null, "a"]);
  });

  // Keys alone, without reading the records, in key order
  it("lists a collection's keys in order", async () => {
    // Three readings records
    for (const id of ["c", "a", "b"]) await store.put("signals", id, { sessionId: id, loudness: [0.1] });
    // Confirm the keys
    expect(await store.keys("signals")).toEqual(["a", "b", "c"]);
  });

  // The waiting takes are found through the lookup, without reading every session
  it("finds records through a lookup", async () => {
    // A waiting take and a done one
    await store.put("sessions", "w", makeSession({ id: "w", feedbackStatus: "pending" }));
    // (done)
    await store.put("sessions", "d", makeSession({ id: "d", feedbackStatus: "done" }));
    // Confirm only the waiting one
    expect((await store.getAllWhere("sessions", "feedbackStatus", "pending")).map((session) => session.id)).toEqual(["w"]);
  });

  // A batch saves, changes and removes across collections together; a change returning null removes the record
  it("applies a batch across collections", async () => {
    // A session and its readings
    await store.put("sessions", "s1", makeSession({ id: "s1" }));
    // (readings)
    await store.put("signals", "s1", { sessionId: "s1", loudness: [0.2] });
    // A batch: mark the session, remove its readings, add a challenge
    await store.batch([
      // Mark the session from its stored copy
      { kind: "update", collection: "sessions", key: "s1", change: (stored) => (stored ? { ...stored, trimmedAt: "2026-10-21T00:00:00.000Z" } : undefined) },
      // Remove the readings
      { kind: "update", collection: "signals", key: "s1", change: () => null },
      // Add a challenge
      { kind: "put", collection: "challenges", key: "c1", value: { id: "c1", weekStart: "2026-10-19", text: "Say hi", completedAt: null } },
    ]);
    // Confirm all three happened
    expect([(await store.get("sessions", "s1"))?.trimmedAt, await store.get("signals", "s1"), (await store.get("challenges", "c1"))?.text]).toEqual(["2026-10-21T00:00:00.000Z", undefined, "Say hi"]);
  });

  // A batch is all or nothing: one failing change leaves every record as it was
  it("leaves everything as it was when a change in a batch fails", async () => {
    // A session
    await store.put("sessions", "s1", makeSession({ id: "s1", transcript: "before" }));
    // A batch whose second change fails
    const attempt = store.batch([
      // Change the session
      { kind: "update", collection: "sessions", key: "s1", change: (stored) => (stored ? { ...stored, transcript: "after" } : undefined) },
      // Fail
      { kind: "update", collection: "challenges", key: "c1", change: () => { throw new Error("broken change"); } },
    ]);
    // Confirm it failed with that reason and the session kept its text
    expect([await attempt.then(() => "saved", (error: Error) => error.message), (await store.get("sessions", "s1"))?.transcript]).toEqual(["broken change", "before"]);
  });
});

// Open a database at a version and give it some collections, the way another app on the same address might have
function makeExistingDatabase(name: string, version: number, collections: string[], keyPath?: string): Promise<void> {
  // Wait for it to be created and closed
  return new Promise((resolve, reject) => {
    // Ask for the database at that version
    const request = indexedDB.open(name, version);
    // Create the given collections, with keys inside each record if a key path is given (the way many apps lay them out)
    request.onupgradeneeded = () => collections.forEach((collection) => request.result.createObjectStore(collection, keyPath ? { keyPath } : undefined));
    // Close it so the app can open it
    request.onsuccess = () => {
      // Release the connection
      request.result.close();
      // Done
      resolve();
    };
    // Pass on failures
    request.onerror = () => reject(request.error);
  });
}

// Group the checks about a database that already exists on this address
describe("IndexedDbStore with an existing database", () => {
  // A higher version left by something else must not stop saving
  it("works with a database at a higher version that lacks our collections", async () => {
    // A database at version 10 with someone else's collection
    await makeExistingDatabase("voicelab-existing-1", 10, ["other"]);
    // Use it
    const store = new IndexedDbStore("voicelab-existing-1");
    // Save and load a session
    await store.put("sessions", "s1", makeSession({ id: "s1" }));
    // Confirm it loads back
    expect((await store.get("sessions", "s1"))?.id).toBe("s1");
  });

  // A higher version that already has everything is used as is
  it("works with a database at a higher version that has our collections", async () => {
    // A database at version 10 with every collection
    await makeExistingDatabase("voicelab-existing-2", 10, ["sessions", "challenges", "settings", "audio"]);
    // Use it
    const store = new IndexedDbStore("voicelab-existing-2");
    // Save and load audio
    await store.put("audio", "a1", new Blob(["voice"]));
    // Confirm it loads back
    expect(await (await store.get("audio", "a1"))?.text()).toBe("voice");
  });

  // Another app on the same address left a "voicelab" database whose collections keep keys inside records; the app must not use it
  it("keeps its own database apart from another app's \"voicelab\" database", async () => {
    // The other app's database, with collections named like ours but laid out differently
    await makeExistingDatabase("voicelab", 10, ["sessions", "audio", "settings", "challenges"], "id");
    // Use the app's default database
    const store = new IndexedDbStore();
    // Save a recording and a session
    await store.put("audio", "a1", new Blob(["voice"]));
    // Save the session too
    await store.put("sessions", "s1", makeSession({ id: "s1" }));
    // Confirm both load back
    expect([await (await store.get("audio", "a1"))?.text(), (await store.get("sessions", "s1"))?.id]).toEqual(["voice", "s1"]);
  });

  // If a database does have collections laid out differently, say so plainly instead of failing on the first write
  it("explains a database whose collections are laid out differently", async () => {
    // A database whose audio collection keeps keys inside records
    await makeExistingDatabase("voicelab-existing-3", 1, ["sessions", "audio", "settings", "challenges"], "id");
    // Use it
    const store = new IndexedDbStore("voicelab-existing-3");
    // Confirm saving is refused with a clear reason
    await expect(store.put("audio", "a1", new Blob(["voice"]))).rejects.toThrow(/belongs to something else/);
  });

  // A database made before decision 98 gains the readings and layout collections and the waiting-feedback lookup, keeping its records
  it("adds the new collections and the lookup to an older database", async () => {
    // A database with the collections the app had before
    await makeExistingDatabase("voicelab-existing-5", 3, ["sessions", "challenges", "settings", "audio", "talks", "analyses", "summaries", "stories"]);
    // A waiting session saved in it the old way
    await new Promise<void>((resolve) => {
      // Open it as it is
      const request = indexedDB.open("voicelab-existing-5");
      // Write one record, then close
      request.onsuccess = () => {
        // The write
        const transaction = request.result.transaction("sessions", "readwrite");
        // A waiting session
        transaction.objectStore("sessions").put(makeSession({ id: "old", feedbackStatus: "pending" }), "old");
        // Close when done
        transaction.oncomplete = () => {
          // Release it
          request.result.close();
          // Done
          resolve();
        };
      };
    });
    // Use it
    const store = new IndexedDbStore("voicelab-existing-5");
    // Save readings in the new collection
    await store.put("signals", "old", { sessionId: "old", pitch: [120] });
    // Confirm the old record is found through the new lookup, and the readings load back
    expect([(await store.getAllWhere("sessions", "feedbackStatus", "pending")).map((session) => session.id), (await store.get("signals", "old"))?.pitch]).toEqual([["old"], [120]]);
  });

  // A database made before talks existed gains the new collection without losing anything
  it("adds the talks collection to a database made before it existed", async () => {
    // A database with only the original four collections
    await makeExistingDatabase("voicelab-existing-4", 1, ["sessions", "challenges", "settings", "audio"]);
    // Use it
    const store = new IndexedDbStore("voicelab-existing-4");
    // Save a talk
    await store.put("talks", "t1", { id: "t1", title: "Toast", body: "Words.", goalMinutes: null, createdAt: "2026-10-12T15:00:00.000Z" });
    // Confirm it loads back
    expect((await store.get("talks", "t1"))?.title).toBe("Toast");
  });
});

// Group the checks about a connection the browser closes by itself (decision 86)
describe("IndexedDbStore after the browser closes its connection", () => {
  // Put the real opener back after each check
  afterEach(() => vi.restoreAllMocks());

  // Every connection the store opens, caught as it opens
  function catchConnections(): IDBOpenDBRequest[] {
    // The requests
    const requests: IDBOpenDBRequest[] = [];
    // The real opener
    const open = indexedDB.open.bind(indexedDB);
    // Note each request on its way through
    vi.spyOn(indexedDB, "open").mockImplementation((name: string, version?: number) => {
      // Open as usual
      const request = version === undefined ? open(name) : open(name, version);
      // Noted
      requests.push(request);
      // Handed back
      return request;
    });
    // The list, filled as the store opens
    return requests;
  }

  // Regression: Safari closes idle connections; every later save then failed until the page was reloaded
  it("opens afresh and saves when the connection was closed under it", async () => {
    // Catch the connections
    const requests = catchConnections();
    // A store
    const store = new IndexedDbStore(`voicelab-closed-${databaseNumber++}`);
    // A first save opens it
    await store.put("sessions", "s1", makeSession({ id: "s1" }));
    // The connection is closed under the store, as the browser does
    requests.at(-1)!.result.close();
    // A later save still works
    await store.put("sessions", "s2", makeSession({ id: "s2" }));
    // Both saved, on a second connection
    expect([(await store.getAll("sessions")).map((session) => session.id).sort(), requests.length]).toEqual([["s1", "s2"], 2]);
  });

  // When the browser says it closed the connection, the next use opens a new one without a failed try first
  it("forgets a connection the browser reports closed", async () => {
    // Catch the connections
    const requests = catchConnections();
    // A store
    const store = new IndexedDbStore(`voicelab-closed-${databaseNumber++}`);
    // A first save opens it
    await store.put("sessions", "s1", makeSession({ id: "s1" }));
    // The connection
    const connection = requests.at(-1)!.result;
    // The browser reports it closed
    connection.onclose?.call(connection, new Event("close"));
    // A read
    const loaded = await store.get("sessions", "s1");
    // Read back, on a second connection
    expect([loaded?.id, requests.length]).toEqual(["s1", 2]);
  });
});
