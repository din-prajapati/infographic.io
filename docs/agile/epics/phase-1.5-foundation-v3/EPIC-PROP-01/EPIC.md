---
title: EPIC-PROP-01 — Property & Brand Foundation
type: epic
tags: [orion, epic, prop, phase-1.5]
updated: 2026-10-29
---

# EPIC-PROP-01 — Property & Brand Foundation

> **Phase:** Phase 1.5 — Property Foundation & V3 Editor
> **Status:** 🔲 Not Started — drafted 2026-10-29
> **Owner:** Dinesh
> **Decision:** [ADR-003](../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md)

---

## Goal

**Outcome:** A listing is entered once — as a saved **Property** with structured price and listing intent — and the agent's
identity is saved once as a **Brand profile**. Every design points at them, and every text element knows which fact it shows.

**Why now:** Every later layer depends on it. A Campaign belongs to a Property; a Kit is a set of proven Templates applied to a
Property and a Brand profile; an AI campaign agent fills assets from them. Today the listing facts are stored *inside each
design* (US-EDIT-018), so two designs for the same flat hold two copies, and the agent re-enters contact details per design.

**Success metric:** Two designs created for one Property show the same price after either is edited; an agent sets up their
brand once and it appears on every new design; a rental listing reads "FOR RENT · ₹50,000 / month" on the canvas and in the
generated poster.

---

## Root Cause / Pre-Story Analysis

- **Observed problem:** facts live per design; price is a free-text string with no sale/rent intent or period; contact details
  are typed per design; element-to-fact links are inferred from a slot tag, with no way to see, detach or reconnect them.
- **Underlying cause:** M-EDIT-05 made the *stores* the single source of truth for one open design, but there is no persisted
  entity above the design.
- **Constraints:** existing designs (with and without an embedded `listing`) must keep opening; Prisma migrations run as the
  Railway `preDeployCommand` (US-DEPLOY-004); the extractor (`POST /extractions`) already returns `listingType` and a numeric price.
- **What success looks like:** the hierarchy in [the phase README](../README.md#target-hierarchy) has its first two levels — Property and
  Brand — as real records.

---

## Milestones

| Milestone | Scope | Status |
|-----------|-------|:------:|
| [M-PROP-01-property-record](milestones/M-PROP-01-property-record.md) | Property as a saved record · structured price + listing intent · Auto-Fill from a message | 🔲 |
| [M-PROP-02-brand-profile](milestones/M-PROP-02-brand-profile.md) | Brand/agent profile saved once · onboarding screens · brand layers on the canvas | 🔲 |
| [M-PROP-03-template-contract](milestones/M-PROP-03-template-contract.md) | Element binding types (field / compound / independent) · template version + proven flag | 🔲 |

---

## Stories in this Epic

| # | Story | Title | Milestone | Size | Status |
|:-:|-------|-------|-----------|:----:|:------:|
| 1 | [US-PROP-001](stories/US-PROP-001/STORY.md) | Property as a saved record | M-PROP-01 | L | 🔲 |
| 2 | [US-PROP-002](stories/US-PROP-002/STORY.md) | Structured price and listing intent | M-PROP-01 | M | 🔲 |
| 3 | [US-PROP-003](stories/US-PROP-003/STORY.md) | Auto-Fill from a listing message, with review | M-PROP-01 | M | 🔲 |
| 4 | [US-AI-028](stories/US-AI-028/STORY.md) | Agent profile persistence — *moved from EPIC-AI-05* | M-PROP-02 | M | 🔲 |
| 5 | [US-LAUNCH-016](stories/US-LAUNCH-016/STORY.md) | Post-signup onboarding — Screen 1 required profile — *moved from EPIC-LAUNCH-01* | M-PROP-02 | M | 🔲 |
| 6 | [US-LAUNCH-017](stories/US-LAUNCH-017/STORY.md) | Onboarding brand kit — Screen 2 — *moved from EPIC-LAUNCH-01* | M-PROP-02 | M | 🔲 |
| 7 | [US-EDIT-006](stories/US-EDIT-006/STORY.md) | Brand layers from existing data — logo + licence — *moved from EPIC-EDIT-03* | M-PROP-02 | M | 🔲 |
| 8 | [US-EDIT-007](stories/US-EDIT-007/STORY.md) | Agent headshot + QR code — *moved from EPIC-EDIT-03* | M-PROP-02 | M | 🔲 |
| 9 | [US-PROP-004](stories/US-PROP-004/STORY.md) | Element binding types on the template contract | M-PROP-03 | M | 🔲 |
| 10 | [US-PROP-005](stories/US-PROP-005/STORY.md) | Template version and proven flag | M-PROP-03 | S | 🔲 |

---

## Out of Scope (this epic)

- A Campaign record, campaign kits, the AI campaign agent — Phase 2 and later, built on top of this epic.
- Team roles and shared brand profiles across an agency — EPIC-ORG-01 (Phase 3).
- Market profiles beyond India's currency and units — EPIC-MKT-01 (backlog).

---

*Epic created: 2026-10-29*
