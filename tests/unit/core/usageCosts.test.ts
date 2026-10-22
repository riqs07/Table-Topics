// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the maths being checked
import { estimateUsage, formatUsd, lineCost } from "@/core/usageCosts";
// Load the prices and assumptions
import { CALL_LINES_PER_MINUTE, PRICES, TOKENS_PER_LINE } from "@/config/prices";

// The assumptions as the app uses them
const ASSUME = { tokensPerLine: TOKENS_PER_LINE, callLinesPerMinute: CALL_LINES_PER_MINUTE };

// Group the checks on the cost maths (decision 143)
describe("usage costs", () => {
  // One line on Haiku: 1,300 tokens in at $0.10 a million, 40 out at $0.50
  it("prices one written line", () => {
    // 0.00013 + 0.00002
    expect(lineCost(PRICES, TOKENS_PER_LINE)).toBeCloseTo(0.00015, 8);
  });

  // A month: 120 live minutes, 30 call minutes, 40,000 Turbo characters, none on v4, 400 lines
  it("estimates each row and the total", () => {
    // The estimate
    const estimate = estimateUsage({ liveMinutes: 120, callMinutes: 30, turboCharacters: 40_000, v4Characters: 0, lines: 400 }, PRICES, ASSUME);
    // Live: 2 hours × $0.15; calls: 30 × ($0.08 + 3 × $0.00015); Turbo: 40 × $0.04; v4 none; lines: 400 × $0.00015
    expect(estimate.rows.map((row) => [row.id, Math.round(row.usd * 100_000) / 100_000])).toEqual([["live", 0.3], ["call", 2.4135], ["turbo", 1.6], ["v4", 0], ["lines", 0.06]]);
    // The total
    expect(estimate.total).toBeCloseTo(4.3735, 6);
  });

  // Nothing used, and nonsense counts, cost nothing
  it("treats empty or broken counts as nothing", () => {
    // Zeros, a negative and not a number
    expect(estimateUsage({ liveMinutes: 0, callMinutes: -5, turboCharacters: Number.NaN, v4Characters: 0, lines: 0 }, PRICES, ASSUME).total).toBe(0);
  });

  // The words for an amount
  it("formats dollars for people", () => {
    // Nothing, under a cent, a few cents, dollars
    expect([formatUsd(0), formatUsd(0.0004), formatUsd(0.0381), formatUsd(12.4)]).toEqual(["$0.00", "under $0.01", "$0.04", "$12.40"]);
  });
});

// Group the checks on the prices file (decision 143: one file, each price dated and sourced)
describe("prices", () => {
  // Every price has a day, a source and whether it was the vendor's own; only Haiku's is verified
  it("dates and sources every price, marking the unverified ones", () => {
    // Each price
    const entries = Object.entries(PRICES);
    // Dated, sourced, and the verified ones named
    expect([entries.every(([, price]) => /^\d{4}-\d{2}-\d{2}$/.test(price.checkedOn) && price.source.length > 20 && price.usd > 0), entries.filter(([, price]) => price.verified).map(([key]) => key)]).toEqual([true, ["haikuInput", "haikuOutput"]]);
  });

  // The starting figures the research gave
  it("starts from the research's figures", () => {
    // AssemblyAI an hour, Agents a minute, Turbo a thousand characters, Haiku a million tokens
    expect([PRICES.assemblyAiStreaming.usd, PRICES.elevenLabsAgents.usd, PRICES.elevenLabsTurbo.usd, PRICES.haikuInput.usd, PRICES.haikuOutput.usd]).toEqual([0.15, 0.08, 0.04, 0.1, 0.5]);
  });
});
