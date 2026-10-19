// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, beforeEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
// Load the screen being checked
import { OutlineScreen } from "@/components/screens/OutlineScreen";

// Start each check with nothing saved
beforeEach(() => {
  // Clear storage
  localStorage.clear();
});

// Remove the drawn screen after each check
afterEach(() => {
  // Clean up
  cleanup();
});

// Group the checks about planning a short speech (decision 73)
describe("OutlineScreen", () => {
  // Start waits for a topic and a point, then carries the plan to the recording page and keeps it for next time
  it("plans a short speech and carries it to the recording page", () => {
    // Draw the page
    render(<OutlineScreen />);
    // Confirm start waits
    const waiting = screen.getByRole("button", { name: /Start speaking/ }).hasAttribute("disabled");
    // Fill in the topic and two points
    fireEvent.change(screen.getByRole("textbox", { name: "What’s it about?" }), { target: { value: "Why I run" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Point 1" }), { target: { value: "It clears my head" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Point 3" }), { target: { value: "I met friends" } });
    // Choose three minutes
    fireEvent.click(screen.getByRole("button", { name: "3 min" }));
    // The start link
    const start = screen.getByRole("link", { name: /Start speaking/ });
    // Use it
    fireEvent.click(start);
    // Confirm: it waited, the address carries the plan without the empty point, and the plan was kept
    expect([waiting, start.getAttribute("href"), JSON.parse(localStorage.getItem("voicelab-outline-draft") ?? "null")]).toEqual([true, "/session?mode=outline&topic=Why+I+run&point=It+clears+my+head&point=I+met+friends&goal=3", { topic: "Why I run", points: ["It clears my head", "I met friends"], goalMinutes: 3 }]);
  });

  // The last plan comes back, ready to reuse or change
  it("brings back the last plan", () => {
    // A plan kept from last time
    localStorage.setItem("voicelab-outline-draft", JSON.stringify({ topic: "My trip", points: ["The food"], goalMinutes: 5 }));
    // Draw the page
    render(<OutlineScreen />);
    // Confirm the fields and the length
    expect([(screen.getByRole("textbox", { name: "What’s it about?" }) as HTMLInputElement).value, (screen.getByRole("textbox", { name: "Point 1" }) as HTMLInputElement).value, screen.getByRole("button", { name: "5 min" }).getAttribute("aria-pressed")]).toEqual(["My trip", "The food", "true"]);
  });
});
