// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a component
import { cleanup, render } from "@testing-library/react";
// Load what is being checked
import { BlobCharacter, BlobFace, type BlobMood } from "@/components/script/BlobFace";
// Load the voice shapes that wear the face
import { StartBlob, StatusBlob, VoiceBlob } from "@/components/script/VoiceShapes";

// Remove the drawn component after each check
afterEach(cleanup);

// Every mood
const MOODS: BlobMood[] = ["ready", "listening", "thinking", "celebrating", "hmm", "sleepy"];

// The mood of the face drawn, if any
function moodShown(): string | null {
  // Read it off the face
  return document.querySelector("[data-blob-mood]")?.getAttribute("data-blob-mood") ?? null;
}

// Group the checks about the blob's face (decision 134)
describe("BlobFace", () => {
  // Each mood draws its own features, hidden from screen readers
  it("draws every mood, hidden from screen readers", () => {
    // Draw each and read what it drew
    const drawn = MOODS.map((mood) => {
      // Draw it
      const { container, unmount } = render(<BlobFace mood={mood} />);
      // Its mood, whether hidden, and how many marks it has
      const result = [container.firstElementChild?.getAttribute("data-blob-mood"), container.firstElementChild?.getAttribute("aria-hidden"), container.querySelectorAll("path, ellipse, circle").length > 1];
      // Clear it
      unmount();
      // Hand it back
      return result;
    });
    // Confirm each
    expect(drawn).toEqual(MOODS.map((mood) => [mood, "true", true]));
  });

  // The character adds sparks to a celebration and "z"s to sleep, and nothing to the others
  it("adds sparks when celebrating and z's when asleep", () => {
    // Count the extras for a mood
    const extras = (mood: BlobMood) => {
      // Draw it
      const { container, unmount } = render(<BlobCharacter mood={mood} />);
      // Its sparks and its z's
      const result = [container.querySelectorAll(".motion-safe\\:animate-twinkle").length, container.querySelectorAll(".motion-safe\\:animate-drift").length];
      // Clear it
      unmount();
      // Hand it back
      return result;
    };
    // Confirm each
    expect([extras("celebrating"), extras("sleepy"), extras("ready")]).toEqual([[3, 0], [0, 2], [0, 0]]);
  });
});

// Group the checks about the face on the voice shapes (decision 134)
describe("the voice shapes' face", () => {
  // The large start shape is ready, or puzzled when asked; the small one keeps its microphone
  it("shows on the large start shape only, in the mood asked for", () => {
    // Read the mood for some settings
    const shown = (compact: boolean, mood?: BlobMood) => {
      // Draw it
      const { unmount } = render(<StartBlob label="Start" detail="now" onStart={() => undefined} compact={compact} mood={mood} />);
      // What it shows
      const result = moodShown();
      // Clear it
      unmount();
      // Hand it back
      return result;
    };
    // Confirm the default, the puzzled one, and none when small
    expect([shown(false), shown(false, "hmm"), shown(true)]).toEqual(["ready", "hmm", null]);
  });

  // The live shape listens, and sleeps while paused
  it("listens while recording and sleeps while paused", () => {
    // Read the mood for a pause setting
    const shown = (paused: boolean) => {
      // Draw it
      const { unmount } = render(<VoiceBlob levels={[0.1]} signal="none" clock="0:12" onStop={() => undefined} compact={false} paused={paused} />);
      // What it shows
      const result = moodShown();
      // Clear it
      unmount();
      // Hand it back
      return result;
    };
    // Confirm each
    expect([shown(false), shown(true)]).toEqual(["listening", "sleepy"]);
  });

  // The waiting shape thinks by default
  it("thinks while waiting", () => {
    // Draw it
    render(<StatusBlob label="Saving…" detail="one moment" compact={false} />);
    // Confirm
    expect(moodShown()).toBe("thinking");
  });
});
