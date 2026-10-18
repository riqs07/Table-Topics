// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and acting on it
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screens being checked
import { LearnScreen } from "@/components/screens/LearnScreen";
import { ScenariosScreen } from "@/components/screens/ScenariosScreen";
import { CardScreen } from "@/components/screens/CardScreen";
import { ReviewScreen } from "@/components/screens/ReviewScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the cards and the recall rules
import { LEARN_CARDS, findCard } from "@/content/learn";
import { firstRead, shuffledRecall } from "@/core/learn";
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
  // The page lists the sets as paths, starting with the first card, and leads with it
  it("lists the sets and leads with the first card", async () => {
    // Draw it with no progress
    render(<LearnScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // The first set
    const first = await screen.findByRole("region", { name: /Nerves and presence/ });
    // Confirm the first card is next, and the main action opens it
    expect([within(first).getAllByRole("link")[0]?.textContent?.includes("Next"), screen.getByRole("link", { name: /^Next card/ }).getAttribute("href")]).toEqual([true, `/learn/card?id=${LEARN_CARDS[0]?.id}`]);
  });

  // A myth-or-fact card: guess, read on, answer the recall question, and it is saved to come back in a week
  it("takes a guess, then saves a right recall answer", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Draw the "93%" card
    render(<CardScreen cardId="body-93" repository={repository} now={NOW} services={fakeServices("")} />);
    // Guess myth
    fireEvent.click(await screen.findByRole("button", { name: "Myth" }));
    // Confirm the verdict
    expect(screen.getByRole("status").textContent).toContain("It's a myth. You got it.");
    // Go to the last screen
    next(4);
    // The right answer's words
    const card = findCard("body-93")!;
    // The answer to tap
    const right = card.recall.options[card.recall.answer]!;
    // Tap it
    fireEvent.click(within(screen.getByRole("group", { name: "Answers" })).getByRole("button", { name: right }));
    // Confirm the result and when it comes back
    expect(await screen.findByText("This question comes back in a week.")).toBeTruthy();
    // Confirm it was saved
    await waitFor(async () => expect((await repository.getSettings(NOW)).learn?.["body-93"]).toMatchObject({ box: 1, lastResult: "right" }));
  });

  // Saying it back: record your own words, compare with the main point, and say how it went
  it("lets you say the point in your own words", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Draw a card
    render(<CardScreen cardId="talk-liking-gap" repository={repository} now={NOW} services={fakeServices("people like me more than I think")} />);
    // To the last screen
    next(4);
    // Say it
    fireEvent.click(await screen.findByRole("button", { name: "Say it" }));
    // Let the microphone open
    await act(async () => {});
    // Stop
    await act(async () => fireEvent.click(await screen.findByRole("button", { name: "Stop" })));
    // Confirm the words and the main point
    expect([!!(await screen.findByText("people like me more than I think")), !!screen.getByText(/The main point:/)]).toEqual([true, true]);
    // It went well
    fireEvent.click(screen.getByRole("button", { name: "I had it" }));
    // Confirm it was saved as right
    await waitFor(async () => expect((await repository.getSettings(NOW)).learn?.["talk-liking-gap"]?.lastResult).toBe("right"));
  });

  // Review: due questions one at a time, then a result
  it("reviews due questions and shows the result", async () => {
    // A repository with one card read two days ago
    const repository = createRepository(new MemoryStore());
    // The settings
    const settings = await repository.getSettings(NOW);
    // Save the read card
    await repository.saveSettings({ ...settings, learn: { "body-lies": firstRead(new Date(NOW.getTime() - 2 * 86_400_000)) } });
    // Draw the review
    render(<ReviewScreen repository={repository} now={NOW} />);
    // The card's shuffled answers
    const recall = shuffledRecall(findCard("body-lies")!);
    // Tap a wrong answer
    fireEvent.click(await screen.findByRole("button", { name: recall.options[(recall.answer + 1) % 3]! }));
    // Finish
    fireEvent.click(screen.getByRole("button", { name: /Finish/ }));
    // Confirm the result and that it comes back tomorrow
    expect([screen.getByRole("heading", { level: 1 }).textContent, (await repository.getSettings(NOW)).learn?.["body-lies"]?.box]).toEqual(["0 of 1 right.", 0]);
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
    next(4);
    // Confirm the step and the finish
    expect([!!(await screen.findByText("Step 4 of 4")), (await screen.findByRole("link", { name: /Finish today/ })).getAttribute("href")]).toEqual([true, "/"]);
  });

  // A card with a scenario: choose a reply, see every reply's tier and why, the move, then a spoken step; the answer is saved
  it("teaches with a scenario before the recall question", async () => {
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
