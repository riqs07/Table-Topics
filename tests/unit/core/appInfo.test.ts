// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the app's basic facts that the rest of the app relies on
import { APP_NAME } from "@/core/appInfo";

// Group the checks about the app's basic facts
describe("app info", () => {
  // The app name defaults to VoiceLab until checkpoint C2 says otherwise
  it("names the app VoiceLab", () => {
    // Confirm the shared name constant holds the agreed name
    expect(APP_NAME).toBe("VoiceLab");
  });
});
