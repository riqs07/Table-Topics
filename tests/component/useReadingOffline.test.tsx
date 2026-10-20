// @vitest-environment jsdom
// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load the tools for running a hook, acting and waiting
import { act, renderHook, waitFor } from "@testing-library/react";
// Load the hook being checked
import { useReading } from "@/components/screens/useReading";

// The speeches' text cannot be fetched (offline, and never saved on this device)
vi.mock("@/content/readings", () => {
  // Fail the load as a missing chunk does
  throw new TypeError("Failed to fetch dynamically imported module");
});

// Group the checks about a text that cannot be loaded (rule T1)
describe("useReading offline", () => {
  // The screen must be able to say so and try again, not wait forever
  it("reports a failed load and can try again", async () => {
    // Ask for a speech part
    const { result } = renderHook(() => useReading("lincoln-second-inaugural-2"));
    // Wait for the failure
    await waitFor(() => expect(result.current.status).toBe("failed"));
    // Try again
    act(() => result.current.retry());
    // Confirm it is loading again (and fails again, since the load still cannot happen)
    const retried = result.current.status;
    // Wait for the second failure
    await waitFor(() => expect(result.current.status).toBe("failed"));
    // Confirm the retry went back to loading and nothing was found
    expect([retried, result.current.passage]).toEqual(["loading", undefined]);
  });
});
