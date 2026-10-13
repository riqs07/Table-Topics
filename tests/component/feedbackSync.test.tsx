// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a component and acting like a user
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// Load the pieces being checked
import { FeedbackSync } from "@/components/FeedbackSync";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { readPassphrase, savePassphrase } from "@/data/passphrase";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load a sample session builder
import { makeSession } from "../support/fixtures";

// Sample feedback the route returns
const FEEDBACK = { keep: "k", change: "c", retryCue: "r" };
// A fixed "now"
const NOW = new Date(2026, 9, 13, 18);

// Start each check with no saved passphrase
beforeEach(() => localStorage.clear());
// Remove drawn components after each check
afterEach(cleanup);

// A repository with one session waiting for feedback
async function repositoryWithPending() {
  // Wrap an empty store
  const repository = createRepository(new MemoryStore());
  // Save a pending session
  await repository.saveSession(makeSession({ id: "s1" }));
  // Hand it back
  return repository;
}

// Group the checks about the passphrase kept on this device
describe("passphrase storage", () => {
  // It is saved and read back
  it("saves and reads the passphrase", () => {
    // Save one
    savePassphrase("  correct horse battery staple  ");
    // Confirm it reads back trimmed
    expect(readPassphrase()).toBe("correct horse battery staple");
  });

  // With nothing saved, it is empty
  it("is empty when nothing is saved", () => {
    // Confirm empty
    expect(readPassphrase()).toBe("");
  });
});

// Group the checks about sending waiting feedback in the background
describe("FeedbackSync", () => {
  // When the app opens, waiting sessions are sent
  it("sends waiting feedback when it starts", async () => {
    // Save a passphrase
    savePassphrase("pass");
    // A repository with a waiting session
    const repository = await repositoryWithPending();
    // A network that succeeds
    const network = vi.fn(async () => Response.json({ feedback: FEEDBACK }));
    // Start the background sender
    render(<FeedbackSync repository={repository} fetchFn={network} />);
    // Confirm the session got its feedback
    await waitFor(async () => expect((await repository.getSession("s1"))?.feedbackStatus).toBe("done"));
  });

  // When the connection comes back, it tries again
  it("tries again when the device comes back online", async () => {
    // Save a passphrase
    savePassphrase("pass");
    // A repository with a waiting session
    const repository = await repositoryWithPending();
    // A network that is offline first, then works
    const network = vi.fn().mockRejectedValueOnce(new TypeError("offline")).mockResolvedValue(Response.json({ feedback: FEEDBACK }));
    // Start the background sender
    render(<FeedbackSync repository={repository} fetchFn={network} />);
    // Wait for the first, failed try
    await waitFor(() => expect(network).toHaveBeenCalledTimes(1));
    // Signal that the connection is back
    await act(async () => window.dispatchEvent(new Event("online")));
    // Confirm the session got its feedback
    await waitFor(async () => expect((await repository.getSession("s1"))?.feedbackStatus).toBe("done"));
  });
});

// Group the checks about the passphrase field in Settings
describe("Settings passphrase", () => {
  // The passphrase can be entered and saved on this device
  it("saves the passphrase on this device", async () => {
    // Draw Settings
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Type a passphrase
    await userEvent.type(await screen.findByLabelText("Passphrase"), "correct horse battery staple");
    // Save it
    await userEvent.click(screen.getByRole("button", { name: "Save passphrase" }));
    // Confirm it is stored
    expect(readPassphrase()).toBe("correct horse battery staple");
  });

  // Waiting sessions are counted and can be sent from Settings
  it("sends waiting feedback on request and says what happened", async () => {
    // Save a passphrase
    savePassphrase("pass");
    // Draw Settings with a waiting session and a working network
    render(<SettingsScreen repository={await repositoryWithPending()} now={NOW} fetchFn={vi.fn(async () => Response.json({ feedback: FEEDBACK }))} />);
    // Confirm the count is shown
    expect(await screen.findByText(/1 session is waiting for feedback/)).toBeTruthy();
    // Send now
    await userEvent.click(screen.getByRole("button", { name: "Send now" }));
    // Confirm the result
    expect(await screen.findByText("Feedback arrived for 1 session.")).toBeTruthy();
  });
});
