# Phase 1.5 — Property Foundation & V3 Editor

> **Opened:** 2026-10-29 · **Release:** v1.1.1 · **Decision:** [ADR-003](../../decisions/ADR-003-phase-1-close-and-phase-1.5.md)
> **Outcome:** The foundation every later layer needs — a saved **Property**, a saved **Brand profile**, and an explicit
> element-to-fact contract on **Templates** — plus the V3 editor that makes it visible: linked editing, a simple Design tab, one
> AI Assistant, and an export check. Observability (M-OBS-01) comes first so the phase's users can be seen when things fail.

## Target hierarchy

This phase builds the first levels; Campaigns and Kits come in Phase 2, the AI campaign agent later.

```
Account / Agency (Organization)              ← EPIC-ORG-01, Phase 3
 ├── Brand profile(s)                        ← M-PROP-02  (this phase)
 └── Property  — facts, structured price,    ← M-PROP-01  (this phase)
      │          Sale/Rent + period, photos
      └── Campaign — one goal: Just Listed ·  ← Phase 2 (kits) / Phase 3 (Campaign Mode, US-AI-026)
           │         Open House · Price Improved · Rented/Sold
           └── Assets — one per format, from a  ← exists today as designs
                │       Template version, linked to Property + Brand
                └── Exports — frozen files       ← US-EDIT-021 checks them (this phase)

Template library — versioned, "proven"       ← M-PROP-03  (this phase)
 └── Campaign kit — templates for one goal   ← EPIC-KIT-01, Phase 2 (re-scope first)
```

## Epics in this Phase

| # | Epic | Focus | Status |
|:-:|------|-------|--------|
| 0 | [EPIC-OBS-00](EPIC-OBS-00/EPIC.md) | Observability — M-OBS-01 first (moved from Phase 1); reconcile the partly-built Sentry cards | 🟡 US-OBS-005 waits on T5 (BL-34) |
| 1 | [EPIC-PROP-01](EPIC-PROP-01/EPIC.md) | Property & Brand Foundation — Property record, structured price + intent, Auto-Fill, Brand profile, template contract | 🔲 drafted |
| 2 | [EPIC-EDIT-04](EPIC-EDIT-04/EPIC.md) | V3 Editor Simplification — single editable path, linked editing, Design tab, AI Assistant, export review, V3 shell (light and dark), Property and Contact tabs, autosave, Edit Elements review | 🟡 1/11 — M-EDIT-03 ✅ 2026-10-29 |

## Order and dependencies

| Wave | Work | Depends on | Estimate |
|:----:|------|------------|----------|
| 0 | **M-OBS-01** (Sentry reconcile + US-OBS-005 T5) ∥ ~~**M-EDIT-03** (US-EDIT-009, fix BL-26)~~ ✅ 2026-10-29 | — | 2–3 days |
| 1 | **M-PROP-01** (US-PROP-001 → US-PROP-006 ∥ US-PROP-002 → US-PROP-003) ∥ **M-PROP-03** (US-PROP-004, US-PROP-005) ∥ **US-EDIT-024** V3 shell | — | 8–11 days |
| 2 | **M-EDIT-06** (US-EDIT-020 → 021) ∥ **M-PROP-02** (US-AI-028 → US-LAUNCH-016/017, US-EDIT-006 → 007) ∥ **US-EDIT-027** autosave | US-PROP-002, US-PROP-004, US-EDIT-024 | 7–10 days |
| 3 | **M-EDIT-07** (US-EDIT-022) → **US-EDIT-025** Property and Contact tabs ∥ **M-EDIT-10** (spike → US-EDIT-026 Edit Elements review) | US-PROP-005, M-PROP-02, US-EDIT-009, US-PROP-004 | 8–11 days |
| 4 | **M-EDIT-08** (US-EDIT-023 → US-AI-015, US-EDIT-008) | US-PROP-003, US-EDIT-009 | 4–6 days |
| | **Total** | | **≈ 30–42 working days (7–9 weeks)**, browser verification included — was 22–31 before US-EDIT-024–027 were added |

Estimates are planning allowances from the 2026-10-29 analysis, not commitments; the five stories moved into M-PROP-02 were sized
before this restructure.

## Phase Gate (Phase 1.5 → Phase 2)

- [ ] Sentry receives production errors from both frontend and backend; BL-34 closed (outage alert proven)
- [ ] Two designs on one Property show the same facts; a rental shows FOR RENT and its period everywhere
- [ ] A pasted listing message fills only the facts the agent accepts
- [ ] The Brand profile is entered once and appears on every new design
- [ ] Every curated template element has an explicit binding; designs record their template version
- [ ] The agent can see, detach and reconnect links; Export blocks missing, placeholder and out-of-date facts
- [ ] The Design tab offers Look / Accent / Photo / Format; switching look keeps the facts
- [ ] AI lives in one Assistant panel (Create design / Generate Background); the floating chat is retired
- [ ] The editor matches the V3 layout — top bar, guide bar, canvas header, tool rail, Design / Property / Contact tabs — in **both light and dark** themes
- [ ] Edits save automatically with a visible status
- [ ] Making an AI poster editable shows what was found and needs the agent's confirmation

> Phase 2 (Kits & Asset Quality) starts only after this gate — kits are built on Property + proven templates.
