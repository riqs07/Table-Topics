// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
// Load the recorder being checked
import { QuickRecorder } from "@/components/script/QuickRecorder";
// Load the recording contracts
import type { LiveText, RecordingServices } from "@/audio/services";

// Remove drawn screens after each check
afterEach(() => cleanup());

// Stand-in recording pieces the check can drive: words arrive when the check says them
function fakeServices() {
  // The words callback the recorder gave the transcriber
  let onText: (text: LiveText) => void = () => {};
  // The services
  const services: RecordingServices = {
    // Speech is supported
    speechSupported: () => true,
    // A stand-in microphone
    openMicrophone: async () => ({ getTracks: () => [] }) as unknown as MediaStream,
    // A transcriber that keeps the callback and hands back fixed final words
    createTranscriber: () => ({ start: (text) => void (onText = text), stop: async () => "I would ask what they enjoyed most" }),
    // A capture with fixed audio
    createCapture: () => ({ level: () => 0.5, stop: async () => new Blob(["voice"]) }),
  };
  // Hand back the services and a way to say words
  return { services, say: (text: LiveText) => act(() => onText(text)) };
}

// Group the checks about the small recorder
describe("QuickRecorder", () => {
  // Your own words are never read back while the microphone is on; the final words are announced once at the end (round 5)
  it("does not read your words aloud while recording, and announces them once when done", async () => {
    // Stand-ins
    const fake = fakeServices();
    // Draw the recorder
    render(<QuickRecorder services={fake.services} action="Say it" />);
    // Start
    fireEvent.click(screen.getByRole("button", { name: "Say it" }));
    // Wait for recording
    await screen.findByRole("button", { name: "Stop" });
    // Words arrive
    fake.say({ final: "I would ask", interim: "what they" });
    // The words on screen
    const words = screen.getByTestId("quick-words");
    // Whether they sit inside anything a screen reader reads out as it changes
    const live = !!words.closest("[aria-live], [role=status], [role=alert], [role=log]");
    // What the announcement says while recording, and the words shown then
    const during = [screen.getByRole("status").textContent, words.textContent];
    // Stop
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    // Wait for the end
    await screen.findByRole("button", { name: "Try again" });
    // Confirm: words shown but not live, nothing announced while recording, then the final words once
    expect([live, during, screen.getByRole("status").textContent]).toEqual([false, ["", "I would ask what they"], "You said: I would ask what they enjoyed most"]);
  });
});
