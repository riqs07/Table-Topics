// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a component
import { cleanup, render } from "@testing-library/react";
// Load what is being checked
import { Scene, type SceneName } from "@/components/scenes/Scene";

// Remove the drawn component after each check
afterEach(cleanup);

// Every scene
const NAMES: SceneName[] = ["rapid-fire", "prepared-speech", "read-aloud", "four-three-two", "free-talk", "short-speech", "your-talk", "story", "tell-again", "guided-stories", "moment", "conversation", "warm-up", "learn"];

// Group the checks about the blob scenes (decision 136)
describe("Scene", () => {
  // Each scene draws the warm blob and at least one moving part, hidden from screen readers, on the 120 square
  it("draws every scene with a blob and something that moves", () => {
    // Draw each and read what it drew
    const drawn = NAMES.map((name) => {
      // Draw it
      const { container, unmount } = render(<Scene name={name} />);
      // Its root
      const svg = container.querySelector("svg");
      // Its name, whether hidden, its square, whether it has the blob and a moving part
      const result = [svg?.getAttribute("data-scene"), svg?.getAttribute("aria-hidden"), svg?.getAttribute("viewBox"), !!container.querySelector("path.fill-warm"), container.querySelectorAll(".s-move").length > 0];
      // Clear it
      unmount();
      // Hand it back
      return result;
    });
    // Confirm each
    expect(drawn).toEqual(NAMES.map((name) => [name, "true", "0 0 120 120", true, true]));
  });

  // How much it moves is carried for the styles to read: always by default, or a few rounds, or only blinking
  it("carries how much it moves", () => {
    // Read the setting for each choice
    const motion = (choice?: "few" | "still") => {
      // Draw it
      const { container, unmount } = render(<Scene name="rapid-fire" motion={choice} />);
      // The setting
      const result = container.querySelector("svg")?.getAttribute("data-motion");
      // Clear it
      unmount();
      // Hand it back
      return result;
    };
    // Confirm the default and the two others
    expect([motion(), motion("few"), motion("still")]).toEqual(["loop", "few", "still"]);
  });

  // The second blob in a conversation is the accent, its face in the accent's ink, so the two read as different people
  it("draws the other person in the conversation in the accent", () => {
    // Draw it
    const { container } = render(<Scene name="conversation" />);
    // Confirm one warm and one accent blob, with the accent's face colour
    expect([container.querySelectorAll("path.fill-warm").length, container.querySelectorAll("path.fill-accent").length, !!container.querySelector(".text-accent-ink")]).toEqual([1, 1, true]);
  });
});

// Group the checks about the carried-over scene's name (decision 141)
describe("sceneTransitionName", () => {
  // One name per scene, so the Practice card and the start screen pair up
  it("names each scene's transition after it", async () => {
    // Load it
    const { sceneTransitionName } = await import("@/components/scenes/SharedScene");
    // Confirm
    expect([sceneTransitionName("rapid-fire"), sceneTransitionName("free-talk")]).toEqual(["scene-rapid-fire", "scene-free-talk"]);
  });
});
