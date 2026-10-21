// Stored data from an older version of the app, in a real browser (decision 98, rule T3): a database laid out before readings were kept apart is moved when the app is idle, and History, the profile and a take's page work before and after
import { expect, test } from "./support/fixtures";
// Load the analysis builder, to make analyses exactly as the older app saved them (with their words)
import { buildAnalysis } from "@/core/analysis/analysis";
// Load the record types
import type { AnalysisRecord, FullSession } from "@/data/records";
// Load the page type
import type { Page } from "@playwright/test";

// One day in milliseconds
const DAY = 86_400_000;
// Pitch readings in five phrases, each ending rising, with silence between (as the unit tests' "rising" voice)
const PHRASE = Array.from({ length: 20 }, (_, index) => (index >= 17 ? 240 : 200));
// (the silence)
const GAP: null[] = Array(8).fill(null);
// The take's pitch
const PITCH = [PHRASE, GAP, PHRASE, GAP, PHRASE, GAP, PHRASE, GAP, PHRASE].flat();
// Its loudness: speech where there is pitch, quiet between
const LOUDNESS = PITCH.map((reading) => (reading === null ? 0.01 : 0.2));

// A take as the older app saved it: its readings on the session, a number of days before now
function oldTake(id: string, daysAgo: number, now: number, extra: Partial<FullSession> = {}): FullSession {
  // The take
  return {
    // Identity and time
    id, createdAt: new Date(now - daysAgo * DAY).toISOString(), promptId: "t001", isBaseline: false, retryOf: null, mode: "talk",
    // What was said and how
    durationSec: 13, transcript: "so the best part of my week was walking home and seeing a tiny dog in a raincoat", wordsPerMinute: 120, fillersPerMinute: 1,
    // Focus and feedback
    focus: "cut-fillers", feedback: { keep: "You ended on the dog.", change: "Pause before your first word.", retryCue: "Breathe, then start." }, feedbackStatus: "done",
    // No recording kept, and the readings inline, as before decision 98
    audioKey: null, loudness: LOUDNESS, pitch: PITCH, spokenTimes: [0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0, 4.4, 4.8, 5.2, 5.6, 6.0, 6.4, 6.8, 7.2],
    // Anything the check changes
    ...extra,
  };
}

// Make the database exactly as the older app laid it out, holding the given takes and analyses, from a blank page on the app's address (so the app has not opened it first)
async function seedOldDatabase(page: Page, sessions: FullSession[], analyses: AnalysisRecord[]): Promise<void> {
  // A blank page on the app's address
  await page.route("**/__blank", (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>blank</title>" }));
  // Opened
  await page.goto("/__blank");
  // The older layout: eight collections, keys outside the records, no lookups, at version 1
  await page.evaluate(
    ({ sessions, analyses }) =>
      new Promise<void>((resolve, reject) => {
        // Open it as the older app did
        const request = indexedDB.open("voicelab-practice-journal", 1);
        // Its collections
        request.onupgradeneeded = () => ["sessions", "challenges", "settings", "audio", "talks", "analyses", "summaries", "stories"].forEach((name) => request.result.createObjectStore(name));
        // Fill it
        request.onsuccess = () => {
          // One transaction
          const transaction = request.result.transaction(["sessions", "analyses"], "readwrite");
          // Each take
          for (const session of sessions) transaction.objectStore("sessions").put(session, session.id);
          // Each analysis
          for (const analysis of analyses) transaction.objectStore("analyses").put(analysis, analysis.sessionId);
          // Closed when done, as when the older app's tab closed
          transaction.oncomplete = () => {
            // Released
            request.result.close();
            // Done
            resolve();
          };
          // Failed
          transaction.onerror = () => reject(transaction.error);
        };
        // Failed
        request.onerror = () => reject(request.error);
      }),
    { sessions, analyses },
  );
}

// Read the stored layout facts: the layout version, how many readings records, and whether any session still carries its readings
async function storedLayout(page: Page): Promise<{ schema: number | null; signals: number; inline: number }> {
  // Read inside the page
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        // Open as it is
        const request = indexedDB.open("voicelab-practice-journal");
        // Read
        request.onsuccess = () => {
          // The database
          const database = request.result;
          // Not moved yet: no new collections
          if (!database.objectStoreNames.contains("meta")) {
            // Released
            database.close();
            // Nothing moved
            return resolve({ schema: null, signals: 0, inline: -1 });
          }
          // One read-only transaction
          const transaction = database.transaction(["meta", "signals", "sessions"], "readonly");
          // The three reads
          const [meta, signals, sessions] = [transaction.objectStore("meta").get("schema"), transaction.objectStore("signals").count(), transaction.objectStore("sessions").getAll()];
          // Answered when done
          transaction.oncomplete = () => {
            // Released
            database.close();
            // The facts
            resolve({ schema: (meta.result as { schema: number } | undefined)?.schema ?? null, signals: signals.result, inline: (sessions.result as Array<Record<string, unknown>>).filter((session) => "pitch" in session).length });
          };
          // Failed
          transaction.onerror = () => reject(transaction.error);
        };
        // Failed
        request.onerror = () => reject(request.error);
      }),
  );
}

// An older database in, the current layout out, and the pages work throughout
test("upgrades an older database and History, the profile and a take still work", async ({ page }) => {
  // Now, for the takes' dates
  const now = Date.now();
  // Sixty older takes over the last four weeks, the oldest the first recording; the newest two days old; one more two months old to have its readings dropped
  const sessions = [...Array.from({ length: 60 }, (_, index) => oldTake(`take-${index}`, 2 + index * 0.4, now, index === 59 ? { isBaseline: true } : {})), oldTake("old-plain", 70, now)];
  // Their analyses, as the older app saved them (with their words)
  const analyses = sessions.map((session) => buildAnalysis(session, new Date(session.createdAt)));
  // The older database, made before the app opens it
  await seedOldDatabase(page, sessions, analyses);

  // History lists them, a page at a time (decision 99), straight away (the move happens later, when the page is idle)
  await page.goto("/history");
  // The list's first page
  await expect(page.getByRole("list", { name: "Sessions" }).getByRole("link")).toHaveCount(50);
  // And the way to see more
  await expect(page.getByRole("button", { name: "Show more" })).toBeVisible();

  // Wait for the move and the upkeep, which run when the page is idle
  await expect.poll(async () => (await storedLayout(page)).schema, { timeout: 20_000 }).toBe(2);
  // The stored layout now
  const layout = await storedLayout(page);
  // Every reading moved apart; the two-month-old take's readings dropped, the others kept (the first recording is kept whole)
  expect([layout.inline, layout.signals]).toEqual([0, 60]);

  // A recent take's page still draws its voice chart, now from the readings kept apart
  await page.goto("/sessions?id=take-0");
  // The voice section with its pitch line
  await expect(page.getByRole("region", { name: "Your voice" }).getByRole("img", { name: /Your pitch across the take/ })).toBeVisible();
  // Star it
  await page.getByRole("button", { name: "Star this take" }).click();
  // Starred
  await expect(page.getByRole("button", { name: "Starred" })).toHaveAttribute("aria-pressed", "true");
  // Still starred after a reload
  await page.reload();
  // (checked)
  await expect(page.getByRole("button", { name: "Starred" })).toBeVisible();

  // The old take's page says its charts are not kept, and shows its words and feedback
  await page.goto("/sessions?id=old-plain");
  // The note where the charts were
  await expect(page.getByText("Detailed charts aren’t kept for older takes. The words, numbers and feedback are all here.")).toBeVisible();
  // Its feedback
  await expect(page.getByText("You ended on the dog.")).toBeVisible();

  // The profile opens with every take measured
  await page.goto("/profile");
  // Its heading
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Not stuck measuring, and no error
  await expect(page.getByText("Measuring your earlier takes")).toHaveCount(0, { timeout: 20_000 });
  // (no error shown; Next.js keeps an empty alert of its own for announcing page changes)
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveCount(0);
});

// An opening drill saved before the drill was retired (decision 106) still shows in History, on its own page and in the profile
test("an old openings and closings drill still shows everywhere", async ({ page }) => {
  // Now
  const now = Date.now();
  // An old opening drill and an ordinary take
  const sessions = [oldTake("old-drill", 3, now, { mode: "bookend", promptId: "b001", transcript: "Um, so, today I want to talk about tools.", durationSec: 38 }), oldTake("plain", 4, now, { isBaseline: true })];
  // Saved as the older app laid them out
  await seedOldDatabase(page, sessions, sessions.map((session) => buildAnalysis(session, new Date(session.createdAt))));
  // History names it as an opening drill with its task
  await page.goto("/history");
  // (its row)
  await expect(page.getByRole("list", { name: "Sessions" }).getByRole("link", { name: /Opening drill: Open a talk on why your team needs a new tool/ })).toBeVisible();
  // Its page shows the drill's findings, and trying again leads to the opening lesson
  await page.goto("/sessions?id=old-drill");
  // (the findings)
  await expect(page.getByText("You opened with “Um, so”. Start on your first real word instead.")).toBeVisible();
  // (the lesson)
  await expect(page.getByRole("link", { name: /Try it again/ }).first()).toHaveAttribute("href", "/session?mode=lesson&prompt=l001");
  // The profile counts it with speaking on the spot
  await page.goto("/profile");
  // (two takes measured)
  await expect(page.getByText(/^2 takes measured/)).toBeVisible({ timeout: 20_000 });
});
