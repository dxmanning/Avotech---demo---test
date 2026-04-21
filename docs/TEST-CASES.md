# QATestApp — Automated Regression Test Cases

**Project:** AvoTech CSI Platform — QATestApp Demo  
**Application URL:** https://personal-oajqxmji.outsystemscloud.com/QATestApp  
**Framework:** Playwright 1.42 (TypeScript)  
**Document Version:** 1.1  
**Last Updated:** 2026-04-21  
**Author:** QA Team / Dax Manning  
**Status:** Active — All P1 tests verified passing

---

## Application Under Test

The QATestApp is a two-screen OutSystems O11 demo application used to validate the automated regression testing approach before applying it to the full CSI platform.

| Screen | URL | Description |
|---|---|---|
| Dashboard | `/QATestApp/Dashboard` | Form screen — Name input + Submit button |
| Screen1 | `/QATestApp/Screen1` | Results screen — two return links |

No login is required. The app is publicly accessible.

---

## Selector Strategy

OutSystems O11 auto-regenerates DOM element IDs on every publish (e.g. `#b4-Input_Username` → `#b5-Input_Username`). This suite uses **semantic/role-based selectors as the permanent strategy** to survive republishes.

| Priority | Selector | Example |
|---|---|---|
| 1 | `getByRole('button', { name })` | Submit button |
| 2 | `getByRole('link', { name })` | Return links |
| 3 | `getByLabel()` / `getByPlaceholder()` | Form inputs |
| 4 | `getByText()` | Visible content assertions |
| 5 | `[data-testid]` | Only where dev has explicitly applied it |

**Never use:** auto-generated IDs (`#b4-...`), OutSystems internal classes (`.wt12_...`), or structural XPaths.

---

## Test Suite Overview

| Suite | File | Tests | Priority |
|---|---|---|---|
| App Health | `01-app-health.spec.ts` | 5 | P1 |
| Two-Screen Flow | `02-two-screen-flow.spec.ts` | 7 | P1 |
| Performance | `07-performance-accessibility.spec.ts` | 2 | P2 |
| Accessibility | `07-performance-accessibility.spec.ts` | 5 | P2 |
| Visual regression (VRT) | `tests/visual/qatestapp-vrt.spec.ts` | 2 | `@vrt` (Chromium baselines) |
| **Total** | | **21** | |

---

## Module 1 — App Health

**Suite:** `01-app-health.spec.ts`  
**Tags:** `@smoke @p1 @regression`  
**Precondition:** None. No login required. Browser navigates directly to the app URL.

---

### TC-HEALTH-001

| Field | Detail |
|---|---|
| **ID** | TC-HEALTH-001 |
| **Title** | Dashboard loads without critical JavaScript errors |
| **Priority** | P1 — Blocker |
| **Type** | Smoke / Health |
| **Tags** | `@smoke @p1 @regression` |

**Steps**
1. Navigate to `/QATestApp/Dashboard`
2. Attach a listener to capture all `pageerror` events
3. Wait for the page to reach `networkidle`
4. Read `document.body.textContent`

**Expected Results**
- Page body contains visible text (length > 10 characters)
- Zero critical JavaScript errors fired
- *(Non-critical noise filtered: `ResizeObserver`, `Non-Error promise rejection`, `ChunkLoadError`)*

---

### TC-HEALTH-002

| Field | Detail |
|---|---|
| **ID** | TC-HEALTH-002 |
| **Title** | Page has a document title |
| **Priority** | P1 — Normal |
| **Type** | Smoke / Metadata |
| **Tags** | `@smoke @p1 @regression` |

**Steps**
1. Navigate to `/QATestApp/Dashboard`
2. Wait for `DOMContentLoaded`
3. Read `document.title`

**Expected Results**
- Page title is logged
- **Note:** OutSystems O11 does not set `<title>` on this demo app — the test logs the value as informational and does not hard-fail if empty. This is expected behaviour for the current demo build.

---

### TC-HEALTH-003

| Field | Detail |
|---|---|
| **ID** | TC-HEALTH-003 |
| **Title** | Dashboard renders the Name input and Submit button |
| **Priority** | P1 — Blocker |
| **Type** | Smoke / Render |
| **Tags** | `@smoke @p1 @regression` |

**Steps**
1. Navigate to `/QATestApp/Dashboard`
2. Wait for the Submit button to be visible (`expectLoaded()`)
3. Assert Name input is visible
4. Assert Submit button is visible

**Expected Results**
- `input[type="text"]` is visible on the page
- `getByRole('button', { name: 'Submit' })` resolves and is visible

**Selector Used**
```
Name input  → page.locator('input[type="text"]').first()
Submit btn  → page.getByRole('button', { name: 'Submit' })
```

---

### TC-HEALTH-004

| Field | Detail |
|---|---|
| **ID** | TC-HEALTH-004 |
| **Title** | Screen1 renders both return links |
| **Priority** | P1 — Blocker |
| **Type** | Smoke / Render |
| **Tags** | `@smoke @p1 @regression` |

**Steps**
1. Navigate to `/QATestApp/Screen1`
2. Wait for the untagged return link to be visible (`expectLoaded()`)
3. Assert untagged "Return to dashboard" link is visible
4. Assert tagged link (`data-testid="screen1-link-return-dashboard"`) is visible

**Expected Results**
- Both return links are rendered and visible

**Selector Used**
```
Untagged → getByRole('link', { name: 'Return to dashboard', exact: true })
Tagged   → locator('[data-testid="screen1-link-return-dashboard"]')
```

---

### TC-HEALTH-005

| Field | Detail |
|---|---|
| **ID** | TC-HEALTH-005 |
| **Title** | Dashboard loads within 5 seconds |
| **Priority** | P1 — Normal |
| **Type** | Smoke / Performance |
| **Tags** | `@smoke @p1 @regression` |

**Steps**
1. Record start timestamp
2. Navigate to `/QATestApp/Dashboard`
3. Wait for `DOMContentLoaded`
4. Record elapsed time

**Expected Results**
- Elapsed time < 5000 ms

---

## Module 2 — Two-Screen Flow

**Suite:** `02-two-screen-flow.spec.ts`  
**Tags:** `@smoke @p1 @regression`  
**Precondition:** None. No login required.  
**Purpose:** Prove the selector strategy survives OutSystems element reorders and republishes.

---

### TC-FLOW-001

| Field | Detail |
|---|---|
| **ID** | TC-FLOW-001 |
| **Title** | Dashboard renders the Name input and Submit button |
| **Priority** | P1 — Blocker |
| **Type** | Happy Path / Render |
| **Tags** | `@smoke @p1 @regression` |

**Steps**
1. Navigate to `/QATestApp/Dashboard`
2. Call `expectLoaded()` — waits for Submit button visibility
3. Assert Name input is visible
4. Assert Submit button is visible
5. Log Submit button text content and current URL

**Expected Results**
- Name text input is visible
- Button with text "Submit" is visible
- URL is `/QATestApp/Dashboard`

**Selector Used**
```
Name input  → page.locator('input[type="text"]').first()
Submit btn  → page.getByRole('button', { name: 'Submit' })
```

---

### TC-FLOW-002

| Field | Detail |
|---|---|
| **ID** | TC-FLOW-002 |
| **Title** | Submitting the form navigates from Dashboard to Screen1 |
| **Priority** | P1 — Blocker |
| **Type** | Happy Path / Navigation |
| **Tags** | `@smoke @p1 @regression` |

**Steps**
1. Navigate to `/QATestApp/Dashboard`
2. Wait for form to load (`expectLoaded()`)
3. Fill the Name field with `"Test User"`
4. Record current URL
5. Click Submit button
6. Wait for URL to change (SPA async navigation)
7. Record new URL

**Expected Results**
- URL changes after submit
- New URL contains `/QATestApp/Screen1`
- Screen1 `untaggedReturnLink` is visible (confirms correct page loaded)

**Selector Used**
```
Name input  → page.locator('input[type="text"]').first()
Submit btn  → page.getByRole('button', { name: 'Submit' })
```

**Notes**
- `waitForURL()` is used instead of `waitForLoadState()` because OutSystems SPA navigation updates the URL asynchronously after the network becomes idle

---

### TC-FLOW-003

| Field | Detail |
|---|---|
| **ID** | TC-FLOW-003 |
| **Title** | Screen1 has exactly 2 return links |
| **Priority** | P1 — Critical |
| **Type** | Happy Path / Content Verification |
| **Tags** | `@smoke @p1 @regression` |

**Steps**
1. Navigate directly to `/QATestApp/Screen1` by URL
2. Wait for Screen1 to load
3. Assert untagged link is visible (role + exact text)
4. Assert tagged link is visible (`data-testid`)
5. Log both links' visible text

**Expected Results**
- Untagged link is visible: `getByRole('link', { name: 'Return to dashboard', exact: true })`
- Tagged link is visible: `[data-testid="screen1-link-return-dashboard"]`
- Both links are present (total: 2)

**Selector Used**
```
Untagged link → getByRole('link', { name: 'Return to dashboard', exact: true })
Tagged link   → page.locator('[data-testid="screen1-link-return-dashboard"]')
```

**Why not a shared text regex?**
The tagged link's label can be changed in OutSystems without affecting the `data-testid` attribute. Using a shared text regex (`/return to dashboard/i`) to count both links would cause this test to fail whenever the tagged link's text is changed — even though the link is still there. Each link is found by its own stable selector.

---

### TC-FLOW-004

| Field | Detail |
|---|---|
| **ID** | TC-FLOW-004 |
| **Title** | Tagged link (`data-testid`) navigates back to Dashboard |
| **Priority** | P1 — Blocker |
| **Type** | Happy Path / Tagged Selector Demo |
| **Tags** | `@smoke @p1 @regression` |

**Steps**
1. Navigate directly to `/QATestApp/Screen1` by URL
2. Wait for Screen1 to load
3. Verify `[data-testid="screen1-link-return-dashboard"]` is visible
4. Log the link's text content
5. Click the tagged element
6. Wait for URL to contain `/QATestApp/Dashboard`

**Expected Results**
- Element with `data-testid="screen1-link-return-dashboard"` is visible on Screen1
- Clicking it navigates back to Dashboard

**Selector Used**
```
Tagged link → page.locator('[data-testid="screen1-link-return-dashboard"]')
```

**OutSystems Context**
- The `data-testid` attribute is set via OutSystems Extended Property on a `<span>` wrapper
- The `<a>` element is inside the span — clicking the span propagates the click
- `data-testid` is **not** regenerated by OutSystems on republish, making this selector stable even when the element is reordered

---

### TC-FLOW-005

| Field | Detail |
|---|---|
| **ID** | TC-FLOW-005 |
| **Title** | Untagged link (role-based exact text) navigates back to Dashboard |
| **Priority** | P1 — Blocker |
| **Type** | Happy Path / Permanent O11 Selector Strategy |
| **Tags** | `@smoke @p1 @regression` |

**Steps**
1. Navigate directly to `/QATestApp/Screen1` by URL
2. Wait for Screen1 to load
3. Verify "Return to dashboard" link (exact match) is visible
4. Click the untagged return link
5. Wait for URL to contain `/QATestApp/Dashboard`

**Expected Results**
- Link with exact text "Return to dashboard" (distinct from "Return to dashboard (tagged)") is visible
- Clicking navigates back to Dashboard

**Selector Used**
```
Untagged link → getByRole('link', { name: 'Return to dashboard', exact: true })
```

**Why `exact: true`**
- Without `exact: true`, the selector would also match "Return to dashboard (tagged)"
- `exact: true` binds to the precise visible text — still survives element reorders because it does not use DOM position or IDs

**OutSystems Context**
- This is the **permanent selector strategy for O11** apps where developers have not applied `data-testid`
- Binds to what the user reads — not to auto-generated IDs that shift on republish

---

### TC-FLOW-006

| Field | Detail |
|---|---|
| **ID** | TC-FLOW-006 |
| **Title** | Submit button is found by role — not by generated DOM ID |
| **Priority** | P1 — Blocker |
| **Type** | Selector Resilience Proof / Documentation |
| **Tags** | `@smoke @p1 @regression` |

**Steps**
1. Navigate to `/QATestApp/Dashboard`
2. Locate Submit button using `getByRole('button', { name: 'Submit' })`
3. Assert it is visible
4. Evaluate the button's DOM properties (`tag`, `visibleText`, `generatedId`, `role`)
5. Attach DOM info to Allure report
6. Assert visible text equals `"Submit"`

**Expected Results**
- Button is visible and found by role
- `visibleText` equals `"Submit"`
- The DOM `id` attribute is logged (e.g. `b2-Button1`) but is **not used in the selector**

**Allure Attachment:** `Submit button DOM Info` (JSON)

**Purpose**  
This test serves as documented proof for the client that the automation does not depend on OutSystems-generated IDs. Gregg can move the Submit button anywhere on the Dashboard screen, republish, and this test will still pass because the selector binds to the button's semantic role and visible label — not its position or ID.

---

### TC-FLOW-007

| Field | Detail |
|---|---|
| **ID** | TC-FLOW-007 |
| **Title** | Full round-trip (Dashboard → Screen1 → Dashboard) has zero JS errors |
| **Priority** | P1 — Critical |
| **Type** | End-to-End / Error Monitoring |
| **Tags** | `@smoke @p1 @regression` |

**Steps**
1. Attach `pageerror` listener to capture all JS errors
2. Navigate to `/QATestApp/Dashboard`
3. Fill Name with `"Round Trip Test"` and Click Submit
4. Wait for Screen1 to load
5. Click the tagged return link
6. Confirm URL is back on Dashboard
7. Filter JS errors (exclude known non-critical noise)
8. Assert zero critical errors

**Expected Results**
- Navigation completes: Dashboard → Screen1 → Dashboard
- Zero critical JavaScript errors across the full flow

**Error Filter** (excluded as known noise)
- `ResizeObserver loop limit exceeded`
- `Non-Error promise rejection`
- `ChunkLoadError`

---

## Module 3 — Performance Baseline

**Suite:** `07-performance-accessibility.spec.ts`  
**Tags:** `@performance @p2 @regression`  
**Precondition:** None. Performance measured against a 5-second budget for the OutSystems cloud environment.

---

### TC-PERF-001

| Field | Detail |
|---|---|
| **ID** | TC-PERF-001 |
| **Title** | App root loads within 5 seconds |
| **Priority** | P2 — Normal |
| **Type** | Performance / Load Time |
| **Tags** | `@performance @p2 @regression` |

**Steps**
1. Record start time
2. Navigate to root `/`
3. Wait for `DOMContentLoaded`
4. Calculate elapsed time

**Expected Results**
- Elapsed time < 5000 ms

---

### TC-PERF-002

| Field | Detail |
|---|---|
| **ID** | TC-PERF-002 |
| **Title** | Screen1 loads within 5 seconds |
| **Priority** | P2 — Normal |
| **Type** | Performance / Load Time |
| **Tags** | `@performance @p2 @regression` |

**Steps**
1. Record start time
2. Navigate to `/QATestApp/Screen1`
3. Wait for `DOMContentLoaded`
4. Calculate elapsed time

**Expected Results**
- Elapsed time < 5000 ms

---

## Module 4 — Accessibility Baseline

**Suite:** `07-performance-accessibility.spec.ts`  
**Tags:** `@a11y @p2 @regression`  
**Precondition:** None.  
**Note:** Accessibility tests are currently **informational** — they log violations but do not hard-fail. Zero-tolerance enforcement can be added once the development team has addressed the flagged issues.

---

### TC-A11Y-001

| Field | Detail |
|---|---|
| **ID** | TC-A11Y-001 |
| **Title** | Buttons have accessible names |
| **Priority** | P2 — Normal |
| **Type** | Accessibility / WCAG 2.1 — Criterion 4.1.2 |
| **Tags** | `@a11y @p2 @regression` |

**Steps**
1. Navigate to `/QATestApp/Screen1`
2. Query all `button` and `[role="button"]` elements
3. Filter for elements with no `textContent`, no `aria-label`, and no `aria-labelledby`
4. Log violations to Allure attachment

**Expected Results**
- Count of unlabelled buttons is logged
- Any violations are attached for developer review

---

### TC-A11Y-002

| Field | Detail |
|---|---|
| **ID** | TC-A11Y-002 |
| **Title** | Links have accessible names |
| **Priority** | P2 — Normal |
| **Type** | Accessibility / WCAG 2.1 — Criterion 2.4.4 |
| **Tags** | `@a11y @p2 @regression` |

**Steps**
1. Navigate to `/QATestApp/Screen1`
2. Query all `<a>` elements
3. Filter for elements with no `textContent` and no `aria-label`
4. Log violations

**Expected Results**
- Count of unlabelled links is logged
- Any violations attached for review

---

### TC-A11Y-003

| Field | Detail |
|---|---|
| **ID** | TC-A11Y-003 |
| **Title** | Images have alt text |
| **Priority** | P2 — Minor |
| **Type** | Accessibility / WCAG 2.1 — Criterion 1.1.1 |
| **Tags** | `@a11y @p2 @regression` |

**Steps**
1. Navigate to `/QATestApp/Screen1`
2. Query all `<img>` elements
3. Filter for images missing the `alt` attribute
4. Log image sources

**Expected Results**
- Count of images without `alt` is logged
- Any violations attached for review

---

### TC-A11Y-004

| Field | Detail |
|---|---|
| **ID** | TC-A11Y-004 |
| **Title** | Tab key reaches the first interactive element |
| **Priority** | P2 — Normal |
| **Type** | Accessibility / Keyboard Navigation / WCAG 2.1 — Criterion 2.1.1 |
| **Tags** | `@a11y @p2 @regression` |

**Steps**
1. Navigate to the app root `/`
2. Wait for `networkidle`
3. Press the `Tab` key once
4. Read `document.activeElement.tagName`

**Expected Results**
- Focused element tag is **not** `body`
- Keyboard focus has moved to a real interactive element (link, button, or input)

---

### TC-A11Y-005

| Field | Detail |
|---|---|
| **ID** | TC-A11Y-005 |
| **Title** | Form inputs on Screen1 have associated labels |
| **Priority** | P2 — Normal |
| **Type** | Accessibility / WCAG 2.1 — Criterion 1.3.1 |
| **Tags** | `@a11y @p2 @regression` |

**Steps**
1. Navigate to `/QATestApp/Screen1`
2. Query all `input`, `select`, `textarea` elements (excluding hidden)
3. For each: check for a `<label for="...">` association, `aria-label`, or `aria-labelledby`
4. Log any inputs with no accessible label

**Expected Results**
- Count of unlabelled inputs is logged
- Any violations attached for developer review

---

## Module 5 — Visual regression (VRT)

**Suite:** `tests/visual/qatestapp-vrt.spec.ts`  
**Tags:** `@vrt @visual`  
**Playwright project:** `vrt-chromium` (fixed 1280×720 viewport; snapshots are **not** run on the full Firefox/WebKit/mobile matrix)

### Scope and stakeholder notes

| URL captured | Purpose |
|---|---|
| `/QATestApp/` | App entry (full-page screenshot). **Not** OutSystems Service Center — VRT never targets `/ServiceCenter` or builder URLs. |
| `/QATestApp/Screen1` | Results screen (full-page screenshot). |

**Gregg’s requirement (diff / “shadow” of what moved):** When a screenshot assertion fails, the Playwright **HTML report** (`npx playwright show-report`) shows **Expected**, **Actual**, and **Diff** side by side. The Diff image highlights changed pixels (CSS/layout shifts, moved controls, etc.) — comparable to visual tools that overlay a change mask. Video recordings are **not** a substitute for this pixel comparison.

**Baselines:** PNG snapshots live under `tests/visual/qatestapp-vrt.spec.ts-snapshots/` (platform-specific names, e.g. `*-vrt-chromium-win32.png`). Commit updated images when the UI change is intentional.

**Refresh baselines after an intentional UI change**

```powershell
npx playwright test --project=vrt-chromium --update-snapshots
```

---

### VRT-001

| Field | Detail |
|---|---|
| **ID** | VRT-001 |
| **Title** | App entry (`/QATestApp/`) matches approved baseline |
| **Tags** | `@vrt @visual` |

**Steps**

1. Navigate to `/QATestApp/`
2. Capture full-page screenshot and compare to committed baseline

**Expected Results**

- Screenshot matches baseline within configured tolerance (`maxDiffPixels` / `threshold` in `playwright.config.ts`).

---

### VRT-002

| Field | Detail |
|---|---|
| **ID** | VRT-002 |
| **Title** | Screen1 (`/QATestApp/Screen1`) matches approved baseline |
| **Tags** | `@vrt @visual` |

**Steps**

1. Navigate to `/QATestApp/Screen1`
2. Capture full-page screenshot and compare to committed baseline

**Expected Results**

- Screenshot matches baseline within configured tolerance.

---

## Test Execution Summary

### Run command reference

| Command | What runs |
|---|---|
| `npx playwright test --grep "@smoke" --project=chromium` | All 12 smoke/P1 tests, Chromium only |
| `npx playwright test --grep "@p1"` | All P1 tests, all browsers |
| `npx playwright test --grep "@p2"` | Performance + accessibility tests |
| `npx playwright test --grep "@regression"` | All `@regression`-tagged functional tests; VRT uses `@vrt` — run `npm run test:visual` for snapshots |
| `npm run test:visual` | Visual regression only (`vrt-chromium` project) |
| `npx playwright test --headed --grep "@smoke" --project=chromium` | Smoke tests with browser visible |

### View results

```powershell
npm run logs                        # history table
npm run logs -- --run <timestamp>   # per-test detail
npx playwright show-report          # HTML report
npm run allure:serve                # Allure dashboard
```

---

## Appendix — OutSystems O11 Selector Reference

### Why not use IDs?

```html
<!-- Before republish -->
<button id="b4-Button1">Submit</button>

<!-- After republish — ID changed, your test breaks -->
<button id="b7-Button1">Submit</button>
```

### What we use instead

```typescript
// ✅ Stable — binds to visible text + ARIA role
page.getByRole('button', { name: 'Submit' })

// ✅ Stable — binds to exact link label
page.getByRole('link', { name: 'Return to dashboard', exact: true })

// ✅ Stable — where dev has applied OutSystems Extended Property
page.locator('[data-testid="screen1-link-return-dashboard"]')

// ❌ Breaks on republish
page.locator('#b4-Button1')
page.locator('.wt12_wtMainContent input')
```

### How to add `data-testid` in OutSystems O11

1. Select the widget in **Service Studio**
2. Open **Properties panel** → **Extended Properties**
3. Add: `Name = data-testid` / `Value = your-element-name`
4. Publish

### Elements that should be tagged in future ODC projects

| Category | Elements |
|---|---|
| User Actions | Buttons, inputs, dropdowns, checkboxes |
| Status Indicators | Success messages, error messages, status labels |
| Dynamic Content | Table rows/cells, card action buttons, modals |
| Navigation | Sidebar items, tabs |
| **Skip** | Static text, layout divs, decorative icons |
