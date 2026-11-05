// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screens being checked
import { PracticeScreen } from "@/components/screens/PracticeScreen";
import { PracticeWaysScreen } from "@/components/screens/PracticeWaysScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the day's pickers
import { promptForDay, tableTopicForDay } from "@/content/prompts";
// Load today's story prompt (decision 92)
import { NEEDED_TYPES, neededPromptForDay, storyPromptForDay } from "@/content/stories";
// Load today's Story dice (decision 153)
import { connectStoryForDay } from "@/content/guidedStories";
// Load the small-talk lessons and units (decision 95)
import { SMALL_TALK_LESSONS, UNITS } from "@/content/smallTalk";
// Load a sample session builder
import { makeSession, makeTalk } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 15, 10);

// Remove the drawn screen after each check
afterEach(cleanup);

// A list's rows as [name, address]
function rowsOf(list: HTMLElement): Array<[string | null | undefined, string | null]> {
  // Each link's name and address
  return within(list).getAllByRole("link").map((link) => [link.querySelector(".font-display")?.textContent, link.getAttribute("href")]);
}

// Draw one job's list and read its rows
async function jobRows(job: string, repository = createRepository(new MemoryStore())): Promise<Array<[string | null | undefined, string | null]>> {
  // Draw the list
  render(<PracticeWaysScreen job={job} repository={repository} now={NOW} />);
  // Its rows
  return rowsOf(await screen.findByRole("list", { name: "Ways to practise" }));
}

// Group the checks about the Practice page
describe("PracticeScreen", () => {
  // Second design pass: one quick start (Rapid Fire), then four jobs with pictures, each opening its list of ways
  it("shows Rapid Fire as the quick start, then the four jobs", async () => {
    // Draw the page
    render(<PracticeScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // The jobs' cards, once drawn
    const jobs = rowsOf(await screen.findByRole("list", { name: "Jobs" }));
    // The quick start
    const quick = document.querySelector("[data-way-card='big']") as HTMLElement;
    // Confirm the quick start leads to today's surprise question with its tile, and the four jobs in their usual order
    expect([quick.getAttribute("href"), quick.querySelector("[data-scene]")?.getAttribute("data-scene"), within(quick).getByText("Quick start · 1–2 min").textContent, jobs]).toEqual([`/session?mode=talk&prompt=${tableTopicForDay(NOW, 1).id}`, "rapid-fire", "Quick start · 1–2 min", [["Speak on the spot", "/practice/ways?job=on-the-spot"], ["Tell stories", "/practice/ways?job=stories"], ["Conversations", "/practice/ways?job=conversation"], ["Your voice", "/practice/ways?job=voice"]]]);
  });

  // Each job card says how many ways its list holds, so the card and the list always agree
  it("counts each job's ways on its card", async () => {
    // Draw the page
    render(<PracticeScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // The stories card
    const stories = within(await screen.findByRole("list", { name: "Jobs" })).getByRole("link", { name: /^Tell stories/ });
    // Confirm the count of the stories list (four, the four you'll need, Story dice and every story) and the first names
    expect(stories.textContent).toContain(`${4 + NEEDED_TYPES.length + 2} ways · Today’s story, Tell one again, Guided stories…`);
  });

  // The role plays are small tile cards, with "All" leading to their whole list
  it("shows the role plays, with a way to all of them", async () => {
    // Draw the page
    render(<PracticeScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // The cards
    const cards = rowsOf(await screen.findByRole("list", { name: "Role plays" }));
    // The way to all of them
    const all = screen.getByRole("link", { name: /^All \d+ role plays$/ });
    // Confirm the four cards and where "All" leads, with the count of the whole list (four ways and every small-talk unit)
    expect([cards, all.getAttribute("href"), all.textContent]).toEqual([[["Talk with someone", "/conversations"], ["Scenes", "/scenes"], ["Active listening", "/listening"], ["Quick scenarios", "/learn/scenarios"]], "/practice/ways?job=role-play", `All ${4 + UNITS.length} role plays`]);
  });

  // The courses have their own tab now, so Practice shows none (decision 148)
  it("leaves the courses to their own tab", async () => {
    // A repository with a focus, so a course would have been offered before
    const repository = createRepository(new MemoryStore());
    // The focus
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), practiceFocus: ["stories"] });
    // Draw the page
    render(<PracticeScreen repository={repository} now={NOW} />);
    // Wait for the jobs
    await screen.findByRole("list", { name: "Jobs" });
    // Confirm no course cards and no Courses heading on the page
    expect([document.querySelectorAll("main a[href^='/courses/course']").length, screen.queryByRole("heading", { name: "Courses" })]).toEqual([0, null]);
  });

  // With a focus, its job comes first and says so (decision 97)
  it("puts the focus's job first, marked", async () => {
    // A repository with two areas picked
    const repository = createRepository(new MemoryStore());
    // How I sound and a talk coming up
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), practiceFocus: ["voice", "talk"] });
    // Draw the page
    render(<PracticeScreen repository={repository} now={NOW} />);
    // Wait for the order to follow the focus
    await waitFor(() => expect(rowsOf(screen.getByRole("list", { name: "Jobs" }))[0]?.[0]).toBe("Your voice"));
    // The cards' names and marks
    const cards = within(screen.getByRole("list", { name: "Jobs" })).getAllByRole("link").map((link) => [link.querySelector(".font-display")?.textContent, !!within(link).queryByText("Your focus")]);
    // Confirm the focus's two first and marked, then the others
    expect(cards).toEqual([["Your voice", true], ["Speak on the spot", true], ["Tell stories", false], ["Conversations", false]]);
  });

  // This week's challenge off the page lives here, and ticking it saves it as done
  it("marks the weekly challenge done", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Draw the page
    render(<PracticeScreen repository={repository} now={NOW} />);
    // Tick the challenge
    fireEvent.click(await screen.findByRole("checkbox"));
    // Confirm it is saved with a completion time, and shows as ticked
    await waitFor(async () => expect([(await repository.listChallenges())[0]?.completedAt, (screen.getByRole("checkbox") as HTMLInputElement).checked]).toEqual([NOW.toISOString(), true]));
  });

  // Q&A practice is removed (decision 61): no row, even after a prepared speech
  it("does not offer Q&A practice", async () => {
    // A repository with a prepared speech
    const repository = createRepository(new MemoryStore());
    // Save it
    await repository.saveSession(makeSession({ id: "r1", mode: "response" }));
    // Draw the page
    render(<PracticeScreen repository={repository} now={NOW} />);
    // Wait for the page to draw
    await screen.findByRole("list", { name: "Jobs" });
    // Confirm there is no Q&A row
    expect(screen.queryByText(/Q&A/)).toBeNull();
  });
});

// Group the checks about one job's list of ways
describe("PracticeWaysScreen", () => {
  // Speaking on the spot: Rapid Fire, a prepared speech, reading aloud (decision 93), 4/3/2 (decision 126), free talk and the short speech (decision 73), with no openings drill (decision 106) and no lessons (decision 107)
  it("lists every way to speak on the spot", async () => {
    // The rows
    const rows = await jobRows("on-the-spot");
    // Confirm them, and no openings drill or lesson anywhere
    expect([rows, screen.queryByText("Openings and closings"), screen.queryAllByRole("link").some((link) => link.getAttribute("href") === "/bookends" || link.getAttribute("href")?.includes("mode=lesson"))]).toEqual([[["Rapid Fire", `/session?mode=talk&prompt=${tableTopicForDay(NOW, 1).id}`], ["Prepared speech", `/session?mode=response&prompt=${promptForDay(NOW, 1).id}`], ["Read aloud", "/skills"], ["4/3/2", "/practice/four-three-two"], ["Free talk", "/session?mode=free&prompt=free"], ["Short speech", "/practice/outline"]], null, false]);
  });

  // Telling stories: today's story, telling one again, guided stories, the moments, the four stories you'll need (each today's prompt of its kind), Story dice and every story (decisions 92, 152 to 154)
  it("lists every way to tell stories, with the stories you'll need and Story dice", async () => {
    // The rows
    const rows = await jobRows("stories");
    // Confirm them
    expect(rows).toEqual([["Today’s story", `/stories/tell?prompt=${storyPromptForDay(NOW).id}`], ["Tell one again", "/stories#your-stories"], ["Guided stories", "/stories#guided-stories"], ["From your moments", "/stories#from-moments"], ...NEEDED_TYPES.map((type) => [type.name, `/stories/tell?prompt=${neededPromptForDay(type.group, NOW).id}`]), ["Story dice", `/stories/tell?prompt=${connectStoryForDay(NOW).id}`], ["All stories", "/stories"]]);
  });

  // Everyday conversation: a whole conversation, Scenes and Active listening first (decisions 149 and 150), then the next unit, the moment note and every unit
  it("lists the conversation ways, with the next unit", async () => {
    // The rows
    const rows = await jobRows("conversation");
    // Confirm them (the first unit until the sessions are read)
    expect(rows).toEqual([["Talk with someone", "/conversations"], ["Scenes", "/scenes"], ["Active listening", "/listening"], ["Answering", "/small-talk/unit?id=answering"], ["One moment a day", expect.stringContaining("/session?mode=moment")], ["Small talk", "/small-talk"]]);
  });

  // The conversation list's unit is the next one (decision 95): once the first four units' lessons are done, Reading the room and its first lesson
  it("shows the next conversation unit, with its next lesson", async () => {
    // A repository with every lesson of the first four units answered
    const repository = createRepository(new MemoryStore());
    // Save one answer per lesson
    for (const lesson of SMALL_TALK_LESSONS.filter((item) => ["answering", "asking", "listening", "news"].includes(item.unit))) await repository.saveSession(makeSession({ id: lesson.id, mode: "smalltalk", promptId: lesson.id }));
    // Draw the list
    render(<PracticeWaysScreen job="conversation" repository={repository} now={NOW} />);
    // The unit's row, once the answers are read
    const row = await screen.findByRole("link", { name: /^Reading the room/ });
    // Confirm where it leads and what it says next
    expect([row.getAttribute("href"), row.textContent?.includes("Next: lesson 1, Notice changes, not signals")]).toEqual(["/small-talk/unit?id=room", true]);
  });

  // The voice list shows what is next: the modes done least come first, so a done mode moves down (decision 108)
  it("puts the voice modes done least first", async () => {
    // A repository with clear sounds and volume each done once
    const repository = createRepository(new MemoryStore());
    // A clear-sounds drill
    await repository.saveSession(makeSession({ id: "c", mode: "voice", promptId: "c01" }));
    // A volume drill
    await repository.saveSession(makeSession({ id: "v", mode: "voice", promptId: "v01" }));
    // Draw the list
    render(<PracticeWaysScreen job="voice" repository={repository} now={NOW} />);
    // The list
    const list = await screen.findByRole("list", { name: "Ways to practise" });
    // Confirm pitch and tone now follow the warm-up
    await waitFor(() => expect(rowsOf(list).map(([name]) => name).slice(0, 3)).toEqual(["Warm-up", "Pitch and stress", "Tone"]));
  });

  // With a talk coming up as a focus, "Your talk" and the short speech come first (decision 97); without it, no talk anywhere (decision 49)
  it("brings back your talk and the short speech first for a talk coming up", async () => {
    // A repository with a talk coming up as the focus, and a saved talk
    const repository = createRepository(new MemoryStore());
    // The focus
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), practiceFocus: ["talk"] });
    // Draw the list
    render(<PracticeWaysScreen job="on-the-spot" repository={repository} now={NOW} />);
    // Wait for the focus to be read
    await waitFor(() => expect(rowsOf(screen.getByRole("list", { name: "Ways to practise" })).map(([name]) => name).slice(0, 3)).toEqual(["Your talk", "Short speech", "Rapid Fire"]));
    // Its focus mark
    expect(screen.getByText("Your focus")).toBeTruthy();
  });

  // Your talks are hidden for now: without the focus, no link to rehearse
  it("does not list your talks without the focus", async () => {
    // A repository with a saved talk
    const repository = createRepository(new MemoryStore());
    // The talk
    await repository.saveTalk(makeTalk({ id: "pitch", title: "Pitch", eventDate: "2026-10-17" }));
    // The rows
    const rows = await jobRows("on-the-spot", repository);
    // Confirm no talk and no link to rehearse
    expect([screen.queryByText("Pitch"), rows.some(([, href]) => href === "/rehearse")]).toEqual([null, false]);
  });

  // The role plays: the four packs and every small-talk unit
  it("lists every role play", async () => {
    // The rows
    const rows = await jobRows("role-play");
    // Confirm them
    expect(rows).toEqual([["Talk with someone", "/conversations"], ["Scenes", "/scenes"], ["Active listening", "/listening"], ["Quick scenarios", "/learn/scenarios"], ...UNITS.map((unit) => [unit.name, `/small-talk/unit?id=${unit.id}`])]);
  });

  // An unknown list says so, with the way back
  it("says so for an unknown list", async () => {
    // Draw it
    render(<PracticeWaysScreen job="nothing" repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the message (Sage says it as the page's heading, second design pass) and the way back
    expect([screen.getByRole("heading", { level: 1 }).textContent, screen.getByRole("link", { name: "Back to Practice" }).getAttribute("href")]).toEqual(["There is no list by that name.", "/practice"]);
  });
});
