// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a component and finding things on it
import { cleanup, render, screen } from "@testing-library/react";
// Load what is being checked
import { FocusPicker } from "@/components/script/FocusPicker";

// Remove the drawn component after each check
afterEach(cleanup);

// Group the checks about the focus picker's scenes (decision 137)
describe("FocusPicker scenes", () => {
  // The full-size picker shows each area's scene, still until picked, a few rounds once picked; the buttons are still named by the area first
  it("shows each area's scene, moving once picked", () => {
    // Draw it with stories picked
    render(<FocusPicker value={["stories"]} onChange={() => undefined} label="Pick" />);
    // Each button's scene and how much it moves
    const scenes = screen.getAllByRole("button").map((button) => [button.firstChild?.textContent, button.querySelector("[data-scene]")?.getAttribute("data-scene"), button.querySelector("[data-scene]")?.getAttribute("data-motion")]);
    // Confirm each
    expect(scenes).toEqual([["Telling stories", "story", "few"], ["Small talk and conversations", "conversation", "still"], ["Thinking on my feet", "rapid-fire", "still"], ["How I sound", "warm-up", "still"], ["Speaking at work", "short-speech", "still"], ["A talk coming up", "your-talk", "still"]]);
  });

  // The short picker on Today has no scenes
  it("leaves the scenes off the short picker", () => {
    // Draw it short
    const { container } = render(<FocusPicker value={[]} onChange={() => undefined} label="Pick" compact />);
    // Confirm none
    expect(container.querySelectorAll("[data-scene]").length).toBe(0);
  });
});
