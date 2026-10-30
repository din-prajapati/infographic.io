---
title: M-EDIT-09-v3-shell — V3 editor shell and tabs
type: milestone
tags: [orion, milestone, phase-1.5]
updated: 2026-10-30
---

# M-EDIT-09-v3-shell — V3 editor shell and tabs

> **Epic:** [EPIC-EDIT-04](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** TBD (Phase 1.5 sequence — see the [phase README](../../README.md))
> **Branch:** `feat/edit/m-09-v3-shell` (not created yet)

---

## Goal

The editor looks and reads like V3 — top bar, guide bar, canvas header, tool rail, Property and Contact tabs — in both light and dark themes, and saves on its own.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-EDIT-024](../stories/US-EDIT-024/STORY.md) | V3 top bar and canvas header, light and dark — *hardened + split 2026-10-30* | M | — (Decision D1 before T5) | 🔲 | — |
| 2 | [US-EDIT-028](../stories/US-EDIT-028/STORY.md) | Guide bar: the four steps, light and dark — *split from US-EDIT-024* | M | US-EDIT-024 (Decisions D3, D4) | 🔲 | — |
| 3 | [US-EDIT-029](../stories/US-EDIT-029/STORY.md) | V3 tool rail, with Quick Styles in the Text tool — *split from US-EDIT-024; takes US-EDIT-022 AC5* | M | US-EDIT-024 (same `FloatingToolbar.tsx`) | 🔲 | — |
| 4 | [US-EDIT-027](../stories/US-EDIT-027/STORY.md) | Autosave and save status | M | US-EDIT-024 (status slot) | 🔲 | — |
| 5 | [US-EDIT-030](../stories/US-EDIT-030/STORY.md) | For sale / For rent badge in the canvas header — *split from US-EDIT-024* | XS | US-EDIT-024; US-PROP-002 on `main` (M-PROP-01 PR) | 🔲 | — |
| 6 | [US-EDIT-025](../stories/US-EDIT-025/STORY.md) | Property and Contact tabs in the V3 layout | M | US-EDIT-022, US-PROP-002/003, US-AI-028 | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] Every new surface passes in light **and** dark (contrast ≥ 4.5:1 by the scoped WCAG probe in each story's E2E; no hard-coded colours by the US-EDIT-024 AC6 grep)
- [ ] No editor tool is lost
- [ ] Autosave never overwrites newer work
- [ ] All stories above have status ✅ Done
- [ ] Verification gates pass for affected domains

---

## Notes / Blockers

- **This wave the milestone PR cannot open.** US-EDIT-025 is blocked by US-EDIT-022 (M-EDIT-07), US-PROP-002/003 (M-PROP-01) and US-AI-028 (M-PROP-02), so wave-1 work (US-EDIT-024, then 028 and 029) lands in the milestone branch `feat/edit/m-09-v3-shell` only — per-story PRs into the milestone branch, no PR to `main`.
- **Merge order inside the milestone branch:** US-EDIT-024 → US-EDIT-028 → US-EDIT-029 → US-EDIT-027 → (rebase onto `main` after M-PROP-01) → US-EDIT-030 → US-EDIT-025.
- **Shared files with other milestones, and the order they reach `main`:**
  - `EditorLayout.tsx` — US-EDIT-024, 028, 027 here; **US-PROP-006** (M-PROP-01) and US-EDIT-021 (M-EDIT-06) elsewhere. US-PROP-006 reaches `main` only with the M-PROP-01 milestone PR (wave day 5); the M-EDIT-09 branch is rebased onto `main` after that and its PR merges after M-PROP-01.
  - `RightSidebar.tsx` — US-EDIT-028 (tab-state hook, ~line 277) and US-EDIT-029 (removes Quick Styles, ~1312–1360) here; **US-PROP-002** (generation request, ~line 542 — M-PROP-01), **US-EDIT-022** (Design tab — M-EDIT-07), US-EDIT-025, US-EDIT-020 and US-EDIT-023 elsewhere. Order on `main`: US-PROP-002 → M-EDIT-09 (028, 029) → US-EDIT-022 → US-EDIT-025.
  - `PropertyDetailsForm.tsx` — not touched by the shell stories; US-PROP-007 → US-PROP-003 → US-EDIT-025.
- **Decisions for the owner** (details on the cards): D1 scoped shell colour tokens (US-EDIT-024); D2 "Sample listing" badge parked — no sample-data flag exists (US-EDIT-024); D3 current-step rule and D4 step targets before their stories land (US-EDIT-028).
- The draft US-EDIT-024 (size L) was split on 2026-10-30; see its Implementation Update for what the draft had wrong against the code.
- Phone layout and SVG export stay out of scope.

---

*Milestone created: 2026-10-29 · updated 2026-10-30 (US-EDIT-024 hardened and split)*
