// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and acting on it
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screens being checked
import { HomeScreen } from "@/components/screens/HomeScreen";
import { MissionScreen } from "@/components/screens/MissionScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
import { LearnScreen } from "@/components/screens/LearnScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the saving helpers
import { acceptMission, debriefMission } from "@/data/missions";
// Load the comparison sentence
import { compareLine } from "@/core/missions";
// Load the recording contracts
import type { LiveText, RecordingServices } from "@/audio/services";

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

// Group the checks about missions on screen
describe("missions", () => {
  // Today shows the mission's task and a link to Connect, without the 1 to 5 prediction (decision 62)
  it("shows a short mission on Today that leads to Connect", async () => {
    // The welcome was already skipped
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // Draw Today
    render(<HomeScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // The card
    const card = await screen.findByRole("region", { name: "Today’s mission" });
    // Confirm the task and the link, and no scale or accept button
    expect([!!within(card).getByText(/Ask one follow-up question/), within(card).getByRole("link", { name: "Take it on in Learn" }).getAttribute("href"), within(card).queryByRole("group"), within(card).queryByRole("button", { name: "I’ll try it" })]).toEqual([true, "/learn#missions", null, null]);
  });

  // Learn offers the first mission with a habit to drop and no 1 to 5 prediction (decision 104); accepted, it waits for its debrief
  it("offers a mission on Learn without a prediction and accepts it", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Draw Learn
    render(<LearnScreen repository={repository} now={NOW} />);
    // The card
    const card = await screen.findByRole("region", { name: "Today’s mission" });
    // No scale to predict with
    const scale = within(card).queryByRole("group", { name: "How will it go?" });
    // Accept
    fireEvent.click(within(card).getByRole("button", { name: "I’ll try it" }));
    // Confirm no prediction was offered, the habit to drop was shown, the debrief is offered, and the try saved without a prediction
    expect([scale, !!within(card).getByText(/Don't plan your next line/, { ignore: "summary" }), (await screen.findByRole("link", { name: "How did it go?" })).getAttribute("href")?.startsWith("/mission?id="), (await repository.getSettings(NOW)).missions?.map((item) => [item.missionId, item.status, item.predicted])]).toEqual([null, true, true, [["m01", "accepted", null]]]);
  });

  // "I'll try it" works at once, and the debrief says how it went without a comparison (decision 104; round 4 made it never disabled)
  it("accepts a mission at once and says how it went", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Draw Learn
    render(<LearnScreen repository={repository} now={NOW} />);
    // The card
    const card = await screen.findByRole("region", { name: "Today’s mission" });
    // The accept button, before any number is picked
    const accept = within(card).getByRole("button", { name: "I’ll try it" }) as HTMLButtonElement;
    // Whether it could be pressed
    const open = !accept.disabled;
    // Accept straight away
    fireEvent.click(accept);
    // Wait for it to be saved
    await screen.findByRole("link", { name: "How did it go?" });
    // The saved try
    const [saved] = (await repository.getSettings(NOW)).missions ?? [];
    // Debrief it: tried, went 4 of 5
    const [debriefed] = await debriefMission(repository, saved!, { tried: true, outcome: 4, note: "", tooMuch: false }, NOW);
    // Confirm it was open, saved with no prediction, and the comparison says how it went alone
    expect([open, saved?.predicted, compareLine(debriefed!)]).toEqual([true, null, "It went 4 of 5."]);
  });

  // The debrief: tried, how it went, a note said aloud, then the comparison
  it("debriefs by taps and voice, then compares", async () => {
    // A repository with an accepted mission
    const repository = createRepository(new MemoryStore());
    // Accept it, expecting it to go awkwardly
    const [accepted] = await acceptMission(repository, "m01", 2, NOW);
    // Draw the debrief
    render(<MissionScreen recordId={accepted!.id} repository={repository} now={NOW} services={fakeServices("she lit up talking about her garden")} />);
    // Tried
    fireEvent.click(await screen.findByRole("button", { name: "Yes" }));
    // It went well
    fireEvent.click(within(screen.getByRole("group", { name: "How did it go?" })).getByRole("button", { name: /^4/ }));
    // Say the note
    fireEvent.click(screen.getByRole("button", { name: "Say it instead" }));
    // Stop
    fireEvent.click(await screen.findByRole("button", { name: "Stop" }));
    // Wait for the words in the box
    await waitFor(() => expect((screen.getByLabelText(/What did you notice/) as HTMLTextAreaElement).value).toBe("she lit up talking about her garden"));
    // Save
    fireEvent.click(screen.getByRole("button", { name: "Save and compare" }));
    // Confirm the comparison and the saved try
    expect([(await screen.findByText(/^You expected 2 of 5\. It went 4 of 5\. Better than you feared/)).closest("[role=status]") !== null, (await repository.getSettings(NOW)).missions?.[0]?.note]).toEqual([true, "she lit up talking about her garden"]);
  });

  // Not getting a chance keeps the mission for another day; "too much" steps back
  it("keeps the mission when there was no chance", async () => {
    // A repository with an accepted mission
    const repository = createRepository(new MemoryStore());
    // Accept it
    const [accepted] = await acceptMission(repository, "m01", 3, NOW);
    // Draw the debrief
    render(<MissionScreen recordId={accepted!.id} repository={repository} now={NOW} services={fakeServices("")} />);
    // No chance
    fireEvent.click(await screen.findByRole("button", { name: "Didn’t get a chance" }));
    // Confirm the plain line
    expect((await screen.findByRole("status")).textContent).toBe("No comparison this time. The mission will be offered again.");
  });

  // Tried missions appear on Connect and in History, and count for the streak
  it("shows tried missions on Connect and in History, and counts them for the streak", async () => {
    // The welcome was already skipped
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // A repository with a mission tried yesterday
    const repository = createRepository(new MemoryStore());
    // Accept and debrief it yesterday
    const yesterday = new Date(2026, 9, 17, 20);
    // Accept
    const [accepted] = await acceptMission(repository, "m01", 2, yesterday);
    // Debrief
    await debriefMission(repository, accepted!, { tried: true, outcome: 4, note: "", tooMuch: false }, yesterday);
    // Draw Learn
    render(<LearnScreen repository={repository} now={NOW} />);
    // Confirm the record and today's next mission
    expect([!!(await screen.findByText("1 of 1 went better than you expected.")), !!within(screen.getByRole("list", { name: "Your missions" })).getByLabelText("Expected 2 of 5, went 4 of 5"), !!within(screen.getByRole("region", { name: "Today’s mission" })).getByText(/react to it before you say anything else/)]).toEqual([true, true, true]);
    // Draw History
    cleanup();
    // History
    render(<HistoryScreen repository={repository} now={NOW} />);
    // Confirm the section
    expect(within(await screen.findByRole("region", { name: "Real conversations" })).getByText(/expected 2 of 5, went 4 of 5/)).toBeTruthy();
    // Draw Today
    cleanup();
    // Today
    render(<HomeScreen repository={repository} now={NOW} />);
    // Confirm yesterday is marked practised on the week strip
    expect((await screen.findByRole("list", { name: "The last seven days" })).querySelector('[aria-label^="Saturday"]')?.getAttribute("aria-label")).toBe("Saturday: practised");
  });
});
