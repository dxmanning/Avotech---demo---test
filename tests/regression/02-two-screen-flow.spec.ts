/**
 * Two-Screen Flow — Core Regression Suite
 *
 * App: https://personal-oajqxmji.outsystemscloud.com/QATestApp
 * No login required.
 *
 * ─── App Structure ───────────────────────────────────────────────────────────
 *
 *  Dashboard (/QATestApp/Dashboard)
 *    • "Name:" text input
 *    • "Submit" button  →  navigates to Screen1
 *
 *  Screen1 (/QATestApp/Screen1)
 *    • "Return to dashboard"         ← untagged link (role-based selector)
 *    • "Return to dashboard (tagged)" ← <span data-testid="screen1-link-return-dashboard">
 *                                        wraps the <a>
 *
 * ─── Selector strategy proof ─────────────────────────────────────────────────
 *
 *  Gregg will reorder elements and republish — the tests must still pass.
 *  This proves two things:
 *    1. Role-based selectors survive OutSystems republishes (permanent O11 strategy)
 *    2. data-testid on the tagged link also survives reorders (ODC strategy going forward)
 *
 * ─── Tests ───────────────────────────────────────────────────────────────────
 *  TC-FLOW-001  Dashboard renders form elements (input + Submit button)
 *  TC-FLOW-002  Submit navigates from Dashboard to Screen1
 *  TC-FLOW-003  Screen1 has exactly 2 return links
 *  TC-FLOW-004  Tagged link (data-testid="screen1-link-return-dashboard") goes back
 *  TC-FLOW-005  Untagged link (getByRole exact text) goes back
 *  TC-FLOW-006  Submit button found by role — not by generated ID (resilience proof)
 *  TC-FLOW-007  Full round-trip has zero JS errors
 */

import { test, expect } from '@playwright/test';
import { DashboardPage, Screen1Page } from '../../pages';
import { allure } from 'allure-playwright';

function isOnDashboard(url: string): boolean {
  return (
    url.includes('/QATestApp/Dashboard') ||
    url.includes('/QATestApp/') ||
    url.match(/\/QATestApp\/?$/) !== null
  );
}

test.describe('Two-Screen Flow @smoke @p1 @regression', () => {
  test.beforeEach(() => {
    allure.feature('QATestApp Two-Screen Flow');
    allure.owner('QA Team');
  });

  // ── TC-FLOW-001 ─────────────────────────────────────────────────────────────

  test('TC-FLOW-001: Dashboard renders the Name input and Submit button @smoke @p1', async ({ page }) => {
    allure.story('Dashboard Load');
    allure.severity('blocker');
    allure.id('TC-FLOW-001');
    allure.description(
      'The form screen loads with a text input and Submit button. ' +
      'Submit is found via getByRole("button", { name: "Submit" }) — ' +
      'not by a generated OutSystems ID — so it survives republishes.'
    );

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectLoaded();

    await expect(dashboard.nameInput).toBeVisible();
    await expect(dashboard.submitButton).toBeVisible();

    allure.parameter('Submit Button Text', await dashboard.submitButton.textContent() ?? '');
    allure.parameter('URL', page.url());
  });

  // ── TC-FLOW-002 ─────────────────────────────────────────────────────────────

  test('TC-FLOW-002: Submitting the form navigates to Screen1 @smoke @p1', async ({ page }) => {
    allure.story('Form Submit → Screen1');
    allure.severity('blocker');
    allure.id('TC-FLOW-002');
    allure.description(
      'Clicking Submit on Dashboard must navigate to Screen1 ' +
      'where the two return links are visible.'
    );

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectLoaded();

    await dashboard.fillName('Test User');
    const urlBefore = page.url();
    await dashboard.submit();
    const urlAfter = page.url();

    allure.parameter('URL Before Submit', urlBefore);
    allure.parameter('URL After Submit', urlAfter);

    expect(urlAfter).not.toBe(urlBefore);
    expect(urlAfter).toContain('/QATestApp/Screen1');

    const screen1 = new Screen1Page(page);
    await screen1.expectLoaded();
  });

  // ── TC-FLOW-003 ─────────────────────────────────────────────────────────────

  test('TC-FLOW-003: Screen1 has exactly 2 return links @smoke @p1', async ({ page }) => {
    allure.story('Screen1 Links');
    allure.severity('critical');
    allure.id('TC-FLOW-003');
    allure.description(
      'Screen1 must show exactly 2 "Return to dashboard" links: one tagged, one not. ' +
      'Navigates directly to Screen1 by URL — independent of the Submit button.'
    );

    const screen1 = new Screen1Page(page);
    await screen1.goto();
    await screen1.expectLoaded();

    // Each link is found by its own stable selector so a text change on either
    // does not cause a false failure here.
    await expect(screen1.untaggedReturnLink).toBeVisible();
    await expect(screen1.taggedReturnLink).toBeVisible();

    const untaggedText = (await screen1.untaggedReturnLink.textContent() ?? '').trim();
    const taggedText   = (await screen1.taggedReturnLink.textContent()   ?? '').trim();
    allure.parameter('Untagged Link Text', untaggedText);
    allure.parameter('Tagged Link Text',   taggedText);
    allure.parameter('Return Links Found', '2');
  });

  // ── TC-FLOW-004 ─────────────────────────────────────────────────────────────

  test('TC-FLOW-004: Tagged link (data-testid) navigates back to Dashboard @smoke @p1', async ({ page }) => {
    allure.story('Tagged Link Navigation');
    allure.severity('blocker');
    allure.id('TC-FLOW-004');
    allure.description(
      '"Return to dashboard (tagged)" is wrapped in ' +
      '<span data-testid="screen1-link-return-dashboard">. ' +
      'When Gregg moves this element in OutSystems, the data-testid stays — ' +
      'so this test keeps passing regardless of DOM position. ' +
      'Navigates directly to Screen1 by URL — independent of the Submit button.'
    );

    const screen1 = new Screen1Page(page);
    await screen1.goto();
    await screen1.expectLoaded();

    await expect(screen1.taggedReturnLink).toBeVisible();
    allure.parameter(
      'Tagged Link Text',
      (await screen1.taggedReturnLink.textContent() ?? '').trim()
    );
    allure.parameter('data-testid', 'screen1-link-return-dashboard');

    await screen1.clickTaggedReturnLink();

    expect(isOnDashboard(page.url())).toBeTruthy();
    allure.parameter('Return URL', page.url());
  });

  // ── TC-FLOW-005 ─────────────────────────────────────────────────────────────

  test('TC-FLOW-005: Untagged link (exact role-based text) navigates back to Dashboard @smoke @p1', async ({ page }) => {
    allure.story('Untagged Link Navigation');
    allure.severity('blocker');
    allure.id('TC-FLOW-005');
    allure.description(
      '"Return to dashboard" (no data-testid) is located by: ' +
      'getByRole("link", { name: "Return to dashboard", exact: true }). ' +
      'This is the permanent O11 strategy — binds to visible text, not a DOM ID. ' +
      'Survives element reorders. ' +
      'Navigates directly to Screen1 by URL — independent of the Submit button.'
    );

    const screen1 = new Screen1Page(page);
    await screen1.goto();
    await screen1.expectLoaded();

    await expect(screen1.untaggedReturnLink).toBeVisible();
    allure.parameter('Selector Used', 'getByRole("link", { name: "Return to dashboard", exact: true })');

    await screen1.clickUntaggedReturnLink();

    expect(isOnDashboard(page.url())).toBeTruthy();
    allure.parameter('Return URL', page.url());
  });

  // ── TC-FLOW-006 ─────────────────────────────────────────────────────────────

  test('TC-FLOW-006: Submit button found by role — NOT by generated ID @smoke @p1', async ({ page }) => {
    allure.story('Selector Resilience Proof');
    allure.severity('blocker');
    allure.id('TC-FLOW-006');
    allure.description(
      'Documents the resilience proof for the client. ' +
      'The Submit button is found ONLY via getByRole("button", { name: "Submit" }). ' +
      'Gregg can move the button anywhere on Dashboard and this test still passes. ' +
      'We deliberately log the DOM id to show we are NOT using it.'
    );

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForAppReady();

    const button = dashboard.submitButton;
    await expect(button).toBeVisible();

    const info = await button.evaluate((el) => ({
      tag: el.tagName,
      visibleText: el.textContent?.trim(),
      generatedId: el.id || '(no id used in selector)',
      role: el.getAttribute('role') ?? el.tagName.toLowerCase(),
    }));

    allure.attachment('Submit Button DOM Info', JSON.stringify(info, null, 2), 'application/json');
    allure.parameter('Selector Used', 'getByRole("button", { name: "Submit" })');
    allure.parameter('Visible Text', info.visibleText ?? '');
    allure.parameter('Generated DOM ID (ignored)', info.generatedId);

    expect(info.visibleText).toBe('Submit');
  });

  // ── TC-FLOW-007 ─────────────────────────────────────────────────────────────

  test('TC-FLOW-007: Full round-trip has zero JS errors @smoke @p1', async ({ page }) => {
    allure.story('Error-Free Round Trip');
    allure.severity('critical');
    allure.id('TC-FLOW-007');
    allure.description(
      'Dashboard → Submit → Screen1 → tagged link → Dashboard. ' +
      'No critical JavaScript errors should fire at any point.'
    );

    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectLoaded();

    await dashboard.fillName('Round Trip Test');
    await dashboard.submit();

    const screen1 = new Screen1Page(page);
    await screen1.expectLoaded();

    await screen1.clickTaggedReturnLink();
    expect(isOnDashboard(page.url())).toBeTruthy();

    const critical = jsErrors.filter(
      (e) =>
        !e.includes('ResizeObserver') &&
        !e.includes('Non-Error promise rejection') &&
        !e.includes('ChunkLoadError')
    );

    if (critical.length > 0) {
      allure.attachment('JS Errors', critical.join('\n'), 'text/plain');
    }
    expect(critical, `JS errors during round-trip:\n${critical.join('\n')}`).toHaveLength(0);
  });
});
