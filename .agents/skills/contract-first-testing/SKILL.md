---
name: contract-first-testing
version: 1.0.0
description: >
  Define the exact contract (specific value, specific location) before writing
  any test. Tests must assert what IS expected at a precise location — not the
  absence of something across a broad surface area.
domains:
  - testing     # primary domain — applies to all test types
  - frontend    # CSS token E2E, visual regression, component behavior tests
  - backend     # API contract tests, service unit tests, DB integration tests
triggers:
  - "write test"
  - "add test"
  - "add test case"
  - "verify that"
  - "assert that"
  - "check that X works"
  - "test the token"
  - "add E2E"
  - "add spec"
  - "write E2E"
  - "add playwright"
when_to_skip:
  - Exploratory smoke tests where exact values are not yet known
  - Snapshot tests — they define their own contract on first run
  - Load/performance tests — different concern
---

# Skill: contract-first-testing

## Problem

A test that scans "all CSS rules for banned string X" will:
- Pass when X is truly absent
- **False-positive** when X appears in an unrelated utility class
- Give zero signal about whether the CORRECT value is actually present

The real contract is never "no bad value exists anywhere."
It is always: **"Token `--glass-tint` at `:root` equals `rgba(12,160,235,0.02)`."**

**Real example (M-DESIGN-03):**
TC-DS-005-14 scanned all stylesheet rules for `rgba(20,184,166`.
It found a match in `bg-teal-500/20` — a valid Tailwind utility on the Landing Page.
Test failed. Root cause investigation took two iterations.
Fix: test `getComputedStyle(root).getPropertyValue('--glass-tint')` directly.
One line. Unambiguous. No false positives.

---

## The Contract-First Rule

> Before writing any `expect()`, answer all three:
> 1. **What** is the exact expected value?
> 2. **Where exactly** does that value live?
> 3. **How** do I read that specific location in the running system?

If you cannot answer all three, you are not ready to write the test.

---

## When to Use

Invoke this skill before writing any test — E2E, unit, or integration.
Applies equally to new tests and to fixing a failing or flaky test.

---

## Workflow

### Step 1 — Write the contract in plain language

One sentence: **"When [condition], [exact location] must equal [exact value]."**

Good examples:
- "In light mode, `--primary` CSS token must contain hue `207`"
- "POST `/api/v1/subscriptions` with valid payload returns `201` + body `{ status: 'PENDING' }`"
- "Primary button `background-color` computed style is `rgb(12, 160, 235)`"
- "`NumberStepper` at `min=0`: clicking decrement does not change the value"
- "Template badge with `tier='luxury'` renders with `bg-amber-*` class"

Bad examples (too broad):
- "No teal color exists in the CSS" — scans everything, false-positive risk
- "The button looks correct" — not testable
- "The API works" — not specific

---

### Step 2 — Identify the exact read path

#### [FRONTEND — CSS Token]
```typescript
// Always use getCSSToken — reads from :root computed style
import { getCSSToken } from '../skills/contract-first-testing/scripts/token-test-helpers';

const value = await getCSSToken(page, '--primary');
// NEVER: scan all document.styleSheets rules
```

#### [FRONTEND — DOM Computed Style]
```typescript
import { getComputedStyleProp } from '../skills/contract-first-testing/scripts/token-test-helpers';

const bg = await getComputedStyleProp(page, '[data-testid="primary-btn"]', 'background-color');
// NEVER: check element.className string — class may be overridden by cascade
```

#### [FRONTEND — Component Behavior]
```typescript
// Test what the user sees and can do — not internal React state
await page.click('[data-testid="stepper-decrement"]');
const val = await page.inputValue('[data-testid="stepper-input"]');
expect(val).toBe('2');
// NEVER: inspect React state or props directly
```

#### [BACKEND — API Contract]
```typescript
import * as request from 'supertest';

const res = await request(app.getHttpServer())
  .post('/api/v1/subscriptions')
  .set('Authorization', `Bearer ${token}`)
  .send(validPayload)
  .expect(201);

expect(res.body.status).toBe('PENDING');
expect(res.body.billingPeriod).toBe('monthly');
// NEVER: query the DB directly in the assertion
// DB verification is a separate confirm step, not the contract
```

#### [BACKEND — Service Unit Test]
```typescript
// Mock at the dependency boundary, not inside the service under test
mockPrismaService.subscription.create.mockResolvedValue(mockSubscription);

const result = await service.createSubscription(dto);

expect(result.status).toBe('PENDING');
expect(mockPrismaService.subscription.create).toHaveBeenCalledWith(
  expect.objectContaining({ billingPeriod: 'monthly' })
);
// NEVER: mock the service being tested
```

---

### Step 3 — Write the assertion before the setup

Write the `expect()` line first. Then fill in the read path.
This forces precision about what you are testing.

```typescript
// Write this first — the contract:
expect(tokenValue).toContain('207');

// Then fill in the read:
const tokenValue = await getCSSToken(page, '--primary');

// Full test:
test('TC-DS-007-01 [P0] --color-domain-residential resolves to expected hue in light mode', async ({ page }) => {
  await setTheme(page, 'light');
  const value = await getCSSToken(page, '--color-domain-residential');
  expect(value, `residential token should resolve, got: "${value}"`).toBeTruthy();
  expect(value, `should not be empty`).not.toBe('');
});
```

---

### Step 4 — Check for false-positive risk

Ask: *"Could this test pass even if the feature is broken?"*

| Risk | Fix |
|------|-----|
| Checking `className` string instead of computed style | Use `getComputedStyle` |
| Asserting "no bad value" rather than "correct value present" | Flip to asserting the correct value |
| Mocking the thing being tested | Mock only external dependencies |
| `expect(res.body).toBeDefined()` passes for any response | Assert specific fields |
| CSS value format varies by browser | Normalize: use `rgb()` not `#hex`; strip whitespace |

---

### Step 5 — Name the test with the contract embedded

```typescript
// Bad — describes action, not contract
test('primary token loads')

// Good — contract is readable from test name alone
test('TC-DS-005-01 [P0] light mode --primary resolves to hue 207 (blue, not teal)')
test('TC-DS-007-03 [P0] residential badge renders with domain-residential token')
test('POST /subscriptions returns 201 with status=PENDING on valid SOLO monthly payload')
```

Test ID format: `TC-{STORY-SHORT}-{NUMBER} [P{0|1|2}] {contract sentence}`

---

### Step 6 — Place the test in the correct suite

| Test type | Location | Run command |
|-----------|----------|-------------|
| CSS token / E2E (frontend) | `e2e/<milestone>.spec.ts` | `npx playwright test e2e/<file>` |
| Component behavior (frontend) | `client/src/**/*.test.tsx` | `npx vitest` (if configured) |
| Service unit (backend) | `api/tests/<module>/<service>.spec.ts` | `npm run test:unit` |
| Integration (backend + DB) | `api/tests/<module>/<service>.integration.spec.ts` | `npm run test:integration` |

---

## Anti-Patterns Reference

| Anti-pattern | Why it fails | Correct approach |
|---|---|---|
| Scan all CSS rules for banned string | Matches unrelated utilities (Tailwind) | `getComputedStyle` the specific token |
| `expect(html).toContain('blue')` | Matches comments, classnames, data attributes | `expect(computedBg).toBe('rgb(12,160,235)')` |
| Check `className` for style | Class may be overridden by cascade | Check computed style |
| Mock the service under test | Test proves nothing | Mock only its dependencies |
| `expect(res.body).toBeDefined()` | Passes for any response including `{}` | Assert specific fields |
| Test "no error thrown" only | Misses wrong return values | Assert the actual returned value |

---

## Applies to Future Stories

| Story | Tests to write | Contract to define |
|-------|---------------|-------------------|
| US-DESIGN-007 | E2E token tests for domain colors | `--color-domain-*` tokens resolve correctly in light + dark |
| US-DESIGN-008 | Component tests for badge variants | Badge renders correct bg/text for each tier value |
| US-DESIGN-009 | E2E for TemplatesPage polish | Computed styles on card, header, search in both themes |
| US-DESIGN-010 | E2E for editor toolbar tokens | Toolbar button states — default, hover, active — correct tokens |
| US-DESIGN-011 | E2E for AI Chat panel | Chat bubble colors, input border, send button state |

---

## Scripts / Helpers

- [`scripts/token-test-helpers.ts`](scripts/token-test-helpers.ts) — Playwright helpers: `getCSSToken`, `getComputedStyleProp`, `setTheme`, `assertToken`, `assertElementVisible`
- [`scripts/e2e-test-template.ts`](scripts/e2e-test-template.ts) — Ready-to-copy E2E test file template with correct structure

---

*Skill created: 2026-04-22*
