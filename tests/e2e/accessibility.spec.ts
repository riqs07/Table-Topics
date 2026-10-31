// Every page passes an automated accessibility check (WCAG 2.2 AA plus axe's best practices) at phone width, so a missing name, heading or contrast never creeps back in; what axe cannot judge (real screen-reader flow, focus order) is still checked by hand
import { AxeBuilder } from "@axe-core/playwright";
// The pages and the shared browser set-up
import { ROUTES, expect, test } from "./support/fixtures";

// One check per page
for (const route of ROUTES) {
  // Load it fresh and run the scan
  test(`has no accessibility violations: ${route}`, async ({ page }) => {
    // A typical phone width, where the layout is tightest
    await page.setViewportSize({ width: 375, height: 760 });
    // Open the page
    await page.goto(route);
    // Let it settle
    await page.waitForLoadState("networkidle");
    // Scan it against the WCAG 2.0, 2.1 and 2.2 A and AA rules and axe's best practices
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
    // Each violation, with the rule, the elements and their markup, so a failure says what to fix
    const violations = results.violations.map((violation) => `${violation.id} (${violation.impact}): ${violation.help}\n${violation.nodes.map((node) => `  ${node.target.join(" ")}: ${node.html.slice(0, 160)}`).join("\n")}`);
    // None
    expect(violations).toEqual([]);
  });
}
