// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the assembler being checked
import { TranscriptAssembler, type RecognitionResult } from "@/audio/transcriptAssembler";

// Build a result list the way the browser reports it: [text, isFinal] pairs
const results = (...items: Array<[string, boolean]>): RecognitionResult[] => items.map(([transcript, isFinal]) => ({ transcript, isFinal }));

// Group the checks about stitching the live transcript together
describe("TranscriptAssembler", () => {
  // Final and not-yet-final words are kept apart
  it("separates final words from words still being heard", () => {
    // Make an assembler
    const assembler = new TranscriptAssembler();
    // The browser reports one final and one interim result
    assembler.update(results(["So I went home", true], [" and saw a", false]));
    // Confirm the parts
    expect(assembler.current()).toEqual({ final: "So I went home", interim: "and saw a" });
  });

  // The browser re-sends every result each time; nothing is doubled
  it("does not double words when the browser repeats its results", () => {
    // Make an assembler
    const assembler = new TranscriptAssembler();
    // First update
    assembler.update(results(["Hello", true]));
    // Second update repeats the first result and adds one
    assembler.update(results(["Hello", true], [" there", true]));
    // Confirm each word appears once
    expect(assembler.current().final).toBe("Hello there");
  });

  // The recognizer stops on its own every so often; words from before a restart are kept
  it("keeps earlier words when the recognizer restarts", () => {
    // Make an assembler
    const assembler = new TranscriptAssembler();
    // Words before the restart
    assembler.update(results(["First part", true], [" half heard", false]));
    // The recognizer restarts (its own list starts empty again)
    assembler.restart();
    // Words after the restart
    assembler.update(results(["second part", true]));
    // Confirm both parts are kept, and the half-heard words were let go
    expect(assembler.finish()).toBe("First part second part");
  });

  // When stopping, words still being heard are kept rather than lost
  it("keeps the last unfinished words when finishing", () => {
    // Make an assembler
    const assembler = new TranscriptAssembler();
    // A final and an interim result
    assembler.update(results(["I think", true], [" that is all", false]));
    // Confirm finishing keeps both
    expect(assembler.finish()).toBe("I think that is all");
  });
});
