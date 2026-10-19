// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load what is being checked
import { createCuePlayer } from "@/audio/timingTones";

// A stand-in for the browser's sound maker that counts the tones started
function fakeSound() {
  // Tones started, by their start time
  const started: number[] = [];
  // Whether it was closed
  let closed = false;
  // A parameter that accepts any ramp
  const param = () => ({ value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} });
  // The maker, shaped like AudioContext
  class FakeContext {
    // Asleep until woken, as after a page load
    state = "suspended";
    // The clock
    currentTime = 10;
    // The speaker
    destination = {};
    // Wake it
    resume = vi.fn(async () => void (this.state = "running"));
    // Close it
    close = async () => void (closed = true);
    // A tone that notes when it starts
    createOscillator() {
      // The tone
      return { type: "", frequency: param(), connect: (node: unknown) => node, start: (at: number) => void started.push(at), stop: () => {} };
    }
    // A volume control that passes on to the next node
    createGain() {
      // The control
      return { gain: param(), connect: (node: unknown) => node };
    }
  }
  // Hand back the maker and what it saw
  return { maker: FakeContext as unknown as new () => AudioContext, started, closed: () => closed };
}

// Group the checks about the timing tone player (decision 77)
describe("createCuePlayer", () => {
  // Primed during a tap, it plays one tone or two, and buzzes where it can
  it("plays one tone or two, with a buzz", () => {
    // The fake sound
    const sound = fakeSound();
    // The buzzes asked for
    const buzzes: number[][] = [];
    // A player with both
    const player = createCuePlayer(sound.maker, (pattern) => buzzes.push(pattern) > 0);
    // Get ready, as the start tap does
    player.prime();
    // One, then two
    player.play("one");
    player.play("two");
    // Close
    player.close();
    // Confirm three tones (two together), two buzzes, and closing
    expect([sound.started, buzzes, sound.closed()]).toEqual([[10, 10, 10.3], [[120], [120, 120, 120]], true]);
  });

  // Without sound or vibration it does nothing, and never throws
  it("stays quiet where the browser has neither", () => {
    // A player with nothing
    const player = createCuePlayer(undefined, undefined);
    // Confirm nothing throws
    expect(() => [player.prime(), player.play("two"), player.close()]).not.toThrow();
  });
});
