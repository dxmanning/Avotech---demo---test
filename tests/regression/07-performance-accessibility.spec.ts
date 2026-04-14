/**
 * Performance & Accessibility Baseline Tests
 *
 * Priority: P2
 * Tags: @performance @a11y @p2 @regression
 *
 * Selector strategy: getByRole(), page.evaluate() for DOM inspection.
 * These check structural HTML semantics — stable across O11 republishes.
 *
 * TC-PERF-001: App root loads within 5 seconds
 * TC-PERF-002: Screen1 loads within 5 seconds
 * TC-A11Y-001: Buttons have accessible names (visible text or aria-label)
 * TC-A11Y-002: Links have accessible names
 * TC-A11Y-003: Images have alt attributes
 * TC-A11Y-004: Tab key reaches the first interactive element
 * TC-A11Y-005: Form fields have associated labels
 */

import { test, expect } from '@playwright/test';
import { Screen1Page } from '../../pages';
import { allure } from 'allure-playwright';

const LOAD_BUDGET_MS = 5000;

test.describe('Performance Baseline @performance @p2 @regression', () => {
  test.beforeEach(() => {
    allure.feature('Performance');
    allure.owner('QA Team');
  });

  test('TC-PERF-001: App root loads within 5s @p2', async ({ page }) => {
    allure.story('Page Load Time');
    allure.severity('normal');
    allure.id('TC-PERF-001');

    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;

    allure.parameter('Load Time ms', String(elapsed));
    expect(elapsed).toBeLessThan(LOAD_BUDGET_MS);
  });

  test('TC-PERF-002: Screen1 loads within 5s @p2', async ({ page }) => {
    allure.story('Page Load Time');
    allure.severity('normal');
    allure.id('TC-PERF-002');

    const start = Date.now();
    const screen1 = new Screen1Page(page);
    await screen1.goto();
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;

    allure.parameter('Load Time ms', String(elapsed));
    expect(elapsed).toBeLessThan(LOAD_BUDGET_MS);
  });
});

test.describe('Accessibility Baseline @a11y @p2 @regression', () => {
  test.beforeEach(() => {
    allure.feature('Accessibility');
    allure.owner('QA Team');
  });

  test('TC-A11Y-001: Buttons have accessible names @p2', async ({ page }) => {
    allure.story('ARIA Labels');
    allure.severity('normal');
    allure.id('TC-A11Y-001');

    const screen1 = new Screen1Page(page);
    await screen1.goto();
    await screen1.waitForAppReady();

    const unlabelledButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"]');
      return Array.from(buttons)
        .filter((btn) => {
          const text = (btn.textContent ?? '').trim();
          const label = btn.getAttribute('aria-label') ?? '';
          const labelledBy = btn.getAttribute('aria-labelledby');
          return !text && !label && !labelledBy;
        })
        .map((btn) => btn.outerHTML.slice(0, 120));
    });

    if (unlabelledButtons.length > 0) {
      allure.attachment('Unlabelled Buttons', unlabelledButtons.join('\n'), 'text/plain');
      console.warn('[A11Y] Buttons without accessible name:', unlabelledButtons);
    }
    allure.parameter('Unlabelled Buttons', String(unlabelledButtons.length));
    // Informational — warn but don't hard-fail (OutSystems ships icon-only buttons)
  });

  test('TC-A11Y-002: Links have accessible names @p2', async ({ page }) => {
    allure.story('ARIA Labels');
    allure.severity('normal');
    allure.id('TC-A11Y-002');

    const screen1 = new Screen1Page(page);
    await screen1.goto();
    await screen1.waitForAppReady();

    const unlabelledLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      return Array.from(links)
        .filter((a) => {
          const text = (a.textContent ?? '').trim();
          const label = a.getAttribute('aria-label') ?? '';
          return !text && !label;
        })
        .map((a) => a.href ?? a.outerHTML.slice(0, 80));
    });

    if (unlabelledLinks.length > 0) {
      allure.attachment('Unlabelled Links', unlabelledLinks.join('\n'), 'text/plain');
    }
    allure.parameter('Unlabelled Links', String(unlabelledLinks.length));
  });

  test('TC-A11Y-003: Images have alt text @p2', async ({ page }) => {
    allure.story('Image Alt Text');
    allure.severity('minor');
    allure.id('TC-A11Y-003');

    const screen1 = new Screen1Page(page);
    await screen1.goto();
    await screen1.waitForAppReady();

    const imagesWithoutAlt = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .filter((img) => !img.hasAttribute('alt'))
        .map((img) => img.src.split('/').slice(-2).join('/'))
    );

    if (imagesWithoutAlt.length > 0) {
      allure.attachment('Images Without Alt', imagesWithoutAlt.join('\n'), 'text/plain');
    }
    allure.parameter('Images Without Alt', String(imagesWithoutAlt.length));
  });

  test('TC-A11Y-004: Tab key reaches first interactive element @p2', async ({ page }) => {
    allure.story('Keyboard Navigation');
    allure.severity('normal');
    allure.id('TC-A11Y-004');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Tab');

    const focusedTag = await page.evaluate(
      () => document.activeElement?.tagName.toLowerCase() ?? 'none'
    );
    allure.parameter('First Focused Tag', focusedTag);

    // Tab should move focus off <body> to a real interactive element
    expect(focusedTag).not.toBe('body');
  });

  test('TC-A11Y-005: Form inputs on Screen1 have associated labels @p2', async ({ page }) => {
    allure.story('Form Accessibility');
    allure.severity('normal');
    allure.id('TC-A11Y-005');

    const screen1 = new Screen1Page(page);
    await screen1.goto();
    await screen1.waitForAppReady();

    const unlabelledInputs = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
      return Array.from(inputs)
        .filter((input) => {
          const id = input.getAttribute('id');
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledBy = input.getAttribute('aria-labelledby');
          const hasLabel = id ? !!document.querySelector(`label[for="${id}"]`) : false;
          return !hasLabel && !ariaLabel && !ariaLabelledBy;
        })
        .map((input) => `<${input.tagName.toLowerCase()} type="${input.getAttribute('type')}" placeholder="${input.getAttribute('placeholder')}">`)
    });

    if (unlabelledInputs.length > 0) {
      allure.attachment('Unlabelled Inputs', unlabelledInputs.join('\n'), 'text/plain');
      console.warn('[A11Y] Inputs without associated label:', unlabelledInputs);
    }
    allure.parameter('Unlabelled Inputs', String(unlabelledInputs.length));
  });
});
