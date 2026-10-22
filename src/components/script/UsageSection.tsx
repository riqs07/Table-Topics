"use client";
// Settings → Coach and services → "Usage and costs (estimated)" (decision 143): this month's live and phone-call minutes (used, limit, left), the persona's voice characters and Claude's lines, each with an estimated cost from the prices in src/config/prices.ts, and a total. The numbers come from the server's own counters; the costs are only estimates

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the prices and the estimate's assumptions
import { CALL_LINES_PER_MINUTE, PRICES, TOKENS_PER_LINE, type Price } from "@/config/prices";
// Load the estimate
import { estimateUsage, formatUsd, type CostRow } from "@/core/usageCosts";
// Load the usage client
import { monthUsage, usageCounts, type MinutesUsage, type Usage } from "@/data/usageClient";

// The name of each price, for the list under the estimate
const PRICE_NAMES: ReadonlyArray<{ key: keyof typeof PRICES; name: string }> = [
  // Live turns
  { key: "assemblyAiStreaming", name: "AssemblyAI streaming (live turns)" },
  // Phone calls
  { key: "elevenLabsAgents", name: "ElevenLabs Agents (phone calls)" },
  // Turbo
  { key: "elevenLabsTurbo", name: "ElevenLabs Turbo voice" },
  // v4
  { key: "elevenLabsV4", name: "ElevenLabs v4 voice" },
  // Haiku in
  { key: "haikuInput", name: "Claude Haiku 5.5, input" },
  // Haiku out
  { key: "haikuOutput", name: "Claude Haiku 5.5, output" },
];

// A count with thousands separated
function number(value: number): string {
  // In English
  return value.toLocaleString("en-US");
}

// What a kind of minutes says: used of the limit and what is left, or that it is off or not set up
function minutesLine(minutes: MinutesUsage): string {
  // Not set up on the server
  if (!minutes.setUp) return "not set up on the server";
  // Turned off
  if (minutes.limit === 0) return "turned off on the server";
  // Used, limit, left
  return `${number(minutes.used)} of ${number(minutes.limit)} minutes, ${number(minutes.left)} left`;
}

// The rows to show: what each is, what was counted, and its estimate (the v4 voice only when it was used)
function rowsOf(usage: Usage, costs: CostRow[]): Array<{ id: string; name: string; counted: string; usd: number }> {
  // Each row's estimate
  const usd = (id: CostRow["id"]) => costs.find((row) => row.id === id)?.usd ?? 0;
  // The rows
  return [
    // Live turns
    { id: "live", name: "Live turns", counted: minutesLine(usage.live), usd: usd("live") },
    // Phone calls
    { id: "call", name: "Phone calls", counted: minutesLine(usage.call), usd: usd("call") },
    // The Turbo voice
    { id: "turbo", name: "Persona voice (Turbo)", counted: `${number(usage.voiceCharacters.turbo)} characters`, usd: usd("turbo") },
    // The v4 voice, when used
    ...(usage.voiceCharacters.v4 > 0 ? [{ id: "v4", name: "Persona voice (v4)", counted: `${number(usage.voiceCharacters.v4)} characters`, usd: usd("v4") }] : []),
    // Claude's lines
    { id: "lines", name: "Claude, conversation lines", counted: `${number(usage.lines)} ${usage.lines === 1 ? "line" : "lines"}`, usd: usd("lines") },
  ];
}

// One price, in words
function priceLine(price: Price): string {
  // The amount, what for, when checked, and how sure
  return `$${price.usd.toFixed(2)} per ${price.per} · checked ${price.checkedOn.replace(/-/g, "‑")}${price.verified ? "" : " · unverified"}`;
}

// The section's content: asked of the server once, when a passphrase is saved
export function UsageSection({ passphrase, fetchFn }: { passphrase: string; fetchFn?: typeof fetch }) {
  // The month's usage, "unknown" when it could not be read, or null while asking
  const [usage, setUsage] = useState<Usage | "unknown" | null>(null);
  // Ask once
  useEffect(() => {
    // Nothing to ask without a passphrase
    if (!passphrase) return;
    // Ignore a late answer
    let cancelled = false;
    // Ask
    void monthUsage(passphrase, fetchFn).then((result) => {
      // Shown when still wanted
      if (!cancelled) setUsage(result ?? "unknown");
    });
    // Stop updating when closed
    return () => {
      // Ignore the answer
      cancelled = true;
    };
  }, [passphrase, fetchFn]);
  // Without a passphrase: what it needs
  if (!passphrase) return <p className="text-footnote text-ink-muted">Shown once the coach is set up, since the counts are kept on the server.</p>;
  // Asking
  if (usage === null) return <p role="status" data-usage="checking" className="text-footnote text-ink-muted">Checking this month’s usage…</p>;
  // Could not say
  if (usage === "unknown") return <p role="status" data-usage="unknown" className="text-footnote text-ink-muted">Couldn’t read this month’s usage. It is checked again next time you open Settings.</p>;
  // The estimate
  const estimate = estimateUsage(usageCounts(usage), PRICES, { tokensPerLine: TOKENS_PER_LINE, callLinesPerMinute: CALL_LINES_PER_MINUTE });
  // The rows
  const rows = rowsOf(usage, estimate.rows);
  // The table, the total, the note and the prices
  return (
    <div data-usage="ready" data-usage-total={estimate.total.toFixed(4)}>
      {/* Which month */}
      <p className="text-footnote text-ink-muted">This month ({usage.month}, UTC)</p>
      {/* Each row: what, what was counted, and the estimate */}
      <dl className="mt-2 divide-y divide-rule">
        {/* One per row */}
        {rows.map((row) => (
          <div key={row.id} data-usage-row={row.id} className="flex items-baseline justify-between gap-4 py-2">
            {/* What, and what was counted */}
            <dt className="min-w-0"><span className="block">{row.name}</span><span className="block text-footnote text-ink-muted">{row.counted}</span></dt>
            {/* The estimate */}
            <dd className="shrink-0 tabular-nums">{formatUsd(row.usd)}</dd>
          </div>
        ))}
        {/* The total */}
        <div data-usage-row="total" className="flex items-baseline justify-between gap-4 py-2 font-semibold">
          {/* Its name */}
          <dt>Total</dt>
          {/* Its amount */}
          <dd className="tabular-nums">{formatUsd(estimate.total)}</dd>
        </div>
      </dl>
      {/* What the numbers are */}
      <p className="mt-2 text-footnote text-ink-muted">Estimates from the prices below; your provider’s bill is the real number.</p>
      {/* The prices, folded */}
      <details className="mt-2">
        {/* Open them */}
        <summary className="cursor-pointer text-footnote text-ink-muted underline underline-offset-4">The prices used</summary>
        {/* Each price */}
        <ul className="mt-2 flex flex-col gap-1.5 text-footnote text-ink-muted">
          {/* One per price */}
          {PRICE_NAMES.map(({ key, name }) => <li key={key}><span className="text-ink">{name}:</span> {priceLine(PRICES[key])}</li>)}
          {/* The assumptions */}
          <li>A written line is taken as about {number(TOKENS_PER_LINE.input)} tokens in and {TOKENS_PER_LINE.output} out; a minute of phone call as {CALL_LINES_PER_MINUTE} lines of the agent’s Claude.</li>
        </ul>
      </details>
    </div>
  );
}
