# SaaS Product Testing Playbook

> **A production-verified guide for building a complete testing infrastructure**

---

## Table of Contents

1. [Testing Pyramid — 4 Tiers](#1-testing-pyramid--4-tiers)
2. [Unit Tests — Vitest](#2-unit-tests--vitest)
3. [Integration Tests — Vitest](#3-integration-tests--vitest)
4. [End-to-End Tests — Playwright](#4-end-to-end-tests--playwright)
5. [Synthetic Monitoring — Checkly](#5-synthetic-monitoring--checkly)
6. [Decision Guide](#6-decision-guide)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [Naming & File Conventions](#8-naming--file-conventions)
9. [Performance Guidelines](#9-performance-guidelines-for-test-code)

---

## 1. Testing Pyramid — 4 Tiers {#1-testing-pyramid--4-tiers}

### Overview

The testing strategy follows a **4-tier pyramid** — from fast, isolated unit tests at the base to continuous synthetic monitoring at the apex.

```mermaid
graph TB
    subgraph Pyramid["Testing Pyramid"]
        T1["Tier 1: Unit Tests<br/>Vitest — fully mocked, isolated, fast<br/>~60–70%"]
        T2["Tier 2: Integration<br/>Vitest — real DB, no UI<br/>~15–20%"]
        T3["Tier 3: E2E<br/>Playwright — full browser user journeys<br/>~10–15%"]
        T4["Tier 4: Synthetic<br/>Checkly — production uptime + key flows<br/>~5%"]
    end
    
    T1 --> T2 --> T3 --> T4
    style T1 fill:#e8f5e9
    style T2 fill:#e3f2fd
    style T3 fill:#fff3e0
    style T4 fill:#fce4ec
```

### ASCII Pyramid Diagram

```
              ▲
             /  \
            / 4. \          Synthetic Monitoring (Checkly)
           / Synth \        Production uptime + key flows, every 10 min
          /─────────\
         /           \
        /    3. E2E   \     Playwright — full browser user journeys
       /───────────────\
      /                 \
     /  2. Integration   \  Vitest — service ↔ real DB, no UI
    /─────────────────────\
   /                       \
  /       1. Unit            \ Vitest — fully mocked, isolated, fast
 /───────────────────────────\
```

### Tier Summary Table

| Tier | Tool | File Pattern | Runs Against | Proportion |
|------|------|--------------|--------------|------------|
| **Unit** | Vitest ^2.x | `*.test.ts` / `*.spec.ts` | Mocks only | ~60–70% |
| **Integration** | Vitest ^2.x | `*.integration-test.ts` | Real DB, no UI | ~15–20% |
| **E2E** | Playwright ^1.45 | `*.e2e.ts` | Running app + browser | ~10–15% |
| **Synthetic** | Checkly | `*.spec.ts` / `*.check.ts` | Production/staging | ~5% |

---

## 2. Unit Tests — Vitest {#2-unit-tests--vitest}

### Philosophy

Test one function, class, or component in **complete isolation**. Every external dependency — database, network calls, router, time — is replaced with a controlled substitute. Tests must be **deterministic** and **runnable offline**.

### Full Tooling Stack

| Package | Purpose |
|---------|---------|
| `vitest ^2.1.1` | Test runner, assertion library, watch mode |
| `@vitest/ui` | Browser-based test dashboard |
| `vitest-fetch-mock` | Mock global `fetch()` calls |
| `vitest-mock-extended` | Type-safe mock factories for interfaces/classes |
| `prismock` | In-memory Prisma mock — no DB connection needed |
| `msw` (per-package) | Mock Service Worker — HTTP-level API mocking *(scope at package level, not globally)* |
| `next-router-mock` | Mock Next.js router (`useRouter`, `usePathname`) |
| `@testing-library/react` | Render and query React components |
| `@testing-library/jest-dom` | DOM matchers (`toBeInTheDocument`, `toHaveValue`…) |
| `resize-observer-polyfill` | Polyfill for JSDOM missing globals |

---

### Global Setup File (`setupVitest.ts`)

This file is declared in `setupFiles` of every workspace suite and runs before each test file:

```typescript
import matchers from "@testing-library/jest-dom/matchers";
import ResizeObserver from "resize-observer-polyfill";
import { vi, expect } from "vitest";
import createFetchMock from "vitest-fetch-mock";

// Polyfill JSDOM for components using ResizeObserver
global.ResizeObserver = ResizeObserver;

// Intercept all fetch() calls — tests must explicitly allow or mock responses
const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

// Add .toBeInTheDocument(), .toHaveValue(), etc.
expect.extend(matchers);
```

---

### Vitest Config (`vitest.config.ts`)

```typescript
import { defineConfig } from "vitest/config";

// Signal to application code that it's running in test mode
process.env.INTEGRATION_TEST_MODE = "true";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",     // Fast native V8 coverage, no instrumentation overhead
    },
    passWithNoTests: true,
    testTimeout: 500_000, // Generous timeout; individual tests should still be fast
  },
});
```

---

### Workspace Configuration (`vitest.workspace.ts`)

The workspace config is the **core architecture decision**: one project entry per domain, each with its own environment, setup, and includes. This prevents test pollution and enables parallel execution per suite.

```mermaid
graph LR
    subgraph Workspace["Vitest Workspace"]
        A[Special Modes]
        B[Default Suites]
    end
    
    A --> A1["PackagedEmbedTests"]
    A --> A2["IntegrationTests"]
    A --> A3["TimezoneDependentTests"]
    
    B --> B1["@saas/lib"]
    B --> B2["@saas/api"]
    B --> B3["@saas/features"]
    B --> B4["@saas/ui"]
    B --> B5["...14 suites total"]
```

```typescript
import { defineWorkspace } from "vitest/config";

// Feature flags allow CI to target specific tiers
const packagedEmbedTestsOnly   = process.argv.includes("--packaged-embed-tests-only");
const integrationTestsOnly     = process.argv.includes("--integrationTestsOnly");
const timeZoneDependentTestsOnly = process.argv.includes("--timeZoneDependentTestsOnly");

export default defineWorkspace([
  // ── Special Modes (conditional) ───────────────────────────────────────────

  // Mode A: Only packaged embed tests
  ...(packagedEmbedTestsOnly ? [{
    test: {
      name: "PackagedEmbedTests",
      include: ["packages/embeds/**/packaged/**/*.{test,spec}.{ts,js}"],
      environment: "jsdom",
    },
  }] : []),

  // Mode B: Integration tests only — real DB, requires DATABASE_URL
  ...(integrationTestsOnly ? [{
    test: {
      name: "IntegrationTests",
      include: [
        "packages/**/*.integration-test.ts",
        "apps/**/*.integration-test.ts",
      ],
      exclude: ["**/node_modules/**/*", "packages/embeds/**/*"],
      setupFiles: ["setupVitest.ts"],
    },
  }] : []),

  // Mode C: Timezone-sensitive tests — must set TZ env var
  ...(timeZoneDependentTestsOnly ? [{
    test: {
      name: `TimezoneDependentTests:${process.env.TZ}`,
      include: [
        "packages/**/*.timezone.test.ts",
        "apps/**/*.timezone.test.ts",
      ],
      exclude: ["**/node_modules/**/*", "packages/embeds/**/*"],
      setupFiles: ["setupVitest.ts"],
    },
  }] : []),

  // ── Default: 14 Regular Suites ────────────────────────────────────────────

  // Pure business logic, utilities, repositories — Node environment
  {
    test: {
      name: "@saas/lib",
      include: ["packages/**/*.{test,spec}.{ts,js}", "apps/**/*.{test,spec}.{ts,js}"],
      exclude: [
        "**/node_modules/**/*",
        "**/.next/**/*",
        "packages/embeds/**/*",
        "packages/lib/hooks/**/*",   // hooks need jsdom — separate suite below
        "packages/platform/**/*",
        "apps/api/v1/**/*",
        "apps/api/v2/**/*",
      ],
      setupFiles: ["setupVitest.ts"],
    },
  },

  // API v1 routes — Node environment
  {
    test: {
      name: "@saas/api",
      include: ["apps/api/v1/**/*.{test,spec}.{ts,js}"],
      exclude: ["**/node_modules/**/*"],
      setupFiles: ["setupVitest.ts"],
    },
  },

  // Feature packages — jsdom for any DOM-adjacent code
  {
    test: {
      name: "@saas/features",
      globals: true,
      environment: "jsdom",
      include: ["packages/features/**/*.{test,spec}.tsx"],
      exclude: [
        "packages/features/form-builder/**/*",  // separate suite
        "packages/features/bookings/**/*",       // separate suite
      ],
      setupFiles: ["setupVitest.ts", "packages/ui/components/test-setup.tsx"],
    },
  },

  // Form builder — isolated because it has specific jsdom requirements
  {
    test: {
      name: "@saas/features/form-builder",
      globals: true,
      environment: "jsdom",
      include: ["packages/features/form-builder/**/*.{test,spec}.[jt]sx"],
      setupFiles: ["packages/ui/components/test-setup.tsx"],
    },
  },

  // Booking logic — isolated because bookings are domain-critical
  {
    test: {
      name: "@saas/features/bookings",
      globals: true,
      environment: "jsdom",
      include: ["packages/features/bookings/**/*.{test,spec}.[jt]sx"],
      setupFiles: ["packages/ui/components/test-setup.tsx"],
    },
  },

  // UI component library
  {
    test: {
      name: "@saas/ui",
      globals: true,
      environment: "jsdom",
      include: ["packages/ui/components/**/*.{test,spec}.[jt]s?(x)"],
      setupFiles: ["packages/ui/components/test-setup.tsx"],
    },
  },

  // Third-party integration app — has its own globals setup
  {
    test: {
      name: "@saas/closecom",
      environment: "jsdom",
      include: ["packages/app-store/closecom/**/*.{test,spec}.{ts,js}"],
      setupFiles: ["packages/app-store/closecom/test/globals.ts"],
    },
  },

  // App store entry-point tests
  {
    test: {
      name: "@saas/app-store-core",
      globals: true,
      environment: "jsdom",
      include: ["packages/app-store/*.{test,spec}.[jt]s?(x)"],
      setupFiles: ["packages/ui/components/test-setup.tsx"],
    },
  },

  // Routing forms app
  {
    test: {
      name: "@saas/routing-forms",
      globals: true,
      environment: "jsdom",
      include: ["packages/app-store/routing-forms/**/*.test.tsx"],
      setupFiles: ["packages/ui/components/test-setup.tsx"],
    },
  },

  // Web app UI components
  {
    test: {
      name: "@saas/web/components",
      globals: true,
      environment: "jsdom",
      include: ["apps/web/components/**/*.{test,spec}.[jt]sx"],
      setupFiles: ["packages/ui/components/test-setup.tsx"],
    },
  },

  // Web app module views (pages/layouts)
  {
    test: {
      name: "@saas/web/modules/views",
      globals: true,
      environment: "jsdom",
      include: ["apps/web/modules/**/*.{test,spec}.tsx"],
      setupFiles: ["apps/web/modules/test-setup.ts"],
    },
  },

  // React hooks — jsdom for useEffect, useRef, etc.
  {
    test: {
      name: "@saas/packages/lib/hooks",
      environment: "jsdom",
      include: ["packages/lib/hooks/**/*.{test,spec}.{ts,js}"],
    },
  },

  // Embed SDK (non-packaged tests)
  {
    test: {
      name: "@saas/embeds",
      globals: true,
      environment: "jsdom",
      include: ["packages/embeds/**/*.{test,spec}.{ts,js}"],
      exclude: ["packages/embeds/**/packaged/**/*.{test,spec}.{ts,js}"],
    },
  },

  // App card interface components
  {
    test: {
      name: "AppCardInterface components",
      globals: true,
      environment: "jsdom",
      include: ["packages/app-store/_components/**/*.{test,spec}.[jt]s?(x)"],
      setupFiles: ["packages/app-store/test-setup.ts"],
    },
  },
]);
```

> **Rule for new suites:** When a new package has tests that require different environment or setup from existing suites, create a new workspace entry rather than adding exceptions to an existing one.

---

### Mocking Patterns

#### Pattern 1: Prisma (In-Memory Mock)

For unit tests, **never connect to a database**. Use `prismock` — it satisfies the full Prisma client interface in-memory:

```typescript
// __mocks__/prisma.ts — auto-loaded via vi.mock()
import { PrismockClient } from "prismock";
const prisma = new PrismockClient();
export default prisma;

// In test file:
import prismock from "../../../../tests/libs/__mocks__/prisma";

const org = await prismock.team.create({
  data: { name: "Test Org", isOrganization: true }
});
expect(org.name).toBe("Test Org");
```

#### Pattern 2: Prisma Method Mocking (`prismaMock`)

When you need fine-grained control over what specific queries return:

```typescript
import prismaMock from "../../../tests/libs/__mocks__/prismaMock";

prismaMock.user.findMany.mockResolvedValue(users);
prismaMock.booking.findMany.mockResolvedValue([]);
prismaMock.outOfOfficeEntry.findMany.mockResolvedValue([]);
```

#### Pattern 3: External Service Mocks

```typescript
import CalendarManagerMock from "../../../tests/libs/__mocks__/CalendarManager";

CalendarManagerMock.getBusyCalendarTimes.mockResolvedValue({
  success: true,
  data: [],
});
```

#### Pattern 4: Module Mocking

```typescript
vi.mock("@saas/app-store/routing-forms/components/widgets", () => ({
  default: {},
}));
```

#### Pattern 5: Next.js Router

```typescript
import mockRouter from "next-router-mock";

mockRouter.setCurrentUrl("/settings/profile");
expect(mockRouter.pathname).toBe("/settings/profile");
```

#### Pattern 6: HTTP API Mocking (MSW — per package)

> **Note:** Scope msw at the package level, not globally.

```typescript
// packages/my-feature/mocks/handlers.ts
import { rest } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  rest.get("/api/users", (req, res, ctx) => {
    return res(ctx.json({ users: [] }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

#### Pattern 7: Time Control

```typescript
// Fixed time for the whole suite
beforeAll(() => {
  vi.setSystemTime(new Date("2024-01-15T10:00:00Z"));
});

// Per-test fake timers (more common)
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
```

---

### Test Data Builders

Centralize test data construction. **Never inline large object literals** in individual tests:

```typescript
// packages/lib/test/builder.ts
export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: Math.floor(Math.random() * 10000),
    email: `test-${Date.now()}@example.com`,
    name: "Test User",
    username: `testuser-${Date.now()}`,
    bookings: [],
    ...overrides,
  };
}

export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: Math.floor(Math.random() * 10000),
    uid: `booking-${Date.now()}`,
    createdAt: new Date(),
    startTime: new Date(),
    endTime: new Date(Date.now() + 30 * 60 * 1000),
    status: "ACCEPTED",
    ...overrides,
  };
}
```

---

### Example Unit Test (Full Pattern)

```typescript
import CalendarManagerMock from "../../../tests/libs/__mocks__/CalendarManager";
import prismaMock from "../../../tests/libs/__mocks__/prismaMock";
import { expect, it, describe, vi, beforeAll } from "vitest";
import { buildUser, buildBooking } from "@saas/lib/test/builder";
import { getLuckyUser } from "./getLuckyUser";

// Pin time — eliminates flakiness from date-relative logic
beforeAll(() => vi.setSystemTime(new Date("2024-01-15T10:00:00Z")));

describe("getLuckyUser — round-robin assignment", () => {
  it("selects user with fewest recent bookings", async () => {
    const users = [
      buildUser({ id: 1, bookings: [buildBooking(), buildBooking()] }),
      buildUser({ id: 2, bookings: [buildBooking()] }),
    ];

    prismaMock.user.findMany.mockResolvedValue(users);
    prismaMock.booking.findMany.mockResolvedValue([]);
    prismaMock.outOfOfficeEntry.findMany.mockResolvedValue([]);
    CalendarManagerMock.getBusyCalendarTimes.mockResolvedValue({ success: true, data: [] });

    const result = await getLuckyUser({
      availableUsers: users,
      eventType: { id: 1, schedulingType: "ROUND_ROBIN" },
    });

    expect(result.id).toBe(2); // fewer bookings = lucky pick
  });
});
```

---

### Running Unit Tests

| Command | Description |
|---------|-------------|
| `yarn test` | Run all unit test suites once |
| `yarn tdd` | Watch mode — re-runs on file save |
| `yarn test:ui` | Open Vitest browser dashboard |
| `yarn type-check` | TypeScript validation (no emit) |

---

## 3. Integration Tests — Vitest {#3-integration-tests--vitest}

### Philosophy

Test a **real service-to-database path** without any UI. The database is **real** — this is the key distinction from unit tests. Use integration tests for:

- Complex multi-join queries
- Transactional logic
- Algorithms that must be verified against actual DB behaviour
- Timezone-sensitive date math

> **Critical distinction:** Unit tests use `prismock` (in-memory, no DB). Integration tests use the **real** Prisma client connected to a test database. **Never mix these.**

---

### File Naming Convention

| File | Purpose |
|------|---------|
| `getLuckyUser.ts` | Source |
| `getLuckyUser.test.ts` | Unit test ← prismock, no DB |
| `getLuckyUser.integration-test.ts` | Integration test ← real DB |
| `getLuckyUser.timezone.test.ts` | Timezone-sensitive ← run with `TZ` env var |

---

### Setup and Teardown Pattern

The lifecycle of integration test data:

```typescript
import { describe, it, vi, expect, afterEach, beforeEach, beforeAll, afterAll } from "vitest";
import prisma from "@saas/prisma";  // ← REAL client, never prismock

// ── Shared fixtures (expensive to create, reused across tests) ────────────
let sharedEventTypeId: number;

beforeAll(async () => {
  const event = await prisma.eventType.create({
    data: { title: "Integration Test Event", slug: "integration-test", length: 30 },
    select: { id: true },
  });
  sharedEventTypeId = event.id;
});

afterAll(async () => {
  await prisma.eventType.delete({ where: { id: sharedEventTypeId } });
});

// ── Per-test data (created fresh, deleted after each test) ─────────────────
const createdUserIds: number[] = [];

async function createTestUser(email: string): Promise<{ id: number }> {
  const user = await prisma.user.create({
    data: { email, username: email.split("@")[0] },
    select: { id: true },
  });
  createdUserIds.push(user.id); // track for cleanup
  return user;
}

afterEach(async () => {
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  createdUserIds.splice(0, createdUserIds.length); // reset tracker
  vi.useRealTimers();
});

beforeEach(() => {
  vi.useFakeTimers(); // still mock time even with real DB
});
```

---

### Isolation Rules

| Do | Don't |
|----|-------|
| Track every created ID for cleanup | Use `deleteMany({})` without a filter |
| Use uniquely generated emails/slugs per test | Rely on fixed seed data being in a specific state |
| Create only the data each test needs | Share mutable state between tests |
| Clean up in `afterEach`, not `afterAll` | Let test failures leave orphan records |

---

### Example Integration Test

```typescript
describe("booking assignment — round-robin with real DB", () => {
  it("assigns to the user with no bookings when one user has bookings", async () => {
    // Arrange — real DB records
    const userWithBooking = await createTestUser("busy@example.com");
    const userWithoutBooking = await createTestUser("free@example.com");

    await prisma.booking.create({
      data: {
        userId: userWithBooking.id,
        eventTypeId: sharedEventTypeId,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1800000),
        uid: `booking-${Date.now()}`,
        title: "Test booking",
      },
    });

    vi.setSystemTime(new Date("2024-06-20T12:00:00Z"));

    // Act — real service call against real DB
    const result = await getLuckyUser({
      availableUsers: [userWithBooking, userWithoutBooking],
      eventType: { id: sharedEventTypeId },
    });

    // Assert
    expect(result.id).toBe(userWithoutBooking.id);
  });
});
```

---

### Timezone-Sensitive Tests

Tests whose correctness depends on the system timezone are separated into their own suite:

```typescript
// availability.timezone.test.ts
// Run with: TZ=America/New_York yarn vitest --timeZoneDependentTestsOnly
// Also run with: TZ=Asia/Kolkata yarn vitest --timeZoneDependentTestsOnly

it("start of business day is correct for New York timezone", () => {
  const startOfDay = getStartOfBusinessDay("America/New_York");
  expect(startOfDay.hour()).toBe(9);
});
```

---

### Running Integration Tests

```bash
# Integration tests only (requires real DATABASE_URL in .env)
yarn vitest --integrationTestsOnly

# Timezone-dependent tests
TZ=America/New_York yarn vitest --timeZoneDependentTestsOnly
TZ=Europe/London    yarn vitest --timeZoneDependentTestsOnly
TZ=Asia/Kolkata     yarn vitest --timeZoneDependentTestsOnly

# All unit tests (default workspace, excludes integration)
yarn test
```

---

## 4. End-to-End Tests — Playwright {#4-end-to-end-tests--playwright}

### Philosophy

Simulate a **real user** navigating a running application in a real browser. Tests validate complete user journeys and catch issues that only emerge when all layers — UI, API, database, and third-party services — run together.

---

### Test Architecture

```mermaid
flowchart TB
    subgraph E2E["E2E Test Flow"]
        A[Test File] --> B[Fixtures]
        B --> C[Users]
        B --> D[Orgs]
        B --> E[Bookings]
        B --> F[Emails]
        
        A --> G[Page Interactions]
        G --> H[Assertions]
        
        C --> I[Real DB]
        D --> I
        E --> I
    end
    
    subgraph App["Running Application"]
        J[Web App]
        K[API]
        L[Database]
    end
    
    G --> J
    J --> K --> L
```

---

### Playwright Config (`playwright.config.ts`)

```typescript
import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";
import * as os from "os";

// CI is strict and fast. Local is generous to accommodate slow dev servers.
const CI = !!process.env.CI;
const DEFAULT_NAVIGATION_TIMEOUT = CI ? 30_000 : 120_000;
const DEFAULT_EXPECT_TIMEOUT    = CI ? 30_000 : 120_000;
const DEFAULT_TEST_TIMEOUT      = CI ? 60_000 : 240_000;

const config: PlaywrightTestConfig = {
  // Fail immediately if .only is left in code — enforces CI hygiene
  forbidOnly: CI,

  // Tolerate flakiness in CI only — never retry locally (mask real failures)
  retries: CI ? 2 : 0,

  // Full CPU parallelism; single-thread for PWDEBUG inspection
  workers: process.env.PWDEBUG ? 1 : os.cpus().length,
  fullyParallel: true,

  timeout: DEFAULT_TEST_TIMEOUT,

  // Stop after 10 failures in CI — fast feedback, avoid wasting runner time
  maxFailures: CI ? 10 : undefined,

  // Three reporters: human-readable, archivable HTML, CI-parseable JUnit
  reporter: [
    [CI ? "blob" : "list"],
    ["html", { outputFolder: "./test-results/reports/playwright-html-report", open: "never" }],
    ["junit", { outputFile: "./test-results/reports/results.xml" }],
  ],

  outputDir: "./test-results/results",

  use: {
    baseURL: process.env.NEXT_PUBLIC_WEBAPP_URL,
    locale: "en-US",
    trace: "retain-on-failure",  // automatic trace capture on failures
    headless: CI || !!process.env.PLAYWRIGHT_HEADLESS,
  },

  // Auto-start app server before running tests
  webServer: [{
    command: `NEXT_PUBLIC_IS_E2E=1 yarn workspace @saas/web start -p 3000`,
    port: 3000,
    timeout: 60_000,
    reuseExistingServer: !CI,  // reuse local server; always fresh in CI
  }],

  // ── 7 browser/device projects ──────────────────────────────────────────
  projects: [
    {
      name: "@saas/web",
      testDir: "./apps/web/playwright",
      testMatch: /.*\.e2e\.tsx?/,
      use: {
        ...devices["Desktop Chrome"],
        timezoneId: "Europe/London",
        locale: "en-US",
        navigationTimeout: DEFAULT_NAVIGATION_TIMEOUT,
        contextOptions: { permissions: ["clipboard-read", "clipboard-write"] },
        storageState: {
          cookies: [
            // Pre-dismiss dialogs that would block test flow
            { url: process.env.NEXT_PUBLIC_WEBAPP_URL!, name: "saas-timezone-dialog", value: "1", expires: -1 },
          ],
        },
      },
      expect: { timeout: DEFAULT_EXPECT_TIMEOUT },
    },
    {
      name: "@saas/app-store",
      testDir: "./packages/app-store",
      testMatch: /.*\.e2e\.tsx?/,
      use: { ...devices["Desktop Chrome"] },
      expect: { timeout: DEFAULT_EXPECT_TIMEOUT },
    },
    {
      name: "@saas/embed-core",
      testDir: "./packages/embeds/embed-core",
      testMatch: /.*\.e2e\.tsx?/,
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3100/" },
      expect: { timeout: DEFAULT_EXPECT_TIMEOUT },
    },
    {
      name: "@saas/embed-react",
      testDir: "./packages/embeds/embed-react",
      testMatch: /.*\.e2e\.tsx?/,
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3101/" },
      expect: { timeout: DEFAULT_EXPECT_TIMEOUT },
    },
    // Cross-browser coverage
    {
      name: "@saas/embed--firefox",
      testDir: "./packages/embeds",
      testMatch: /.*\.e2e\.tsx?/,
      use: { ...devices["Desktop Firefox"] },
      expect: { timeout: DEFAULT_EXPECT_TIMEOUT },
    },
    {
      name: "@saas/embed--webkit",
      testDir: "./packages/embeds",
      testMatch: /.*\.e2e\.tsx?/,
      use: { ...devices["Desktop Safari"] },
      expect: { timeout: DEFAULT_EXPECT_TIMEOUT },
    },
    // Mobile viewport
    {
      name: "@saas/embed--mobile",
      testDir: "./packages/embeds/embed-core",
      testMatch: /.*\.e2e\.tsx?/,
      use: { ...devices["iPhone 13"] },
      expect: { timeout: DEFAULT_EXPECT_TIMEOUT },
    },
  ],
};

export default config;
```

---

### Fixture System

The fixture system is the **backbone of maintainable E2E tests**. Extend Playwright's base test object with domain-specific fixtures that encapsulate setup, teardown, and interaction helpers:

```typescript
// playwright/lib/fixtures.ts
import { test as base } from "@playwright/test";
import { createUsersFixture }    from "../fixtures/users";
import { createOrgsFixture }     from "../fixtures/orgs";
import { createBookingsFixture } from "../fixtures/bookings";
import { createEmailsFixture }   from "../fixtures/emails";
import { createFeatureFixture }  from "../fixtures/features";
import { createWebhookFixture }  from "../fixtures/webhooks";

export interface Fixtures {
  users:       ReturnType<typeof createUsersFixture>;
  orgs:        ReturnType<typeof createOrgsFixture>;
  bookings:    ReturnType<typeof createBookingsFixture>;
  emails:      ReturnType<typeof createEmailsFixture>;
  features:    ReturnType<typeof createFeatureFixture>;
  webhooks:    ReturnType<typeof createWebhookFixture>;
}

export const test = base.extend<Fixtures>({
  users:    async ({ page, emails }, use, workerInfo) => {
              await use(createUsersFixture(page, emails, workerInfo));
            },
  orgs:     async ({ page }, use) => { await use(createOrgsFixture(page)); },
  bookings: async ({ page }, use, workerInfo) => {
              await use(createBookingsFixture(page, workerInfo));
            },
  emails:   async ({ page }, use) => { await use(createEmailsFixture(page)); },
  features: async ({ page }, use) => { await use(createFeatureFixture(page)); },
  webhooks: async ({ page }, use) => { await use(createWebhookFixture(page)); },
});

export { expect } from "@playwright/test";
```

Each domain fixture should provide:

- `create(props)` — creates a DB record and returns a page-helper object
- `deleteAll()` — cleans up all records created within the test
- Convenience methods like `login()`, `createEventType()`, etc.

---

### Test Structure Pattern

```typescript
// booking-flow.e2e.ts
import { test, expect } from "./lib/fixtures";
import { bookFirstEvent, selectFirstAvailableTimeSlotNextMonth } from "./lib/testUtils";

// All tests in this describe run in parallel across workers
test.describe.configure({ mode: "parallel" });

// Teardown runs even if the test fails — no orphan records
test.afterEach(async ({ users }) => {
  await users.deleteAll();
});

test.describe("booking page", () => {
  test("user can book a 30-min event and receives confirmation", async ({ page, users }) => {
    // 1. Create real user via fixture
    const user = await users.create({ name: "Test User" });

    // 2. Navigate to their booking page
    await page.goto(`/${user.username}/30-min`);

    // 3. Interact with UI
    await selectFirstAvailableTimeSlotNextMonth(page);
    await page.fill('[data-testid="name"]', "Attendee Name");
    await page.fill('[data-testid="email"]', "attendee@example.com");
    await page.click('[data-testid="confirm-book-button"]');

    // 4. Assert confirmation state
    await expect(page.locator('[data-testid="booking-confirmed"]')).toBeVisible();
    await expect(page.locator('[data-testid="attendee-name"]')).toHaveText("Attendee Name");
  });

  test("SSR response contains correct OG metadata", async ({ page, users }) => {
    const { JSDOM } = await import("jsdom");
    const user = await users.create({ name: "Meta Test User" });

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes(`/${user.username}/30-min`) && res.status() === 200
    );
    await page.goto(`/${user.username}/30-min`);
    const response = await responsePromise;

    const document = new JSDOM(await response.text()).window.document;
    expect(document.querySelector("title")?.textContent).toContain("Meta Test User");
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content"))
      .toContain(user.username);
  });
});
```

---

### Shared Test Utilities (`testUtils.ts`)

Wrap repetitive multi-step interactions into named functions. Tests read as user stories, not as lists of clicks:

```typescript
export async function selectFirstAvailableTimeSlotNextMonth(page: Page) {
  await page.click('[data-testid="toggle-month"]');
  await page.locator('[data-testid="day"]:not([data-disabled])').first().click();
  await page.locator('[data-testid="time"]').first().click();
}

export async function bookFirstEvent(page: Page) {
  await selectFirstAvailableTimeSlotNextMonth(page);
  await page.fill('[data-testid="name"]', testName);
  await page.fill('[data-testid="email"]', testEmail);
  await page.click('[data-testid="confirm-book-button"]');
}

export async function confirmBooking(page: Page) {
  await page.click('[data-testid="confirm"]');
  await page.waitForSelector('[data-testid="booking-confirmed"]');
}
```

---

### Custom Matchers

Extend `expect` with domain-specific assertions:

```typescript
// playwright.config.ts
import { expect } from "@playwright/test";

expect.extend({
  async toBeEmbedCalLink(iframe, calNamespace, getActionFiredDetails, expectedUrlDetails = {}) {
    if (!iframe?.url) {
      return { pass: false, message: () => `Expected iframe, got ${iframe}` };
    }

    const u = new URL(iframe.url());

    if (expectedUrlDetails.pathname && u.pathname !== `${expectedUrlDetails.pathname}/embed`) {
      return { pass: false, message: () => `Expected pathname ${expectedUrlDetails.pathname}/embed` };
    }

    // Check linkReady event was fired
    const iframeReady = await waitForAction(getActionFiredDetails, calNamespace, "linkReady");
    if (!iframeReady) {
      return { pass: false, message: () => "Iframe not ready to communicate with parent" };
    }

    return { pass: true, message: () => "passed" };
  },
});
```

---

### Email Testing (Mailhog)

```bash
docker run -d -p 8025:8025 -p 1025:1025 mailhog/mailhog
```

```typescript
// In tests requiring email verification
test("user receives booking confirmation email", async ({ page, users, emails }) => {
  const user = await users.create();
  await bookFirstEvent(page);

  const inbox = await emails.waitForMessage({ to: testEmail });
  expect(inbox.subject).toContain("confirmed");
  expect(inbox.body).toContain("30 min");
});
```

> **Note:** Set `E2E_TEST_MAILHOG_ENABLED=1` in `.env` to enable email capture.

---

### Running E2E Tests

| Command | Description |
|---------|-------------|
| `yarn db-seed && yarn e2e` | Seed database, then run main app tests |
| `yarn playwright test booking-pages.e2e.ts` | Specific test file |
| `yarn playwright test --project=@saas/web` | Specific project (browser) |
| `PWDEBUG=1 yarn playwright test booking-pages.e2e.ts` | Debug mode — headed browser, single worker, step-by-step |
| `yarn playwright show-report test-results/reports/playwright-html-report` | View HTML report from last run |
| `QUICK=true yarn playwright test --project=@saas/app-store` | App store tests (uses QUICK=true to skip slow setup) |

---

## 5. Synthetic Monitoring — Checkly {#5-synthetic-monitoring--checkly}

### Philosophy

Runs **continuously against production** (or staging) to catch runtime failures that tests cannot:

- Expired credentials
- Third-party API outages
- CDN issues
- Deployment regressions

> **Note:** Not a replacement for E2E tests — these run 24/7 and alert on-call.

---

### Architecture

```mermaid
flowchart LR
    subgraph Checkly["Checkly"]
        A[API Checks]
        B[Browser Checks]
    end
    
    subgraph Prod["Production/Staging"]
        C[Web App]
        D[API]
    end
    
    A -->|Every 10 min| D
    B -->|Every 10 min| C
    
    A --> E[Alert on failure]
    B --> E
```

---

### Config (`checkly.config.ts`)

```typescript
import { defineConfig } from "checkly";

const config = defineConfig({
  projectName: "my-saas-app",
  logicalId:   "my-saas-app",
  repoUrl:     "https://github.com/your-org/your-repo",

  checks: {
    frequency:  10,                          // run every 10 minutes
    locations:  ["us-east-1", "eu-west-1"], // multi-region coverage
    tags:       ["production"],
    runtimeId:  "2023.02",                  // Node + Playwright version bundle

    // API checks — lightweight HTTP assertions
    checkMatch: "**/__checks__/**/*.check.ts",

    // Browser checks — reuse Playwright .spec.ts files directly
    browserChecks: {
      testMatch: "**/__checks__/**/*.spec.ts",
    },
  },

  cli: {
    runLocation: "eu-west-1",
    reporters: ["list"],
  },
});

export default config;
```

---

### File Structure

```
__checks__/
  api/
    health.check.ts           # API availability check
    auth-endpoint.check.ts    # Auth API response time + correctness
  browser/
    login-flow.spec.ts        # Full login flow in real browser
    booking-flow.spec.ts      # Core booking path
```

---

### API Check Example

```typescript
// __checks__/api/health.check.ts
import { ApiCheck, AssertionBuilder } from "checkly/constructs";

new ApiCheck("health-check", {
  name: "API Health",
  activated: true,
  request: {
    url: `${process.env.NEXT_PUBLIC_WEBAPP_URL}/api/health`,
    method: "GET",
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.responseTime().lessThan(2000),
      AssertionBuilder.jsonBody("$.status").equals("ok"),
    ],
  },
});
```

---

### Browser Check Example

```typescript
// __checks__/browser/login-flow.spec.ts
// This is a standard Playwright test — Checkly runs it as-is
import { test, expect } from "@playwright/test";

test("user can log in to production", async ({ page }) => {
  await page.goto(process.env.NEXT_PUBLIC_WEBAPP_URL!);
  await page.fill('[data-testid="email"]', process.env.CHECK_USER_EMAIL!);
  await page.fill('[data-testid="password"]', process.env.CHECK_USER_PASSWORD!);
  await page.click('[data-testid="login-button"]');
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10_000 });
});
```

---

### When to Use Synthetic vs E2E

| Concern | Synthetic (Checkly) | E2E (Playwright) |
|---------|:-------------------:|:-----------------:|
| Production uptime | ✅ | ❌ |
| Third-party API health | ✅ | ❌ |
| Deployment regression (post-deploy) | ✅ | ✅ |
| New feature correctness | ❌ | ✅ |
| Runs in CI on every PR | ❌ | ✅ |
| Frequency | 10 min continuous | On commit |

---

## 6. Decision Guide {#6-decision-guide}

### Which Tier to Write

```mermaid
flowchart TD
    A[Does the test require a browser or UI interaction?] -->|YES| B[E2E Test - Playwright]
    A -->|NO| C[Does the test verify production is alive/healthy?]
    C -->|YES| D[Synthetic Monitor - Checkly]
    C -->|NO| E[Does the test need to verify real DB query correctness?]
    E -->|YES| F[Integration Test - real Prisma, .integration-test.ts]
    E -->|NO| G[Is it a pure function, algorithm, component, or utility?]
    G -->|YES| H[Unit Test - prismock/vi.mock, .test.ts]
```

### Text Decision Tree

```
┌─ Does the test require a browser or UI interaction?
│   YES → E2E Test (Playwright)
│
├─ Does the test verify production is alive/healthy?
│   YES → Synthetic Monitor (Checkly)
│
├─ Does the test need to verify real DB query correctness?
│   YES → Integration Test (real Prisma, .integration-test.ts)
│
└─ Is it a pure function, algorithm, component, or utility?
    YES → Unit Test (prismock/vi.mock, .test.ts)
```

---

### Specific Scenarios

| Scenario | Tier | Reason |
|----------|------|--------|
| Round-robin user selection algorithm | Unit + Integration | Unit for logic, integration for DB correctness |
| Booking form renders correct fields | Unit (jsdom) | No backend needed |
| Prisma query with 4-way join | Integration | Real DB reveals query issues mocks hide |
| User completes full booking flow | E2E | Requires real UI + API + DB |
| Timezone boundary at midnight | Integration (with TZ=) | Timezone math must run in the target timezone |
| Login page responds in < 2s on prod | Synthetic | Only detectable in production |
| tRPC endpoint returns correct shape | Unit | Mock the DB, test the transformer |
| Email is sent after booking | E2E (Mailhog) | Requires full stack + email capture |
| OAuth callback stores tokens | Integration | DB write correctness, no UI needed |

---

## 7. CI/CD Pipeline {#7-cicd-pipeline}

### Job Architecture

```mermaid
flowchart TB
    subgraph CI["CI/CD Pipeline"]
        U[unit-tests]
        I[integration-tests]
        T[timezone-tests]
        E[e2e-tests]
        S[synthetic-deploy-check]
    end
    
    U --> I
    U --> T
    I --> E
    T --> E
    E -->|main branch only| S
    
    style U fill:#e8f5e9
    style I fill:#e3f2fd
    style T fill:#e3f2fd
    style E fill:#fff3e0
    style S fill:#fce4ec
```

### Workflow Configuration

```yaml
# .github/workflows/ci.yml
jobs:

  # ── Tier 1: Fast feedback ──────────────────────────────────────────────────
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn install --frozen-lockfile
      - run: yarn test
      - run: yarn type-check:ci

  # ── Tier 2: DB-dependent ───────────────────────────────────────────────────
  integration-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: testdb }
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - run: yarn vitest --integrationTestsOnly
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb

  # ── Timezone variants ──────────────────────────────────────────────────────
  timezone-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        tz: ["America/New_York", "Europe/London", "Asia/Kolkata", "Australia/Sydney"]
    steps:
      - run: yarn vitest --timeZoneDependentTestsOnly
        env:
          TZ: ${{ matrix.tz }}
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

  # ── Tier 3: Full-stack ─────────────────────────────────────────────────────
  e2e-tests:
    needs: [unit-tests, integration-tests]
    runs-on: ubuntu-latest
    steps:
      - run: yarn workspace @saas/prisma db-seed
      - run: yarn e2e
        env:
          CI: true
          NEXTAUTH_URL: http://localhost:3000
          NEXT_PUBLIC_WEBAPP_URL: http://localhost:3000
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      # Upload artifacts on failure for debugging
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: test-results/reports/playwright-html-report/

  # ── Tier 4: Post-deploy synthetic ─────────────────────────────────────────
  synthetic-deploy-check:
    needs: e2e-tests
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: npx checkly test --reporter=github
        env:
          CHECKLY_API_KEY: ${{ secrets.CHECKLY_API_KEY }}
          CHECKLY_ACCOUNT_ID: ${{ secrets.CHECKLY_ACCOUNT_ID }}
```

---

### CI Behaviour Checklist

| Behaviour | Config | Reason |
|-----------|--------|--------|
| Fail on `test.only` | `forbidOnly: true` | Prevents accidentally scoped suites in CI |
| 2 retries on E2E failure | `retries: 2` | Tolerates transient flakiness |
| Stop after 10 E2E failures | `maxFailures: 10` | Fast feedback, avoid burning runner minutes |
| Full CPU workers | `workers: os.cpus().length` | Maximum parallelism |
| Traces on failure | `trace: "retain-on-failure"` | Post-mortem debugging without re-running |
| JUnit XML output | reporter config | Integrates with GitHub PR test summaries |

---

## 8. Naming & File Conventions {#8-naming--file-conventions}

### Test File Suffixes (Reserved)

| Suffix | Tier | Environment |
|--------|------|--------------|
| `.test.ts` / `.spec.ts` | Unit | Node or jsdom |
| `.integration-test.ts` | Integration | Node + real DB |
| `.timezone.test.ts` | Timezone unit | Node (requires TZ) |
| `.e2e.ts` / `.e2e.tsx` | E2E | Playwright browser |
| `.check.ts` | Synthetic API | Checkly |

> **Note:** Do not use dot-suffixes for non-test files. No `.service.ts`, `.repository.ts`, `.controller.ts` — these belong as plain PascalCase class files.

---

### Class File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Repository | `Prisma<Entity>Repository.ts` | `PrismaUserRepository.ts`, `PrismaBookingRepository.ts` |
| Service | `<Entity>Service.ts` | `MembershipService.ts`, `HashedLinkService.ts`, `UserCreationService.ts` |

**Rules:**

- Repository files: `Prisma<Entity>Repository.ts` (PascalCase, matches exported class name)
- Service files: `<Entity>Service.ts` (PascalCase, matches exported class name)
- Avoid generic names: `AppService.ts` is bad; `AppInstallationService.ts` is good

---

### Folder Structure

```
packages/
  lib/
    server/
      getLuckyUser.ts
      getLuckyUser.test.ts                      # unit
      getLuckyUser.integration-test.ts          # integration (real DB)
      repository/
        PrismaUserRepository.ts                 # Prisma + Entity + Repository
        PrismaBookingRepository.ts
        organization.ts                         # plain repository (no Prisma prefix if generic)
        organization.test.ts
      service/
        UserCreationService.ts
        userCreationService.test.ts
      __mocks__/
        prismaMock.ts                           # Prisma mock for unit tests
        CalendarManager.ts                      # External service mock

apps/
  web/
    playwright/
      booking-pages.e2e.ts                       # feature + .e2e.ts
      event-types.e2e.ts
      lib/
        fixtures.ts                             # extend base test
        testUtils.ts                            # shared interaction helpers
      fixtures/
        users.ts                                # createUsersFixture()
        orgs.ts
        bookings.ts
        emails.ts

__checks__/
  api/
    health.check.ts
  browser/
    login-flow.spec.ts
    booking-flow.spec.ts
```

---

## 9. Performance Guidelines for Test Code {#9-performance-guidelines-for-test-code}

These apply to both test infrastructure and the production code being tested.

---

### Day.js in Hot Paths

```typescript
// ❌ Slow — timezone mode is expensive per call
users.filter(u => dayjs(u.createdAt).isAfter(dayjs().subtract(7, "days")));

// ✅ Fast — compare raw milliseconds
const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
users.filter(u => u.createdAt.valueOf() > sevenDaysAgo);

// ✅ If Day.js is needed, pin to UTC
dayjs.utc(u.createdAt).isAfter(dayjs.utc().subtract(7, "days")));
```

---

### Prisma: `select` Over `include`

```typescript
// ❌ Fetches ALL fields of the related table — includes credential.key
const user = await prisma.user.findUnique({
  where: { id },
  include: { credentials: true },
});

// ✅ Fetch only what you need
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    credentials: {
      select: { type: true, appId: true }  // never include .key
    },
  },
});
```

---

### Avoid O(n²) in Availability Logic

```typescript
// ❌ Nested loop over bookings for each user slot
slots.forEach(slot => {
  users.forEach(user => {
    user.bookings.forEach(booking => { /* O(n³) */ });
  });
});

// ✅ Pre-index bookings by userId once
const bookingsByUser = Map.groupBy(bookings, b => b.userId);
slots.forEach(slot => {
  users.forEach(user => {
    const userBookings = bookingsByUser.get(user.id) ?? [];
  });
});
```

---

### Credential Safety Rule

```typescript
// ❌ Leaks encrypted credential key through tRPC
router.query("getConnectedApps", {
  resolve: () => prisma.credential.findMany({ include: { app: true } })
});

// ✅ Explicitly exclude sensitive fields
router.query("getConnectedApps", {
  resolve: () => prisma.credential.findMany({
    select: { id: true, type: true, appId: true, app: { select: { name: true } } }
    // .key is never selected
  })
});
```

---

### Circular Dependency Check

Regularly audit for circular imports — they silently break tree-shaking and can cause runtime initialization errors:

```bash
yarn dlx madge --circular --extensions ts,tsx packages/lib/
```

---

## Appendix

> **Source:** Verified against the [cal.com](https://cal.com) open-source codebase (Next.js + tRPC + Prisma + Vitest + Playwright + Checkly). Generalises to any TypeScript SaaS product.
