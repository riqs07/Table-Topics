// `pnpm fresh`: get the latest code, install any new packages, clear the build cache, and start the app.
// Plain Node with no dependencies, so it works even when packages are missing. Works on Mac, Windows, and Linux.

// Load Node's tool for running other commands
import { spawnSync } from "node:child_process";
// Load Node's tool for deleting folders
import { rmSync } from "node:fs";

// Run one command, showing its output, and stop everything if it fails
function run(label, command, args) {
  // Say what is happening
  console.log(`\n→ ${label}`);
  // Run the command in this window (the shell finds pnpm.cmd on Windows)
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  // Stop with a clear message if it failed
  if (result.status !== 0) {
    // Explain which step failed
    console.error(`\n✗ "${label}" failed. Fix the problem above, then run pnpm fresh again.`);
    // Exit with the same failure code
    process.exit(result.status ?? 1);
  }
}

// Get the latest code from GitHub (stops if you have local changes that would conflict)
run("Getting the latest code", "git", ["pull", "--ff-only"]);
// Install exactly the package versions in the lockfile
run("Installing packages", "pnpm", ["install", "--frozen-lockfile"]);
// Say what is happening
console.log("\n→ Clearing the build cache");
// Delete the cached build so it cannot point at old packages
rmSync(".next", { recursive: true, force: true });
// Start the app (runs until you press Ctrl+C)
run("Starting the app at http://localhost:3000", "pnpm", ["dev"]);
