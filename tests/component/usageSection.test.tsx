// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, beforeEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen
import { cleanup, render, screen, within } from "@testing-library/react";
// Load the screen being checked
import { SettingsScreen } from "@/components/screens/SettingsScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";

// A fixed "now"
const NOW = new Date(2026, 9, 22, 10);
// The month's usage as the server says it
const USAGE = { month: "2026-10", live: { used: 120, limit: 150, left: 30, setUp: true }, call: { used: 30, limit: 60, left: 30, setUp: true }, voiceCharacters: { turbo: 40_000, v4: 0 }, lines: 400, conversationMinutes: { used: 20, limit: 150 } };

// A network answering the usage route as given, and anything else plainly
function network(usage: unknown, status = 200): typeof fetch {
  // Each request
  return (async (input: RequestInfo | URL) => {
    // The usage route
    if (String(input).includes("/api/usage")) return new Response(JSON.stringify(usage), { status });
    // The conversation minutes
    return new Response(JSON.stringify({ minutesUsed: 0, minutesPerMonth: 150, minutesLeft: 150 }), { status: 200 });
  }) as typeof fetch;
}

// A passphrase saved, before each check; removed after
beforeEach(() => localStorage.setItem("voicelab-passphrase", "a long passphrase for testing"));
// Cleaned up
afterEach(() => {
  // Drawn screens removed
  cleanup();
  // The passphrase removed
  localStorage.removeItem("voicelab-passphrase");
});

// Group the checks on Settings' usage section (decision 122)
describe("Usage and costs", () => {
  // The rows, the total and the note, under Coach and services
  it("shows each kind's use, the estimates and the total", async () => {
    // Drawn
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} fetchFn={network(USAGE)} />);
    // Ready
    await screen.findByText("Total");
    // The section, inside Coach and services
    const section = document.getElementById("usage")!;
    // Each row's words and amount
    const rows = [...section.querySelectorAll("[data-usage-row]")].map((row) => row.textContent);
    // As estimated: live $0.30, calls 30 × ($0.08 + 3 lines) $2.41, Turbo $1.60, lines $0.06, total $4.37; no v4 row
    expect([section.closest("section[aria-labelledby='group-services']") !== null, rows]).toEqual([true, ["Live turns120 of 150 minutes, 30 left$0.30", "Phone calls30 of 60 minutes, 30 left$2.41", "Persona voice (Turbo)40,000 characters$1.60", "Claude, conversation lines400 lines$0.06", "Total$4.37"]]);
    // The note and the prices, marked unverified where they are
    expect([within(section).getByText("Estimates from the prices below; your provider’s bill is the real number.") !== null, within(section).getByText(/\$0\.15 per hour of open connection · checked\s2026.10.21 · unverified/) !== null]).toEqual([true, true]);
  });

  // Not set up on the server, said by row
  it("says when a kind is not set up", async () => {
    // Calls not set up
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} fetchFn={network({ ...USAGE, call: { used: 0, limit: 60, left: 60, setUp: false } })} />);
    // Said
    expect((await screen.findByText("not set up on the server")).closest("[data-usage-row]")?.getAttribute("data-usage-row")).toBe("call");
  });

  // The server could not say: one plain line
  it("says when the usage could not be read", async () => {
    // Refused
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} fetchFn={network({ error: "down" }, 503)} />);
    // Said
    await screen.findByText("Couldn’t read this month’s usage. It is checked again next time you open Settings.");
  });

  // No passphrase: what it needs, and nothing asked
  it("asks for nothing without a passphrase", async () => {
    // No passphrase
    localStorage.removeItem("voicelab-passphrase");
    // Requests noted
    const asked: string[] = [];
    // Drawn
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} fetchFn={(async (input: RequestInfo | URL) => (asked.push(String(input)), new Response("{}"))) as typeof fetch} />);
    // Said
    await screen.findByText("Shown once the coach is set up, since the counts are kept on the server.");
    // Never asked
    expect(asked.some((url) => url.includes("/api/usage"))).toBe(false);
  });
});
