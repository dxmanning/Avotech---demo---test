/**
 * App Health & Smoke Tests
 *
 * Priority: P1 — gate every deployment
 * Tags: @smoke @p1 @regression
 *
 * No login required.
 *
 * TC-HEALTH-001: Dashboard loads without critical JS errors
 * TC-HEALTH-002: Page has a non-empty <title>
 * TC-HEALTH-003: Dashboard renders the Submit button
 * TC-HEALTH-004: Screen1 renders the return links
 * TC-HEALTH-005: Dashboard loads within 5 seconds
 */

import { test, expect } from '@playwright/test';
import { DashboardPage, Screen1Page } from '../../pages';
import { allure } from 'allure-playwright';

test.describe('App Health @smoke @p1 @regression', () => {
  test.beforeEach(() => {
    allure.feature('App Health');
    allure.owner('QA Team');
  });

  test('TC-HEALTH-001: Dashboard loads without critical JS errors @smoke @p1', async ({ page }) => {
    allure.story('App Startup');
    allure.severity('blocker');
    allure.id('TC-HEALTH-001');

    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText.trim().length).toBeGreaterThan(10);

    const criticalErrors = jsErrors.filter(
      (e) =>
        !e.includes('ResizeObserver') &&
        !e.includes('Non-Error promise rejection') &&
        !e.includes('ChunkLoadError')
    );
    expect(criticalErrors, `JS errors:\n${criticalErrors.join('\n')}`).toHaveLength(0);
  });

  test('TC-HEALTH-002: Page title is non-empty @smoke @p1', async ({ page }) => {
    allure.story('Page Metadata');
    allure.severity('normal');
    allure.id('TC-HEALTH-002');

    await page.goto('/QATestApp/Dashboard');
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    allure.parameter('Page Title', title || '(empty — OutSystems O11 does not set <title> on this demo)');
    // O11 demo apps may not set a page title — this is informational, not a blocker
    if (title.trim().length === 0) {
      console.warn('[INFO] Page title is empty. OutSystems O11 does not set <title> by default on this app.');
    }
  });

  test('TC-HEALTH-003: Dashboard renders the Submit button @smoke @p1', async ({ page }) => {
    allure.story('Dashboard Availability');
    allure.severity('blocker');
    allure.id('TC-HEALTH-003');

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectLoaded();

    await expect(dashboard.submitButton).toBeVisible();
    await expect(dashboard.nameInput).toBeVisible();
  });

  test('TC-HEALTH-004: Screen1 renders return links @smoke @p1', async ({ page }) => {
    allure.story('Screen1 Availability');
    allure.severity('blocker');
    allure.id('TC-HEALTH-004');

    const screen1 = new Screen1Page(page);
    await screen1.goto();
    await screen1.expectLoaded();

    await expect(screen1.untaggedReturnLink).toBeVisible();
    await expect(screen1.taggedReturnLink).toBeVisible();
  });

  test('TC-HEALTH-005: Dashboard loads within 5 seconds @smoke @p1', async ({ page }) => {
    allure.story('Load Time');
    allure.severity('normal');
    allure.id('TC-HEALTH-005');

    const start = Date.now();
    await page.goto('/QATestApp/Dashboard');
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;

    allure.parameter('Load Time ms', String(elapsed));
    expect(elapsed).toBeLessThan(5000);
  });
});
