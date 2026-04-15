# InfographicAI Test Playbook

> **Stack**: NestJS 11 · Prisma 6 · React 18 · RazorPay · OpenAI/Ideogram
> **Test state at writing**: Zero automated tests. Manual checklist only.
> **Last updated**: 2026-02-27

---

## 0. Current State Audit

### What Exists
| Artifact | Location | Type |
|----------|----------|------|
| Payment smoke tests | `scripts/run-payment-automated-tests.js` | API-level, manual trigger |
| Env verification | `scripts/verify-payment-prerequisites.js` | Pre-test guard |
| Manual checklist | `docs/PAYMENT_TEST_CHECKLIST.md` | Manual |
| Mock conversation data | `client/src/` (testConversationsData.ts) | Frontend fixture |
| Template seed data | `api/src/modules/templates/data/templates.data.ts` | Backend fixture |

### What's Missing
- No `vitest.config.ts` / `jest.config.ts`
- No unit tests for any service
- No integration tests
- No Playwright / Cypress E2E setup
- No CI pipeline (`/.github/workflows/` does not exist)

---

## 1. Test Pyramid Overview

```
                    ┌─────────────┐
                    │  Tier 4     │  Synthetic Monitoring (Checkly)
                    │  ~5 checks  │  Production health, critical path
                    └──────┬──────┘
               ┌───────────┴──────────┐
               │       Tier 3         │  E2E Tests (Playwright)
               │   ~30–50 tests       │  Critical user journeys
               └──────────┬───────────┘
          ┌────────────────┴─────────────────┐
          │            Tier 2                │  Integration Tests (Vitest + real Prisma)
          │         ~40–60 tests             │  Service ↔ DB ↔ provider interactions
          └────────────────┬─────────────────┘
     ┌──────────────────────┴──────────────────────┐
     │                  Tier 1                      │  Unit Tests (Vitest)
     │              ~80–120 tests                   │  Services, utilities, components
     └──────────────────────────────────────────────┘
```

---

## 2. Tooling Setup

### Install

```bash
# Backend testing
npm install -D vitest @vitest/ui prismock

# Frontend testing
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event msw jsdom

# E2E
npx playwright install --with-deps

# (optional) if not already in devDeps
npm install -D @types/bcrypt
```

### `vitest.config.ts` (root)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',  // override to 'jsdom' for frontend tests
    include: ['**/*.spec.ts', '**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'e2e'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules', 'test', '**/*.dto.ts', '**/*.module.ts'],
    },
  },
});
```

### `test/setup.ts` (global test setup)

```typescript
import { beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Use a separate test database
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://test:test@localhost:5432/infographic_test';

export const testPrisma = new PrismaClient();

beforeAll(async () => {
  await testPrisma.$connect();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});
```

### MSW Handler Setup (frontend)

```typescript
// test/msw-handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/payments/provider-info', () =>
    HttpResponse.json({ provider: 'RAZORPAY', keyId: 'rzp_test_xxx' })
  ),
  http.get('/api/v1/auth/me', () =>
    HttpResponse.json({ id: '1', email: 'test@example.com', name: 'Test User' })
  ),
];
```

---

## 3. Tier 1 — Unit Tests (Vitest)

### 3.1 `auth.service.ts`
**File**: `api/src/modules/auth/services/auth.service.ts`
**Test file**: `api/src/modules/auth/services/auth.service.spec.ts`

```typescript
describe('AuthService', () => {
  describe('register()', () => {
    it('should hash password before storing');
    it('should reject duplicate email with ConflictException');
    it('should create a new Organization with FREE plan on first registration');
    it('should return accessToken and user object');
    it('should enforce user limit per plan tier');
  });

  describe('login()', () => {
    it('should return JWT on valid credentials');
    it('should throw UnauthorizedException on wrong password');
    it('should throw UnauthorizedException on unknown email');
    it('should JWT payload include sub, email, organizationId, role');
  });

  describe('googleLogin()', () => {
    it('should create user+org on first Google login');
    it('should merge Google account with existing email');
    it('should return same JWT shape as local login');
  });
});
```

### 3.2 `payments.service.ts`
**File**: `api/src/modules/payments/services/payments.service.ts`
**Test file**: `api/src/modules/payments/services/payments.service.spec.ts`

```typescript
describe('PaymentsService', () => {
  describe('getAvailablePlans()', () => {
    it('should return all 7 plan tiers');
    it('should include correct monthly and annual pricing');
    it('should mark FREE plan as current for free-tier users');
  });

  describe('createSubscription()', () => {
    it('should create Subscription record with status PENDING initially');  // PT-04
    it('should call RazorPay API with correct plan ID from env');
    it('should cancel existing active subscription before creating new one');  // PT-03
    it('should reject unknown planTier with BadRequestException');
  });

  describe('verifyPayment()', () => {
    it('should validate HMAC signature correctly');
    it('should reject tampered signature with UnauthorizedException');
    it('should update Payment record to CAPTURED on valid signature');
  });

  describe('cancelSubscription()', () => {
    it('should set cancelAtPeriodEnd=true for graceful cancellation');
    it('should immediately cancel when cancelImmediately=true');
    it('should update Subscription status to CANCELLED');
    it('should downgrade Org planTier to FREE on cancellation');
  });

  describe('handleWebhook - subscription.activated', () => {
    it('should set Subscription.status = ACTIVE');
    it('should update Organization.planTier to subscribed tier');
    it('should update Organization.monthlyLimit');
  });

  describe('handleWebhook - subscription.cancelled', () => {
    it('should set Subscription.status = CANCELLED');
    it('should downgrade Organization.planTier to FREE');
  });
});
```

### 3.3 `usage-analytics.service.ts`
**File**: `api/src/modules/payments/services/usage-analytics.service.ts`
**Test file**: `api/src/modules/payments/services/usage-analytics.service.spec.ts`

```typescript
describe('UsageAnalyticsService', () => {
  it('getMonthlyUsage() returns 6 months of data');
  it('getMonthlyUsage() includes current month with correct count');
  it('getCurrentMonthUsage() returns 0 for new user');
  it('getCostBreakdown() groups by aiModel correctly');
  it('getUsageHistory() filters by date range');
  it('exportUsageDataCsv() returns valid CSV string');
});
```

### 3.4 `generations.service.ts` / `infographics.service.ts`
**File**: `api/src/modules/infographics/services/infographics.service.ts`

```typescript
describe('InfographicsService', () => {
  describe('generate()', () => {
    it('should reject request when monthly limit is reached (429)');
    it('should create Infographic record with status=processing immediately');
    it('should create UsageRecord linked to Infographic');
    it('should respect per-plan monthly limits (FREE=3, SOLO=50, TEAM=200)');
    it('should create default org if user has no organization');
    it('should return infographic record without waiting for AI completion');
  });
});
```

### 3.5 `designs.service.ts`
**File**: `api/src/modules/designs/services/designs.service.ts`

```typescript
describe('DesignsService', () => {
  it('should save canvas JSON blob with user ownership');
  it('should load design by id only for owning user');
  it('should throw NotFoundException for unknown designId');
  it('should list only current user designs');
});
```

### 3.6 Frontend: `SubscriptionCard.tsx`
**File**: `client/src/components/payment/SubscriptionCard.tsx`
**Environment**: jsdom + @testing-library/react + MSW

```typescript
describe('SubscriptionCard', () => {
  it('renders plan name, price, and feature list');
  it('renders loading skeleton when isLoading=true');
  it('renders error state when subscription fetch fails');
  it('shows "Current Plan" badge for active plan');
  it('shows correct status badge for CANCELLED subscription');
  it('hides upgrade CTA for highest plan tier');
});
```

### 3.7 Frontend: `UsageScreen.tsx`
**File**: `client/src/components/account/UsageScreen.tsx`

```typescript
describe('UsageScreen', () => {
  it('renders usage bar with correct percentage fill');
  it('renders 0/limit correctly for new users');
  it('renders warning color when usage > 80% of limit');
  it('renders limit as "unlimited" for API_ENTERPRISE plan');
});
```

---

## 4. Tier 2 — Integration Tests (Vitest + Prisma)

Use a dedicated test PostgreSQL database. Reset between test suites.

### Database Setup Pattern

```typescript
// test/integration-setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

export async function cleanDatabase() {
  // Delete in dependency order
  await prisma.usageRecord.deleteMany();
  await prisma.infographic.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

export { prisma };
```

### 4.1 Auth + Organization Flow

```typescript
describe('User Registration → Organization', () => {
  beforeEach(() => cleanDatabase());

  it('register creates User + Organization with FREE plan', async () => {
    const result = await authService.register({
      email: 'test@example.com',
      password: 'Test1234!',
      name: 'Test User',
    });
    expect(result.user.organizationId).toBeDefined();
    const org = await prisma.organization.findUnique({...});
    expect(org.planTier).toBe('FREE');
    expect(org.monthlyLimit).toBe(3);
  });

  it('login returns valid JWT that passes protected route', async () => {
    // register → login → call GET /api/v1/auth/me with token
  });

  it('duplicate email throws 409 ConflictException');
});
```

### 4.2 Subscription Flow

```typescript
describe('Subscription Lifecycle', () => {
  it('createSubscription → PENDING status before webhook', async () => {
    const sub = await paymentsService.createSubscription(userId, { planTier: 'SOLO', billingPeriod: 'MONTHLY' });
    expect(sub.status).toBe('PENDING');  // validates PT-04 fix
    expect(org.planTier).toBe('FREE');   // org not upgraded yet
  });

  it('webhook subscription.activated → ACTIVE + org upgraded', async () => {
    // fire webhook payload
    await paymentsService.handleWebhookEvent(activatedPayload);
    const sub = await prisma.subscription.findUnique({...});
    expect(sub.status).toBe('ACTIVE');
    const org = await prisma.organization.findUnique({...});
    expect(org.planTier).toBe('SOLO');
    expect(org.monthlyLimit).toBe(50);
  });

  it('plan upgrade cancels previous subscription (PT-03 fix)', async () => {
    // create SOLO → webhook activate → upgrade to TEAM
    // verify old sub is CANCELLED, new sub is PENDING
  });

  it('webhook subscription.cancelled → CANCELLED + org downgraded to FREE');
});
```

### 4.3 Usage Limits

```typescript
describe('Usage Limits', () => {
  it('generation succeeds when under monthly limit');
  it('generation returns 429 when at monthly limit');
  it('UsageRecord is created and linked to Infographic');
  it('getCurrentMonthUsage() increments after generation');
  it('FREE plan limit = 3, SOLO = 50, TEAM = 200');
});
```

### 4.4 Infographic + UsageRecord

```typescript
describe('Infographic Creation', () => {
  it('creates Infographic with status=processing immediately');
  it('creates linked UsageRecord on generation trigger');
  it('updates Infographic status to completed/failed after async processing');
});
```

### 4.5 Webhook Signature Validation

```typescript
describe('Webhook Security', () => {
  it('rejects webhook with invalid HMAC signature (401)');
  it('accepts webhook with valid HMAC signature');
  it('is idempotent: duplicate webhook does not double-credit');
});
```

---

## 5. Tier 3 — E2E Tests (Playwright)

### Playwright Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,  // sequential to avoid DB conflicts
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test User Fixture

```typescript
// e2e/fixtures.ts
import { test as base } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const test = base.extend({
  testUser: async ({}, use) => {
    const user = await prisma.user.create({
      data: {
        email: `e2e-${Date.now()}@test.com`,
        password: 'hashedpassword',
        name: 'E2E User',
        organization: { create: { name: 'E2E Org', planTier: 'SOLO' } },
      },
    });
    await use(user);
    // cleanup
    await prisma.user.delete({ where: { id: user.id } });
  },
});
```

### `data-testid` Attribute Recommendations

Add these to key elements for stable selectors:

| Component | `data-testid` |
|-----------|---------------|
| Login email input | `auth-email-input` |
| Login password input | `auth-password-input` |
| Login submit button | `auth-submit-btn` |
| Register link | `auth-register-link` |
| Plan CTA button (SOLO) | `plan-cta-solo` |
| Plan CTA button (TEAM) | `plan-cta-team` |
| RazorPay modal frame | `razorpay-container` |
| Template card | `template-card-{id}` |
| Template filter | `template-filter-{category}` |
| Editor canvas | `editor-canvas` |
| Save design button | `editor-save-btn` |
| Export PNG button | `editor-export-png` |
| AI chat input | `ai-chat-input` |
| AI chat send button | `ai-chat-send-btn` |
| Usage progress bar | `usage-progress-{month}` |
| Billing plan badge | `billing-current-plan` |
| User menu trigger | `user-menu-trigger` |
| Logout button | `user-menu-logout` |

### E2E Test Files

#### `e2e/auth.e2e.ts`
```typescript
test('Register new user', async ({ page }) => {
  await page.goto('/auth');
  await page.click('[data-testid="auth-register-link"]');
  await page.fill('[data-testid="auth-email-input"]', 'new@example.com');
  await page.fill('[data-testid="auth-password-input"]', 'Test1234!');
  await page.click('[data-testid="auth-submit-btn"]');
  await expect(page).toHaveURL('/templates');
});

test('Login with valid credentials');
test('Logout clears session and redirects to /auth');
test('Login with invalid credentials shows error message');
test('Protected routes redirect unauthenticated users to /auth');
```

#### `e2e/pricing.e2e.ts`
```typescript
test('View pricing page without login', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.locator('h1')).toContainText('pricing');
});

test('Click SOLO plan CTA → RazorPay modal opens', async ({ page }) => {
  // login first, then go to pricing
  await page.click('[data-testid="plan-cta-solo"]');
  // RazorPay opens in iframe or popup
  await expect(page.locator('.razorpay-container')).toBeVisible({ timeout: 10000 });
});

test('SOLO plan shows correct amount ₹1,999');  // monthly
test('TEAM plan shows correct amount ₹6,999');  // validates PT-05
test('Annual billing shows 15% discount applied');
```

#### `e2e/templates.e2e.ts`
```typescript
test('Browse templates page shows template grid');
test('Filter by category: listing shows only listing templates');
test('Filter by property type: residential filters correctly');
test('Click template opens editor with template loaded');
test('Search/filter combination works');
```

#### `e2e/editor.e2e.ts`
```typescript
test('Add text element to canvas');
test('Resize element using handles');
test('Change text color');
test('Save design persists across page reload');
test('Export PNG triggers file download');
test('Undo/redo works for element changes');
```

#### `e2e/ai-chat.e2e.ts`
```typescript
test('Start new AI conversation');
test('Enter property data and submit');
test('Generation progress indicator appears');
test('Completed infographic appears in results');
test('Start from existing conversation');
```

#### `e2e/account.e2e.ts`
```typescript
test('Account page shows billing tab by default');
test('Billing screen shows current plan name and status');
test('Usage screen shows correct generation count and limit');
test('Security screen shows password change form');
test('Navigate between account tabs');
```

#### `e2e/subscription.e2e.ts`
```typescript
test('Upgrade plan in test mode completes flow');
test('Payment history shows after successful payment');
test('Cancel subscription changes status to pending-cancellation');
test('Billing screen reflects new plan after upgrade');
```

---

## 6. Tier 4 — Synthetic Monitoring (Checkly)

### Health Checks (API level)

```javascript
// checkly/api-health.check.js
import { ApiCheck, AssertionBuilder } from '@checkly/cli/constructs';

new ApiCheck('api-health', {
  name: 'API Health',
  request: {
    url: `${process.env.PROD_URL}/api/v1/health`,
    method: 'GET',
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.responseTime().lessThan(2000),
    ],
  },
  runParallel: true,
});

new ApiCheck('payment-provider', {
  name: 'Payment Provider Info',
  request: {
    url: `${process.env.PROD_URL}/api/v1/payments/provider-info`,
    method: 'GET',
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody('$.provider').equals('RAZORPAY'),
    ],
  },
});

new ApiCheck('templates-list', {
  name: 'Templates Available',
  request: {
    url: `${process.env.PROD_URL}/api/v1/templates`,
    method: 'GET',
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody('$.length').greaterThan(0),
    ],
  },
});
```

### Browser Check (Critical Path)

```javascript
// checkly/login-flow.check.js
import { BrowserCheck } from '@checkly/cli/constructs';

new BrowserCheck('login-flow', {
  name: 'Login Critical Path',
  code: {
    entrypoint: './login-flow.spec.ts',
  },
  frequency: 10,  // every 10 minutes
});

// login-flow.spec.ts
test('login and reach templates page', async ({ page }) => {
  await page.goto(process.env.PROD_URL);
  await page.fill('[data-testid="auth-email-input"]', process.env.MONITOR_EMAIL);
  await page.fill('[data-testid="auth-password-input"]', process.env.MONITOR_PASSWORD);
  await page.click('[data-testid="auth-submit-btn"]');
  await expect(page).toHaveURL(/\/templates/);
});
```

---

## 7. Enhanced Manual Checklists

### 7.1 Payment Flow Checklist (enhanced from `docs/PAYMENT_TEST_CHECKLIST.md`)

**Pre-conditions:**
- [ ] Run `node scripts/verify-payment-prerequisites.js` → all green
- [ ] App running: `npm run dev` (ports 5000 + 3001)
- [ ] Tunnel active (ngrok/zrok) for webhook testing

**SOLO Monthly Plan:**
- [ ] Click SOLO CTA on /pricing
- [ ] RazorPay modal opens (not a redirect)
- [ ] Amount shows ₹1,999 (not ₹1)
- [ ] Use test card: 5267 3181 8797 5449, any future date, any CVV
- [ ] Payment success toast appears
- [ ] Account > Billing shows "SOLO" plan
- [ ] Account > Usage shows 0/50 limit

**PT-04 Verification (subscription status before payment):**
- [ ] Create subscription, note `subscriptionId`
- [ ] Before completing payment, query DB: `status` should be `PENDING`
- [ ] Complete payment → webhook fires → `status` becomes `ACTIVE`
- [ ] Org `planTier` only updates after webhook (not before)

**PT-03 Verification (old subscription cancellation):**
- [ ] With active SOLO subscription, upgrade to TEAM
- [ ] Query DB: old SOLO subscription should have `status = CANCELLED`
- [ ] Only one ACTIVE subscription per user/org at a time

**PT-05 Verification (TEAM plan amount):**
- [ ] Click TEAM CTA
- [ ] RazorPay modal header shows ₹6,999 (not ₹1)

**Webhook verification:**
- [ ] Tunnel URL set as webhook in RazorPay dashboard
- [ ] `subscription.activated` event logged in server console
- [ ] `subscription.charged` event creates Payment record in DB
- [ ] `subscription.cancelled` event downgrades org plan

### 7.2 Critical Path E2E Checklist

- [ ] Register new account → lands on /templates
- [ ] Browse templates → filter works → select template
- [ ] Editor opens with template loaded
- [ ] Add/edit text element
- [ ] Save design → appears in /my-designs
- [ ] Open AI chat → enter property address + price
- [ ] Generation progress shows → infographic created
- [ ] Export PNG from editor → file downloads
- [ ] Account page → billing, usage, security tabs all load

---

## 8. CI/CD Pipeline (GitHub Actions)

### `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/infographic_test

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx vitest run --reporter=verbose
        env:
          JWT_SECRET: test-jwt-secret
          NODE_ENV: test

  integration-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: infographic_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx prisma db push --schema=api/prisma/schema.prisma
        env:
          DATABASE_URL: ${{ env.TEST_DATABASE_URL }}
      - run: npx vitest run --config vitest.integration.config.ts
        env:
          TEST_DATABASE_URL: ${{ env.TEST_DATABASE_URL }}
          JWT_SECRET: test-jwt-secret

  e2e-tests:
    needs: integration-tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: infographic_test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run dev &
        env:
          DATABASE_URL: ${{ env.TEST_DATABASE_URL }}
          JWT_SECRET: test-jwt-secret
          RAZORPAY_KEY_ID: ${{ secrets.RAZORPAY_TEST_KEY_ID }}
          # ... other secrets
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  synthetic-check:
    needs: e2e-tests
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx checkly test --verbose
        env:
          CHECKLY_API_KEY: ${{ secrets.CHECKLY_API_KEY }}
          PROD_URL: ${{ secrets.PROD_URL }}
```

---

## 9. Test Coverage Targets

| Module | Priority | Target Coverage |
|--------|----------|-----------------|
| `payments.service.ts` | Critical (PT-03/04) | 90%+ |
| `auth.service.ts` | Critical | 85%+ |
| `infographics.service.ts` | High (limits) | 80%+ |
| `usage-analytics.service.ts` | Medium | 75%+ |
| `designs.service.ts` | Medium | 70%+ |
| `SubscriptionCard.tsx` | High | 80%+ |
| `UsageScreen.tsx` | Medium | 70%+ |
| `PricingPage.tsx` | High | 75%+ |

---

## 10. Test Data Reference

### Plan Tier Limits (from `infographics.service.ts`)

| Plan | Monthly Limit | Users |
|------|--------------|-------|
| FREE | 3 | 1 |
| SOLO | 50 | 1 |
| TEAM | 200 | 5 |
| BROKERAGE | 1000 | 25 |
| API_STARTER | 5000 | 10 |
| API_GROWTH | 20000 | 50 |
| API_ENTERPRISE | unlimited | unlimited |

### RazorPay Test Card
- **Number**: 5267 3181 8797 5449 (Mastercard, subscriptions)
- **Expiry**: Any future date
- **CVV**: Any 3 digits

### Test User Seed
```typescript
const TEST_USER = {
  email: 'test@infographic.ai',
  password: 'Test1234!',
  name: 'Test User',
  planTier: 'SOLO',
};
```
