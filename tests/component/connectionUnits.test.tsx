// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screens being checked
import { SmallTalkScreen } from "@/components/screens/SmallTalkScreen";
import { SessionScreen } from "@/components/screens/SessionScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
import { UnitsScreen } from "@/components/screens/UnitsScreen";
import { MissionScreen } from "@/components/screens/MissionScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the mission saving helpers
import { acceptMission, debriefMission } from "@/data/missions";
// Load the small-talk content
import { SMALL_TALK_LESSONS, drillForDay } from "@/content/smallTalk";
// Load the record type
import type { SessionRecord } from "@/data/records";
// Load the recording contracts
import type { RecordingServices } from "@/audio/services";
// Load a sample session builder
import { makeSession } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 21, 18);

// Remove the drawn screen after each check
afterEach(cleanup);

// A repository holding the given sessions
async function repositoryWith(...sessions: SessionRecord[]) {
  // An empty one
  const repository = createRepository(new MemoryStore());
  // Save each
  for (const session of sessions) await repository.saveSession(session);
  // Hand it back
  return repository;
}

// A reply in one of the new units, with the user's notes saved so its beats are shown
const reply = (promptId: string, transcript: string, overrides: Partial<SessionRecord> = {}) => makeSession({ id: "r1", mode: "smalltalk", promptId, durationSec: 6, transcript, createdAt: new Date(2026, 9, 21, 9).toISOString(), selfReview: { worked: "", change: "", tags: [], skipped: false, savedAt: NOW.toISOString() }, ...overrides });

// Recording services that never record, for the debrief page
const noRecording: RecordingServices = {
  // Speech is supported
  speechSupported: () => true,
  // A stand-in stream
  openMicrophone: async () => ({ getTracks: () => [] }) as unknown as MediaStream,
  // A transcriber that hears nothing
  createTranscriber: () => ({ start: () => undefined, stop: async () => "" }),
  // A capture with no audio
  createCapture: () => ({ level: () => 0, stop: async () => new Blob([]) }),
};

// Group the checks about the units added in decision 95 on screen
describe("the new Connect units on screen", () => {
  // The all-units page lists the seven in order, each with its lessons, and marks the next one
  it("lists every unit, with the next one marked", async () => {
    // Someone who has done every lesson of the first four units
    const repository = await repositoryWith(...SMALL_TALK_LESSONS.filter((lesson) => ["answering", "asking", "listening", "news"].includes(lesson.unit)).map((lesson) => makeSession({ id: lesson.id, mode: "smalltalk", promptId: lesson.id })));
    // Draw the page
    render(<UnitsScreen repository={repository} now={NOW} />);
    // The units
    const list = await screen.findByRole("list", { name: "Units" });
    // Confirm seven links in order, and the room unit as next up
    expect([within(list).getAllByRole("link").map((link) => link.getAttribute("href")?.split("=")[1]), within(list).getByRole("link", { name: /Reading the room/ }).textContent?.includes("Next up")]).toEqual([["answering", "asking", "listening", "news", "room", "starting", "deeper"], true]);
  });

  // The Reading the room page: today's moment, the recipe, the lessons, every moment, and the unit's missions with one tried
  it("draws the Reading the room page with its moments and missions", async () => {
    // A repository with the first room mission tried
    const repository = createRepository(new MemoryStore());
    // Take it on
    const [accepted] = await acceptMission(repository, "m15", 3, NOW);
    // Debrief it as tried
    await debriefMission(repository, accepted!, { tried: true, outcome: 4, tooMuch: false, note: "" }, NOW);
    // Draw the page
    render(<SmallTalkScreen unitId="room" repository={repository} now={NOW} />);
    // The practice box
    const practice = await screen.findByRole("region", { name: "Read the room" });
    // The unit's missions
    const missions = screen.getByRole("list", { name: "This unit's missions" });
    // Confirm today's moment and its link, the recipe, the first lesson, the twelve moments, and the missions with the first tried
    expect([
      within(practice).getByRole("heading", { level: 1 }).textContent,
      within(practice).getByRole("link", { name: "Say what you'd say" }).getAttribute("href"),
      !!screen.getByRole("region", { name: "Reading the room, in four beats" }),
      screen.getByRole("link", { name: /Reading the room lesson 1:\s*Notice changes, not signals/ }).getAttribute("href"),
      within(screen.getByRole("region", { name: "Moments to read" })).getAllByRole("link").length,
      within(missions).getAllByRole("listitem").map((item) => item.getAttribute("data-tried")),
      within(missions).getAllByRole("listitem")[1]?.textContent?.includes("A stretch"),
    ]).toEqual([drillForDay("room", NOW).text, `/session?mode=smalltalk&prompt=${drillForDay("room", NOW).id}`, true, "/session?mode=smalltalk&prompt=srl1", 12, ["true", "false", "false"], true]);
  });

  // Starting and ending, and Going deeper: their own recipe, practice box and list
  it("draws the Starting and ending and Going deeper pages", async () => {
    // Draw Starting and ending
    render(<SmallTalkScreen unitId="starting" repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm its recipe, practice action and situations
    expect([!!(await screen.findByRole("region", { name: "An opener and a goodbye, in four beats" })), !!within(screen.getByRole("region", { name: "Open and close" })).getByRole("link", { name: "Say both" }), within(screen.getByRole("region", { name: "Situations" })).getAllByRole("link").length]).toEqual([true, true, 12]);
    // Draw Going deeper instead
    cleanup();
    // The page
    render(<SmallTalkScreen unitId="deeper" repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm its recipe, practice action and flat questions
    expect([!!(await screen.findByRole("region", { name: "A deeper question, in four beats" })), !!within(screen.getByRole("region", { name: "Upgrade the question" })).getByRole("link", { name: "Ask it better" }), within(screen.getByRole("region", { name: "Questions to upgrade" })).getAllByRole("link").length]).toEqual([true, true, 12]);
  });

  // A reply in reading the room: the moment above, the beats with the phone's quotes, the coach's better response, and History's label
  it("shows a reading-the-room result and lists it in History", async () => {
    // A good reply, with the coach's better version
    const repository = await repositoryWith(reply("sr01", "You seem a bit busy today. Do you need to go? No worries if so.", { feedback: { keep: "k", change: "c", retryCue: "r", connection: { found: [{ beat: "noticed", quote: "You seem a bit busy" }, { beat: "check", quote: "Do you need to go?" }, { beat: "follow", quote: "No worries if so" }, { beat: "no-blame", quote: "No worries" }], better: "You seem busy. Do you need to head off?" } } }));
    // Draw the result
    render(<SessionScreen sessionId="r1" repository={repository} now={NOW} />);
    // Confirm the moment, all four beats, the better response with its label, and the next moment
    expect([!!(await screen.findByText("The moment")), screen.getByText("All four beats.").tagName, !!screen.getByText("A better response"), !!screen.getByText("You seem busy. Do you need to head off?"), screen.getByRole("link", { name: /^Next one/ }).getAttribute("href")]).toEqual([true, "H1", true, true, "/session?mode=smalltalk&prompt=sr02"]);
    // Draw History instead
    cleanup();
    // History
    render(<HistoryScreen repository={repository} now={NOW} />);
    // Confirm the label, cut short
    expect(await screen.findByText(/Reading the room: Their answers are getting shorter, and they keep…/)).toBeTruthy();
  });

  // An opener and goodbye heard by the phone alone, and an upgraded question with its own label for the coach's version
  it("shows the phone's quotes for an opener and goodbye, and the better question label", async () => {
    // An opener and goodbye with no coach
    const repository = await repositoryWith(reply("se01", "This kettle takes forever doesn't it are you on this floor too great chatting I'll let you get back to it good luck with the launch"));
    // Draw the result
    render(<SessionScreen sessionId="r1" repository={repository} now={NOW} />);
    // The beats
    const beats = await screen.findByRole("list", { name: "The beats" });
    // Confirm the situation label, all four beats, and the phone's quotes
    expect([!!screen.getByText("The situation"), screen.getByText("All four beats.").tagName, !!within(beats).getByText("“kettle”"), !!within(beats).getByText("“i'll let you”, “good luck”")]).toEqual([true, "H1", true, true]);
    // An upgraded question with the coach's version
    cleanup();
    // Its repository
    const deeper = await repositoryWith(reply("sd01", "What's the best part of what you do", { feedback: { keep: "k", change: "c", retryCue: "r", connection: { found: [{ beat: "open", quote: "What's" }], better: "What got you into it?" } } }));
    // Draw it
    render(<SessionScreen sessionId="r1" repository={deeper} now={NOW} />);
    // Confirm the flat question label and the better question label
    expect([!!(await screen.findByText("The flat question")), !!screen.getByText("A better question")]).toEqual([true, true]);
  });

  // A new mission's debrief asks its own question about what was noticed
  it("asks a new mission's own debrief question", async () => {
    // A repository with the light-up mission taken on
    const repository = createRepository(new MemoryStore());
    // Take it on
    const [accepted] = await acceptMission(repository, "m15", null, NOW);
    // Draw the debrief
    render(<MissionScreen recordId={accepted!.id} repository={repository} now={NOW} services={noRecording} />);
    // Say it was tried
    fireEvent.click(await screen.findByRole("button", { name: "Yes" }));
    // Confirm the mission's own question
    await waitFor(() => expect(screen.getByLabelText(/What made them light up, and how could you tell\?/)).toBeTruthy());
  });
});
