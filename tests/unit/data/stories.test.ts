// Make a simulated IndexedDB available in Node, for the upgrade check
import "fake-indexeddb/auto";
// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository, type Repository } from "@/data/repository";
// Load the real browser store, for the upgrade check
import { IndexedDbStore } from "@/data/indexedDbStore";
// Load the story savers being checked
import { ensureStory, renameStory } from "@/data/stories";
// Load the recording saver, which makes a story's record the first time it is told
import { saveRecording } from "@/data/saveRecording";
// Load the feedback client, which sends a story's set-up and keeps its scores
import { requestFeedback } from "@/data/feedbackClient";
// Load the export tools, which now carry stories
import { buildExport, importExport, parseExport } from "@/data/exportFile";
// Load the sample records
import { makeSession } from "../../support/fixtures";

// A fixed "now"
const NOW = new Date("2026-10-21T12:00:00.000Z");
// An hour later
const LATER = new Date("2026-10-21T13:00:00.000Z");
// An empty repository
const empty = () => createRepository(new MemoryStore());
// A told story's set-up
const TAKE = { shape: "classic", focus: "dialogue", length: "short" } as const;
// The settings part of a file
const SETTINGS = { focusIndex: 0, focusStartedOn: NOW.toISOString(), audioRetention: 30 };

// Group the checks about story records
describe("story records", () => {
  // The first telling makes the record with the prompt's title; later ones keep it
  it("makes a story's record once, titled from its prompt", async () => {
    // An empty repository
    const repository = empty();
    // Made, then asked again an hour later
    const [first, second] = [await ensureStory(repository, "sp04", NOW), await ensureStory(repository, "sp04", LATER)];
    // Confirm the title and that the record was not replaced
    expect([first.title, second.createdAt, (await repository.listStories()).length]).toEqual(["Running late", NOW.toISOString(), 1]);
  });

  // A story from a moment note is titled from the note's first words
  it("titles a story from a moment note by its words", async () => {
    // A repository with a moment note
    const repository = empty();
    // The note
    await repository.saveSession(makeSession({ id: "m1", mode: "moment", transcript: "I fixed the bike chain myself and rode all the way to the river" }));
    // Its story
    expect((await ensureStory(repository, "moment-m1", NOW)).title).toBe("I fixed the bike chain myself and rode…");
  });

  // Renaming keeps the new title; clearing it puts the starting one back
  it("renames a story, and an empty title puts the first one back", async () => {
    // An empty repository
    const repository = empty();
    // Renamed
    const renamed = await renameStory(repository, "sp04", "  The   night bus  ", LATER);
    // Cleared
    const cleared = await renameStory(repository, "sp04", "   ", LATER);
    // Confirm both and the change time
    expect([renamed.title, renamed.updatedAt, cleared.title]).toEqual(["The night bus", LATER.toISOString(), "Running late"]);
  });

  // Saving a told story keeps its set-up and makes its record
  it("saves a told story's set-up and its record", async () => {
    // An empty repository
    const repository = empty();
    // A telling
    const session = await saveRecording(repository, { id: "t1", transcript: "the train stopped but I was fine", durationSec: 40, audio: new Blob(["v"]), promptId: "sp04", mode: "story", retryOf: null, story: TAKE }, NOW);
    // Confirm the set-up, the record and the story measures
    expect([session.story, (await repository.getStory("sp04"))?.title, (await repository.getAnalysis("t1"))?.metrics["story.turn"]?.value]).toEqual([TAKE, "Running late", 1]);
  });

  // Rule T1 and T2: a story record that cannot be saved never stops the take being saved
  it("still saves the telling when the story record cannot be saved", async () => {
    // A repository whose story saves fail
    const repository: Repository = { ...empty(), saveStory: async () => { throw new Error("disk full"); } };
    // Quiet the expected warning
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // A telling
    await saveRecording(repository, { id: "t1", transcript: "words", durationSec: 30, audio: new Blob(["v"]), promptId: "sp04", mode: "story", retryOf: null, story: TAKE }, NOW);
    // Confirm the take is saved and the warning names the cause
    expect([(await repository.getSession("t1"))?.mode, String(warn.mock.calls[0]?.[0])]).toEqual(["story", "The story could not be added to your stories: disk full"]);
    // Restore the console
    warn.mockRestore();
  });

  // The story's set-up is sent to the coach, and its story scores are kept in the take's analysis
  it("sends the set-up and keeps the story scores", async () => {
    // A repository with a telling
    const repository = empty();
    // The telling
    await repository.saveSession(makeSession({ id: "t1", mode: "story", promptId: "sp04", story: TAKE }));
    // The network, remembering what was sent
    const fetchFn = vi.fn<typeof fetch>(async () => Response.json({ feedback: { keep: "k", change: "c", retryCue: "r", story: { beats: [], yours: "y", better: "b" } }, rubric: { pointFirst: { score: 1, quote: "" }, answersQuestion: null, structure: { score: 1, quote: "" }, ending: { score: 1, quote: "" }, concreteExample: { score: 1, quote: "" }, wordChoice: { score: 1, quote: "" }, devices: [], unnecessaryHedges: 0, wordSwaps: [], model: "m", story: { hook: { score: 2, quote: "" }, stakes: { score: 1, quote: "" }, detail: { score: 3, quote: "" }, dialogue: { score: 0, quote: "" }, turn: { score: 2, quote: "" }, point: { score: 1, quote: "" } } } }));
    // Asked
    const outcome = await requestFeedback(repository, "t1", { passphrase: "pass", fetchFn });
    // What was sent
    const sent = JSON.parse(String(fetchFn.mock.calls[0]?.[1]?.body)) as { story?: unknown };
    // Confirm the outcome, the set-up sent, and the score kept as a measure
    expect([outcome, sent.story, (await repository.getAnalysis("t1"))?.metrics["rub.story_detail"]?.value]).toEqual(["done", TAKE, 3]);
  });
});

// Group the checks about stories in the export file
describe("stories in the export file", () => {
  // Stories round-trip; where both sides have one, the later title wins and the earlier first-told date stays
  it("exports and imports stories, keeping the later title", async () => {
    // A device with a renamed story and a telling of it
    const source = empty();
    // The telling
    await source.saveSession(makeSession({ id: "t1", mode: "story", promptId: "sp04", story: TAKE }));
    // The story, renamed later
    await source.saveStory({ id: "sp04", title: "The night bus", createdAt: LATER.toISOString(), updatedAt: LATER.toISOString() });
    // A second story only in the file
    await source.saveStory({ id: "sp10", title: "The yes", createdAt: NOW.toISOString(), updatedAt: NOW.toISOString() });
    // A device that has the first story under its old title, told earlier, and a story the file does not have
    const target = empty();
    // (the old title)
    await target.saveStory({ id: "sp04", title: "Running late", createdAt: NOW.toISOString(), updatedAt: NOW.toISOString() });
    // (its own story)
    await target.saveStory({ id: "sp01", title: "Mine", createdAt: NOW.toISOString(), updatedAt: NOW.toISOString() });
    // Exported, parsed and imported
    await importExport(target, parseExport(JSON.stringify(await buildExport(source, NOW))), NOW);
    // The stories here now
    const stories = await target.listStories();
    // Confirm all three, the later title and the earlier date, and the session's set-up
    expect([stories.map((story) => story.id).sort(), stories.find((story) => story.id === "sp04"), (await target.getSession("t1"))?.story]).toEqual([["sp01", "sp04", "sp10"], { id: "sp04", title: "The night bus", createdAt: NOW.toISOString(), updatedAt: LATER.toISOString() }, TAKE]);
  });

  // A newer title already on this device is not replaced by an older one from the file
  it("keeps a newer title already here", async () => {
    // A device renamed after the file was made
    const target = empty();
    // (renamed later)
    await target.saveStory({ id: "sp04", title: "Newest", createdAt: NOW.toISOString(), updatedAt: LATER.toISOString() });
    // A file with the older title
    const file = { format: "voicelab-export", version: 1, exportedAt: NOW.toISOString(), sessions: [], challenges: [], settings: SETTINGS, stories: [{ id: "sp04", title: "Older", createdAt: NOW.toISOString(), updatedAt: NOW.toISOString() }] };
    // Imported
    await importExport(target, parseExport(JSON.stringify(file)), NOW);
    // Confirm the newer title stayed
    expect((await target.getStory("sp04"))?.title).toBe("Newest");
  });

  // A file made before stories existed still imports
  it("imports a file made before stories existed", () => {
    // An older file
    const parsed = parseExport(JSON.stringify({ format: "voicelab-export", version: 1, exportedAt: NOW.toISOString(), sessions: [makeSession()], challenges: [], settings: SETTINGS }));
    // Confirm an empty list
    expect(parsed.stories).toEqual([]);
  });

  // A damaged story, or a telling with an unknown set-up, is refused before anything is saved
  it("refuses a damaged story or story set-up", () => {
    // The two files
    const files = [{ stories: [{ id: "sp04", title: 7, createdAt: NOW.toISOString(), updatedAt: NOW.toISOString() }], sessions: [] }, { sessions: [makeSession({ mode: "story", story: { shape: "epic", focus: null, length: "short" } as never })] }];
    // Each is refused
    for (const part of files) expect(() => parseExport(JSON.stringify({ format: "voicelab-export", version: 1, exportedAt: NOW.toISOString(), challenges: [], settings: SETTINGS, ...part }))).toThrow("This file is damaged and cannot be imported.");
  });

  // "Delete everything" removes stories too
  it("deletes stories with everything else", async () => {
    // A repository with a story
    const repository = empty();
    // The story
    await repository.saveStory({ id: "sp04", title: "t", createdAt: NOW.toISOString(), updatedAt: NOW.toISOString() });
    // Delete everything
    await repository.deleteAllData();
    // Confirm it is gone
    expect(await repository.listStories()).toEqual([]);
  });
});

// Group the checks about the browser database upgrade (rule T3: storage that already holds data)
describe("upgrading a database made before stories existed", () => {
  // A database with the seven earlier collections and data in them gains the stories collection without losing anything
  it("adds the stories collection and keeps existing data", async () => {
    // The earlier database, as the app made it before decision 92, with a session and an analysis-era summary in it
    await new Promise<void>((resolve, reject) => {
      // Open it at version 3 with the earlier collections
      const request = indexedDB.open("voicelab-before-stories", 3);
      // Create them, keys kept outside the records as the app does
      request.onupgradeneeded = () => ["sessions", "challenges", "settings", "audio", "talks", "analyses", "summaries"].forEach((name) => request.result.createObjectStore(name));
      // Write a moment note and close
      request.onsuccess = () => {
        // The transaction
        const transaction = request.result.transaction("sessions", "readwrite");
        // The note
        transaction.objectStore("sessions").put(makeSession({ id: "kept", mode: "moment", transcript: "the kettle sang" }), "kept");
        // Closed once written
        transaction.oncomplete = () => {
          // Release it
          request.result.close();
          // Done
          resolve();
        };
      };
      // Pass on failures
      request.onerror = () => reject(request.error);
    });
    // The app's repository on it
    const repository = createRepository(new IndexedDbStore("voicelab-before-stories"));
    // Tell the old moment as a story
    await ensureStory(repository, "moment-kept", NOW);
    // Confirm the old note survived and the story saved with its title
    expect([(await repository.getSession("kept"))?.transcript, (await repository.getStory("moment-kept"))?.title]).toEqual(["the kettle sang", "the kettle sang"]);
  });
});
