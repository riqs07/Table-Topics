// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
// Load the tool for acting like a user
import userEvent from "@testing-library/user-event";
// Load the screen being checked
import { SettingsScreen } from "@/components/screens/SettingsScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the export builder
import { buildExport } from "@/data/exportFile";
// Load a sample session builder
import { makeSession } from "../support/fixtures";
// Load the passphrase storage
import { readPassphrase } from "@/data/passphrase";

// A fixed "now"
const NOW = new Date(2026, 9, 13, 18);

// Remove the drawn screen after each check
afterEach(cleanup);

// Make a repository with one session in it
async function repositoryWithOneSession() {
  // Wrap an empty store
  const repository = createRepository(new MemoryStore());
  // Save one session
  await repository.saveSession(makeSession({ id: "s1" }));
  // Hand it back
  return repository;
}

// Group the checks about the Settings screen
describe("SettingsScreen", () => {
  // From three sessions, "Your week" under Your progress: three weeks of pause words, one suggestion and the way to History (decisions 78 and 140)
  it("shows your week under your progress", async () => {
    // A repository with three sessions over two weeks
    const repository = createRepository(new MemoryStore());
    // Two weeks ago, last week and today
    for (const [index, day] of [29, 6, 12].entries()) await repository.saveSession(makeSession({ id: `w${index}`, mode: "talk", fillersPerMinute: 4 - index, createdAt: new Date(2026, day > 20 ? 8 : 9, day, 9).toISOString() }));
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // The card, inside the progress group
    const card = within(await within(screen.getByRole("region", { name: "Your progress" })).findByRole("region", { name: "Your week" }));
    // Confirm the weeks, the suggestion and the history link
    expect([card.getAllByRole("listitem").map((item) => item.getAttribute("aria-label")), !!card.getByText(/Fewer pause words than last week/), card.getByRole("link", { name: "All your history" }).getAttribute("href")]).toEqual([["Two weeks ago: 4.0", "Last week: 3.0", "This week: 2.0"], true, "/history"]);
  });

  // Fewer than three sessions: no card yet
  it("leaves your week out before three sessions", async () => {
    // Draw the screen with one session
    render(<SettingsScreen repository={await repositoryWithOneSession()} now={NOW} />);
    // Wait for the settings to load
    await screen.findByText("Your practice time");
    // Confirm no card
    expect(screen.queryByRole("region", { name: "Your week" })).toBeNull();
  });

  // A storage failure while reading sessions leaves the card out and keeps the page working
  it("leaves your week out when the sessions cannot be read", async () => {
    // A repository whose session list fails
    const repository = await repositoryWithOneSession();
    // (the failure)
    vi.spyOn(repository, "listSessions").mockRejectedValue(new Error("database closed"));
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // The rest of the page still loads
    await screen.findByText("Your practice time");
    // Confirm no card
    expect(screen.queryByRole("region", { name: "Your week" })).toBeNull();
  });

  // Exporting saves a file and remembers the day, which Settings shows (decision 64)
  it("says when the last copy was saved", async () => {
    // Start from nothing saved
    localStorage.clear();
    // Stand in for the browser's file pieces
    Object.assign(URL, { createObjectURL: () => "blob:copy", revokeObjectURL: () => undefined });
    // Draw the screen
    render(<SettingsScreen repository={await repositoryWithOneSession()} now={NOW} />);
    // Before: no copy yet
    const before = !!(await screen.findByText(/No copy saved yet/));
    // Export
    await userEvent.click(screen.getByRole("button", { name: "Export my data" }));
    // Confirm the words change and the day is remembered
    expect([before, !!(await screen.findByText(/Last copy saved today/)), localStorage.getItem("voicelab-last-export")]).toEqual([true, true, "2026-10-13"]);
  });

  // A big export shows how far it has got, and the file is compact JSON in parts (decision 99)
  it("shows progress while exporting and writes a compact file", async () => {
    // The file's parts, kept when the page makes the file
    let parts: BlobPart[] = [];
    // Stand in for the browser's file pieces, keeping what the file is made of
    const RealBlob = Blob;
    // (the stand-in)
    Object.assign(globalThis, { Blob: class extends RealBlob { constructor(content?: BlobPart[], options?: BlobPropertyBag) { super(content, options); if (options?.type === "application/json") parts = content ?? []; } } });
    // (download pieces)
    Object.assign(URL, { createObjectURL: () => "blob:copy", revokeObjectURL: () => undefined });
    // A repository with 450 sessions
    const repository = createRepository(new MemoryStore());
    // (saved)
    for (let index = 0; index < 450; index += 1) await repository.saveSession(makeSession({ id: `s${index}`, feedbackStatus: "done" }));
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // Export
    await userEvent.click(await screen.findByRole("button", { name: "Export my data" }));
    // The progress line while it runs, with its bar
    const said = (await screen.findByText(/Exporting your data… \d+%/)).textContent ?? "";
    // Finished
    await screen.findByText("Exported 450 sessions. Recordings are not included.");
    // The file's text
    const text = (parts as string[]).join("");
    // Put the real file pieces back
    Object.assign(globalThis, { Blob: RealBlob });
    // Confirm the progress line, a file in several parts, no pretty-printing, and every session in it
    expect([/Exporting your data… \d+%/.test(said), parts.length > 5, text.includes("\n"), (JSON.parse(text) as { sessions: unknown[] }).sessions.length]).toEqual([true, true, false, 450]);
  });

  // Light or dark: applied straight away, remembered, and back to the device's choice
  it("switches between light, dark and the device's choice", async () => {
    // Start from nothing saved
    localStorage.clear();
    // Draw the screen
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Auto (following the device) is chosen to begin with (decision 89)
    const start = screen.getByRole("button", { name: "Auto" }).getAttribute("aria-pressed");
    // Choose dark
    await userEvent.click(await screen.findByRole("button", { name: "Dark" }));
    // What the page and storage say after dark
    const dark = [document.documentElement.getAttribute("data-mode"), localStorage.getItem("voicelab-color-mode"), screen.getByRole("button", { name: "Dark" }).getAttribute("aria-pressed")];
    // Choose light
    await userEvent.click(screen.getByRole("button", { name: "Light" }));
    // What the page and storage say after light
    const light = [document.documentElement.getAttribute("data-mode"), localStorage.getItem("voicelab-color-mode")];
    // Back to following the device
    await userEvent.click(screen.getByRole("button", { name: "Auto" }));
    // Confirm the device first, then dark, then light, then the device again with nothing stored
    expect([start, dark, light, [document.documentElement.getAttribute("data-mode"), localStorage.getItem("voicelab-color-mode")]]).toEqual(["true", ["dark", "dark", "true"], [null, "light"], ["system", null]]);
  });

  // Timing tones are off until switched on, and the choice is kept in this browser (decision 77)
  it("switches timing tones on and off", async () => {
    // Start from nothing saved
    localStorage.clear();
    // Draw the screen
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // The switch
    const toggle = await screen.findByRole("checkbox", { name: /Timing tones/ });
    // Off to begin with
    const start = (toggle as HTMLInputElement).checked;
    // Switch on
    await userEvent.click(toggle);
    // What storage says
    const on = localStorage.getItem("voicelab-timing-tones");
    // Switch off
    await userEvent.click(toggle);
    // Confirm off, on, then off with nothing stored
    expect([start, on, localStorage.getItem("voicelab-timing-tones")]).toEqual([false, "on", null]);
  });

  // A practice time is saved from a quick pick, and the reminder downloads a calendar file (decision 78)
  it("saves a practice time and makes a calendar reminder", async () => {
    // Stand in for the browser's object URLs
    Object.assign(URL, { createObjectURL: vi.fn(() => "blob:reminder"), revokeObjectURL: vi.fn() });
    // Catch the download instead of navigating
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    // A repository
    const repository = createRepository(new MemoryStore());
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // Pick a moment
    await userEvent.click(await screen.findByRole("button", { name: "before bed" }));
    // Make the reminder
    await userEvent.click(screen.getByRole("button", { name: "Add a daily reminder to my calendar" }));
    // The saved settings
    const saved = await repository.getSettings(NOW);
    // Confirm the moment and time were saved, and a file was handed over
    expect([saved.anchor, saved.reminderTime, click.mock.calls.length]).toEqual(["before bed", "08:00", 1]);
    // Put clicking back
    click.mockRestore();
  });

  // The run on Today can be hidden (decision 78)
  it("hides the practice days on Today", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // The switch, on to begin with
    const toggle = await screen.findByRole("checkbox", { name: /Show my practice days/ });
    // Read it
    const start = (toggle as HTMLInputElement).checked;
    // Switch it off
    await userEvent.click(toggle);
    // Confirm on, then saved as hidden
    await waitFor(async () => expect([start, (await repository.getSettings(NOW)).hideStreak]).toEqual([true, true]));
  });

  // What to get better at can be changed here at any time, one or two areas (decision 97)
  it("saves what you want to get better at", async () => {
    // A repository with stories picked at the welcome
    const repository = createRepository(new MemoryStore());
    // The earlier answer
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), practiceFocus: ["stories"] });
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // The choices
    const group = await screen.findByRole("group", { name: "What you want to get better at" });
    // Add work, then take stories off
    await userEvent.click(within(group).getByRole("button", { name: /^Speaking at work/ }));
    // Take stories off
    await userEvent.click(within(group).getByRole("button", { name: /^Telling stories/ }));
    // Confirm saved, and what was said
    await waitFor(async () => expect([(await repository.getSettings(NOW)).practiceFocus, screen.getByRole("status").textContent]).toEqual([["work"], "Saved. Today’s practice follows it."]));
  });

  // "I stammer" switches pause-word counts off with it, and both are saved (decision 79)
  it("saves I stammer and the pause-word counts switch", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // Switch counts off, then on again
    const counts = await screen.findByRole("checkbox", { name: /Show pause-word counts/ });
    // Off
    await userEvent.click(counts);
    // Read what was saved
    const off = (await repository.getSettings(NOW)).showPauseWords;
    // Back on
    await userEvent.click(counts);
    // Switch "I stammer" on
    await userEvent.click(screen.getByRole("checkbox", { name: /I stammer/ }));
    // Confirm counts were off then on, stammer is saved, and the counts box now reads off
    await waitFor(async () => expect([off, (await repository.getSettings(NOW)).stammer, (screen.getByRole("checkbox", { name: /Show pause-word counts/ }) as HTMLInputElement).checked]).toEqual([false, true, false]));
  });

  // Deleting everything takes two deliberate taps
  it("deletes all data only after confirming", async () => {
    // Make a repository with data
    const repository = await repositoryWithOneSession();
    // Notes this browser keeps outside the database: a progress note that must go, and the passphrase that stays
    localStorage.setItem("voicelab-steps-ticked", "2026-10-13:1");
    // (the passphrase)
    localStorage.setItem("voicelab-passphrase", "a-long-enough-passphrase");
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // First tap
    await userEvent.click(await screen.findByRole("button", { name: "Delete all my data" }));
    // Confirm nothing is deleted yet
    expect(await repository.listSessions()).toHaveLength(1);
    // Second, confirming tap
    await userEvent.click(screen.getByRole("button", { name: "Yes, delete everything" }));
    // Confirm the data is gone
    await waitFor(async () => expect(await repository.listSessions()).toHaveLength(0));
    // Confirm the user is told
    expect(screen.getByText(/Everything is deleted/)).toBeTruthy();
    // Confirm the progress note went with it and the passphrase stayed
    expect([localStorage.getItem("voicelab-steps-ticked"), localStorage.getItem("voicelab-passphrase")]).toEqual([null, "a-long-enough-passphrase"]);
    // Leave no passphrase for the next check
    localStorage.removeItem("voicelab-passphrase");
  });

  // Importing an export file adds its sessions
  it("imports an export file and says what came in", async () => {
    // Make an export file from a repository with one session
    const text = JSON.stringify(await buildExport(await repositoryWithOneSession(), NOW));
    // Make an empty repository to import into
    const repository = createRepository(new MemoryStore());
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // Choose the file
    await userEvent.upload(await screen.findByLabelText("Import a file"), new File([text], "voicelab.json", { type: "application/json" }));
    // Confirm the message
    expect(await screen.findByText("Imported 1 new session.")).toBeTruthy();
    // Confirm the session is saved
    expect(await repository.listSessions()).toHaveLength(1);
  });

  // Regression (decision 86): after an import or a delete, a switch must not write back the settings shown before it
  it("never writes back old settings after an import or a delete", async () => {
    // A file whose settings say "I stammer"
    const source = await repositoryWithOneSession();
    // Saved there
    await source.saveSettings({ ...(await source.getSettings(NOW)), stammer: true });
    // The file
    const text = JSON.stringify(await buildExport(source, NOW));
    // A repository to import into
    const repository = createRepository(new MemoryStore());
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // Import the file
    await userEvent.upload(await screen.findByLabelText("Import a file"), new File([text], "voicelab.json", { type: "application/json" }));
    // Wait for it
    await screen.findByText("Imported 1 new session.");
    // Then switch the practice days off
    await userEvent.click(screen.getByRole("checkbox", { name: /Show my practice days/ }));
    // The imported choice survives the switch
    const afterImport = await repository.getSettings(NOW);
    // Delete everything
    await userEvent.click(screen.getByRole("button", { name: "Delete all my data" }));
    // Confirm
    await userEvent.click(screen.getByRole("button", { name: "Yes, delete everything" }));
    // Wait for it
    await screen.findByText(/Everything is deleted/);
    // The switch is back to its fresh state (shown); switch it off again
    await userEvent.click(screen.getByRole("checkbox", { name: /Show my practice days/ }));
    // The deleted choices stay deleted
    const afterDelete = await repository.getSettings(NOW);
    // Stammer kept with the switch, then gone after the delete, with the switch acting on fresh settings
    expect([afterImport.stammer, afterImport.hideStreak, afterDelete.stammer, afterDelete.hideStreak]).toEqual([true, true, undefined, true]);
  });

  // Settings that cannot be read say why, instead of leaving the page half empty
  it("explains when the settings cannot be loaded", async () => {
    // A repository whose settings cannot be read
    const repository = { ...createRepository(new MemoryStore()), getSettings: async () => { throw new Error("The database connection is closing."); } };
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // The reason and the way forward
    expect(await screen.findByText("Your settings could not be loaded (The database connection is closing.). Reload the page to try again.")).toBeTruthy();
  });

  // A wrong file is refused with the plain message
  it("explains a file that is not an export", async () => {
    // Draw the screen
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Choose a wrong file
    await userEvent.upload(await screen.findByLabelText("Import a file"), new File(["hello"], "notes.json", { type: "application/json" }));
    // Confirm the message
    expect(await screen.findByText("This file is not a VoiceLab export.")).toBeTruthy();
  });

  // The number of days of recordings can be changed; it is saved and older recordings go at once (decision 98)
  it("saves a new number of days and removes older recordings", async () => {
    // A repository with a recording from ten days ago
    const repository = createRepository(new MemoryStore());
    // (its audio)
    await repository.saveAudio("a1", new Blob(["voice"]));
    // (the take)
    await repository.saveSession(makeSession({ id: "s1", audioKey: "a1", createdAt: new Date(NOW.getTime() - 10 * 86_400_000).toISOString(), feedbackStatus: "done" }));
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // The choice starts at 14 days
    const choice = await screen.findByLabelText("Keep recordings from the last");
    // (its value)
    const start = (choice as HTMLSelectElement).value;
    // Pick 7 days
    await userEvent.selectOptions(choice, "7");
    // Confirm it started at 14, was saved, and the ten-day-old recording went
    await waitFor(async () => expect([start, (await repository.getSettings(NOW)).recordingDays, await repository.getAudio("a1"), !!screen.getByText("Saved. 1 older recording removed.")]).toEqual(["14", 7, undefined, true]));
  });

  // The recordings section says exactly which recordings are kept, and how much the device holds when the browser can say (decision 88)
  it("explains what is kept and shows the storage used", async () => {
    // The browser's storage estimate
    Object.defineProperty(navigator, "storage", { configurable: true, value: { estimate: async () => ({ usage: 12_400_000, quota: 1e9 }) } });
    // Draw the screen
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the amount and the rule
    expect([!!(await screen.findByText("About 12 MB used on this device.")), !!screen.getByText(/Also kept: your very first recording, takes you star, and your check-ins/), !!screen.getByText(/Detailed charts \(pitch, volume and word timing\) are kept for 30 days/)]).toEqual([true, true, true]);
    // Take the stand-in away
    Reflect.deleteProperty(navigator, "storage");
  });

  // Where the browser cannot say how much it holds, no amount is shown
  it("shows no storage amount where the browser cannot estimate it", async () => {
    // A browser without the estimate
    Object.defineProperty(navigator, "storage", { configurable: true, value: { estimate: async () => { throw new Error("blocked"); } } });
    // Draw the screen
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Wait for the settings to load
    await screen.findByLabelText("Keep recordings from the last");
    // Confirm no amount
    expect(screen.queryByText(/used on this device/)).toBeNull();
    // Take the stand-in away
    Reflect.deleteProperty(navigator, "storage");
  });

  // A passphrase shorter than the server allows is refused at once, with the reason
  it("refuses a passphrase shorter than 16 characters", async () => {
    // Draw the screen
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Type a short passphrase
    await userEvent.type(await screen.findByLabelText("Passphrase"), "short");
    // Try to save it
    await userEvent.click(screen.getByRole("button", { name: "Save passphrase" }));
    // Confirm the explanation and that nothing was saved
    expect([!!screen.getByText(/at least 16 characters/), readPassphrase()]).toEqual([true, ""]);
  });

  // After saving, the passphrase's fingerprint is shown, to compare with the server's (from pnpm live-check)
  it("shows the saved passphrase's fingerprint", async () => {
    // Draw the screen
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Type a passphrase
    await userEvent.type(await screen.findByLabelText("Passphrase"), "walnut-harbor-quietly-71");
    // Save it
    await userEvent.click(screen.getByRole("button", { name: "Save passphrase" }));
    // Confirm a fingerprint is shown
    expect(await screen.findByText(/Fingerprint: [0-9a-f]{6}/)).toBeTruthy();
  });

  // The coach may read your notes only when you switch it on
  it("saves whether the coach may read your notes", async () => {
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Draw the screen
    render(<SettingsScreen repository={repository} now={NOW} />);
    // The switch, off by default
    const share = (await screen.findByLabelText(/Let the coach read my notes/)) as HTMLInputElement;
    // Was it off?
    const before = share.checked;
    // Switch it on
    await userEvent.click(share);
    // Confirm it was off, and is now saved on
    await waitFor(async () => expect([before, (await repository.getSettings(NOW)).shareNotes]).toEqual([false, true]));
  });

  // Settings in a few groups (decision 110): your progress, practice, recordings and data, coach and services, appearance; the rarely changed practice options folded
  it("groups the settings under a few headings, with the rare ones folded", async () => {
    // Draw Settings
    const { container } = render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Wait for the settings to load
    await screen.findByRole("group", { name: "What you want to get better at" });
    // The group of a section, by its heading
    const groupOf = (name: string) => screen.getByRole("heading", { level: 3, name }).closest("section[aria-labelledby]")?.querySelector("h2")?.textContent;
    // Confirm the groups in order, where a few sections sit, and the fold closed with pause words inside
    expect([
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
      ["What you want to get better at", "Weekly check-in", "Conversation turns", "Your recordings", "Your data", "Coach (advanced)", "Deeper analysis (advanced)", "Light or dark"].map(groupOf),
      (screen.getByRole("heading", { level: 3, name: "Pause words" }).closest("details") as HTMLDetailsElement | null)?.open,
      container.querySelectorAll("details > summary").length >= 2,
    ]).toEqual([["Your progress", "Practice", "Recordings and data", "Coach and services", "Appearance"], ["Practice", "Practice", "Practice", "Recordings and data", "Recordings and data", "Coach and services", "Coach and services", "Appearance"], false, true]);
  });

  // How you are doing has one way in from Settings: the profile, which leads on to History (decision 109)
  it("links to your progress once, and not to History directly", async () => {
    // Draw Settings
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the one link, and none to History or the profile besides
    expect([(await screen.findByRole("link", { name: "Your speaking profile and history" })).getAttribute("href"), screen.getAllByRole("link").filter((link) => ["/history", "/profile"].includes(link.getAttribute("href") ?? "")).length]).toEqual(["/profile", 1]);
  });
});
