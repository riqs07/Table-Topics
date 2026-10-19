// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and acting on it
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screens being checked
import { LearnScreen } from "@/components/screens/LearnScreen";
import { LearnSetScreen } from "@/components/screens/LearnSetScreen";
import { ScenariosScreen } from "@/components/screens/ScenariosScreen";
import { CardScreen } from "@/components/screens/CardScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the cards and the read rule
import { LEARN_CARDS } from "@/content/learn";
import { firstRead } from "@/core/learn";
// Load the recording contracts
import type { LiveText, RecordingServices } from "@/audio/services";
// Load a sample session builder
import { makeSession } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 18, 9);

// Remove the drawn screen after each check
afterEach(cleanup);

// Fake recording services whose transcriber hears the given words
function fakeServices(words: string): RecordingServices {
  // The services
  return {
    // Speech is supported
    speechSupported: () => true,
    // A stand-in stream
    openMicrophone: async () => ({ getTracks: () => [] }) as unknown as MediaStream,
    // A transcriber that hears the words straight away
    createTranscriber: () => ({ start: (onText: (text: LiveText) => void) => onText({ final: words, interim: "" }), stop: async () => words }),
    // A capture with fixed audio
    createCapture: () => ({ level: () => 0.5, stop: async () => new Blob(["voice"]) }),
  };
}

// Press Next a number of times
const next = (times: number) => {
  // Each press
  for (let press = 0; press < times; press++) fireEvent.click(screen.getByRole("button", { name: "Next" }));
};

// Group the checks about Learn
describe("Learn", () => {
  // The page lists the sets as cards with progress, marks the next one, and leads with the first card
  it("lists the sets as cards and leads with the first card", async () => {
    // Draw it with no progress
    render(<LearnScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // The set cards
    const sets = within(await screen.findByRole("list", { name: "Sets" })).getAllByRole("link");
    // Confirm the first card's name, address and note, and the main action
    expect([sets[0]?.getAttribute("aria-label"), sets[0]?.getAttribute("href"), sets[0]?.textContent?.includes("Next up"), screen.getByRole("link", { name: /^Next card/ }).getAttribute("href")]).toEqual([`Nerves and presence, 0 of ${LEARN_CARDS.filter((card) => card.set === "nerves").length}`, "/learn/set?id=nerves", true, `/learn/card?id=${LEARN_CARDS[0]?.id}`]);
  });

  // A set's page lists its cards as a path, with the next one marked
  it("opens a set's cards as a path", async () => {
    // A repository with the first card read
    const repository = createRepository(new MemoryStore());
    // The settings
    const settings = await repository.getSettings(NOW);
    // Save the read card
    await repository.saveSettings({ ...settings, learn: { [LEARN_CARDS[0]!.id]: firstRead(NOW) } });
    // Draw the set
    render(<LearnSetScreen setId="nerves" repository={repository} now={NOW} />);
    // The cards
    const cards = within(await screen.findByRole("list", { name: "Cards" })).getAllByRole("link");
    // Confirm the first done, the second next, and the main action
    expect([screen.getByRole("heading", { level: 1 }).textContent, cards[1]?.textContent?.startsWith("2Next"), screen.getByRole("link", { name: /^Next card/ }).getAttribute("href")]).toEqual(["Nerves and presence", true, `/learn/card?id=${LEARN_CARDS[1]?.id}`]);
  });

  // A myth-or-fact card: guess, read on to the end, and it is saved as read, with the next card as the way on (no quiz since decision 67)
  it("takes a guess, then saves the card as read at the end", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Draw the "93%" card
    render(<CardScreen cardId="body-93" repository={repository} now={NOW} services={fakeServices("")} />);
    // Guess myth
    fireEvent.click(await screen.findByRole("button", { name: "Myth" }));
    // Confirm the verdict
    expect(screen.getByRole("status").textContent).toContain("It's a myth. You got it.");
    // Go to the last screen
    next(3);
    // Confirm the way on is the next card, and there is no quiz
    expect([(await screen.findByRole("link", { name: "Next card" })).getAttribute("href")?.startsWith("/learn/card?id="), screen.queryByRole("group", { name: "Answers" })]).toEqual([true, null]);
    // Confirm it was saved as read
    await waitFor(async () => expect((await repository.getSettings(NOW)).learn?.["body-93"]?.readAt).toBeTruthy());
  });

  // Inside today's practice, a card says which step it is and ends with the way on
  it("shows its step inside today's practice and finishes it", async () => {
    // A user with three earlier practice days, so the plan has four steps, the card last
    const repository = createRepository(new MemoryStore());
    // The days
    for (const day of [14, 15, 16]) await repository.saveSession(makeSession({ id: `s${day}`, createdAt: new Date(2026, 9, day, 9).toISOString() }));
    // Draw a card as step 4
    render(<CardScreen cardId="body-93" repository={repository} now={NOW} services={fakeServices("")} planStep={4} />);
    // To the last screen
    next(3);
    // Confirm the step and the finish
    expect([!!(await screen.findByText("Step 4 of 4")), (await screen.findByRole("link", { name: /Finish today/ })).getAttribute("href")]).toEqual([true, "/"]);
  });

  // A card with a scenario on its last screen: choose a reply, see every reply's tier and why, the move, then a spoken step; the answer is saved
  it("teaches with a scenario on its last screen", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Draw the boomerasking card (myth or fact, with the Monday coffee scenario)
    render(<CardScreen cardId="talk-boomerask" repository={repository} now={NOW} services={fakeServices("")} />);
    // Guess, then on to the scenario
    fireEvent.click(await screen.findByRole("button", { name: "Myth" }));
    // Through the screens
    next(4);
    // Choose the boomerask
    fireEvent.click(within(screen.getByRole("group", { name: "Replies" })).getByRole("button", { name: /^“How was your weekend\? Mine was amazing/ }));
    // The reveal
    const reveal = screen.getAllByRole("status").at(-1)!;
    // Confirm the verdict, the best reply's reason, the move and the spoken step, and that it was saved
    expect([within(reveal).getByText("A common move. Here’s what it does.").tagName, !!within(reveal).getByText(/The best one:/), !!within(reveal).getByText("Share honestly, then hand it back. Don't ask just to tell your own."), !!within(reveal).getByRole("button", { name: "Say it" })]).toEqual(["P", true, true, true]);
    // Confirm the saved first try
    await waitFor(async () => expect((await repository.getSettings(NOW)).scenarios?.["sc-monday-coffee"]?.firstTier).toBe("misstep"));
  });

  // Quick scenarios: three in a row, then the result
  it("runs three quick scenarios and shows how many were best", async () => {
    // Draw the page
    render(<ScenariosScreen repository={createRepository(new MemoryStore())} now={NOW} services={fakeServices("")} />);
    // Each of three
    for (let round = 0; round < 3; round++) {
      // The replies
      const replies = within(await screen.findByRole("group", { name: "Replies" })).getAllByRole("button");
      // Choose the first
      fireEvent.click(replies[0]!);
      // Move on
      fireEvent.click(screen.getByRole("button", { name: round < 2 ? "Next scenario" : "Finish" }));
    }
    // Confirm the result: the first three scenarios' first replies are a best, a misstep and a misstep
    expect((await screen.findByRole("heading", { level: 1 })).textContent).toBe("1 of 3 best.");
  });
});
