// Load the helper that gives Vitest settings type checking
import { defineConfig } from "vitest/config";
// Load Node's path tools to build the "@" import shortcut
import { fileURLToPath } from "node:url";

// Test runner settings
export default defineConfig({
  // Match the "@/..." import shortcut used in the app code
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // Settings for how tests are found and run
  test: {
    // Look for test files only inside the tests folder
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    // Run in a plain Node environment until component tests need a browser fake
    environment: "node",
  },
});
