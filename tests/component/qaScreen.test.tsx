// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screen being checked
import { QaScreen } from "@/components/screens/QaScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load a sample session builder
import { makeSession } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 15, 10);

// Remove the drawn screen after each check
afterEach(cleanup);

// A repository with a rehearsal (and any extra sessions)
async function repositoryWith(...extra: ReturnType<typeof makeSession>[]) {
  // An empty repository
  const repository = createRepository(new MemoryStore());
  // The rehearsal
  await repository.saveSession(makeSession({ id: "r1", mode: "rehearse", promptId: "talk-1", transcript: "We should switch tools." }));
  // Anything else
  for (const session of extra) await repository.saveSession(session);
  // Hand it back
  return repository;
}

// Group the checks about the Q&A page
describe("QaScreen", () => {
  // Asking the coach shows three questions, each with a link to answer it
  it("asks the coach for questions and links to answering each", async () => {
    // A network that answers
    const fetchFn = vi.fn(async () => Response.json({ questions: ["A?", "B?", "C?"] }, { status: 200 }));
    // Draw the page with a passphrase saved
    render(<QaScreen fromId="r1" repository={await repositoryWith()} now={NOW} passphrase="a-long-enough-passphrase" fetchFn={fetchFn} />);
    // Ask
    fireEvent.click(await screen.findByRole("button", { name: "Suggest three questions" }));
    // The questions
    const list = await screen.findByRole("list", { name: "Questions" });
    // Confirm each question and its link
    expect(within(list).getAllByRole("link").map((link) => [link.getAttribute("aria-label"), link.getAttribute("href")])).toEqual([
      ["Answer “A?”", "/session?mode=qa&prompt=r1&question=0"],
      ["Answer “B?”", "/session?mode=qa&prompt=r1&question=1"],
      ["Answer “C?”", "/session?mode=qa&prompt=r1&question=2"],
    ]);
  });

  // Typing your own questions needs no server
  it("uses questions you type, without the server", async () => {
    // A network that should not be called
    const fetchFn = vi.fn();
    // Draw the page
    render(<QaScreen fromId="r1" repository={await repositoryWith()} now={NOW} passphrase="" fetchFn={fetchFn} />);
    // Type two questions
    fireEvent.change(await screen.findByLabelText(/Or write your own/), { target: { value: "Why now?\nWhat does it cost?" } });
    // Use them
    fireEvent.click(screen.getByRole("button", { name: "Use these" }));
    // Confirm both are listed and the server was not called
    await waitFor(() => expect([within(screen.getByRole("list", { name: "Questions" })).getAllByRole("listitem").length, fetchFn.mock.calls.length]).toEqual([2, 0]));
  });

  // Without a passphrase, the page says how to fix it and still offers your own questions
  it("explains a missing passphrase", async () => {
    // Draw the page with no passphrase
    render(<QaScreen fromId="r1" repository={await repositoryWith()} now={NOW} passphrase="" fetchFn={vi.fn()} />);
    // Ask
    fireEvent.click(await screen.findByRole("button", { name: "Suggest three questions" }));
    // Confirm the explanation
    expect(await screen.findByText(/Add the passphrase in Settings/)).toBeTruthy();
  });

  // Answers already recorded are counted for each question
  it("counts the answers to each question", async () => {
    // A rehearsal with questions, and one answer to the first
    const repository = await repositoryWith(makeSession({ id: "q1", mode: "qa", promptId: "r1", question: "A?" }));
    // Save questions on the rehearsal
    const rehearsal = await repository.getSession("r1");
    // Save them
    await repository.saveSession({ ...rehearsal!, questions: ["A?", "B?"] });
    // Draw the page
    render(<QaScreen fromId="r1" repository={repository} now={NOW} passphrase="" fetchFn={vi.fn()} />);
    // Confirm the counts
    expect(await screen.findByText("answered once")).toBeTruthy();
  });
});
