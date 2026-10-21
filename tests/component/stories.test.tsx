// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screens being checked
import { StoriesScreen } from "@/components/screens/StoriesScreen";
import { TellStoryScreen } from "@/components/screens/TellStoryScreen";
import { RecordingScreen } from "@/components/screens/RecordingScreen";
import { SessionScreen } from "@/components/screens/SessionScreen";
// Load the recording contracts
import type { LiveText, RecordingServices } from "@/audio/services";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository, type Repository } from "@/data/repository";
// Load the story prompts
import { STORY_GROUPS, storyPromptForDay } from "@/content/stories";
// Load a sample session builder
import { makeSession } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 21, 18);
// A told story's set-up
const TAKE = { shape: "but-therefore", focus: "dialogue", length: "short" } as const;
// A flat telling
const FLAT = "so basically we went to the shop on the corner and then we bought some bread and came home after";
// A good telling
const GOOD = "the train stopped dead outside Reading at 6 o'clock but then the guard came through and she goes don't worry we'll be moving and I was so relieved since then I always carry a charger";

// Remove drawn screens and fake timers after each check
afterEach(() => {
  // Remove the screen
  cleanup();
  // Back to real timers
  vi.useRealTimers();
});

// A repository holding the given sessions
async function repositoryWith(...sessions: ReturnType<typeof makeSession>[]): Promise<Repository> {
  // An empty one
  const repository = createRepository(new MemoryStore());
  // Each session saved
  for (const session of sessions) await repository.saveSession(session);
  // Handed back
  return repository;
}

// Recording services the check drives by hand: the words heard come back when the take stops
function fakeServices(finalText: string) {
  // The words callback the screen gave
  let onText: (text: LiveText) => void = () => {};
  // The services
  const services: RecordingServices = {
    // Speech is supported
    speechSupported: () => true,
    // A stand-in microphone
    openMicrophone: async () => ({ getTracks: () => [], getAudioTracks: () => [] }) as unknown as MediaStream,
    // A transcriber that hands back the words on stop
    createTranscriber: () => ({ start: (text) => { onText = text; }, stop: async () => finalText }),
    // A capture with a steady level
    createCapture: () => ({ level: () => 0.5, stop: async () => new Blob(["voice"]) }),
  };
  // The services and a way to say words
  return { services, say: (text: LiveText) => act(() => onText(text)) };
}

// Group the checks about the Stories page
describe("StoriesScreen", () => {
  // With nothing told yet: today's story, a line on what will be here, the way to a moment, and the prompts by group
  it("offers today's story, the prompts by group, and says where stories will go", async () => {
    // Draw it empty
    render(<StoriesScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Today's prompt leads to its set-up
    expect((await screen.findAllByRole("link", { name: storyPromptForDay(NOW).text }))[0]!.getAttribute("href")).toBe(`/stories/tell?prompt=${storyPromptForDay(NOW).id}`);
    // Confirm the empty lines and the eight groups
    expect([await screen.findByText("Stories you tell land here, ready to tell again."), screen.getByRole("link", { name: "Record today’s moment" }).getAttribute("href"), STORY_GROUPS.every((group) => screen.getByText(group.name))]).toEqual([expect.anything(), "/session?mode=moment&prompt=moment", true]);
  });

  // The library lists each story by title, how often, the takeaway and "Tell it again" from its latest telling; moment notes offer "Tell it properly"
  it("lists your stories with Tell it again, and your moments to tell properly", async () => {
    // Two tellings of one story, and a moment note
    const repository = await repositoryWith(makeSession({ id: "a", mode: "story", promptId: "sp04", transcript: FLAT, createdAt: "2026-10-19T10:00:00.000Z", story: TAKE }), makeSession({ id: "b", mode: "story", promptId: "sp04", transcript: FLAT, retryOf: "a", createdAt: "2026-10-20T10:00:00.000Z", story: TAKE, feedback: { keep: "k", change: "c", retryCue: "Say her words exactly." }, feedbackStatus: "done" }), makeSession({ id: "m1", mode: "moment", transcript: "the kettle sang at dawn", createdAt: "2026-10-20T08:00:00.000Z" }));
    // Draw it
    render(<StoriesScreen repository={repository} now={NOW} />);
    // The story's row
    const row = within(await screen.findByRole("list", { name: "Your stories" })).getByRole("listitem");
    // Confirm the title, count, takeaway, the retelling's address and the moment's
    expect([within(row).getByText("Running late"), within(row).getByText(/Told twice/), within(row).getByText("Say her words exactly."), within(row).getByRole("link", { name: "Tell “Running late” again" }).getAttribute("href"), screen.getByRole("link", { name: /Tell it properly: the kettle sang at dawn/ }).getAttribute("href")]).toEqual([expect.anything(), expect.anything(), expect.anything(), "/session?mode=story&prompt=sp04&retryOf=b", "/stories/tell?moment=m1"]);
  });

  // A story's title can be changed
  it("renames a story", async () => {
    // One telling
    const repository = await repositoryWith(makeSession({ id: "a", mode: "story", promptId: "sp04", transcript: FLAT, story: TAKE }));
    // Draw it
    render(<StoriesScreen repository={repository} now={NOW} />);
    // Open the field
    fireEvent.click(await screen.findByRole("button", { name: "Rename “Running late”" }));
    // Type a new title
    fireEvent.change(screen.getByLabelText("Story title"), { target: { value: "The night bus" } });
    // Save
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    // Confirm it shows and is saved
    expect([await screen.findByText("The night bus"), (await repository.getStory("sp04"))?.title]).toEqual([expect.anything(), "The night bus"]);
  });

  // A title that cannot be saved says why and keeps the field open (rule T1)
  it("explains when a new title cannot be saved", async () => {
    // A repository whose story saves fail
    const repository = { ...(await repositoryWith(makeSession({ id: "a", mode: "story", promptId: "sp04", transcript: FLAT, story: TAKE }))), saveStory: async () => { throw new Error("disk full"); } };
    // Draw it
    render(<StoriesScreen repository={repository} now={NOW} />);
    // Open, type and save
    fireEvent.click(await screen.findByRole("button", { name: "Rename “Running late”" }));
    // (type)
    fireEvent.change(screen.getByLabelText("Story title"), { target: { value: "New" } });
    // (save)
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    // Confirm the reason and the field still there
    expect([(await screen.findByRole("alert")).textContent?.includes("disk full"), !!screen.getByLabelText("Story title")]).toEqual([true, true]);
  });

  // Stories that cannot be loaded say why, with a way to try again (rule T1)
  it("explains when the stories cannot be loaded", async () => {
    // A repository whose reads fail
    const repository = { ...createRepository(new MemoryStore()), listStories: async () => { throw new Error("The database connection is closing."); } };
    // Draw it
    render(<StoriesScreen repository={repository} now={NOW} />);
    // Confirm the reason and the way to try again
    expect([(await screen.findByRole("alert")).textContent?.includes("The database connection is closing."), !!screen.getByRole("button", { name: "Try again" })]).toEqual([true, true]);
  });
});

// Group the checks about setting up a story
describe("TellStoryScreen", () => {
  // Classic, no focus and full length by default; the choices change the address, and "Under a minute" picks short
  it("sets up the shape, focus and length, and starts with them", async () => {
    // Draw it for a bank prompt
    render(<TellStoryScreen storyId="sp01" repository={createRepository(new MemoryStore())} now={NOW} />);
    // The start band
    const start = () => screen.getByRole("link", { name: /Start/ }).getAttribute("href");
    // The default
    const first = start();
    // Pick a shape and a focus
    fireEvent.click(screen.getByRole("button", { name: /But and so/ }));
    // (focus)
    fireEvent.click(screen.getByRole("button", { name: "Under a minute" }));
    // Confirm the prompt, both addresses, the chosen buttons, and the shape's beats in the preview
    expect([!!screen.getByText(/a plan fell apart/), first, start(), screen.getByRole("button", { name: /Short/ }).getAttribute("aria-pressed"), within(screen.getByRole("region", { name: "Your story's shape" })).getByText("What you wanted").textContent]).toEqual([true, "/session?mode=story&prompt=sp01&shape=classic&length=full", "/session?mode=story&prompt=sp01&shape=but-therefore&focus=minute&length=short", "true", "What you wanted"]);
  });

  // Inside today's practice: short by default, with the step carried on
  it("keeps today's step and starts short inside the plan", async () => {
    // Draw it as step 4
    render(<TellStoryScreen storyId="sp01" planStep={4} repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the address and the way out
    expect([screen.getByRole("link", { name: /Start/ }).getAttribute("href"), screen.getByRole("link", { name: "Close, back to Today" }).getAttribute("href")]).toEqual(["/session?mode=story&prompt=sp01&shape=classic&length=short&plan=4", "/"]);
  });

  // A story from a moment note shows the note's words; a missing note explains instead
  it("shows a moment note's words, or explains when it is gone", async () => {
    // A repository with a moment note
    const repository = await repositoryWith(makeSession({ id: "m1", mode: "moment", transcript: "the kettle sang at dawn" }));
    // Draw it
    render(<TellStoryScreen storyId="moment-m1" repository={repository} now={NOW} />);
    // Confirm the words and the address
    expect([await screen.findByText("the kettle sang at dawn"), screen.getByRole("link", { name: /Start/ }).getAttribute("href")]).toEqual([expect.anything(), "/session?mode=story&prompt=moment-m1&shape=classic&length=full"]);
    // Remove it
    cleanup();
    // Draw one whose note is gone
    render(<TellStoryScreen storyId="moment-gone" repository={repository} now={NOW} />);
    // Confirm the explanation
    expect((await screen.findByRole("alert")).textContent).toContain("This story is not here.");
  });
});

// Group the checks about telling a story
describe("RecordingScreen, stories", () => {
  // The prompt and the shape card show before planning; planning counts down with Ready; Ready records; stopping saves the set-up
  it("plans with the shape in view, then tells and saves the set-up", async () => {
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Fake services that hear a good story
    const fake = fakeServices(GOOD);
    // Where it goes
    const navigate = vi.fn();
    // A clock the check moves
    let time = NOW.getTime();
    // Draw it
    render(<RecordingScreen promptId="sp04" mode="story" retryOf={null} story={TAKE} repository={repository} services={fake.services} clock={() => new Date(time)} navigate={navigate} />);
    // Before planning: the prompt, the shape's beats and focus, and "Plan it"
    expect([!!(await screen.findByText(/running late for something that mattered/)), within(screen.getByRole("region", { name: "Your story's shape" })).getAllByText("But…").length === 2, !!screen.getByText("Add one line of what someone said"), !!screen.getByRole("button", { name: /Plan it/ })]).toEqual([true, true, true, true]);
    // Start planning
    fireEvent.click(screen.getByRole("button", { name: /Plan it/ }));
    // Ready while planning
    fireEvent.click(await screen.findByRole("button", { name: /Ready/ }));
    // Recording, with the timing words and the shape's beats on one line
    await screen.findByRole("button", { name: /Stop/ });
    // The words heard
    await fake.say({ final: GOOD, interim: "" });
    // Confirm the timing light and the compact plan
    expect([!!document.querySelector("[data-signal]"), !!document.querySelector("[data-story-plan='compact']")]).toEqual([true, true]);
    // Forty seconds pass
    time += 40_000;
    // Stop
    fireEvent.click(screen.getByRole("button", { name: /Stop/ }));
    // It opens the take
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // The saved take
    const [saved] = await repository.listSessions();
    // Confirm its kind, story, set-up and record
    expect([saved?.mode, saved?.promptId, saved?.story, (await repository.getStory("sp04"))?.title]).toEqual(["story", "sp04", TAKE, "Running late"]);
  });

  // Telling it again keeps the telling before's set-up, whatever the address says
  it("keeps the set-up of the telling before", async () => {
    // A first telling with its set-up
    const repository = await repositoryWith(makeSession({ id: "a", mode: "story", promptId: "sp04", transcript: FLAT, story: { shape: "then-now", focus: "point", length: "short" }, feedback: { keep: "k", change: "c", retryCue: "End on what changed." }, feedbackStatus: "done" }));
    // Draw a retelling with no set-up in the address
    render(<RecordingScreen promptId="sp04" mode="story" retryOf="a" repository={repository} services={fakeServices(GOOD).services} clock={() => NOW} navigate={() => {}} />);
    // Confirm the shape and focus from the first telling, and the cue to carry in
    expect([!!(await screen.findByText("How it was before")), !!screen.getByText("End on the point"), !!screen.getByText("End on what changed.")]).toEqual([true, true, true]);
  });
});

// Group the checks about a story's results
describe("SessionScreen, stories", () => {
  // A first telling: the prompt, What I heard with honest wording, the change from the checks, and Tell it again
  it("shows what was heard, the change and Tell it again", async () => {
    // A flat telling with no coach yet
    const repository = await repositoryWith(makeSession({ id: "a", mode: "story", promptId: "sp04", transcript: FLAT, durationSec: 50, story: TAKE, feedbackStatus: "failed" }));
    // Draw it
    render(<SessionScreen sessionId="a" repository={repository} now={NOW} />);
    // The checklist
    const list = await screen.findByRole("list", { name: "What I heard" });
    // Confirm the prompt, six unticked lines, the lead-in named, the rough-guess line, the focus-first change, and the retelling's address
    expect([!!screen.getByText(/running late for something that mattered/), within(list).getAllByRole("listitem").map((item) => item.getAttribute("data-heard")), !!within(list).getByText("Opened with “so basically”."), !!screen.getByText(/Rough guesses/), !!screen.getAllByText("Say one line the way they said it.").length, screen.getByRole("link", { name: /Tell it again/ }).getAttribute("href")]).toEqual([true, ["false", "false", "false", "false", "false", "false"], true, true, true, "/session?mode=story&prompt=sp04&retryOf=a"]);
  });

  // With the coach: your line and how it could sound, and the beats it heard
  it("shows the coach's line and beats", async () => {
    // A telling with story feedback
    const repository = await repositoryWith(makeSession({ id: "a", mode: "story", promptId: "sp04", transcript: GOOD, story: TAKE, feedbackStatus: "done", feedback: { keep: "You opened in the action.", change: "Give her words a moment.", retryCue: "Slow down at her words.", story: { beats: [{ beat: "setting", quote: "outside Reading" }, { beat: "turn", quote: "but then" }], yours: "she goes don't worry", better: "Then she leans in: “Don't worry.” [how you felt]" } } }));
    // Draw it
    render(<SessionScreen sessionId="a" repository={repository} now={NOW} />);
    // The beats
    const beats = await screen.findByRole("region", { name: "The beats" });
    // Confirm the line, the gap set apart, and the beats heard and not
    expect([!!screen.getByText("“she goes don't worry”"), screen.getByText("[how you felt]").tagName, within(beats).getByText(/2 of 5/).textContent, beats.querySelector("[data-beat='stakes']")?.textContent]).toEqual([true, "EM", "The beats the coach heard · 2 of 5", "What was at stake: not heard"]);
  });

  // A retelling: how it compared, what it worked on, and each check last time and this time
  it("shows a retelling beside the telling before", async () => {
    // A flat first telling and a good retelling
    const repository = await repositoryWith(makeSession({ id: "a", mode: "story", promptId: "sp04", transcript: FLAT, createdAt: "2026-10-21T10:00:00.000Z", story: TAKE, feedback: { keep: "k", change: "c", retryCue: "Start in the middle." }, feedbackStatus: "done" }), makeSession({ id: "b", mode: "story", promptId: "sp04", retryOf: "a", transcript: GOOD, createdAt: "2026-10-21T10:05:00.000Z", story: TAKE, feedbackStatus: "failed" }));
    // Draw the retelling
    render(<SessionScreen sessionId="b" repository={repository} now={NOW} />);
    // The table
    const table = await screen.findByRole("table", { name: "Last time and this time" });
    // The first row
    const first = within(table).getAllByRole("row")[1]!;
    // Confirm the headline, the cue, and the first check on both
    expect([!!screen.getByRole("heading", { name: "6 of 6 this time, up from 0." }), !!screen.getByText("You were working on: Start in the middle."), within(first).getAllByRole("cell").map((cell) => cell.textContent)]).toEqual([true, true, ["–", "Heard"]]);
  });
});
