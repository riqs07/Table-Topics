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
import { STORY_GROUPS, findStoryTemplate, storyPromptForDay, suggestedTemplate } from "@/content/stories";
// Load a sample session builder
import { makeSession } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 21, 18);
// A told story's set-up: a client win, with a Learn card's focus carried in (decision 126)
const TAKE = { template: "client-win", focus: "dialogue", length: "short" } as const;
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

  // Today's story with its suggested template and Tell it, then the four templates, each starting today's story with it (decision 126)
  it("offers today's story with its suggested template, and the templates", async () => {
    // Draw it
    render(<StoriesScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Today's card
    const today = await screen.findByRole("region", { name: "Today’s story" });
    // The templates
    const templates = within(screen.getByRole("list", { name: "Templates" })).getAllByRole("link").map((link) => link.getAttribute("href"));
    // Confirm the suggestion, Tell it, and the four templates' addresses
    expect([within(today).getByText(/^Suggested template: /).textContent, within(today).getByRole("link", { name: "Tell it" }).getAttribute("href"), templates]).toEqual([`Suggested template: ${findStoryTemplate(suggestedTemplate(storyPromptForDay(NOW).id)).name}`, `/stories/tell?prompt=${storyPromptForDay(NOW).id}`, ["lesson", "client-win", "turning-point", "funny"].map((id) => `/stories/tell?prompt=${storyPromptForDay(NOW).id}&template=${id}`)]);
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
    expect([within(row).getByText("Running late"), within(row).getByText(/Client win · Told twice/), within(row).getByText("Say her words exactly."), within(row).getByRole("link", { name: "Tell “Running late” again" }).getAttribute("href"), screen.getByRole("link", { name: /Tell it properly: the kettle sang at dawn/ }).getAttribute("href")]).toEqual([expect.anything(), expect.anything(), expect.anything(), "/session?mode=story&prompt=sp04&retryOf=b", "/stories/tell?moment=m1"]);
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
  // The template suggested for the prompt and full length by default, its beats and a worked example shown; the choices change the address (decision 126)
  it("sets up the template and length, and starts with them", async () => {
    // Draw it for a bank prompt (something that went wrong suggests a lesson learned)
    render(<TellStoryScreen storyId="sp01" repository={createRepository(new MemoryStore())} now={NOW} />);
    // The start band
    const start = () => screen.getByRole("link", { name: /Start/ }).getAttribute("href");
    // The default, with the suggested template chosen
    const [first, suggested] = [start(), screen.getByRole("button", { name: /Lesson learned/ })];
    // Pick another template and the short length
    fireEvent.click(screen.getByRole("button", { name: /Client win/ }));
    // (length)
    fireEvent.click(screen.getByRole("button", { name: /Short/ }));
    // Confirm the prompt, the suggestion, both addresses, the chosen button, the example of the chosen template, and no shapes, focuses or 4/3/2 switch
    expect([!!screen.getByText(/a plan fell apart/), suggested.getAttribute("aria-pressed"), first, start(), screen.getByRole("button", { name: /Client win/ }).getAttribute("aria-pressed"), within(screen.getByRole("region", { name: "Example: Client win" })).getByText("(the result, with a number)").tagName, screen.queryByRole("button", { name: /But and so/ }), screen.queryByRole("button", { name: "Under a minute" }), screen.queryByRole("checkbox")]).toEqual([true, "false", "/session?mode=story&prompt=sp01&template=lesson&length=full", "/session?mode=story&prompt=sp01&template=client-win&length=short", "true", "B", null, null, null]);
  });

  // A link can start on a template (from the Stories page), and a Learn card's focus is carried in (decision 94); "Under a minute" starts short
  it("starts on the template a link names, carrying a Learn card's focus", async () => {
    // Draw it as a link would
    render(<TellStoryScreen storyId="sp04" initialTemplate="turning-point" initialFocus="minute" repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the chosen template and the address that starts the telling
    expect([screen.getByRole("button", { name: /Turning point/ }).getAttribute("aria-pressed"), screen.getByRole("link", { name: /Start/ }).getAttribute("href")]).toEqual(["true", "/session?mode=story&prompt=sp04&template=turning-point&focus=minute&length=short"]);
  });

  // Inside today's practice: short by default, with the step carried on
  it("keeps today's step and starts short inside the plan", async () => {
    // Draw it as step 4
    render(<TellStoryScreen storyId="sp01" planStep={4} repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the address and the way out
    expect([screen.getByRole("link", { name: /Start/ }).getAttribute("href"), screen.getByRole("link", { name: "Close, back to Today" }).getAttribute("href")]).toEqual(["/session?mode=story&prompt=sp01&template=lesson&length=short&plan=4", "/"]);
  });

  // A story from a moment note shows the note's words; a missing note explains instead
  it("shows a moment note's words, or explains when it is gone", async () => {
    // A repository with a moment note
    const repository = await repositoryWith(makeSession({ id: "m1", mode: "moment", transcript: "the kettle sang at dawn" }));
    // Draw it
    render(<TellStoryScreen storyId="moment-m1" repository={repository} now={NOW} />);
    // Confirm the words and the address
    expect([await screen.findByText("the kettle sang at dawn"), screen.getByRole("link", { name: /Start/ }).getAttribute("href")]).toEqual([expect.anything(), "/session?mode=story&prompt=moment-m1&template=lesson&length=full"]);
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
  // The prompt, the template's beats and the three pointers show before planning; planning counts down with Ready; Ready records; stopping saves the set-up (decision 126)
  it("plans with the template's beats in view, then tells and saves the set-up", async () => {
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
    // Before planning: the prompt, the template's beats and the focus carried in, the pointers, and "Plan it"
    expect([!!(await screen.findByText(/running late for something that mattered/)), !!within(screen.getByRole("region", { name: "Your beats" })).getByText("The result, with a number"), !!screen.getByText("Add one line of what someone said"), !!within(screen.getByRole("region", { name: "Three things every good story does" })).getByText("End on the point."), !!screen.getByRole("button", { name: /Plan it/ }), screen.queryByRole("link", { name: /Tell it three times/ })]).toEqual([true, true, true, true, true, null]);
    // Start planning
    fireEvent.click(screen.getByRole("button", { name: /Plan it/ }));
    // Ready while planning
    fireEvent.click(await screen.findByRole("button", { name: /Ready/ }));
    // Recording, with the timing words and the template's beats in view
    await screen.findByRole("button", { name: /Stop/ });
    // The words heard
    await fake.say({ final: GOOD, interim: "" });
    // Confirm the timing light, the switch on, and the template's beats shown (decision 130)
    expect([!!document.querySelector("[data-signal]"), (screen.getByRole("checkbox", { name: "Show the template" }) as HTMLInputElement).checked, !!within(screen.getByRole("region", { name: "Your beats" })).getByText("The result, with a number")]).toEqual([true, true, true]);
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

  // While telling, the template can be hidden for someone who tells without it, and the choice is remembered for the next story (decision 130)
  it("hides the template while telling when switched off, and remembers it", async () => {
    // Start with nothing saved
    localStorage.removeItem("voicelab-story-template");
    // Draw a story
    render(<RecordingScreen promptId="sp04" mode="story" retryOf={null} story={TAKE} repository={createRepository(new MemoryStore())} services={fakeServices(GOOD).services} clock={() => NOW} navigate={() => {}} />);
    // Plan, then Ready
    fireEvent.click(await screen.findByRole("button", { name: /Plan it/ }));
    // (ready)
    fireEvent.click(await screen.findByRole("button", { name: /Ready/ }));
    // Recording
    await screen.findByRole("button", { name: /Stop/ });
    // Switch the template off
    fireEvent.click(screen.getByRole("checkbox", { name: "Show the template" }));
    // What shows now, and what is stored
    const hidden = [screen.queryByRole("region", { name: "Your beats" }), localStorage.getItem("voicelab-story-template")];
    // Clear the screen
    cleanup();
    // The next story
    render(<RecordingScreen promptId="sp01" mode="story" retryOf={null} story={TAKE} repository={createRepository(new MemoryStore())} services={fakeServices(GOOD).services} clock={() => NOW} navigate={() => {}} />);
    // Plan, then Ready
    fireEvent.click(await screen.findByRole("button", { name: /Plan it/ }));
    // (ready)
    fireEvent.click(await screen.findByRole("button", { name: /Ready/ }));
    // Recording
    await screen.findByRole("button", { name: /Stop/ });
    // Confirm hidden and saved, then still off with no beats on the next story
    expect([hidden, (screen.getByRole("checkbox", { name: "Show the template" }) as HTMLInputElement).checked, screen.queryByRole("region", { name: "Your beats" })]).toEqual([[null, "off"], false, null]);
    // Clear it for other checks
    localStorage.removeItem("voicelab-story-template");
  });

  // Telling it again keeps the telling before's set-up, whatever the address says (here an older story told with a shape, which still reads)
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
  // A first telling before the coach answers: the prompt, a plain headline, no rough checklist or beats, the change from the numbers, and Tell it again (decision 126)
  it("shows the telling, the change and Tell it again, with no checklist", async () => {
    // A flat telling with no coach
    const repository = await repositoryWith(makeSession({ id: "a", mode: "story", promptId: "sp04", transcript: FLAT, durationSec: 50, story: TAKE, feedbackStatus: "failed" }));
    // Draw it
    render(<SessionScreen sessionId="a" repository={repository} now={NOW} />);
    // Confirm the prompt, the headline, no checklist, rough-guess line or beats card, and the retelling's address
    expect([!!(await screen.findByText(/running late for something that mattered/)), screen.getByRole("heading", { level: 1 }).textContent, screen.queryByRole("list", { name: "What I heard" }), screen.queryByText(/Rough guesses/), document.querySelector("[data-your-beats]"), screen.getByRole("link", { name: /Tell it again/ }).getAttribute("href")]).toEqual([true, "Your story.", null, null, null, "/session?mode=story&prompt=sp04&retryOf=a"]);
  });

  // With the coach: what worked at the top, your line and how it could sound, and each beat of the template strong, weak or missing (decision 126)
  it("shows what worked, your line and your beats", async () => {
    // A telling with story feedback on a client win
    const repository = await repositoryWith(makeSession({ id: "a", mode: "story", promptId: "sp04", transcript: GOOD, story: TAKE, feedbackStatus: "done", feedback: { keep: "You opened in the action.", change: "Give her words a moment.", retryCue: "Slow down at her words.", story: { beats: [], templateBeats: [{ beat: "problem", status: "strong", quote: "the train stopped dead" }, { beat: "tried", status: "weak", quote: "but then" }, { beat: "result", status: "missing", quote: "" }, { beat: "matters", status: "strong", quote: "since then I always carry a charger" }], yours: "she goes don't worry", better: "Then she leans in: “Don't worry.” [how you felt]" } } }));
    // Draw it
    render(<SessionScreen sessionId="a" repository={repository} now={NOW} />);
    // The beats
    const beats = await screen.findByRole("region", { name: /Your beats/ });
    // Confirm the headline, what worked at the top (and not again at the bottom), the line and its gap, and each beat's status and quote
    expect([screen.getByRole("heading", { level: 1 }).textContent, document.querySelector("[data-story-worked]")?.textContent, screen.queryByText("What to keep."), !!screen.getByText("“she goes don't worry”"), screen.getByText("[how you felt]").tagName, [...beats.querySelectorAll("[data-beat]")].map((item) => `${item.getAttribute("data-beat")} ${item.getAttribute("data-status")}`), !!within(beats).getByText("“the train stopped dead”"), within(beats).getByRole("heading").textContent]).toEqual(["2 of 4 beats came through clearly.", "What workedYou opened in the action.", null, true, "EM", ["problem strong", "tried weak", "result missing", "matters strong"], true, "Your beats · Client win"]);
  });

  // A retelling: how it compared, what it worked on, and the beats that came through last time and this time
  it("shows a retelling beside the telling before", async () => {
    // The beats as a status list
    const beats = (statuses: ReadonlyArray<"strong" | "weak" | "missing">) => ["problem", "tried", "result", "matters"].map((beat, index) => ({ beat, status: statuses[index]!, quote: statuses[index] === "missing" ? "" : "words" }));
    // A first telling and a clearer retelling
    const repository = await repositoryWith(makeSession({ id: "a", mode: "story", promptId: "sp04", transcript: FLAT, createdAt: "2026-10-21T10:00:00.000Z", story: TAKE, feedback: { keep: "k", change: "c", retryCue: "Start in the middle.", story: { beats: [], templateBeats: beats(["strong", "missing", "missing", "weak"]), yours: "y", better: "b" } }, feedbackStatus: "done" }), makeSession({ id: "b", mode: "story", promptId: "sp04", retryOf: "a", transcript: GOOD, createdAt: "2026-10-21T10:05:00.000Z", story: TAKE, feedback: { keep: "k", change: "c", retryCue: "r", story: { beats: [], templateBeats: beats(["strong", "strong", "weak", "strong"]), yours: "y", better: "b" } }, feedbackStatus: "done" }));
    // Draw the retelling
    render(<SessionScreen sessionId="b" repository={repository} now={NOW} />);
    // The table
    const table = await screen.findByRole("table", { name: "Last time and this time" });
    // The first row
    const first = within(table).getAllByRole("row")[1]!;
    // Confirm the headline, the cue, and the beats on both
    expect([!!screen.getByRole("heading", { name: "It landed better than last time." }), !!screen.getByText("You were working on: Start in the middle."), within(first).getAllByRole("cell").map((cell) => cell.textContent)]).toEqual([true, true, ["1 of 4", "3 of 4"]]);
  });
});

// A flat telling of the zoo: just the facts, read back
const ZOO_FLAT = "I went to the zoo and then I got a hot dog and then I saw a gorilla and the gorilla was staring right at me";
// A lively telling of the zoo that leaves out the gorilla fact's own line
const ZOO_ALIVE = "The hot dog was sticky with mustard at the zoo on Saturday but the gorilla was staring right at me and she goes don't move and I was terrified and since then I always eat first";
// The zoo's set-up
const ZOO_TAKE = { shape: "classic", focus: "middle", length: "short" } as const;

// Group the checks about guided stories (decision 93)
describe("guided stories", () => {
  // The Stories page lists them in two folds, with the honest line, each leading to its set-up
  it("offers guided stories on the Stories page", async () => {
    // Draw it
    render(<StoriesScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // The section
    const section = (await screen.findByRole("heading", { name: "Guided stories" })).closest("section") as HTMLElement;
    // Confirm the line, the two folds, and the zoo's address
    expect([!!within(section).getByText("You get the facts. You make it a story."), !!within(section).getByText("Just the facts"), !!within(section).getByText("With a twist"), within(section).getByRole("link", { name: "A day at the zoo" }).getAttribute("href")]).toEqual([true, true, true, "/stories/tell?prompt=gs13"]);
  });

  // The set-up shows the facts, the twist and the nudges, carries the story's own focus, and lets the user pick a template (decision 126)
  it("sets up a guided story with its facts, its own focus and a template", () => {
    // Draw it for the zoo
    render(<TellStoryScreen storyId="gs13" repository={createRepository(new MemoryStore())} now={NOW} />);
    // The facts card
    const card = screen.getByRole("region", { name: "Your facts" });
    // The start address before and after changing the focus
    const first = screen.getByRole("link", { name: /Start/ }).getAttribute("href");
    // Pick another template
    fireEvent.click(screen.getByRole("button", { name: /Funny moment/ }));
    // Confirm the title, a fact, the twist, a nudge, no separate beats card, the default address with the story's focus, the changed one, and the template named on the card
    expect([screen.getByRole("heading", { level: 1 }).textContent, !!within(card).getByText("You got a hot dog."), card.querySelector("[data-twist]")?.textContent, !!within(card).getByText("What did the gorilla do?"), screen.queryByRole("region", { name: "Your beats" }), first, screen.getByRole("link", { name: /Start/ }).getAttribute("href"), within(card).getByText("Funny moment").textContent]).toEqual(["A day at the zoo", true, "TwistThe gorilla was staring right at you.", true, null, "/session?mode=story&prompt=gs13&template=lesson&focus=middle&length=full", "/session?mode=story&prompt=gs13&template=funny&focus=middle&length=full", "Funny moment"]);
  });

  // While planning the facts card shows in place of the shape card; while telling too, under a switch (decision 130)
  it("keeps the facts in view while planning and telling", async () => {
    // Fake services
    const fake = fakeServices(ZOO_ALIVE);
    // Draw the telling page
    render(<RecordingScreen promptId="gs13" mode="story" retryOf={null} story={ZOO_TAKE} repository={createRepository(new MemoryStore())} services={fake.services} clock={() => NOW} navigate={() => {}} />);
    // Before planning: the title, the facts card, no shape card
    expect([!!(await screen.findByText("A day at the zoo")), !!screen.getByText("Guided story"), !!within(screen.getByRole("region", { name: "Your facts" })).getByText("You saw a gorilla."), screen.queryByRole("region", { name: "Your beats" })]).toEqual([true, true, true, null]);
    // Plan, then Ready
    fireEvent.click(screen.getByRole("button", { name: /Plan it/ }));
    // (ready)
    fireEvent.click(await screen.findByRole("button", { name: /Ready/ }));
    // Recording
    await screen.findByRole("button", { name: /Stop/ });
    // Confirm the switch says facts, and the facts are in view
    expect([(screen.getByRole("checkbox", { name: "Show the facts" }) as HTMLInputElement).checked, !!within(screen.getByRole("region", { name: "Your facts" })).getByText("You got a hot dog.")]).toEqual([true, true]);
  });

  // The results show what was added beyond the facts, any fact missed, and the coach's word on bringing them to life
  it("shows what you added, the facts missed, and the coach's verdict", async () => {
    // A flat telling that leaves out a fact, and a coached one
    const repository = await repositoryWith(makeSession({ id: "g1", mode: "story", promptId: "gs13", transcript: "I went to the zoo and then I got a hot dog and then I went home after that", durationSec: 40, story: ZOO_TAKE, feedbackStatus: "failed" }), makeSession({ id: "g2", mode: "story", promptId: "gs13", transcript: ZOO_ALIVE, durationSec: 50, story: ZOO_TAKE, feedbackStatus: "done", feedback: { keep: "k", change: "c", retryCue: "r", story: { beats: [], yours: "y", better: "b", broughtToLife: "You added the mustard and your fear; the hot dog is still flat." } } }));
    // Draw the flat one
    render(<SessionScreen sessionId="g1" repository={repository} now={NOW} />);
    // Its added list
    const list = await screen.findByRole("list", { name: "What you added" });
    // Confirm the heading, the label, nothing added, the facts count and the missing gorilla
    expect([screen.getByRole("heading", { name: "What you added" }).tagName, !!screen.getByText("Your guided story"), within(list).getAllByRole("listitem").map((item) => item.getAttribute("data-added")), within(screen.getByRole("region", { name: "The facts" })).getByText(/2 of 4 heard/).textContent, document.querySelectorAll("[data-fact-missing]").length, screen.queryByRole("list", { name: "What I heard" })]).toEqual(["H1", true, ["false", "false", "false", "false", "false"], "The facts · 2 of 4 heard", 2, null]);
    // Remove it
    cleanup();
    // Draw the coached one
    render(<SessionScreen sessionId="g2" repository={repository} now={NOW} />);
    // Confirm everything added, every fact in, and the coach's verdict
    expect([(await screen.findByRole("list", { name: "What you added" })).querySelectorAll("[data-added=true]").length, !!screen.getByText("Every fact made it in."), document.querySelector("[data-brought-to-life]")?.textContent?.includes("You added the mustard")]).toEqual([5, true, true]);
  });

  // Telling it again compares what was added and the facts kept on both tellings
  it("compares a retold guided story by what was added", async () => {
    // A flat first telling and a lively retelling
    const repository = await repositoryWith(makeSession({ id: "g1", mode: "story", promptId: "gs13", transcript: ZOO_FLAT, createdAt: "2026-10-21T10:00:00.000Z", story: ZOO_TAKE, feedback: { keep: "k", change: "c", retryCue: "Add one thing they can picture." }, feedbackStatus: "done" }), makeSession({ id: "g2", mode: "story", promptId: "gs13", retryOf: "g1", transcript: ZOO_ALIVE, createdAt: "2026-10-21T10:05:00.000Z", story: ZOO_TAKE, feedbackStatus: "failed" }));
    // Draw the retelling
    render(<SessionScreen sessionId="g2" repository={repository} now={NOW} />);
    // The table
    const table = await screen.findByRole("table", { name: "Last time and this time" });
    // The facts row
    const facts = within(table).getAllByRole("row").find((row) => row.textContent?.includes("Facts kept"))!;
    // Confirm the headline, the facts on both, and Tell it again's address
    expect([!!screen.getByRole("heading", { name: "You added 5 of 5 this time, up from 0." }), within(facts).getAllByRole("cell").map((cell) => cell.textContent), screen.getByRole("link", { name: /Tell it again/ }).getAttribute("href")]).toEqual([true, ["4 of 4", "4 of 4"], "/session?mode=story&prompt=gs13&retryOf=g2"]);
  });
});
