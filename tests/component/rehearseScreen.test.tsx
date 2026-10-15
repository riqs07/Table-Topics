// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen, waitFor } from "@testing-library/react";
// Load the tool for acting like a user
import userEvent from "@testing-library/user-event";
// Load the screen being checked
import { RehearseScreen } from "@/components/screens/RehearseScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load a sample talk builder
import { makeTalk } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 15, 10);

// Remove the drawn screen after each check
afterEach(cleanup);

// Group the checks about the Rehearse my talk page
describe("RehearseScreen", () => {
  // A new talk is saved from the form and listed with a link to rehearse it
  it("saves a talk and links to rehearsing it", async () => {
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Draw the screen
    render(<RehearseScreen repository={repository} now={NOW} />);
    // Fill in the title
    await userEvent.type(await screen.findByLabelText("Title"), "Wedding toast");
    // Fill in the talk
    await userEvent.type(screen.getByLabelText("Your talk or notes"), "Thank you all for coming tonight.");
    // Set a three-minute goal
    await userEvent.type(screen.getByLabelText(/Goal in minutes/), "3");
    // Save it
    await userEvent.click(screen.getByRole("button", { name: "Save talk" }));
    // Confirm it was saved with its goal
    await waitFor(async () => expect((await repository.listTalks()).map((talk) => [talk.title, talk.goalMinutes])).toEqual([["Wedding toast", 3]]));
    // Confirm the rehearse link points at it
    const [talk] = await repository.listTalks();
    // Check the link
    expect(screen.getByRole("link", { name: /Rehearse “Wedding toast”/ }).getAttribute("href")).toBe(`/session?mode=rehearse&prompt=${talk!.id}`);
  });

  // A talk needs a title and some words
  it("will not save an empty talk", async () => {
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Draw the screen
    render(<RehearseScreen repository={repository} now={NOW} />);
    // Try to save with nothing filled in
    await userEvent.click(await screen.findByRole("button", { name: "Save talk" }));
    // Confirm the explanation and that nothing was saved
    expect([!!screen.getByText("Give the talk a title and some words first."), (await repository.listTalks()).length]).toEqual([true, 0]);
  });

  // A saved talk can be deleted after confirming
  it("deletes a talk after confirming", async () => {
    // A repository with one talk
    const repository = createRepository(new MemoryStore());
    // Save it
    await repository.saveTalk(makeTalk());
    // Draw the screen
    render(<RehearseScreen repository={repository} now={NOW} />);
    // Ask to delete
    await userEvent.click(await screen.findByRole("button", { name: /Delete “Team update”/ }));
    // Confirm
    await userEvent.click(screen.getByRole("button", { name: "Yes, delete it" }));
    // Confirm it is gone
    await waitFor(async () => expect(await repository.listTalks()).toEqual([]));
  });
});
