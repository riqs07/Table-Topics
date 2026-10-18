// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
// Load the screens being checked
import { SmallTalkScreen } from "@/components/screens/SmallTalkScreen";
import { ConnectScreen } from "@/components/screens/ConnectScreen";
import { SessionScreen } from "@/components/screens/SessionScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load today's question picker
import { smallTalkForDay } from "@/content/smallTalk";
// Load a sample session builder
import { makeSession } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 17, 18);

// Remove the drawn screen after each check
afterEach(cleanup);

// A repository holding the given sessions
async function repositoryWith(...sessions: ReturnType<typeof makeSession>[]) {
  // An empty one
  const repository = createRepository(new MemoryStore());
  // Save each
  for (const session of sessions) await repository.saveSession(session);
  // Hand it back
  return repository;
}

// An answer to "How was your weekend?" with every beat the phone can hear, and the given notes
const answer = (overrides: Partial<ReturnType<typeof makeSession>> = {}) => makeSession({ id: "a1", mode: "smalltalk", promptId: "st01", durationSec: 30, createdAt: new Date(2026, 9, 17, 9).toISOString(), transcript: "I built an app it was way more fun than it sounds did you do anything good", ...overrides });

// Group the checks about small talk on screen
describe("small talk", () => {
  // The page teaches the recipe, starts the lessons in order, and offers today's question
  it("teaches the recipe and leads with the first lesson", async () => {
    // Draw the Answering page with no answers yet
    render(<SmallTalkScreen unitId="answering" repository={createRepository(new MemoryStore())} now={NOW} />);
    // The recipe
    const recipe = await screen.findByRole("region", { name: "A good answer, in four beats" });
    // Confirm the four beats, today's question, and the first lesson as the main action
    expect([within(recipe).getAllByRole("listitem").length, within(screen.getByRole("region", { name: "Answer a question" })).getByText(smallTalkForDay(NOW).text).tagName, screen.getByRole("link", { name: /^Answering lesson 1The dead end/ }).getAttribute("href")]).toEqual([4, "H1", "/session?mode=smalltalk&prompt=stl1"]);
  });

  // Answers are listed on the page with how many beats they showed, and in History too (since the daily mix)
  it("lists answers on its own page and in History", async () => {
    // A small-talk answer and nothing else
    const repository = await repositoryWith(answer({ selfReview: { worked: "", change: "", tags: ["moment"], skipped: false, savedAt: NOW.toISOString() } }));
    // Draw the Answering page
    render(<SmallTalkScreen unitId="answering" repository={repository} now={NOW} />);
    // The answers
    const answers = await screen.findByRole("region", { name: "Your answers" });
    // Confirm the question and its beats (moment ticked, feeling and hand-back heard by the phone)
    expect(within(answers).getByRole("link").textContent).toContain("How was your weekend?");
    // Confirm the count
    expect(within(answers).getByRole("link").textContent).toContain("3 of 4");
    // Draw History instead
    cleanup();
    // History
    render(<HistoryScreen repository={repository} now={NOW} />);
    // Confirm History lists it by its question
    expect(await screen.findByText(/Small talk: How was your weekend\?/)).toBeTruthy();
  });

  // Listening back asks the four listen-for questions, and the notes then show the beats
  it("asks what you heard yourself do, then shows the beats", async () => {
    // A new answer waiting for notes, with no audio on this device
    const repository = await repositoryWith(answer({ selfReview: null }));
    // Draw the answer's page
    render(<SessionScreen sessionId="a1" repository={repository} now={NOW} />);
    // The listen-for list
    const listen = await screen.findByRole("list", { name: "Listen for" });
    // Tick the moment
    fireEvent.click(within(listen).getByRole("button", { name: /^Moment/ }));
    // Save the notes
    fireEvent.click(screen.getByRole("button", { name: /Save my notes/ }));
    // The beats
    const beats = await screen.findByRole("list", { name: "The beats" });
    // Confirm the headline and which beats were found, with the phone's evidence for feeling and the hand-back
    expect([screen.getByText("3 of 4 beats.").tagName, within(beats).getAllByRole("listitem").map((item) => item.getAttribute("data-found")), within(beats).getByText("“fun”").tagName]).toEqual(["P", ["true", "false", "true", "true"], "SPAN"]);
    // Confirm one change from the phone, and a way to another question
    expect([!!screen.getByText("From your numbers"), screen.getByRole("link", { name: /Another question/ }).getAttribute("href")]).toEqual([true, "/small-talk/unit?id=answering"]);
  });

  // The coach's notes quote each beat and show the livelier version with its gaps marked
  it("shows the coach's quotes and the livelier version", async () => {
    // An answer with the coach's notes
    const repository = await repositoryWith(answer({ selfReview: { worked: "", change: "", tags: [], skipped: false, savedAt: NOW.toISOString() }, feedbackStatus: "done", feedback: { keep: "k", change: "Say how it felt.", retryCue: "After the moment, say how it felt.", smallTalk: { moment: "I built an app", hooks: ["it coaches me"], feeling: "", handBack: "did you do anything good", livelier: "I built an app that coaches me. [how it felt] Did you do anything good?" } } }));
    // Draw the answer's page
    render(<SessionScreen sessionId="a1" repository={repository} now={NOW} />);
    // The beats
    const beats = await screen.findByRole("list", { name: "The beats" });
    // Confirm the coach's count and quotes, and the gap marked in the livelier version
    expect([screen.getByText("3 of 4 beats.").tagName, !!within(beats).getByText("“I built an app”"), screen.getByText("[how it felt]").tagName, screen.queryByText("From your numbers")]).toEqual(["P", true, "EM", null]);
  });

  // Today's moment: saved moments are listed with their words, and the page says today's is done
  it("lists your moments and says when today's is saved", async () => {
    // A moment from this morning
    const repository = await repositoryWith(makeSession({ id: "m1", mode: "moment", promptId: "moment", transcript: "I fixed the bike chain myself", createdAt: new Date(2026, 9, 17, 8).toISOString(), feedbackStatus: "done" }));
    // Draw the Answering page
    render(<SmallTalkScreen unitId="answering" repository={repository} now={NOW} />);
    // The moments
    const moments = await screen.findByRole("list", { name: "Your moments" });
    // Confirm the words, today's state, and the way to add another
    expect([!!within(moments).getByText("I fixed the bike chain myself"), !!screen.getByText(/Today\u2019s moment is saved/), screen.getByRole("link", { name: "Add another moment" }).getAttribute("href")]).toEqual([true, true, "/session?mode=moment&prompt=moment"]);
  });

  // Connect lists the units as cards; each unit's page has its own recipe, lessons and practice, and a story is not shown
  it("lists the units as cards, each with its own page", async () => {
    // Draw Connect
    render(<ConnectScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // The unit cards
    const units = within(await screen.findByRole("list", { name: "Units" })).getAllByRole("link");
    // Their names and addresses, and the first marked next
    const cards = [units.map((link) => [link.getAttribute("aria-label"), link.getAttribute("href")]), units[0]?.textContent?.includes("Next up")];
    // Draw Asking
    cleanup();
    // The page
    render(<SmallTalkScreen unitId="asking" repository={createRepository(new MemoryStore())} now={NOW} />);
    // The asking recipe, its lessons, and the main action leading to its first lesson
    const asking = [!!(await screen.findByRole("region", { name: "A good follow-up, in four beats" })), screen.getByRole("link", { name: "Asking lesson 1: Ask about what they said" }).getAttribute("href"), screen.getByRole("link", { name: /^Asking lesson 1Ask about/ }).getAttribute("href"), !!screen.getByRole("region", { name: "Ask a follow-up" })];
    // Draw Listening
    cleanup();
    // The page
    render(<SmallTalkScreen unitId="listening" repository={createRepository(new MemoryStore())} now={NOW} />);
    // The practice box
    const practice = await screen.findByRole("region", { name: "Listen to a story" });
    // Confirm the cards, asking, then listening's recipe and a practice box that hides the story
    expect([...cards, ...asking, !!screen.getByRole("region", { name: "A good response, in four beats" }), within(practice).getByRole("heading", { level: 1 }).textContent, within(practice).getByRole("link", { name: "Listen and respond" }).getAttribute("href")?.startsWith("/session?mode=smalltalk&prompt=sls")]).toEqual([[["Answering, 0 of 6", "/small-talk/unit?id=answering"], ["Asking, 0 of 3", "/small-talk/unit?id=asking"], ["Listening, 0 of 3", "/small-talk/unit?id=listening"], ["News, 0 of 3", "/small-talk/unit?id=news"]], true, true, "/session?mode=smalltalk&prompt=sal1", "/session?mode=smalltalk&prompt=sal1", true, true, "Someone tells you about their day.", true]);
  });

  // After a reply to a story: the story itself, the listening beats the phone heard, and a label in History
  it("shows the story and the listening beats afterwards", async () => {
    // A reply to the train story
    const repository = await repositoryWith(answer({ promptId: "sls01", durationSec: 8, transcript: "no way you missed your stop and your boss was waiting that must have been so awkward", selfReview: { worked: "", change: "", tags: [], skipped: false, savedAt: NOW.toISOString() } }));
    // Draw its page
    render(<SessionScreen sessionId="a1" repository={repository} now={NOW} />);
    // The beats
    const beats = await screen.findByRole("list", { name: "The beats" });
    // Confirm the story, all four beats with the reaction quoted, and the timing against its window
    expect([!!screen.getByText(/fell asleep on my shoulder/), screen.getByText("All four beats.").tagName, within(beats).getAllByRole("listitem").map((item) => item.querySelector("strong")?.textContent), !!within(beats).getByText("“no way”"), !!screen.getByText("0:08, inside the 0:05 to 0:30 window.")]).toEqual([true, "P", ["React.", "Their words.", "Their feeling.", "Stay."], true, true]);
    // Confirm the lighter result: no numbers row, the next story as the main action, and trying again as a row
    expect([screen.queryByRole("region", { name: "Your numbers" }), screen.getByRole("link", { name: /^Next one/ }).getAttribute("href"), screen.getByRole("link", { name: "Try it again" }).getAttribute("href")?.includes("prompt=sls01")]).toEqual([null, "/session?mode=smalltalk&prompt=sls02", true]);
    // Draw History instead
    cleanup();
    // History
    render(<HistoryScreen repository={repository} now={NOW} />);
    // Confirm it is labelled as listening
    expect(await screen.findByText(/Listening: So I was on the train this morning/)).toBeTruthy();
  });

  // Responding to news: its own unit on the page, with its recipe and a result labelled as news
  it("offers responding to news as a unit, and labels its results", async () => {
    // Draw the News page
    render(<SmallTalkScreen unitId="news" repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the recipe, the first lesson and the practice box
    expect([!!(await screen.findByRole("region", { name: "A good response to news, in four beats" })), screen.getByRole("link", { name: "News lesson 1: Good news needs a real reaction" }).getAttribute("href"), !!within(screen.getByRole("region", { name: "Respond to news" })).getByRole("link", { name: "Respond to it" })]).toEqual([true, "/session?mode=smalltalk&prompt=snl1", true]);
    // A response to "I got the job!"
    const repository = await repositoryWith(answer({ promptId: "sn01", durationSec: 6, transcript: "no way you got it how did it feel when they called", selfReview: { worked: "", change: "", tags: [], skipped: false, savedAt: NOW.toISOString() } }));
    // Its page
    cleanup();
    // Draw it
    render(<SessionScreen sessionId="a1" repository={repository} now={NOW} />);
    // Confirm what they said, all four beats, and the next one
    expect([!!(await screen.findByText("Their news")), screen.getByText("All four beats.").tagName, screen.getByRole("link", { name: /^Next one/ }).getAttribute("href")]).toEqual([true, "P", "/session?mode=smalltalk&prompt=sn02"]);
  });
});
