import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

// Use the origin only — page paths include /QATestApp/ prefix explicitly
// so Playwright resolves them correctly regardless of the baseURL path.
const BASE_URL = process.env.BASE_URL || 'https://personal-oajqxmji.outsystemscloud.com';
const BROWSERSTACK_USER = process.env.BROWSERSTACK_USER || '';
const BROWSERSTACK_KEY = process.env.BROWSERSTACK_KEY || '';
const USE_BROWSERSTACK = process.env.USE_BROWSERSTACK === 'true';

// BrowserStack CDP endpoint
const bsCdpEndpoint = (caps: Record<string, unknown>) =>
  `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(caps))}`;

const bsCapabilities = (browserName: string, os: string, osVersion: string) => ({
  browser: browserName,
  browser_version: 'latest',
  os,
  os_version: osVersion,
  name: `CSI Regression – ${browserName} on ${os} ${osVersion}`,
  build: process.env.BUILD_ID || `local-${new Date().toISOString().split('T')[0]}`,
  'browserstack.username': BROWSERSTACK_USER,
  'browserstack.accessKey': BROWSERSTACK_KEY,
  'browserstack.local': false,
  'browserstack.networkLogs': true,
  'browserstack.consoleLogs': 'verbose',
});

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 2,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    // Custom results logger — writes logs/run-<timestamp>.json + logs/run-history.jsonl
    ['./utils/ResultsReporter', { outputDir: 'logs' }],
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: false,
      environmentInfo: {
        base_url: BASE_URL,
        platform: process.platform,
        node_version: process.version,
      },
    }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: USE_BROWSERSTACK
    ? [
        // BrowserStack cross-browser / cross-OS matrix
        {
          name: 'BS-Chrome-Windows',
          use: {
            connectOptions: { wsEndpoint: bsCdpEndpoint(bsCapabilities('chrome', 'Windows', '11')) },
          },
        },
        {
          name: 'BS-Firefox-Windows',
          use: {
            connectOptions: { wsEndpoint: bsCdpEndpoint(bsCapabilities('firefox', 'Windows', '11')) },
          },
        },
        {
          name: 'BS-Safari-macOS',
          use: {
            connectOptions: { wsEndpoint: bsCdpEndpoint(bsCapabilities('safari', 'OS X', 'Ventura')) },
          },
        },
        {
          name: 'BS-Edge-Windows',
          use: {
            connectOptions: { wsEndpoint: bsCdpEndpoint(bsCapabilities('edge', 'Windows', '11')) },
          },
        },
      ]
    : [
        // Local browser matrix
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
        {
          name: 'mobile-chrome',
          use: { ...devices['Pixel 7'] },
        },
        {
          name: 'mobile-safari',
          use: { ...devices['iPhone 14'] },
        },
      ],
});
