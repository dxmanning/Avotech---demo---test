import { test } from '@playwright/test';
import { allure } from 'allure-playwright';

/**
 * Allure annotation helpers — wrap these around test steps to
 * produce rich, navigable reports.
 */

export async function step<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return allure.step(name, fn);
}

export function setTestMeta(options: {
  feature?: string;
  story?: string;
  severity?: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';
  owner?: string;
  testCaseId?: string;
  description?: string;
}) {
  if (options.feature) allure.feature(options.feature);
  if (options.story) allure.story(options.story);
  if (options.severity) allure.severity(options.severity);
  if (options.owner) allure.owner(options.owner);
  if (options.testCaseId) allure.id(options.testCaseId);
  if (options.description) allure.description(options.description);
}

export async function attachScreenshot(page: import('@playwright/test').Page, name: string) {
  const buffer = await page.screenshot({ fullPage: true });
  allure.attachment(name, buffer, 'image/png');
}

export async function attachHtmlSource(page: import('@playwright/test').Page) {
  const html = await page.content();
  allure.attachment('Page HTML', html, 'text/html');
}
