// This month's estimated costs (decision 143), from the server's counters and the prices in src/config/prices.ts. Pure: the same numbers in, the same estimate out

// Load the price shape
import type { Price } from "@/config/prices";

// What the server counted this month
export interface UsageCounts {
  // Live minutes used (AssemblyAI streaming, decision 140)
  liveMinutes: number;
  // Phone-call minutes used (ElevenLabs Agents, decision 142)
  callMinutes: number;
  // Characters spoken by the Turbo voice model
  turboCharacters: number;
  // Characters spoken by the v4 voice model
  v4Characters: number;
  // The persona's lines Claude wrote
  lines: number;
}

// The prices the estimate needs
export interface UsagePrices {
  // AssemblyAI streaming, per hour
  assemblyAiStreaming: Price;
  // ElevenLabs Agents, per minute
  elevenLabsAgents: Price;
  // Turbo, per 1,000 characters
  elevenLabsTurbo: Price;
  // v4, per 1,000 characters
  elevenLabsV4: Price;
  // Haiku input and output, per million tokens
  haikuInput: Price;
  // (output)
  haikuOutput: Price;
}

// The assumptions behind the estimate
export interface UsageAssumptions {
  // Tokens one written line takes
  tokensPerLine: { input: number; output: number };
  // Lines in a minute of phone call
  callLinesPerMinute: number;
}

// One row of the estimate
export interface CostRow {
  // Which
  id: "live" | "call" | "turbo" | "v4" | "lines";
  // The estimate in US dollars
  usd: number;
}

// The estimate: one row each, and the total
export interface UsageEstimate {
  // The rows
  rows: CostRow[];
  // Their total
  total: number;
}

// Never negative, never not a number
function count(value: number): number {
  // A real, non-negative number, or zero
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

// What one written line costs on Haiku
export function lineCost(prices: Pick<UsagePrices, "haikuInput" | "haikuOutput">, tokens: UsageAssumptions["tokensPerLine"]): number {
  // Its input and output tokens at their prices
  return (tokens.input / 1_000_000) * prices.haikuInput.usd + (tokens.output / 1_000_000) * prices.haikuOutput.usd;
}

// The month's estimate from the counts
export function estimateUsage(counts: UsageCounts, prices: UsagePrices, assumptions: UsageAssumptions): UsageEstimate {
  // One line's cost
  const perLine = lineCost(prices, assumptions.tokensPerLine);
  // Each row
  const rows: CostRow[] = [
    // Live: hours of open socket
    { id: "live", usd: (count(counts.liveMinutes) / 60) * prices.assemblyAiStreaming.usd },
    // Calls: minutes, plus the agent's LLM passed through
    { id: "call", usd: count(counts.callMinutes) * (prices.elevenLabsAgents.usd + assumptions.callLinesPerMinute * perLine) },
    // Turbo voice: thousands of characters
    { id: "turbo", usd: (count(counts.turboCharacters) / 1_000) * prices.elevenLabsTurbo.usd },
    // v4 voice
    { id: "v4", usd: (count(counts.v4Characters) / 1_000) * prices.elevenLabsV4.usd },
    // Claude's lines
    { id: "lines", usd: count(counts.lines) * perLine },
  ];
  // With the total
  return { rows, total: rows.reduce((sum, row) => sum + row.usd, 0) };
}

// A dollar amount for people: "$0.38", "$12.40", under a cent "under $0.01", nothing "$0.00"
export function formatUsd(usd: number): string {
  // Nothing
  if (usd <= 0) return "$0.00";
  // Under a cent
  if (usd < 0.005) return "under $0.01";
  // To the cent
  return `$${usd.toFixed(2)}`;
}
