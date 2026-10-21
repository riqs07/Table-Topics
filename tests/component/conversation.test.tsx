// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screens being checked
import { ConversationScreen, type WriteLine } from "@/components/screens/ConversationScreen";
import { ConversationsScreen } from "@/components/screens/ConversationsScreen";
import { SessionScreen } from "@/components/screens/SessionScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
// Load the recording contracts
import type { RecordingServices } from "@/audio/services";
// Load the request type
import type { LineRequest } from "@/data/conversationClient";
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

// Fake services: each line takes two seconds and is noted (recorded lines by id, written lines by their words); the listener hands back the next words heard
function fakeServices(clock: ReturnType<typeof fakeClock>, heard: string[], said: string[], supported = true): RecordingServices {
  // The pieces
  return {
    // Speech support, as asked
    speechSupported: () => supported,
    // A stand-in stream
    openMicrophone: async () => ({ getTracks: () => [], getAudioTracks: () => [] }) as unknown as MediaStream,
    // Say a recorded line: noted, two seconds pass, a recording of unknown length
    speak: async (_text, id) => {
      // Noted
      said.push(id);
      // Time passes
      clock.advance(2000);
      // Not a saved recording
      return null;
    },
    // Say a written line: noted, two seconds pass
    speakAudio: async (_audio, text) => {
      // Noted
      said.push(text);
      // Time passes
      clock.advance(2000);
    },
    // Unlocking, noted
    unlockSpeech: () => void said.push("(unlocked)"),
    // Quiet
    stopSpeaking: () => {},
    // A listener handing back the next words
    createTranscriber: () => ({ start: () => {}, stop: async () => heard.shift() ?? "" }),
    // A steady level
    createCapture: () => ({ level: () => 0.5, stop: async () => new Blob(["voice"]) }),
  };
}

// A fake writer: answers each request with the next line given (null when the coach cannot be reached), after a short wait when slow, and notes every request
function fakeWriter(lines: Array<string | null>, asked: LineRequest[], slow = false): WriteLine {
  // Each request
  return async (request) => {
    // Noted, with a copy of the turns
    asked.push({ ...request, turns: [...request.turns] });
    // A moment's wait, when slow
    if (slow) await new Promise((resolve) => setTimeout(resolve, 20));
    // The next line
    const text = lines.shift() ?? null;
    // A line, ending the conversation when time is up
    return text === null ? null : { text, audio: null, goodbye: request.stage === "end" };
  };
}

// Group the checks about a conversation (decisions 83 and 84)
describe("ConversationScreen", () => {
  // With the coach: Maya at the office party, every line written for it and spoken, your words sent each turn, and a goodbye when time is up
  it("writes each line for the situation, then saves the conversation", async () => {
    // The clock
    const clock = fakeClock();
    // What was said
    const said: string[] = [];
    // What was asked
    const asked: LineRequest[] = [];
    // Where it went next
    const navigate = vi.fn();
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Draw it
    render(<ConversationScreen characterId="maya" services={fakeServices(clock, ["I went climbing on Saturday", "It was great, what about you"], said)} navigate={navigate} writeLine={fakeWriter(["Oh hi! I'm Maya.", "No way! How was it?", "Lovely to meet you!"], asked)} coachReady={() => true} repository={repository} now={NOW} clock={clock.now} />);
    // The situation and what to practise
    expect([(await screen.findByText("At the office party")).tagName, !!screen.getByText(/Maya joined your team two weeks ago/), !!screen.getByRole("button", { name: "Another situation" })]).toEqual(["P", true, true]);
    // Start
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    // Your turn: Done
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    // Her written reply, then your turn again
    await screen.findByRole("heading", { name: "No way! How was it?" });
    // Past three minutes
    clock.advance(180_000);
    // Done again
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    // Saved and opened
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // The saved session
    const [session] = await repository.listSessions();
    // Unlocked within the tap, then her lines, with a listening sound the moment your first turn ended (none after your question; decision 102); the stages, the situation, the turns sent, and what was saved
    expect([said, asked.map((request) => request.stage), [asked[0]?.personaId, asked[0]?.scenarioId, asked[0]?.twist], asked[1]?.turns.map((turn) => turn.text), session?.conversation?.scenarioId, session?.conversation?.turns.map((turn) => turn.text), navigate.mock.calls[0]?.[0]]).toEqual([
      ["(unlocked)", "Oh hi! I'm Maya.", "maya-04", "No way! How was it?", "Lovely to meet you!"],
      ["open", "talk", "end"],
      ["maya", "party", 0],
      ["Oh hi! I'm Maya.", "I went climbing on Saturday"],
      "party",
      ["Oh hi! I'm Maya.", "I went climbing on Saturday", "No way! How was it?", "It was great, what about you", "Lovely to meet you!"],
      `/sessions?id=${session?.id}`,
    ]);
  });

  // Each conversation is in the next situation, and "Another situation" moves on again
  it("moves to a new situation each time", async () => {
    // A repository with one earlier conversation with Maya
    const repository = createRepository(new MemoryStore());
    // Saved
    await repository.saveSession(makeSession({ id: "c0", mode: "conversation", promptId: "maya" }));
    // What was asked
    const asked: LineRequest[] = [];
    // Draw it
    render(<ConversationScreen characterId="maya" services={fakeServices(fakeClock(), [], [])} navigate={() => {}} writeLine={fakeWriter(["Morning!"], asked)} coachReady={() => true} repository={repository} now={NOW} />);
    // The next situation after the party
    const first = (await screen.findByText("Monday at the coffee machine")).textContent;
    // Another
    fireEvent.click(screen.getByRole("button", { name: "Another situation" }));
    // The one after, with its setting
    const second = [(await screen.findByText("Early for a meeting")).textContent, !!screen.getByText(/Maya sits near you at work/)];
    // Start, and the opening is asked for there
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    // Asked
    await waitFor(() => expect(asked.length).toBe(1));
    // Both, and the situation asked for
    expect([first, second, asked[0]?.scenarioId]).toEqual(["Monday at the coffee machine", ["Early for a meeting", true], "meeting"]);
  });

  // A turn not caught gets a written "say that again", kept out of the conversation; if the connection then drops, what was said is saved
  it("asks again when nothing was caught, and saves what was said when the connection drops", async () => {
    // The clock
    const clock = fakeClock();
    // What was said
    const said: string[] = [];
    // What was asked
    const asked: LineRequest[] = [];
    // Where it went next
    const navigate = vi.fn();
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Draw it: an opening, a "say that again", then nothing
    render(<ConversationScreen characterId="theo" services={fakeServices(clock, ["", "Hi, I'm Sam"], said)} navigate={navigate} writeLine={fakeWriter(["Oh. Hey.", "Sorry, what was that?", null], asked, true)} coachReady={() => true} repository={repository} now={NOW} clock={clock.now} listenDelayMs={0} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // Done, with nothing caught
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    // Said so, and your turn again
    expect(await screen.findByText("That wasn’t caught. Say it again, then tap Done.")).toBeTruthy();
    // Done, with words
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    // Saved and opened
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // The saved session
    const [session] = await repository.listSessions();
    // The "say again" request was marked not heard; a listening sound played while waiting; the repeat is not kept
    expect([asked.map((request) => request.heard), said, session?.conversation?.turns.map((turn) => turn.text)]).toEqual([[true, false, true], ["(unlocked)", "Oh. Hey.", "Sorry, what was that?", "theo-04"], ["Oh. Hey.", "Hi, I'm Sam"]]);
  });

  // A turn that starts after time is up ends itself at once; with nothing caught it must say goodbye and save, not ask again forever (each ask a paid line)
  it("says goodbye and saves when a turn starts after time is up, with written lines", async () => {
    // The clock
    const clock = fakeClock();
    // What was asked
    const asked: LineRequest[] = [];
    // Where it went next
    const navigate = vi.fn();
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // A writer with spare lines, so the old loop would run until they ran out
    const writer = fakeWriter(["Oh. Hey.", "Cool.", "Bye then!", "Sorry?", "Pardon?"], asked);
    // The reply to your first turn takes past the time limit
    const slowReply: WriteLine = async (request) => {
      // Time passes while it is written
      if (request.stage === "talk") clock.advance(200_000);
      // The line
      return writer(request);
    };
    // Draw it: your first turn is caught, then nothing more
    render(<ConversationScreen characterId="theo" services={fakeServices(clock, ["Hi, I'm Sam"], [])} navigate={navigate} writeLine={slowReply} coachReady={() => true} repository={repository} now={NOW} clock={clock.now} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // Done, with words
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    // Saved and opened, with no Done tap
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // The saved session
    const [session] = await repository.listSessions();
    // One goodbye asked for (heard, at the end), never "say that again"; the goodbye saved
    expect([asked.map((request) => `${request.stage}:${request.heard}`), session?.conversation?.turns.map((turn) => turn.text)]).toEqual([["open:true", "talk:true", "end:true"], ["Oh. Hey.", "Hi, I'm Sam", "Cool.", "Bye then!"]]);
  });

  // The same with recorded lines: a goodbye line, then saved
  it("says goodbye and saves when a turn starts after time is up, with recorded lines", async () => {
    // The clock
    const clock = fakeClock();
    // What was said
    const said: string[] = [];
    // Where it went next
    const navigate = vi.fn();
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // The usual services
    const services = fakeServices(clock, ["Hi, I'm Sam"], said);
    // Her first scripted line runs past the time limit
    const slowSpeak: RecordingServices["speak"] = async (text, id) => {
      // Time passes
      if (id === "maya-24") clock.advance(200_000);
      // Said as usual
      return services.speak!(text, id);
    };
    // Draw it without the coach
    render(<ConversationScreen characterId="maya" services={{ ...services, speak: slowSpeak }} navigate={navigate} coachReady={() => false} repository={repository} now={NOW} clock={clock.now} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // Done, with words
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    // Saved and opened, with no Done tap
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // The saved session
    const [session] = await repository.listSessions();
    // Her lines: no "say that again", one goodbye, and it saved
    expect([said, session?.conversation?.turns.map((turn) => turn.lineId ?? turn.text)]).toEqual([["maya-01", "maya-24", "maya-07", "maya-37"], ["maya-01", "Hi, I'm Sam", "maya-24", "maya-07", "maya-37"]]);
  });

  // Without the coach: the persona's own situation, recorded lines in the set script, and their recorded line for a turn not caught; End saves what was said
  it("follows the recorded script without the coach", async () => {
    // The clock
    const clock = fakeClock();
    // What was said
    const said: string[] = [];
    // Where it went next
    const navigate = vi.fn();
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Draw it without the coach
    render(<ConversationScreen characterId="maya" services={fakeServices(clock, ["", "Hi, I'm Sam"], said)} navigate={navigate} coachReady={() => false} repository={repository} now={NOW} clock={clock.now} />);
    // Her own situation, no mention of setup words like the passphrase (round 4), and no other situations
    expect([!!(await screen.findByText("At the office party")), /passphrase/i.test(document.body.textContent ?? ""), screen.queryByRole("button", { name: "Another situation" })]).toEqual([true, false, null]);
    // Start
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    // Done, with nothing caught
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    // Said so
    await screen.findByText("That wasn’t caught. Say it again, then tap Done.");
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
    // Her recorded lines, the repeat kept out, and her own situation saved
    expect([said, session?.conversation?.turns.map((turn) => turn.lineId ?? turn.text), session?.conversation?.scenarioId]).toEqual([["maya-01", "maya-36", "maya-24", "maya-07"], ["maya-01", "Hi, I'm Sam", "maya-24", "maya-07"], "party"]);
  });

  // The coach set up but not reached for the opening: back to the start, in the persona's own situation with recorded lines
  it("falls back to recorded lines when the coach cannot be reached", async () => {
    // A repository with one earlier conversation with Maya, so the situation would have moved on
    const repository = createRepository(new MemoryStore());
    // Saved
    await repository.saveSession(makeSession({ id: "c0", mode: "conversation", promptId: "maya" }));
    // What was said
    const said: string[] = [];
    // Draw it with a writer that cannot be reached
    render(<ConversationScreen characterId="maya" services={fakeServices(fakeClock(), [], said)} navigate={() => {}} writeLine={async () => null} coachReady={() => true} repository={repository} now={NOW} />);
    // The moved-on situation
    await screen.findByText("Monday at the coffee machine");
    // Start
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    // Said why, back in her own situation
    expect([!!(await screen.findByText("The coach couldn’t be reached, so Maya will use recorded lines here.")), !!screen.getByText("At the office party")]).toEqual([true, true]);
    // Start again: her second recorded opening
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    // Said
    await waitFor(() => expect(said.at(-1)).toBe("maya-02"));
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
    render(<ConversationScreen characterId="theo" services={fakeServices(clock, [], [])} navigate={navigate} coachReady={() => false} repository={repository} now={NOW} clock={clock.now} />);
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
    render(<ConversationScreen characterId="chris" services={fakeServices(fakeClock(), [], [], false)} navigate={() => {}} coachReady={() => false} repository={createRepository(new MemoryStore())} now={NOW} />);
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
  // Four personas, each with what they are like and how often
  it("lists the four personas with how often each was talked with", async () => {
    // A repository with one talk with Theo
    const repository = createRepository(new MemoryStore());
    // Once
    await repository.saveSession(makeSession({ id: "c1", mode: "conversation", promptId: "theo" }));
    // Draw it
    render(<ConversationsScreen repository={repository} now={NOW} />);
    // The rows
    const rows = within(await screen.findByRole("list", { name: "People to talk with" })).getAllByRole("link");
    // Their addresses, a tagline, and the count
    expect([rows.map((row) => row.getAttribute("href")), !!screen.getByText("Quiet and thoughtful. Opens up to good questions"), !!(await screen.findByText("once"))]).toEqual([["/conversations/talk?id=maya", "/conversations/talk?id=theo", "/conversations/talk?id=chris", "/conversations/talk?id=priya"], true, true]);
  });

  // The results: who and where, the share and questions, the coach's change with one of your lines made better, the whole conversation, and talk again; History names who it was with
  it("shows a saved conversation and names it in History", async () => {
    // A conversation with Theo before the cooking class, reviewed
    const session = makeSession({ id: "c1", mode: "conversation", promptId: "theo", durationSec: 95, feedbackStatus: "done", feedback: { keep: "You asked about the radios.", change: "Pick up his words.", retryCue: "Ask about the last thing he said.", conversation: { yours: "do you like your job", better: "What do you look for at the flea markets?" } }, conversation: { scenarioId: "class", twist: 0, turns: [{ who: "them", text: "Well… I fix up old radios.", seconds: 3 }, { who: "you", text: "oh what kind of radios", seconds: 2 }] } });
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
    expect([!!screen.getByText("With Theo · Before an evening class · 1:35"), headline.textContent, !!screen.getByText("“do you like your job”"), !!screen.getByText("What do you look for at the flea markets?"), turns, screen.getByRole("link", { name: /Talk again/ }).getAttribute("href")]).toEqual([true, "You did 45% of the talking and asked 1 question.", true, true, ["TheoWell… I fix up old radios.", "Youoh what kind of radios"], "/conversations/talk?id=theo"]);
    // Close it
    cleanup();
    // Draw History
    render(<HistoryScreen repository={repository} now={NOW} />);
    // Named by who it was with
    expect(await screen.findByText("Conversation with Theo")).toBeTruthy();
  });
});
