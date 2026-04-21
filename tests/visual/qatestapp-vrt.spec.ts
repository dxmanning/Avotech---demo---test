/**
 * Visual regression (VRT) — QATestApp scope only
 *
 * Captures full-page screenshots for:
 *   - /QATestApp/        (app entry — not Service Center)
 *   - /QATestApp/Screen1
 *
 * On mismatch, Playwright's HTML report shows Expected, Actual, and a Diff image
 * (highlighted pixel delta — the "shadow" of what moved) side by side.
 *
 * Tags: @vrt @visual
 * Project: vrt-chromium (fixed viewport; run separately from the multi-browser matrix)
 *
 * First-time / baseline refresh:
 *   npx playwright test --project=vrt-chromium --update-snapshots
 */

import { test, expect } from '@playwright/test';
import { DashboardPage, Screen1Page } from '../../pages';
import { allure } from 'allure-playwright';

const APP_ROOT = '/QATestApp/';

test.describe('QATestApp VRT @vrt @visual', () => {
  test.beforeEach(() => {
    allure.feature('Visual regression');
    allure.story('QATestApp — app root & Screen1 only');
  });

  test('VRT-001: App entry matches baseline @vrt', async ({ page }) => {
    allure.id('VRT-001');
    allure.description(
      'Full-page screenshot of /QATestApp/. Diff view on failure shows moved/changed pixels.'
    );

    const dash = new DashboardPage(page);
    await dash.navigateTo(APP_ROOT);
    await expect(page).toHaveScreenshot('vrt-app-root.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('VRT-002: Screen1 matches baseline @vrt', async ({ page }) => {
    allure.id('VRT-002');
    allure.description(
      'Full-page screenshot of /QATestApp/Screen1. Diff view on failure shows moved/changed pixels.'
    );

    const screen1 = new Screen1Page(page);
    await screen1.navigateTo(Screen1Page.PATH);
    await expect(page).toHaveScreenshot('vrt-screen1.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
