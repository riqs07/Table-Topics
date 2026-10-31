// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen, within } from "@testing-library/react";
// Load the screen being checked
import { SpeechScreen } from "@/components/screens/SpeechScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the speech lookup
import { findSpeech } from "@/content/readings";
// Load a sample session builder
import { makeSession } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 17, 10);

// Remove the drawn screen after each check
afterEach(cleanup);

// Group the checks about a full speech's page
describe("SpeechScreen", () => {
  // Every part is listed, each starting its own reading
  it("lists every part, each opening its reading", async () => {
    // Draw Kennedy's inaugural
    render(<SpeechScreen speechId="jfk-inaugural" repository={createRepository(new MemoryStore())} now={NOW} />);
    // The parts
    const parts = within(await screen.findByRole("list", { name: "Parts" })).getAllByRole("link");
    // Confirm one per part, the second reading part 2
    expect([parts.length, parts[1]?.getAttribute("href")]).toEqual([findSpeech("jfk-inaugural")?.parts.length, "/session?mode=read&prompt=jfk-inaugural-2"]);
  });

  // Parts already read are done, and the next one is offered
  it("marks the parts read and offers the next", async () => {
    // A repository where part 1 has been read
    const repository = createRepository(new MemoryStore());
    // Part 1, once
    await repository.saveSession(makeSession({ id: "a", mode: "read", promptId: "jfk-inaugural-1" }));
    // Draw the page
    render(<SpeechScreen speechId="jfk-inaugural" repository={repository} now={NOW} />);
    // Confirm the progress line, the done mark, and the action
    expect([!!(await screen.findByText(/ · 1 read$/)), !!within(screen.getAllByRole("link", { name: /Read part 1/ }).find((link) => !link.hasAttribute("data-action-band"))!).getByText("Done"), screen.getAllByRole("link", { name: /Read part 2/ }).find((link) => link.hasAttribute("data-action-band"))?.getAttribute("href")]).toEqual([true, true, "/session?mode=read&prompt=jfk-inaugural-2"]);
  });

  // An unknown speech says so
  it("explains a speech that is not in the library", async () => {
    // Draw an unknown id
    render(<SpeechScreen speechId="nobody" repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the explanation
    expect(await screen.findByText(/not in the library/)).toBeTruthy();
  });
});
