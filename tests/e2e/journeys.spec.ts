// Whole journeys with the stand-in microphone: record, save, and read the result (rules T1, T3, T11)
import { GUIDED_SPOKEN, STORY_SPOKEN, expect, skipRating, test, useGuidedCoach, useStandIns, useStoryCoach } from "./support/fixtures";
// Load Node's file reader, for a real recording to stand in for a written line's audio
import { readFileSync } from "node:fs";
// Load the page type, for the story helper
import type { Page } from "@playwright/test";

// The welcome leads straight into today's first step, a Learn card; then Rapid Fire (once Table Topic) from Practice, to the saved session
test("Rapid Fire: from the welcome through Practice, countdown, recording, saved session", async ({ page }) => {
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
  // Start Rapid Fire from its row
  await page.getByRole("link", { name: /^Rapid Fire/ }).click();
  // The topic page opens
  await expect(page).toHaveURL(/mode=talk/);
  // Reveal the topic and start the countdown
  await page.getByRole("button", { name: /Show my topic/ }).click();
  // Recording starts by itself after the countdown
  const stop = page.getByRole("button", { name: /Stop/ });
  // The countdown is 10 seconds
  await expect(stop).toBeVisible({ timeout: 15_000 });
  // The timing light is showing
  await expect(page.locator("[role=status][data-signal]")).toBeVisible();
  // Speak past the 10-second minimum
  await page.waitForTimeout(11_500);
  // Stop recording
  await stop.click();
  // Skip the question before the results (decision 116)
  await skipRating(page);
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

// Deep speech analysis (decision 90): a Rapid Fire take is measured as it is saved; its results link to every measure, and the profile shows it
test("Analysis: record a Rapid Fire take, see all its measures, then the profile", async ({ page }) => {
  // Use the stand-in microphone and speech
  await useStandIns(page);
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // Open a Rapid Fire topic directly
  await page.goto("/session?mode=talk&prompt=t001");
  // Reveal the topic and start the countdown
  await page.getByRole("button", { name: /Show my topic/ }).click();
  // Recording starts by itself after the countdown
  const stop = page.getByRole("button", { name: /Stop/ });
  // The countdown is 10 seconds
  await expect(stop).toBeVisible({ timeout: 15_000 });
  // Speak past the 10-second minimum
  await page.waitForTimeout(11_500);
  // Stop recording
  await stop.click();
  // Skip the question before the results (decision 116)
  await skipRating(page);
  // The saved session opens
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
  // Follow the link to every measure of this take
  await page.getByRole("link", { name: "See all measures for this take" }).click();
  // The take's table opens
  await expect(page).toHaveURL(/\/profile\?session=/);
  // Its speaking rate was measured
  await expect(page.locator("tr[data-metric='lang.wpm']")).toContainText("words/min");
  // On to the whole profile
  await page.getByRole("link", { name: "Your whole speaking profile" }).click();
  // The profile shows the language measures of speaking on the spot
  await expect(page.getByRole("heading", { name: "Your speaking profile", level: 1 })).toBeVisible();
  // (the language group)
  await expect(page.getByRole("region", { name: "Language" })).toBeVisible();
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
  // History, reached from Settings through your progress (decision 109), lists it
  await page.locator("header").getByRole("link", { name: "Settings" }).click();
  // Your progress
  await page.getByRole("link", { name: "Your speaking profile and history" }).click();
  // Open the history page
  await page.getByRole("link", { name: "Every session, in History" }).click();
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

// Openings and closings were retired (decision 106): the old page and an old drill's address both lead to Practice, so no new drill is recorded
test("Openings and closings: the old addresses lead to Practice", async ({ page }) => {
  // Past the welcome, which has no tabs (decision 78)
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // The old page
  await page.goto("/bookends");
  // Lands on Practice
  await expect(page).toHaveURL(/\/practice$/);
  // An old drill's address
  await page.goto("/session?mode=bookend&prompt=b001");
  // Lands on Practice too, with no recording offered
  await expect(page).toHaveURL(/\/practice$/);
  // (Practice's heading)
  await expect(page.getByRole("heading", { level: 1, name: "Practice" })).toBeVisible();
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
  // Skip the question before the results (decision 116)
  await skipRating(page);
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
  // Skip the question before the results (decision 116)
  await skipRating(page);
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
  // Skip the question before the results (decision 116)
  await skipRating(page);
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

// The welcome's question steers the app: pick telling stories, still start by speaking, then Today, Practice and Learn follow it (decision 97)
test("Focus: the welcome's pick steers Today, Practice and Learn", async ({ page }) => {
  // Start at Today as a new user
  await page.goto("/");
  // Pick telling stories
  await page.getByRole("button", { name: /^Telling stories/ }).click();
  // Start
  await page.getByRole("link", { name: "Start", exact: true }).click();
  // Day one still starts by speaking (decision 78)
  await expect(page.getByText("Today’s practice · step 1 of 4")).toBeVisible();
  // Back on Today
  await page.goto("/");
  // The focus is named, and the first pick is a story
  await expect(page.getByText("Getting better at:")).toContainText("telling stories");
  // (the third step)
  await expect(page.getByRole("link", { name: /^Step 3: (Story|Guided story)$/ })).toBeVisible();
  // Practice puts Tell stories first
  await page.goto("/practice");
  // The rest of the ways to practise, opened (decision 125)
  await page.getByRole("button", { name: "More ways to practise" }).click();
  // (its first heading)
  await expect(page.getByRole("heading", { level: 2 }).first()).toHaveText(/^Tell stories\s*Your focus$/);
  // Learn opens with the focus sets
  await page.goto("/learn");
  // (its group)
  await expect(page.getByRole("list", { name: "For your focus sets" })).toBeVisible();
});

// Someone from before the question is asked once on Today, and the answer sticks (decision 97)
test("Focus: an existing user answers the card on Today once", async ({ page }) => {
  // Past the welcome, as someone who used the app before the question
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // Today
  await page.goto("/");
  // The card under the steps
  const card = page.getByRole("region", { name: "What do you want to get better at most?" });
  // Pick how I sound
  await card.getByRole("button", { name: "How I sound" }).click();
  // Save
  await card.getByRole("button", { name: "Save" }).click();
  // The card goes and the focus is named
  await expect(card).toHaveCount(0);
  // (named)
  await expect(page.getByText("Getting better at:")).toContainText("how I sound");
  // After a reload, still answered
  await page.reload();
  // (no card)
  await expect(page.getByRole("heading", { name: /short steps|Pick up where/ })).toBeVisible();
  // (still no card)
  await expect(page.getByRole("region", { name: "What do you want to get better at most?" })).toHaveCount(0);
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
  // Skip the question before the results (decision 116)
  await skipRating(page);
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
  // The results ask which beats were hit, with the ticks already open under the question (round 4)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Which beats did you hit?");
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
  // The rest of the ways to practise, opened (decision 125)
  await page.getByRole("button", { name: "More ways to practise" }).click();
  // Every unit is under "See all" (decision 95)
  await page.getByRole("region", { name: "Everyday conversation" }).getByRole("link", { name: "See all" }).click();
  // Open the Listening unit
  await page.getByRole("list", { name: "Units" }).getByRole("link", { name: /^Listening/ }).click();
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

// Reading the room (decision 95): from Practice's "See all", a moment read on a card (no voice), a short reply, and its beats
test("Reading the room: read a moment, say what you'd say, see the beats", async ({ page }) => {
  // The stand-in speech replies to the moment
  await useStandIns(page, "you seem a bit busy do you need to go no worries if so");
  // Start at Practice
  await page.goto("/practice");
  // The rest of the ways to practise, opened (decision 125)
  await page.getByRole("button", { name: "More ways to practise" }).click();
  // Every unit
  await page.getByRole("region", { name: "Everyday conversation" }).getByRole("link", { name: "See all" }).click();
  // Open Reading the room
  await page.getByRole("list", { name: "Units" }).getByRole("link", { name: /^Reading the room/ }).click();
  // Its practice box
  await page.getByRole("region", { name: "Read the room" }).getByRole("link", { name: "Say what you'd say" }).click();
  // The moment is on the card
  await expect(page.getByText("The moment")).toBeVisible();
  // Start: no voice, recording straight away
  await page.getByRole("button", { name: /Answer it/ }).click();
  // Recording is under way
  const stop = page.getByRole("button", { name: /Stop/ });
  // It starts without waiting for a voice
  await expect(stop).toBeVisible({ timeout: 10_000 });
  // Let the reply be heard
  await page.waitForTimeout(4_500);
  // Stop
  await stop.click();
  // The reply opens on its result
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
  // The room's beats, with what was noticed quoted
  await expect(page.getByRole("list", { name: "The beats" })).toContainText("“you seem”");
  // The main action moves on to another moment
  await expect(page.locator("[data-action-band]")).toContainText("another moment");
});

// Starting and ending (decision 95): its first lesson from the unit page, an opener and a goodbye in one take, and the goodbye heard
test("Starting and ending: a lesson, an opener and a goodbye, and the beats", async ({ page }) => {
  // The stand-in speech opens and closes
  await useStandIns(page, "these plates are tiny are you a friend of sams great chatting I'll let you grab some food enjoy the party");
  // Start at the unit's page
  await page.goto("/small-talk/unit?id=starting");
  // Start the first lesson from the main action
  await page.locator("[data-action-band]").click();
  // The lesson teaches first, with its research line
  await expect(page.getByRole("region", { name: "The lesson" })).toContainText("Sandstrom");
  // Start: both ends, straight away
  await page.getByRole("button", { name: /Say both/ }).click();
  // Recording is under way
  const stop = page.getByRole("button", { name: /Stop/ });
  // It starts without a voice
  await expect(stop).toBeVisible({ timeout: 10_000 });
  // Let both ends be heard
  await page.waitForTimeout(6_500);
  // Stop
  await stop.click();
  // The take opens on its result
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
  // The goodbye's beats, with what was enjoyed quoted
  await expect(page.getByRole("list", { name: "The beats" })).toContainText("“great chatting”");
});

// Going deeper (decision 95): pick a flat question from the unit's list, ask a better one, and see what made it deeper
test("Going deeper: upgrade a flat question", async ({ page }) => {
  // The stand-in speech asks a better question
  await useStandIns(page, "what's the best part of what you do");
  // Start at the unit's page
  await page.goto("/small-talk/unit?id=deeper");
  // Pick "What do you do?" from the list
  await page.getByRole("region", { name: "Questions to upgrade" }).getByRole("link", { name: "What do you do?" }).click();
  // The flat question is on the card
  await expect(page.getByText("Upgrade this question")).toBeVisible();
  // Start
  await page.getByRole("button", { name: /Ask it better/ }).click();
  // Recording is under way
  const stop = page.getByRole("button", { name: /Stop/ });
  // It starts without a voice
  await expect(stop).toBeVisible({ timeout: 10_000 });
  // Let the question be heard
  await page.waitForTimeout(3_500);
  // Stop
  await stop.click();
  // The question opens on its result
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
  // The flat question, and the deeper beat with its words
  await expect(page.getByText("The flat question")).toBeVisible();
  // What made it deeper
  await expect(page.getByRole("list", { name: "The beats" })).toContainText("“best part”");
});

// One moment a day: record a short private note from the Small talk page, and find it listed there
test("One moment a day: record a note and see it on the Small talk page", async ({ page }) => {
  // The stand-in speech tells the moment
  await useStandIns(page, "I fixed the bike chain myself and rode to the river");
  // Start at Practice
  await page.goto("/practice");
  // The rest of the ways to practise, opened (decision 125)
  await page.getByRole("button", { name: "More ways to practise" }).click();
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

// Your voice: a warm-up with nothing recorded, then a volume drill take by take, its results and the next drill (decision 80)
test("Your voice: warm up, then a volume drill", async ({ page }) => {
  // The stand-in microphone (a steady tone) and speech
  await useStandIns(page);
  // Start at Practice
  await page.goto("/practice");
  // The rest of the ways to practise, opened (decision 125)
  await page.getByRole("button", { name: "More ways to practise" }).click();
  // The warm-up row
  await page.getByRole("link", { name: /^Warm-up/ }).click();
  // Start the routine
  await page.getByRole("button", { name: "Start" }).click();
  // Skip through the three moves
  for (let move = 0; move < 3; move++) await page.getByRole("button", { name: /^Next move/ }).click();
  // Warmed up
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Warmed up.");
  // Back to Your voice
  await page.getByRole("link", { name: /Back to Your voice/ }).click();
  // Open the volume drills and the first one
  await page.getByText("Volume", { exact: true }).click();
  // The first three-rooms drill
  await page.getByRole("link", { name: /^Three rooms: the greeting/ }).click();
  // Three takes
  for (let take = 0; take < 3; take++) {
    // Record
    await page.getByRole("button", { name: /^Record/ }).click();
    // Speak for a moment
    await page.waitForTimeout(1500);
    // Stop
    await page.getByRole("button", { name: "Stop" }).click();
  }
  // The results: one bar per take, and the next drill offered
  await expect(page.getByRole("list", { name: "How loud each take was" }).getByRole("listitem")).toHaveCount(3);
  // The next drill
  await expect(page.getByRole("link", { name: /^Next drill/ })).toHaveAttribute("href", "/voice/drill?id=v02");
});

// A conversation (decision 83): from Practice to Maya, her recorded opening, your turn ended with Done, her scripted reply (no passphrase, so no coach), then End and the saved conversation
test("Conversation: talk with Maya, then see the conversation", async ({ page }) => {
  // The stand-in speech answers her
  await useStandIns(page, "I went climbing on Saturday it was great what about you");
  // Start at Practice
  await page.goto("/practice");
  // Talk with someone
  await page.getByRole("link", { name: /^Talk with someone/ }).click();
  // Maya
  await page.getByRole("link", { name: /^Maya/ }).click();
  // The scene first
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Talk with Maya");
  // Start: she says her opening, then it is your turn
  await page.getByRole("button", { name: "Start" }).click();
  // Your turn
  const done = page.getByRole("button", { name: "Done" });
  // After her opening line
  await expect(done).toBeVisible({ timeout: 20_000 });
  // Answer for a moment
  await page.waitForTimeout(2_000);
  // Done
  await done.click();
  // Her reply from the script ends on a question
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("So how was your weekend?", { timeout: 20_000 });
  // Your turn again
  await expect(done).toBeVisible({ timeout: 20_000 });
  // Answer for a moment
  await page.waitForTimeout(1_500);
  // End it
  await page.getByRole("button", { name: "End conversation" }).click();
  // Saved, and opened on its results
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
  // The conversation, with your words
  await expect(page.getByRole("list", { name: "The conversation" })).toContainText("I went climbing");
  // Talk again
  await expect(page.locator("[data-action-band]")).toContainText("Talk again");
});

// A conversation with the coach set up (decision 84): a new situation, each line written for it and played in the persona's voice (the route stood in, with a real recording as the audio), and the situation on the results
test("Conversation with the coach: Theo in a new situation, written lines", async ({ page }) => {
  // The stand-in speech answers him
  await useStandIns(page, "what do you do outside of work");
  // The passphrase is saved, so lines are written
  await page.addInitScript(() => localStorage.setItem("voicelab-passphrase", "a long passphrase for testing"));
  // A real recording, as the route would send it
  const audio = readFileSync("public/clips/theo-14.mp3").toString("base64");
  // The lines the route writes, in turn
  const lines = ["Oh. Hey. Early too?", "Well… I fix up old radios.", "Anyway, good talking."];
  // What the browser sent
  const sent: Array<{ scenarioId: string; stage: string }> = [];
  // The conversation route, stood in
  await page.route("**/api/conversation", async (route) => {
    // Noted
    sent.push(JSON.parse(route.request().postData() ?? "{}") as { scenarioId: string; stage: string });
    // The next line, with its audio
    await route.fulfill({ json: { text: lines.shift() ?? "Bye!", audio, goodbye: false } });
  });
  // The coach, stood in
  await page.route("**/api/feedback", (route) => route.fulfill({ json: { feedback: { keep: "You asked an open question.", change: "Follow up on the radios.", retryCue: "Ask about his last detail.", conversation: { yours: "what do you do outside of work", better: "What do you get up to outside work?" } } } }));
  // Theo, from the list
  await page.goto("/conversations");
  // His row
  await page.getByRole("link", { name: /^Theo/ }).click();
  // His own situation first, with another on offer
  await expect(page.getByText("Early for a meeting", { exact: true })).toBeVisible();
  // Another situation
  await page.getByRole("button", { name: "Another situation" }).click();
  // The next one
  await expect(page.getByText("Before an evening class", { exact: true })).toBeVisible();
  // Start
  await page.getByRole("button", { name: "Start" }).click();
  // His written opening
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Oh. Hey. Early too?", { timeout: 20_000 });
  // Your turn
  const done = page.getByRole("button", { name: "Done" });
  // After his line plays
  await expect(done).toBeVisible({ timeout: 20_000 });
  // Answer for a moment
  await page.waitForTimeout(2_000);
  // Done
  await done.click();
  // His reply
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Well… I fix up old radios.", { timeout: 20_000 });
  // Your turn again
  await expect(done).toBeVisible({ timeout: 20_000 });
  // End it
  await page.getByRole("button", { name: "End conversation" }).click();
  // Saved, and opened on its results with the situation and the coach's line
  await expect(page.getByText("It could sound like")).toBeVisible({ timeout: 15_000 });
  // The situation on the results, and what was asked for
  await expect(page.getByText(/With Theo · Before an evening class/)).toBeVisible();
  // Every request was for the class, starting with the opening
  expect([sent.map((request) => request.scenarioId), sent[0]?.stage]).toEqual([["class", "class"], "open"]);
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

// A mission: take it on from Today in Learn (no prediction since decision 104), debrief it, and see how it went
test("Mission: try, debrief, see how it went", async ({ page }) => {
  // Start at Today
  await page.goto("/");
  // Skip the welcome question
  await page.getByRole("link", { name: "Start", exact: true }).click();
  // Back to Today from the first step
  await page.getByRole("link", { name: "Close, back to Today" }).click();
  // Today's mission leads to Learn, where it is taken on
  await page.getByRole("region", { name: "Today’s mission" }).getByRole("link", { name: "Take it on in Learn" }).click();
  // Learn's mission card
  const card = page.getByRole("region", { name: "Today’s mission" });
  // No 1 to 5 prediction to make
  await expect(card.getByText("How will it go?")).toHaveCount(0);
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
  // How it went
  await expect(page.getByRole("status")).toContainText("It went 4 of 5.");
  // Back to Learn, where it was opened (decision 67)
  await page.locator("[data-action-band]").click();
  // The card says how it went
  await expect(page.getByRole("region", { name: "Today’s mission" })).toContainText("It went 4 of 5.");
});

// Light or dark: chosen in Settings, kept after a reload, with no flash of the other mode and a clean console
test("Appearance: follows the phone by default, and Light keeps it light", async ({ page }) => {
  // The phone prefers dark
  await page.emulateMedia({ colorScheme: "dark" });
  // Open Today with nothing saved
  await page.goto("/");
  // The paper is the dark one: with nothing chosen the app follows the phone (decision 89; light until then, decision 70)
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--vl-paper").trim())).toBe("#161917");
  // Choose Light in Settings
  await page.goto("/settings");
  await page.getByRole("button", { name: "Light" }).click();
  // Open another page from scratch
  await page.goto("/practice");
  // It stays light on a phone set to dark
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--vl-paper").trim())).toBe("#f3ece2");
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

// What the deeper-analysis route answers in the browser checks (decision 91): a short verbatim transcript and voice numbers, as the real route shapes them
function deepReply(voiceFailed = false) {
  // Words a third of a second apart, the first an "um"
  const words = ["Um,", "the", "best", "part", "of", "my", "week", "was", "the", "dog."].map((text, index) => ({ text, w: text.toLowerCase().replace(/[^a-z']+/g, ""), s: index * 0.35, e: index * 0.35 + 0.25, conf: 0.9 }));
  // The reply
  return {
    // The transcript
    transcript: { engine: "assemblyai-universal-3-pro", text: words.map((word) => word.text).join(" "), words, at: "2026-10-21T12:00:00.000Z" },
    // The voice, unless it failed
    voice: voiceFailed ? null : { engine: "voice-worker-1", praat: "6.1.38", jitterLocalPct: 1.4, shimmerLocalDb: 0.6, hnrDb: 13.8, alphaRatioDb: -17.2, hammarbergDb: 23.5, creakPct: 4.2, syllables: 14, speechRate: 3.2, articulationRate: 4.1, f0: { medianHz: 128, p10Hz: 101, p90Hz: 176, rangeSt: 9.6, sdSt: 3 }, emotion: null, at: "2026-10-21T12:00:00.000Z" },
    // Why a part is missing
    failures: voiceFailed ? { voice: "failed" } : {},
  };
}

// Record a Rapid Fire take from its address, ending on its saved page
async function recordRapidFire(page: import("@playwright/test").Page) {
  // Open a Rapid Fire topic directly
  await page.goto("/session?mode=talk&prompt=t001");
  // Reveal the topic and start the countdown
  await page.getByRole("button", { name: /Show my topic/ }).click();
  // Recording starts by itself after the countdown
  const stop = page.getByRole("button", { name: /Stop/ });
  // The countdown is 10 seconds
  await expect(stop).toBeVisible({ timeout: 15_000 });
  // Speak past the 10-second minimum
  await page.waitForTimeout(11_500);
  // Stop recording
  await stop.click();
  // Skip the question before the results (decision 116)
  await skipRating(page);
  // The saved session opens
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
}

// Deeper analysis (decision 91): switch it on in Settings, record a take, and its server measures reach the take's table and the profile's voice group
test("Deeper analysis: switch it on, record a take, see the voice measures from the server", async ({ page }) => {
  // Use the stand-in microphone and speech
  await useStandIns(page);
  // Past the welcome, with the passphrase saved
  await page.addInitScript(() => {
    // Welcome seen
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // The passphrase
    localStorage.setItem("voicelab-passphrase", "a long passphrase for testing");
  });
  // The uploads the route received
  const uploads: Array<{ type: string | undefined; duration: string | undefined; bytes: number }> = [];
  // The route, stood in: the status check, and the analysis
  await page.route("**/api/analyse", async (route) => {
    // The status check
    if (route.request().method() === "GET") return route.fulfill({ json: { transcription: true, voice: true, problems: [] } });
    // Noted
    uploads.push({ type: route.request().headers()["content-type"], duration: route.request().headers()["x-voicelab-duration"], bytes: route.request().postDataBuffer()?.byteLength ?? 0 });
    // The analysis
    await route.fulfill({ json: deepReply() });
  });
  // The coach, stood in (the take's page asks for feedback once the passphrase is set)
  await page.route("**/api/feedback", (route) => route.fulfill({ json: { feedback: { keep: "You named the dog.", change: "Start on the dog.", retryCue: "Dog first." } } }));
  // The month's conversation minutes, stood in (Settings asks once a passphrase is saved; decision 102)
  await page.route("**/api/conversation", (route) => route.fulfill({ json: { minutesUsed: 0, minutesPerMonth: 150, minutesLeft: 150 } }));
  // This month's usage, stood in (Settings asks once a passphrase is saved; decision 122)
  await page.route("**/api/usage", (route) => route.fulfill({ json: { month: "2026-10", live: { used: 0, limit: 150, left: 150, setUp: false }, call: { used: 0, limit: 60, left: 60, setUp: false }, voiceCharacters: { turbo: 0, v4: 0 }, lines: 0, conversationMinutes: { used: 0, limit: 150 } } }));
  // Settings, loaded directly
  await page.goto("/settings");
  // Switch deeper analysis on
  await page.getByRole("checkbox", { name: /Send my recordings for deeper analysis/ }).click();
  // On once saved
  await expect(page.getByRole("checkbox", { name: /Send my recordings for deeper analysis/ })).toBeChecked();
  // The server says it is ready
  await expect(page.getByText("Ready: transcription and voice analysis are set up on the server.")).toBeVisible();
  // Record a take
  await recordRapidFire(page);
  // It was uploaded once, as audio, with its length
  await expect.poll(() => uploads.length).toBe(1);
  // (what was sent)
  expect([uploads[0]!.type?.startsWith("audio/"), Number(uploads[0]!.duration) >= 10, uploads[0]!.bytes > 0]).toEqual([true, true, true]);
  // Nothing went wrong, so no note shows once it is done
  await expect(page.locator("[data-deep-note]")).toHaveCount(0);
  // Every measure of this take
  await page.getByRole("link", { name: "See all measures for this take" }).click();
  // The jitter row is there, marked as from deeper analysis
  await expect(page.locator("tr[data-metric='pro.jitter_local']")).toContainText("deeper analysis");
  // On to the whole profile
  await page.getByRole("link", { name: "Your whole speaking profile" }).click();
  // The voice group lists the server's voice measures with plain names
  await expect(page.getByRole("region", { name: "Voice" }).getByRole("list", { name: "From deeper analysis" })).toContainText("Pitch steadiness (jitter)");
});

// Deeper analysis with the voice worker down: the take keeps its phone measures and says so quietly
test("Deeper analysis: a part that fails leaves a quiet note on the take", async ({ page }) => {
  // Use the stand-in microphone and speech
  await useStandIns(page);
  // Past the welcome, with the passphrase saved
  await page.addInitScript(() => {
    // Welcome seen
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // The passphrase
    localStorage.setItem("voicelab-passphrase", "a long passphrase for testing");
  });
  // The route, stood in: ready, but the voice part fails this time
  await page.route("**/api/analyse", (route) => route.fulfill({ json: route.request().method() === "GET" ? { transcription: true, voice: true, problems: [] } : deepReply(true) }));
  // The coach, stood in
  await page.route("**/api/feedback", (route) => route.fulfill({ json: { feedback: { keep: "You named the dog.", change: "Start on the dog.", retryCue: "Dog first." } } }));
  // The month's conversation minutes, stood in (Settings asks once a passphrase is saved; decision 102)
  await page.route("**/api/conversation", (route) => route.fulfill({ json: { minutesUsed: 0, minutesPerMonth: 150, minutesLeft: 150 } }));
  // This month's usage, stood in (Settings asks once a passphrase is saved; decision 122)
  await page.route("**/api/usage", (route) => route.fulfill({ json: { month: "2026-10", live: { used: 0, limit: 150, left: 150, setUp: false }, call: { used: 0, limit: 60, left: 60, setUp: false }, voiceCharacters: { turbo: 0, v4: 0 }, lines: 0, conversationMinutes: { used: 0, limit: 150 } } }));
  // Settings, loaded directly
  await page.goto("/settings");
  // Switch deeper analysis on
  await page.getByRole("checkbox", { name: /Send my recordings for deeper analysis/ }).click();
  // On once saved
  await expect(page.getByRole("checkbox", { name: /Send my recordings for deeper analysis/ })).toBeChecked();
  // Saved
  await expect(page.getByText("Ready: transcription and voice analysis are set up on the server.")).toBeVisible();
  // Record a take
  await recordRapidFire(page);
  // The quiet note on the take
  await expect(page.getByText("Deeper analysis transcribed this take, but the voice analysis didn’t work this time.")).toBeVisible({ timeout: 10_000 });
});

// Plan a story for a while, tell it past the minimum, and stop; the take's page opens (decision 92)
async function tellStory(page: Page): Promise<void> {
  // Start the planning minute
  await page.getByRole("button", { name: /Plan it/ }).click();
  // Ready before the minute is up
  await page.getByRole("button", { name: /Ready/ }).click();
  // Recording is under way
  const stop = page.getByRole("button", { name: /Stop/ });
  // Wait for it
  await expect(stop).toBeVisible({ timeout: 10_000 });
  // The story's light is showing
  await expect(page.locator("[role=status][data-signal]")).toBeVisible();
  // Tell past the 10-second minimum
  await page.waitForTimeout(11_500);
  // Stop
  await stop.click();
  // Skip the question before the results (decision 116)
  await skipRating(page);
  // The take opens (never stuck on "Saving…")
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
}

// Storytelling (decisions 92 and 126): pick a prompt, choose a template, plan with its beats, tell, see your beats and the coach's line, tell it again and see both tellings side by side, then find it in Your stories
test("Stories: pick a prompt, choose a template, tell it, then tell it again and compare", async ({ page }) => {
  // The stand-in speech tells a story
  await useStandIns(page, STORY_SPOKEN);
  // Past the welcome, with the passphrase saved so the coach is asked
  await page.addInitScript(() => {
    // Welcome seen
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // The passphrase
    localStorage.setItem("voicelab-passphrase", "a long passphrase for testing");
  });
  // The coach, stood in with the story reply
  await useStoryCoach(page);
  // From Practice
  await page.goto("/practice");
  // The rest of the ways to practise, opened (decision 125)
  await page.getByRole("button", { name: "More ways to practise" }).click();
  // Into Stories
  await page.getByRole("region", { name: "Tell stories" }).getByRole("link", { name: "See all" }).click();
  // Open a group of prompts
  await page.getByText("A time something went wrong", { exact: true }).click();
  // Pick a prompt
  await page.getByRole("link", { name: "Tell me about a time a plan fell apart at the last minute." }).click();
  // The set-up page
  await expect(page).toHaveURL(/\/stories\/tell\?prompt=sp01/);
  // Choose the Client win template
  await page.getByRole("button", { name: /Client win/ }).click();
  // Short
  await page.getByRole("button", { name: /^Short/ }).click();
  // Start
  await page.getByRole("link", { name: /^Start/ }).click();
  // The telling page, with the set-up in the address
  await expect(page).toHaveURL(/mode=story&prompt=sp01&template=client-win&length=short/);
  // The template's beats show while planning
  await expect(page.getByRole("region", { name: "Your beats" })).toContainText("The result, with a number");
  // Plan and tell
  await tellStory(page);
  // The headline from the beats, and what worked
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("2 of 4 beats came through clearly.");
  // The coach's line and how it could sound
  await expect(page.locator("[data-story-line]")).toContainText("Could sound like");
  // Each beat, the result missing
  await expect(page.locator("[data-your-beats] [data-beat='result']")).toHaveAttribute("data-status", "missing");
  // Tell it again
  await page.getByRole("link", { name: /Tell it again/ }).click();
  // Same story, same template, last time's cue to carry in
  await expect(page.getByText("Slow down at the guard's words.")).toBeVisible();
  // (the template is kept)
  await expect(page.getByRole("region", { name: "Your beats" })).toContainText("The result, with a number");
  // Plan and tell again
  await tellStory(page);
  // Both tellings side by side
  await expect(page.getByRole("table", { name: "Last time and this time" })).toBeVisible();
  // (what it was working on)
  await expect(page.getByText("You were working on: Slow down at the guard's words.")).toBeVisible();
  // To Your stories
  await page.getByRole("link", { name: "Your stories", exact: true }).click();
  // The story is listed by its title, told twice
  await expect(page.getByRole("list", { name: "Your stories" })).toContainText("The plan that fell apart");
  // (twice)
  await expect(page.getByRole("list", { name: "Your stories" })).toContainText("Told twice");
});

// A saved moment note, told properly as a story, lands in Your stories (decision 92)
test("Stories: tell a saved moment properly, and find it in Your stories", async ({ page }) => {
  // The stand-in speech
  await useStandIns(page, STORY_SPOKEN);
  // Past the welcome (no passphrase: the change comes from the phone's checks)
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // Record a moment
  await page.goto("/session?mode=moment&prompt=moment");
  // Start speaking
  await page.getByRole("button", { name: /Start speaking/ }).click();
  // Recording
  const stop = page.getByRole("button", { name: /Stop/ });
  // Wait for it
  await expect(stop).toBeVisible({ timeout: 10_000 });
  // Past the minimum
  await page.waitForTimeout(11_500);
  // Stop
  await stop.click();
  // Back on the Small talk page, the moment listed with a way to tell it properly
  await expect(page.getByRole("list", { name: "Your moments" })).toContainText("The train stopped", { timeout: 15_000 });
  // Stories, loaded directly
  await page.goto("/stories");
  // Tell the moment properly
  await page.getByRole("link", { name: /Tell it properly/ }).first().click();
  // The set-up shows the moment's words
  await expect(page.getByRole("heading", { level: 1 })).toContainText("The train stopped");
  // Start
  await page.getByRole("link", { name: /^Start/ }).click();
  // Plan and tell
  await tellStory(page);
  // The telling, with no coach and no rough checklist (decision 126)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your story.");
  // To Your stories
  await page.getByRole("link", { name: "Your stories", exact: true }).click();
  // The story is listed by the moment's first words, told once
  await expect(page.getByRole("list", { name: "Your stories" })).toContainText("The train stopped dead outside Reading at six");
  // (once)
  await expect(page.getByRole("list", { name: "Your stories" })).toContainText("Told once");
});

// The Practice menu (decision 93): Read aloud sits under Speak on the spot and leads to the readings; Openings and closings is off the menu
test("Practice: Read aloud is under Speak on the spot, and Openings and closings is gone", async ({ page }) => {
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // Practice, loaded directly
  await page.goto("/practice");
  // The rest of the ways to practise, opened (decision 125)
  await page.getByRole("button", { name: "More ways to practise" }).click();
  // The on-the-spot group
  const spot = page.getByRole("region", { name: "Speak on the spot" });
  // Read aloud is there
  await expect(spot.getByRole("link", { name: /^Read aloud/ })).toBeVisible();
  // No Build a skill group: the lessons live in Learn (decision 107)
  await expect(page.getByRole("region", { name: "Build a skill" })).toHaveCount(0);
  // No openings row anywhere
  await expect(page.getByText("Openings and closings")).toHaveCount(0);
  // Read aloud opens the readings
  await spot.getByRole("link", { name: /^Read aloud/ }).click();
  // On the Read aloud page
  await expect(page).toHaveURL(/\/skills$/);
  // (its name)
  await expect(page.getByRole("heading", { level: 1, name: "Read aloud" })).toBeVisible();
});

// A slimmer Practice (decision 108): each group shows a few rows, and every kind of practice is still within two taps
test("Practice: every kind of practice is within two taps", async ({ page }) => {
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // Free talk and the short speech: "See all" in Speak on the spot, then the row
  for (const [row, address] of [["Free talk", /\/session\?mode=free/], ["Short speech", /\/practice\/outline/]] as const) {
    // Practice
    await page.goto("/practice");
    // The rest of the ways to practise, opened (decision 125)
    await page.getByRole("button", { name: "More ways to practise" }).click();
    // The group
    const spot = page.getByRole("region", { name: "Speak on the spot" });
    // Tap one
    await spot.getByRole("button", { name: "See all" }).click();
    // Tap two
    await spot.getByRole("link", { name: new RegExp(`^${row}`) }).click();
    // Started
    await expect(page).toHaveURL(address);
  }
  // Every voice mode: "See all" in Your voice, then the mode's fold, which lists its drills (clear sounds with the word lists)
  for (const [fold, drill] of [["Clear sounds", "Everyday tricky words"], ["Volume", "Three rooms"], ["Pitch and stress", "Statement or question"], ["Tone", "I have some news"], ["Pausing", "Before the point"], ["Shadowing", "Ask not"]] as const) {
    // Practice
    await page.goto("/practice");
    // The rest of the ways to practise, opened (decision 125)
    await page.getByRole("button", { name: "More ways to practise" }).click();
    // Tap one
    await page.getByRole("region", { name: "Your voice" }).getByRole("link", { name: "See all" }).click();
    // Tap two
    await page.locator("summary", { hasText: fold }).click();
    // Its drills are there to start
    await expect(page.getByRole("link", { name: new RegExp(drill) }).first()).toBeVisible();
  }
  // The lessons: the Learn tab, then Speaking skills
  await page.goto("/practice");
  // Tap one
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Learn" }).click();
  // Tap two
  await page.getByRole("link", { name: /^Speaking skills/ }).click();
  // Its cards, each leading to a lesson
  await expect(page.getByRole("heading", { level: 1, name: "Speaking skills" })).toBeVisible();
});

// The speaking lessons live in Learn (decision 107): the Speaking skills set, one of its cards, and the card's practice opens the lesson with its own text
test("Learn: a speaking skill's card opens its lesson", async ({ page }) => {
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // Learn
  await page.goto("/learn");
  // The Speaking skills set
  await page.getByRole("link", { name: /^Speaking skills/ }).click();
  // Its page
  await expect(page.getByRole("heading", { level: 1, name: "Speaking skills" })).toBeVisible();
  // The card on pausing before you start is in the set
  await page.getByRole("list", { name: "Cards" }).getByRole("link", { name: /Pause before your first word/ }).click();
  // Its page opens
  await expect(page.getByRole("heading", { level: 1, name: "Pause before your first word." })).toBeVisible();
  // Its practice (checked in the unit tests to be this lesson), opened
  await page.goto("/session?mode=lesson&prompt=l001");
  // The lesson's own text to practise
  await expect(page.getByText(/Good morning, everyone\. Thank you for having me/)).toBeVisible();
});

// Guided stories (decision 93): pick one, see the facts while planning and telling, see what was added beyond them and the coach's word, then tell it again and compare
test("Guided story: pick one, tell it, see what you added, then tell it again", async ({ page }) => {
  // The stand-in speech tells the zoo story
  await useStandIns(page, GUIDED_SPOKEN);
  // Past the welcome, with the passphrase saved so the coach is asked
  await page.addInitScript(() => {
    // Welcome seen
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // The passphrase
    localStorage.setItem("voicelab-passphrase", "a long passphrase for testing");
  });
  // The coach, stood in with the guided reply
  await useGuidedCoach(page);
  // From Practice, the guided stories row
  await page.goto("/practice");
  // The rest of the ways to practise, opened (decision 125)
  await page.getByRole("button", { name: "More ways to practise" }).click();
  // Into the guided stories
  await page.getByRole("region", { name: "Tell stories" }).getByRole("link", { name: /^Guided stories/ }).click();
  // The section with its honest line
  await expect(page.getByText("You get the facts. You make it a story.")).toBeVisible();
  // Open the harder fold
  await page.getByText("With a twist", { exact: true }).click();
  // Pick the zoo
  await page.getByRole("link", { name: "A day at the zoo" }).click();
  // The set-up page
  await expect(page).toHaveURL(/\/stories\/tell\?prompt=gs13/);
  // The facts card with the twist
  await expect(page.getByRole("region", { name: "Your facts" })).toContainText("The gorilla was staring right at you.");
  // (the focus it suits, carried in)
  await expect(page.getByRole("link", { name: /^Start/ })).toHaveAttribute("href", /focus=middle/);
  // Short
  await page.getByRole("button", { name: /^Short/ }).click();
  // Start
  await page.getByRole("link", { name: /^Start/ }).click();
  // The telling page, with the facts in view while planning
  await expect(page.getByRole("region", { name: "Your facts" })).toContainText("You got a hot dog.");
  // Plan and tell
  await tellStory(page);
  // What you added: all five heard
  await expect(page.getByRole("list", { name: "What you added" }).locator("[data-added=true]")).toHaveCount(5);
  // Every fact made it in
  await expect(page.getByRole("region", { name: "The facts" })).toContainText("4 of 4 heard");
  // The coach's word on bringing the facts to life
  await expect(page.locator("[data-brought-to-life]")).toContainText("You added the mustard");
  // Tell it again
  await page.getByRole("link", { name: /Tell it again/ }).click();
  // The facts again, and last time's cue
  await expect(page.getByText("Pause when the gorilla looks at you.")).toBeVisible();
  // (the facts card)
  await expect(page.getByRole("region", { name: "Your facts" })).toBeVisible();
  // Plan and tell again
  await tellStory(page);
  // Both tellings side by side, with the facts kept on each
  await expect(page.getByRole("table", { name: "Last time and this time" })).toContainText("Facts kept");
  // The headline counts what was added
  await expect(page.getByRole("heading", { name: "You added 5 of 5 again. Same facts, new telling." })).toBeVisible();
  // To Your stories
  await page.getByRole("link", { name: "Your stories", exact: true }).click();
  // The story is listed by its title, told twice
  await expect(page.getByRole("list", { name: "Your stories" })).toContainText("A day at the zoo");
  // (twice)
  await expect(page.getByRole("list", { name: "Your stories" })).toContainText("Told twice");
});
