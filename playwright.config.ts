// Browser checks: run the real app in Chromium the way a user would (playbook rules T5, T10, T11)
import { defineConfig, devices } from "@playwright/test";

// The port the app runs on for these checks, apart from the usual 3000 (setup rule S2)
const PORT = 3111;

// Settings for the browser suite
export default defineConfig({
  // The browser checks live apart from the unit and screen tests
  testDir: "tests/e2e",
  // Browser check files end in .spec.ts so the unit test runner ignores them
  testMatch: "**/*.spec.ts",
  // Recordings wait in real time, so allow a minute per check
  timeout: 60_000,
  // Fail CI if a check was left marked "only"
  forbidOnly: Boolean(process.env.CI),
  // No automatic retries: a check that fails once is a real failure (playbook: "flake" is not a cause)
  retries: 0,
  // Print one line per check, and the full error on failure
  reporter: "list",
  // Settings shared by every check
  use: {
    // Where the app is served
    baseURL: `http://localhost:${PORT}`,
    // Let the stand-in microphone be used without a prompt
    permissions: ["microphone"],
    // Keep a trace of a failed check for debugging
    trace: "retain-on-failure",
    // Use a locally installed Chromium when one is named, otherwise Playwright's own
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  // Desktop Chromium; phone width is checked inside the page checks
  projects: [
    // A desktop browser
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  // Start the production build before the checks (run `pnpm build` first)
  webServer: {
    // Serve the built app
    command: `pnpm exec next start --port ${PORT}`,
    // Wait until the home page answers
    url: `http://localhost:${PORT}`,
    // Reuse a server that is already running, except in CI
    reuseExistingServer: !process.env.CI,
    // Starting can take a little while
    timeout: 60_000,
  },
});
