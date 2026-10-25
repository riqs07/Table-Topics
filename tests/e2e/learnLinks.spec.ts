// Every Learn card's practice link leads somewhere real: the page loads, and the place after "#" is on it (decision 94)
import { expect, test } from "./support/fixtures";
// Load the cards, to read their links
import { LEARN_CARDS } from "../../src/content/learn";

// Each different link once (every card has one since decision 96)
const LINKS = [...new Set(LEARN_CARDS.map((card) => card.tryIt.href))];

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

// One link of each kind (the page, plus the session kind on a recording page), so every kind of destination is opened at least once (decision 96)
const KINDS = [...new Map(LINKS.map((link) => {
  // The link's parts
  const url = new URL(link, "https://voicelab.test");
  // Its kind: the page, and the session kind when there is one
  return [`${url.pathname}:${url.searchParams.get("mode") ?? ""}`, link] as const;
})).values()];

// Each kind of link opens a page that draws its main column (the shared fixture fails on any console error)
for (const href of KINDS) {
  // The page draws
  test(`a Learn link opens its practice: ${href}`, async ({ page }) => {
    // Skip the welcome, in case the link is Today
    await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
    // Open the link as a user would land on it
    await page.goto(href);
    // Confirm the page's main column is there and has drawn its content
    await expect(page.locator("main")).toBeVisible();
    // (some words in it, not an empty shell)
    await expect(page.locator("main")).toContainText(/\w{3}/);
  });
}

// A link to tell a story starts on the template it names and carries a Learn card's focus; a made-up one falls back to the suggested template (decision 126)
test("a link to tell a story starts on its template and carries its focus", async ({ page }) => {
  // Open a story with a template and a focus named
  await page.goto("/stories/tell?prompt=sp04&template=turning-point&focus=middle");
  // Confirm the template chosen and the focus carried into the telling
  await expect(page.getByRole("button", { name: /Turning point/ })).toHaveAttribute("aria-pressed", "true");
  // (the focus)
  await expect(page.getByRole("link", { name: /^Start/ })).toHaveAttribute("href", /template=turning-point&focus=middle/);
  // Open it with names that do not exist
  await page.goto("/stories/tell?prompt=sp04&template=nonsense&focus=nonsense");
  // Confirm the suggested template and no focus
  await expect(page.getByRole("button", { name: /Lesson learned/ })).toHaveAttribute("aria-pressed", "true");
  // (no focus)
  await expect(page.getByRole("link", { name: /^Start/ })).not.toHaveAttribute("href", /focus=/);
});

// A link to the retired vocal fry card opens the corrected one (decision 94)
test("the retired vocal fry card's address opens the corrected card", async ({ page }) => {
  // Open the old address
  await page.goto("/learn/card?id=voice-fry");
  // Confirm the corrected card's question
  await expect(page.getByRole("heading", { level: 1, name: "Vocal fry makes you sound less competent." })).toBeVisible();
});
