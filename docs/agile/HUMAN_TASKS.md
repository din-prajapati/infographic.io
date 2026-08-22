---
title: Human Tasks Tracker
type: tracker
layer: cross-cutting
tags: [orion, human-tasks, ops, dashboard]
updated: 2026-08-22
---

# Human Tasks Tracker

> Companion to [PHASE_TRACKER.md](PHASE_TRACKER.md) — same idea, different axis. That file tracks
> story/milestone/epic **completion**; this one tracks every task in the tree that **cannot be done
> by an AI coding agent** — dashboard clicks, DNS records, KYC/legal review, and deliberate
> real-money actions. Compiled by sweeping every `STORY.md`/`TASKS.md`/`MILESTONE.md`/`EPIC.md` for
> `HUMAN` markers project-wide (2026-08-22). Update this file whenever a human task is discovered,
> completed, or superseded — don't let it go stale the way `PHASE_TRACKER.md` itself repeatedly has
> (see that file's own reconciliation notes).

---

## How to use this

Each row is one concrete action only a human can take (dashboard/console access, legal judgment, or
a deliberate go/no-go on spending real money). Code-side prerequisites an agent already finished are
not listed here — only what's still genuinely blocked on you. Grouped by phase in delivery order;
within a phase, in the order they unblock downstream work.

---

## Summary — outstanding tasks

| # | Phase | Epic | Story/Milestone | Task | Status |
|:-:|-------|------|------------------|------|:------:|
| 1 | Phase 0 | EPIC-INFRA-01 (legacy MVP deploy) | Phase 0 Task 3 | Push `v1.0.0` tag → production auto-deploy (currently running several commits behind `main`, off a pre-tag deploy) | 🔲 |
| 2 | Phase 0 | EPIC-INFRA-01 | Phase 0 Task 3, rows P-15/16/17 | Full production smoke test (3D) — unrun since the domain/keys work landed | 🔲 |
| 3 | Phase 1 | EPIC-LAUNCH-01 | US-LAUNCH-005 AC5 | Run `npm run verify:payment-prereqs` against production config | 🔲 |
| 4 | Phase 1 | EPIC-LAUNCH-01 | US-LAUNCH-005 AC6 | One real ₹ subscription on production (smallest plan) → verify webhook activates it → refund/cancel from dashboard | 🔲 — **deliberately held**, needs your explicit go-ahead |
| 5 | Phase 1 | EPIC-INFRA-02 | US-INFRA-001 | Provision a Cloudflare R2 bucket + S3-compatible API token | 🔲 — **blocks the story starting**, not just finishing |
| 6 | Phase 1 | EPIC-PAY-05 (V1) | US-PAY-109 T0 | Create 4 Razorpay Plan objects: PRO monthly (₹10,999), PRO annual (₹109,990), AGENCY monthly (₹43,999), AGENCY annual (₹439,990) | 🔲 — code done, only this blocks close |
| 6b | Phase 1 | EPIC-PAY-05 (V1) | US-PAY-102 (re-opened 2026-08-23) | Create 4 **new** Razorpay Plan objects for the repriced SOLO (₹5,499/mo, ₹54,990/yr) and TEAM (₹21,999/mo, ₹219,990/yr) — existing live SOLO/TEAM Plan objects are price-immutable at the old beta rate (₹2,999/₹6,999) and cannot be edited; new customers need a new Plan pointed at the new price | 🔲 |
| 7 | Phase 1 | EPIC-PAY-05 (V2) | US-PAY-108 T0 | Create 4 Razorpay Offer objects (Founding-100 discount, SOLO/PRO/TEAM/AGENCY, "Forever" duration) | 🔲 — V2, not urgent yet |
| 8 | Phase 0 | EPIC-LAUNCH-01 | US-LAUNCH-001 | Final legal review of Terms/Privacy/Refund wording — drafted content is a starting point, not legal advice, and these pages are already live in production | 🔲 — standing item, no deadline set |

**Likely already resolved, worth a quick verify rather than re-doing:**

| Story | Task | Why it's probably done |
|---|---|---|
| US-LAUNCH-002 | Resend domain DNS setup | Password-reset flow was live-verified against a real domain/email 2026-07-21 — DNS almost certainly configured, just never explicitly ticked here |

**Historical / low-priority visual QA (Phase 0-mvp, dated 2026-04 to 2026-06 — verify still relevant before spending time on them, product has moved far past this point):**

| Story | Remaining HUMAN item |
|---|---|
| US-DESIGN-003 | Real Ideogram image fidelity + live usage-counter increment, visual judgment on staging |
| US-DESIGN-004 | Visual spot-checks: button-height/card-border/spacing on staging; chart-label dark-mode readability; per-panel split-personality inspection |

---

## Detail by task

### 1–2. Phase 0 Task 3 — production go-live, remaining rows
**Source:** [`docs/testing/PHASE_0_HUMAN_QA_CHECKLIST.md`](../testing/PHASE_0_HUMAN_QA_CHECKLIST.md) §3
**Status:** 🟡 In Progress — most of Task 3 is done (domain live, RazorPay live-mode activated
2026-07-28, Google OAuth verified live 2026-07-30, Sentry's 4 checks all ✅ as of 2026-07-26). Two
things remain:
- **Tag `v1.0.0`** (§3C, row P-09/P-10 area) — production is still running off a pre-tag deploy,
  currently several commits behind `main` (confirmed no `v1.0.0` tag exists in this repo as of
  2026-08-22).
- **Full smoke test** (§3D, rows P-15/16/17) — unrun since the domain/keys/OAuth work landed.

### 3–4. US-LAUNCH-005 — real payment verification
**Source:** [`EPIC-LAUNCH-01/stories/US-LAUNCH-005/STORY.md`](epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-005/STORY.md)
AC1–4 are done (RazorPay account approved, live plans created, Railway env vars set, boot-guard
code shipped and verified). AC5/6 remain:
- **AC5**: `npm run verify:payment-prereqs` has never been run against the actual production config.
- **AC6**: one real ₹ transaction, completed and refunded — explicitly held per a prior instruction
  ("DO NOT Start Checkout Flow" during the Task 3 smoke test). This is the last box before
  `BETA_MODE=false` (revenue-on) can flip.

### 5. US-INFRA-001 — Cloudflare R2
**Source:** [`EPIC-INFRA-02/stories/US-INFRA-001/TASKS.md`](epics/phase-1-ai-core/EPIC-INFRA-02/stories/US-INFRA-001/TASKS.md)
A **prerequisite**, not a follow-up — the story (durable asset storage, moving off Ideogram's
expiring CDN and the container's ephemeral tmp dir) can't start implementation until a real R2
bucket + API token exist. No AI agent can self-provision third-party cloud credentials.

### 6–7. US-PAY-109 / US-PAY-108 — Razorpay dashboard objects
**Source:** [`EPIC-PAY-05/stories/US-PAY-109/TASKS.md`](epics/phase-1-ai-core/EPIC-PAY-05/stories/US-PAY-109/TASKS.md),
[`US-PAY-108/TASKS.md`](epics/phase-1-ai-core/EPIC-PAY-05/stories/US-PAY-108/TASKS.md)
- **US-PAY-109** (V1, ship before first transaction): all code is done and verified by test
  (2026-08-22 session) — this is the *only* remaining blocker. Create 4 Plan objects, record the
  `plan_...` IDs, set them as `RAZORPAY_PLAN_PRO_MONTHLY`/`_ANNUAL`/`RAZORPAY_PLAN_AGENCY_MONTHLY`/`_ANNUAL`.
- **US-PAY-108** (V2, deferred — see `EPIC-PAY-05/EPIC.md` "Scope split"): 4 Offer objects for the
  Founding Customer 100 campaign. Not urgent — V2 work isn't scheduled until after the first real
  transaction succeeds on V1.

### 6b. US-PAY-102 (re-opened) — new Razorpay Plans for repriced SOLO/TEAM
**Source:** [`EPIC-PAY-05/stories/US-PAY-102/STORY.md`](epics/phase-1-ai-core/EPIC-PAY-05/stories/US-PAY-102/STORY.md)
Found 2026-08-23 while implementing `US-PAY-106`: no story had ever actually repriced SOLO/TEAM
from their beta values to the relaunch's regular price — fixed in `PLAN_CONFIG`. Razorpay
Subscription Plans are price-immutable once created, so the existing live SOLO/TEAM Plan objects
stay at the old rate forever; new ones are needed at ₹5,499/mo (₹54,990/yr) and ₹21,999/mo
(₹219,990/yr), then `RAZORPAY_PLAN_SOLO_MONTHLY`/`_ANNUAL`/`RAZORPAY_PLAN_TEAM_MONTHLY`/`_ANNUAL`
repointed at the new IDs. Existing subscribers on the old plans are unaffected until they
re-subscribe or upgrade — no automatic migration.

### 8. US-LAUNCH-001 — legal review
**Source:** [`EPIC-LAUNCH-01/stories/US-LAUNCH-001/STORY.md`](epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-001/STORY.md)
Terms of Service / Privacy Policy / Refund Policy pages are live in production (they were the
prerequisite for RazorPay's live-mode KYC approval). Their wording was drafted, not legally
reviewed. No deadline was ever set for this — flagging it here so it doesn't quietly stay
un-tracked indefinitely now that real customers can reach these pages.

---

## Change log

- **2026-08-22** — Tracker created. Full project-wide sweep for `HUMAN` markers across
  `docs/agile/epics/**`, `PHASE_TRACKER.md`, and `docs/testing/PHASE_0_HUMAN_QA_CHECKLIST.md`.
- **2026-08-23** — Added #6b: new Razorpay Plan objects needed for repriced SOLO/TEAM (found while
  implementing `US-PAY-106`, fixed in `US-PAY-102`, re-opened).
