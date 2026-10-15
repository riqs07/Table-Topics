// Whole journeys with the stand-in microphone: record, save, and read the result (rules T1, T3, T11)
import { expect, test, useStandIns } from "./support/fixtures";

// A Table Topic from the home page to the saved session
test("Table Topic: countdown, recording, saved session", async ({ page }) => {
  // Use the stand-in microphone and speech
  await useStandIns(page);
  // Start at home
  await page.goto("/");
  // Pick the Table Topic band
  await page.getByRole("link", { name: /Table Topic/ }).click();
  // The topic page opens
  await expect(page).toHaveURL(/mode=talk/);
  // Reveal the topic and start the countdown
  await page.getByRole("button", { name: /Show my topic/ }).click();
  // Recording starts by itself after the countdown
  const stop = page.getByRole("button", { name: /Stop/ });
  // The countdown is 10 seconds
  await expect(stop).toBeVisible({ timeout: 15_000 });
  // The timing light is showing
  await expect(page.getByRole("status", { name: "Timing light" })).toBeVisible();
  // Speak past the 10-second minimum
  await page.waitForTimeout(11_500);
  // Stop recording
  await stop.click();
  // The saved session opens (bug B1: never stuck on "Saving…")
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
  // The transcript is shown
  await expect(page.getByText(/tiny dog in a raincoat/).first()).toBeVisible();
});

// Rehearse my talk: save a talk, rehearse it, see the result, and find it in history
test("Rehearse my talk: save, rehearse, saved session, history", async ({ page }) => {
  // Use the stand-in microphone and speech
  await useStandIns(page);
  // Open the rehearse page
  await page.goto("/rehearse");
  // Give the talk a title
  await page.getByLabel("Title").fill("Team update");
  // Paste the talk
  await page.getByLabel("Your talk or notes").fill("The best part of my week was walking home and seeing a tiny dog in a raincoat.");
  // Save it
  await page.getByRole("button", { name: "Save talk" }).click();
  // Rehearse the saved talk
  await page.getByRole("link", { name: "Rehearse “Team update”" }).click();
  // Start rehearsing
  await page.getByRole("button", { name: /Start rehearsing/ }).click();
  // Recording is under way
  const stop = page.getByRole("button", { name: /Stop/ });
  // Wait for it
  await expect(stop).toBeVisible({ timeout: 10_000 });
  // Speak past the 10-second minimum
  await page.waitForTimeout(11_500);
  // Stop recording
  await stop.click();
  // The saved session opens
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
  // It names the talk that was rehearsed
  await expect(page.getByText(/Team update/).first()).toBeVisible();
  // History lists it
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "History", exact: true }).click();
  // At least one session row
  await expect(page.getByRole("link", { name: /Team update|Rehearsal/ }).first()).toBeVisible();
});

// Storage left by another project at the same address (bugs B2 and B4)
test("works when another app left a database called voicelab", async ({ page }) => {
  // Use the stand-in microphone and speech
  await useStandIns(page);
  // Any page on the address, to reach its storage
  await page.goto("/settings");
  // Build the other project's database the way it really was: version 10, in-line keys
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        // Open at version 10, as the other project did
        const request = indexedDB.open("voicelab", 10);
        // Lay it out with in-line keys
        request.onupgradeneeded = () => request.result.createObjectStore("sessions", { keyPath: "id" });
        // Done
        request.onsuccess = () => {
          // Close it so the app can open its own
          request.result.close();
          // Carry on
          resolve();
        };
        // Report a failure
        request.onerror = () => reject(request.error);
      }),
  );
  // Record a prepared response
  await page.goto("/session?mode=response&prompt=p001");
  // Start thinking
  await page.getByRole("button", { name: /Start thinking/ }).click();
  // Skip the rest of the thinking time
  await page.getByRole("button", { name: /Ready/ }).click();
  // Recording is under way
  const stop = page.getByRole("button", { name: /Stop/ });
  // Wait for it
  await expect(stop).toBeVisible({ timeout: 10_000 });
  // Speak past the 10-second minimum
  await page.waitForTimeout(11_500);
  // Stop recording
  await stop.click();
  // It saves in VoiceLab's own database, untroubled by the other one
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
});
