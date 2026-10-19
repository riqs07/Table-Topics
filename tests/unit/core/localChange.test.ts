// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the picker being checked
import { localChange } from "@/core/localChange";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// A steady, comfortable session with nothing to fix (no loudness readings)
const STEADY = { mode: "talk" as const, durationSec: 80, fillersPerMinute: 1, wordsPerMinute: 140, focus: "pausing" };

// Group the checks about picking one change from the numbers
describe("localChange", () => {
  // Timing comes first for a Table Topic
  it("starts with timing outside the window", () => {
    // Short, with many fillers too
    const short = localChange(makeSession({ ...STEADY, durationSec: 48, fillersPerMinute: 6 }));
    // Long
    const long = localChange(makeSession({ ...STEADY, durationSec: 170 }));
    // Confirm both are about timing
    expect([short.change, long.change]).toEqual(["Keep going a little longer: you spoke for 0:48, and the window opens at 1:00.", "Wrap up sooner: you spoke for 2:50, past the 2:00 mark."]);
  });

  // Then fillers, then pace
  it("picks fillers before pace, and pace when fillers are few", () => {
    // Many fillers and fast
    const fillers = localChange(makeSession({ ...STEADY, fillersPerMinute: 4.2, wordsPerMinute: 190 }));
    // Fast only
    const fast = localChange(makeSession({ ...STEADY, wordsPerMinute: 190 }));
    // Slow only
    const slow = localChange(makeSession({ ...STEADY, wordsPerMinute: 95 }));
    // Confirm each
    expect([fillers.change, fast.change.startsWith("Slow down a little: 190 words"), slow.change.startsWith("Keep the words moving: 95 words")]).toEqual(["Swap pause words for a silent pause: 4.2 a minute were counted.", true, true]);
  });

  // With pause words hidden, they are never the change; for a speaker who stammers, slow pace is not judged either (decision 79)
  it("leaves pause words and fluency alone when asked", () => {
    // Many pause words and slow
    const session = makeSession({ ...STEADY, fillersPerMinute: 4.2, wordsPerMinute: 95 });
    // Hidden pause words: slow pace comes next
    const hidden = localChange(session, { pauseWords: false });
    // A speaker who stammers: neither
    const stammer = localChange(session, { pauseWords: false, fluency: false });
    // Confirm
    expect([hidden.change.startsWith("Keep the words moving"), stammer.change.startsWith("Swap"), stammer.change.startsWith("Keep the words moving")]).toEqual([true, false, false]);
  });

  // With loudness readings, too few pauses in a longer session
  it("asks for pauses when a longer session had none", () => {
    // Forty seconds of steady speech, no gaps
    const change = localChange(makeSession({ ...STEADY, durationSec: 40, mode: "read", loudness: Array<number>(400).fill(0.3) }));
    // Confirm the pause change and its cue
    expect([change.change, change.retryCue]).toEqual(["Give the listener a moment: there were no pauses longer than 0.6 seconds.", "Pause for a full second after each main point."]);
  });

  // Nothing stands out: the week's focus
  it("falls back to the week's focus", () => {
    // A steady session
    const change = localChange(makeSession(STEADY));
    // Confirm the focus, with its description as the cue
    expect([change.change, change.retryCue]).toEqual(["Nothing stood out in the numbers. Keep working on this week's focus: pausing.", "Pause between ideas instead of filling the gap."]);
  });
});
