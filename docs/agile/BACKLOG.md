# Backlog — Phase-Assigned Non-Blocking Items

> **What this is:** A lightweight, phase-wise list of known follow-ups and deferrals that are **not blocking** their surrounding work. Each item is a one-line placeholder — **a full STORY.md is written later, only when the item is actually scheduled** into a milestone. Until then it lives here so it isn't forgotten.
>
> **How to use:** When starting a phase, scan its table. Promote an item by running `/new-story` (or `/new-epic` if it's large), then change its Status to the story ID and strike it here.
>
> **Not the same as** the [Phase 4 deferred backlog](epics/phase-4-backlog/README.md) (B-01…B-15) — those are large, business-trigger-gated epics. This file is the running catch-all for smaller, phase-assigned follow-ups discovered during delivery.
>
> **ID scheme:** `BL-NN`, sequential, assigned-phase shown in the table. **Last updated:** 2026-07-09.

---

## Phase 1 — Revenue Strategy (v1.1)

| ID | Item | Domain | Priority | Source / Notes | Status |
|----|------|--------|:--------:|----------------|--------|
| BL-01 | **Socket.io generation progress not delivered on staging.** The granular step-by-step progress bar is currently cosmetic — on staging the socket connects + subscribes but delivers **zero `progress` events**, so the bar sits at "Analyzing your prompt / 20%" until the result appears. Also observed: **socket reconnect churn at completion** (~4 rapid connect/disconnect cycles). Results themselves are reliable (the US-AI-034 REST poll delivers them), so this is UX polish, not correctness. | AI | P2 (non-blocking) | Discovered during PT-09 fix / [EPIC-AI-07](epics/phase-0-mvp/EPIC-AI-07/EPIC.md) staging verification, 2026-07-09. **Fix direction:** investigate why `generation-progress.gateway.ts` room emits don't reach subscribed clients on Railway (WS proxy? namespace path? the room-join-after-emit race with no replay-on-subscribe?); consider having the gateway send current status immediately on `subscribe`; and fix the client effect that re-subscribes/tears-down repeatedly at completion. | 🔲 Not scheduled |
| BL-02 | **Model-opacity violation on `/usage`.** The Usage Analytics page shows the raw model id **`ideogram-4`** in the "Cost Breakdown by AI Model" table — user-visible, violating Critical Rule #5 (users should never see model names). | AI / DESIGN | P2 | Found 2026-07-09 during Task 2 §2C live QA (`docs/testing/PHASE_0_HUMAN_QA_CHECKLIST.md`). Map internal model ids → user-facing labels ("Quick Generate" / "Campaign Quality" etc.) on the usage/cost surfaces. | ✅ Fixed 2026-07-11 — PT-11, PR #15 (`client/src/lib/modelLabels.ts`) |
| BL-03 | **`SESSION_SECRET` is a dead variable** — set in Railway staging but read nowhere in the codebase (`grep` clean). Already pruned from `.env.example` (US-LAUNCH-009). | INFRA | P3 | Found 2026-07-12 during US-LAUNCH-009 env enumeration. Remove from Railway staging/prod var stores. | 🔲 Not scheduled |
| BL-04 | **Dead payment/PG env read-sites** — `PADDLE_*`, `PAYPAL_*`, and the individual `PG*` parts still have read-sites in `api/src/common/ensure-database-url.ts` (no-op when `DATABASE_URL` is set). Pruned from `.env.example` but the code refs remain. | INFRA | P3 | Found 2026-07-12 (US-LAUNCH-009). Remove the dead read-sites; can fold into US-LAUNCH-010. | 🔲 Not scheduled |

---

## Phase 2 — Polish & Self-Serve (v1.2)

| ID | Item | Domain | Priority | Source / Notes | Status |
|----|------|--------|:--------:|----------------|--------|
| _(none yet)_ | | | | | |

---

## Phase 3 — Speed & Batch (v1.3)

| ID | Item | Domain | Priority | Source / Notes | Status |
|----|------|--------|:--------:|----------------|--------|
| _(none yet)_ | | | | | |

---

## Unassigned / Needs triage

| ID | Item | Domain | Priority | Source / Notes | Status |
|----|------|--------|:--------:|----------------|--------|
| _(none yet)_ | | | | | |

---

## Adding an item

1. Pick the next `BL-NN`.
2. Add a row under the phase you're assigning it to (or "Unassigned" if unsure).
3. One-liner in **Item**, real source in **Source / Notes**. Do **not** write a STORY.md yet.
4. When scheduled: run `/new-story`, set **Status** to the resulting `US-…` ID, and mark the row done.

*Backlog created: 2026-07-09*
