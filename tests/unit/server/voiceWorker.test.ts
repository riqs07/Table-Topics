// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the client being checked
import { WORKER_SECRET_HEADER, createHttpVoiceWorker } from "@/server/voiceWorker";

// A reply as the worker sends it
const REPLY = { version: "1", praat_version: "6.1.38", duration_s: 3, voiced_s: 2, jitter_local_pct: 1.2, shimmer_local_db: 0.5, hnr_db: 14.2, alpha_ratio_db: -18.4, hammarberg_db: 24.1, creak_pct: 6.5, syllables: 12, speech_rate_sps: 4, articulation_rate_sps: 4.4, f0: { median_hz: 130, p10_hz: 100, p90_hz: 180, range_st: 10.2, sd_st: 3.1 }, emotion: null };

// Group the checks about the voice worker client (decision 91)
describe("voice worker client", () => {
  // The audio goes with its kind and the secret; the reply is checked
  it("sends the audio with its kind and the secret, and reads the findings", async () => {
    // What was sent
    let sent: { url: string; headers: Record<string, string> } | null = null;
    // A fake worker
    const fetchFn = (async (input: string | URL | Request, init?: RequestInit) => {
      // Noted
      sent = { url: String(input), headers: Object.fromEntries(new Headers(init?.headers).entries()) };
      // The findings
      return Response.json(REPLY);
    }) as typeof fetch;
    // Measured
    const reply = await createHttpVoiceWorker("https://w.example", "a long worker secret for testing", fetchFn).analyse(new ArrayBuffer(4), "audio/webm", new AbortController().signal);
    // Where, how, and what came back
    expect([sent, reply.hnr_db]).toEqual([{ url: "https://w.example/analyse", headers: { "content-type": "audio/webm", [WORKER_SECRET_HEADER]: "a long worker secret for testing" } }, 14.2]);
  });

  // A refusal fails by status; a reply of the wrong shape fails too
  it("fails on a refusal or a reply of the wrong shape", async () => {
    // A refusing worker, and a confused one
    const [refusing, confused] = [(async () => new Response("no", { status: 401 })) as typeof fetch, (async () => Response.json({ version: "1" })) as typeof fetch];
    // Both fail
    const failures = await Promise.all([refusing, confused].map((fetchFn) => createHttpVoiceWorker("https://w.example", "s", fetchFn).analyse(new ArrayBuffer(1), "audio/webm", new AbortController().signal).then(() => "worked", (error: Error) => error.message.slice(0, 27))));
    // The reasons
    expect(failures[0]).toBe("The voice worker answered 4");
    // (a shape failure)
    expect(failures[1]).not.toBe("worked");
  });
});
