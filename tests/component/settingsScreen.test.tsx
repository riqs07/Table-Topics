// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
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
  // Exporting saves a file and remembers the day, which Settings shows (decision 64)
  it("says when the last copy was saved", async () => {
    // Start from nothing saved
    localStorage.clear();
    // Stand in for the browser's file pieces
    Object.assign(URL, { createObjectURL: () => "blob:copy", revokeObjectURL: () => undefined });
    // Draw the screen
    render(<SettingsScreen repository={await repositoryWithOneSession()} now={NOW} />);
    // Before: no copy yet
    const before = !!(await screen.findByText(/No copy saved yet/));
    // Export
    await userEvent.click(screen.getByRole("button", { name: "Export my data" }));
    // Confirm the words change and the day is remembered
    expect([before, !!(await screen.findByText(/Last copy saved today/)), localStorage.getItem("voicelab-last-export")]).toEqual([true, true, "2026-10-13"]);
  });

  // Light or dark: applied straight away, remembered, and back to the device's choice
  it("switches between light, dark and the device's choice", async () => {
    // Start from nothing saved
    localStorage.clear();
    // Draw the screen
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Light is chosen to begin with (decision 70)
    const start = screen.getByRole("button", { name: "Light" }).getAttribute("aria-pressed");
    // Choose dark
    await userEvent.click(await screen.findByRole("button", { name: "Dark" }));
    // What the page and storage say after dark
    const dark = [document.documentElement.getAttribute("data-mode"), localStorage.getItem("voicelab-color-mode"), screen.getByRole("button", { name: "Dark" }).getAttribute("aria-pressed")];
    // Follow the device
    await userEvent.click(screen.getByRole("button", { name: "Auto" }));
    // What the page and storage say after Auto
    const auto = [document.documentElement.getAttribute("data-mode"), localStorage.getItem("voicelab-color-mode")];
    // Back to light
    await userEvent.click(screen.getByRole("button", { name: "Light" }));
    // Confirm light first, then dark, then the device, then light again with nothing stored
    expect([start, dark, auto, [document.documentElement.getAttribute("data-mode"), localStorage.getItem("voicelab-color-mode")]]).toEqual(["true", ["dark", "dark", "true"], ["system", "system"], [null, null]]);
  });

  // Timing tones are off until switched on, and the choice is kept in this browser (decision 77)
  it("switches timing tones on and off", async () => {
    // Start from nothing saved
    localStorage.clear();
    // Draw the screen
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // The switch
    const toggle = await screen.findByRole("checkbox", { name: /Timing tones/ });
    // Off to begin with
    const start = (toggle as HTMLInputElement).checked;
    // Switch on
    await userEvent.click(toggle);
    // What storage says
    const on = localStorage.getItem("voicelab-timing-tones");
    // Switch off
    await userEvent.click(toggle);
    // Confirm off, on, then off with nothing stored
    expect([start, on, localStorage.getItem("voicelab-timing-tones")]).toEqual([false, "on", null]);
  });

  // A practice time is saved from a quick pick, and the reminder downloads a calendar file (decision 78)
  it("saves a practice time and makes a calendar reminder", async () => {
    // Stand in for the browser's object URLs
    Object.assign(URL, { createObjectURL: vi.fn(() => "blob:reminder"), revokeObjectURL: vi.fn() });
    // Catch the download instead of navigating
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    // A repository
    const repository = createRepository(new MemoryStore());
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // Pick a moment
    await userEvent.click(await screen.findByRole("button", { name: "before bed" }));
    // Make the reminder
    await userEvent.click(screen.getByRole("button", { name: "Add a daily reminder to my calendar" }));
    // The saved settings
    const saved = await repository.getSettings(NOW);
    // Confirm the moment and time were saved, and a file was handed over
    expect([saved.anchor, saved.reminderTime, click.mock.calls.length]).toEqual(["before bed", "08:00", 1]);
    // Put clicking back
    click.mockRestore();
  });

  // The run on Today can be hidden (decision 78)
  it("hides the practice days on Today", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // The switch, on to begin with
    const toggle = await screen.findByRole("checkbox", { name: /Show my practice days/ });
    // Read it
    const start = (toggle as HTMLInputElement).checked;
    // Switch it off
    await userEvent.click(toggle);
    // Confirm on, then saved as hidden
    await waitFor(async () => expect([start, (await repository.getSettings(NOW)).hideStreak]).toEqual([true, true]));
  });

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
