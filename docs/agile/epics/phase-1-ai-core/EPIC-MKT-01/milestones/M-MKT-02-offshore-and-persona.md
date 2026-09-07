---
title: M-MKT-02 — Offshore Authoring & Persona
type: milestone
tags: [mkt, offshore, persona, extraction]
updated: 2026-09-08
---

# M-MKT-02 — Offshore Authoring & Persona

> **Status:** 🔲 Not Started — drafted 2026-09-08, parked (see epic Sequencing)
> **Epic:** [EPIC-MKT-01](../EPIC.md)
> **Target date:** TBD
> **Depends on:** M-MKT-01 (a market must exist before it can be overridden)

---

## Scope

Makes the market a thing the user controls rather than a thing the system infers, and removes the last path by which a prompt can be refused outright.

Delivers the offshore capability: an agency authoring collateral for a market that is not its own, without claiming to be local.

## Stories

| Story | Title | Size | Est. |
|-------|-------|------|------|
| US-MKT-004 | Three-axis market model — subject, author, audience | L | ~5h |
| US-MKT-005 | Market + persona override UI | M | ~3h |
| US-MKT-006 | Structured partial extraction result replaces the 400 | M | ~4h |

## Acceptance

- [ ] Subject, author and audience markets resolve independently, each defaulting to the resolved market
- [ ] Overriding one axis leaves the other two untouched
- [ ] The worked example round-trips: subject AE + author IN produces AED pricing, Gulf conventions and a DLD permit line, over the Indian agency's own brand and RERA
- [ ] Persona is settable and changes which compliance identifier is shown (agent RERA and project RERA are different numbers)
- [ ] The default path is unchanged for a user who never opens the override — one control, not three, until they ask for three
- [ ] Extraction returns `{ extracted, missing, confidence }` instead of throwing `400`; a low-confidence result generates anyway and surfaces what was understood as editable chips
- [ ] No prompt is refused for the *shape* of what was typed, in any market (epic constraint 3, BL-22)
- [ ] Gate 1 green

## Verification

Gate 1 mandatory. Gate 2 must include the offshore worked example end-to-end and at least one low-confidence prompt confirming it generates with correction chips rather than a refusal.

**Regression watch:** US-MKT-006 removes the last validation rejection. The BL-22 tests (`api/tests/infographics/bl-22-missing-fields.spec.ts`) pin the *current* 400 contract and will need rewriting, not deleting — the guarantee they encode (never name a field that is not missing, never invent a pair) must survive the change of shape.

## Out of Scope

- Translation of generated copy
- Currency conversion rates for the audience-market equivalent — needs a rate source and its own decision
- Per-brokerage custom market profiles — code-defined profiles first (epic open question 2)
- Automatic market detection beyond the timezone rung already in `resolveLocale()`

## Notes

The three-axis model is the part of this epic with the least evidence behind it and the most design risk. It is also the only part that answers the offshore requirement as actually stated. If beta shows no offshore usage, US-MKT-004 and US-MKT-005 are the first things to cut; US-MKT-006 stands on its own and could be pulled forward independently, since it removes a refusal path rather than adding a capability.
