---
title: M-MKT-01 — Market Foundation
type: milestone
tags: [mkt, locale, generation]
updated: 2026-09-08
---

# M-MKT-01 — Market Foundation

> **Status:** 🔲 Not Started — drafted 2026-09-08, parked (see epic Sequencing)
> **Epic:** [EPIC-MKT-01](../EPIC.md)
> **Target date:** TBD — trigger is beta evidence, not a date
> **Depends on:** BL-05 (persisted `Organization.defaultLocale`) for US-MKT-002

---

## Scope

The data layer, and one consumer of it. Establishes what a market *is* in this codebase and gets that knowledge as far as the generation call — without yet exposing any of it in the UI.

Deliberately excludes the offshore axes and the override surface. Those need this to exist first, and splitting here keeps the milestone reviewable: everything below is server-and-shared-code only.

## Stories

| Story | Title | Size | Est. |
|-------|-------|------|------|
| US-MKT-001 | `MarketProfile` in `shared/locale.ts` — IN, US, AE, GB | L | ~6–8h |
| US-MKT-002 | Market resolution + persisted org default (closes BL-05) | M | ~3–4h |
| US-MKT-003 | Market context into extraction + orchestrator | M | ~4h |

## Acceptance

- [ ] `MarketProfile` extends `shared/locale.ts` rather than introducing a parallel market concept
- [ ] Profiles exist for the market list settled by epic open question 1 (IN and US at minimum)
- [ ] `resolveMarket()` follows the existing precedence and returns `null` for an unrecognised market rather than defaulting to a guess
- [ ] `Organization.defaultLocale` is persisted and readable — BL-05 closes with this milestone
- [ ] The extraction system prompt carries market context, and its schema can represent BHK, area basis, and a market compliance identifier
- [ ] A listing in each supported market's ordinary phrasing generates collateral with locally correct currency, area unit and basis, and room notation
- [ ] The existing guard test proving locale never reads billing still passes, unweakened
- [ ] No new refusal path — every market check degrades rather than blocking (epic constraint 3)
- [ ] Gate 1 green

## Verification

Gate 1 (tsc + unit) mandatory. Gate 2 needs one native-format sample listing per supported market, generated end-to-end and inspected — a unit test can prove the profile table is right but not that the rendered collateral reads as locally authored.

## Out of Scope

- Three-axis subject/author/audience model — M-MKT-02
- Any override UI — M-MKT-02
- Replacing the 400 rejection — M-MKT-02
- App i18n, translation, currency conversion — epic-level out of scope

## Notes

`shared/locale.ts` already carries the currency, digit-grouping, abbreviation and room-format tables, plus a resolution chain with an override rung at the top. This milestone widens that module; it does not replace it. The BL-22 validator's original sin was being written next to this module while ignoring it.
