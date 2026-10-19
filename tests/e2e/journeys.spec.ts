// Whole journeys with the stand-in microphone: record, save, and read the result (rules T1, T3, T11)
import { expect, test, useStandIns } from "./support/fixtures";

// The welcome leads straight into today's first step, a Learn card; then a Table Topic from Practice, to the saved session
test("Table Topic: from the welcome through Practice, countdown, recording, saved session", async ({ page }) => {
  // Use the stand-in microphone and speech
  await useStandIns(page);
  // Start at home
  await page.goto("/");
  // A first visit has one Start and no tabs (decision 78)
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
  // Start
  await page.getByRole("link", { name: "Start", exact: true }).click();
  // It opens today's first step: on day one, free talk (decision 78)
  await expect(page).toHaveURL(/\/session\?mode=free&prompt=free&plan=1/);
  // Close it (practising hides the tab bar), back to Today
  await page.getByRole("link", { name: "Close, back to Today" }).click();
  // Go to Practice instead
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Practice", exact: true }).click();
  // Start a Table Topic from its row
  await page.getByRole("link", { name: /^Table Topic/ }).click();
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
  // The results show at once, with the one change and the player (decision 67)
  await expect(page.getByText("One change", { exact: true })).toBeVisible();
  // Play the recording
  await page.getByRole("button", { name: "Play your recording" }).click();
  // Open the optional notes
  await page.getByText("Add your notes").click();
  // Tap a tag
  await page.getByRole("button", { name: "Pause words", exact: true }).click();
  // Note what to change
  await page.getByLabel("Anything else? (optional)").fill("Start without the um");
  // Save
  await page.getByRole("button", { name: "Save my notes" }).click();
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
  // It names the talk that was rehearsed
  await expect(page.getByText(/Team update/).first()).toBeVisible();
  // History, linked from Settings, lists it (decision 79)
  await page.locator("header").getByRole("link", { name: "Settings" }).click();
  // Open the history page
  await page.getByRole("link", { name: "See your practice history" }).click();
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
  // Go back to the talk
  await page.getByRole("link", { name: "Back to your talk" }).click();
  // The opening shows one of two runs done
  await expect(page.getByRole("list", { name: "Today" }).getByRole("listitem").first()).toContainText("1 of 2");
});

// Openings and closings: from home, an opening drill with its light, then its findings
test("Openings and closings: an opening drill from home to its findings", async ({ page }) => {
  // Use the stand-in microphone and speech
  await useStandIns(page);
  // Past the welcome, which has no tabs (decision 78)
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // Start at home
  await page.goto("/");
  // Open the drills from Practice
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Practice", exact: true }).click();
  // Its page, from its row
  await page.getByRole("link", { name: /^Openings and closings/ }).click();
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
  // The results open at once
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
  // The saved session shows the drill's findings
  await expect(page.getByText(/You opened with “Um so”/)).toBeVisible();
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
  // The results open at once
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
  // The saved reading says how far it got (stopped early, so not a low percentage)
  await expect(page.getByTestId("reading-headline")).toHaveText("You read the first 19 words.", { timeout: 15_000 });
});

// A whole speech in parts: from Skills to the speech, read part 1, and go on to part 2
test("Whole speech: open it from Skills, read part 1, then go on to part 2", async ({ page }) => {
  // The stand-in speech reads the opening of Lincoln's second inaugural
  await useStandIns(page, "Fellow Countrymen At this second appearing to take the oath of the Presidential office there is less occasion for an extended address than there was at the first");
  // Start at Skills, at the whole speeches (a link with #readings opens that group; decision 79)
  await page.goto("/skills#readings");
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
  // The results open at once
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
  // Go on to part 2
  await page.getByRole("link", { name: "Read part 2" }).click();
  // Part 2 opens
  await expect(page.getByText("Second Inaugural Address, part 2 of 7")).toBeVisible();
});

// Today's practice: start from Today with the Learn card, read the warm-up without waiting to listen back, and go on to the first pick
test("Today's practice: day one speaks first, then the card, then on to the picks", async ({ page }) => {
  // The stand-in speech says a little about the day
  await useStandIns(page, "Today I walked to work and the sun was out so I took the long way round past the river");
  // Start at Today
  await page.goto("/");
  // The welcome's Start opens the first step straight away
  await page.getByRole("link", { name: "Start", exact: true }).click();
  // Step 1 of 4 on day one: free talk (decision 78)
  await expect(page.getByText("Today’s practice · step 1 of 4")).toBeVisible();
  // Start speaking
  await page.getByRole("button", { name: /Start speaking/ }).click();
  // Speak past the minimum
  await expect(page.getByRole("button", { name: /Stop/ })).toBeVisible({ timeout: 10_000 });
  // Wait
  await page.waitForTimeout(11_500);
  // Stop
  await page.getByRole("button", { name: /Stop/ }).click();
  // On to the card
  await page.getByRole("link", { name: /^Next: step 2/ }).click({ timeout: 15_000 });
  // Step 2 of 4: the Learn card
  await expect(page.getByText("Step 2 of 4")).toBeVisible();
  // Read it one screen at a time, to the last
  for (let screen = 0; screen < 3; screen++) await page.getByRole("button", { name: "Next", exact: true }).click();
  // On to the first pick
  await page.getByRole("link", { name: /^Next: step 3/ }).click();
  // The first pick opens inside the plan
  await expect(page).toHaveURL(/plan=3/);
  // Back on Today, two steps are done and the next is the first pick
  await page.goto("/");
  // The action carries on from step 3
  await expect(page.locator("[data-action-band]")).toContainText("Continue: step 3");
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

// Small talk: from its tab, the first lesson, the question said aloud, an answer, listening back, and the beats
test("Small talk: a lesson from its tab to the beats", async ({ page }) => {
  // The stand-in speech answers the question
  await useStandIns(page, "Pretty quiet but I finally fixed my bike it was really fun did you get outside at all");
  // Start at the Answering unit
  await page.goto("/small-talk/unit?id=answering");
  // Start the first lesson from the main action
  await page.locator("[data-action-band]").click();
  // The lesson teaches before the question
  await expect(page.getByRole("region", { name: "The lesson" })).toContainText("The dead end");
  // Hear the question; recording starts once it has been said
  await page.getByRole("button", { name: /Hear the question/ }).click();
  // Recording is under way
  const stop = page.getByRole("button", { name: /Stop/ });
  // The phone's voice may take a few seconds
  await expect(stop).toBeVisible({ timeout: 15_000 });
  // Speak past the minimum
  await page.waitForTimeout(11_500);
  // Stop
  await stop.click();
  // The answer opens on its results
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
  // Open the optional beats to tick
  await page.getByText("Which beats did you hear yourself do?").click();
  // Tick the moment
  await page.getByRole("list", { name: "Listen for" }).getByRole("button", { name: /^Moment/ }).click();
  // Save
  await page.getByRole("button", { name: "Save my notes" }).click();
  // The beats show, with the phone's evidence
  await expect(page.getByRole("list", { name: "The beats" })).toContainText("“fun”");
  // Back on the Answering page, the answer is listed
  await page.getByRole("link", { name: /Another question/ }).click();
  // The answer is listed
  await expect(page.getByRole("region", { name: "Your answers" })).toContainText("How was your weekend?");
});

// Listening: from the Listening unit, a story heard but not shown, a short reply, and the story with the beats afterwards
test("Small talk: listen to a story and see it afterwards", async ({ page }) => {
  // The stand-in speech responds to the story
  await useStandIns(page, "no way you missed your stop and your boss was waiting that must have been so awkward");
  // Start at Practice
  await page.goto("/practice");
  // Open the Listening unit
  await page.getByRole("link", { name: /^Listening/ }).click();
  // Its practice box
  await page.getByRole("region", { name: "Listen to a story" }).getByRole("link", { name: "Listen and respond" }).click();
  // The story is not shown
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Listen to their story.");
  // Hear it; recording starts once it has been told
  await page.getByRole("button", { name: /Hear the story/ }).click();
  // Recording is under way
  const stop = page.getByRole("button", { name: /Stop/ });
  // The phone's voice may take a while for a story
  await expect(stop).toBeVisible({ timeout: 30_000 });
  // A short reply
  await page.waitForTimeout(3_000);
  // Stop
  await stop.click();
  // The reply opens on its result (too short to need listening back first)
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
  // Straight to the result: the story and the listening beats, then the next story
  await expect(page.getByRole("list", { name: "The beats" })).toContainText("React.");
  // The main action moves on
  await expect(page.locator("[data-action-band]")).toContainText("Next one");
});

// One moment a day: record a short private note from the Small talk page, and find it listed there
test("One moment a day: record a note and see it on the Small talk page", async ({ page }) => {
  // The stand-in speech tells the moment
  await useStandIns(page, "I fixed the bike chain myself and rode to the river");
  // Start at Practice
  await page.goto("/practice");
  // Record today's moment from its row
  await page.getByRole("link", { name: /^One moment a day/ }).click();
  // Start speaking
  await page.getByRole("button", { name: /Start speaking/ }).click();
  // Recording is under way
  const stop = page.getByRole("button", { name: /Stop/ });
  // Wait for it
  await expect(stop).toBeVisible({ timeout: 10_000 });
  // Speak past the minimum
  await page.waitForTimeout(11_500);
  // Stop
  await stop.click();
  // Straight back to the page, with the note listed
  await expect(page.getByRole("list", { name: "Your moments" })).toContainText("I fixed the bike chain myself", { timeout: 15_000 });
});

// Learn: from its tab, a myth-or-fact card screen by screen, then on to the next card (no quiz since decision 67)
test("Learn: read a card one screen at a time", async ({ page }) => {
  // Start at Learn
  await page.goto("/learn");
  // Open the body-language set
  await page.getByRole("link", { name: /^Body language: myth or fact, / }).click();
  // Open the "93%" card
  await page.getByRole("link", { name: /93% of communication/ }).click();
  // Guess
  await page.getByRole("button", { name: "Myth" }).click();
  // The verdict
  await expect(page.getByRole("status")).toContainText("It's a myth.");
  // Through the screens
  for (let screenNumber = 0; screenNumber < 3; screenNumber++) await page.getByRole("button", { name: "Next" }).click();
  // The last screen offers the next card
  await expect(page.getByRole("link", { name: "Next card" })).toBeVisible();
  // Back to the set
  await page.getByRole("link", { name: /^Close, back to Body language/ }).click();
  // The body-language set shows one read
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Body language: myth or fact");
  // The card is marked done on the set's path
  await expect(page.getByRole("list", { name: "Cards" })).toContainText("Done");
});

// A mission: accept it on Today with a prediction, debrief it, and see the outcome against the prediction
test("Mission: predict, try, debrief, compare", async ({ page }) => {
  // Start at Today
  await page.goto("/");
  // Skip the welcome question
  await page.getByRole("link", { name: "Start", exact: true }).click();
  // Back to Today from the first step
  await page.getByRole("link", { name: "Close, back to Today" }).click();
  // Today's mission leads to Learn, where the prediction is made
  await page.getByRole("region", { name: "Today’s mission" }).getByRole("link", { name: "Take it on in Learn" }).click();
  // Learn's mission card
  const card = page.getByRole("region", { name: "Today’s mission" });
  // Predict "Awkward"
  await card.getByRole("button", { name: /^2/ }).click();
  // Accept
  await card.getByRole("button", { name: "I’ll try it" }).click();
  // Debrief
  await page.getByRole("link", { name: "How did it go?" }).click();
  // Tried
  await page.getByRole("button", { name: "Yes" }).click();
  // It went well
  await page.getByRole("group", { name: "How did it go?" }).getByRole("button", { name: /^4/ }).click();
  // A note
  await page.getByLabel(/What did you notice/).fill("She lit up talking about her garden");
  // Save
  await page.getByRole("button", { name: "Save and compare" }).click();
  // The comparison
  await expect(page.getByRole("status")).toContainText("You expected 2 of 5. It went 4 of 5.");
  // Back to Learn, where it was opened (decision 67)
  await page.locator("[data-action-band]").click();
  // The card says how it went
  await expect(page.getByRole("region", { name: "Today’s mission" })).toContainText("Better than you feared");
});

// Light or dark: chosen in Settings, kept after a reload, with no flash of the other mode and a clean console
test("Appearance: light by default, even on a phone set to dark", async ({ page }) => {
  // The phone prefers dark
  await page.emulateMedia({ colorScheme: "dark" });
  // Open Today with nothing saved
  await page.goto("/");
  // The paper is the light one (decision 70)
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--vl-paper").trim())).toBe("#f3ece2");
  // Choose Auto in Settings
  await page.goto("/settings");
  await page.getByRole("button", { name: "Auto" }).click();
  // Now it follows the phone and turns dark
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--vl-paper").trim())).toBe("#161917");
});

test("Appearance: choose dark in Settings and it stays dark after a reload", async ({ page }) => {
  // Open Settings
  await page.goto("/settings");
  // Choose dark
  await page.getByRole("button", { name: "Dark" }).click();
  // The page turns dark at once
  await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");
  // Open another page from scratch
  await page.goto("/practice");
  // It is still dark
  await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");
  // Its background is the dark paper, not the light one
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--vl-paper").trim())).toBe("#161917");
});
