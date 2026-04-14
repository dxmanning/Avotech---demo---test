import { Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Screen1Page — /QATestApp/Screen1
 *
 * This is the RESULTS screen reached after submitting the Dashboard form.
 * It contains two "Return to dashboard" links:
 *
 *   1. Untagged link  → "Return to dashboard"
 *                       Selector: getByRole('link', { name: 'Return to dashboard' })
 *                       Exact match avoids also matching the tagged one.
 *
 *   2. Tagged link    → "Return to dashboard (tagged)"
 *                       The <a> is wrapped in:
 *                         <span data-testid="screen1-link-return-dashboard">
 *                           <a href="...">Return to dashboard (tagged)</a>
 *                         </span>
 *                       Selector: locator('[data-testid="screen1-link-return-dashboard"]')
 *                       Clicking the span propagates to the inner <a>.
 *
 * Both links navigate back to /QATestApp/Dashboard.
 */
export class Screen1Page extends BasePage {
  static readonly PATH = '/QATestApp/Screen1';

  // ── Tagged return link ─────────────────────────────────────────────────────

  /**
   * "Return to dashboard (tagged)"
   *
   * data-testid="screen1-link-return-dashboard" is on the <span> wrapper,
   * confirmed by DOM inspection. Clicking the span triggers the inner <a>.
   * Stable across element reorders because it binds to the attribute, not position.
   */
  get taggedReturnLink(): Locator {
    return this.page.locator('[data-testid="screen1-link-return-dashboard"]');
  }

  // ── Untagged return link ───────────────────────────────────────────────────

  /**
   * "Return to dashboard" (the untagged one)
   *
   * Matched by its exact link text. The { exact: true } flag ensures we
   * don't accidentally match "Return to dashboard (tagged)" as well.
   * Stable as long as the link label doesn't change — survives element reorders.
   */
  get untaggedReturnLink(): Locator {
    return this.page.getByRole('link', { name: 'Return to dashboard', exact: true });
  }

  // ── All content links (excludes nav/skip links) ────────────────────────────

  /**
   * The two meaningful content links on this page.
   * Filtered to links pointing to /QATestApp/Dashboard.
   */
  get returnLinks(): Locator {
    return this.page.getByRole('link', { name: /return to dashboard/i });
  }

  // ── Page body text ─────────────────────────────────────────────────────────

  get bodyText(): Locator {
    return this.page.getByText('Hello random stranger');
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigateTo(Screen1Page.PATH);
  }

  async expectLoaded(): Promise<void> {
    await this.waitForAppReady();
    // Screen1 always shows the "Hello random stranger" text and at least one link
    await expect(this.untaggedReturnLink).toBeVisible({ timeout: 15_000 });
  }

  async clickTaggedReturnLink(): Promise<void> {
    await this.taggedReturnLink.click();
    await this.page.waitForURL('**/Dashboard', { timeout: 15_000 });
    await this.waitForAppReady();
  }

  async clickUntaggedReturnLink(): Promise<void> {
    await this.untaggedReturnLink.click();
    await this.page.waitForURL('**/Dashboard', { timeout: 15_000 });
    await this.waitForAppReady();
  }
}
