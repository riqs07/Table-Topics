// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screen being checked
import { PracticeScreen } from "@/components/screens/PracticeScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the day's pickers
import { promptForDay, tableTopicForDay } from "@/content/prompts";
// Load today's story prompt (decision 92)
import { storyPromptForDay } from "@/content/stories";
// Load the small-talk lessons (decision 95)
import { SMALL_TALK_LESSONS } from "@/content/smallTalk";
// Load a sample session builder
import { makeSession, makeTalk } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 15, 10);

// Remove the drawn screen after each check
afterEach(cleanup);

// Open "More ways to practise", where the groups live (decision 125)
async function openMore(): Promise<void> {
  // Tap it
  fireEvent.click(await screen.findByRole("button", { name: "More ways to practise" }));
}

// Group the checks about the Practice page
describe("PracticeScreen", () => {
  // The five that do the most work come first (the check-in comes to Today on its day), and everything else waits under "More ways to practise" (decision 125)
  it("shows the five main ways to practise, with the rest one tap away", async () => {
    // Draw the page
    render(<PracticeScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // The main list's rows as [name, address]
    const main = within(await screen.findByRole("list", { name: "Main ways to practise" })).getAllByRole("link").map((link) => [link.querySelector(".font-display")?.textContent, link.getAttribute("href")]);
    // Confirm the five, in order, with no check-in row
    expect(main).toEqual([["Rapid Fire", `/session?mode=talk&prompt=${tableTopicForDay(NOW, 1).id}`], ["Prepared speech", `/session?mode=response&prompt=${promptForDay(NOW, 1).id}`], ["Tell a story", `/stories/tell?prompt=${storyPromptForDay(NOW).id}`], ["Talk with someone", "/conversations"], ["Read aloud", "/skills"]]);
    // The rest is closed: no groups yet
    const more = screen.getByRole("button", { name: "More ways to practise" });
    // Closed at first
    const before = [more.getAttribute("aria-expanded"), screen.queryByRole("heading", { name: "Your voice" })];
    // Open it
    fireEvent.click(more);
    // Confirm closed, then the groups open
    expect([before, screen.getByRole("button", { name: "Fewer ways to practise" }).getAttribute("aria-expanded"), !!screen.getByRole("heading", { name: "Your voice" })]).toEqual([["false", null], "true", true]);
  });

  // Each group shows its first few rows, each leading to its own screen, with "See all" for the rest (decision 108)
  it("shows each group's first few rows, each leading to its own screen", async () => {
    // Draw the page
    render(<PracticeScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Open the rest, where the groups are
    await openMore();
    // A group's rows as [name, address] ("See all" first, where it is a link)
    const rows = async (name: string) => within((await screen.findByRole("heading", { name })).closest("section") as HTMLElement).getAllByRole("link").map((link) => [link.querySelector(".font-display")?.textContent, link.getAttribute("href")]);
    // Confirm the stories group, second of the groups (the courses' heading sits above them, decision 131), with today's story, telling one again and guided stories, the moments under "See all" (decision 92)
    expect([await rows("Tell stories"), screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent).filter((text) => text !== "Courses").indexOf("Tell stories")]).toEqual([[[undefined, "/stories"], ["Today’s story", `/stories/tell?prompt=${storyPromptForDay(NOW).id}`], ["Tell one again", "/stories#your-stories"], ["Guided stories", "/stories#guided-stories"]], 1]);
    // Confirm the other groups: the voice group's warm-up and the first two modes (clear sounds with the word lists as one row), and speaking on the spot's three
    expect([await rows("Everyday conversation"), await rows("Your voice"), await rows("Speak on the spot")]).toEqual([
      [[undefined, "/small-talk"], ["Talk with someone", "/conversations"], ["Answering", "/small-talk/unit?id=answering"], ["One moment a day", "/session?mode=moment&prompt=moment"]],
      [[undefined, "/voice"], ["Warm-up", "/voice/warmup"], ["Clear sounds", "/voice/drill?id=c01"], ["Volume", "/voice/drill?id=v01"]],
      [["Rapid Fire", `/session?mode=talk&prompt=${tableTopicForDay(NOW, 1).id}`], ["Prepared speech", `/session?mode=response&prompt=${promptForDay(NOW, 1).id}`], ["Read aloud", "/skills"]],
    ]);
  });

  // Speaking on the spot has no page of its own, so its "See all" opens the rest in place: free talk and the short speech, two taps from Practice (decision 108)
  it("opens the rest of speaking on the spot in place", async () => {
    // Draw the page
    render(<PracticeScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Open the rest, where the groups are
    await openMore();
    // The group
    const spot = within((await screen.findByRole("heading", { name: "Speak on the spot" })).closest("section") as HTMLElement);
    // Its "See all"
    const all = spot.getByRole("button", { name: "See all" });
    // Closed at first: no free talk
    const before = [all.getAttribute("aria-expanded"), spot.queryByRole("link", { name: /^Free talk/ })];
    // Open it
    fireEvent.click(all);
    // Confirm closed then open, with every row
    expect([before, spot.getByRole("button", { name: "Show fewer" }).getAttribute("aria-expanded"), spot.getAllByRole("link").map((link) => link.querySelector(".font-display")?.textContent)]).toEqual([["false", null], "true", ["Rapid Fire", "Prepared speech", "Read aloud", "4/3/2", "Free talk", "Short speech"]]);
  });

  // The voice group shows what is next: the modes done least come first, so a done mode makes room (decision 108)
  it("puts the voice modes done least first", async () => {
    // A repository with clear sounds and volume each done once
    const repository = createRepository(new MemoryStore());
    // A clear-sounds drill
    await repository.saveSession(makeSession({ id: "c", mode: "voice", promptId: "c01" }));
    // A volume drill
    await repository.saveSession(makeSession({ id: "v", mode: "voice", promptId: "v01" }));
    // Draw the page
    render(<PracticeScreen repository={repository} now={NOW} />);
    // Open the rest, where the groups are
    await openMore();
    // The voice group
    const voice = within((await screen.findByRole("heading", { name: "Your voice" })).closest("section") as HTMLElement);
    // Confirm pitch and tone now follow the warm-up
    await waitFor(() => expect(voice.getAllByRole("link").map((link) => link.querySelector(".font-display")?.textContent).slice(1)).toEqual(["Warm-up", "Pitch and stress", "Tone"]));
  });

  // Read aloud sits with speaking on the spot (decision 93), the openings drill is gone (decision 106), and the lessons moved to Learn, so there is no Build a skill group (decision 107)
  it("puts Read aloud under Speak on the spot, with no openings drill and no Build a skill group", async () => {
    // Draw the page
    render(<PracticeScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Open the rest, where the groups are
    await openMore();
    // The on-the-spot group
    const spot = (await screen.findByRole("heading", { name: "Speak on the spot" })).closest("section") as HTMLElement;
    // Confirm Read aloud is there, and no openings row, Build a skill group or lesson link anywhere
    await waitFor(() => expect([!!within(spot).queryByRole("link", { name: /^Read aloud/ }), screen.queryByText("Openings and closings"), screen.queryAllByRole("link").some((link) => link.getAttribute("href") === "/bookends"), screen.queryByRole("heading", { name: "Build a skill" }), screen.queryAllByRole("link").some((link) => link.getAttribute("href")?.includes("mode=lesson"))]).toEqual([true, null, false, null, false]));
  });

  // The conversation group shows the next unit only, with "See all" for the seven (decision 95): once the first four units' lessons are done, Reading the room and its first lesson
  it("shows the next conversation unit, with its next lesson", async () => {
    // A repository with every lesson of the first four units answered
    const repository = createRepository(new MemoryStore());
    // Save one answer per lesson
    for (const lesson of SMALL_TALK_LESSONS.filter((item) => ["answering", "asking", "listening", "news"].includes(item.unit))) await repository.saveSession(makeSession({ id: lesson.id, mode: "smalltalk", promptId: lesson.id }));
    // Draw the page
    render(<PracticeScreen repository={repository} now={NOW} />);
    // Open the rest, where the groups are
    await openMore();
    // The unit's row, once the answers are read
    const row = await screen.findByRole("link", { name: /^Reading the room/ });
    // Confirm where it leads and what it says next
    expect([row.getAttribute("href"), row.textContent?.includes("Next: lesson 1, Notice changes, not signals")]).toEqual(["/small-talk/unit?id=room", true]);
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
    await screen.findByRole("link", { name: /^Rapid Fire/ });
    // Confirm there is no Q&A row
    expect(screen.queryByText(/Q&A/)).toBeNull();
  });

  // Your talks are hidden for now: no section and no way in from here
  it("does not list your talks", async () => {
    // A repository with a saved talk
    const repository = createRepository(new MemoryStore());
    // The talk
    await repository.saveTalk(makeTalk({ id: "pitch", title: "Pitch", eventDate: "2026-10-17" }));
    // Draw the page
    render(<PracticeScreen repository={repository} now={NOW} />);
    // Open the rest, where the groups are
    await openMore();
    // Wait for the page
    await screen.findByRole("heading", { name: "Speak on the spot" });
    // Confirm no talks section and no link to rehearse
    expect([screen.queryByRole("region", { name: "Your talks" }), screen.queryByText("Pitch"), screen.queryAllByRole("link").some((link) => link.getAttribute("href") === "/rehearse")]).toEqual([null, null, false]);
  });

  // The guided courses sit at the top, the focus's marked, each with its progress (decision 131)
  it("lists the courses at the top, the focus's marked, each with its progress (decision 131)", async () => {
    // A repository with thinking on your feet picked and one part done
    const repository = createRepository(new MemoryStore());
    // The focus and the progress
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), practiceFocus: ["spot"], courses: { "sf-beat-1": { doneAt: NOW.toISOString(), takeId: null } } });
    // Draw the page
    render(<PracticeScreen repository={repository} now={NOW} />);
    // The course card
    const card = await screen.findByRole("link", { name: "Stop freezing, 1 of 10" });
    // Confirm it leads to the course, says it is for the focus, and the list of all courses is linked
    await waitFor(() => expect([card.getAttribute("href"), card.textContent?.includes("For your focus"), screen.getByRole("link", { name: "All courses" }).getAttribute("href")]).toEqual(["/courses/course?id=stop-freezing", true, "/courses"]));
  });

  // With a focus, its group comes first and says so; a talk coming up brings back "Your talk" and the short speech first (decision 97)
  it("puts the focus group first", async () => {
    // A repository with two areas picked
    const repository = createRepository(new MemoryStore());
    // How I sound and a talk coming up
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), practiceFocus: ["voice", "talk"] });
    // Draw the page
    render(<PracticeScreen repository={repository} now={NOW} />);
    // Open the rest, where the groups are
    await openMore();
    // Wait for the order to follow the focus
    await waitFor(() => expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent).filter((text) => text !== "Courses")[0]).toBe("Your voiceYour focus"));
    // The headings in order
    const headings = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent).filter((text) => text !== "Courses");
    // The on-the-spot rows' names
    const spot = within(screen.getByRole("region", { name: /^Speak on the spot/ })).getAllByRole("link").map((link) => link.querySelector(".font-display")?.textContent);
    // Confirm the order, the marks, and the first rows
    expect([headings.slice(0, 5), spot.slice(0, 3)]).toEqual([["Your voiceYour focus", "Speak on the spotYour focus", "Tell stories", "Everyday conversation"], ["Your talk", "Short speech", "Rapid Fire"]]);
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
});
