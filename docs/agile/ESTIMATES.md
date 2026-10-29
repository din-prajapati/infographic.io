# Estimates — Phase-Wise Story Implementation

> **Audience:** Product owner, planning.
> **Purpose:** What is left to build, by phase, with the derivation shown so the numbers can be argued with rather than trusted.
> **Update cadence:** After each milestone closes, or whenever a batch of stories is sized.
> **Regenerated:** 2026-10-29 — after Phase 1 closed and Phase 1.5 opened ([ADR-003](decisions/ADR-003-phase-1-close-and-phase-1.5.md)). Previous edition: 2026-09-08 / 2026-09-14 (see git history).
> **See also:** [ROADMAP.md](ROADMAP.md) (ranked sequence) · [PHASE_TRACKER.md](PHASE_TRACKER.md) (executive view) · [TEAM_STATUS.md](TEAM_STATUS.md) (per-domain board)

---

## Summary

**149 story cards — 80 Done, 10 superseded, 59 open.** No verification-only stories remain (US-DESIGN-004, US-PAY-109 and US-PAY-110 all closed).

| Phase | Open | Sized | Est. (low) | Est. (high) | Weeks @ ~37 h/wk (high) |
|---|:--:|:--:|--:|--:|:--:|
| **Phase 1.5** — property foundation + V3 editor | 26 | 20/26 | 98 h | **196 h** | 5.3 |
| **Phase 2** — kits + asset quality | 10 | 6/10 | 40 h | **80 h** | 2.2 |
| **Phase 3** — campaigns + team operations | 6 | 1/6 | 21 h | **42 h** | 1.1 |
| **Phase 4** — backlog (stories only) | 17 | 6/17 | 58 h | **115 h** | 3.1 |
| **Total** | **59** | 33/59 | **217 h** | **433 h** | **≈ 11.7** |

Phases 0, 0.5 and 1 are closed. The backlog's B-items without story cards (B-02 to B-15, B-25 …) are **not** in these totals; the backlog index
sizes them in weeks.

**Plan against the high band.** Phase 1.5's high band (≈ 5.3 weeks of build) sits inside the phase README's 7–9 week allowance, which adds
browser verification and the `/new-story` hardening each drafted story still needs.

---

## Phase 1.5 by epic

The only phase with committed open work.

| Epic | Open | Sizes | Estimate | TASKS.md (none / stub / real) |
|---|:--:|---|--:|:--:|
| [EPIC-PROP-01](epics/phase-1.5-foundation-v3/EPIC-PROP-01/EPIC.md) — Property & Brand Foundation | 10 | 7M, 1L, 1S, 1 unsized | 36–72 h | 5 / 1 / 4 |
| [EPIC-EDIT-04](epics/phase-1.5-foundation-v3/EPIC-EDIT-04/EPIC.md) — V3 Editor Simplification (incl. V3 shell, tabs, autosave, Edit Elements review) | 11 | 7M, 3L, 1 unsized | 46–92 h | 8 / 1 / 2 |
| [EPIC-OBS-00](epics/phase-1.5-foundation-v3/EPIC-OBS-00/EPIC.md) — Observability | 5 | 1S, 4 unsized | 16–32 h | 4 / 1 / 0 |

EPIC-OBS-00's figure is likely high: US-OBS-002/003 are partly built already (Sentry wired in both apps, source maps verified 2026-07-26), so
reconciling the cards may close part of the epic without new code.

## Later phases by epic

| Phase | Epic | Open | Estimate | Note |
|---|---|:--:|--:|---|
| 2 | [EPIC-KIT-01](epics/phase-2-ai-refine/EPIC-KIT-01/EPIC.md) | 6 | 26–52 h | Needs re-scoping on Property + proven templates; no TASKS.md |
| 2 | [EPIC-AI-03](epics/phase-2-ai-refine/EPIC-AI-03/EPIC.md) | 4 | 14–28 h | Fully decomposed (4 real TASKS.md) |
| 3 | [EPIC-AI-04](epics/phase-3-ai-advanced/EPIC-AI-04/EPIC.md) | 4 | 14–28 h | Mostly stubs |
| 3 | [EPIC-AI-05](epics/phase-3-ai-advanced/EPIC-AI-05/EPIC.md) · [EPIC-ORG-01](epics/phase-3-ai-advanced/EPIC-ORG-01/EPIC.md) | 2 | 7–14 h | |
| 4 | EPIC-AI-08 · EPIC-DEPLOY-02 · EPIC-DESIGN-03 · EPIC-AI-01 | 17 | 58–115 h | Promoted by trigger |

---

## Derivation

Unchanged from the previous edition. The repository has no size→hours mapping and no per-task effort in TASKS.md, so both bands are derived:

- **Low band** anchors on the project rule *"Each story = one Claude session (≤4h work)"*: `XS 1h · S 2h · M 3.5h · L 6h`
- **High band** doubles it: `XS 2h · S 4h · M 7h · L 12h`
- **Unsized stories** count as M. 26 of 59 open stories are unsized, so this assumption still drives much of the total.

The 2026-09-08 edition reconciled the high band against measured throughput (~5 stories/week, ~37 h/week); that reconciliation is reused here,
not re-measured.

### Confidence

| Tier | Scope | Why |
|---|---|---|
| **Firm** | EPIC-AI-03; the five moved stories in M-PROP-02 with real TASKS.md | Sized and task-decomposed |
| **Soft** | The thirteen new Phase 1.5 drafts (US-PROP-001–005, US-EDIT-020–027) | Sized from the 2026-10-29 analysis; ACs drafted, no TASKS.md yet |
| **Speculative** | EPIC-OBS-00, EPIC-KIT-01, Phase 3 stubs, backlog | Unsized, stub-only, or awaiting re-scope |

---

## Readiness

| Phase | No TASKS.md | Stub | Real breakdown |
|---|:--:|:--:|:--:|
| **Phase 1.5** | **17** | 3 | 6 |
| Phase 2 | 6 | 0 | 4 |
| Phase 3 | 0 | 4 | 2 |
| Phase 4 | 6 | 3 | 8 |

Same pattern as before: **the nearest work is the least planned.** 17 of Phase 1.5's 26 stories have no TASKS.md, so by the project's own rule
(*"Stories without a Four-Pillars Pre-flight are not ready to implement"*) they need `/new-story` first. Do that one milestone at a time, just
before its wave, rather than all at once.

---

## What these numbers deliberately exclude

- **Human steps:** US-OBS-005 T5 (prove the outage alert email arrives — closes BL-34) and Railway billing alerts. Minutes of work, not estimated.
- ~~**BL-26**~~ — fixed 2026-10-29; US-EDIT-009 closed (Phase 1.5 is now 25 open stories, about 7 h less at the high band).
- **Backlog B-items without story cards** (B-02–B-15, B-25 …), sized in weeks in the backlog index.
- **Open backlog defects** (BL-47, BL-48, BL-49 and older), none scheduled into a story.

---

## Method

Generated by walking every `docs/agile/epics/**/STORY.md`, reading `**Status:**` and `**Size:**`, and classifying: `⏭` / `⛔` / "Supersed" →
superseded; `✅` → Done (US-EDIT-009's status contains "✅ PASSED" for a sub-check and is counted open); `🟢` → verification-only; anything else → open.
Task readiness counts checklist items in each sibling `TASKS.md`: absent → none, ≤ 3 → stub, > 3 → real. Re-run that sweep to regenerate.

---

*Created 2026-09-08. Regenerated 2026-10-29 for the Phase 1.5 restructure; updated the same day for US-EDIT-024–027.*
