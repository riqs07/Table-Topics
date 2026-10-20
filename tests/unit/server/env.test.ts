// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the environment reader being checked
import { readAccessSecret, readCounterStore, readServerEnv } from "@/server/env";

// Every variable set, for checks that remove one at a time
const FULL = { ANTHROPIC_API_KEY: "sk-test", APP_ACCESS_SECRET: "a long passphrase for testing", NODE_ENV: "test" };

// Group the checks about reading server settings
describe("readServerEnv", () => {
  // With everything set, the values come through
  it("reads the AI key and passphrase", () => {
    // Read the settings
    const env = readServerEnv(FULL);
    // Confirm the AI key
    expect(env.anthropicApiKey).toBe("sk-test");
    // Confirm the passphrase
    expect(env.accessSecret).toBe("a long passphrase for testing");
  });

  // A missing AI key must fail with a message that names the variable and where to set it
  it("fails clearly when the AI key is missing", () => {
    // Confirm the error names the variable and the fix
    expect(() => readServerEnv({ ...FULL, ANTHROPIC_API_KEY: "" })).toThrow(/ANTHROPIC_API_KEY is not set.*\.env\.local/);
  });

  // A missing passphrase must fail the same way
  it("fails clearly when the passphrase is missing", () => {
    // Confirm the error names the variable
    expect(() => readServerEnv({ ...FULL, APP_ACCESS_SECRET: undefined })).toThrow(/APP_ACCESS_SECRET is not set/);
  });

  // A short passphrase is easy to guess
  it("rejects a passphrase shorter than 16 characters", () => {
    // Confirm the error explains the rule
    expect(() => readServerEnv({ ...FULL, APP_ACCESS_SECRET: "short" })).toThrow(/at least 16 characters/);
  });

  // In production the rate-limit store is required, because server memory does not hold limits (risk R4)
  it("requires the rate-limit store in production", () => {
    // Confirm production without the store fails clearly
    expect(() => readServerEnv({ ...FULL, NODE_ENV: "production" })).toThrow(/rate-limit store/);
  });

  // The store's address and token are read when present (names set by the Upstash integration)
  it("reads the rate-limit store when present", () => {
    // Read settings with the store variables
    const env = readServerEnv({ ...FULL, NODE_ENV: "production", KV_REST_API_URL: "https://example.upstash.io", KV_REST_API_TOKEN: "token" });
    // Confirm the store settings
    expect(env.counterStore).toEqual({ url: "https://example.upstash.io", token: "token" });
  });

  // Outside production the store is optional, and counters are kept in memory with that limitation noted
  it("allows a missing store outside production", () => {
    // Confirm no store is configured in development
    expect(readServerEnv(FULL).counterStore).toBeNull();
  });
});

// The passphrase and the counter store are read on their own, so a caller is checked before the other settings are explained (decision 87)
describe("readAccessSecret and readCounterStore", () => {
  // The passphrase alone, trimmed, or null; even with the AI key missing
  it("reads the passphrase without the other settings", () => {
    // Set with spaces, missing, and blank
    expect([readAccessSecret({ APP_ACCESS_SECRET: "  short  " }), readAccessSecret({}), readAccessSecret({ APP_ACCESS_SECRET: "   " })]).toEqual(["short", null, null]);
  });

  // The store's settings under either name, or null
  it("reads the counter store under either name", () => {
    // The Vercel names, the Upstash names, and none
    expect([readCounterStore({ KV_REST_API_URL: "u", KV_REST_API_TOKEN: "t" }), readCounterStore({ UPSTASH_REDIS_REST_URL: "u", UPSTASH_REDIS_REST_TOKEN: "t" }), readCounterStore({})]).toEqual([{ url: "u", token: "t" }, { url: "u", token: "t" }, null]);
  });
});
