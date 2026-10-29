// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the header settings being checked
import { STRICT_TRANSPORT_SECURITY, contentSecurityPolicy, devTunnelHosts } from "@/config/securityHeaders";
// Load the Next.js settings, to check they use them
import nextConfig from "../../../next.config";

// Group the checks about the page security headers (decision 87)
describe("security headers", () => {
  // Every directive the app relies on is present, and eval is allowed only while developing
  it("limits what pages load and where they send data", () => {
    // The production policy, split into directives
    const live = contentSecurityPolicy(false).split("; ");
    // Confirm the directives
    expect(live).toEqual(["default-src 'self'", "script-src 'self' 'unsafe-inline'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "media-src 'self' blob: data:", "connect-src 'self' wss://streaming.assemblyai.com wss://api.elevenlabs.io https://api.elevenlabs.io wss://*.rtc.elevenlabs.io https://*.rtc.elevenlabs.io", "font-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "frame-src https://www.youtube-nocookie.com", "worker-src 'self'", "manifest-src 'self'"]);
    // Confirm eval only while developing
    expect([contentSecurityPolicy(false).includes("unsafe-eval"), contentSecurityPolicy(true).includes("'unsafe-eval'")]).toEqual([false, true]);
  });

  // A script hash would make browsers ignore 'unsafe-inline' and block Next.js's own inline scripts, so none is listed
  it("lists no script hash or nonce beside 'unsafe-inline'", () => {
    // Confirm no hash or nonce source
    expect(/'(sha256|sha384|sha512|nonce)-/.test(contentSecurityPolicy(false))).toBe(false);
  });

  // Every page gets the policy and HTTPS-only; the service worker keeps its own headers
  it("is sent on every page, with the service worker's own rule kept", async () => {
    // The configured header rules
    const rules = (await nextConfig.headers?.()) ?? [];
    // The rule for every page, by its keys
    const page = Object.fromEntries((rules.find((rule) => rule.source === "/(.*)")?.headers ?? []).map((header) => [header.key, header.value]));
    // The service worker's rule
    const worker = rules.find((rule) => rule.source === "/sw.js");
    // Confirm both headers on pages, and the worker's cache rule
    expect([page["Content-Security-Policy"], page["Strict-Transport-Security"], worker?.headers.some((header) => header.key === "Cache-Control")]).toEqual([contentSecurityPolicy(false), STRICT_TRANSPORT_SECURITY, true]);
  });

  // The development server accepts no tunnel unless one is named (it used to accept any Cloudflare tunnel)
  it("accepts only the named tunnel hosts", () => {
    // Nothing set, one host, and a list with spaces and an empty entry
    expect([devTunnelHosts({}), devTunnelHosts({ DEV_TUNNEL_HOST: "my-tunnel.trycloudflare.com" }), devTunnelHosts({ DEV_TUNNEL_HOST: " a.example , ,b.example" })]).toEqual([[], ["my-tunnel.trycloudflare.com"], ["a.example", "b.example"]]);
  });
});
