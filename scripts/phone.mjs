// `pnpm phone`: start the app and a Cloudflare tunnel together, then print the https link to open on a phone (Ctrl+C stops both).
// Plain Node with no dependencies, like `pnpm fresh`. Needs cloudflared installed (on a Mac: brew install cloudflared).

// Load Node's tools for running other commands
import { spawn, spawnSync } from "node:child_process";

// Whether this is Windows (where the shell finds pnpm.cmd)
const windows = process.platform === "win32";
// How long to wait for the app to start, in seconds
const APP_WAIT_SEC = 120;
// How long to wait for the tunnel's link, in seconds
const TUNNEL_WAIT_SEC = 60;

// Check cloudflared is installed before starting anything
const check = spawnSync("cloudflared", ["--version"], { stdio: "ignore", shell: windows });
// Not installed: say how to get it, and stop
if (check.status !== 0) {
  // How to install it
  console.error("\n✗ cloudflared is not installed. On a Mac run: brew install cloudflared\n  (Windows: winget install --id Cloudflare.cloudflared). Then run pnpm phone again.\n");
  // Stop
  process.exit(1);
}

// The running app and tunnel, so both can be stopped together
const children = [];
// Whether things are shutting down
let stopping = false;

// Stop both and leave, with the given exit code
function stopAll(code = 0) {
  // Only once
  if (stopping) return;
  // Mark it
  stopping = true;
  // Stop each child that is still running
  for (const child of children) if (child.exitCode === null) child.kill("SIGINT");
  // Give them a moment to close, then leave
  setTimeout(() => process.exit(code), 1500);
}

// Ctrl+C stops both
process.on("SIGINT", () => stopAll(0));
// So does closing the window
process.on("SIGTERM", () => stopAll(0));

// Print a line from a child with a short label in front, so the two can be told apart
function prefixed(label, chunk) {
  // Nothing once shutting down (pnpm's "Command failed" on Ctrl+C is not a real failure)
  if (stopping) return;
  // Each non-empty line
  for (const line of String(chunk).split("\n")) if (line.trim()) console.log(`${label} ${line}`);
}

// Wait until the app answers at its address, or give up after a while
async function waitForApp(url) {
  // Try once a second
  for (let second = 0; second < APP_WAIT_SEC; second++) {
    // Ask for the home page
    try {
      // Any answer means it is up
      await fetch(url);
      // Ready
      return true;
    } catch {
      // Not yet: wait a second
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  // Gave up
  return false;
}

// Start the app
console.log("\n→ Starting the app (this can take a little while the first time)");
// The development server, with its output shown under an [app] label; it accepts Cloudflare quick tunnels only while this script runs (plain `pnpm dev` accepts none unless DEV_TUNNEL_HOST names one; decision 87)
const app = spawn("pnpm", ["dev"], { shell: windows, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, DEV_TUNNEL_HOST: process.env.DEV_TUNNEL_HOST || "*.trycloudflare.com" } });
// Keep it to stop later
children.push(app);
// The address the app reports (it picks another port if 3000 is busy)
let appUrl = null;
// Show the app's output, and note its address when it says it
const onAppOutput = (chunk) => {
  // Show it
  prefixed("[app]", chunk);
  // The local address, once
  const found = !appUrl && /http:\/\/localhost:(\d+)/.exec(String(chunk));
  // Start the tunnel when the address is known
  if (found) {
    // Note it
    appUrl = `http://localhost:${found[1]}`;
    // Open the tunnel once the app answers
    void openTunnel(appUrl);
  }
};
// Normal output
app.stdout.on("data", onAppOutput);
// Warnings and errors
app.stderr.on("data", onAppOutput);
// If the app stops, stop everything
app.on("exit", (code) => {
  // Say so, unless shutting down anyway
  if (!stopping) console.error(`\n✗ The app stopped (code ${code}). See the [app] lines above.`);
  // Stop the tunnel too
  stopAll(code ?? 1);
});

// Open the tunnel to the app and print its link
async function openTunnel(url) {
  // Wait for the app to answer
  if (!(await waitForApp(url))) {
    // It never did
    console.error(`\n✗ The app did not start within ${APP_WAIT_SEC} seconds. See the [app] lines above.`);
    // Give up
    return stopAll(1);
  }
  // Say what is happening
  console.log("\n→ Opening the tunnel");
  // The quick tunnel (no account needed)
  const tunnel = spawn("cloudflared", ["tunnel", "--no-autoupdate", "--url", url], { shell: windows, stdio: ["ignore", "pipe", "pipe"] });
  // Keep it to stop later
  children.push(tunnel);
  // Whether the link has been found
  let link = null;
  // Look for the link in the tunnel's output, showing only its errors
  const onTunnelOutput = (chunk) => {
    // The text
    const text = String(chunk);
    // Errors are worth seeing
    for (const line of text.split("\n")) if (/\bERR\b|error/i.test(line)) console.log(`[tunnel] ${line}`);
    // The link, once
    const found = !link && /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(text);
    // Print it when found
    if (found) {
      // Note it
      link = found[0];
      // Show it
      announce(link);
    }
  };
  // Normal output
  tunnel.stdout.on("data", onTunnelOutput);
  // cloudflared writes its log here
  tunnel.stderr.on("data", onTunnelOutput);
  // If the tunnel stops, stop everything
  tunnel.on("exit", (code) => {
    // Say so, unless shutting down anyway
    if (!stopping) console.error(`\n✗ The tunnel stopped (code ${code}). Run pnpm phone again.`);
    // Stop the app too
    stopAll(code ?? 1);
  });
  // Give up if no link arrives
  setTimeout(() => {
    // Still none
    if (!link && !stopping) {
      // Say so
      console.error(`\n✗ No tunnel link after ${TUNNEL_WAIT_SEC} seconds. Check your internet connection, then run pnpm phone again.`);
      // Stop
      stopAll(1);
    }
  }, TUNNEL_WAIT_SEC * 1000);
}

// Print the link where it cannot be missed, and copy it on a Mac
function announce(link) {
  // A ruled box
  const rule = "=".repeat(link.length + 8);
  // Copied to the clipboard on a Mac (it then pastes on an iPhone signed in to the same Apple ID)
  const copied = process.platform === "darwin" && spawnSync("pbcopy", { input: link }).status === 0;
  // The box and what to do
  console.log(`\n${rule}\n    ${link}\n${rule}`);
  // How to use it
  console.log(`\n  Open this link on your phone (Safari on iPhone, Chrome on Android).${copied ? "\n  It is copied: paste it on your iPhone, or in a message to yourself." : ""}\n  It can take 20 to 30 seconds before it opens. A new link is made each time.\n  Press Ctrl+C here to stop the app and the tunnel.\n`);
}
