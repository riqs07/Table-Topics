// @vitest-environment jsdom
// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the tools for running a hook and waiting
import { renderHook, waitFor } from "@testing-library/react";
// Load the hook being checked
import { useReading } from "@/components/screens/useReading";
// Load the short passages
import { PASSAGES } from "@/content/prompts";

// Group the checks about loading a text to read (decision 88)
describe("useReading", () => {
  // A short passage is part of the first download, so it is there at once
  it("gives a short passage at once", () => {
    // Ask for the first passage
    const { result } = renderHook(() => useReading(PASSAGES[0]!.id));
    // Confirm it is ready with its text
    expect([result.current.status, result.current.passage?.body]).toEqual(["ready", PASSAGES[0]!.body]);
  });

  // A part of a full speech loads the speeches' text first, then gives the part
  it("loads a speech part's text", async () => {
    // Ask for the second part of Lincoln's Second Inaugural
    const { result } = renderHook(() => useReading("lincoln-second-inaugural-2"));
    // At first it is loading
    const first = result.current.status;
    // Wait for the text
    await waitFor(() => expect(result.current.status).toBe("ready"));
    // Confirm it loaded, with the part's title and some text
    expect([first, result.current.passage?.title, (result.current.passage?.body.length ?? 0) > 0]).toEqual(["loading", "Second Inaugural Address, part 2 of 7", true]);
  });

  // No id, or an id that names no text, gives nothing and nothing to wait for
  it("gives nothing for no id or an unknown one", () => {
    // Ask for none, and for an unknown id
    const none = renderHook(() => useReading(null)).result.current;
    const unknown = renderHook(() => useReading("no-such-text")).result.current;
    // Confirm both are ready with no passage
    expect([none.status, none.passage, unknown.status, unknown.passage]).toEqual(["ready", undefined, "ready", undefined]);
  });
});
