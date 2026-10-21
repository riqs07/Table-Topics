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
import { LEARN_CARDS, LEARN_SETS } from "@/content/learn";
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
  // The page lists the sets as cards with progress in two groups, marks the next one, and leads with the first card (decision 79)
  it("lists the sets as cards in two groups and leads with the first card", async () => {
    // Draw it with no progress
    render(<LearnScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // The speaking set cards
    const sets = within(await screen.findByRole("list", { name: "Speaking sets" })).getAllByRole("link");
    // Every set appears once across the two groups
    const all = [...sets, ...within(screen.getByRole("list", { name: "People sets" })).getAllByRole("link")].map((link) => link.getAttribute("href"));
    // Confirm each set once
    expect([...all].sort()).toEqual(LEARN_SETS.map((set) => `/learn/set?id=${set.id}`).sort());
    // The set marked "Next up"
    const nextUp = sets.find((link) => link.textContent?.includes("Next up"));
    // Confirm Stories leads the group (decision 94), the set holding the first card is marked next, and the main action
    expect([sets[0]?.getAttribute("aria-label"), nextUp?.getAttribute("aria-label"), nextUp?.getAttribute("href"), screen.getByRole("link", { name: /^Next card/ }).getAttribute("href")]).toEqual([`Stories you can tell, 0 of ${LEARN_CARDS.filter((card) => card.set === "stories").length}`, `Nerves and presence, 0 of ${LEARN_CARDS.filter((card) => card.set === "nerves").length}`, "/learn/set?id=nerves", `/learn/card?id=${LEARN_CARDS[0]?.id}`]);
  });

  // With a focus, its sets come first as their own group, and the next card is from them (decision 97)
  it("puts the focus sets first, with the next card from them", async () => {
    // A repository with a work focus
    const repository = createRepository(new MemoryStore());
    // The focus
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), practiceFocus: ["work"] });
    // Draw the page
    render(<LearnScreen repository={repository} now={NOW} />);
    // The focus group
    const focus = await screen.findByRole("list", { name: "For your focus sets" });
    // Confirm its sets, that it comes first, and that the next card is from it
    expect([within(focus).getAllByRole("link").map((link) => link.getAttribute("href")), screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent).slice(1, 4), screen.getByRole("link", { name: /^Next card/ }).getAttribute("href")]).toEqual([["/learn/set?id=work", "/learn/set?id=point"], ["Practise", "For your focus", "Speaking"], `/learn/card?id=${LEARN_CARDS.find((card) => card.set === "work")?.id}`]);
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

  // The speaking lessons live in Learn (decision 107): the Speaking skills set lists its cards, and each card's practice opens its lesson
  it("lists the speaking skills, each opening its lesson", async () => {
    // Draw the set
    render(<LearnSetScreen setId="skills" repository={createRepository(new MemoryStore())} now={NOW} />);
    // The cards
    const cards = within(await screen.findByRole("list", { name: "Cards" })).getAllByRole("link");
    // The set's cards in the content
    const content = LEARN_CARDS.filter((card) => card.set === "skills");
    // Confirm the name, one row per card, each opening its card, and every card's practice is a lesson
    expect([screen.getByRole("heading", { level: 1 }).textContent, cards.length, cards.map((link) => link.getAttribute("href")), content.every((card) => card.tryIt.href.startsWith("/session?mode=lesson&prompt=l"))]).toEqual(["Speaking skills", content.length, content.map((card) => `/learn/card?id=${card.id}`), true]);
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

  // A new card's last screen has a small step to try away from the app
  it("ends with a small step to try for real (decision 71)", async () => {
    // Draw the apology card
    render(<CardScreen cardId="hard-apology" repository={createRepository(new MemoryStore())} now={NOW} services={fakeServices("")} />);
    // Wait for it, then through to "What to do"
    await screen.findByRole("heading", { name: "What makes an apology work?" });
    next(3);
    // Confirm the step is there, in its own words
    expect(screen.getByText("Try it for real").nextElementSibling?.textContent).toBe("Next time you owe an apology, use: “I [did this]. That was my mistake. Here’s what I’ll do: …”");
  });

  // Decision 96: every card ends with its practice, the last thing on its last screen, with or without a scenario
  it("ends every card with a link to its practice, after any scenario", async () => {
    // Draw a card without a scenario, through to its last screen
    render(<CardScreen cardId="voice-project" repository={createRepository(new MemoryStore())} now={NOW} services={fakeServices("")} />);
    // Wait for it, then through to "What to do"
    await screen.findByRole("heading", { name: "Louder, with variety, sounds confident." });
    // Through the screens
    next(3);
    // The last screen in view
    const plain = screen.getByRole("group", { name: "4 of 4" });
    // Its links, in order
    const plainLinks = within(plain).getAllByRole("link");
    // Confirm the last link is the practice, by name and address
    expect([plainLinks.at(-1)?.textContent, plainLinks.at(-1)?.getAttribute("href")]).toEqual(["Practise itVolume drill: Three rooms", "/voice/drill?id=v01"]);
    // Start again with a card that has a scenario
    cleanup();
    // Draw the boomerasking card
    render(<CardScreen cardId="talk-boomerask" repository={createRepository(new MemoryStore())} now={NOW} services={fakeServices("")} />);
    // Guess, then through to the scenario
    fireEvent.click(await screen.findByRole("button", { name: "Myth" }));
    // Through the screens
    next(4);
    // The "What to do" screen has no practice link; the scenario screen ends with it
    const [doScreen, scenarioScreen] = [document.querySelector<HTMLElement>('[aria-label="4 of 5"]')!, screen.getByRole("group", { name: "5 of 5" })];
    // The scenario screen's links
    const scenarioLinks = within(scenarioScreen).getAllByRole("link");
    // Confirm
    expect([doScreen.querySelectorAll("a").length, scenarioLinks.at(-1)?.getAttribute("href"), scenarioScreen.lastElementChild?.lastElementChild?.getAttribute("href")]).toEqual([0, "/session?mode=smalltalk&prompt=sal3", "/session?mode=smalltalk&prompt=sal3"]);
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
    // The reveal (the say-it recorder inside it has its own quiet status for the final words)
    const reveal = screen.getAllByRole("status").find((status) => status.textContent?.includes("The best one:"))!;
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

  // Inside today's practice (decision 72): the way out leads to Today, and the end moves on to the next step
  it("runs as a step of today's practice", async () => {
    // Draw the page as the last step of four
    render(<ScenariosScreen repository={createRepository(new MemoryStore())} now={NOW} services={fakeServices("")} planStep={4} />);
    // Each of three
    for (let round = 0; round < 3; round++) {
      // Choose the first reply
      fireEvent.click(within(await screen.findByRole("group", { name: "Replies" })).getAllByRole("button")[0]!);
      // Move on
      fireEvent.click(screen.getByRole("button", { name: round < 2 ? "Next scenario" : "Finish" }));
    }
    // Confirm the way out and the finish
    expect([screen.getByRole("link", { name: "Close, back to Today" }).getAttribute("href"), (await screen.findByRole("link", { name: /^Finish today’s practice/ })).getAttribute("href")]).toEqual(["/", "/"]);
  });
});
