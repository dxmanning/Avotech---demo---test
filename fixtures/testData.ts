/**
 * Test data for the QATestApp regression suite.
 * No login required — only app URL and UI text matchers are needed.
 */

import * as dotenv from 'dotenv';
dotenv.config();

// ─── App URL ───────────────────────────────────────────────────────────────

export const BASE_URL =
  process.env.BASE_URL ?? 'https://personal-oajqxmji.outsystemscloud.com/QATestApp';

// ─── Routes ───────────────────────────────────────────────────────────────

export const routes = {
  root: '/',
  screen1: '/Screen1',
} as const;

// ─── Confirmed data-testid attributes ─────────────────────────────────────
// Only list attributes that the dev team has explicitly confirmed exist.

export const testIds = {
  /** Confirmed by Gregg — applied via OutSystems Extended Property on Screen2 */
  returnDashboardTagged: 'screen1-link-return-dashboard',
} as const;

// ─── UI text matchers ─────────────────────────────────────────────────────
// Used in assertions. Regex so minor copy tweaks don't break tests.

export const uiText = {
  submitButton: /submit|send|save|confirm|ok/i,
  returnLink: /return|back|dashboard|screen\s*1/i,
  successMessage: /success|saved|submitted|thank/i,
  errorMessage: /error|failed|invalid|required/i,
} as const;
