# Estimates — Phase-Wise Story Implementation

> **Audience:** Product owner, planning.
> **Purpose:** What is left to build, by phase, with the derivation shown so the numbers can be argued with rather than trusted.
> **Update cadence:** After each milestone closes, or whenever a batch of stories is sized.
> **Generated:** 2026-09-08 · **Re-verified:** 2026-09-14 (figures unchanged — no stories closed in the interval)
> **See also:** [ROADMAP.md](ROADMAP.md) (ranked sequence) · [PHASE_TRACKER.md](PHASE_TRACKER.md) (executive view) · [TEAM_STATUS.md](TEAM_STATUS.md) (per-domain board)

---

## Summary

**124 stories total — 67 Done, 6 superseded, 3 verification-only, 49 open.**

| Phase | Open | Sized | Est. (low) | Est. (high) | Weeks @ 5/wk |
|---|:--:|:--:|--:|--:|:--:|
| **Phase 1** — ai-core | 21 | 17/21 | 76 h | **153 h** | 4.2 |
| **Phase 2** — ai-refine | 11 | 0/11 | 38 h | **77 h** | 2.2 |
| **Phase 3** — ai-advanced | 8 | 0/8 | 28 h | **56 h** | 1.6 |
| **Phase 4** — backlog | 9 | 1/9 | 32 h | **63 h** | 1.8 |
| **Total** | **49** | 18/49 | **174 h** | **349 h** | **≈10** |

Phase 0 and Phase 0.5 are closed. Phase 0's single open item (US-DESIGN-004) is verification-only — code complete, waiting on a human visual spot-check.

**Plan against the high band.** Reasoning under "Derivation" below.

---

## Phase 1 by epic

The only phase with committed open work.

| Epic | Stories | Sizes | Estimate | TASKS.md? |
|---|:--:|---|--:|:--:|
| EPIC-KIT-01 — listing marketing kits | 6 | 4M, 2L | 26–52 h | ❌ none |
| EPIC-DEPLOY-01 — deploy maturity | 6 | 3S, 2M, 1L | 19–38 h | ❌ none |
| EPIC-OBS-00 — Sentry + AI metrics | 4 | unsized | 14–28 h | ❌ none |
| EPIC-EDIT-03 — brand layers | 3 | 3M | 10–21 h | ✅ real |
| EPIC-ORG-01 — organization roles | 1 | M | 4–7 h | ✅ real |
| US-LAUNCH-014 — email verification | 1 | M | 4–7 h | ✅ real |

### Verification-only (no implementation left)

| Story | Phase | Waiting on |
|---|---|---|
| US-DESIGN-004 | phase-0-mvp | Human visual spot-check on staging |
| US-PAY-109 | phase-1-ai-core | PR #54 + one real checkout |
| US-PAY-110 | phase-1-ai-core | Staging checkout under an active campaign |

These carry **zero build hours** and are excluded from every total above. They are not free — they have been outstanding for weeks — but the constraint is human attention, not engineering.

---

## Derivation

The repository has **no size→hours mapping**, and **no `TASKS.md` carries per-task effort** despite `AGILE_RULES` stating that is where estimates live. Both bands are therefore derived, not read:

- **Low band** anchors on the project's own rule — *"Each story = one Claude session (≤4h work)"*:
  `XS 1h · S 2h · M 3.5h · L 6h`
- **High band** doubles it: `XS 2h · S 4h · M 7h · L 12h`
- **Unsized stories** are treated as M (3.5h / 7h). 31 of 49 open stories are unsized, so this assumption drives most of the total.

### Why the high band

It reconciles with two independent sources:

1. **`ROADMAP.md`'s own figures.** It puts EPIC-KIT-01 at ~45 h (this model: 26–52) and Phase 2 at ~60–80 h (this model: 38–77). Both land in the upper half of the range.
2. **Measured throughput.** 67 stories closed between 2026-04-17 and 2026-09-07:

| Window | Rate | 49 stories ≈ |
|---|:--:|:--:|
| Lifetime (Apr–Sep) | 3.4 stories/wk | ~14 weeks |
| Recent (Jul–Sep) | 5.4 stories/wk | ~9 weeks |
| August peak | 9.3 stories/wk | ~5 weeks (not repeatable) |

At 5 stories/week the two methods agree: 349 h ÷ 10 weeks ≈ 35 h/week. The hours model and the story-count model landing in the same place is the main reason to trust the high band over the low.

### Confidence

| Tier | Scope | Hours |
|---|---|--:|
| **Firm** — sized *and* task-decomposed | EDIT-03, ORG-001, LAUNCH-014 | ~18–35 h |
| **Soft** — sized by epic intent, no task breakdown | KIT-01, OBS-00, DEPLOY-01 | ~59–118 h |
| **Speculative** — 2-task stubs, unsized | Phases 3 and 4 | ~60–119 h |

Treat the speculative tier as **story counts, not hours**.

---

## The finding that matters more than the numbers

**Readiness is inverted: the nearest work is the least planned.**

| Phase | No TASKS.md | Stub | Real breakdown |
|---|:--:|:--:|:--:|
| **Phase 1** | **16** | 0 | 5 |
| Phase 2 | 0 | 1 | **10** |
| Phase 3 | 0 | 7 | 1 |
| Phase 4 | 1 | 2 | 6 |

Sixteen of Phase 1's 21 open stories — **all of EPIC-KIT-01, EPIC-OBS-00 and EPIC-DEPLOY-01** — have no `TASKS.md` at all, therefore no Four-Pillars pre-flight. By this project's own rule (*"Stories without a Four-Pillars Pre-flight are not ready to implement"*) they are **not implementation-ready**, and they account for 59–118 h of Phase 1's 76–153 h.

The ±2x band on Phase 1 is really ±2x on those three epics. Everything else is comparatively tight.

Meanwhile **Phase 2 is the best-planned phase** (10 of 11 fully decomposed) — and it is the one the 2026-09-07 session recommended cutting to US-AI-009 alone. Doing so would remove roughly 60 of its 77 hours. The planning investment there is already sunk; the question is whether to spend the build hours.

---

## What these numbers deliberately exclude

- **Manual verification debt.** US-LAUNCH-005 AC6 (one real ₹ transaction), the password-reset inbox test, the staging visual spot-checks. Near-zero implementation hours; outstanding for weeks. This is the actual critical path to revenue, and no estimate model captures it because it is not engineering work.
- **BL-29** — unbounded risk, not effort. See below.
- **Gate 4 being unsatisfiable repo-wide** (BL-28, integration DB unreachable). Every backend story's DoD carries a line that currently cannot be ticked, so "Done" is being recorded against an incomplete gate across the board.
- **12 open backlog items**, none scheduled into a story.

---

## Method

Figures generated by walking every `docs/agile/epics/**/STORY.md`, parsing the `**Status:**` and `**Size:**` fields, and classifying:

- `⏭` / `⛔` / "Supersed" → superseded (excluded)
- `✅` → Done
- `🟢` → verification-only (excluded from build hours)
- `🟡` → in progress (counted)
- anything else → open

Task-readiness comes from counting checklist items in each story's sibling `TASKS.md`: absent → none, ≤3 → stub, >3 → real.

To regenerate, re-run that sweep. The classification depends on status-line emoji being used consistently — a story whose card drifts from its real state will be counted wrong, which is exactly what happened to `EPIC-PAY-05` before 2026-09-08 (carried as "not started" with 11 of 12 stories code-complete).

---

*Created 2026-09-08. Re-verified 2026-09-14: PR #54 still open, `main` unmoved, no story closed in the interval — every figure above unchanged.*
