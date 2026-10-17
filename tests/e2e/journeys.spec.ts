// Whole journeys with the stand-in microphone: record, save, and read the result (rules T1, T3, T11)
import { expect, test, useStandIns } from "./support/fixtures";

// The welcome leads straight into a one-minute reading; then a Table Topic from Practice, to the saved session
test("Table Topic: from the welcome through Practice, countdown, recording, saved session", async ({ page }) => {
  // Use the stand-in microphone and speech
  await useStandIns(page);
  // Start at home
  await page.goto("/");
  // A first visit asks one question: choose speaking on the spot
  await page.getByRole("link", { name: "I want to speak better on the spot" }).click();
  // It opens today's first step, a short reading, ready to start
  await expect(page).toHaveURL(/mode=read&prompt=[a-z0-9-]+&plan=1/);
  // Go to Practice instead
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Practice", exact: true }).click();
  // Start a Table Topic
  await page.getByRole("link", { name: "Start a Table Topic" }).click();
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
  // The transcript is shown, in the listen-back step
  await expect(page.getByText(/raincoat/).first()).toBeVisible();
  // Listen back: play the recording
  await page.getByRole("button", { name: "Play your recording" }).click();
  // Saving opens once it has all been heard
  const save = page.getByRole("button", { name: /Save my notes/ });
  // The recording is about 12 seconds long
  await expect(save).toBeEnabled({ timeout: 20_000 });
  // Note what to change
  await page.getByLabel("What would you change?").fill("Start without the um");
  // Tap a tag
  await page.getByRole("button", { name: "Fillers" }).click();
  // Save
  await save.click();
  // The notes show with the feedback page
  await expect(page.getByText("Start without the um")).toBeVisible();
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
  // Skip listening back this time
  await page.getByRole("button", { name: "Skip this time" }).click();
  // It names the talk that was rehearsed
  await expect(page.getByText(/Team update/).first()).toBeVisible();
  // History lists it
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "History", exact: true }).click();
  // At least one session row
  await expect(page.getByRole("link", { name: /Team update|Rehearsal/ }).first()).toBeVisible();
});

// Event prep: a dated talk in sections, today's step from its page, and progress after the run
test("Event prep: date a talk, follow today's step, see progress", async ({ page }) => {
  // Use the stand-in microphone and speech
  await useStandIns(page);
  // Open the rehearse page
  await page.goto("/rehearse");
  // Give the talk a title
  await page.getByLabel("Title").fill("Pitch");
  // Two sections, so the plan has an opening and a close
  await page.getByLabel("Your talk or notes").fill("The best part of my week was walking home.\n\nI saw a tiny dog in a raincoat.");
  // A date three days from today, in the browser's own time zone
  const date = await page.evaluate(() => {
    // Three days ahead
    const day = new Date(Date.now() + 3 * 86_400_000);
    // As "2026-10-18"
    return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
  });
  // Set it
  await page.getByLabel(/Date of the talk/).fill(date);
  // Save the talk
  await page.getByRole("button", { name: "Save talk" }).click();
  // Open its page
  await page.getByRole("link", { name: "Pitch", exact: true }).click();
  // Today's step, three days out
  await expect(page.getByText("Your talk is in 3 days. Today: rehearse the opening and the close, twice each.")).toBeVisible();
  // Rehearse the opening
  await page.getByRole("list", { name: "Today" }).getByRole("link").first().click();
  // Only the opening shows
  await expect(page.getByTestId("passage")).toHaveText("The best part of my week was walking home.");
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
  // Skip listening back this time
  await page.getByRole("button", { name: "Skip this time" }).click();
  // Go back to the talk
  await page.getByRole("link", { name: "Back to your talk" }).click();
  // The opening shows one of two runs done
  await expect(page.getByRole("list", { name: "Today" }).getByRole("listitem").first()).toContainText("1 of 2");
});

// Openings and closings: from home, an opening drill with its light, then its findings
test("Openings and closings: an opening drill from home to its findings", async ({ page }) => {
  // Use the stand-in microphone and speech
  await useStandIns(page);
  // Start at home
  await page.goto("/");
  // Open the drills from Practice
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Practice", exact: true }).click();
  // Its page
  await page.getByRole("link", { name: "Choose an opening or a close" }).click();
  // Pick today's opening (the first prompt link under "Today")
  await page.locator("section", { hasText: "Today" }).getByRole("link").first().click();
  // The drill opens with its tip
  await expect(page.getByText(/Stand still, breathe in, look up/)).toBeVisible();
  // Start speaking
  await page.getByRole("button", { name: /Start speaking/ }).click();
  // Recording is under way, with a timing light
  await expect(page.getByRole("status", { name: "Timing light" })).toBeVisible({ timeout: 10_000 });
  // Speak past the 10-second minimum
  await page.waitForTimeout(11_500);
  // Stop recording
  await page.getByRole("button", { name: /Stop/ }).click();
  // Skip listening back this time
  await page.getByRole("button", { name: "Skip this time" }).click({ timeout: 15_000 });
  // The saved session shows the drill's findings
  await expect(page.getByText(/You opened with “Um so”/)).toBeVisible();
});

// Q&A practice: after a response, write your own questions, answer one, and see it with its question
test("Q&A practice: write questions after a response and answer one", async ({ page }) => {
  // Use the stand-in microphone and speech
  await useStandIns(page);
  // Record a prepared response
  await page.goto("/session?mode=response&prompt=p040");
  // Start thinking
  await page.getByRole("button", { name: /Start thinking/ }).click();
  // Skip the rest of the thinking time
  await page.getByRole("button", { name: /Ready/ }).click();
  // Speak past the minimum
  await expect(page.getByRole("button", { name: /Stop/ })).toBeVisible({ timeout: 10_000 });
  // Wait
  await page.waitForTimeout(11_500);
  // Stop
  await page.getByRole("button", { name: /Stop/ }).click();
  // Skip listening back this time
  await page.getByRole("button", { name: "Skip this time" }).click({ timeout: 15_000 });
  // Open Q&A practice from the saved session
  await page.getByRole("link", { name: "Practise Q&A" }).click();
  // Without a passphrase, asking the coach explains what to do and calls nothing
  await page.getByRole("button", { name: "Suggest three questions" }).click();
  // The explanation
  await expect(page.getByText(/Add the passphrase in Settings/)).toBeVisible();
  // Write two questions instead
  await page.getByLabel(/Or write your own/).fill("Why now?\nWhat does it cost?");
  // Use them
  await page.getByRole("button", { name: "Use these" }).click();
  // Answer the first
  await page.getByRole("link", { name: "Answer “Why now?”" }).click();
  // The question is on screen
  await expect(page.getByText("Why now?")).toBeVisible();
  // Start speaking
  await page.getByRole("button", { name: /Start speaking/ }).click();
  // A timing light while answering
  await expect(page.getByRole("status", { name: "Timing light" })).toBeVisible({ timeout: 10_000 });
  // Speak past the minimum
  await page.waitForTimeout(11_500);
  // Stop
  await page.getByRole("button", { name: /Stop/ }).click();
  // The answer's page shows the question
  await expect(page.getByText("Q&A answer")).toBeVisible({ timeout: 15_000 });
  // Skip listening back this time
  await page.getByRole("button", { name: "Skip this time" }).click();
  // Back to the questions, which now counts the answer
  await page.getByRole("link", { name: "Back to the questions" }).click();
  // The count
  await expect(page.getByText("answered once")).toBeVisible();
});

// Reading aloud: the words light up as they are read, and the reading is saved
test("Read aloud: words light up as they are read, then the reading is saved", async ({ page }) => {
  // The stand-in speech reads the opening of the Gettysburg Address
  await useStandIns(page, "Four score and seven years ago our fathers brought forth on this continent a new nation conceived in Liberty");
  // Open the reading
  await page.goto("/session?mode=read&prompt=r001");
  // Start reading
  await page.getByRole("button", { name: /Start reading/ }).click();
  // Recording is under way
  await expect(page.getByRole("button", { name: /Stop/ })).toBeVisible({ timeout: 10_000 });
  // The words read so far light up, with the next word marked
  await expect(page.locator('[data-read="read"]')).toHaveCount(19, { timeout: 10_000 });
  // The next word to read is marked
  await expect(page.locator('[data-read="current"]')).toHaveCount(1);
  // Speak past the 10-second minimum
  await page.waitForTimeout(8_000);
  // Stop
  await page.getByRole("button", { name: /Stop/ }).click();
  // Skip listening back this time
  await page.getByRole("button", { name: "Skip this time" }).click({ timeout: 15_000 });
  // The saved reading says how much was read
  await expect(page.getByTestId("reading-headline")).toHaveText(/^You read \d+% of the words\.$/, { timeout: 15_000 });
});

// A whole speech in parts: from Skills to the speech, read part 1, and go on to part 2
test("Whole speech: open it from Skills, read part 1, then go on to part 2", async ({ page }) => {
  // The stand-in speech reads the opening of Lincoln's second inaugural
  await useStandIns(page, "Fellow Countrymen At this second appearing to take the oath of the Presidential office there is less occasion for an extended address than there was at the first");
  // Start at Skills
  await page.goto("/skills");
  // Open Lincoln's second inaugural
  await page.getByRole("list", { name: "Whole speeches, a part at a time" }).getByRole("link", { name: /Second Inaugural Address/ }).click();
  // Its page lists seven parts of about a minute
  await expect(page.getByRole("list", { name: "Parts" }).getByRole("link")).toHaveCount(7);
  // Read the next part (part 1)
  await page.locator("[data-action-band]").click();
  // Start reading
  await page.getByRole("button", { name: /Start reading/ }).click();
  // The words light up as they are read
  await expect(page.locator('[data-read="read"]').first()).toBeVisible({ timeout: 10_000 });
  // Read past the minimum
  await page.waitForTimeout(11_500);
  // Stop
  await page.getByRole("button", { name: /Stop/ }).click();
  // Skip listening back this time
  await page.getByRole("button", { name: "Skip this time" }).click({ timeout: 15_000 });
  // Go on to part 2
  await page.getByRole("link", { name: "Read part 2" }).click();
  // Part 2 opens
  await expect(page.getByText("Second Inaugural Address, part 2 of 7")).toBeVisible();
});

// Today's practice: start from Today, do both steps without waiting to listen back, and finish
test("Today's practice: start, move through both steps, finish", async ({ page }) => {
  // The stand-in speech reads the opening of the warm-up speech
  await useStandIns(page, "Fellow Countrymen At this second appearing to take the oath of the Presidential office there is less occasion for an extended address than there was at the first");
  // Start at Today
  await page.goto("/");
  // Skip the welcome question, which opens the first step straight away
  await page.getByRole("link", { name: "Skip" }).click();
  // Step 1 of 2: the warm-up reading
  await expect(page.getByText("Today’s practice · step 1 of 2")).toBeVisible();
  // Start reading
  await page.getByRole("button", { name: /Start reading/ }).click();
  // Read past the minimum
  await expect(page.getByRole("button", { name: /Stop/ })).toBeVisible({ timeout: 10_000 });
  // Wait
  await page.waitForTimeout(11_500);
  // Stop
  await page.getByRole("button", { name: /Stop/ }).click();
  // Move on without listening back
  await page.getByRole("button", { name: /^Next: step 2/ }).click({ timeout: 15_000 });
  // Step 2: a Table Topic; show the topic, and recording starts after the countdown
  await page.getByRole("button", { name: /Show my topic/ }).click();
  // Speak past the minimum
  await expect(page.getByRole("button", { name: /Stop/ })).toBeVisible({ timeout: 15_000 });
  // Wait
  await page.waitForTimeout(11_500);
  // Stop
  await page.getByRole("button", { name: /Stop/ }).click();
  // Finish
  await page.getByRole("button", { name: /^Finish today’s practice/ }).click({ timeout: 15_000 });
  // Today says the practice is done
  await expect(page.getByRole("heading", { name: "Done for today." })).toBeVisible();
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

// The first ever recording, in a browser about to ask for the microphone: the explanation first, then recording
test("explains the microphone before the browser asks", async ({ page }) => {
  // Use the stand-in microphone and speech
  await useStandIns(page);
  // Make the browser say it is about to ask (this run has the microphone allowed already)
  await page.addInitScript(() => {
    // Answer every microphone check with "about to ask"
    navigator.permissions.query = async () => ({ state: "prompt" }) as PermissionStatus;
  });
  // Open a reading
  await page.goto("/session?mode=read&prompt=r001");
  // Start reading
  await page.getByRole("button", { name: /Start reading/ }).click();
  // The explanation shows first
  await expect(page.getByRole("heading", { name: "VoiceLab listens through your microphone." })).toBeVisible();
  // Allow the microphone
  await page.getByRole("button", { name: /Allow microphone/ }).click();
  // Recording starts
  await expect(page.getByRole("button", { name: /Stop/ })).toBeVisible({ timeout: 10_000 });
});
