// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the saver being checked
import { saveRecording } from "@/data/saveRecording";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 13, 10, 0, 0);
// A finished recording's details
const RECORDING = { id: "new", transcript: "Um, I think the best part was the dog.", durationSec: 30, audio: new Blob(["voice"]), promptId: "p001", mode: "standard" as const, retryOf: null };

// Group the checks about saving a finished recording
describe("saveRecording", () => {
  // The session is saved with its numbers, focus, and waiting feedback; the audio is saved under its id
  it("saves the session with measured numbers and the audio", async () => {
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Save the recording
    const session = await saveRecording(repository, RECORDING, NOW);
    // Confirm the saved record
    expect(await repository.getSession("new")).toMatchObject({
      createdAt: new Date(NOW.getTime() - 30_000).toISOString(),
      transcript: RECORDING.transcript,
      durationSec: 30,
      wordsPerMinute: 18,
      fillersPerMinute: 2,
      focus: "strong-opening",
      feedback: null,
      feedbackStatus: "pending",
      audioKey: "new",
    });
    // Confirm the audio is kept
    expect(await (await repository.getAudio("new"))?.text()).toBe("voice");
    // Confirm the returned record matches
    expect(session.id).toBe("new");
  });

  // The first full session becomes the starting point; later ones do not
  it("marks only the first full session as the baseline", async () => {
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // First session
    expect((await saveRecording(repository, RECORDING, NOW)).isBaseline).toBe(true);
    // Second session
    expect((await saveRecording(repository, { ...RECORDING, id: "second" }, NOW)).isBaseline).toBe(false);
  });

  // Warm-ups and retries keep their kind and link
  it("keeps the mode and the retry link", async () => {
    // A repository with a first try
    const repository = createRepository(new MemoryStore());
    // Save the first try
    await repository.saveSession(makeSession({ id: "first", isBaseline: true }));
    // Save a retry of it
    const retry = await saveRecording(repository, { ...RECORDING, id: "retry", retryOf: "first" }, NOW);
    // Save a warm-up
    const warmup = await saveRecording(repository, { ...RECORDING, id: "warm", mode: "warmup" }, NOW);
    // Confirm the retry link
    expect(retry.retryOf).toBe("first");
    // Confirm the warm-up kind, and that it is not a baseline
    expect([warmup.mode, warmup.isBaseline]).toEqual(["warmup", false]);
  });

  // Old audio beyond the limit is cleared after saving
  it("removes audio beyond the limit after saving", async () => {
    // A repository keeping audio for one session only
    const repository = createRepository(new MemoryStore());
    // Save the limit
    await repository.saveSettings({ focusIndex: 0, focusStartedOn: NOW.toISOString(), audioRetention: 1 });
    // An even older take of the same prompt, so the next one is not the prompt's first take (those are always kept)
    await repository.saveSession(makeSession({ id: "first", createdAt: "2026-09-30T10:00:00.000Z", isBaseline: false }));
    // Save an older session with audio
    await repository.saveSession(makeSession({ id: "old", createdAt: "2026-10-01T10:00:00.000Z", audioKey: "old", isBaseline: false }));
    // Save its audio
    await repository.saveAudio("old", new Blob(["old voice"]));
    // Save a new recording
    await saveRecording(repository, RECORDING, NOW);
    // Confirm the old audio is gone
    expect(await repository.getAudio("old")).toBeUndefined();
  });

  // The loudness readings are kept (rounded) so pauses can be found later
  it("keeps the loudness readings, rounded to two decimals", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Save a recording with readings
    const session = await saveRecording(repository, { ...RECORDING, loudness: [0.123, 0.5, 0.0049] }, NOW);
    // Confirm the rounded readings
    expect(session.loudness).toEqual([0.12, 0.5, 0]);
  });

  // A rehearsal of one section remembers which section it was
  it("keeps the section of a rehearsal", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Save a rehearsal of section 2
    const session = await saveRecording(repository, { ...RECORDING, mode: "rehearse", sectionIndex: 1 }, NOW);
    // Confirm the section is saved
    expect((await repository.getSession(session.id))?.sectionIndex).toBe(1);
  });
});
