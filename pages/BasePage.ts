import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage — shared utilities for all OutSystems O11 page objects.
 *
 * ─── Permanent Selector Strategy for OutSystems O11 (CSI) ───────────────────
 *
 * OutSystems O11 auto-regenerates DOM IDs (e.g. #b4-Input_Username → #b5-…)
 * on every publish. The AvoTech dev team will NOT be adding data-testid
 * attributes to the CSI app due to capacity constraints.
 *
 * Therefore, ALL selectors in this suite use Playwright's built-in
 * semantic/role-based locators as the PERMANENT approach:
 *
 *   1. getByRole()        — ARIA role + accessible name (most stable)
 *   2. getByLabel()       — <label> text (form fields)
 *   3. getByPlaceholder() — input placeholder text
 *   4. getByText()        — visible text content
 *   5. [data-testid]      — ONLY where the dev has already applied it
 *                           (e.g. QATestApp/Screen1 demo tagged link)
 *
 * DO NOT use:
 *   ❌  #b4-Input_Username  (regenerated on every publish)
 *   ❌  .wt12_wtMainContent (OutSystems internal class)
 *   ❌  Complex XPaths tied to DOM structure
 * ────────────────────────────────────────────────────────────────────────────
 */
export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Wait for OutSystems SPA to finish loading.
   * OS apps show a loading overlay and fire network requests during bootstrap.
   */
  async waitForAppReady(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    const loader = this.page.locator(
      '.loading-overlay, [data-block="Loading"], .os-loading, [class*="loading"]'
    );
    const isLoaderVisible = await loader.isVisible().catch(() => false);
    if (isLoaderVisible) {
      await loader.waitFor({ state: 'hidden', timeout: 20_000 });
    }
  }

  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForAppReady();
  }

  // ── Semantic locator helpers ───────────────────────────────────────────────

  /** Button by its visible label text. */
  button(name: string | RegExp): Locator {
    return this.page.getByRole('button', { name });
  }

  /** Link by its visible text. */
  link(name: string | RegExp): Locator {
    return this.page.getByRole('link', { name });
  }

  /** Form input by its associated <label> text. */
  field(label: string | RegExp): Locator {
    return this.page.getByLabel(label);
  }

  /** Input by placeholder text (when no label is present). */
  placeholder(text: string | RegExp): Locator {
    return this.page.getByPlaceholder(text);
  }

  /** Any element by its exact visible text content. */
  text(content: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.page.getByText(content, options);
  }

  /** Heading by text. */
  heading(name: string | RegExp, level?: 1 | 2 | 3 | 4 | 5 | 6): Locator {
    return this.page.getByRole('heading', { name, level });
  }

  /**
   * data-testid selector — only used where the OutSystems developer has
   * already applied the "Tagged" / Extended Property. Do not rely on this
   * for new selectors without confirming the attribute exists.
   */
  byTestId(id: string): Locator {
    return this.page.locator(`[data-testid="${id}"]`);
  }

  // ── Shared assertions ──────────────────────────────────────────────────────

  async fillField(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.clear();
    await locator.fill(value);
  }

  /**
   * OutSystems feedback messages appear as toast-style banners.
   * Selects by ARIA role first, falls back to common OS feedback classes.
   */
  async expectFeedback(text: string | RegExp): Promise<void> {
    const feedback = this.page.locator(
      '[role="alert"], .feedback-message, .toast-message, [class*="feedback"]'
    );
    await expect(feedback.filter({ hasText: text })).toBeVisible({ timeout: 10_000 });
  }

  async expectUrl(segment: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(
      typeof segment === 'string' ? new RegExp(segment) : segment
    );
  }
}
