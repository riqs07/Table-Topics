// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load Node's file reader
import { readFileSync } from "node:fs";
// Load the registry
import { METRICS } from "@/core/analysis/metrics";

// Group the checks that keep the measurements doc in step with the registry (decision 91: the code wins, so the doc must follow it)
describe("measurements.md", () => {
  // Every measure has its exact row in the doc's tables
  it("lists every registered measure exactly as the registry defines it", () => {
    // The doc
    const doc = readFileSync("documents/architecture/measurements.md", "utf8");
    // The rows that are missing or out of date
    const missing = METRICS.map((metric) => `| \`${metric.id}\` | ${metric.name} | ${metric.definition} | ${metric.unit} | ${metric.source} | ${metric.evidence} | ${metric.shown ? "shown" : "internal"} | ${metric.better} | ${metric.stage} |`).filter((row) => !doc.includes(row));
    // None
    expect(missing).toEqual([]);
  });
});
