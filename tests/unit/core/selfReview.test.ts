// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the listening tools being checked
import { listenWords, listenedEnough, markHeard, nothingHeard, playFrom, wordsSaidBy } from "@/core/selfReview";

// Group the checks about how much of a recording has been heard
describe("listenedEnough", () => {
  // Every second heard opens the feedback
  it("is true once the whole recording was heard", () => {
    // A 20-second recording, heard second by second
    let heard = nothingHeard(20);
    // Play it through
    for (let second = 0; second < 20; second++) heard = markHeard(heard, second + 0.3);
    // Confirm
    expect(listenedEnough(heard, 20)).toBe(true);
  });

  // Half a recording is not enough
  it("is false after only half", () => {
    // Half of 20 seconds
    let heard = nothingHeard(20);
    // Play the first ten
    for (let second = 0; second < 10; second++) heard = markHeard(heard, second);
    // Confirm
    expect(listenedEnough(heard, 20)).toBe(false);
  });

  // A long recording opens with its first and last 45 seconds
  it("accepts the opening and the close of a long recording", () => {
    // A five-minute recording
    let heard = nothingHeard(300);
    // The first and last 45 seconds
    for (const second of [...Array.from({ length: 45 }, (_, index) => index), ...Array.from({ length: 45 }, (_, index) => 255 + index)]) heard = markHeard(heard, second);
    // Confirm, and that a short recording does not get the same allowance
    expect([listenedEnough(heard, 300), listenedEnough(markHeard(nothingHeard(100), 0), 100)]).toEqual([true, false]);
  });

  // A time past the end counts as the last second
  it("keeps marks inside the recording", () => {
    // Confirm the last second is marked
    expect(markHeard(nothingHeard(3), 7)).toEqual([false, false, true]);
  });
});

// Group the checks about the transcript during listening
describe("listenWords", () => {
  // Words split at spaces, with fillers marked
  it("splits at spaces and marks fillers", () => {
    // Confirm the words and marks
    expect(listenWords("Um, I went home, you know.")).toEqual([
      { text: "Um,", filler: true },
      { text: "I", filler: false },
      { text: "went", filler: false },
      { text: "home,", filler: false },
      { text: "you", filler: true },
      { text: "know.", filler: true },
    ]);
  });
});

// Group the checks about following the playback
describe("following the playback", () => {
  // Words count as said once their time, less the lag, has passed
  it("counts the words said so far, allowing for the lag", () => {
    // Words at 1, 2 and 3 seconds; at 1.5 seconds of playback the first two were said
    expect(wordsSaidBy([1, 2, 3], 1.5)).toBe(2);
  });

  // Tapping a word plays from a little before it, never before the start
  it("plays from a little before a word", () => {
    // Confirm 3.0 becomes 1.7, and an early word starts at 0
    expect([playFrom(3), playFrom(0.5)]).toEqual([1.7, 0]);
  });
});
