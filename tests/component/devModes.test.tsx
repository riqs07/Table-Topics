// @vitest-environment jsdom
// Checks for the page listing every mode, for development (decision 132)
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
// Load the screens being checked
import { DevModesScreen } from "@/components/screens/DevModesScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the list, to count it
import { MODE_CATALOGUE } from "@/content/modeCatalogue";

// Remove drawn screens and saved choices after each check
afterEach(() => {
  // Remove the screen
  cleanup();
  // Clear the switch
  localStorage.clear();
});

// Group the checks about the page
describe("DevModesScreen", () => {
  // Every entry is a link, tagged main or extended, with its address shown
  it("lists every mode with its tag and address", () => {
    // Draw it
    render(<DevModesScreen />);
    // Every entry
    const rows = document.querySelectorAll("[data-catalogue-entry]");
    // Rapid Fire's row
    const rapid = screen.getByRole("link", { name: /^Rapid Fire/ });
    // Confirm the count, the main five, and Rapid Fire's tag, address and link
    expect([rows.length, document.querySelectorAll('[data-catalogue-entry="main"]').length, rapid.textContent?.includes("On Practice"), rapid.textContent?.includes("/session?mode=talk&prompt=t001"), rapid.getAttribute("href")]).toEqual([MODE_CATALOGUE.flatMap((group) => group.entries).length, 5, true, true, "/session?mode=talk&prompt=t001"]);
  });

  // The switch saves the choice for Settings
  it("switches the link in Settings on and off", () => {
    // Draw it
    render(<DevModesScreen />);
    // The switch
    const toggle = screen.getByRole("checkbox", { name: /Show a link to this page in Settings/ }) as HTMLInputElement;
    // Off at first
    const first = toggle.checked;
    // Switch on
    fireEvent.click(toggle);
    // Confirm off, then on and saved
    expect([first, toggle.checked, localStorage.getItem("voicelab-dev-tools")]).toEqual([false, true, "on"]);
  });
});

// Group the checks about the link in Settings
describe("SettingsScreen's developer link", () => {
  // A build run locally (as the tests are) always shows it
  it("shows the link while developing", async () => {
    // Draw Settings
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={new Date(2026, 9, 29, 10)} />);
    // Confirm the link
    expect((await screen.findByRole("link", { name: /All modes/ })).getAttribute("href")).toBe("/dev/modes");
  });
});
