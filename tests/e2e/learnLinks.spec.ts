// Every Learn card's "Try it" link leads somewhere real: the page loads, and the place after "#" is on it (decision 94)
import { expect, test } from "./support/fixtures";
// Load the cards, to read their links
import { LEARN_CARDS } from "../../src/content/learn";

// Each different link once
const LINKS = [...new Set(LEARN_CARDS.flatMap((card) => (card.tryIt ? [card.tryIt.href] : [])))];

// One check per link that names a place on its page
for (const href of LINKS.filter((link) => link.includes("#"))) {
  // The place is on the page once it has drawn
  test(`a Learn link leads to its place: ${href}`, async ({ page }) => {
    // Open the link as a user would land on it
    await page.goto(href);
    // Let it settle
    await page.waitForLoadState("networkidle");
    // The id after "#"
    const anchor = href.split("#")[1] ?? "";
    // Confirm the place exists on the page
    await expect(page.locator(`[id="${anchor}"]`)).toHaveCount(1);
  });
}

// A card's link to tell a story starts on the shape and focus it names, and a made-up one falls back to the usual start
test("a Learn link to tell a story starts on its shape and focus", async ({ page }) => {
  // Open a story with a shape and a focus named
  await page.goto("/stories/tell?prompt=sp04&shape=then-now&focus=middle");
  // Confirm both are chosen
  await expect(page.getByRole("button", { name: /Then and now/ })).toHaveAttribute("aria-pressed", "true");
  // (the focus)
  await expect(page.getByRole("button", { name: "Start in the middle" })).toHaveAttribute("aria-pressed", "true");
  // Open it with names that do not exist
  await page.goto("/stories/tell?prompt=sp04&shape=nonsense&focus=nonsense");
  // Confirm Classic and no focus
  await expect(page.getByRole("button", { name: /Classic/ })).toHaveAttribute("aria-pressed", "true");
  // (no focus chosen)
  await expect(page.getByRole("button", { name: "Start in the middle" })).toHaveAttribute("aria-pressed", "false");
});

// A link to the retired vocal fry card opens the corrected one (decision 94)
test("the retired vocal fry card's address opens the corrected card", async ({ page }) => {
  // Open the old address
  await page.goto("/learn/card?id=voice-fry");
  // Confirm the corrected card's question
  await expect(page.getByRole("heading", { level: 1, name: "Vocal fry makes you sound less competent." })).toBeVisible();
});
