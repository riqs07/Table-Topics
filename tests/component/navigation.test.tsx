// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen, within } from "@testing-library/react";
// Load the screens that must all share the same navigation
import { HomeScreen } from "@/components/screens/HomeScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
// Load the Practice screen
import { PracticeScreen } from "@/components/screens/PracticeScreen";
// Load the Skills screen
import { SkillsScreen } from "@/components/screens/SkillsScreen";
// Load the talk page
import { TalkScreen } from "@/components/screens/TalkScreen";
// Load the openings and closings page
import { BookendsScreen } from "@/components/screens/BookendsScreen";
// Load the Q&A page
import { QaScreen } from "@/components/screens/QaScreen";
import { RehearseScreen } from "@/components/screens/RehearseScreen";
import { SessionScreen } from "@/components/screens/SessionScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load a sample session builder
import { makeSession } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 15, 10);

// Remove the drawn screen after each check
afterEach(cleanup);

// Where the five tabs must lead, in order (Settings is the gear in the title row)
const DESTINATIONS = [["Today", "/"], ["Practice", "/practice"], ["Connect", "/small-talk"], ["Learn", "/learn"], ["History", "/history"]];

// Read the main navigation's links as [name, address] pairs, and which one is marked as the current page
async function readNavigation() {
  // Find the navigation landmark
  const nav = await screen.findByRole("navigation", { name: "Main" });
  // Its links
  const links = within(nav).getAllByRole("link");
  // The settings gear
  const gear = screen.getByRole("link", { name: "Settings" });
  // Names and addresses, the marked tab (or the gear, on Settings), and where the gear leads
  return { links: links.map((link) => [link.textContent, link.getAttribute("href")]), current: links.find((link) => link.getAttribute("aria-current") === "page")?.textContent ?? (gear.getAttribute("aria-current") === "page" ? "Settings" : null), gear: gear.getAttribute("href") };
}

// Group the checks about getting around the app
describe("main navigation", () => {
  // Every screen offers the same way to every section, with its own section marked
  it.each([
    // Today
    ["Today", "Today", async () => <HomeScreen repository={createRepository(new MemoryStore())} now={NOW} />],
    // Practice
    ["Practice", "Practice", async () => <PracticeScreen repository={createRepository(new MemoryStore())} now={NOW} />],
    // Skills is a page inside Practice
    ["Skills", "Practice", async () => <SkillsScreen repository={createRepository(new MemoryStore())} now={NOW} />],
    // History
    ["History", "History", async () => <HistoryScreen repository={createRepository(new MemoryStore())} now={NOW} />],
    // Your talks belong to Practice
    ["Talks", "Practice", async () => <RehearseScreen repository={createRepository(new MemoryStore())} now={NOW} />],
    // So does a talk's page
    ["a talk's page", "Practice", async () => <TalkScreen talkId="nope" repository={createRepository(new MemoryStore())} now={NOW} />],
    // Openings and closings belong to Practice
    ["Openings and closings", "Practice", async () => <BookendsScreen repository={createRepository(new MemoryStore())} now={NOW} />],
    // So does Q&A practice
    ["Q&A practice", "Practice", async () => <QaScreen fromId="nope" repository={createRepository(new MemoryStore())} now={NOW} />],
    // Settings
    ["Settings", "Settings", async () => <SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} />],
    // A session's results belong to where that kind of session lives (here speaking on the spot)
    ["a session", "Practice", async () => {
      // A repository with one session
      const repository = createRepository(new MemoryStore());
      // Save it
      await repository.saveSession(makeSession({ id: "s1" }));
      // The session page
      return <SessionScreen sessionId="s1" repository={repository} now={NOW} />;
    }],
    // A missing session still offers a way out
    ["a missing session", null, async () => <SessionScreen sessionId="nope" repository={createRepository(new MemoryStore())} now={NOW} />],
  ])("is on the %s screen", async (_name, current, build) => {
    // Draw the screen
    render(await build());
    // Confirm the links and the marked page
    expect(await readNavigation()).toEqual({ links: DESTINATIONS, current, gear: "/settings" });
  });
});
