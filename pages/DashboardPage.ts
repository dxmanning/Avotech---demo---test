import { Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * DashboardPage — /QATestApp/Dashboard (and root /QATestApp)
 *
 * This is the FORM screen. It contains:
 *   - A "Name:" text input (no <label for> association — OutSystems text widget)
 *   - A "Submit" button
 *
 * After clicking Submit, the app navigates to /QATestApp/Screen1.
 *
 * Selector strategy:
 *   - Input  → page.locator('input[type="text"]')  ← no label association in DOM
 *   - Button → getByRole('button', { name: 'Submit' })
 */
export class DashboardPage extends BasePage {
  static readonly PATH = '/QATestApp/Dashboard';

  // ── Form elements ──────────────────────────────────────────────────────────

  /**
   * The "Name:" text input.
   * OutSystems renders the label as a separate text widget with no `for` attribute,
   * so getByLabel() won't work here. We use input[type="text"] instead.
   * This is still more stable than targeting a generated ID.
   */
  get nameInput(): Locator {
    return this.page.locator('input[type="text"]').first();
  }

  /**
   * The Submit button — matched by its exact visible text.
   * This is the most reliable selector for OutSystems buttons.
   */
  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Submit' });
  }

  // ── Nav links ──────────────────────────────────────────────────────────────

  get screen1NavLink(): Locator {
    return this.page.getByRole('link', { name: 'Screen1' });
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigateTo(DashboardPage.PATH);
  }

  async expectLoaded(): Promise<void> {
    await this.waitForAppReady();
    await expect(this.submitButton).toBeVisible({ timeout: 15_000 });
  }

  async fillName(name: string): Promise<void> {
    await this.fillField(this.nameInput, name);
  }

  async submit(): Promise<void> {
    const urlBefore = this.page.url();
    await this.submitButton.click();
    // OutSystems SPA updates the URL asynchronously — waitForURL is more reliable
    // than waitForLoadState('networkidle') for catching the navigation.
    await this.page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 15_000 });
    await this.waitForAppReady();
  }
}
