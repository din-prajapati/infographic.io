---
title: "ADR-002: Marketing-automation thesis vs EPIC-KIT-01 — recorded, not decided"
type: decision
tags: [orion, adr, strategy, kit, product]
updated: 2026-08-12
---

# ADR-002: Marketing-automation thesis vs EPIC-KIT-01 — recorded, not decided

> **Status:** 🟡 **Proposed — deliberately not decided.** Recorded on 2026-08-12 for evaluation at a later stage, so the reasoning is not re-derived from scratch.
> **Date:** 2026-08-12
> **Deciders:** Dinesh (pending)
> **Scope:** EPIC-KIT-01 · EPIC-AI-06 · pricing/GTM

## Context

An external product analysis proposed repositioning the product from "AI infographic generator" to **"Real Estate Marketing Automation: turn one listing into a complete branded campaign in seconds."** Input a listing URL or photos; output Instagram feed/story, Facebook, WhatsApp, flyer, carousel, open-house poster, email asset, captions and hashtags.

**On review, roughly 80% of that thesis is already this repo's stated strategy.** [EPIC-KIT-01](../epics/phase-1-ai-core/EPIC-KIT-01/EPIC.md), written 2026-07-03, states:

> *"One listing in → a complete marketing kit out: Instagram post (1:1), Instagram story (9:16), A4 flyer (print-ready), WhatsApp card, and email header — from one extraction, one brand profile, with exact text verified on every asset."*

It also already contains the pricing argument: reframing SOLO from "image" (which *"loses to Ideogram Basic at ₹680/mo"*) to "listing kit" (*"₹2,999 ÷ 10 kits = ₹300/listing against a commission worth lakhs"*), plus lifecycle assets, a recurring-content engine and a compliance layer.

The analysis therefore **converges independently on the existing strategy**. That is useful validation. It means the actionable content is in the *deltas*, not the thesis — and this ADR exists to record those deltas rather than to adopt or reject the framing.

## Decision

**None taken.** This ADR records the gap analysis so a later decision is cheap. No story is created, no roadmap rank changes, no pricing changes as a result of this document.

## Coverage as of 2026-08-12

| Capability | State |
|---|---|
| Property data extraction | ✅ Built — `POST /extractions` → `extractedData` + `confidence` + `missingFields` + `suggestions`, persisted (US-AI-005) |
| Photo upload | ✅ Built (US-AI-010) |
| Brand: colors, agent, brokerage | 🟡 Partial — `brandColors[]`, brokerage, agent fields; brand indicator shipped (US-PANEL-01). No logo asset. |
| 1:1 / 9:16 / 16:9 | ✅ Built |
| Editable text layers | 🟡 In progress — US-AI-032 |
| Multi-asset bundle | 📋 Scoped, unbuilt — US-KIT-001/002 |
| Lifecycle assets | 📋 Scoped — US-KIT-004 |
| Compliance (RERA/MLS) | 📋 Scoped — US-KIT-006 |
| **URL ingestion** | ❌ Not scoped — extraction takes a natural-language `prompt`, never a URL |
| **AI copywriting** (captions, hashtags, description) | ❌ Not scoped anywhere |
| **Auto photo selection + per-format cropping** | ❌ Not scoped |
| **A4 print / PDF, carousel** | ❌ Named in KIT-01's goal; no format support exists |
| **CRM / lead tracking** | ❌ Not in the roadmap (EPIC-ORG-01 is teams, not CRM) |

## The four genuine deltas

1. **URL ingestion** (Zillow / Realtor / MLS / 99acres)
2. **AI copywriting** — captions, hashtags, property description
3. **Automatic photo selection and per-format cropping** — which of 20 listing photos, cropped how
4. **Print/PDF output** — A4 flyer and carousel are in KIT-01's goal text but have no format support

**Cheapest and highest-leverage: copywriting.** Pure LLM, near-zero COGS, universally wanted, no new infrastructure. If any single item is pulled forward, it is this one.

## Where the analysis is weak

- **URL ingestion is treated as a P0 checkbox; it is the hardest item on the list.** Zillow's ToS prohibits scraping. US MLS data requires IDX licensing negotiated per market. 99acres/India may be more tractable but that is unverified. Plausibly a partner integration or a late feature, not the first box in the funnel.
- **Pricing is denominated for a market we are not in.** $29/$59/$149/$299–999 implies US agents. The payment stack is **RazorPay INR primary with Stripe disabled**, plans are ₹2,999/₹6,999/₹24,999, and current testing uses Ahmedabad listings. Either the pricing or the GTM is wrong; that is a decision, not a detail.
- **It omits compliance entirely** — already scoped as US-KIT-006 and a genuine differentiator. RERA registration numbers are legally required on Indian property advertising. Auto-insertion is exactly the unglamorous feature that wins brokerage accounts and that Canva will not build.
- **The "7–14 day P0" is not credible against actual state.** Zero PRs merged, `v1.0.0` never tagged, production ~30 commits behind `main`, and the core generation mechanism was disproven on 2026-08-12 and is mid-rebuild. The P0 diagram assumes a working engine at its centre.
- **It inverts the roadmap's sequencing without addressing the reason.** EPIC-KIT-01 is ranked after revenue-on because kits are retention and price-justification work. Building retention before you can charge optimises for customers you do not yet have.

## Where the analysis is strong

- **"How many listings does one paying customer process per month?"** is the right metric, and it is nearly free to instrument — `UsageRecord` and the metering policy already track per-generation credits.
- **De-prioritising sophisticated image generation is correct**, and now evidence-backed rather than intuited: see [OQ-2 findings](../../testing/reports/oq2-image-weight-2026-08-12/FINDINGS.md). $0.45 of live calls produced a fabricated building, a fabricated agent face and an invented phone number.
- **10–20 real agents before a public launch**, and treating MRR projections as aspiration rather than forecast.

## One contradiction to resolve before any adoption

The analysis states *"the user should never think about templates."*

- ✅ Correct as **UX** — no template picker; the user describes a listing and receives assets.
- ❌ Wrong if read as **architecture**. [US-AI-043](../epics/phase-1-ai-core/EPIC-AI-06/stories/US-AI-043/STORY.md) exists precisely because the LLM *cannot* lay out freely — its constrained run rendered the headline and price on top of each other ([spike evidence](../../testing/reports/spike-pure-canvas-2026-08-12/FINDINGS.md)).

Both hold simultaneously: the user never sees a template; the system requires a template registry. **Recorded explicitly so this line is never later read as "delete the layout engine."**

## Alternatives Considered

- **Adopt the thesis wholesale and re-plan** — rejected for now: it is ~80% the existing plan, and the remainder inverts a sequencing decision whose rationale still holds.
- **Reject and continue unchanged** — rejected: four genuine gaps were identified, and copywriting in particular is cheap and missing.
- **Start a separate product** — rejected outright; the analysis itself argues against this, and correctly.

## Consequences

- ➕ Convergent external validation of EPIC-KIT-01's framing, recorded with evidence.
- ➕ Four concrete gaps identified without disturbing current work.
- ➖ No decision taken, so nothing improves until this is revisited.
- ⚠️ The **INR-vs-USD positioning question is unresolved and blocks any pricing work.** It touches the payment provider, plan tiers and target market simultaneously.
- ⚠️ If URL ingestion is ever pulled forward, the legal review must precede the engineering estimate.

## Revisit when

Any one of: (a) the M-AI-17/18 re-scope lands and EPIC-AI-06 is stable again; (b) the beta ships and 10 agents have been interviewed; (c) a pricing or market decision is forced by something else.

## References

- [EPIC-KIT-01](../epics/phase-1-ai-core/EPIC-KIT-01/EPIC.md) — the existing kit strategy
- [OQ-2 findings](../../testing/reports/oq2-image-weight-2026-08-12/FINDINGS.md) — why image generation is a liability
- [Pure-canvas spike](../../testing/reports/spike-pure-canvas-2026-08-12/FINDINGS.md) — why templates are structural
- [US-AI-043](../epics/phase-1-ai-core/EPIC-AI-06/stories/US-AI-043/STORY.md) — layout engine
- [ROADMAP.md](../ROADMAP.md) — EPIC-KIT-01 ranked 4, after revenue-on
- `docs/research/2026-07-03-V4-PIPELINE-FIX-AND-PRODUCT-STRATEGY.md` — original kit reasoning
