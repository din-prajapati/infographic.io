# Phase Tracker — InfographicAI Product Delivery

> **Audience:** Executives, product owners, stakeholders  
> **Purpose:** Single-page view of delivery progress across all product phases — from MVP to B2B scale.  
> **Update cadence:** After each milestone closes or phase gate decision.  
> **Last updated:** 2026-10-29 — **Phase 1 closed at its delivered scope; Phase 1.5 opened; kits moved to Phase 2** ([ADR-003](decisions/ADR-003-phase-1-close-and-phase-1.5.md)). Before that: 2026-10-26 stale-status sweep.

---

## Phase Overview — At a Glance

| Phase | Release | Business Outcome | Status | Complete | Target |
|-------|---------|-----------------|--------|----------|--------|
| [Phase 0](#phase-0--mvp-launch) | v1.0 | Working product in production | ✅ Done 2026-10-29 | **9/9 stories**; all three human tasks signed off PASS (Task 3 on 2026-10-29, after the production smoke test) | Live |
| [Phase 1](#phase-1--release-11-revenue-strategy) | v1.1 | **Revenue strategy** — beta live, revenue on, real-photo pipeline, durable storage, pricing relaunch, one source of truth for listing facts | ✅ Closed 2026-10-29 | **60/60 stories** at delivered scope (open work moved by [ADR-003](decisions/ADR-003-phase-1-close-and-phase-1.5.md)) | Beta live · Revenue on |
| [Phase 1.5](#phase-15--release-111-property-foundation--v3-editor) | v1.1.1 | **Property foundation + V3 editor** — Property · Brand profile · template contract · linked editing · Design tab · AI Assistant | 🟡 Opened 2026-10-29 | 0/26 stories | ≈ 7–9 weeks |
| [Phase 2](#phase-2--release-12-kits--asset-quality) | v1.2 | **Kits & asset quality** — listing kits on proven templates, background removal, print upscale, element edit | 🔲 Not Started | 0/10 | After Phase 1.5 gate |
| [Phase 3](#phase-3--release-13-campaigns--team-operations) | v1.3 | **Campaigns & team operations** — Campaign Mode, mockups, outpainting, photo cleanup, org roles | 🔲 Not Started | 0/6 | After Phase 2 gate |
| [Phase 4](#phase-4--backlog-promoted-by-trigger-not-calendar) | v2.0+ | **Backlog** — B2B API, analytics, hardening, mobile, speed & batch, deferred AI — promoted by trigger | 🔲 Not Started | 0/17 + B-items | By trigger |

**Current Focus (2026-10-29):** Phase 0 closed (Task 3 signed off) and **Phase 1 closed at its delivered scope**. **Phase 1.5 — Property Foundation & V3 Editor** is open: Wave 0 is M-OBS-01 (Sentry reconcile + US-OBS-005 T5, which closes BL-34 — the one open P1) in parallel with finishing M-EDIT-03 (US-EDIT-009, BL-26); then M-PROP-01 ∥ M-PROP-03. See the [Phase 1.5 plan](epics/phase-1.5-foundation-v3/README.md).

**Every task in this whole tree that only a human can do — dashboard clicks, DNS, legal review, real-money go-aheads — is tracked in one place: [HUMAN_TASKS.md](HUMAN_TASKS.md).** (2026-08-22: the "Phase 0 3 HUMAN deploy tasks" staleness flagged in the note this replaces has been checked directly against `docs/testing/PHASE_0_HUMAN_QA_CHECKLIST.md` — Tasks 1 and 2 are in fact ✅ signed off (2026-06-20, 2026-07-11); Task 3 is mostly done, with 2 rows genuinely still open. See that file for the full breakdown.)

---

## Phase Gates

Each phase requires a gate decision before the next phase starts:

| Gate | Criteria | Owner |
|------|----------|-------|
| **G0 → G1** | Phase 0 deployed to production + Sentry live | Dinesh |
| **G1 → G1.5** | ✅ Phase 1 closed at delivered scope 2026-10-29 (beta live, revenue on) | Dinesh |
| **G1.5 → G2** | Phase 1.5 gate — see the [phase README](epics/phase-1.5-foundation-v3/README.md#phase-gate-phase-15--phase-2) | Dinesh |
| **G2 → G3** | Phase 2 gate — see [phase-2 README](epics/phase-2-ai-refine/README.md#phase-gate-phase-2--phase-3) | Dinesh |
| **G3 → done** | Phase 3 gate — see [phase-3 README](epics/phase-3-ai-advanced/README.md) | Dinesh |
| **Backlog** | Each item is promoted by its own trigger, not by a gate | Dinesh |

---

---

## Phase 0 — MVP Launch

> **Release:** v1.0 · **Status:** ✅ **Done 2026-10-29** — all 9 stories done (US-DESIGN-003/004 closed 2026-10-28); production live; production smoke test complete ([HUMAN_TASKS #2](HUMAN_TASKS.md)) and Task 3 signed off PASS 2026-10-29.  
> **Outcome:** Real estate agents can generate branded infographics, manage subscriptions, and export their work.  
> **Last updated:** 2026-10-29 (Phase 0 gate passed) · PT-09 was fixed 2026-07-09 (EPIC-AI-07); the staging checks closed 2026-10-27/28.

### Gate Criteria (Phase 0 → Done)
- [x] Core infrastructure: auth, API, DB, AI generation pipeline
- [x] RazorPay payments: SOLO + TEAM × monthly/annual — checkout, webhooks, plan change
- [x] Canvas editor: add text, shapes, images, drag-resize, export
- [x] CI/CD: Railway configured, Sentry DSN set
- [x] Design token system: Blue/Amber/Warm-Cream palette, Outfit font, domain colors ✅ 2026-04-23
- [x] UI consistency: hover tokens (14 fixes), ai-accent brand token, Danger Zone buttons ✅ 2026-04-29
- [x] Human QA: US-DESIGN-001 theme toggle + 3 bugs found & fixed ✅ 2026-04-29
- [x] Auto QA: 44/58 E2E tests pass (10 human-skip, 4 pre-existing auth failures) ✅ 2026-04-29
- [x] Staging infra live (Neon + Railway) — verified 2026-07-09
- [x] Staging E2E suite run — 87/91 non-skipped passed, 5 network-flakiness, 0 real app failures — 2026-07-09
- [x] **🟢 PT-09 — generation results now render on staging.** Fixed via [EPIC-AI-07](epics/phase-0-mvp/EPIC-AI-07/EPIC.md) US-AI-034 (PR #14, deployed `9eed346`); re-verified live 2026-07-09 (foreground). Backgrounded-tab AC3 run still recommended.
**Human tasks (2026-08-22 correction — the 3 lines this replaces were stale):** Task 1 and Task 2
are in fact ✅ signed off (2026-06-20, 2026-07-11 — verified directly against
`docs/testing/PHASE_0_HUMAN_QA_CHECKLIST.md`). Task 3 is mostly done (domain live, RazorPay
live-mode, OAuth, Sentry all verified); 2 rows remain (tag `v1.0.0`, full smoke test). **Update 2026-10-29:** both done — `v1.0.0` 2026-08-30, smoke test 2026-10-29. US-DESIGN-003/004's
staging visual checks are still open but low-priority/stale (dated 2026-04–06, product has moved
far past this point). **Full detail, all phases: [HUMAN_TASKS.md](HUMAN_TASKS.md).**

### Epics in Phase 0

| Epic | Domain | Focus | Status | Stories / Notes |
|------|--------|-------|--------|-----------------|
| EPIC-PAY-01 | Payments | RazorPay subscriptions, webhooks, plan enforcement | ✅ Done | All closed |
| EPIC-AUTH-01 | Auth | JWT + Google OAuth, user limits | ✅ Done | All closed |
| EPIC-EDIT-01 | Editor | Canvas CRUD, export | ✅ Done | All closed |
| EPIC-AI-01 | AI | GPT-4o + Ideogram generation pipeline | ✅ Done | All closed |
| [EPIC-DESIGN-01](epics/phase-0-mvp/EPIC-DESIGN-01/EPIC.md) | Design | UI theme consistency, editor token fix | ✅ Done 2026-10-28 | US-001 ✅ US-002 ✅ US-003 ✅ US-004 ✅ |
| [EPIC-DESIGN-02](epics/phase-0-mvp/EPIC-DESIGN-02/EPIC.md) | Design | Blue/Amber/Warm-Cream palette + domain colors | ✅ Done (P0 scope) | US-005–008 ✅ · US-009–011 → Phase 4 Backlog |
| EPIC-INFRA-01 | Infra | Railway + Sentry + DB migrations | 🟡 In Progress | Code ✅ · 3 deploy tasks pending |
| [EPIC-AI-07](epics/phase-0-mvp/EPIC-AI-07/EPIC.md) | AI | Generation Progress Delivery Fix — **PT-09** | ✅ Done 2026-07-09 | US-AI-034 ✅ (PR #14) · US-AI-035 ⏭️ superseded |

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
| **Deployment** | 2/3 HUMAN tasks signed off, Task 3 mostly done | 3 tasks | 🟡 |

**Overall Phase 0: ~99%** _(staging + 3 deploy tasks gate the final 1%)_

**Last updated:** 2026-04-29

---

## Phase 1 — Release 1.1: Revenue Strategy

> **Release:** v1.1 · **Status:** ✅ **Closed 2026-10-29 at its delivered scope — 60/60 stories.** The open remainder moved to Phase 1.5, Phase 2, Phase 3 or the backlog ([ADR-003](decisions/ADR-003-phase-1-close-and-phase-1.5.md)). *Before:* 73% (61/84, recounted 2026-10-26 — that count included US-EDIT-009 as done; it is not).
> **Outcome:** The product is publicly live as a free beta, then earns its price against Canva/Ideogram-direct: agents market with their REAL listing photos, revenue is collected on live RazorPay with receipts and password recovery, and listing kits retain subscribers.  
> **Rationale:** [docs/research/2026-07-03-V4-PIPELINE-FIX-AND-PRODUCT-STRATEGY.md](../research/2026-07-03-V4-PIPELINE-FIX-AND-PRODUCT-STRATEGY.md) + 2026-07-07 verdict: code is done, but the product is operationally unlaunchable (test-mode RazorPay, no email, no legal pages) and not honestly chargeable until real-photo pipeline ships. · **Effort:** ~70–90 hours  
> **Full sequenced path:** [ROADMAP.md](ROADMAP.md)

### Gate Criteria (Phase 0 → Phase 1)
- [x] Phase 0 production deployed — ✅ Task 3 signed off PASS 2026-10-29
- [ ] Phase 0.5 closed (incl. EPIC-GEN-01 V4 pipeline merged) — **all code merged; blocked only on staging verification.** EPIC-AI-00 ✅ (2026-08-05) · EPIC-DESIGN-04 ✅ · EPIC-GEN-01 has both milestones ✅ (M-GEN-01 2026-07-07, M-GEN-02 2026-08-07) but one open DoD item: *"Verified on staging environment"*. That single unchecked box is the whole of what keeps Phase 0.5 open.

### Phase 1 internal gates (two launch moments)
| Gate | Criteria | Unlocks |
|------|----------|---------|
| **Beta live** | M-LAUNCH-01 closed (legal pages · email · password reset · beta flag) + M-OBS-01 (Sentry) | Real agents on production, zero revenue claims |
| **Revenue on** | ✅ EPIC-AI-06 shipped (M-AI-18 closed 2026-08-15, all 10 stories) + M-LAUNCH-02 closed (RazorPay live · receipts · BROKERAGE gate · metering · editable monetization) — **7/7 done 2026-10-19; US-LAUNCH-005 AC5/6 closed, a real ₹5,499 transaction charged, webhook-verified, refunded and cancelled** + **EPIC-INFRA-02** (durable asset storage, added 2026-08-19, not started) + **EPIC-PAY-05** (pricing relaunch, added 2026-08-21, not started — US-LAUNCH-005 AC6 should run against relaunched prices, not old beta prices) | `BETA_MODE=false` — real ₹ transaction gated on all three closing |

### Planned Epics (priority order)

| # | Epic | Domain | Focus | Status |
|---|------|--------|-------|--------|
| 1 | [EPIC-LAUNCH-01](epics/phase-1-ai-core/EPIC-LAUNCH-01/EPIC.md) · M-LAUNCH-01 | LAUNCH | **Public beta blockers** — legal pages, transactional email + password reset, beta mode | ✅ **7/7 Done — closed 2026-10-19** (BETA_MODE item superseded by decision) |
| 2 | [EPIC-AI-02](epics/phase-1-ai-core/EPIC-AI-02/EPIC.md) | AI | **M-AI-06 complete 2026-08-05** — US-AI-010/036/037/038/039/040/042 Done (2026-08-03), US-PANEL-01 Done (PR #26); US-AI-011/041 superseded. Quality tiers/Campaign UI moved to EPIC-AI-08 backlog | ✅ 10/10 |
| 3 | [EPIC-AI-06](epics/phase-1-ai-core/EPIC-AI-06/EPIC.md) | AI | Hybrid Real-Photo Pipeline — **the chargeability gate** (real photo background, editable overlay). **Both milestones fully closed 2026-08-15** — M-AI-18 (editable overlay, 10 stories) and M-AI-17 (real-photo composition, US-AI-031/031b — credit topped up same day, both ACs live-verified) | ✅ **Fully Done** |
| 4 | [EPIC-LAUNCH-01](epics/phase-1-ai-core/EPIC-LAUNCH-01/EPIC.md) · M-LAUNCH-02 | LAUNCH | **Revenue on** — RazorPay live activation, receipt email, BROKERAGE gate (PT-06), metering guard, editable-design monetization (US-LAUNCH-015, closed 2026-08-15) | ✅ **7/7 Done — closed 2026-10-19** (US-LAUNCH-005 AC6: real ₹ txn run end to end) |
| 5 | [EPIC-KIT-01](epics/phase-2-ai-refine/EPIC-KIT-01/EPIC.md) | KIT | Listing Marketing Kits | ➡️ **Moved to Phase 2** — re-scope on Property + proven templates |
| — | [EPIC-MKT-01](epics/phase-4-backlog/EPIC-MKT-01/EPIC.md) | MKT | Market-Aware Generation | ➡️ **Moved to the backlog** (parked, trigger unchanged) |
| ∥ | [EPIC-OBS-00](epics/phase-1.5-foundation-v3/EPIC-OBS-00/EPIC.md) | INFRA | Sentry observability | ➡️ **Moved to Phase 1.5** (first gate) |
| ∥ | [EPIC-DEPLOY-01](epics/phase-1-ai-core/EPIC-DEPLOY-01/EPIC.md) | INFRA | Deployment velocity | ✅ **Closed at Phase 1 scope — 2/7** (US-DEPLOY-004, 007); five open stories → [EPIC-DEPLOY-02](epics/phase-4-backlog/EPIC-DEPLOY-02/EPIC.md) (backlog) |
| 6 | [EPIC-INFRA-02](epics/phase-1-ai-core/EPIC-INFRA-02/EPIC.md) | INFRA | Durable Asset Storage (Cloudflare R2) — **revenue-on gate blocker, added 2026-08-19** | ✅ **3/3 Done — epic closed 2026-10-19** (M-INFRA-01 verified on production) |
| 7 | [EPIC-PAY-05](epics/phase-1-ai-core/EPIC-PAY-05/EPIC.md) | PAY | Pricing Relaunch — Founding Customer launch, feasibility-checked 75-80% margin, generic campaign/discount architecture — **added 2026-08-21, real ₹ transaction should run against relaunched prices** | 🟢 **V1 COMPLETE — 12/12 stories merged, all 4 V1 milestones closed 2026-10-21.** V2 (M-PAY-05, founding/promo) ⏸ held until payment traction |
| 8 | [EPIC-EDIT-03](epics/phase-1-ai-core/EPIC-EDIT-03/EPIC.md) | EDIT | Editable Design Discoverability | ✅ **Closed at Phase 1 scope — 10/10** (M-EDIT-01/04/05); US-EDIT-008/009 + M-EDIT-03 → EPIC-EDIT-04, US-EDIT-006/007 → EPIC-PROP-01 (Phase 1.5) |

> EPIC-LAUNCH-01 is ✅ 15/15 (US-LAUNCH-016/017 → EPIC-PROP-01); EPIC-ORG-01 moved to Phase 3. Full move table: [ADR-003](decisions/ADR-003-phase-1-close-and-phase-1.5.md).

---

## Phase 1.5 — Release 1.1.1: Property Foundation & V3 Editor

> **Release:** v1.1.1 · **Status:** 🟡 Opened 2026-10-29 — 0/26 stories ([ADR-003](decisions/ADR-003-phase-1-close-and-phase-1.5.md))
> **Outcome:** A saved Property (structured price, Sale/Rent intent), a saved Brand profile and an explicit element-to-fact template contract — plus the V3 editor that makes them visible: linked editing, a simple Design tab, one AI Assistant, an export check.
> **Plan, waves and gate:** [epics/phase-1.5-foundation-v3/README.md](epics/phase-1.5-foundation-v3/README.md) · **Effort:** ≈ 30–42 working days (7–9 weeks)

| # | Epic | Domain | Focus | Status |
|---|------|--------|-------|--------|
| 0 | [EPIC-OBS-00](epics/phase-1.5-foundation-v3/EPIC-OBS-00/EPIC.md) | INFRA | Observability — M-OBS-01 first; reconcile the partly-built Sentry cards; US-OBS-005 T5 closes BL-34 | 🟡 0/5 |
| 1 | [EPIC-PROP-01](epics/phase-1.5-foundation-v3/EPIC-PROP-01/EPIC.md) | PROP | Property record · structured price + intent · Auto-Fill · Brand profile · template contract | 🔲 0/10 |
| 2 | [EPIC-EDIT-04](epics/phase-1.5-foundation-v3/EPIC-EDIT-04/EPIC.md) | EDIT | Single editable path (BL-26) · linked editing · Design tab · AI Assistant · export review · V3 shell (light + dark) · Property/Contact tabs · autosave · Edit Elements review | 🟡 0/11 (US-EDIT-009 code merged) |


---

## Phase 2 — Release 1.2: Kits & Asset Quality

> **Release:** v1.2 · **Status:** 🔲 Not Started · **Rescoped 2026-10-29** ([ADR-003](decisions/ADR-003-phase-1-close-and-phase-1.5.md)) — was "Polish & Self-Serve" (rescoped 2026-07-03)
> **Outcome:** One Property → a coordinated kit of assets from proven templates, plus the asset-quality tools (background removal, print upscale, element edit). Usage and payment self-serve placeholders stay here.
> **Timeline:** After Phase 1 gate · **Effort:** ~60–80 hours

### Planned Epics

| Epic | Domain | Focus | Status |
|------|--------|-------|--------|
| [EPIC-KIT-01](epics/phase-2-ai-refine/EPIC-KIT-01/EPIC.md) | KIT | Listing Marketing Kits — moved from Phase 1; ⚠️ re-scope on Property + proven templates first | 🔲 0/6 |
| ~~EPIC-AI-01~~ | AI | Conversational AI Core — ➡️ moved to the [backlog](epics/phase-4-backlog/EPIC-AI-01/EPIC.md) | — |
| [EPIC-AI-03](epics/phase-2-ai-refine/EPIC-AI-03/EPIC.md) | AI | Asset quality — element edit (US-AI-017), semantic layer remainder (US-AI-019), background removal (US-AI-021), print upscale (US-AI-022). US-AI-015 → Phase 1.5; 016/018/020 superseded | 🔲 0/4 |
| EPIC-USAGE-01 | Usage | Monthly chart, cost breakdown, usage alerts — moved from old Phase 1 | 🔲 Plan |
| EPIC-PAY-02 | Payments | Payment method management UI — moved from old Phase 1 | 🔲 Plan |
| EPIC-PAY-03 | Payments | Stripe activation + billing portal | 🔲 Plan |

> **Note (2026-08-21):** `EPIC-PAY-05` (Pricing Relaunch, Phase 1) is a distinct epic from these two
> placeholders — it took the next free counter number rather than either of these, which remain
> reserved for their original, different scopes. See Phase 1's epic table above.

---

## Phase 3 — Release 1.3: Campaigns & Team Operations

> **Release:** v1.3 · **Status:** 🔲 Not Started — 0/6 stories · **Realigned 2026-10-29** to the `phase-3-ai-advanced/` folder ([ADR-003](decisions/ADR-003-phase-1-close-and-phase-1.5.md)). The
> legacy "Speed & Batch" plan that sat here has moved to the backlog as B-25 (see Phase 4).
> **Outcome:** One Property runs **Campaigns** — a goal (Just Listed · Open House · Price Improved · Rented/Sold) with coordinated assets —
> backed by advanced asset tools and organization roles for agencies.
> **Timing:** After the Phase 2 gate · **Phase plan:** [epics/phase-3-ai-advanced/README.md](epics/phase-3-ai-advanced/README.md)

| Epic | Domain | Focus | Status |
|------|--------|-------|--------|
| [EPIC-AI-04](epics/phase-3-ai-advanced/EPIC-AI-04/EPIC.md) | AI | Campaign Mode backend (US-AI-026) · real-estate mockups · format expand / outpainting · photo cleanup | 🔲 0/4 |
| [EPIC-AI-05](epics/phase-3-ai-advanced/EPIC-AI-05/EPIC.md) | AI | Listing-status tone routing (US-AI-029) — to fold into Campaign goals | 🔲 0/1 |
| [EPIC-ORG-01](epics/phase-3-ai-advanced/EPIC-ORG-01/EPIC.md) | ORG | Organization roles + permission enforcement — moved from Phase 1 | 🔲 0/1 |
| *not drafted* | AI | **AI campaign agent** — one action prepares a whole campaign for approval (property-campaign PRD phase B4) | 📋 Idea |

---

## Phase 4 — Backlog (promoted by trigger, not calendar)

> **Release:** v2.0+ · **Status:** 🔲 Not Started — 0/17 stories plus scoped B-items · folder [`phase-4-backlog/`](epics/phase-4-backlog/README.md)
> **Realigned 2026-10-29:** the legacy Phases 4–6 (B2B API, Analytics & Optimization, Production Hardening) and the legacy Phase 3 (Speed & Batch)
> were plans written before the epic folders existed. Their items already live in the backlog index, so this tracker now points there.

### Epics in the backlog folder

| Epic | Focus | Stories | Trigger |
|------|-------|:--:|---------|
| [EPIC-AI-01](epics/phase-4-backlog/EPIC-AI-01/EPIC.md) | Conversational AI core (moved from Phase 2, 2026-10-29) | 0/2 | Agents ask for conversation after using the V3 Assistant |
| [EPIC-AI-08](epics/phase-4-backlog/EPIC-AI-08/EPIC.md) | Quality tiers + Campaign Mode UI · image-model swap · synthetic guard · market data (US-AI-027) | 0/7 | First revenue / cost pressure |
| [EPIC-AI-09](epics/phase-4-backlog/EPIC-AI-09/EPIC.md) | Sample-template format expansion (stories not drafted) | — | EPIC-KIT-01 starts |
| [EPIC-DESIGN-03](epics/phase-4-backlog/EPIC-DESIGN-03/EPIC.md) | Component visual polish | 0/3 | — |
| [EPIC-MKT-01](epics/phase-4-backlog/EPIC-MKT-01/EPIC.md) | Market-aware generation (moved from Phase 1, 2026-10-29) | — | A market's output is wrong |
| [EPIC-DEPLOY-02](epics/phase-4-backlog/EPIC-DEPLOY-02/EPIC.md) | Deployment velocity remainder (from EPIC-DEPLOY-01, 2026-10-29) | 0/5 | The pain is real (e.g. BL-36) |

### Where the legacy phase plans went

| Legacy phase | Item | Now |
|---|---|---|
| 3 — Speed & Batch | Intelligent caching, template pre-rendering, progressive generation UI, batch CSV/Excel upload, job queue, volume pricing | **B-25** (added 2026-10-29); caching + job queue overlap B-12 |
| 4 — B2B API | Key management · webhooks + retries · developer portal | B-08 · B-09 · B-10 |
| 5 — Analytics & Optimization | Admin dashboard · performance instrumentation · AI cost optimization | B-11 · B-12 · B-13 |
| 6 — Production Hardening | Security audit, load testing, 99.9% SLA, full test coverage · mobile app | B-14 · B-15 |

Full list with effort and triggers: [phase-4-backlog/README.md](epics/phase-4-backlog/README.md) · also mirrored in [AGILE_INDEX.md](AGILE_INDEX.md#phase-4-backlog--deferred-after-phase-3).

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
