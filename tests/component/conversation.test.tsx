// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screens being checked
import { ConversationScreen, type PickLines } from "@/components/screens/ConversationScreen";
import { ConversationsScreen } from "@/components/screens/ConversationsScreen";
import { SessionScreen } from "@/components/screens/SessionScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
// Load the recording contracts
import type { RecordingServices } from "@/audio/services";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load a sample session builder
import { makeSession } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 20, 10);

// Remove drawn screens after each check
afterEach(cleanup);

// A clock the check moves by hand
function fakeClock(start = NOW.getTime()) {
  // Current time
  let time = start;
  // Read and move it
  return { now: () => new Date(time), advance: (ms: number) => void (time += ms) };
}

// Fake services: each line takes two seconds and is noted; the listener hands back the next words heard
function fakeServices(clock: ReturnType<typeof fakeClock>, heard: string[], said: string[], supported = true): RecordingServices {
  // The pieces
  return {
    // Speech support, as asked
    speechSupported: () => supported,
    // A stand-in stream
    openMicrophone: async () => ({ getTracks: () => [], getAudioTracks: () => [] }) as unknown as MediaStream,
    // Say a line: noted, two seconds pass, a recording of unknown length
    speak: async (_text, id) => {
      // Noted
      said.push(id);
      // Time passes
      clock.advance(2000);
      // Not a saved recording
      return null;
    },
    // Quiet
    stopSpeaking: () => {},
    // A listener handing back the next words
    createTranscriber: () => ({ start: () => {}, stop: async () => heard.shift() ?? "" }),
    // A steady level
    createCapture: () => ({ level: () => 0.5, stop: async () => new Blob(["voice"]) }),
  };
}

// Group the checks about a conversation (decision 83)
describe("ConversationScreen", () => {
  // Maya opens; each Done sends your words for her next lines; near the end she says goodbye, and it is saved and opened
  it("talks turn by turn with the chosen lines, then saves the conversation", async () => {
    // The clock
    const clock = fakeClock();
    // What she said
    const said: string[] = [];
    // What you say, turn by turn
    const heard = ["I went climbing on Saturday", "It was great, what about you"];
    // The chooser: a reaction and a question, then (near the end) a reaction and goodbye
    const asked: boolean[] = [];
    // Answers in turn
    const pickLines: PickLines = async (_id, _turns, wrapUp) => {
      // Note whether it was wrapping up
      asked.push(wrapUp);
      // The lines
      return wrapUp ? ["maya-17", "maya-37"] : ["maya-16", "maya-13"];
    };
    // Where it went next
    const navigate = vi.fn();
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Draw it
    render(<ConversationScreen characterId="maya" services={fakeServices(clock, heard, said)} navigate={navigate} pickLines={pickLines} repository={repository} now={NOW} clock={clock.now} />);
    // The scene and what to practise
    expect(await screen.findByRole("heading", { name: "Talk with Maya" })).toBeTruthy();
    // Start
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    // Your turn: answer, then Done
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    // Her question comes up, then your turn again
    await screen.findByRole("heading", { name: "Ooh. And how was it?" });
    // Two and a half minutes in
    clock.advance(150_000);
    // Done again
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    // Saved and opened
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // The saved session
    const [session] = await repository.listSessions();
    // Her lines in order, the chooser told when to wrap up, the turns kept, and its results opened
    expect([said, asked, session?.mode, session?.promptId, session?.conversation?.turns.map((turn) => turn.lineId ?? turn.text), navigate.mock.calls[0]?.[0]]).toEqual([
      ["maya-01", "maya-16", "maya-13", "maya-17", "maya-37"],
      [false, true],
      "conversation",
      "maya",
      ["maya-01", "I went climbing on Saturday", "maya-16", "maya-13", "It was great, what about you", "maya-17", "maya-37"],
      `/sessions?id=${session?.id}`,
    ]);
  });

  // Without the coach: a listening sound while waiting, the set script, and her line for a turn not caught; End saves what was said
  it("follows the script without the coach, and asks again when nothing was caught", async () => {
    // The clock
    const clock = fakeClock();
    // What she said
    const said: string[] = [];
    // Nothing caught, then words
    const heard = ["", "Hi, I'm Sam"];
    // The chooser cannot be reached, after a moment
    const pickLines: PickLines = () => new Promise((resolve) => setTimeout(() => resolve(null), 30));
    // Where it went next
    const navigate = vi.fn();
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Draw it, with no wait before the listening sound
    render(<ConversationScreen characterId="maya" services={fakeServices(clock, heard, said)} navigate={navigate} pickLines={pickLines} repository={repository} now={NOW} clock={clock.now} listenDelayMs={0} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // Done, with nothing caught
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    // Said so, and your turn again
    expect(await screen.findByText("That wasn’t caught. Say it again, then tap Done.")).toBeTruthy();
    // Done, with words
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    // The script's first step, then your turn
    await screen.findByRole("heading", { name: "So how was your weekend?" });
    // End early
    fireEvent.click(await screen.findByRole("button", { name: "End conversation" }));
    // Saved and opened
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // The saved session
    const [session] = await repository.listSessions();
    // The repeat and the listening sound were said but kept out of the conversation
    expect([said, session?.conversation?.turns.map((turn) => turn.lineId ?? turn.text)]).toEqual([["maya-01", "maya-36", "maya-04", "maya-24", "maya-07"], ["maya-01", "Hi, I'm Sam", "maya-24", "maya-07"]]);
  });

  // Ending before saying anything saves nothing
  it("saves nothing when nothing was said", async () => {
    // The clock
    const clock = fakeClock();
    // Where it went next
    const navigate = vi.fn();
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Draw it
    render(<ConversationScreen characterId="theo" services={fakeServices(clock, [], [])} navigate={navigate} pickLines={async () => null} repository={repository} now={NOW} clock={clock.now} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // End straight away
    fireEvent.click(await screen.findByRole("button", { name: "End conversation" }));
    // Said so; nothing saved, nowhere to go
    expect([!!(await screen.findByRole("heading", { name: "Nothing was heard from you, so nothing was saved." })), (await repository.listSessions()).length, navigate.mock.calls.length]).toEqual([true, 0, 0]);
  });

  // A browser without speech-to-text cannot follow what is said, so it says so instead of starting
  it("explains when the browser cannot turn speech into text", async () => {
    // Draw it without speech support
    render(<ConversationScreen characterId="chris" services={fakeServices(fakeClock(), [], [], false)} navigate={() => {}} repository={createRepository(new MemoryStore())} now={NOW} />);
    // The reason, and no Start
    expect([(await screen.findByRole("alert")).textContent?.includes("Try Chrome, Edge or Safari"), screen.queryByRole("button", { name: "Start" })]).toEqual([true, null]);
  });

  // An unknown person
  it("says when the person cannot be found", async () => {
    // Draw it
    render(<ConversationScreen characterId="nobody" services={fakeServices(fakeClock(), [], [])} navigate={() => {}} repository={createRepository(new MemoryStore())} now={NOW} />);
    // Said so, with the way back
    expect([(await screen.findByRole("heading", { level: 1 })).textContent, screen.getByRole("link", { name: "See everyone to talk with" }).getAttribute("href")]).toEqual(["That person could not be found.", "/conversations"]);
  });
});

// Group the checks about the list, the results and History
describe("conversations elsewhere", () => {
  // Four people, each with their skill and how often
  it("lists the four people with how often each was talked with", async () => {
    // A repository with one talk with Theo
    const repository = createRepository(new MemoryStore());
    // Once
    await repository.saveSession(makeSession({ id: "c1", mode: "conversation", promptId: "theo" }));
    // Draw it
    render(<ConversationsScreen repository={repository} now={NOW} />);
    // The rows
    const rows = within(await screen.findByRole("list", { name: "People to talk with" })).getAllByRole("link");
    // Their addresses, and the count
    expect([rows.map((row) => row.getAttribute("href")), !!(await screen.findByText("Asking · once"))]).toEqual([["/conversations/talk?id=maya", "/conversations/talk?id=theo", "/conversations/talk?id=chris", "/conversations/talk?id=priya"], true]);
  });

  // The results: the share and questions, the coach's change with one of your lines made better, the whole conversation, and talk again; History names who it was with
  it("shows a saved conversation and names it in History", async () => {
    // A conversation with Theo, reviewed
    const session = makeSession({ id: "c1", mode: "conversation", promptId: "theo", durationSec: 95, feedbackStatus: "done", feedback: { keep: "You asked about the radios.", change: "Pick up his words.", retryCue: "Ask about the last thing he said.", conversation: { yours: "do you like your job", better: "What do you look for at the flea markets?" } }, conversation: { turns: [{ who: "them", text: "Well… I fix up old radios.", lineId: "theo-14", seconds: 3 }, { who: "you", text: "oh what kind of radios", seconds: 2 }] } });
    // A repository with it
    const repository = createRepository(new MemoryStore());
    // Saved
    await repository.saveSession(session);
    // Draw the results
    render(<SessionScreen sessionId="c1" repository={repository} now={NOW} />);
    // The headline
    const headline = await screen.findByRole("heading", { level: 1 });
    // The turns
    const turns = within(screen.getByRole("list", { name: "The conversation" })).getAllByRole("listitem").map((item) => item.textContent);
    // Each part
    expect([headline.textContent, !!screen.getByText("“do you like your job”"), !!screen.getByText("What do you look for at the flea markets?"), turns, screen.getByRole("link", { name: /Talk again/ }).getAttribute("href")]).toEqual(["You did 45% of the talking and asked 1 question.", true, true, ["TheoWell… I fix up old radios.", "Youoh what kind of radios"], "/conversations/talk?id=theo"]);
    // Close it
    cleanup();
    // Draw History
    render(<HistoryScreen repository={repository} now={NOW} />);
    // Named by who it was with
    expect(await screen.findByText("Conversation with Theo")).toBeTruthy();
  });
});
