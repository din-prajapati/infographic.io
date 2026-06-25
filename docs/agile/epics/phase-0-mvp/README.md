# Phase 0 — MVP Launch

> **Release:** v1.0 · **Status:** 🟡 98% Complete · **Target:** Week 1 post-setup
> **Outcome:** Real estate agents can generate branded infographics, manage subscriptions, and export their work.

## Epics in this Phase

| Epic | Domain | Focus | Status | Stories |
|------|--------|-------|--------|---------|
| [EPIC-DESIGN-01](EPIC-DESIGN-01/EPIC.md) | Design | UI theme consistency, editor token fix | 🟡 In Progress | US-001 ✅ · US-002 ✅ · US-003 🟡 · US-004 🟡 |
| [EPIC-DESIGN-02](EPIC-DESIGN-02/EPIC.md) | Design | UI/UX Redesign — Blue/Amber/Warm-Cream palette | ✅ Done (P0 scope) | US-005–008 ✅ · US-009–011 → EPIC-DESIGN-03 |
| EPIC-PAY-01 | Payments | RazorPay subscriptions, webhooks, plan enforcement | ✅ Done | All closed |
| EPIC-AUTH-01 | Auth | JWT + Google OAuth, user limits | ✅ Done | All closed |
| EPIC-EDIT-01 | Editor | Canvas CRUD, export | ✅ Done | All closed |
| EPIC-AI-01 | AI | GPT-4o + Ideogram generation pipeline | ✅ Done | All closed |
| EPIC-INFRA-01 | Infra | Railway + Sentry + DB migrations | 🟡 In Progress | Code ✅ · Deploy 🔲 |

## Phase Gate (Phase 0 → Done)
- [x] Core infrastructure: auth, API, DB, AI generation pipeline
- [x] RazorPay payments: SOLO + TEAM × monthly/annual
- [x] Canvas editor: add text, shapes, images, drag-resize, export
- [x] CI/CD: Railway configured, Sentry DSN set
- [x] Design token system (Blue/Amber/Warm-Cream palette) — M-DESIGN-03 + M-DESIGN-04 ✅
- [x] UI hover consistency (14 blue→primary fixes + ai-accent token) — 2026-04-29
- [x] Human QA: US-DESIGN-001 theme toggle + 3 bugs fixed — 2026-04-29
- [ ] US-DESIGN-003 AC3 — generation result on staging — **STAGING TASK**
- [ ] US-DESIGN-004 AC2–4,6 — staging visual check — **STAGING TASK**
- [ ] Critical-path 10-flow manual test — **HUMAN TASK 1**
- [ ] Staging smoke test (Railway) — **HUMAN TASK 2**
- [ ] Production go-live + Sentry verify — **HUMAN TASK 3**

> Full tracker: [PHASE_TRACKER.md](../../PHASE_TRACKER.md)
