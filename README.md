# CSI Platform — Automated Regression Suite

Playwright (TypeScript) regression tests for the AvoTech CSI Platform.  
**Test App:** https://personal-oajqxmji.outsystemscloud.com/QATestApp

---

## Stack

| Layer | Tool |
|---|---|
| Web Automation | Playwright 1.42 + TypeScript |
| Reporting | Allure Report |
| CI/CD | GitHub Actions (+ GitLab CI reference) |
| Cross-Browser Cloud | BrowserStack |

---

## Selector Strategy — Critical Reading

### The OutSystems O11 Problem

OutSystems O11 **auto-regenerates DOM element IDs on every publish**:

```
Before publish:  <input id="b4-Input_Username" ...>
After publish:   <input id="b5-Input_Username" ...>   ← breaks your test
```

This means **you must never write selectors that target OS-generated IDs or internal class names** like `#wt12_wtMainContent` or `.OSBlock-content`.

### The Permanent Solution for CSI (O11)

Because the AvoTech development team does not have capacity to backfill `data-testid` attributes across the existing O11 codebase, **role-based and text selectors are the permanent strategy for CSI**.

Playwright's built-in semantic locators bind to what the **user sees and what ARIA exposes** — not to generated IDs. These survive republishes:

| Selector | Use for | Example |
|---|---|---|
| `getByRole('button', { name })` | Any button | Submit, Save, Delete, Cancel |
| `getByRole('link', { name })` | Navigation links | Nav items, breadcrumbs |
| `getByLabel(text)` | Form fields with labels | Username, Password inputs |
| `getByPlaceholder(text)` | Inputs without labels | Search box |
| `getByText(text)` | Visible text assertions | Error messages, status labels |
| `getByRole('table')` | Data tables | Record lists |
| `getByRole('dialog')` | Modals / popups | Confirmation dialogs |
| `getByRole('alert')` | Feedback messages | Success/error toasts |
| `getByRole('navigation')` | Navigation menus | Sidebar, top bar |

### DO NOT use

```typescript
// ❌ WRONG — ID regenerates on every OutSystems publish
page.locator('#b4-Input_Username')
page.locator('.wt12_wtMainContent')
page.locator('xpath=//div[@id="wt12"]//input[3]')

// ✅ CORRECT — binds to visible label, survives republish
page.getByLabel(/username/i)
page.getByRole('button', { name: /log in/i })
page.getByRole('table').getByRole('row')
```

### data-testid — When to Use It

`data-testid` attributes are **only used in this suite** when a developer has already explicitly applied the OutSystems "Tagged" / Extended Property to an element.

The client confirmed one such element exists on `/Screen1` as a demo. This is the **exception**, not the pattern for O11.

**For new OutSystems ODC projects** (e.g. the Macau project), `data-testid` should be the primary strategy — request developers apply the "Attributes" property to all interactive elements from the start.

---

## UI Elements That Should Have data-testid in New (ODC) Projects

| Category | Elements |
|---|---|
| User Actions | Buttons, inputs, dropdowns, checkboxes |
| Critical Assertions | Success messages, error messages, status labels |
| Dynamic Content | Table rows, action buttons in rows, cards, modals |
| Navigation | Tabs, sidebar menu items |
| **Not needed** | Static text, layout divs, styling elements, decorative icons |

---

## Quick Start

```bash
# 1. Install
npm install
npx playwright install --with-deps

# 2. Set credentials
cp .env.example .env
# Fill in real test account credentials

# 3. Run smoke tests (fast, Chromium only)
npm run test:smoke

# 4. Run all P1 tests
npm run test:p1

# 5. Run full regression
npm run test:regression

# 6. Open interactive Allure report
npm run allure:serve
```

---

## Project Structure

```
├── playwright.config.ts               # Browser matrix, Allure, BrowserStack toggle
├── pages/                             # Page Object Models
│   ├── BasePage.ts                    # Shared helpers + selector strategy docs
│   ├── LoginPage.ts                   # getByLabel/getByRole login selectors
│   ├── DashboardPage.ts               # getByRole nav, logout
│   └── Screen1Page.ts                 # Full Screen1 POM with semantic selectors
├── tests/regression/
│   ├── 01-app-health.spec.ts          # Boot, JS errors, network, load time
│   ├── 02-authentication.spec.ts      # Login, logout, SQL injection, XSS, session
│   ├── 03-navigation.spec.ts          # Routes, links, back button, 404
│   ├── 04-rbac.spec.ts                # Role-based access control (P1)
│   ├── 05-screen1-interactions.spec.ts # Search, CRUD, pagination, mobile
│   ├── 06-multi-tenant.spec.ts        # Data isolation between orgs
│   └── 07-performance-accessibility.spec.ts # Load time, ARIA, keyboard nav
├── fixtures/
│   ├── testData.ts                    # Credentials, boundary values, UI strings
│   └── customFixtures.ts              # Extended Playwright fixtures with POMs
├── utils/
│   └── allureHelpers.ts               # Allure step/attachment helpers
└── .github/workflows/
    └── regression.yml                 # GitHub Actions pipeline
```

---

## Test Tags

| Tag | Description | When to run |
|---|---|---|
| `@smoke` | Critical path only | Every commit / PR |
| `@p1` | Release blockers | Every merge to main |
| `@regression` | Full suite | Nightly / pre-release |
| `@security` | Auth, injection, RBAC | Every merge |
| `@rbac` | Role-based access | Every merge |
| `@multitenant` | Data isolation | Every merge |
| `@a11y` | Accessibility baseline | Nightly |
| `@performance` | Load time | Nightly |
| `@p2` | Non-blocking checks | Nightly |

---

## Running Specific Tests

```bash
# Smoke only (fast gate)
npx playwright test --grep @smoke --project=chromium

# All P1 tests across browsers
npx playwright test --grep @p1

# Security tests only
npx playwright test --grep @security

# Single spec file
npx playwright test tests/regression/02-authentication.spec.ts

# Debug mode (headed, step-through)
npx playwright test --debug tests/regression/02-authentication.spec.ts
```

---

## CI/CD — GitHub Actions

Three jobs run automatically:

| Job | Trigger | Browsers | Tests |
|---|---|---|---|
| `smoke` | Every push | Chromium | `@smoke` |
| `regression-p1` | PR / merge | Chrome + Firefox + WebKit | `@p1` |
| `browserstack` | Nightly / manual | Real devices via BrowserStack | `@p1` |

Allure reports are published to GitHub Pages on every merge to `main`.

### Required Secrets

| Secret | Value |
|---|---|
| `SUPER_ADMIN_USER` / `SUPER_ADMIN_PASS` | Super Admin test account |
| `END_USER_USER` / `END_USER_PASS` | End User test account |
| `TRAINING_ADMIN_USER` / `TRAINING_ADMIN_PASS` | Training Admin account |
| `BROWSERSTACK_USER` / `BROWSERSTACK_KEY` | BrowserStack credentials |

---

## BrowserStack (Cross-Device)

Set `USE_BROWSERSTACK=true` in `.env` or trigger the nightly workflow.

Runs on: Chrome/Windows 11, Firefox/Windows 11, Safari/macOS Ventura, Edge/Windows 11.

---

## Appium / Mobile Note

If the CSI app has a mobile (Cordova hybrid) component, configure Appium 2.0 to use the **WebView context**:

```javascript
// Switch to WebView context in Appium for OutSystems Cordova apps
const contexts = await driver.getContexts();
const webview = contexts.find(c => c.startsWith('WEBVIEW'));
await driver.switchContext(webview);
// Now use the same Playwright-style selectors (ARIA roles, visible text)
```

The same selector strategy applies — no generated IDs.

---

## Known Gaps & Next Steps

1. **Credentials**: Replace `.env.example` placeholders with real test accounts.
2. **Cross-tenant data**: `06-multi-tenant.spec.ts` uses placeholder org names (`OtherCorp`). Update with real org names seeded in the test environment.
3. **Module-specific tests**: Add specs for Training, Phishing, Policy Management, Incident Response etc. under `tests/regression/` following the same POM pattern.
4. **Future ODC projects** (Macau etc.): Mandate `data-testid` from day one — request devs add the Attributes property to all interactive elements in OutSystems ODC.
