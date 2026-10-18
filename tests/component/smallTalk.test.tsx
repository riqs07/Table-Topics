// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
// Load the screens being checked
import { SmallTalkScreen } from "@/components/screens/SmallTalkScreen";
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
    // Draw the page with no answers yet
    render(<SmallTalkScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // The recipe
    const recipe = await screen.findByRole("region", { name: "A good answer, in four beats" });
    // Confirm the four beats, today's question, and the first lesson as the main action
    expect([within(recipe).getAllByRole("listitem").length, within(screen.getByRole("region", { name: "Answer a question" })).getByText(smallTalkForDay(NOW).text).tagName, screen.getByRole("link", { name: /^Answering lesson 1The dead end/ }).getAttribute("href")]).toEqual([4, "P", "/session?mode=smalltalk&prompt=stl1"]);
  });

  // Answers are listed on the page with how many beats they showed, and in History too (since the daily mix)
  it("lists answers on its own page and in History", async () => {
    // A small-talk answer and nothing else
    const repository = await repositoryWith(answer({ selfReview: { worked: "", change: "", tags: ["moment"], skipped: false, savedAt: NOW.toISOString() } }));
    // Draw the Small talk page
    render(<SmallTalkScreen repository={repository} now={NOW} />);
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
    expect([!!screen.getByText("From your numbers"), screen.getByRole("link", { name: /Another question/ }).getAttribute("href")]).toEqual([true, "/small-talk"]);
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
    // Draw the page
    render(<SmallTalkScreen repository={repository} now={NOW} />);
    // The moments
    const moments = await screen.findByRole("list", { name: "Your moments" });
    // Confirm the words, today's state, and the way to add another
    expect([!!within(moments).getByText("I fixed the bike chain myself"), !!screen.getByText(/Today\u2019s moment is saved/), screen.getByRole("link", { name: "Add another moment" }).getAttribute("href")]).toEqual([true, true, "/session?mode=moment&prompt=moment"]);
  });

  // The units: asking and listening each have their own recipe and lessons, and a story is not shown on the page
  it("switches between the units", async () => {
    // Draw the page
    render(<SmallTalkScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Pick Asking
    fireEvent.click(await screen.findByRole("button", { name: "Asking" }));
    // The asking recipe, its lessons, and the main action leading to its first lesson
    const asking = [!!screen.getByRole("region", { name: "A good follow-up, in four beats" }), screen.getByRole("link", { name: "Asking lesson 1: Ask about what they said" }).getAttribute("href"), screen.getByRole("link", { name: /^Asking lesson 1Ask about/ }).getAttribute("href"), !!screen.getByRole("region", { name: "Ask a follow-up" })];
    // Pick Listening
    fireEvent.click(screen.getByRole("button", { name: "Listening" }));
    // The practice box
    const practice = screen.getByRole("region", { name: "Listen to a story" });
    // Confirm asking, then listening's recipe and a practice box that hides the story
    expect([...asking, !!screen.getByRole("region", { name: "A good response, in four beats" }), within(practice).getByText("Someone tells you about their day.").tagName, within(practice).getByRole("link", { name: "Listen and respond" }).getAttribute("href")?.startsWith("/session?mode=smalltalk&prompt=sls")]).toEqual([true, "/session?mode=smalltalk&prompt=sal1", "/session?mode=smalltalk&prompt=sal1", true, true, "P", true]);
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
    // Draw History instead
    cleanup();
    // History
    render(<HistoryScreen repository={repository} now={NOW} />);
    // Confirm it is labelled as listening
    expect(await screen.findByText(/Listening: So I was on the train this morning/)).toBeTruthy();
  });
});
