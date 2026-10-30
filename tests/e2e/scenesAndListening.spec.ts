// Scenes and Active listening (decisions 149 and 150), end to end with the stand-in microphone and the real recorded lines
import { expect, test, useStandIns } from "./support/fixtures";

// From Practice, play the next scene: two choices, the spoken turn, the result, and the list remembering it
test("Scenes: from Practice, choose two replies, answer out loud, see how it went", async ({ page }) => {
  // The stand-in speech answers Priya's news well: her words, her feeling, a question, no advice
  await useStandIns(page, "Big scary amazing that sounds like a lot How are you feeling about telling your mum");
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // Practice, then the Scenes row
  await page.goto("/practice");
  // Open the rest of Practice, where the groups are
  await page.getByRole("button", { name: /More ways to practise/ }).click();
  // The row
  await page.getByRole("link", { name: /^Scenes/ }).click();
  // The list, with the first scene next
  await expect(page.locator("[data-next-scene]")).toHaveText("The Lisbon offer");
  // Play it
  await page.getByRole("link", { name: "Play this scene" }).click();
  // Start
  await page.getByRole("button", { name: "Start" }).click();
  // Her opening on screen
  await expect(page.getByText("I got the offer. The Lisbon job!")).toBeVisible();
  // The best reply
  await page.getByRole("button", { name: /No way, Lisbon!/ }).click();
  // The verdict
  await expect(page.getByRole("status")).toContainText("Yes.");
  // On
  await page.getByRole("button", { name: "Carry on" }).click();
  // The second choice: "at least", a misstep
  await page.getByRole("button", { name: /At least Lisbon/ }).click();
  // Its verdict
  await expect(page.getByRole("status")).toContainText("A common move.");
  // On to the turn
  await page.getByRole("button", { name: "Carry on" }).click();
  // Answer out loud
  await page.getByRole("button", { name: "Answer" }).click();
  // Let the stand-in say every word, then stop
  await expect(page.getByTestId("quick-words")).toContainText("mum", { timeout: 15_000 });
  // Stop
  await page.getByRole("button", { name: "Stop" }).click();
  // On to the end
  await page.getByRole("button", { name: "Done, hear what Priya says" }).click();
  // The result: a warm close, both choices, every check passed
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Priya left happy.");
  // The choices
  await expect(page.locator("[data-choice-tier]")).toHaveText(["First: Best", "Second: Misstep"]);
  // Every check passed
  await expect(page.locator("[data-check][data-passed=false]")).toHaveCount(0);
  // The list now remembers it and offers the next
  await page.goto("/scenes");
  // The next one
  await expect(page.locator("[data-next-scene]")).toHaveText("The board presentation");
  // The played row
  await expect(page.getByRole("link", { name: /The Lisbon offer/ })).toContainText("played once");
});

// Hear the first story, answer out loud, see what was caught, and the list showing its title afterwards
test("Active listening: hear a story, answer, see the details caught and what mattered", async ({ page }) => {
  // The stand-in speech answers Maya's run: a reaction, what mattered, details, a feeling and a question
  await useStandIns(page, "No way you ran the whole thing and came last but they waited and clapped That is amazing How did it feel");
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // The list
  await page.goto("/listening");
  // The first story, its name hidden
  await expect(page.locator("[data-next-story]")).toHaveText("A story from Maya");
  // Open it
  await page.getByRole("link", { name: "Listen" }).click();
  // Listen
  await page.getByRole("button", { name: "Listen" }).click();
  // The words stay hidden while it plays
  await expect(page.getByText("I actually ran the whole thing")).toHaveCount(0);
  // The answer, once the story has been told (about 20 seconds of recording)
  await page.getByRole("button", { name: "Answer" }).click({ timeout: 45_000 });
  // Let the stand-in say every word, then stop
  await expect(page.getByTestId("quick-words")).toContainText("feel", { timeout: 15_000 });
  // Stop
  await page.getByRole("button", { name: "Stop" }).click();
  // See what was caught
  await page.getByRole("button", { name: "Done, see what you caught" }).click();
  // The headline, what mattered marked, and Maya's warm reply
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You heard what mattered.");
  // What mattered
  await expect(page.locator("[data-mark=core]")).toHaveText("I actually ran the whole thing");
  // Her reply
  await expect(page.locator("[data-reply]")).toContainText("signed up for the next one");
  // The list shows its title now
  await page.goto("/listening");
  // The row
  await expect(page.getByRole("link", { name: /The whole five K/ })).toContainText("heard what mattered");
});
