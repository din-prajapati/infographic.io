---
title: M-PROP-02-brand-profile — Brand profile saved once
type: milestone
tags: [orion, milestone, phase-1.5]
updated: 2026-10-29
---

# M-PROP-02-brand-profile — Brand profile saved once

> **Epic:** [EPIC-PROP-01](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** TBD (Phase 1.5 sequence — see the [phase README](../../README.md))

---

## Goal

The agent's identity — name, phone, agency, licence/RERA, logo, headshot — is saved once, captured at onboarding, and placed on designs as real canvas layers.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-AI-028](../stories/US-AI-028/STORY.md) | Agent profile persistence | M | — | 🔲 | — |
| 2 | [US-LAUNCH-016](../stories/US-LAUNCH-016/STORY.md) | Post-signup onboarding — Screen 1 required profile | M | US-AI-028 | 🔲 | — |
| 3 | [US-LAUNCH-017](../stories/US-LAUNCH-017/STORY.md) | Onboarding brand kit — Screen 2 | M | US-LAUNCH-016 | 🔲 | — |
| 3 | [US-EDIT-006](../stories/US-EDIT-006/STORY.md) | Brand layers from existing data — logo + licence | M | US-AI-028 | 🔲 | — |
| 4 | [US-EDIT-007](../stories/US-EDIT-007/STORY.md) | Agent headshot + QR code | M | US-EDIT-006 | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] A new design shows the saved brand without retyping
- [ ] Logo and licence appear as movable canvas layers
- [ ] All stories above have status ✅ Done
- [ ] Verification gates pass for affected domains

---

## Notes / Blockers

- All five stories were written before this restructure (2026-04 to 2026-09); `/new-story` should re-check their ACs against one saved Brand profile before implementing.
- Can run in parallel with M-PROP-01 — the Brand profile does not depend on the Property record.

---

*Milestone created: 2026-10-29*
