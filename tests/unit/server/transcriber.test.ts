// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the client being checked
import { createAssemblyAiTranscriber } from "@/server/transcriber";

// One request the fake network saw
interface Seen {
  // Method and path
  call: string;
  // The headers
  headers: Record<string, string>;
  // The body, as text when it was text
  body: unknown;
}

// A fake AssemblyAI: answers upload, submit, and each poll in turn from a list, and notes every request
function fakeAssemblyAi(polls: unknown[], overrides: { uploadStatus?: number } = {}) {
  // Requests seen
  const seen: Seen[] = [];
  // The network
  const fetchFn = (async (input: string | URL | Request, init?: RequestInit) => {
    // The path and method
    const url = new URL(String(input));
    // (method)
    const method = init?.method ?? "GET";
    // Noted
    seen.push({ call: `${method} ${url.pathname}`, headers: Object.fromEntries(new Headers(init?.headers).entries()), body: typeof init?.body === "string" ? JSON.parse(init.body) : init?.body });
    // The upload
    if (url.pathname === "/v2/upload") return Response.json({ upload_url: "https://cdn.example/u1" }, { status: overrides.uploadStatus ?? 200 });
    // The submission
    if (method === "POST") return Response.json({ id: "t1", status: "queued" });
    // The deletion
    if (method === "DELETE") return Response.json({ id: "t1" });
    // The next poll answer
    return Response.json(polls.shift() ?? { status: "processing" });
  }) as typeof fetch;
  // Both
  return { seen, fetchFn };
}

// No real waiting between polls
const noWait = async () => {};
// A completed transcript
const DONE = { status: "completed", text: "Um, hi.", words: [{ text: "Um,", start: 100, end: 300, confidence: 0.8 }, { text: "hi.", start: 600, end: 900, confidence: 0.95 }] };

// Group the checks about the AssemblyAI client (decision 91)
describe("AssemblyAI transcriber", () => {
  // Upload, submit with the verbatim settings, poll until done, then delete
  it("uploads, asks for a verbatim transcript, waits, reads it and deletes it", async () => {
    // The fake
    const { seen, fetchFn } = fakeAssemblyAi([{ status: "processing" }, DONE]);
    // Transcribed
    const result = await createAssemblyAiTranscriber("aai-test", { fetchFn, sleep: noWait }).transcribe(new ArrayBuffer(4), new AbortController().signal);
    // The calls in order, the key on each, the submission's settings, and the result
    expect([seen.map((request) => request.call), seen.every((request) => request.headers.authorization === "aai-test"), seen[1]!.body, result]).toEqual([
      ["POST /v2/upload", "POST /v2/transcript", "GET /v2/transcript/t1", "GET /v2/transcript/t1", "DELETE /v2/transcript/t1"],
      true,
      { audio_url: "https://cdn.example/u1", speech_models: ["universal-3-pro"], language_code: "en", disfluencies: true, punctuate: true, format_text: true },
      { text: "Um, hi.", words: DONE.words },
    ]);
  });

  // The service's own failure is reported, and the transcript is still deleted
  it("reports a failed transcript and still deletes it", async () => {
    // The fake fails
    const { seen, fetchFn } = fakeAssemblyAi([{ status: "error", error: "audio too short" }]);
    // Transcribing fails
    const failure = await createAssemblyAiTranscriber("aai-test", { fetchFn, sleep: noWait }).transcribe(new ArrayBuffer(4), new AbortController().signal).catch((error: Error) => error.message);
    // The reason, and the deletion
    expect([failure, seen.at(-1)?.call]).toEqual(["AssemblyAI could not transcribe the take: audio too short.", "DELETE /v2/transcript/t1"]);
  });

  // A refused request fails by status, never showing the key
  it("fails by status when a request is refused", async () => {
    // The upload is refused
    const { fetchFn } = fakeAssemblyAi([], { uploadStatus: 401 });
    // The message
    const failure = await createAssemblyAiTranscriber("aai-secret-key", { fetchFn, sleep: noWait }).transcribe(new ArrayBuffer(4), new AbortController().signal).catch((error: Error) => error.message);
    // Status only
    expect([failure, String(failure).includes("aai-secret-key")]).toEqual(["AssemblyAI answered 401 to POST /v2/upload.", false]);
  });

  // A transcript that never finishes stops when the signal says so (rule T2), and is deleted
  it("stops waiting when the signal is aborted", async () => {
    // Always processing
    const { seen, fetchFn } = fakeAssemblyAi([]);
    // A signal stopped after a few polls
    const controller = new AbortController();
    // Waiting aborts on the third poll
    let polls = 0;
    // The wait
    const sleep = async (_ms: number, signal: AbortSignal) => {
      // Count
      polls += 1;
      // Stop on the third
      if (polls === 3) controller.abort(new Error("time limit"));
      // Give up when stopped
      if (signal.aborted) throw signal.reason;
    };
    // Transcribing gives up
    const failure = await createAssemblyAiTranscriber("aai-test", { fetchFn, sleep }).transcribe(new ArrayBuffer(4), controller.signal).catch((error: Error) => error.message);
    // The reason, and the deletion
    expect([failure, seen.at(-1)?.call]).toEqual(["time limit", "DELETE /v2/transcript/t1"]);
  });
});
