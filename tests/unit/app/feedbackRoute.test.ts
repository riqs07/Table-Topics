// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";

// Group the checks about the real route wiring
describe("POST /api/feedback", () => {
  // With no keys set (as in tests and CI), the route explains what is missing instead of crashing
  it("explains missing settings when the server is not set up", async () => {
    // Make sure the AI key is not set
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    // Load the route after changing the environment
    const { POST } = await import("@/app/api/feedback/route");
    // Call it
    const response = await POST(new Request("http://localhost/api/feedback", { method: "POST", body: "{}" }));
    // Confirm a server-setup error
    expect(response.status).toBe(500);
    // Confirm the message names the variable
    expect((await response.json()).error).toContain("ANTHROPIC_API_KEY");
    // Put the environment back
    vi.unstubAllEnvs();
  });
});
