// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen, within } from "@testing-library/react";
// Load the screens that must all share the same navigation
import { HomeScreen } from "@/components/screens/HomeScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
// Load the speaking profile (decision 90)
import { ProfileScreen } from "@/components/screens/ProfileScreen";
// Load the Practice screen
import { PracticeScreen } from "@/components/screens/PracticeScreen";
// Load the Skills screen
import { SkillsScreen } from "@/components/screens/SkillsScreen";
// Load the talk page
import { TalkScreen } from "@/components/screens/TalkScreen";
// Load the Stories page (decision 92)
import { StoriesScreen } from "@/components/screens/StoriesScreen";
import { RehearseScreen } from "@/components/screens/RehearseScreen";
// Load the check-in pages (decision 100)
import { CheckInScreen } from "@/components/screens/CheckInScreen";
import { CheckInCompareScreen } from "@/components/screens/CheckInCompareScreen";
import { SessionScreen } from "@/components/screens/SessionScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { CoursesScreen } from "@/components/screens/CoursesScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load a sample session builder
import { makeSession } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 15, 10);

// Remove the drawn screen after each check
afterEach(cleanup);

// Where the tabs must lead, in order (UI rewrite: Today, Practice, Courses and Me; Learn is inside Courses, Settings inside Me)
const DESTINATIONS = [["Today", "/"], ["Practice", "/practice"], ["Courses", "/courses"], ["Me", "/profile"]];

// Read the main navigation's links as [name, address] pairs, and which one is marked as the current page
async function readNavigation() {
  // The navigation landmark
  const nav = await screen.findByRole("navigation", { name: "Main" });
  // Its section links (the rail's app name, a link home on a computer, is left out)
  const links = within(nav).getAllByRole("link").filter((link) => link.textContent !== "VoiceLab");
  // Each link's name and address, and which one is marked current
  return { links: links.map((link) => [link.textContent, link.getAttribute("href")]), current: links.find((link) => link.getAttribute("aria-current") === "page")?.textContent ?? null };
}

// Group the checks about getting around the app
describe("main navigation", () => {
  // Every screen offers the same way to every section, with its own section marked
  it.each([
    // Today
    ["Today", "Today", async () => {
      // Past the welcome, which has no tabs (decision 78)
      localStorage.setItem("voicelab-welcome-seen", "yes");
      // Today itself
      return <HomeScreen repository={createRepository(new MemoryStore())} now={NOW} />;
    }],
    // Practice
    ["Practice", "Practice", async () => <PracticeScreen repository={createRepository(new MemoryStore())} now={NOW} />],
    // Skills is a page inside Practice
    ["Skills", "Practice", async () => <SkillsScreen repository={createRepository(new MemoryStore())} now={NOW} />],
    // History
    // History lives in Settings, so the gear is marked
    ["History", "Me", async () => <HistoryScreen repository={createRepository(new MemoryStore())} now={NOW} />],
    // The speaking profile lives in Settings too (decision 90)
    ["the speaking profile", "Me", async () => <ProfileScreen repository={createRepository(new MemoryStore())} now={NOW} />],
    // Your talks belong to Practice
    ["Talks", "Practice", async () => <RehearseScreen repository={createRepository(new MemoryStore())} now={NOW} />],
    // So does a talk's page
    ["a talk's page", "Practice", async () => <TalkScreen talkId="nope" repository={createRepository(new MemoryStore())} now={NOW} />],
    // Stories belong to Practice (decision 92)
    ["Stories", "Practice", async () => <StoriesScreen repository={createRepository(new MemoryStore())} now={NOW} />],
    // The guided courses have their own tab (decision 148)
    ["Courses", "Courses", async () => <CoursesScreen repository={createRepository(new MemoryStore())} now={NOW} />],
    // Your check-ins and their comparison belong to Today (decision 100)
    ["Your check-ins", "Today", async () => <CheckInScreen repository={createRepository(new MemoryStore())} now={NOW} />],
    // (the comparison)
    ["Compare check-ins", "Today", async () => <CheckInCompareScreen repository={createRepository(new MemoryStore())} now={NOW} />],
    // Settings
    ["Settings", "Me", async () => <SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} />],
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
    expect(await readNavigation()).toEqual({ links: DESTINATIONS, current });
  });
});
