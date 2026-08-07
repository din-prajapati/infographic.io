# M-GEN-02 — Output Localisation

> **Epic:** [EPIC-GEN-01](../EPIC.md) · **Status:** ✅ Done · **Closed:** 2026-08-07 · **Target:** 2026-08-08 (met)

## Scope
Make the strings printed on a generated infographic follow the listing's market rather than a
hardcoded US default: currency symbol, magnitude abbreviation, digit grouping, area unit and room
vocabulary. Ships the mechanism plus `en-US` and `en-IN`; an unrecognised market must degrade to
passthrough, never block.

**Why this belongs to EPIC-GEN-01:** the epic's goal is *"every AI generation renders exact,
garble-free text"*, and it owns `infographic-prompt.builder.ts` — the single choke point every
on-image string flows through. A wrong currency symbol is a defect in that same contract: the
builder hardcoded `$`, so an agent entering ₹85,00,000 advertised their flat as "$8.5M", and the
exact-text verify layer then certified the wrong number as faithfully rendered.

## Stories
| Story | Title | Status |
|-------|-------|--------|
| [US-GEN-003](../stories/US-GEN-003/STORY.md) | Locale-aware output: currency, numbering, area unit, room vocabulary | ✅ Done — [#28](https://github.com/din-prajapati/infographic.io/pull/28) |

## Definition of Done
- [x] Locale table lives in `shared/` so client and server read one copy, no drift
- [x] `en-IN` renders ₹, lakh/crore, Indian 2-2-3 grouping and BHK
- [x] `en-US` byte-identical to pre-story output — the E3 contract test passes against the recorded artifact
- [x] Passthrough proven: an unsupported market echoes the typed currency and is never blocked
- [x] Locale is visible and overridable before a credit is spent (US-PANEL-01 D4 rule)
- [x] Billing never informs output formatting — guard test on the formatting path
- [x] PR merged; STORY.md status ✅ — [#28](https://github.com/din-prajapati/infographic.io/pull/28), 2026-08-07
- [x] Closeout cascade

## Deferred out of this milestone
- **Org-wide default locale** — [BL-05](../../../../BACKLOG.md), analysis in
  [docs/research/2026-08-06-LOCALE-ORG-DEFAULT-OPTIONS.md](../../../../../research/2026-08-06-LOCALE-ORG-DEFAULT-OPTIONS.md).
  The resolver rung exists and is tested; nothing persists it yet.
- **Locales beyond `en-US` / `en-IN`** — adding one is a data change to the table, not code.
  India-first was a deliberate scoping call (US-GEN-003 D1), not a limitation of the mechanism.
- **Rent/lease pricing** (period suffixes, sale-vs-rent axis) — US-GEN-003 D5.
- **App UI translation** — a different and much larger job; explicitly not this.

*Created: 2026-08-06*
