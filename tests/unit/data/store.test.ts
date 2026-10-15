// Make a simulated IndexedDB available in Node, as the browser would have
import "fake-indexeddb/auto";
// Load the test helpers from the test runner
import { beforeEach, describe, expect, it } from "vitest";
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
