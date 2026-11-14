---
title: EPIC-PROP-01 — Property & Brand Foundation
type: epic
tags: [orion, epic, prop, phase-1.5]
updated: 2026-10-29
---

# EPIC-PROP-01 — Property & Brand Foundation

> **Phase:** Phase 1.5 — Property Foundation & V3 Editor
> **Status:** 🟡 3/12 reconciled implementation candidates;0 formally Done; remaining contracts require separate audit
> **Owner:** Dinesh
> **Decision:** [ADR-003](../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md)

---

## Goal

**Outcome:** A listing is entered once — as a saved **Property** with structured price and listing intent — and the agent's
identity is saved once as a **Brand profile**. Every design points at them, and every text element knows which fact it shows.

**Why now:** Every later layer depends on it. A Campaign belongs to a Property; a Kit is a set of proven Templates applied to a
Property and a Brand profile; an AI campaign agent fills assets from them. Today the listing facts are stored *inside each
design* (US-EDIT-018), so two designs for the same flat hold two copies, and the agent re-enters contact details per design.

**Success metric:** Two independent designs reference a Property while new facts remain pending until each design explicitly applies them; an agent sets up their
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
| 1 | [US-PROP-001](stories/US-PROP-001/STORY.md) | Property as a saved record (backend) | M-PROP-01 | M | 🟡 Implemented locally; review/merge pending |
| 1b | [US-PROP-006](stories/US-PROP-006/STORY.md) | Property as a saved record (client) — *split from US-PROP-001 on 2026-10-29* | M-PROP-01 | M | 🔲 |
| 2 | [US-PROP-002](stories/US-PROP-002/STORY.md) | Structured price: parser, schema and generation | M-PROP-01 | M | 🟡 Implemented locally; review/merge pending |
| 2b | [US-PROP-007](stories/US-PROP-007/STORY.md) | Listing intent and price in the editor — *split from US-PROP-002 on 2026-10-30* | M-PROP-01 | M | 🔲 |
| 3 | [US-PROP-003](stories/US-PROP-003/STORY.md) | Auto-Fill from a listing message, with review | M-PROP-01 | M | 🔲 |
| 4 | [US-AI-028](stories/US-AI-028/STORY.md) | Saved agent profile — the one profile endpoint — *moved from EPIC-AI-05* | M-PROP-02 | S | 🔲 |
| 5 | [US-LAUNCH-016](stories/US-LAUNCH-016/STORY.md) | Post-signup onboarding — Screen 1 required profile — *moved from EPIC-LAUNCH-01* | M-PROP-02 | M | 🔲 |
| 6 | [US-LAUNCH-017](stories/US-LAUNCH-017/STORY.md) | Onboarding brand kit — Screen 2 — *moved from EPIC-LAUNCH-01* | M-PROP-02 | M | 🔲 |
| 7 | [US-EDIT-006](stories/US-EDIT-006/STORY.md) | Brand layers from existing data — logo + licence — *moved from EPIC-EDIT-03* | M-PROP-02 | M | 🔲 |
| 8 | [US-EDIT-007](stories/US-EDIT-007/STORY.md) | Agent headshot + QR code — *moved from EPIC-EDIT-03* | M-PROP-02 | M | 🔲 |
| 9 | [US-PROP-004](stories/US-PROP-004/STORY.md) | Element binding types on the template contract | M-PROP-03 | M | 🟡 Implemented locally; review/merge pending |
| 10 | [US-PROP-005](stories/US-PROP-005/STORY.md) | Template version and proven flag | M-PROP-03 | S | 🔲 |

---

## Out of Scope (this epic)

- A Campaign record, campaign kits, the AI campaign agent — Phase 2 and later, built on top of this epic.
- Team roles and shared brand profiles across an agency — EPIC-ORG-01 (Phase 3).
- Live country/provider connectors and market enrichment — deferred. Basic IN/US/GB/CA country, currency and area-unit contracts are included in the reconciled manual workflow.

---

*Epic created: 2026-10-29*

## Approved listing integration reconciliation — 2026-11-13

Authority: user approved integrating Mockups/listing-workflow-v1 into actual opt-in V3, stopping before AI Assistant. Existing IDs are retained and not counted twice. Status remains Not Started until implementation evidence exists.

| Story | Reconciled scope | Execution |
|---|---|---|
| US-PROP-002 | Shared global structured listing/pricing + reviewed local import | 1 |
| US-PROP-001 | Authenticated saved properties and per-user Agent/Brand profiles | 2 |
| US-PROP-004 | Pending/applied bindings, customization, Apply/Undo and reopen isolation | 3 |
| US-PROP-003 | Superseded slice scope → 002 + EDIT025; remote extraction deferred | No independent execution |
| US-PROP-006 | Superseded slice scope → 001 + EDIT025 + EDIT022 | No independent execution |
| US-PROP-007 | Superseded slice scope → 002 + 004 + EDIT025/020 | No independent execution |

Profile persistence needed by this slice is owned by US-PROP-001; onboarding, QR and broader US-AI-028 work are not implicitly completed. US-PROP-005 proven-template/version extensions are not a prerequisite for reusing existing templates in US-EDIT-022. No photo ranking/roles/packs, AI Assistant, MLS/RERA, generation changes or default-route change. [Integration matrix](../../../../research/2026-11-13-LISTING-V3-INTEGRATION-MATRIX.md).

## Implementation Update — 2026-11-13
Canonical global Listing contract, authenticated properties/personal profiles and V3 pending/applied state implemented locally. Additive migration deployed to configured local DB; historical Property data retained. Actual verification in docs/research/2026-11-13-V3-LISTING-IMPLEMENTATION.md; no merge/Done claim.


## Release reconciliation — 2026-11-14

2026-11-14 — reconciled from committed Opus baseline3e95a40; implementation present, release hardening/review and UI/font acceptance in progress; not merged Done. See docs/research/2026-11-14-V3-RELEASE-HARDENING.md. The implementation count includes existing locally verified cards, not merged story closures. No Assistant/provider/cutover implementation is added.
