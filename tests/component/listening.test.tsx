// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
// Load the screens being checked
import { ListeningScreen } from "@/components/screens/ListeningScreen";
import { ListenPlayScreen } from "@/components/screens/ListenPlayScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the progress saver and loader
import { loadListenProgress, saveListenResult } from "@/data/practiceProgress";
// Load the stories
import { findListenStory } from "@/content/listening";
// Load the order they are offered in
import { storiesInOrder } from "@/core/listening";
// Load the recording contract
import type { RecordingServices } from "@/audio/services";

// Remove drawn screens after each check
afterEach(() => cleanup());

// A fixed moment
const NOW = new Date(2026, 9, 30, 10);

// Stand-in recording pieces whose take always says the given words
function fakeServices(words: string): RecordingServices {
  // The services
  return {
    // Speech is supported
    speechSupported: () => true,
    // A stand-in microphone
    openMicrophone: async () => ({ getTracks: () => [] }) as unknown as MediaStream,
    // A transcriber that hands back the words
    createTranscriber: () => ({ start: () => undefined, stop: async () => words }),
    // A capture with fixed audio
    createCapture: () => ({ level: () => 0.5, stop: async () => new Blob(["voice"]) }),
  };
}

// A stand-in voice that notes each line's id as it is said
function fakeVoice() {
  // The lines said, in order
  const said: string[] = [];
  // Say one: note it and finish at once
  const speak = async (_text: string, id: string) => void said.push(id);
  // Both
  return { said, speak };
}

// Answer out loud and finish
async function answerAndFinish() {
  // Start recording
  fireEvent.click(await screen.findByRole("button", { name: "Answer" }));
  // Stop
  fireEvent.click(await screen.findByRole("button", { name: "Stop" }));
  // On to the result
  fireEvent.click(await screen.findByRole("button", { name: "Done, see what you caught" }));
}

// Group the checks about the list of stories (decision 150)
describe("ListeningScreen", () => {
  // The first level-1 story is next; a heard story shows its title and best, an unheard one only who tells it
  it("offers the next story and lists them by level without giving new ones away", async () => {
    // A repository where the first story was answered
    const repository = createRepository(new MemoryStore());
    // The order offered
    const ordered = storiesInOrder();
    // Answered
    await saveListenResult(repository, ordered[0]!.id, { caught: 3, detailCount: ordered[0]!.details.length, core: true }, NOW);
    // Drawn
    render(<ListeningScreen repository={repository} now={NOW} />);
    // The pick
    const next = (await screen.findByText(/^A story from/, { selector: "[data-next-story]" })).getAttribute("data-next-story");
    // Level 1's rows
    const rows = within(screen.getByRole("region", { name: "Level 1" })).getAllByRole("link").map((link) => link.textContent);
    // Confirm the pick, the heard row's title and best, the unheard row's plain name, and three levels
    expect([next, rows[0]?.startsWith(ordered[0]!.title), rows[0]?.includes(`best: 3 of ${ordered[0]!.details.length} details · heard what mattered`), rows[1]?.startsWith("A story from"), rows[1]?.includes(ordered[1]!.title), ["Level 1", "Level 2", "Level 3"].every((name) => !!screen.getByRole("region", { name }))]).toEqual([ordered[1]!.id, true, true, true, false, true]);
  });
});

// Group the checks about hearing a story
describe("ListenPlayScreen", () => {
  // The story is heard (no words on screen), heard once more on level 1, answered; the result marks details, what mattered, the warm reply, and saves
  it("plays a story, takes the answer, marks what was caught and saves it", async () => {
    // The five K, level 1, with Maya
    const story = findListenStory("ls-five-k")!;
    // Stand-ins
    const voice = fakeVoice();
    // A repository
    const repository = createRepository(new MemoryStore());
    // Drawn, with a good answer
    render(<ListenPlayScreen storyId={story.id} repository={repository} now={NOW} services={fakeServices("No way, you ran the whole thing? And they waited and clapped for you? You must be so proud. How did it feel?")} speak={voice.speak} />);
    // Listen
    fireEvent.click(screen.getByRole("button", { name: "Listen" }));
    // The answer section, with the story's words still hidden
    await screen.findByRole("region", { name: "Your answer" });
    // Whether the words showed before answering
    const hidden = !screen.queryByText(story.text);
    // Hear it once more (level 1 allows two)
    fireEvent.click(screen.getByRole("button", { name: "Hear it once more" }));
    // The second hearing done, with no third offered
    await screen.findByRole("region", { name: "Your answer" });
    // Whether a third is offered
    const third = !!screen.queryByRole("button", { name: "Hear it once more" });
    // Answer and finish
    await answerAndFinish();
    // The result
    const result = await screen.findByRole("region", { name: "How it went" });
    // The marks in the story
    const marks = [...result.querySelectorAll("[data-mark]")].map((mark) => [mark.getAttribute("data-mark"), mark.textContent]);
    // Confirm the hidden words, no third hearing, the lines said, the headline, the reply, and the marks
    expect([hidden, third, voice.said, screen.getByRole("heading", { level: 1 }).textContent, result.querySelector("[data-reply]")?.textContent?.includes(story.closings.warm.text), marks]).toEqual([
      true,
      false,
      ["ls-five-k", "ls-five-k", "ls-five-k-warm"],
      "You heard what mattered.",
      true,
      [["missed", "five K"], ["core", "I actually ran the whole thing"], ["missed", "came last"], ["missed", "ten minutes"], ["caught", "waited for me at the finish and clapped"], ["missed", "pastries"]],
    ]);
    // And the answer was saved
    expect((await loadListenProgress(repository, NOW))[story.id]).toEqual({ plays: 1, firstAt: NOW.toISOString(), lastAt: NOW.toISOString(), lastCaught: 1, bestCaught: 1, detailCount: 5, lastCore: true });
  });

  // Level 3 is heard once; the words can be shown for anyone who cannot listen; a reply that misses what mattered gets the polite closing
  it("allows one hearing on level 3, shows the words on request, and answers politely when what mattered was missed", async () => {
    // The offer, level 3, with Theo
    const story = findListenStory("ls-new-team")!;
    // Stand-ins
    const voice = fakeVoice();
    // Drawn, with an answer that misses the presenting
    render(<ListenPlayScreen storyId={story.id} repository={createRepository(new MemoryStore())} now={NOW} services={fakeServices("More money, then. You should say yes.")} speak={voice.speak} />);
    // Listen
    fireEvent.click(screen.getByRole("button", { name: "Listen" }));
    // The answer section
    await screen.findByRole("region", { name: "Your answer" });
    // No second hearing on level 3
    const again = !!screen.queryByRole("button", { name: "Hear it once more" });
    // Show the words
    fireEvent.click(screen.getByRole("button", { name: "Can’t listen? Show the words" }));
    // The words shown
    const words = document.querySelector("[data-story-words]")?.textContent;
    // Answer and finish
    await answerAndFinish();
    // The result
    await screen.findByRole("region", { name: "How it went" });
    // The checks that failed
    const failed = [...document.querySelectorAll("[data-check][data-passed=false]")].map((item) => item.getAttribute("data-check"));
    // Confirm
    expect([again, words, voice.said.at(-1), screen.getByRole("heading", { level: 1 }).textContent, failed]).toEqual([false, story.text, "ls-new-team-flat", `You caught 1 of ${story.details.length} details.`, ["details", "their-feeling", "core", "question", "no-advice"]]);
  });

  // A save that fails says so, and the second try saves it
  it("says when the answer cannot be saved, and saves on a second try", async () => {
    // A story
    const story = findListenStory("ls-radio")!;
    // A repository whose first save fails
    const repository = createRepository(new MemoryStore());
    // The real save, kept
    const realSave = repository.saveSettings.bind(repository);
    // Fail once, then work
    let failures = 1;
    // The stand-in
    repository.saveSettings = (settings) => (failures-- > 0 ? Promise.reject(new Error("The storage is full.")) : realSave(settings));
    // Drawn
    render(<ListenPlayScreen storyId={story.id} repository={repository} now={NOW} services={fakeServices("Your grandad's radio?")} speak={fakeVoice().speak} />);
    // Listen, answer, finish
    fireEvent.click(screen.getByRole("button", { name: "Listen" }));
    // (answer)
    await answerAndFinish();
    // The failure
    const alert = await screen.findByRole("alert");
    // Try again
    fireEvent.click(within(alert).getByRole("button", { name: "Try saving again" }));
    // Wait for the save to land
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Confirm the note, then that it went away and the answer was saved
    expect([alert.textContent?.includes("couldn’t be saved"), screen.queryByRole("alert"), (await loadListenProgress(repository, NOW))[story.id]?.lastCore]).toEqual([true, null, true]);
  });

  // An unknown story says so, with the way back
  it("says when a story is not found", () => {
    // Drawn with a missing id
    render(<ListenPlayScreen storyId="missing" repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the note and the way back
    expect([screen.getByRole("heading", { level: 1 }).textContent, screen.getByRole("link", { name: "Choose another story" }).getAttribute("href")]).toEqual(["That story isn’t here.", "/listening"]);
  });
});
