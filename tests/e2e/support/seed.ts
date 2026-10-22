// Put takes straight into the app's database for the browser checks (decision 111): the stand-in microphone's tone has a flat pitch, so takes with realistic pitch are made up and seeded, each split as the app stores it (the session, its readings apart, its analysis and a recording)
import type { Page } from "@playwright/test";
// Load the rule that keeps a take's readings apart from its session
import { splitSignals } from "@/core/sessionSignals";
// Load the record types
import type { AnalysisRecord, FullSession } from "@/data/records";

// What to seed
export interface Seed {
  // Takes with their readings
  sessions: ReadonlyArray<FullSession>;
  // Their analyses (with the service's words where exact times are wanted)
  analyses?: ReadonlyArray<AnalysisRecord>;
  // Recordings to make, by key, with their length in seconds (a soft tone, so playback has something to play)
  audio?: ReadonlyArray<{ key: string; seconds: number }>;
}

// Open the app once so it makes its database, then write the takes into it as the app lays them out
export async function seedTakes(page: Page, seed: Seed): Promise<void> {
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // A page that opens the database
  await page.goto("/history");
  // Let it settle (the database made and its upkeep run)
  await page.waitForLoadState("networkidle");
  // Each take split into the session and its readings
  const parts = seed.sessions.map((session) => splitSignals(session));
  // Written inside the page
  await page.evaluate(
    ({ sessions, signals, analyses, audio }) =>
      new Promise<void>((resolve, reject) => {
        // A WAV recording of a soft tone of a given length
        const wav = (seconds: number): Blob => {
          // Samples a second
          const rate = 8000;
          // How many samples
          const count = Math.round(seconds * rate);
          // The file: a 44-byte header, then 16-bit samples
          const buffer = new ArrayBuffer(44 + count * 2);
          // Written through a view
          const view = new DataView(buffer);
          // Text into the header
          const text = (at: number, value: string) => [...value].forEach((letter, index) => view.setUint8(at + index, letter.charCodeAt(0)));
          // The header
          text(0, "RIFF"); view.setUint32(4, 36 + count * 2, true); text(8, "WAVE"); text(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, "data"); view.setUint32(40, count * 2, true);
          // A quiet 200 Hz tone
          for (let index = 0; index < count; index++) view.setInt16(44 + index * 2, Math.round(1500 * Math.sin((2 * Math.PI * 200 * index) / rate)), true);
          // As a recording
          return new Blob([buffer], { type: "audio/wav" });
        };
        // The app's database, as it is
        const request = indexedDB.open("voicelab-practice-journal");
        // Opened
        request.onsuccess = () => {
          // One transaction over everything written
          const transaction = request.result.transaction(["sessions", "signals", "analyses", "audio", "meta"], "readwrite");
          // Each session
          for (const session of sessions) transaction.objectStore("sessions").put(session, session.id);
          // Each take's readings
          for (const record of signals) transaction.objectStore("signals").put(record, record.sessionId);
          // Each analysis
          for (const analysis of analyses) transaction.objectStore("analyses").put(analysis, analysis.sessionId);
          // Each recording
          for (const item of audio) transaction.objectStore("audio").put(wav(item.seconds), item.key);
          // The layout is current
          transaction.objectStore("meta").put({ schema: 2, migratedAt: new Date().toISOString() }, "schema");
          // Done
          transaction.oncomplete = () => {
            // Released
            request.result.close();
            // Finished
            resolve();
          };
          // Failed
          transaction.onerror = () => reject(transaction.error);
        };
        // Failed
        request.onerror = () => reject(request.error);
      }),
    { sessions: parts.map((part) => part.session), signals: parts.flatMap((part) => (part.signals ? [part.signals] : [])), analyses: [...(seed.analyses ?? [])], audio: [...(seed.audio ?? [])] },
  );
}
