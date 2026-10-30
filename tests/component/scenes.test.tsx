// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
// Load the screens being checked
import { ScenesScreen } from "@/components/screens/ScenesScreen";
import { ScenePlayScreen } from "@/components/screens/ScenePlayScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the progress saver and loader
import { loadSceneProgress, saveSceneResult } from "@/data/practiceProgress";
// Load the scenes
import { SCENES, findScene } from "@/content/scenes";
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

// Record a take and finish it
async function speakAndFinish(name: string) {
  // Start recording
  fireEvent.click(screen.getByRole("button", { name: "Answer" }));
  // Stop
  fireEvent.click(await screen.findByRole("button", { name: "Stop" }));
  // On to the end
  fireEvent.click(await screen.findByRole("button", { name: `Done, hear what ${name} says` }));
}

// Group the checks about the list of scenes (decision 149)
describe("ScenesScreen", () => {
  // The first scene is next on a fresh start; once it is played, the second; every scene is listed with how it went
  it("offers the next scene and lists every scene with how it went", async () => {
    // A repository where the first scene was played
    const repository = createRepository(new MemoryStore());
    // Fresh
    render(<ScenesScreen repository={repository} now={NOW} />);
    // The pick
    const fresh = (await screen.findByText(SCENES[0]!.title, { selector: "[data-next-scene]" })).getAttribute("data-next-scene");
    // Played once, warmly
    cleanup();
    // Saved
    await saveSceneResult(repository, SCENES[0]!.id, { warmth: 4, passed: 4, checkCount: 4 }, NOW);
    // Drawn again
    render(<ScenesScreen repository={repository} now={NOW} />);
    // The new pick
    const next = (await screen.findByText(SCENES[1]!.title, { selector: "[data-next-scene]" })).getAttribute("data-next-scene");
    // The list's rows
    const rows = within(screen.getByRole("region", { name: "All scenes" })).getAllByRole("link");
    // Confirm the picks, the count, the first row's note and address
    expect([fresh, next, rows.length, rows[0]!.textContent?.includes("played once, at best they were pleased"), rows[0]!.getAttribute("href")]).toEqual([SCENES[0]!.id, SCENES[1]!.id, SCENES.length, true, `/scenes/play?id=${SCENES[0]!.id}`]);
  });

  // Progress that cannot be read still shows every scene, and says so
  it("still lists the scenes when progress cannot be read", async () => {
    // A repository whose settings cannot be read
    const repository = createRepository(new MemoryStore());
    // Reading breaks
    repository.getSettings = () => Promise.reject(new Error("The storage is unavailable."));
    // Drawn
    render(<ScenesScreen repository={repository} now={NOW} />);
    // Confirm the note, the pick and the list
    expect([!!(await screen.findByRole("alert")).textContent?.includes("couldn’t be read"), screen.getByText(SCENES[0]!.title, { selector: "[data-next-scene]" }).getAttribute("data-next-scene"), within(screen.getByRole("region", { name: "All scenes" })).getAllByRole("link").length]).toEqual([true, SCENES[0]!.id, SCENES.length]);
  });
});

// Group the checks about playing a scene
describe("ScenePlayScreen", () => {
  // A whole play: opening, a best reply and its answer, the bridge, a misstep and its answer, the prompt, a good spoken reply, a warm closing, saved
  it("plays a scene from start to finish and saves it", async () => {
    // The long week, with Chris
    const scene = findScene("sn-long-week")!;
    // Stand-ins
    const voice = fakeVoice();
    // A repository
    const repository = createRepository(new MemoryStore());
    // Drawn
    render(<ScenePlayScreen sceneId={scene.id} repository={repository} now={NOW} services={fakeServices("Every week it never calms down? That sounds exhausting. How are you holding up?")} speak={voice.speak} />);
    // Start
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    // Their opening on screen
    await screen.findByText(scene.opening.text);
    // Choose the best reply
    fireEvent.click(screen.getByRole("button", { name: /The only one left\?/ }));
    // The verdict
    const verdict = (await screen.findByRole("status")).textContent;
    // On
    fireEvent.click(screen.getByRole("button", { name: "Carry on" }));
    // Choose the misstep (sharing your own story)
    fireEvent.click(await screen.findByRole("button", { name: /lived on toast/ }));
    // Its verdict
    const second = (await screen.findByRole("status")).textContent;
    // On to your turn
    fireEvent.click(screen.getByRole("button", { name: "Carry on" }));
    // Speak and finish
    await speakAndFinish("Chris");
    // The result
    const result = await screen.findByRole("region", { name: "How it went" });
    // The checks' marks
    const checks = [...result.querySelectorAll("[data-check]")].map((item) => [item.getAttribute("data-check"), item.getAttribute("data-passed")]);
    // Confirm the verdicts, the lines said in order, the headline, the tiers, the checks and the mood
    expect([verdict?.startsWith("Yes."), second?.startsWith("A common move."), voice.said, screen.getByRole("heading", { level: 1 }).textContent, [...result.querySelectorAll("[data-choice-tier]")].map((item) => item.getAttribute("data-choice-tier")), checks, document.querySelector("[data-mood]")?.getAttribute("data-mood")]).toEqual([
      true,
      true,
      ["sn-long-week-open", "sn-long-week-1b", "sn-long-week-bridge", "sn-long-week-2a", "sn-long-week-prompt", "sn-long-week-warm"],
      "Chris left happy.",
      ["best", "misstep"],
      [["their-words", "true"], ["their-feeling", "true"], ["stays", "true"], ["no-advice", "true"]],
      "pleased",
    ]);
    // And the play was saved
    expect((await loadSceneProgress(repository, NOW))[scene.id]).toEqual({ plays: 1, firstAt: NOW.toISOString(), lastAt: NOW.toISOString(), lastWarmth: 1, bestWarmth: 1, lastPassed: 4, checkCount: 4 });
  });

  // A reply where nothing was caught closes flat, says so, and the scene can be played again from the start
  it("closes flat when nothing was caught, and starts again", async () => {
    // A scene
    const scene = findScene("sn-early")!;
    // Stand-ins
    const voice = fakeVoice();
    // Drawn, with a take that catches nothing
    render(<ScenePlayScreen sceneId={scene.id} repository={createRepository(new MemoryStore())} now={NOW} services={fakeServices("")} speak={voice.speak} />);
    // Start, two choices, then the turn
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    // First choice: the flat one
    fireEvent.click(await screen.findByRole("button", { name: "“Yep.”" }));
    // On
    fireEvent.click(screen.getByRole("button", { name: "Carry on" }));
    // Second choice: the closed question
    fireEvent.click(await screen.findByRole("button", { name: /Do you sell them/ }));
    // On
    fireEvent.click(screen.getByRole("button", { name: "Carry on" }));
    // Speak (nothing) and finish
    await speakAndFinish("Theo");
    // The result
    await screen.findByRole("region", { name: "How it went" });
    // What it says
    const notes = [screen.getByRole("heading", { level: 1 }).textContent, !!screen.queryByText(/No words were caught/), voice.said.at(-1), document.querySelector("[data-mood]")?.getAttribute("data-mood")];
    // Again
    fireEvent.click(screen.getByRole("button", { name: "Play it again" }));
    // Confirm the flat end, then back at the start
    expect([notes, !!screen.getByRole("button", { name: "Start" }), screen.queryByRole("list", { name: "The conversation" })]).toEqual([["Close. One more go?", true, "sn-early-flat", "deflated"], true, null]);
  });

  // A save that fails says so and can be tried again
  it("says when the play cannot be saved, and saves on a second try", async () => {
    // A scene
    const scene = findScene("sn-lisbon")!;
    // A repository whose first save fails
    const repository = createRepository(new MemoryStore());
    // The real save, kept
    const realSave = repository.saveSettings.bind(repository);
    // Fail once, then work
    let failures = 1;
    // The stand-in
    repository.saveSettings = (settings) => (failures-- > 0 ? Promise.reject(new Error("The storage is full.")) : realSave(settings));
    // Drawn
    render(<ScenePlayScreen sceneId={scene.id} repository={repository} now={NOW} services={fakeServices("Wow, what a lot. How do you feel about it?")} speak={fakeVoice().speak} />);
    // Through the scene
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    // First choice
    fireEvent.click((await screen.findAllByRole("button", { name: /Lisbon|Congrats|Nice one/ }))[0]!);
    // On
    fireEvent.click(screen.getByRole("button", { name: "Carry on" }));
    // Second choice
    fireEvent.click((await screen.findAllByRole("button", { name: /proud|Good crying|At least/ }))[0]!);
    // On
    fireEvent.click(screen.getByRole("button", { name: "Carry on" }));
    // Speak and finish
    await speakAndFinish("Priya");
    // The failure
    const alert = await screen.findByRole("alert");
    // Try again
    fireEvent.click(within(alert).getByRole("button", { name: "Try saving again" }));
    // Confirm the note, then that it went away and the play was saved
    await screen.findByRole("region", { name: "How it went" });
    // Wait for the save to land
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Confirm
    expect([alert.textContent?.includes("couldn’t be saved"), screen.queryByRole("alert"), (await loadSceneProgress(repository, NOW))[scene.id]?.plays]).toEqual([true, null, 1]);
  });

  // An unknown scene says so, with the way back
  it("says when a scene is not found", () => {
    // Drawn with a missing id
    render(<ScenePlayScreen sceneId="missing" repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the note and the way back
    expect([screen.getByRole("heading", { level: 1 }).textContent, screen.getByRole("link", { name: "Choose another scene" }).getAttribute("href")]).toEqual(["That scene isn’t here.", "/scenes"]);
  });

  // With the real voice (no stand-in), starting still shows their first line (the phone's voice is missing here, so it finishes at once)
  it("starts with the real voice when none is given", async () => {
    // A scene
    const scene = findScene("sn-board")!;
    // Drawn with the defaults for the voice
    render(<ScenePlayScreen sceneId={scene.id} repository={createRepository(new MemoryStore())} now={NOW} services={fakeServices("")} />);
    // Start
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    // Confirm their first line and the first choice
    expect([!!(await screen.findByText(scene.opening.text)), !!screen.getByRole("region", { name: "First choice" })]).toEqual([true, true]);
  });
});
