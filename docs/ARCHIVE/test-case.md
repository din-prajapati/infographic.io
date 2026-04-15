Now I have the full picture. Here is the complete next-set-of-tests plan, built from the product docs and organized by feature area:                                                                                                  
                            
  ---                                                                                                                                                                                                                                   
  Current Test Coverage                                                                                                                                                                                                                                                                                                                                                                                                                                                         
  ┌─────────────────────────┬───────────────┬──────────────┬─────┐                                                                                                                                                                      
  │         Module          │     Unit      │ Integration  │ E2E │
  ├─────────────────────────┼───────────────┼──────────────┼─────┤
  │ Payments                │ ✅ 10 passing │ ✅ 4 passing │ ❌  │
  ├─────────────────────────┼───────────────┼──────────────┼─────┤
  │ Auth                    │ ❌            │ ❌           │ ❌  │
  ├─────────────────────────┼───────────────┼──────────────┼─────┤
  │ AI Chat / Conversations │ ❌            │ ❌           │ ❌  │
  ├─────────────────────────┼───────────────┼──────────────┼─────┤
  │ Infographic Generation  │ ❌            │ ❌           │ ❌  │
  ├─────────────────────────┼───────────────┼──────────────┼─────┤
  │ Usage Limits            │ ❌            │ ❌           │ ❌  │
  ├─────────────────────────┼───────────────┼──────────────┼─────┤
  │ Designs                 │ ❌            │ ❌           │ ❌  │
  ├─────────────────────────┼───────────────┼──────────────┼─────┤
  │ Templates               │ ❌            │ ❌           │ ❌  │
  ├─────────────────────────┼───────────────┼──────────────┼─────┤
  │ Account / Billing UI    │ ❌            │ ❌           │ ❌  │
  └─────────────────────────┴───────────────┴──────────────┴─────┘

  ---
  Next Tests — Prioritized by Risk

  Priority 1 — Auth Service (Blocks everything else)

  File: api/tests/auth/auth.service.spec.ts

  ┌─────┬─────────────────────────────────────────────────────────────────┬─────────────┬───────────────────────────┐
  │  #  │                              Test                               │    Type     │            Why            │
  ├─────┼─────────────────────────────────────────────────────────────────┼─────────────┼───────────────────────────┤
  │ 1   │ register() hashes password before storing                       │ Unit        │ Security                  │
  ├─────┼─────────────────────────────────────────────────────────────────┼─────────────┼───────────────────────────┤
  │ 2   │ register() rejects duplicate email → 409                        │ Unit        │ Data integrity            │
  ├─────┼─────────────────────────────────────────────────────────────────┼─────────────┼───────────────────────────┤
  │ 3   │ register() creates Organization with FREE plan + monthlyLimit=3 │ Unit        │ Core onboarding flow      │
  ├─────┼─────────────────────────────────────────────────────────────────┼─────────────┼───────────────────────────┤
  │ 4   │ register() returns { accessToken, user }                        │ Unit        │ API contract              │
  ├─────┼─────────────────────────────────────────────────────────────────┼─────────────┼───────────────────────────┤
  │ 5   │ login() returns JWT on valid credentials                        │ Unit        │ Core flow                 │
  ├─────┼─────────────────────────────────────────────────────────────────┼─────────────┼───────────────────────────┤
  │ 6   │ login() throws 401 on wrong password                            │ Unit        │ Security                  │
  ├─────┼─────────────────────────────────────────────────────────────────┼─────────────┼───────────────────────────┤
  │ 7   │ login() throws 401 on unknown email                             │ Unit        │ Security                  │
  ├─────┼─────────────────────────────────────────────────────────────────┼─────────────┼───────────────────────────┤
  │ 8   │ JWT payload contains sub, email, organizationId                 │ Unit        │ All guards depend on this │
  ├─────┼─────────────────────────────────────────────────────────────────┼─────────────┼───────────────────────────┤
  │ 9   │ googleLogin() creates user+org on first login                   │ Unit        │ OAuth path                │
  ├─────┼─────────────────────────────────────────────────────────────────┼─────────────┼───────────────────────────┤
  │ 10  │ googleLogin() links Google account to existing email            │ Unit        │ Account merge             │
  ├─────┼─────────────────────────────────────────────────────────────────┼─────────────┼───────────────────────────┤
  │ 11  │ Register → DB has correct User + Org records                    │ Integration │ Real Prisma               │
  ├─────┼─────────────────────────────────────────────────────────────────┼─────────────┼───────────────────────────┤
  │ 12  │ Login → JWT passes GET /auth/me protected route                 │ Integration │ Guard chain               │
  ├─────┼─────────────────────────────────────────────────────────────────┼─────────────┼───────────────────────────┤
  │ 13  │ Duplicate email → 409 from DB unique constraint                 │ Integration │ DB enforcement            │
  └─────┴─────────────────────────────────────────────────────────────────┴─────────────┴───────────────────────────┘

  ---
  Priority 2 — Usage Limits (Revenue protection)

  File: api/tests/infographics/usage-limits.integration.spec.ts

  ┌─────┬───────────────────────────────────────────────────────────────────┬─────────────┬────────────────────┐
  │  #  │                               Test                                │    Type     │        Why         │
  ├─────┼───────────────────────────────────────────────────────────────────┼─────────────┼────────────────────┤
  │ 14  │ FREE user at 0 → generation allowed                               │ Integration │ Happy path         │
  ├─────┼───────────────────────────────────────────────────────────────────┼─────────────┼────────────────────┤
  │ 15  │ FREE user at 3 → generation blocked with 429                      │ Integration │ Limit enforcement  │
  ├─────┼───────────────────────────────────────────────────────────────────┼─────────────┼────────────────────┤
  │ 16  │ SOLO user at 50 → generation blocked                              │ Integration │ Limit enforcement  │
  ├─────┼───────────────────────────────────────────────────────────────────┼─────────────┼────────────────────┤
  │ 17  │ TEAM user at 200 → generation blocked                             │ Integration │ Limit enforcement  │
  ├─────┼───────────────────────────────────────────────────────────────────┼─────────────┼────────────────────┤
  │ 18  │ UsageRecord is created and linked to Infographic after generation │ Integration │ Audit trail        │
  ├─────┼───────────────────────────────────────────────────────────────────┼─────────────┼────────────────────┤
  │ 19  │ getCurrentMonthUsage() returns 0 for new user                     │ Unit        │ Baseline           │
  ├─────┼───────────────────────────────────────────────────────────────────┼─────────────┼────────────────────┤
  │ 20  │ getCurrentMonthUsage() increments correctly after each generation │ Unit        │ Counter accuracy   │
  ├─────┼───────────────────────────────────────────────────────────────────┼─────────────┼────────────────────┤
  │ 21  │ Plan limit constants: FREE=3, SOLO=50, TEAM=200, BROKERAGE=1000   │ Unit        │ Config correctness │
  └─────┴───────────────────────────────────────────────────────────────────┴─────────────┴────────────────────┘

  ---
  Priority 3 — Infographics Service

  File: api/tests/infographics/infographics.service.spec.ts

  ┌─────┬──────────────────────────────────────────────────────────────────────────────────────┬─────────────┬─────────────────┐
  │  #  │                                         Test                                         │    Type     │       Why       │
  ├─────┼──────────────────────────────────────────────────────────────────────────────────────┼─────────────┼─────────────────┤
  │ 22  │ generate() creates Infographic with status=processing immediately (doesn't await AI) │ Unit        │ Non-blocking UX │
  ├─────┼──────────────────────────────────────────────────────────────────────────────────────┼─────────────┼─────────────────┤
  │ 23  │ generate() rejects when monthly limit reached                                        │ Unit        │ Limit gate      │
  ├─────┼──────────────────────────────────────────────────────────────────────────────────────┼─────────────┼─────────────────┤
  │ 24  │ generate() throws if user has no organization                                        │ Unit        │ Edge case       │
  ├─────┼──────────────────────────────────────────────────────────────────────────────────────┼─────────────┼─────────────────┤
  │ 25  │ Infographic status transitions: processing → completed after AI response             │ Integration │ AI pipeline     │
  ├─────┼──────────────────────────────────────────────────────────────────────────────────────┼─────────────┼─────────────────┤
  │ 26  │ Infographic status transitions: processing → failed on AI error                      │ Integration │ Error path      │
  └─────┴──────────────────────────────────────────────────────────────────────────────────────┴─────────────┴─────────────────┘

  ---
  Priority 4 — Conversations / AI Chat

  File: api/tests/conversations/conversations.service.spec.ts

  ┌─────┬───────────────────────────────────────────────────────────────────────────────────┬─────────────┬─────────────────────┐
  │  #  │                                       Test                                        │    Type     │         Why         │
  ├─────┼───────────────────────────────────────────────────────────────────────────────────┼─────────────┼─────────────────────┤
  │ 27  │ Create new conversation → returns { id, title, messages: [] }                     │ Unit        │ Chat initialization │
  ├─────┼───────────────────────────────────────────────────────────────────────────────────┼─────────────┼─────────────────────┤
  │ 28  │ Add user message → saved with type='user'                                         │ Unit        │ Message storage     │
  ├─────┼───────────────────────────────────────────────────────────────────────────────────┼─────────────┼─────────────────────┤
  │ 29  │ Add AI message → saved with type='ai'                                             │ Unit        │ Message storage     │
  ├─────┼───────────────────────────────────────────────────────────────────────────────────┼─────────────┼─────────────────────┤
  │ 30  │ List conversations → returns only current user's conversations                    │ Unit        │ Ownership isolation │
  ├─────┼───────────────────────────────────────────────────────────────────────────────────┼─────────────┼─────────────────────┤
  │ 31  │ Delete conversation → cascades messages                                           │ Integration │ FK cascade          │
  ├─────┼───────────────────────────────────────────────────────────────────────────────────┼─────────────┼─────────────────────┤
  │ 32  │ isFavorite toggle persists to DB                                                  │ Integration │ Feature correctness │
  ├─────┼───────────────────────────────────────────────────────────────────────────────────┼─────────────┼─────────────────────┤
  │ 33  │ Property extraction from prompt → Extraction record created with confidence score │ Integration │ Core AI feature     │
  ├─────┼───────────────────────────────────────────────────────────────────────────────────┼─────────────┼─────────────────────┤
  │ 34  │ Cannot access other user's conversation → 404/403                                 │ Unit        │ Authorization       │
  └─────┴───────────────────────────────────────────────────────────────────────────────────┴─────────────┴─────────────────────┘

  ---
  Priority 5 — Designs Service

  File: api/tests/designs/designs.service.spec.ts

  ┌─────┬────────────────────────────────────────────────────┬─────────────┬────────────────┐
  │  #  │                        Test                        │    Type     │      Why       │
  ├─────┼────────────────────────────────────────────────────┼─────────────┼────────────────┤
  │ 35  │ save() persists canvas JSON with user ownership    │ Unit        │ Save feature   │
  ├─────┼────────────────────────────────────────────────────┼─────────────┼────────────────┤
  │ 36  │ load() returns correct canvas JSON for owning user │ Unit        │ Load feature   │
  ├─────┼────────────────────────────────────────────────────┼─────────────┼────────────────┤
  │ 37  │ load() throws 404 for unknown designId             │ Unit        │ Error handling │
  ├─────┼────────────────────────────────────────────────────┼─────────────┼────────────────┤
  │ 38  │ load() throws 403 for another user's design        │ Unit        │ Ownership      │
  ├─────┼────────────────────────────────────────────────────┼─────────────┼────────────────┤
  │ 39  │ list() returns only current user's designs         │ Unit        │ Isolation      │
  ├─────┼────────────────────────────────────────────────────┼─────────────┼────────────────┤
  │ 40  │ Saved design survives page reload (round-trip DB)  │ Integration │ Data integrity │
  └─────┴────────────────────────────────────────────────────┴─────────────┴────────────────┘

  ---
  Priority 6 — Usage Analytics

  File: api/tests/payments/usage-analytics.service.spec.ts

  ┌─────┬─────────────────────────────────────────────────────────────┬──────┬────────────────┐
  │  #  │                            Test                             │ Type │      Why       │
  ├─────┼─────────────────────────────────────────────────────────────┼──────┼────────────────┤
  │ 41  │ getMonthlyUsage() returns exactly 6 months of data          │ Unit │ Chart data     │
  ├─────┼─────────────────────────────────────────────────────────────┼──────┼────────────────┤
  │ 42  │ getMonthlyUsage() includes current month with correct count │ Unit │ Accuracy       │
  ├─────┼─────────────────────────────────────────────────────────────┼──────┼────────────────┤
  │ 43  │ getCostBreakdown() groups correctly by aiModel              │ Unit │ Cost reporting │
  ├─────┼─────────────────────────────────────────────────────────────┼──────┼────────────────┤
  │ 44  │ exportUsageDataCsv() returns valid CSV headers + rows       │ Unit │ Export feature │
  ├─────┼─────────────────────────────────────────────────────────────┼──────┼────────────────┤
  │ 45  │ getUsageHistory() filters by date range correctly           │ Unit │ Filtering      │
  └─────┴─────────────────────────────────────────────────────────────┴──────┴────────────────┘

  ---
  Priority 7 — Webhook Security

  File: api/tests/payments/webhook-security.spec.ts

  ┌─────┬─────────────────────────────────────────────────────────┬─────────────┬────────────────┐
  │  #  │                          Test                           │    Type     │      Why       │
  ├─────┼─────────────────────────────────────────────────────────┼─────────────┼────────────────┤
  │ 46  │ Valid HMAC signature → accepted (200)                   │ Unit        │ Security       │
  ├─────┼─────────────────────────────────────────────────────────┼─────────────┼────────────────┤
  │ 47  │ Tampered payload → rejected (401)                       │ Unit        │ Security       │
  ├─────┼─────────────────────────────────────────────────────────┼─────────────┼────────────────┤
  │ 48  │ Wrong secret → rejected                                 │ Unit        │ Security       │
  ├─────┼─────────────────────────────────────────────────────────┼─────────────┼────────────────┤
  │ 49  │ Duplicate webhook event → idempotent (no double-credit) │ Integration │ Data integrity │
  ├─────┼─────────────────────────────────────────────────────────┼─────────────┼────────────────┤
  │ 50  │ Missing signature header → rejected (401)               │ Unit        │ Security       │
  └─────┴─────────────────────────────────────────────────────────┴─────────────┴────────────────┘

  ---
  Priority 8 — E2E (Playwright) — After unit/integration complete

  Install: npx playwright install --with-deps chromium

  ┌─────────────────────────────┬──────────────────────┬───────────────────────────────────────────────┐
  │           Journey           │         File         │                Key assertions                 │
  ├─────────────────────────────┼──────────────────────┼───────────────────────────────────────────────┤
  │ Register → Templates        │ e2e/auth.e2e.ts      │ Lands on /templates, JWT stored               │
  ├─────────────────────────────┼──────────────────────┼───────────────────────────────────────────────┤
  │ Login / Logout              │ e2e/auth.e2e.ts      │ Logout clears session, redirect to /auth      │
  ├─────────────────────────────┼──────────────────────┼───────────────────────────────────────────────┤
  │ Protected route guard       │ e2e/auth.e2e.ts      │ Unauthenticated → /auth                       │
  ├─────────────────────────────┼──────────────────────┼───────────────────────────────────────────────┤
  │ Browse + filter templates   │ e2e/templates.e2e.ts │ Filter by category/property type works        │
  ├─────────────────────────────┼──────────────────────┼───────────────────────────────────────────────┤
  │ Open editor from template   │ e2e/editor.e2e.ts    │ Canvas loads with template content            │
  ├─────────────────────────────┼──────────────────────┼───────────────────────────────────────────────┤
  │ Save design → My Designs    │ e2e/editor.e2e.ts    │ Appears in /my-designs                        │
  ├─────────────────────────────┼──────────────────────┼───────────────────────────────────────────────┤
  │ AI chat → submit property   │ e2e/ai-chat.e2e.ts   │ Progress indicator shows, infographic created │
  ├─────────────────────────────┼──────────────────────┼───────────────────────────────────────────────┤
  │ Account billing tab         │ e2e/account.e2e.ts   │ Current plan name visible                     │
  ├─────────────────────────────┼──────────────────────┼───────────────────────────────────────────────┤
  │ Account usage tab           │ e2e/account.e2e.ts   │ Usage bar renders correctly                   │
  ├─────────────────────────────┼──────────────────────┼───────────────────────────────────────────────┤
  │ PT-05 verify: TEAM = ₹6,999 │ e2e/pricing.e2e.ts   │ RazorPay modal shows correct amount           │
  └─────────────────────────────┴──────────────────────┴───────────────────────────────────────────────┘

  ---
  Suggested Build Order

  Week 1:  Auth unit tests (13 tests)       → api/tests/auth/
  Week 1:  Usage limits integration (8)     → api/tests/infographics/
  Week 2:  Infographics service unit (6)    → api/tests/infographics/
  Week 2:  Conversations unit (8)           → api/tests/conversations/
  Week 3:  Designs + Analytics unit (11)    → api/tests/designs/ + payments/
  Week 3:  Webhook security (5)             → api/tests/payments/
  Week 4:  E2E critical paths              → e2e/

  Total: ~50 unit/integration tests + ~15 E2E — brings coverage from 0% to ~70% on critical paths. Implement them one file at a time and I can write each one the same way the payments tests were built.