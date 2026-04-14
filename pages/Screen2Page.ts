import { Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Screen2Page — the screen reached after submitting the Screen1 form.
 *
 * This screen has exactly two "return" links:
 *
 *   1. Tagged link   → data-testid="screen1-link-return-dashboard"
 *                      Dev applied OutSystems Extended Property: data-testid.
 *                      Stable even when elements are reordered.
 *
 *   2. Untagged link → matched by visible text via getByRole('link', { name })
 *                      Stable as long as the link label doesn't change.
 *
 * Both approaches are demonstrated side-by-side here to show O11 teams
 * what each strategy looks like in practice.
 */
export class Screen2Page extends BasePage {
  // ── Tagged link (data-testid confirmed by Gregg) ───────────────────────────

  /**
   * "Return to dashboard (tagged)" link.
   * Uses data-testid="screen1-link-return-dashboard" — set via OutSystems
   * Extended Property. Will NOT break when Gregg reorders elements.
   */
  get taggedReturnLink(): Locator {
    return this.byTestId('screen1-link-return-dashboard');
  }

  // ── Untagged link (role + text — permanent O11 strategy) ──────────────────

  /**
   * The second return link on Screen2 — no data-testid applied.
   * Matched by its visible link text via getByRole('link').
   * Will survive element reordering because it binds to what the user reads,
   * not to a generated DOM ID.
   *
   * Update the regex below to match the actual link text on Screen2.
   */
  get untaggedReturnLink(): Locator {
    return this.page.getByRole('link', { name: /return|back|dashboard|screen\s*1/i });
  }

  // ── All links on Screen2 ───────────────────────────────────────────────────

  get allLinks(): Locator {
    return this.page.getByRole('link');
  }

  get pageHeading(): Locator {
    return this.page.getByRole('heading').first();
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async expectLoaded(): Promise<void> {
    await this.waitForAppReady();
    // Screen2 should have at least one visible link back
    const linkCount = await this.allLinks.count();
    expect(linkCount, 'Screen2 rendered no links — expected at least 2 return links').toBeGreaterThan(0);
  }

  async clickTaggedReturnLink(): Promise<void> {
    await this.taggedReturnLink.click();
    await this.waitForAppReady();
  }

  async clickUntaggedReturnLink(): Promise<void> {
    // Filter out the tagged one so we click the other
    const links = this.allLinks;
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const testId = await link.getAttribute('data-testid');
      if (!testId) {
        await link.click();
        await this.waitForAppReady();
        return;
      }
    }
    throw new Error('Could not find an untagged link on Screen2');
  }
}
