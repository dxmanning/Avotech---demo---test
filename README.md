# CSI QATestApp Demo - Complete Documentation

Automated regression test framework for the AvoTech CSI proof-of-concept on OutSystems O11.

- App under test: `https://personal-oajqxmji.outsystemscloud.com/QATestApp`
- Scope: two-screen no-auth demo flow
- Goal: prove stable selector strategy for O11 and provide CI/reporting/logging baseline for CSI

## 1) Technology Stack

| Layer | Tool |
|---|---|
| Web automation | Playwright + TypeScript |
| Reporting | Allure, Playwright HTML, JUnit XML |
| Custom run history | `utils/ResultsReporter.ts` + `utils/showLogs.ts` |
| CI/CD | GitHub Actions (`.github/workflows/regression.yml`) |
| Cloud execution (optional) | BrowserStack via Playwright CDP |

## 2) Selector Strategy (Most Important Rule)

### CSI / O11 strategy
Use semantic selectors first:

- `getByRole(...)`
- `getByLabel(...)`
- `getByPlaceholder(...)`
- `getByText(...)`

Do not use generated OutSystems IDs or brittle XPaths.

### `data-testid` usage

- In this demo, only one confirmed test id exists on Screen1:
  - `data-testid="screen1-link-return-dashboard"`
- Use this directly for the tagged link tests.
- For ODC (Macau), enforce `data-testid` broadly from day one.

## 3) App Model Used by the Tests

### Dashboard (`/QATestApp/Dashboard`)
- Name text input
- Submit button (`getByRole('button', { name: 'Submit' })`)
- Submit navigates to Screen1

### Screen1 (`/QATestApp/Screen1`)
- Tagged return link (`data-testid="screen1-link-return-dashboard"`)
- Untagged return link (`getByRole('link', { name: 'Return to dashboard', exact: true })`)

## 4) Repository Structure

```text
.
|- playwright.config.ts
|- package.json
|- pages/
|  |- BasePage.ts
|  |- DashboardPage.ts
|  |- Screen1Page.ts
|  |- Screen2Page.ts              (legacy/unused in current tests)
|  \- index.ts
|- tests/regression/
|  |- 01-app-health.spec.ts
|  |- 02-two-screen-flow.spec.ts
|  \- 07-performance-accessibility.spec.ts
|- fixtures/
|  |- testData.ts
|  \- customFixtures.ts
|- utils/
|  |- ResultsReporter.ts
|  |- showLogs.ts
|  \- allureHelpers.ts
|- docs/
|  \- TEST-CASES.md
\- .github/workflows/regression.yml
```

## 5) Setup

```bash
npm install
npx playwright install --with-deps
```

Create `.env` from `.env.example`:

```env
BASE_URL=https://personal-oajqxmji.outsystemscloud.com/QATestApp
USE_BROWSERSTACK=false
BROWSERSTACK_USER=your_bs_username
BROWSERSTACK_KEY=your_bs_access_key
BUILD_ID=local-build
```

## 6) Run Commands

```bash
# full suite
npm test

# key groups
npm run test:smoke
npm run test:p1
npm run test:regression

# debugging
npm run test:headed
npm run test:debug

# reporting
npm run allure:serve
npm run report

# custom run history
npm run logs
npm run logs:fails
```

PowerShell note: always quote tags, e.g. `--grep "@smoke"`.

## 7) Test Suite Inventory

### `01-app-health.spec.ts` (5 tests)
- TC-HEALTH-001: dashboard loads without critical JS errors
- TC-HEALTH-002: page title check (informational if empty)
- TC-HEALTH-003: submit + name input visible
- TC-HEALTH-004: screen1 links visible
- TC-HEALTH-005: dashboard load under 5s

### `02-two-screen-flow.spec.ts` (7 tests)
- TC-FLOW-001: dashboard form rendering
- TC-FLOW-002: submit navigates to screen1
- TC-FLOW-003: screen1 contains both return links
- TC-FLOW-004: tagged link returns to dashboard
- TC-FLOW-005: untagged link returns to dashboard
- TC-FLOW-006: submit selected by role (not by generated id)
- TC-FLOW-007: round-trip has no critical JS errors

### `07-performance-accessibility.spec.ts` (7 tests)
- TC-PERF-001/002: load budgets
- TC-A11Y-001..005: buttons/links/images/keyboard/input-label checks

Detailed step-by-step test documentation is in `docs/TEST-CASES.md`.

## 8) Design Decisions and Stability Fixes Already Applied

- `playwright.config.ts` uses origin-only base URL:
  - `https://personal-oajqxmji.outsystemscloud.com`
  - tests navigate with explicit `/QATestApp/...` paths
- OutSystems SPA timing handled with `waitForURL(...)` after submit/click actions.
- `Screen1Page.expectLoaded()` anchors on the tagged link so optional untagged-link changes do not falsely fail unrelated tests.
- TC-FLOW-003/004/005 navigate directly to Screen1 URL to isolate link checks from submit-button dependencies.

## 9) Reporting and Logs

Standard outputs:
- `allure-results/`
- `allure-report/`
- `playwright-report/`
- `test-results/junit.xml`

Custom history:
- per run JSON: `logs/run-<timestamp>.json`
- cumulative index: `logs/run-history.jsonl`

View examples:

```bash
npm run logs -- --last 20
npm run logs -- --fails
npm run logs -- --run <runId>
```

## 10) CI Pipeline Summary

Workflow: `.github/workflows/regression.yml`

- `smoke` job: Chromium smoke gate
- `regression-p1` job: Chromium/Firefox/WebKit P1 matrix
- `browserstack` job: optional BrowserStack run (nightly/manual)
- `allure-report` job: generate and publish Allure artifacts

## 11) BrowserStack Usage

Set:
- `USE_BROWSERSTACK=true`
- `BROWSERSTACK_USER`
- `BROWSERSTACK_KEY`

Configured matrix:
- Chrome Windows 11
- Firefox Windows 11
- Safari macOS Ventura
- Edge Windows 11

## 12) Known Caveats

- `README` (this file) is now the source of truth.
- `pages/Screen2Page.ts` and `fixtures/customFixtures.ts` still contain legacy references from older iterations and are not used by the current regression specs.
- The demo app has no auth scope in current tests.

## 13) Operational Guidance for CSI Expansion

- Start with P1 flows first for earliest value.
- Add RBAC and multi-tenant datasets as separate fixtures (Org A vs Org B).
- For email assertions, plan a mailbox API tool (e.g., Mailosaur) when needed.
- Keep selector standards:
  - CSI/O11: semantic selectors as baseline
  - Macau/ODC: enforce `data-testid` conventions

## 14) Quick FAQ

### Why did unrelated tests fail when button/link text changed?
They shared setup steps or text-bound selectors. Fixes were made so targeted tests are isolated and stable.

### Should all Screen1 checks use `data-testid`?
Only the tagged link should. The untagged link should intentionally remain role/text based to validate O11 no-tag scenarios.

### Is BrowserStack cost infrastructure load on client hosting?
No. It is a separate SaaS subscription for cloud browser/device execution.
