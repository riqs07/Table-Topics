// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a component
import { cleanup, render, waitFor } from "@testing-library/react";
// Load the component being checked
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

// Remove drawn components after each check
afterEach(cleanup);

// Group the checks about registering the offline worker
describe("ServiceWorkerRegister", () => {
  // When enabled, the worker file is registered
  it("registers /sw.js when enabled", async () => {
    // A fake service worker container
    const register = vi.fn(async () => ({}));
    // Install the fake on the browser's navigator
    Object.defineProperty(navigator, "serviceWorker", { value: { register }, configurable: true });
    // Draw the component, enabled
    render(<ServiceWorkerRegister enabled />);
    // Confirm the worker was registered
    await waitFor(() => expect(register).toHaveBeenCalledWith("/sw.js"));
  });

  // While developing, the worker stays off so pages are never stale
  it("does nothing when disabled", async () => {
    // A fake service worker container
    const register = vi.fn(async () => ({}));
    // Install the fake
    Object.defineProperty(navigator, "serviceWorker", { value: { register }, configurable: true });
    // Draw the component, disabled
    render(<ServiceWorkerRegister enabled={false} />);
    // Confirm nothing was registered
    expect(register).not.toHaveBeenCalled();
  });
});
