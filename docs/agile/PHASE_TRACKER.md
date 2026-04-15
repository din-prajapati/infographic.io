# Phase Tracker — InfographicAI Product Delivery

> **Audience:** Executives, product owners, stakeholders  
> **Purpose:** Single-page view of delivery progress across all product phases — from MVP to B2B scale.  
> **Update cadence:** After each milestone closes or phase gate decision.  
> **Last updated:** 2026-04-15

---

## Phase Overview — At a Glance

| Phase | Release | Business Outcome | Status | Complete | Target |
|-------|---------|-----------------|--------|----------|--------|
| [Phase 0](#phase-0--mvp-launch) | v1.0 | Working product in production | 🟡 In Progress | **98%** | Week 1 of launch |
| [Phase 1](#phase-1--release-11-usage--payments) | v1.1 | Users understand and manage their usage | 🔲 Not Started | 0% | Week 2–3 post-launch |
| [Phase 2](#phase-2--release-12-billing--quality) | v1.2 | Stripe live, self-serve billing portal, refined AI output | 🔲 Not Started | 0% | Month 2 |
| [Phase 3](#phase-3--release-13-speed--batch) | v1.3 | Fast generation, batch uploads, volume pricing | 🔲 Not Started | 0% | Month 3 |
| [Phase 4](#phase-4--release-20-b2b-api) | v2.0 | Developers can build on InfographicAI via API | 🔲 Not Started | 0% | Month 3–4 |
| [Phase 5](#phase-5--release-21-analytics--optimization) | v2.1 | Admin visibility, AI cost optimization, performance | 🔲 Not Started | 0% | Month 5–6 |
| [Phase 6](#phase-6--release-22-production-hardening) | v2.2 | Enterprise-grade reliability, test coverage, mobile | 🔲 Not Started | 0% | Month 7+ |

**Current Focus:** Close Phase 0 (3 human tasks). Start Phase 1 planning in parallel.

---

## Phase Gates

Each phase requires a gate decision before the next phase starts:

| Gate | Criteria | Owner |
|------|----------|-------|
| **G0 → G1** | Phase 0 deployed to production + Sentry live | Dinesh |
| **G1 → G2** | Phase 1 epics closed + usage analytics visible to users | Dinesh |
| **G2 → G3** | Stripe live + billing portal tested | Dinesh |
| **G3 → G4** | Batch processing < 5s per item + volume pricing live | Dinesh |
| **G4 → G5** | B2B API key management + developer portal live | Dinesh |
| **G5 → G6** | Admin dashboard live + AI cost per request < target | Dinesh |

---

---

## Phase 0 — MVP Launch

> **Release:** v1.0 · **Status:** 🟡 98% Complete · **3 human tasks remain**  
> **Outcome:** Real estate agents can generate branded infographics, manage subscriptions, and export their work.  
> **Timeline:** Week 1 (human tasks ~3 hours)

### Gate Criteria (Phase 0 → Done)
- [x] Core infrastructure: auth, API, DB, AI generation pipeline
- [x] RazorPay payments: SOLO + TEAM × monthly/annual — checkout, webhooks, plan change
- [x] Canvas editor: add text, shapes, images, drag-resize, export
- [x] CI/CD: Railway configured, Sentry DSN set
- [ ] Critical-path 10-flow manual test — **HUMAN TASK 1**
- [ ] Staging smoke test (Railway) — **HUMAN TASK 2**
- [ ] Production go-live + Sentry verify — **HUMAN TASK 3**

### Epics in Phase 0

| Epic | Domain | Focus | Epics Status | Stories |
|------|--------|-------|------|---------|
| EPIC-PAY-01 | Payments | RazorPay subscriptions, webhooks, plan enforcement | ✅ Done | All closed |
| EPIC-DESIGN-01 | Design | UI theme consistency, editor token fix | 🟡 In Progress | [4 stories →](epics/EPIC-DESIGN-01/EPIC.md) |
| EPIC-AUTH-01 | Auth | JWT + Google OAuth, user limits | ✅ Done | All closed |
| EPIC-EDIT-01 | Editor | Canvas CRUD, export | ✅ Done | All closed |
| EPIC-AI-01 | AI | GPT-4o + Ideogram generation pipeline | ✅ Done | All closed |
| EPIC-INFRA-01 | Infra | Railway + Sentry + DB migrations | 🟡 In Progress | Deploy tasks pending |

> Epics not yet in `docs/agile/epics/` are tracked in [docs/MVP_LAUNCH_TRACKER.md](../MVP_LAUNCH_TRACKER.md) (legacy flat tracker).

### Completion Rollup

| Category | Done | Total | % |
|----------|------|-------|---|
| Backend code | 100% | 100% | ✅ |
| Frontend code | 100% | 100% | ✅ |
| Payment QA | 40/40 TCs | 40 TCs | ✅ |
| Automated tests | 43 tests | 43 tests | ✅ |
| **Deployment** | 0/3 HUMAN tasks | 3 tasks | ⏳ |
| **EPIC-DESIGN-01 Phase B** | 0/1 PRs | 1 PR | 🔲 |

**Overall Phase 0: 98%**

---

## Phase 1 — Release 1.1: Usage & Payments

> **Release:** v1.1 · **Status:** 🔲 Not Started  
> **Outcome:** Subscribed users see a live usage dashboard, know when they're approaching limits, and can manage their payment method without contacting support.  
> **Timeline:** Week 2–3 post-launch · **Effort:** ~15–20 hours

### Gate Criteria (Phase 0 → Phase 1)
- [ ] Phase 0 production deployed
- [ ] At least 1 real paying subscriber on production

### Planned Epics

| Epic | Domain | Focus | Status |
|------|--------|-------|--------|
| EPIC-USAGE-01 | Usage | Monthly chart, cost breakdown, usage alerts | 🔲 Plan |
| EPIC-PAY-02 | Payments | Payment method management UI | 🔲 Plan |

> Create these epics in `docs/agile/epics/` when Phase 0 gate clears.

### Scope Summary (from PRD)

| # | Feature | Domain | Effort |
|---|---------|--------|--------|
| 1.1 | Monthly Usage Chart (by plan tier) | USAGE | 4–6 h |
| 1.2 | Cost Breakdown by AI Model (GPT-4o vs Ideogram) | USAGE | 3–4 h |
| 1.3 | Usage Alerts (% threshold notifications) | USAGE | 2–3 h |
| 1.4 | Payment Method Management UI | PAY | 4–6 h |
| 1.5 | Unit tests for usage analytics service | USAGE | 2–3 h |

---

## Phase 2 — Release 1.2: Billing & Quality

> **Release:** v1.2 · **Status:** 🔲 Not Started  
> **Outcome:** Stripe is live as a second payment option; users can self-serve their billing history; AI-generated infographics are higher quality and more refined.  
> **Timeline:** Month 2 · **Effort:** ~20–28 hours

### Planned Epics

| Epic | Domain | Focus | Status |
|------|--------|-------|--------|
| EPIC-PAY-03 | Payments | Stripe activation + billing portal | 🔲 Plan |
| EPIC-AI-02 | AI | Multi-pass refinement, quality scoring | 🔲 Plan |
| EPIC-USAGE-02 | Usage | Historical reports, data export | 🔲 Plan |

### Scope Summary

| # | Feature | Domain | Effort |
|---|---------|--------|--------|
| 2.1 | Stripe account setup + test checkout | PAY | 1–2 h |
| 2.2 | Billing Portal UI (invoices, history) | PAY | 6–8 h |
| 2.3 | Historical Usage Reports | USAGE | 4–6 h |
| 2.4 | Export Usage Data (CSV) | USAGE | 2–3 h |
| 2.5 | Multi-pass AI Refinement | AI | 4–6 h |
| 2.6 | Quality Scoring System | AI | 2–3 h |

---

## Phase 3 — Release 1.3: Speed & Batch

> **Release:** v1.3 · **Status:** 🔲 Not Started  
> **Outcome:** Generation is 3× faster; brokerages can bulk-generate from CSV; volume pricing unlocks API-tier customers.  
> **Timeline:** Month 3 · **Effort:** ~30–40 hours

### Planned Epics

| Epic | Domain | Focus | Status |
|------|--------|-------|--------|
| EPIC-AI-03 | AI | Caching, parallel processing, pre-rendering | 🔲 Plan |
| EPIC-EDIT-02 | Editor | Batch upload UI, progressive generation UX | 🔲 Plan |
| EPIC-PAY-04 | Payments | Volume-based pricing tiers | 🔲 Plan |

### Scope Summary

| # | Feature | Domain | Effort |
|---|---------|--------|--------|
| 3.1 | Intelligent Caching (prompt → result) | AI | 4–6 h |
| 3.2 | Template Pre-rendering | EDIT | 4–6 h |
| 3.3 | Progressive Generation UI | EDIT | 4–6 h |
| 3.4 | Batch CSV/Excel Upload | EDIT | 4–6 h |
| 3.5 | Parallel Processing & Job Queue | INFRA | 4–6 h |
| 3.6 | Volume-based Pricing | PAY | 8–10 h |

---

## Phase 4 — Release 2.0: B2B API

> **Release:** v2.0 · **Status:** 🔲 Not Started  
> **Outcome:** Developers and PropTech companies can integrate InfographicAI generation into their own products via a documented REST API with key management, rate limiting, and webhooks.  
> **Timeline:** Month 3–4 · **Effort:** ~85–125 hours

### Planned Epics

| Epic | Domain | Focus | Status |
|------|--------|-------|--------|
| EPIC-API-01 | API | Key management, rate limiting, scoping | 🔲 Plan |
| EPIC-API-02 | API | Webhook delivery, retries, dev portal | 🔲 Plan |

### Scope Summary

| # | Feature | Domain | Effort |
|---|---------|--------|--------|
| 4.1–4.5 | API Key Management (gen, rotate, scope, rate-limit, analytics) | API | 19–28 h |
| 4.6–4.7 | Webhook Configuration + Delivery & Retries | API | 12–16 h |
| 4.8 | Developer Portal (docs, playground) | API | 37–56 h |

---

## Phase 5 — Release 2.1: Analytics & Optimization

> **Release:** v2.1 · **Status:** 🔲 Not Started  
> **Outcome:** Operators have a real-time admin dashboard showing revenue, usage, and error rates; AI cost per generation is optimized below target margins.  
> **Timeline:** Month 5–6 · **Effort:** ~110–170 hours

### Planned Epics

| Epic | Domain | Focus | Status |
|------|--------|-------|--------|
| EPIC-INFRA-02 | Infra | Admin dashboard, performance instrumentation | 🔲 Plan |
| EPIC-AI-04 | AI | Model cost optimization | 🔲 Plan |

---

## Phase 6 — Release 2.2: Production Hardening

> **Release:** v2.2 · **Status:** 🔲 Not Started  
> **Outcome:** Enterprise-grade reliability — 99.9% uptime, full test coverage (unit + integration + E2E), security audit passed, mobile app available.  
> **Timeline:** Month 7+ · **Effort:** ~200–300 hours

### Planned Epics

| Epic | Domain | Focus | Status |
|------|--------|-------|--------|
| EPIC-INFRA-03 | Infra | Security audit, load testing, 99.9% SLA | 🔲 Plan |
| EPIC-TEST-01 | Testing | Full unit/integration/E2E coverage | 🔲 Plan |
| EPIC-MOBILE-01 | Mobile | React Native or PWA mobile app | 🔲 Plan |

---

## How Phase % Is Calculated

```
Phase % = (Stories with status ✅ Done) / (Total stories in phase) × 100

Where a "story" = one STORY.md file in docs/agile/epics/{epic}/stories/
```

For phases without epics yet created in `docs/agile/epics/`, use the legacy task count from [docs/MVP_LAUNCH_TRACKER.md](../MVP_LAUNCH_TRACKER.md).

As new epics are added, update the Planned Epics table and the % rollup in the At-a-Glance table at the top.

---

## How to Update This Document

1. When a **story closes:** Update the epic's story status → recalculate phase %
2. When a **milestone closes:** Update the epic status row in the relevant phase
3. When an **epic closes:** Tick the epic in the phase table → update "Complete %" at top
4. When a **phase gate passes:** Update gate criteria checkboxes → move to next phase
5. When **planning a new phase:** Fill in "Planned Epics" and create epic folders from template

---

*See also: [AGILE_INDEX.md](AGILE_INDEX.md) · [TEAM_STATUS.md](TEAM_STATUS.md) · [../MVP_LAUNCH_TRACKER.md](../MVP_LAUNCH_TRACKER.md)*
