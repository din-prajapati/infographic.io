# General SaaS Testing Playbook

> **Audience**: Engineering teams building subscription-based web applications.
> **Purpose**: Framework-agnostic guide covering all testing tiers, common SaaS patterns, and CI/CD setup.
> **Last updated**: 2026-02-27

---

## 1. The 4-Tier Testing Pyramid

### Philosophy

The pyramid describes the ideal ratio of tests by cost, speed, and confidence.
Cheap tests at the bottom; expensive tests at the top. Each tier proves something the tier below cannot.

```
                    ┌───────────────────┐
                    │     Tier 4        │  Synthetic Monitoring
                    │   ~5–20 checks    │  Always-on, production only
                    │   • Slowest       │  Fires in prod, real traffic
                    │   • Most visible  │
                    └────────┬──────────┘
               ┌─────────────┴─────────────┐
               │          Tier 3           │  End-to-End Tests
               │       ~20–60 tests        │  Browser automation
               │   • Minutes to run        │  Proves user journeys work
               │   • Flaky if over-used    │
               └────────────┬──────────────┘
          ┌──────────────────┴──────────────────┐
          │              Tier 2                 │  Integration Tests
          │           ~40–80 tests              │  Service ↔ real DB ↔ API
          │   • 30 seconds – 3 minutes          │  Proves subsystems connect
          └──────────────────┬──────────────────┘
     ┌────────────────────────┴────────────────────────┐
     │                    Tier 1                        │  Unit Tests
     │                ~80–200 tests                     │  Functions & components in isolation
     │   • Milliseconds                                 │  Proves logic is correct
     │   • Never flaky (pure inputs/outputs)            │
     └──────────────────────────────────────────────────┘
```

### Proportions

| Tier | % of Test Suite | Time to Run |
|------|----------------|-------------|
| Unit | 60–70% | < 30 seconds |
| Integration | 20–30% | 30s – 5 min |
| E2E | 5–15% | 5–20 min |
| Synthetic | ~5% | Continuous |

### Tool Choices

| Tier | Node/JS | Python | Java |
|------|---------|--------|------|
| Unit | Vitest / Jest | pytest | JUnit 5 |
| Integration | Vitest + test DB | pytest + SQLAlchemy | Spring Test |
| E2E | Playwright | Playwright / Selenium | Playwright |
| Synthetic | Checkly | Checkly / Datadog | Datadog |
| API mocking | MSW | respx / httpretty | WireMock |
| DB mocking | prismock / testcontainers | testcontainers | testcontainers |

---

## 2. Decision Tree — Which Tier for Which Scenario

```
Is the scenario a user-visible flow requiring a browser?
├── YES → E2E (Tier 3)
│         e.g. "user can complete checkout", "export PNG downloads"
└── NO → Does it require real DB + multiple services working together?
          ├── YES → Integration (Tier 2)
          │         e.g. "webhook updates subscription status in DB"
          └── NO → Is it a business logic rule (pure function / algorithm)?
                    ├── YES → Unit (Tier 1)
                    │         e.g. "password must be hashed", "rate limit enforced"
                    └── NO → Is it something that must stay working in production?
                              ├── YES → Synthetic (Tier 4)
                              │         e.g. "health endpoint returns 200"
                              └── NO → Do you need it tested at all?
                                        → Probably not, skip it.
```

---

## 3. Common SaaS Testing Patterns

### 3.1 Authentication

**Patterns to test at each tier:**

**Unit:**
- Password hashing (never store plaintext)
- JWT payload shape and expiry
- Token refresh logic
- OAuth state parameter validation (CSRF prevention)
- API key format validation

**Integration:**
- Register → login → protected route access (full DB round-trip)
- Duplicate email returns 409
- Invalid token returns 401
- Expired token returns 401
- Role-based access: member cannot perform admin actions

**E2E:**
- Login → redirect to dashboard
- Logout → redirect to login
- OAuth flow (Google/GitHub) → account created
- "Remember me" persists session across browser restart
- Password reset email → link → password changed → login works

**Test isolation pattern:**
```typescript
// Always create isolated test users, never reuse
const user = await createTestUser({ email: `test-${uuid()}@example.com` });
// cleanup after test
afterEach(() => deleteTestUser(user.id));
```

---

### 3.2 Subscriptions & Billing

**Key invariants to test:**

1. **Subscription state machine**: `PENDING → ACTIVE → (CANCELLED | PAST_DUE | PAUSED)`
2. **Webhook idempotency**: duplicate webhooks must not double-credit
3. **Plan upgrade**: old subscription must be cancelled before new one activates
4. **Plan downgrade**: features/limits must be immediately reduced
5. **Cancellation**: `cancelAtPeriodEnd` must not immediately remove access

**Unit tests:**
```typescript
// Test the state transition logic in isolation
it('does not mark subscription ACTIVE before payment webhook');
it('cancels previous subscription on plan upgrade');
it('applies correct monthly limit for each plan tier');
it('validates webhook HMAC signature before processing');
```

**Integration tests:**
```typescript
// Test against a real test DB
it('create-subscription webhook-activate sequence sets correct DB state');
it('duplicate activated webhook is idempotent');
it('upgrade flow cancels old sub and creates new one atomically');
```

**Webhook testing pattern:**
```typescript
function buildWebhookPayload(event: string, data: object, secret: string) {
  const body = JSON.stringify({ event, payload: data });
  const signature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return { body, headers: { 'x-webhook-signature': signature } };
}
```

**E2E:**
- Click plan CTA → payment modal opens with correct amount
- Complete test payment → plan badge updates
- Cancel plan → confirmation dialog → status changes

---

### 3.3 Usage Limits & Metering

**Patterns:**
- Each plan tier has a monthly limit (e.g., FREE=10, PAID=500)
- Each billable action creates a `UsageRecord`
- When `count >= limit`, API returns 429
- Limits reset at the start of each billing period

**Unit tests:**
```typescript
it('returns 429 when usage equals the plan limit');
it('returns 200 when usage is one below the plan limit');
it('unlimited plan never returns 429');
it('usage count resets at start of new billing period');
it('usage record is created with correct month tag');
```

**Integration tests:**
```typescript
it('n-1 requests succeed, nth returns 429', async () => {
  const limit = PLAN_LIMITS['STARTER'];
  for (let i = 0; i < limit; i++) {
    await expect(service.performAction(userId)).resolves.toBeDefined();
  }
  await expect(service.performAction(userId)).rejects.toThrow(TooManyRequestsException);
});
```

**Metering accuracy:**
```typescript
it('creates exactly one UsageRecord per action, not zero or two');
it('UsageRecord.month matches current calendar month YYYY-MM');
```

---

### 3.4 Email Flows

**Flows to test:**
- Welcome / email verification
- Password reset
- Subscription confirmation
- Invoice/receipt
- Payment failed / dunning

**Testing strategy:**
Use Mailhog (local SMTP trap) or Mailtrap for integration tests. Never send real emails in tests.

```yaml
# docker-compose.test.yml
services:
  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"   # SMTP
      - "8025:8025"   # Web UI / API
```

```typescript
// Check email was sent via Mailhog API
async function getLastEmail(to: string) {
  const res = await fetch('http://localhost:8025/api/v2/messages?limit=1');
  const data = await res.json();
  return data.items.find(m => m.To[0].Mailbox === to.split('@')[0]);
}

it('sends password reset email', async () => {
  await authService.requestPasswordReset('user@example.com');
  const email = await getLastEmail('user@example.com');
  expect(email.Subject).toContain('Reset your password');
  expect(email.Body).toMatch(/https?:\/\/.+\/reset\?token=\w+/);
});
```

---

### 3.5 Real-time Features (WebSocket / SSE)

**Patterns:** Generation progress, live notifications, collaborative editing

**Unit tests:** Test the event-emission logic without a real socket connection.

```typescript
// Mock the socket gateway
const mockGateway = { emitToUser: vi.fn() };
it('emits progress event at each generation step', async () => {
  await generationService.generate(jobId, userId);
  expect(mockGateway.emitToUser).toHaveBeenCalledWith(userId, 'progress', { step: 1 });
});
```

**Integration tests:** Use a real Socket.io test client.

```typescript
import { io } from 'socket.io-client';

it('client receives progress events in order', async () => {
  const socket = io('http://localhost:3001', { auth: { token: testJwt } });
  const events: any[] = [];
  socket.on('progress', (data) => events.push(data));

  await triggerGeneration(jobId);
  await waitForEvent(socket, 'complete');

  expect(events[0].step).toBe(1);
  expect(events[events.length - 1].status).toBe('complete');
  socket.disconnect();
});
```

---

### 3.6 File Upload & Export

**Upload patterns:**
- Validate file type (MIME, not just extension)
- Validate file size
- Files stored with unique names (never user-supplied filenames)
- Scan for malware (production)

**Export patterns:**
- Correct `Content-Type` header
- `Content-Disposition: attachment; filename="..."` header
- File is not empty
- PNG/PDF renders the expected content

**Unit tests:**
```typescript
it('rejects non-image MIME types with 400');
it('rejects files over size limit with 413');
it('generates unique storage key (never the original filename)');
it('export endpoint sets correct Content-Type for PNG');
```

**Integration tests:**
```typescript
// Mock S3/GCS with localstack or in-memory fake
it('upload stores file and returns accessible URL');
it('export download returns non-empty file');
```

---

### 3.7 Multi-tenancy / Organizations

**Key invariants:**
- Users can only access their own organization's data
- Sharing/invitations work across org boundaries only when explicitly granted
- Member count is enforced per plan

**Unit tests:**
```typescript
it('enforces member limit per plan tier');
it('rejects invitation when org is at member cap');
```

**Integration tests:**
```typescript
it('user A cannot read user B org resources (IDOR prevention)', async () => {
  const orgA = await createOrg();
  const orgB = await createOrg();
  const resource = await createResource(orgA);

  await expect(
    service.getResource(orgB.userId, resource.id)  // cross-org read
  ).rejects.toThrow(ForbiddenException);
});

it('member of org can read org-shared resources');
it('member cannot read another org resources even with valid JWT');
```

---

### 3.8 API Rate Limiting

**Patterns:**
- Per-user limit (throttle by userId from JWT)
- Per-IP limit (unauthenticated endpoints)
- Per-plan limit (paid users get higher limits)

**Unit tests:**
```typescript
it('returns 429 when rate limit is exceeded');
it('includes Retry-After header in 429 response');
it('resets counter after TTL window');
```

**Integration tests:**
```typescript
it('100 rapid requests: first 100 succeed, 101st returns 429', async () => {
  const requests = Array(101).fill(null).map(() => client.get('/api/endpoint'));
  const results = await Promise.allSettled(requests);
  const statuses = results.map(r => r.status === 'fulfilled' ? r.value.status : 429);
  expect(statuses.filter(s => s === 200).length).toBe(100);
  expect(statuses[100]).toBe(429);
});
```

---

## 4. Test Data Management

### Factory Pattern (recommended)

Create reusable factory functions rather than seeding a static DB.

```typescript
// test/factories.ts
export async function createUser(overrides = {}) {
  return prisma.user.create({
    data: {
      email: `user-${uuid()}@test.com`,
      name: 'Test User',
      password: await bcrypt.hash('Test1234!', 10),
      ...overrides,
    },
  });
}

export async function createOrg(overrides = {}) {
  return prisma.organization.create({
    data: { name: `Org-${uuid()}`, planTier: 'FREE', monthlyLimit: 10, ...overrides },
  });
}

export async function createSubscription(userId, orgId, overrides = {}) {
  return prisma.subscription.create({
    data: {
      userId, organizationId: orgId,
      provider: 'STRIPE',
      status: 'ACTIVE',
      planTier: 'STARTER',
      billingPeriod: 'MONTHLY',
      ...overrides,
    },
  });
}
```

### Cleanup Strategies

| Strategy | When to Use |
|----------|-------------|
| `afterEach` delete | Fast unit/integration tests with small data sets |
| `beforeAll` truncate | Integration test suites; truncate all tables once per suite |
| Transaction rollback | Fastest; wrap each test in a transaction and rollback |
| Separate test DB | Full isolation; drop/recreate DB between CI runs |
| Docker testcontainers | Full isolation with real DB per test run |

**Transaction rollback pattern (fastest):**
```typescript
let tx: PrismaClient;

beforeEach(async () => {
  tx = await prisma.$begin();  // start transaction
});

afterEach(async () => {
  await tx.$rollback();  // always rollback
});
```

### Seed vs. Fixture

| | Seed | Fixture |
|--|------|---------|
| **What** | Static data inserted once | Data created per test |
| **When** | Lookup tables, categories, config | User accounts, records under test |
| **Risk** | Tests depend on shared state | None (isolated) |
| **Use for** | Plan tiers, template categories | Everything else |

---

## 5. Mocking Strategy Reference

| Scenario | Strategy | Tool |
|----------|----------|------|
| Unit test a service (no DB) | Mock PrismaClient | `prismock`, `vi.mock('@prisma/client')` |
| Integration test with real DB | Isolated test database | Separate `TEST_DATABASE_URL` |
| Frontend component fetching API | Intercept HTTP | MSW (`msw/node` + `msw/browser`) |
| Third-party payment provider | Mock at HTTP level | MSW, nock, or provider test mode |
| Third-party AI API | Mock at HTTP level | MSW or `vi.mock('openai')` |
| Email sending | Trap SMTP locally | Mailhog, Mailtrap, Ethereal |
| File storage (S3/GCS) | Local fake | localstack, minio, in-memory |
| Time-dependent logic | Mock `Date.now` | `vi.useFakeTimers()` |
| WebSockets | Real Socket.io test client | `socket.io-client` in tests |

### When to Use prismock vs Real DB

```
Use prismock when:
  ✓ Testing business logic rules (not DB behavior)
  ✓ You want millisecond-fast unit tests
  ✓ You're testing how the service handles DB responses

Use real DB when:
  ✓ Testing DB-level constraints (unique indexes, foreign keys)
  ✓ Testing complex queries (joins, aggregations)
  ✓ Testing Prisma transactions
  ✓ Testing migrations
```

---

## 6. Security Testing Checklist

### 6.1 Authentication Bypass
- [ ] Unauthenticated request to protected endpoint returns 401 (not 403, not 200)
- [ ] JWT with invalid signature is rejected
- [ ] JWT with expired `exp` claim is rejected
- [ ] JWT with tampered `sub` (userId) is rejected
- [ ] JWT from wrong environment (prod token on staging) is rejected
- [ ] API key from deactivated account is rejected

### 6.2 Authorization (IDOR — Insecure Direct Object Reference)
- [ ] User A cannot read, update, or delete User B's resources
- [ ] Passing a valid but wrong resource ID returns 403 (not 404, which leaks existence)
- [ ] Organization member cannot access another org's data with their own JWT

### 6.3 Input Validation
- [ ] SQL injection attempts in string fields are rejected or sanitized
- [ ] XSS payloads in stored fields are escaped on output
- [ ] Extremely long strings are rejected at schema validation
- [ ] Malformed JSON body returns 400, not 500
- [ ] Negative numbers in quantity/limit fields are rejected

### 6.4 Webhook Signature Validation
- [ ] Webhook without signature header is rejected (401)
- [ ] Webhook with wrong signature is rejected (401)
- [ ] Webhook with valid signature but modified body is rejected
- [ ] Replayed (old) webhook is detected and rejected (timestamp check)

### 6.5 Rate Limiting
- [ ] Brute-force login attempts are blocked after N failures
- [ ] Password reset endpoint is rate-limited
- [ ] API endpoints are rate-limited per user

### 6.6 Sensitive Data
- [ ] Passwords are never returned in any API response
- [ ] JWT secret is never exposed in logs or responses
- [ ] Payment card data never passes through your server (use provider widget)
- [ ] Private keys / secrets not committed to git

---

## 7. Performance Testing Baselines

### Response Time Budgets

| Endpoint Type | P50 Target | P99 Target |
|---------------|-----------|-----------|
| Health check | < 50ms | < 100ms |
| Auth (login) | < 200ms | < 500ms |
| List endpoints (paginated) | < 300ms | < 800ms |
| Single resource fetch | < 150ms | < 400ms |
| Write operations (create/update) | < 400ms | < 1000ms |
| File upload | < 2000ms | < 5000ms |
| AI/async job trigger | < 500ms | < 1500ms |
| Report/analytics query | < 800ms | < 2000ms |

### Load Testing Approach

Use [k6](https://k6.io/) or [Artillery](https://artillery.io/) for load testing.

```javascript
// k6 smoke test example
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('https://api.yourapp.com/v1/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

### Thresholds by SaaS Tier

| Tier | Concurrent Users | RPS Target |
|------|-----------------|-----------|
| Startup (< 100 users) | 10 | 20 |
| Growth (1k–10k users) | 100 | 200 |
| Scale (10k+ users) | 500+ | 1000+ |

---

## 8. CI/CD Pipeline Blueprint

### Recommended Job Graph

```
push/PR
  │
  ├── lint (parallel, 30s)
  ├── type-check (parallel, 30s)
  │
  ├── unit-tests (parallel, 2 min)
  │       ↓ (on success)
  ├── integration-tests (3 min)
  │       ↓ (on success)
  ├── e2e-tests (10 min)
  │       ↓ (main branch only)
  └── synthetic-check (post-deploy)
```

### Parallelism Strategy

```yaml
jobs:
  # Run lint + type-check in parallel (no dependencies)
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: npm run lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - run: npm run type-check

  unit-tests:
    needs: [lint, type-check]  # only after quality gates pass
    steps:
      - run: npx vitest run

  integration-tests:
    needs: unit-tests
    services:
      postgres: { image: postgres:15 }
    steps:
      - run: npx vitest run --config vitest.integration.config.ts

  e2e-tests:
    needs: integration-tests
    steps:
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-traces
          path: test-results/
```

### Artifact Uploads

| Test Type | On Failure Upload |
|-----------|-------------------|
| Unit | Coverage report |
| Integration | DB query logs |
| E2E | Screenshots, videos, traces |
| Performance | HTML report |

### Caching

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
      ~/.cache/ms-playwright
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
```

---

## 9. Monitoring Checklist (Synthetic Monitoring per SaaS Tier)

### What to Monitor

| Check | Tier 0 (Startup) | Tier 1 (Growth) | Tier 2 (Scale) |
|-------|-----------------|-----------------|----------------|
| Health endpoint | ✅ | ✅ | ✅ |
| Auth flow (browser) | ✅ | ✅ | ✅ |
| Payment provider reachable | ✅ | ✅ | ✅ |
| Core feature end-to-end | — | ✅ | ✅ |
| API response time SLA | — | ✅ | ✅ |
| All critical paths | — | — | ✅ |
| Canary deployments | — | — | ✅ |

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Health endpoint failure | 1 check | 3 consecutive |
| Response time P99 | > 2s | > 5s |
| Error rate | > 1% | > 5% |
| Login flow failure | 1 failure | 3 consecutive |

### Check Frequency

| Environment | Frequency |
|-------------|-----------|
| Production | Every 1–5 minutes |
| Staging | Every 15 minutes |
| CI post-deploy | Once per deploy |

### Runbook Template (per synthetic check)

```markdown
## Runbook: [Check Name] Failed

**Alert**: [check name] has failed N consecutive times
**Impact**: [describe user-facing impact]

### Diagnosis Steps
1. Check [service] status page
2. Check [log location] for errors
3. Run [diagnostic command]

### Resolution
- If [condition A]: [action A]
- If [condition B]: [action B]

### Escalation
- After 15 min unresolved → page on-call engineer
```

---

## 10. Quick Reference — Test Anti-patterns

| Anti-pattern | Problem | Fix |
|--------------|---------|-----|
| Tests sharing DB state | Flaky tests, order-dependent | Isolate each test with cleanup |
| Testing implementation details | Tests break on refactor | Test behavior/output, not internals |
| Mocking everything | Tests prove nothing | Use real DB for integration tier |
| No test for unhappy path | Bugs in error handling | Test 400/401/403/404/409/429/500 |
| E2E tests for every scenario | Slow, flaky CI | E2E for critical journeys only |
| Assertions on timestamp equality | Timing flakiness | Assert timestamp is "recent" (within 5s) |
| Hardcoded test user in shared DB | Parallel test conflicts | Use factories with unique IDs |
| Testing third-party APIs | Brittle to provider changes | Mock at HTTP boundary |
| No cleanup after tests | DB grows unboundedly | Always clean up test data |
| Skipping CI to ship faster | Technical debt accumulates | Invest in fast, reliable tests |
