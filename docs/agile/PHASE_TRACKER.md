# Phase Tracker — InfographicAI Product Delivery

> **Audience:** Executives, product owners, stakeholders  
> **Purpose:** Single-page view of delivery progress across all product phases — from MVP to B2B scale.  
> **Update cadence:** After each milestone closes or phase gate decision.  
> **Last updated:** 2026-07-07 (EPIC-LAUNCH-01 added; Phase 1 re-ranked around beta-live / revenue-on gates; AI Chat Panel audit + hardening logged as PT-08 in [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) — no phase/gate change)

---

## Phase Overview — At a Glance

| Phase | Release | Business Outcome | Status | Complete | Target |
|-------|---------|-----------------|--------|----------|--------|
| [Phase 0](#phase-0--mvp-launch) | v1.0 | Working product in production | 🟡 In Progress | **98%** | Week 1 of launch |
| [Phase 1](#phase-1--release-11-revenue-strategy) | v1.1 | **Revenue strategy** — go-live/revenue readiness (EPIC-LAUNCH-01), real-photo hybrid, listing kits | 🔲 Not Started | 0% | Beta: mid-Jul · Revenue: mid-Aug |
| [Phase 2](#phase-2--release-12-polish--self-serve) | v1.2 | Conversational polish, refine loop, usage/billing self-serve | 🔲 Not Started | 0% | After Phase 1 gate |
| [Phase 3](#phase-3--release-13-speed--batch) | v1.3 | Fast generation, batch uploads, volume pricing | 🔲 Not Started | 0% | Month 3 |
| [Phase 4](#phase-4--release-20-b2b-api) | v2.0 | Developers can build on InfographicAI via API | 🔲 Not Started | 0% | Month 3–4 |
| [Phase 5](#phase-5--release-21-analytics--optimization) | v2.1 | Admin visibility, AI cost optimization, performance | 🔲 Not Started | 0% | Month 5–6 |
| [Phase 6](#phase-6--release-22-production-hardening) | v2.2 | Enterprise-grade reliability, test coverage, mobile | 🔲 Not Started | 0% | Month 7+ |

**Current Focus:** ① Close Phase 0 (3 HUMAN deploy tasks + 2 staging QA items — there is no URL to send anyone to until this is done). ② M-LAUNCH-01 + M-OBS-01 → free public beta. ③ EPIC-AI-06 + M-LAUNCH-02 → revenue on. Full path: [ROADMAP.md](ROADMAP.md)

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

> **Release:** v1.0 · **Status:** 🟡 ~99% Complete · **3 deploy tasks + 2 staging QA items remain**  
> **Outcome:** Real estate agents can generate branded infographics, manage subscriptions, and export their work.  
> **Last updated:** 2026-04-29 · **Timeline:** Deploy when staging ready

### Gate Criteria (Phase 0 → Done)
- [x] Core infrastructure: auth, API, DB, AI generation pipeline
- [x] RazorPay payments: SOLO + TEAM × monthly/annual — checkout, webhooks, plan change
- [x] Canvas editor: add text, shapes, images, drag-resize, export
- [x] CI/CD: Railway configured, Sentry DSN set
- [x] Design token system: Blue/Amber/Warm-Cream palette, Outfit font, domain colors ✅ 2026-04-23
- [x] UI consistency: hover tokens (14 fixes), ai-accent brand token, Danger Zone buttons ✅ 2026-04-29
- [x] Human QA: US-DESIGN-001 theme toggle + 3 bugs found & fixed ✅ 2026-04-29
- [x] Auto QA: 44/58 E2E tests pass (10 human-skip, 4 pre-existing auth failures) ✅ 2026-04-29
- [ ] US-DESIGN-003 AC3 — generation result image on staging — **STAGING QA**
- [ ] US-DESIGN-004 AC2–4,6 — button heights, card borders, spacing — **STAGING QA**
- [ ] Critical-path 10-flow manual test — **HUMAN TASK 1**
- [ ] Staging smoke test (Railway) — **HUMAN TASK 2**
- [ ] Production go-live + Sentry verify — **HUMAN TASK 3**

### Epics in Phase 0

| Epic | Domain | Focus | Status | Stories / Notes |
|------|--------|-------|--------|-----------------|
| EPIC-PAY-01 | Payments | RazorPay subscriptions, webhooks, plan enforcement | ✅ Done | All closed |
| EPIC-AUTH-01 | Auth | JWT + Google OAuth, user limits | ✅ Done | All closed |
| EPIC-EDIT-01 | Editor | Canvas CRUD, export | ✅ Done | All closed |
| EPIC-AI-01 | AI | GPT-4o + Ideogram generation pipeline | ✅ Done | All closed |
| [EPIC-DESIGN-01](epics/phase-0-mvp/EPIC-DESIGN-01/EPIC.md) | Design | UI theme consistency, editor token fix | 🟡 In Progress | US-001 ✅ US-002 ✅ US-003 🟡 US-004 🟡 |
| [EPIC-DESIGN-02](epics/phase-0-mvp/EPIC-DESIGN-02/EPIC.md) | Design | Blue/Amber/Warm-Cream palette + domain colors | ✅ Done (P0 scope) | US-005–008 ✅ · US-009–011 → Phase 4 Backlog |
| EPIC-INFRA-01 | Infra | Railway + Sentry + DB migrations | 🟡 In Progress | Code ✅ · 3 deploy tasks pending |

> Epics not yet in `docs/agile/epics/` are tracked in [docs/MVP_LAUNCH_TRACKER.md](../MVP_LAUNCH_TRACKER.md) (legacy flat tracker).

### Completion Rollup

| Category | Done | Total | % |
|----------|------|-------|---|
| Backend code | 100% | 100% | ✅ |
| Frontend code | 100% | 100% | ✅ |
| Payment QA | 40/40 TCs | 40 TCs | ✅ |
| Automated E2E tests | 44 pass / 10 human-skip | 58 | ✅ |
| Design token system | M-DESIGN-03 + M-DESIGN-04 closed | 2 milestones | ✅ |
| UI consistency fixes | 14 hover tokens + ai-accent brand token | Done | ✅ |
| Human QA — US-DESIGN-001 | ✅ Verified + 3 bugs fixed | Done | ✅ |
| Human QA — US-DESIGN-003 | 5/6 ACs ✅ · AC3 staging | Partial | 🟡 |
| Human QA — US-DESIGN-004 | AC1,5 ✅ · AC2–4,6 staging | Partial | 🟡 |
| **Deployment** | 0/3 HUMAN tasks | 3 tasks | ⏳ |

**Overall Phase 0: ~99%** _(staging + 3 deploy tasks gate the final 1%)_

**Last updated:** 2026-04-29

---

## Phase 1 — Release 1.1: Revenue Strategy

> **Release:** v1.1 · **Status:** 🔲 Not Started · **Re-ranked 2026-07-07 (launch-readiness assessment)**  
> **Outcome:** The product is publicly live as a free beta, then earns its price against Canva/Ideogram-direct: agents market with their REAL listing photos, revenue is collected on live RazorPay with receipts and password recovery, and listing kits retain subscribers.  
> **Rationale:** [docs/research/2026-07-03-V4-PIPELINE-FIX-AND-PRODUCT-STRATEGY.md](../research/2026-07-03-V4-PIPELINE-FIX-AND-PRODUCT-STRATEGY.md) + 2026-07-07 verdict: code is done, but the product is operationally unlaunchable (test-mode RazorPay, no email, no legal pages) and not honestly chargeable until real-photo pipeline ships. · **Effort:** ~70–90 hours  
> **Full sequenced path:** [ROADMAP.md](ROADMAP.md)

### Gate Criteria (Phase 0 → Phase 1)
- [ ] Phase 0 production deployed
- [ ] Phase 0.5 closed (incl. EPIC-GEN-01 V4 pipeline merged)

### Phase 1 internal gates (two launch moments)
| Gate | Criteria | Unlocks |
|------|----------|---------|
| **Beta live** | M-LAUNCH-01 closed (legal pages · email · password reset · beta flag) + M-OBS-01 (Sentry) | Real agents on production, zero revenue claims |
| **Revenue on** | EPIC-AI-06 shipped + M-LAUNCH-02 closed (RazorPay live · receipts · BROKERAGE gate · metering) | `BETA_MODE=false` — first real ₹ |

### Planned Epics (priority order)

| # | Epic | Domain | Focus | Status |
|---|------|--------|-------|--------|
| 1 | [EPIC-LAUNCH-01](epics/phase-1-ai-core/EPIC-LAUNCH-01/EPIC.md) · M-LAUNCH-01 | LAUNCH | **Public beta blockers** — legal pages, transactional email + password reset, beta mode | 🔲 |
| 2 | [EPIC-AI-02](epics/phase-1-ai-core/EPIC-AI-02/EPIC.md) (deps only) | AI | US-AI-010 photo upload + US-AI-011 format selector | 🔲 |
| 3 | [EPIC-AI-06](epics/phase-1-ai-core/EPIC-AI-06/EPIC.md) | AI | Hybrid Real-Photo Pipeline — **the chargeability gate** (real photo background, editable overlay, synthetic guard) | 🔲 |
| 4 | [EPIC-LAUNCH-01](epics/phase-1-ai-core/EPIC-LAUNCH-01/EPIC.md) · M-LAUNCH-02 | LAUNCH | **Revenue on** — RazorPay live activation, receipt email, BROKERAGE gate (PT-06), metering guard (prep runs parallel to AI-06; flip gated by AI-06) | 🔲 |
| 5 | [EPIC-KIT-01](epics/phase-1-ai-core/EPIC-KIT-01/EPIC.md) | KIT | Listing Marketing Kits — multi-format batch, lifecycle, recurring content, compliance | 🔲 |
| ∥ | [EPIC-OBS-00](epics/phase-1-ai-core/EPIC-OBS-00/EPIC.md) | INFRA | Sentry observability — M-OBS-01 belongs with the beta gate (first user bug must arrive via Sentry, not WhatsApp) | 🔲 |

> Former Phase 1 scope (usage dashboard, payment method UI, EPIC-AI-01 conversational core) moved to Phase 2 — polish follows revenue.

---

## Phase 2 — Release 1.2: Polish & Self-Serve

> **Release:** v1.2 · **Status:** 🔲 Not Started · **Rescoped 2026-07-03**  
> **Outcome:** Conversational UX polish, refine loop, usage dashboard, payment self-serve — the polish that follows the Phase 1 revenue push.  
> **Timeline:** After Phase 1 gate · **Effort:** ~60–80 hours

### Planned Epics

| Epic | Domain | Focus | Status |
|------|--------|-------|--------|
| [EPIC-AI-01](epics/phase-2-ai-refine/EPIC-AI-01/EPIC.md) | AI | Conversational AI Core (intent · pre-plan · chips) — moved from Phase 1 | 🔲 |
| [EPIC-AI-03](epics/phase-2-ai-refine/EPIC-AI-03/EPIC.md) | AI | Refine loop, element edit, R2 storage | 🔲 |
| EPIC-AI-02 remainder | AI | Quality tiers UI · Campaign Mode UI (US-AI-012/013/014) | 🔲 |
| EPIC-USAGE-01 | Usage | Monthly chart, cost breakdown, usage alerts — moved from old Phase 1 | 🔲 Plan |
| EPIC-PAY-02 | Payments | Payment method management UI — moved from old Phase 1 | 🔲 Plan |
| EPIC-PAY-03 | Payments | Stripe activation + billing portal | 🔲 Plan |

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
