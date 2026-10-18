// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen, waitFor } from "@testing-library/react";
// Load the tool for acting like a user
import userEvent from "@testing-library/user-event";
// Load the screen being checked
import { SettingsScreen } from "@/components/screens/SettingsScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the export builder
import { buildExport } from "@/data/exportFile";
// Load a sample session builder
import { makeSession } from "../support/fixtures";
// Load the passphrase storage
import { readPassphrase } from "@/data/passphrase";

// A fixed "now"
const NOW = new Date(2026, 9, 13, 18);

// Remove the drawn screen after each check
afterEach(cleanup);

// Make a repository with one session in it
async function repositoryWithOneSession() {
  // Wrap an empty store
  const repository = createRepository(new MemoryStore());
  // Save one session
  await repository.saveSession(makeSession({ id: "s1" }));
  // Hand it back
  return repository;
}

// Group the checks about the Settings screen
describe("SettingsScreen", () => {
  // Deleting everything takes two deliberate taps
  it("deletes all data only after confirming", async () => {
    // Make a repository with data
    const repository = await repositoryWithOneSession();
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // First tap
    await userEvent.click(await screen.findByRole("button", { name: "Delete all my data" }));
    // Confirm nothing is deleted yet
    expect(await repository.listSessions()).toHaveLength(1);
    // Second, confirming tap
    await userEvent.click(screen.getByRole("button", { name: "Yes, delete everything" }));
    // Confirm the data is gone
    await waitFor(async () => expect(await repository.listSessions()).toHaveLength(0));
    // Confirm the user is told
    expect(screen.getByText(/Everything is deleted/)).toBeTruthy();
  });

  // Importing an export file adds its sessions
  it("imports an export file and says what came in", async () => {
    // Make an export file from a repository with one session
    const text = JSON.stringify(await buildExport(await repositoryWithOneSession(), NOW));
    // Make an empty repository to import into
    const repository = createRepository(new MemoryStore());
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // Choose the file
    await userEvent.upload(await screen.findByLabelText("Import a file"), new File([text], "voicelab.json", { type: "application/json" }));
    // Confirm the message
    expect(await screen.findByText("Imported 1 session and 0 challenges.")).toBeTruthy();
    // Confirm the session is saved
    expect(await repository.listSessions()).toHaveLength(1);
  });

  // A wrong file is refused with the plain message
  it("explains a file that is not an export", async () => {
    // Draw the screen
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Choose a wrong file
    await userEvent.upload(await screen.findByLabelText("Import a file"), new File(["hello"], "notes.json", { type: "application/json" }));
    // Confirm the message
    expect(await screen.findByText("This file is not a VoiceLab export.")).toBeTruthy();
  });

  // The audio limit can be changed and is saved
  it("saves a new audio limit", async () => {
    // Make an empty repository
    const repository = createRepository(new MemoryStore());
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // Pick 10 sessions
    await userEvent.selectOptions(await screen.findByLabelText("Keep recordings from your last"), "10");
    // Confirm it was saved
    await waitFor(async () => expect((await repository.getSettings(NOW)).audioRetention).toBe(10));
  });

  // A passphrase shorter than the server allows is refused at once, with the reason
  it("refuses a passphrase shorter than 16 characters", async () => {
    // Draw the screen
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Type a short passphrase
    await userEvent.type(await screen.findByLabelText("Passphrase"), "short");
    // Try to save it
    await userEvent.click(screen.getByRole("button", { name: "Save passphrase" }));
    // Confirm the explanation and that nothing was saved
    expect([!!screen.getByText(/at least 16 characters/), readPassphrase()]).toEqual([true, ""]);
  });

  // After saving, the passphrase's fingerprint is shown, to compare with the server's (from pnpm live-check)
  it("shows the saved passphrase's fingerprint", async () => {
    // Draw the screen
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Type a passphrase
    await userEvent.type(await screen.findByLabelText("Passphrase"), "walnut-harbor-quietly-71");
    // Save it
    await userEvent.click(screen.getByRole("button", { name: "Save passphrase" }));
    // Confirm a fingerprint is shown
    expect(await screen.findByText(/Fingerprint: [0-9a-f]{6}/)).toBeTruthy();
  });

  // The coach may read your notes only when you switch it on
  it("saves whether the coach may read your notes", async () => {
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // The switch, off by default
    const share = (await screen.findByLabelText(/Let the coach read my notes/)) as HTMLInputElement;
    // Was it off?
    const before = share.checked;
    // Switch it on
    await userEvent.click(share);
    // Confirm it was off, and is now saved on
    await waitFor(async () => expect([before, (await repository.getSettings(NOW)).shareNotes]).toEqual([false, true]));
  });

  // History lives here, folded away until opened
  it("shows the history folded, and draws it when opened", async () => {
    // A user with one session
    const repository = createRepository(new MemoryStore());
    // The session
    await repository.saveSession(makeSession({ id: "s1", createdAt: new Date(2026, 9, 12, 9).toISOString(), isBaseline: true }));
    // Draw Settings
    render(<SettingsScreen repository={repository} now={NOW} />);
    // The fold
    const summary = await screen.findByText("Show your practice history");
    // Closed: nothing drawn yet
    const before = screen.queryByText(/Your first recording is in/);
    // Open it
    await userEvent.click(summary);
    // Confirm it drew once opened
    expect([before, !!(await screen.findByText(/Your first recording is in/))]).toEqual([null, true]);
  });
});
