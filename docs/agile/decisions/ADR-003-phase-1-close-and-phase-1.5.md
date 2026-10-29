---
title: "ADR-003: Close Phase 1 at its delivered scope; open Phase 1.5 (Property foundation + V3 editor); move kits to Phase 2"
type: decision
tags: [orion, adr, roadmap, phase-1, phase-1.5]
updated: 2026-10-29
---

# ADR-003: Close Phase 1 at its delivered scope; open Phase 1.5; move kits to Phase 2

> **Status:** ✅ Accepted
> **Date:** 2026-10-29
> **Deciders:** Dinesh (product owner)
> **Scope:** repo-wide roadmap — Phases 1, 1.5, 2, 3 and the backlog

## Context

Phase 1 delivered its revenue goals: beta live and revenue on (M-LAUNCH-01/02, 2026-10-19), the real-photo pipeline (EPIC-AI-06),
durable storage (EPIC-INFRA-02), pricing relaunch V1 (EPIC-PAY-05) and one source of truth for listing facts (M-EDIT-05). Its
open remainder (kits, onboarding, brand layers, observability, deploy velocity, org roles, market profiles) no longer shares one
goal. The V3 canvas mockup review on 2026-10-29 showed the next unit of value is a **foundation**: facts are stored per design,
price is a free-text string, the agent's identity is re-entered per design, and element links are invisible. The long-term model
(Property → Campaign → Assets, from the untracked 2026-10-27 property-campaign PRD) needs a saved Property and Brand first.

## Decision

Close Phase 1 at what shipped, open **Phase 1.5 — Property Foundation & V3 Editor**, and move every open Phase 1 item to the phase
it now belongs to.

| Item | From | To | Why |
|------|------|----|-----|
| EPIC-OBS-00 (whole) | Phase 1 | **Phase 1.5**, first gate | Real users must be visible when things fail; US-OBS-002/003 are partly built already |
| *New* EPIC-PROP-01 — Property & Brand Foundation | — | **Phase 1.5** | The foundation above |
| *New* EPIC-EDIT-04 — V3 Editor Simplification | — | **Phase 1.5** | Makes the foundation visible |
| US-EDIT-008, US-EDIT-009 + M-EDIT-03 | EPIC-EDIT-03 | EPIC-EDIT-04 | Editor work; US-EDIT-009 underpins Make editable |
| US-EDIT-006/007 (M-EDIT-02 brand layers) | EPIC-EDIT-03 | EPIC-PROP-01 / M-PROP-02 | Brand layers are the Brand profile on canvas |
| US-LAUNCH-016/017 (onboarding) | EPIC-LAUNCH-01 | EPIC-PROP-01 / M-PROP-02 | Onboarding writes the Brand profile |
| US-AI-028 (agent profile persistence) | EPIC-AI-05, Phase 3 | EPIC-PROP-01 / M-PROP-02 | A foundation, filed two phases too late |
| US-AI-015 (refine chips) | EPIC-AI-03, Phase 2 | EPIC-EDIT-04 / M-EDIT-08 | Part of the AI Assistant; re-scope to fixed chips |
| EPIC-KIT-01 (whole) | Phase 1 | **Phase 2** | Kits are built on Property + proven templates; re-scope before implementing |
| EPIC-ORG-01 (whole) | Phase 1 | Phase 3 | Team operations follow agency demand |
| EPIC-MKT-01 (whole) | Phase 1 | Phase 4 backlog | Parked; India first |
| EPIC-AI-01 (whole, conversational core) | Phase 2 | Phase 4 backlog | Replaced by the V3 Assistant; revisit if agents ask |
| US-DEPLOY-001/002/003/005/006 | EPIC-DEPLOY-01 | *new* EPIC-DEPLOY-02, backlog | Velocity work; pull forward when it hurts |
| US-AI-027 (market data) | EPIC-AI-05 | EPIC-AI-08, backlog | Nice to have |
| M-PAY-05 (founding promo) | EPIC-PAY-05 | stays, on hold; listed in the backlog | Held by decision 2026-10-21 |
| US-AI-009 | EPIC-AI-01 | ⏭️ superseded → US-AI-015 | Fixed chips instead of AI-generated ones |
| US-AI-016 | EPIC-AI-03 | ⏭️ superseded → US-EDIT-023 | One AI entry point |
| US-AI-018 | EPIC-AI-03 | ⏭️ superseded → US-EDIT-020 + US-EDIT-009 | Text is edited on the canvas, not repainted in the image |
| US-AI-020 | EPIC-AI-03 | ⏭️ superseded — done by EPIC-INFRA-02 | Duplicate |
| US-AI-030 | EPIC-AI-05 | ⏭️ superseded | In-chat search retires with the floating chat |

Phase 2 becomes **Kits & Asset Quality** (EPIC-KIT-01 re-scoped, EPIC-AI-03's remaining US-AI-017/019/021/022). Phase 3 keeps
Campaign Mode and the advanced asset tools (EPIC-AI-04), EPIC-AI-05's US-AI-029, and gains EPIC-ORG-01. Mixed epics that stay in
Phase 1 (EPIC-EDIT-03, EPIC-LAUNCH-01, EPIC-DEPLOY-01, EPIC-PAY-05) are closed *at Phase 1 scope*, following the EPIC-DESIGN-02 →
EPIC-DESIGN-03 precedent; their moved stories keep their IDs.

## Alternatives Considered

- **Keep Phase 1 open and add the foundation to it** — rejected: Phase 1's goal (revenue on) is met; one more open epic would keep
  the phase at "73%" indefinitely and hide that the next phase has a different goal.
- **Build V3 / kits directly without a Property record** — rejected: kits and campaigns would be built on per-design copies of the
  facts and need rework.
- **Retag phases in the trackers only, without moving folders** — rejected: the folder is how `/standup` and the trackers derive
  phase membership; precedent (EPIC-DESIGN-03) moves story folders.

## Consequences

- ➕ Phase 1 reads as done; Phase 1.5 has one coherent goal and a dependency-ordered plan (≈ 5–6 weeks).
- ➕ Seven stories leave the active plan (five superseded, US-AI-027 and the conversational epic to the backlog).
- ➖ Five pre-existing stories moved into M-PROP-02/M-EDIT-08 were written before this decision; each needs `/new-story` re-checking.
- ⚠️ The untracked property-campaign PRD gates Phase 2+ on demand evidence (paid customers); this ADR does not adopt those gates —
  revisit before Phase 2 starts.
- ⚠️ PHASE_TRACKER's Phases 3–6 (Speed & Batch, B2B API, Analytics, Hardening) predate the epic folders and do not match
  `phase-3-ai-advanced/` and `phase-4-backlog/`; reconcile separately.

## References

- [Phase 1.5 README](../epics/phase-1.5-foundation-v3/README.md) · [EPIC-PROP-01](../epics/phase-1.5-foundation-v3/EPIC-PROP-01/EPIC.md) ·
  [EPIC-EDIT-04](../epics/phase-1.5-foundation-v3/EPIC-EDIT-04/EPIC.md)
- [ADR-002](ADR-002-marketing-automation-thesis-vs-kit-01.md) — kit strategy, recorded not decided
- V3 mockup and gap notes: `Mockups/buildographic-canvas-simplification-v3/`, `Mockups/v3-v4-feature-gap-analysis.md` (untracked)
- Property-campaign PRD: `docs/agile/PRD/2026-10-27-buildographic-property-campaign-platform.md` (untracked draft)
