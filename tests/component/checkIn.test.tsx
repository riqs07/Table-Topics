// @vitest-environment jsdom
// Screen checks for the weekly check-in (decision 100): Today's check-in card and the reminder to look back, the check-in page with its parts, skipping and finishing, the comparison with its players, table and missing audio, and the check-in day in Settings
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen, within } from "@testing-library/react";
// Load the tool for acting like a user
import userEvent from "@testing-library/user-event";
// Load the screens being checked
import { HomeScreen } from "@/components/screens/HomeScreen";
import { CheckInRunScreen } from "@/components/screens/CheckInRunScreen";
import { CheckInCompareScreen } from "@/components/screens/CheckInCompareScreen";
import { CheckInScreen } from "@/components/screens/CheckInScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository, type Repository } from "@/data/repository";
// Load the check-in id maker
import { checkInId } from "@/core/checkIn";
// Load the record types
import type { CheckInPart } from "@/data/records";
// Load a sample session builder
import { makeSession } from "../support/fixtures";
// Load the made-up takes with realistic pitch (decision 111)
import { makeTake } from "../support/pitchTake";

// Tuesday 13 October 2026, mid-morning
const NOW = new Date(2026, 9, 13, 10);
// The four parts
const PARTS: ReadonlyArray<CheckInPart> = ["read", "pitch", "story", "surprise"];

// Remove the drawn screen after each check
afterEach(cleanup);
// Past the welcome, with object URLs stood in for the players
beforeEach(() => {
  // Welcome seen
  localStorage.setItem("voicelab-welcome-seen", "yes");
  // Object URLs
  Object.assign(URL, { createObjectURL: vi.fn(() => "blob:take"), revokeObjectURL: vi.fn() });
});

// A take of a check-in part on a day, with its recording when asked
async function saveTake(repository: Repository, day: Date, part: CheckInPart, week: number, audio = true) {
  // Its id
  const id = `${checkInId(day)}-${part}`;
  // The session
  await repository.saveSession(makeSession({ id, createdAt: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9).toISOString(), mode: part === "read" ? "read" : part === "pitch" ? "outline" : part === "story" ? "story" : "talk", promptId: part === "read" ? "ci-read" : part === "pitch" ? "ci-pitch" : part === "story" ? `cis0${week}` : `ciq0${week}`, durationSec: 60 + week * 10, marker: true, audioKey: audio ? id : null, checkIn: { id: checkInId(day), week, part } }));
  // Its recording
  if (audio) await repository.saveAudio(id, new Blob(["sound"], { type: "audio/webm" }));
}

// A repository with a first day of use on Monday, so Tuesday is the first check-in day
async function dayTwo(): Promise<Repository> {
  // Empty
  const repository = createRepository(new MemoryStore());
  // Monday's take
  await repository.saveSession(makeSession({ id: "monday", createdAt: new Date(2026, 9, 12, 9).toISOString() }));
  // Handed back
  return repository;
}

// Group the checks about Today
describe("Today on a check-in day", () => {
  // The main card leads with the check-in, the band starts it
  it("leads with the first check-in and starts it", async () => {
    // Day two
    render(<HomeScreen repository={await dayTwo()} now={NOW} />);
    // Confirm the headline, the two steps and the band
    expect([(await screen.findByRole("heading", { level: 1 })).textContent, within(screen.getByRole("list", { name: "Steps" })).getAllByRole("listitem").length, screen.getByRole("link", { name: /^Start check-in/ }).getAttribute("href")]).toEqual(["Your first check-in.", 2, "/check-in/run?plan=1"]);
  });

  // Part-way through, the band says continue and the step counts the parts
  it("carries on a check-in under way", async () => {
    // Day two with two parts done
    const repository = await dayTwo();
    // (done)
    for (const part of ["read", "pitch"] as const) await saveTake(repository, NOW, part, 1);
    // Drawn
    render(<HomeScreen repository={repository} now={NOW} />);
    // Confirm the band and the step's line
    expect([!!(await screen.findByRole("link", { name: /^Continue check-in/ })), !!screen.getByText("2 of 4 parts")]).toEqual([true, true]);
  });

  // The reminder to look back: shown a week after the first, put aside for good with Not now
  it("offers a look back a week on, and Not now puts it aside", async () => {
    // Two check-ins a week apart, today being the second
    const repository = createRepository(new MemoryStore());
    // (both)
    for (const part of PARTS) {
      // The first
      await saveTake(repository, new Date(2026, 9, 6), part, 1);
      // The latest, today
      await saveTake(repository, NOW, part, 2);
    }
    // Drawn
    render(<HomeScreen repository={repository} now={NOW} />);
    // The reminder
    const card = await screen.findByRole("region", { name: "Hear how far you’ve come" });
    // Its link
    expect(within(card).getByRole("link", { name: "Compare" }).getAttribute("href")).toBe("/check-in/compare");
    // Not now
    await userEvent.click(within(card).getByRole("button", { name: "Not now" }));
    // Confirm it went and is remembered
    expect([screen.queryByRole("region", { name: "Hear how far you’ve come" }), (await repository.getSettings(NOW)).checkIn?.seen]).toEqual([null, [7]]);
  });

  // Putting it aside can fail: said plainly, the card stays
  it("says so when the reminder cannot be put aside", async () => {
    // Two check-ins a week apart
    const working = createRepository(new MemoryStore());
    // (both)
    for (const part of PARTS) {
      // The first
      await saveTake(working, new Date(2026, 9, 6), part, 1);
      // The latest
      await saveTake(working, NOW, part, 2);
    }
    // Settings saves fail once Today has loaded
    let loaded = false;
    // (the failing copy)
    const repository = { ...working, saveSettings: async (settings: Parameters<Repository["saveSettings"]>[0]) => { if (loaded) throw new Error("The database connection is closing."); loaded = true; return working.saveSettings(settings); } };
    // Drawn
    render(<HomeScreen repository={repository} now={NOW} />);
    // Not now
    await userEvent.click(within(await screen.findByRole("region", { name: "Hear how far you’ve come" })).getByRole("button", { name: "Not now" }));
    // Confirm the reason shows and the card stays
    expect([!!(await screen.findByText(/The database connection is closing/)), !!screen.getByRole("region", { name: "Hear how far you’ve come" })]).toEqual([true, true]);
  });
});

// Group the checks about the check-in page
describe("the check-in page", () => {
  // The parts in order, the next one's start, and skipping moves on
  it("shows the parts, starts the next and skips a part", async () => {
    // Day two
    const repository = await dayTwo();
    // Drawn
    render(<CheckInRunScreen repository={repository} now={NOW} />);
    // The four parts, the reading first
    const parts = await screen.findByRole("list", { name: "The four parts" });
    // Confirm the parts and the band
    expect([within(parts).getAllByRole("listitem").map((item) => item.getAttribute("data-status")), screen.getByRole("link", { name: /^Start read aloud/ }).getAttribute("href")]).toEqual([["open", "open", "open", "open"], "/session?mode=read&prompt=ci-read&checkin=ci-2026-10-13&part=read"]);
    // Skip the reading
    await userEvent.click(screen.getByRole("button", { name: "Skip this part" }));
    // Confirm the pitch is next and the reading shows as skipped
    expect([!!(await screen.findByRole("link", { name: /^Start elevator pitch/ })), screen.getAllByText("Skipped").length]).toEqual([true, 1]);
  });

  // The surprise question stays a surprise until its countdown
  it("keeps the surprise question hidden", async () => {
    // Day two with three parts done
    const repository = await dayTwo();
    // (done)
    for (const part of ["read", "pitch", "story"] as const) await saveTake(repository, NOW, part, 1);
    // Drawn
    render(<CheckInRunScreen repository={repository} now={NOW} />);
    // Confirm the hidden line and its address
    expect([!!(await screen.findByText("A question you’ll see when you start.")), screen.getByRole("link", { name: /^Start surprise question/ }).getAttribute("href")]).toEqual([true, "/session?mode=talk&prompt=ciq01&checkin=ci-2026-10-13&part=surprise"]);
  });

  // Finished: each part's length, the ways to compare, and the next day
  it("finishes with the parts, the comparisons and the next day", async () => {
    // Two earlier check-ins and today's, every part done
    const repository = createRepository(new MemoryStore());
    // (each)
    for (const part of PARTS) {
      // The first
      await saveTake(repository, new Date(2026, 8, 29), part, 1);
      // The second
      await saveTake(repository, new Date(2026, 9, 6), part, 2);
      // Today's
      await saveTake(repository, NOW, part, 3);
    }
    // Drawn
    render(<CheckInRunScreen repository={repository} now={NOW} />);
    // Confirm the headline, the comparisons and the next day
    expect([(await screen.findByRole("heading", { level: 1 })).textContent, screen.getByRole("link", { name: "Compare with your first" }).getAttribute("href"), screen.getByRole("link", { name: "Compare with last time" }).getAttribute("href"), !!screen.getByText("Next check-in: Tuesday 20 October.")]).toEqual(["Check-in done.", "/check-in/compare?a=ci-2026-09-29&b=ci-2026-10-13", "/check-in/compare?a=ci-2026-10-06&b=ci-2026-10-13", true]);
  });

  // Not a check-in day: when the next one is
  it("says when the next check-in is on other days", async () => {
    // A check-in on Tuesday the 6th
    const repository = createRepository(new MemoryStore());
    // (done)
    for (const part of PARTS) await saveTake(repository, new Date(2026, 9, 6), part, 1);
    // Drawn on Friday the 16th (the 6th was a Tuesday, so the 13th to 15th were due; the 16th is not)
    render(<CheckInRunScreen repository={repository} now={new Date(2026, 9, 16, 10)} />);
    // Confirm
    expect([(await screen.findByRole("heading", { level: 1 })).textContent, !!screen.getByText("Your next check-in is on Tuesday 20 October.")]).toEqual(["Not a check-in day.", true]);
  });

  // A skip that cannot be saved says why, with the way to try again
  it("says so when a skip cannot be saved", async () => {
    // Day two, with settings that cannot be saved
    const working = await dayTwo();
    // (failing)
    const repository = { ...working, saveSettings: async () => { throw new Error("The database connection is closing."); } };
    // Drawn
    render(<CheckInRunScreen repository={repository} now={NOW} />);
    // Skip
    await userEvent.click(await screen.findByRole("button", { name: "Skip this part" }));
    // Confirm the reason and Try again
    expect([!!(await screen.findByText(/The database connection is closing/)), !!screen.getByRole("button", { name: "Try again" })]).toEqual([true, true]);
  });

  // The list of check-ins
  it("lists every check-in, newest first", async () => {
    // Two check-ins
    const repository = createRepository(new MemoryStore());
    // (both)
    for (const part of PARTS) {
      // The first
      await saveTake(repository, new Date(2026, 9, 6), part, 1);
      // Today's
      await saveTake(repository, NOW, part, 2);
    }
    // Drawn
    render(<CheckInScreen repository={repository} now={NOW} />);
    // Confirm the order and the quick comparison
    expect([within(await screen.findByRole("list", { name: "Your check-ins" })).getAllByRole("listitem").map((item) => item.textContent?.slice(0, 10)), screen.getByRole("link", { name: "First and latest" }).getAttribute("href")]).toEqual([["Check-in 2", "Your first"], "/check-in/compare"]);
  });
});

// Group the checks about the comparison
describe("the comparison", () => {
  // Both recordings per part, the table and A/B; a recording not on this device said plainly
  it("shows both recordings, the measures and a note for missing audio", async () => {
    // Two check-ins; the first's story came from a backup without audio
    const repository = createRepository(new MemoryStore());
    // (both)
    for (const part of PARTS) {
      // The first
      await saveTake(repository, new Date(2026, 9, 6), part, 1, part !== "story");
      // Today's
      await saveTake(repository, NOW, part, 2);
    }
    // Drawn
    render(<CheckInCompareScreen repository={repository} now={NOW} />);
    // The reading's table
    const table = await screen.findByRole("table", { name: "Measures, Read aloud" });
    // The reading's part
    const read = document.querySelector("section[data-part='read']")!;
    // Confirm the parts, the players (seven), the table's time row, the missing note and A/B for the reading only where both are here, and the table folded under "All numbers" after what changed (decision 103)
    expect([document.querySelectorAll("section[data-part]").length, (await screen.findAllByRole("button", { name: /^Play (then|now)/ })).length, within(table).getAllByRole("row")[1]!.textContent, !!screen.getByText(/The recording isn’t on this device/), screen.queryByRole("group", { name: "Switch between then and now, A story" }), !!screen.getByRole("group", { name: "Switch between then and now, Read aloud" }), (table.closest("details") as HTMLDetailsElement | null)?.open, table.closest("details")?.querySelector("summary")?.textContent, Array.from(read.children).map((child) => child.tagName)]).toEqual([4, 7, "Time1:101:20", true, null, true, false, "All numbers", ["H2", "DIV", "DIV", "UL", "DETAILS"]]);
  });

  // The reading read twice: then's pitch dashed under now's, phrase by phrase (decision 111)
  it("draws then's pitch under now's for the same words", async () => {
    // The passage's first sentence, read twice: the second time "market" falls instead of rising
    const said = (end: number) => makeTake([{ words: "Every Saturday I take the same walk to the market.".split(" ").map((text) => ({ text, step: text === "same" ? 4 : 0, ...(text === "market." ? { to: end } : {}) })), pauseAfter: 0.5 }]);
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Both check-ins' readings
    for (const [day, week, take] of [[new Date(2026, 9, 6), 1, said(5)], [NOW, 2, said(-4)]] as const) {
      // The take's id
      const id = `${checkInId(day)}-read`;
      // Saved with its readings, each script word read when heard
      await repository.saveSession(makeSession({ id, createdAt: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9).toISOString(), mode: "read", promptId: "ci-read", durationSec: take.durationSec, transcript: take.transcript, marker: true, checkIn: { id: checkInId(day), week, part: "read" }, pitch: take.pitch, loudness: take.loudness, spokenTimes: take.spokenTimes, scriptTimes: take.spokenTimes }));
    }
    // Drawn
    render(<CheckInCompareScreen repository={repository} now={NOW} />);
    // The reading's comparison, headed by the change
    const card = await screen.findByRole("region", { name: "Your ending used to rise. Now it falls." });
    // Inside the reading's part, then's curve dashed under now's
    expect([card.closest("section[data-part]")?.getAttribute("data-part"), card.querySelectorAll("[data-under]").length > 0]).toEqual(["read", true]);
  });

  // A/B marks the side playing
  it("switches between then and now", async () => {
    // Two check-ins with readings
    const repository = createRepository(new MemoryStore());
    // (both)
    await saveTake(repository, new Date(2026, 9, 6), "read", 1);
    // (today)
    await saveTake(repository, NOW, "read", 2);
    // Stand in for playing
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    // (pausing)
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    // Drawn
    render(<CheckInCompareScreen repository={repository} now={NOW} />);
    // The switch
    const ab = await screen.findByRole("group", { name: "Switch between then and now, Read aloud" });
    // Now
    await userEvent.click(within(ab).getByRole("button", { name: "Now" }));
    // Confirm Now is pressed
    expect([within(ab).getByRole("button", { name: "Now" }).getAttribute("aria-pressed"), within(ab).getByRole("button", { name: "Then" }).getAttribute("aria-pressed")]).toEqual(["true", "false"]);
  });

  // One check-in: nothing to compare yet
  it("says when there is only one check-in", async () => {
    // One check-in
    const repository = createRepository(new MemoryStore());
    // (it)
    await saveTake(repository, NOW, "read", 1);
    // Drawn
    render(<CheckInCompareScreen repository={repository} now={NOW} />);
    // Confirm the line
    expect(!!(await screen.findByText(/Comparing needs two check-ins/))).toBe(true);
  });
});

// Group the checks about Settings
describe("the check-in in Settings", () => {
  // The day and which recordings are kept are saved
  it("saves the check-in day and the recordings kept", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Drawn
    render(<SettingsScreen repository={repository} now={NOW} />);
    // Choose Thursday
    await userEvent.selectOptions(await screen.findByLabelText("Check-in day"), "4");
    // And fewer check-in recordings
    await userEvent.selectOptions(screen.getByLabelText("Check-in recordings to keep"), "thinned");
    // Confirm both are saved
    expect((await repository.getSettings(NOW)).checkIn).toEqual({ day: 4, keep: "thinned" });
  });
});
