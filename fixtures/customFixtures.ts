import { test as base } from '@playwright/test';
import { Screen1Page, Screen2Page } from '../pages';

/**
 * Extended fixtures — provides instantiated Page Object Models to every test.
 * No authentication setup needed for this app.
 */
type Fixtures = {
  screen1Page: Screen1Page;
  screen2Page: Screen2Page;
};

export const test = base.extend<Fixtures>({
  screen1Page: async ({ page }, use) => {
    await use(new Screen1Page(page));
  },
  screen2Page: async ({ page }, use) => {
    await use(new Screen2Page(page));
  },
});

export { expect } from '@playwright/test';
