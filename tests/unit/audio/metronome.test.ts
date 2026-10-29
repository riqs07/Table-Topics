// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load what is being checked
import { createMetronome } from "@/audio/metronome";

// A stand-in for the browser's sound maker whose clock is moved by hand, noting each tick booked
function fakeSound() {
  // Ticks booked, by their start time
  const started: number[] = [];
  // Whether it was closed
  let closed = false;
  // A parameter that accepts any ramp
  const param = () => ({ value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} });
  // The sound makers made (only ever one)
  const made: { currentTime: number }[] = [];
  // The maker, shaped like AudioContext
  class FakeContext {
    // Asleep until woken, as after a page load
    state = "suspended";
    // The clock
    currentTime = 10;
    // The speaker
    destination = {};
    // Note it as made
    constructor() {
      // So the test can move its clock
      made.push(this);
    }
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
  // Move the clock
  const advance = (seconds: number) => {
    // Each one made
    for (const context of made) context.currentTime += seconds;
  };
  // Hand back the maker and what it saw
  return { maker: FakeContext as unknown as new () => AudioContext, started, closed: () => closed, advance };
}

// Timers run by hand: the check that was set, and whether it was cancelled
function fakeTimers() {
  // The repeating check
  let run: (() => void) | null = null;
  // How many times checks were cancelled
  let cancelled = 0;
  // The timers
  const timers = {
    // Remember the check
    every: (check: () => void) => {
      // Keep it
      run = check;
      // A handle
      return 1;
    },
    // Forget it
    cancel: () => {
      // No more checks
      run = null;
      // Count it
      cancelled += 1;
    },
  };
  // Hand back the timers, a way to run the check, and the count
  return { timers, fire: () => run?.(), running: () => run !== null, cancelled: () => cancelled };
}

// Round times so floating-point sums compare cleanly
const rounded = (times: number[]) => times.map((time) => Math.round(time * 1000) / 1000);

// Group the checks about the metronome player (decision 128)
describe("createMetronome", () => {
  // At 60 beats a minute, a tick every second, booked a little ahead
  it("ticks on every beat at the tempo", () => {
    // The fake sound and timers
    const sound = fakeSound();
    const clock = fakeTimers();
    // A metronome with both
    const metronome = createMetronome(sound.maker, clock.timers);
    // Get ready, as a tap does
    metronome.prime();
    // Start at 60
    metronome.start(60);
    // Three seconds pass, checked every quarter second
    for (let step = 0; step < 12; step += 1) {
      // Time moves on
      sound.advance(0.25);
      // The check runs
      clock.fire();
    }
    // Confirm a tick each second from just after the start
    expect(rounded(sound.started)).toEqual([10.05, 11.05, 12.05, 13.05]);
  });

  // A new tempo while ticking changes the gap from the next beat, without a second set of checks
  it("changes tempo while ticking", () => {
    // The fake sound and timers
    const sound = fakeSound();
    const clock = fakeTimers();
    // A metronome with both
    const metronome = createMetronome(sound.maker, clock.timers);
    // Ready and ticking at 60
    metronome.prime();
    metronome.start(60);
    // Move to 120
    metronome.start(120);
    // Two seconds pass
    for (let step = 0; step < 8; step += 1) {
      // Time moves on
      sound.advance(0.25);
      // The check runs
      clock.fire();
    }
    // Confirm the first beat, then one at the old gap already planned, then half-second gaps
    expect(rounded(sound.started)).toEqual([10.05, 11.05, 11.55, 12.05]);
  });

  // Stopping cancels the checks; closing lets the sound go
  it("stops and closes", () => {
    // The fake sound and timers
    const sound = fakeSound();
    const clock = fakeTimers();
    // A metronome with both
    const metronome = createMetronome(sound.maker, clock.timers);
    // Ready and ticking
    metronome.prime();
    metronome.start(82);
    // Stop, twice (the second does nothing)
    metronome.stop();
    metronome.stop();
    // What was booked so far
    const before = sound.started.length;
    // Time passes with no check
    sound.advance(5);
    clock.fire();
    // Close
    metronome.close();
    // Confirm no checks left, one cancel, nothing more booked, and the sound closed
    expect([clock.running(), clock.cancelled(), sound.started.length, sound.closed()]).toEqual([false, 1, before, true]);
  });

  // A tab that slept does not play a burst of missed beats when it wakes
  it("picks up from now after a long sleep", () => {
    // The fake sound and timers
    const sound = fakeSound();
    const clock = fakeTimers();
    // A metronome with both
    const metronome = createMetronome(sound.maker, clock.timers);
    // Ready and ticking at 60
    metronome.prime();
    metronome.start(60);
    // The tab sleeps for a minute
    sound.advance(60);
    // One check on waking
    clock.fire();
    // Confirm only the first beat and one beat from now
    expect(rounded(sound.started)).toEqual([10.05, 70]);
  });

  // Without sound it does nothing, and never throws
  it("stays quiet where the browser has no sound", () => {
    // Timers that run by hand
    const clock = fakeTimers();
    // A metronome with no sound maker
    const metronome = createMetronome(undefined, clock.timers);
    // Confirm nothing throws, checks included
    expect(() => [metronome.prime(), metronome.start(82), clock.fire(), metronome.stop(), metronome.close()]).not.toThrow();
  });

  // A browser that refuses to make sound leaves it silent rather than broken
  it("stays quiet when the sound maker refuses", () => {
    // A maker that throws
    const refusing = class {
      // As a browser that refuses does
      constructor() {
        // Refuse
        throw new Error("not allowed");
      }
    } as unknown as new () => AudioContext;
    // A metronome with it
    const metronome = createMetronome(refusing, fakeTimers().timers);
    // Confirm nothing throws
    expect(() => [metronome.prime(), metronome.start(82), metronome.close()]).not.toThrow();
  });

  // With nothing given, it uses the browser's own timers and sound maker (none in this test runner)
  it("works with its defaults", () => {
    // A metronome with the real defaults
    const metronome = createMetronome();
    // Confirm it starts and stops cleanly
    expect(() => [metronome.prime(), metronome.start(82), metronome.stop(), metronome.close()]).not.toThrow();
  });
});
