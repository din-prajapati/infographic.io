---
title: EPIC-MKT-01 — Market-Aware Generation
type: epic
tags: [mkt, locale, i18n, generation, compliance]
updated: 2026-09-08
---

# EPIC-MKT-01 — Market-Aware Generation

> **Phase:** Phase 1 — Revenue Strategy
> **Status:** 🔲 Not Started — drafted 2026-09-08
> **Source:** [BL-22](../../../BACKLOG.md) steps 2–5. Steps 0–1 shipped separately in `cd6f8e5`.
> **Depends on:** [BL-05](../../../BACKLOG.md) (persisted `Organization.defaultLocale`) — required by US-MKT-002
> **Related:** [US-KIT-006](../EPIC-KIT-01/stories/US-KIT-006/STORY.md) (compliance layer) consumes this epic's compliance data — see Boundary below
> **Linear Project:** LIN-EPIC-MKT-01
> **Target date:** TBD — see Sequencing
> **Owner:** Dinesh

---

## Goal

**Outcome:** An agent anywhere the product is sold can describe a listing the way their own market describes it, and get back collateral that reads as locally authored — right currency, right units, right vocabulary, right regulatory line. An agency working offshore can produce collateral for a market that is not their own, without pretending to be local.

**Why now:** BL-22 steps 0–1 stopped the product *refusing* non-US listings. They did not make the output correct. A generation for `3 BHK flat at Shela, Ahmedabad for ₹85 Lakh` is now accepted — but the extraction schema has no slot for BHK, no notion of carpet versus built-up area, and no idea what a RERA number is. The door is open; the room is still furnished for one country.

**Why it is not urgent:** every requirement here is derived from code analysis, not from user behaviour. No one has yet paid for a design in any market. This epic is deliberately drafted and parked — see Sequencing.

**Success metric:** For each supported market, a listing written in that market's ordinary phrasing produces collateral where currency, area unit and basis, room notation, and the compliance line are all locally correct, verified against a native-format sample listing per market.

---

## Evidence

Measured 2026-09-08 against the then-current client validator, using real listing phrasing:

| Market | Prompt | Pre-fix result |
|---|---|---|
| 🇺🇸 US | `3BR house at 123 Oak St, Austin TX for $450k` | ✅ pass |
| 🇮🇳 IN | `3 BHK flat at Shela, Ahmedabad for ₹85 Lakh` | ❌ address + price |
| 🇮🇳 IN | `4 BHK at 12 Sardar Patel Road, Ahmedabad 380058 for ₹1.2 Cr` | ❌ address |
| 🇮🇳 IN | `Villa in Whitefield, Bengaluru 560066 priced at ₹2.4 Cr` | ❌ address + price |
| 🇬🇧 UK | `2 bed flat at 14 Marylebone High Street, London W1U 4PZ for £750,000` | ❌ address |
| 🇦🇪 AE | `3 bedroom apartment in Dubai Marina for AED 2,400,000` | ❌ address + price |
| 🇸🇬 SG | `4 room HDB at 120 Toa Payoh Lorong 1, Singapore 310120 for S$680,000` | ❌ address |
| 🇦🇺 AU | `3 bed house at 42 Chapel Street, Melbourne VIC 3000 for A$1,250,000` | ✅ pass |
| 🇺🇸 US | `123 Martin Luther King Blvd, Atlanta GA for $525,000` | ❌ **address** |

Seven of nine refused. The last row matters most: **this was never only an internationalisation bug.** The street pattern permitted exactly one word between number and suffix, so a plain US address failed too. Australia passed by luck.

Steps 0–1 (shipped, `cd6f8e5`) removed the gate, so all nine now reach the backend. **This epic is about what happens after they get in.**

---

## The three axes

A single "target market" selector cannot express offshore work. Three axes are needed, each independently overridable, all defaulting to the resolved market:

| Axis | Question | Drives |
|---|---|---|
| **Subject** | Where is the property? | Currency, area unit and basis, property vocabulary, local compliance ID |
| **Author** | Who is publishing? | Brand, the agent's own compliance ID, default language, persona |
| **Audience** | Who is being sold to? | Language, secondary currency, design conventions |

**Worked example.** An Ahmedabad agency producing collateral for a Dubai developer sets Subject = AE (AED, sq ft, DLD permit, Gulf conventions) while Author stays IN (their brand, their team, their RERA). Marketing that same Dubai tower to Indian NRI buyers sets Audience = IN — an AED headline with a ₹ equivalent. A one-axis model cannot say that sentence.

This is the concrete shape of "the user can override when creating assets for overseas clients in offshore capacities."

---

## Design constraints (inherited, non-negotiable)

`shared/locale.ts` already carries three rules from US-GEN-003. They were written for currency and they govern this epic unchanged:

1. **Never invent a market.** When resolution fails, echo what the user typed and print no symbol at all. An unknown market must degrade, never block and never guess. The pre-US-GEN-003 builder hardcoded `$`, so an agent entering ₹85,00,000 advertised their flat as "$8.5M".
2. **Never read billing.** A Dubai agent pays ₹2,999 through the single INR gateway, so billing currency would confidently report the wrong market. Enforced by an existing guard test — extend it, do not weaken it.
3. **Degrade, never block.** No market check may become a new refusal path. BL-22 is what happens when validation is allowed to say no.

**Extend `shared/locale.ts`; do not add a parallel concept.** The BL-22 validator was written independently of that module and hardcoded a market while the module beside it already refused to. A second market abstraction repeats the mistake.

---

## Milestones

| Milestone | Scope | Target | Status |
|-----------|-------|--------|--------|
| [M-MKT-01-market-foundation](milestones/M-MKT-01-market-foundation.md) | `MarketProfile` data layer, resolution with persisted org default, market context into extraction and the orchestrator | TBD | 🔲 |
| [M-MKT-02-offshore-and-persona](milestones/M-MKT-02-offshore-and-persona.md) | Three-axis subject/author/audience model, persona, override UI, structured partial extraction results | TBD | 🔲 |

---

## Stories in this Epic

| Story ID | Title | Milestone | Size | Est. | Status | PR |
|----------|-------|-----------|------|------|--------|----|
| US-MKT-001 | `MarketProfile` in `shared/locale.ts` — IN, US, AE, GB | M-MKT-01 | L | ~6–8h | 🔲 | — |
| US-MKT-002 | Market resolution + persisted org default (closes BL-05) | M-MKT-01 | M | ~3–4h | 🔲 | — |
| US-MKT-003 | Market context into extraction + orchestrator | M-MKT-01 | M | ~4h | 🔲 | — |
| US-MKT-004 | Three-axis market model — subject, author, audience | M-MKT-02 | L | ~5h | 🔲 | — |
| US-MKT-005 | Market + persona override UI | M-MKT-02 | M | ~3h | 🔲 | — |
| US-MKT-006 | Structured partial extraction result replaces the 400 | M-MKT-02 | M | ~4h | 🔲 | — |

**Epic total:** ~25–28h.

---

## Features in this Epic

| Feature ID | Scope | Stories |
|------------|-------|---------|
| F-MKT-01 | Market data layer and resolution | US-MKT-001, US-MKT-002 |
| F-MKT-02 | Market-aware generation | US-MKT-003 |
| F-MKT-03 | Offshore authoring (three axes + persona) | US-MKT-004, US-MKT-005 |
| F-MKT-04 | Non-refusing extraction contract | US-MKT-006 |

---

## Shape of `MarketProfile`

Indicative, not final — US-MKT-001 settles it.

```ts
export interface MarketProfile {
  id: MarketId;                    // 'IN' | 'US' | 'AE' | 'GB'
  locale: LocaleId;                // reuse the existing currency/grouping/abbreviation table
  language: string;

  vocabulary: {
    propertyTypes: string[];       // IN: Flat, Villa, Independent House, Builder Floor, Plot
                                   // AE: Apartment, Villa, Townhouse, Penthouse
    areaBasis:     string[];       // IN: Carpet / Built-up / Super Built-up  (US has no equivalent)
    roomFormat:    'BHK' | 'BED';  // already present as LOCALES.formatRooms
    tenure?:       string[];       // GB: Freehold / Leasehold — legally material
  };

  compliance: {
    idLabel?: string;              // IN: 'RERA'  ·  AE: 'DLD Permit'  ·  US: 'MLS#'  ·  GB: 'EPC'
    required: boolean;
  };

  design: { areaUnit: 'sqft' | 'sqm'; dateFormat: string; };
}
```

**Why `areaBasis` is not optional detail.** In India "1,450 sq ft" is meaningless without carpet / built-up / super built-up, and quoting the wrong one is a live RERA exposure. A US-shaped schema cannot represent it, which is exactly why it belongs in the profile rather than in a prompt string.

---

## Open questions

1. **Which markets ship first?** IN and US are certain. AE and GB are assumptions. **Beta usage should decide this, not this document.**
2. **Does `MarketProfile` live in the DB or in code?** Code is simpler and versioned; DB allows per-brokerage overrides without deploy. Code first is the recommendation.
3. **Does audience-market imply translation?** Out of scope here — this epic covers convention, not language generation.
4. **Persona granularity.** `individual-agent | brokerage | developer | property-manager` is a guess. Agent versus developer is the split with evidence behind it (project RERA and agent RERA are different numbers); the rest is speculation.

---

## Boundary with EPIC-KIT-01

[US-KIT-006](../EPIC-KIT-01/stories/US-KIT-006/STORY.md) ("Compliance layer — license #, RERA/MLS text, disclaimers auto-inserted") overlaps this epic's `compliance` block. The split:

- **EPIC-MKT-01 owns the data** — which identifier a market requires and what it is called.
- **EPIC-KIT-01 owns the placement** — rendering that identifier onto each asset in a kit.

Whichever ships first defines the interface. If EPIC-KIT-01 goes first it should read from `MarketProfile.compliance` even if only `IN` and `US` are populated, rather than growing a second compliance table.

---

## Out of Scope (Epic Level)

- App i18n — this localises what is printed on generated collateral, not the product UI
- Language translation of generated copy
- Currency conversion rates (an audience-market ₹ equivalent needs a rate source; that is its own decision)
- Market-specific pricing or plan changes — PAY domain
- Automatic market detection from IP or browser locale — timezone is already a rung in `resolveLocale()` and going further invites the guessing that constraint 1 forbids
- Re-adding any client-side prompt gate, in any form. BL-22 is the record of why

---

## Sequencing — read before scheduling

This epic is **drafted and parked on purpose.**

The 2026-09-07 product review named EPIC-KIT-01, EPIC-PAY-05 and EPIC-AI-01 as work derived from code analysis rather than user behaviour, and recommended stopping all of it until beta produces evidence. **EPIC-MKT-01 is in that same category** and this document should not be read as arguing otherwise.

What separates BL-22 steps 0–1, which shipped immediately, from steps 2–5, which did not: steps 0–1 fixed a door that turned away paying users in the primary market — a defect with measured evidence against real listings. Steps 2–5 improve output quality for markets that currently have **zero users**.

**Recommended trigger:** schedule M-MKT-01 when beta shows real generations from a market whose conventions the output gets wrong, and let the observed markets choose the profile list. Until then, open question 1 has no defensible answer and building four profiles risks building three wrong ones.

---

## References

- [BL-22, BL-05](../../../BACKLOG.md) — source defects
- `shared/locale.ts` — the existing foundation and its three design rules
- [US-GEN-003](../../phase-0.5-foundation/EPIC-GEN-01/stories/US-GEN-003/STORY.md) — locale conventions for generated output
- [docs/research/2026-08-06-LOCALE-ORG-DEFAULT-OPTIONS.md](../../../../research/2026-08-06-LOCALE-ORG-DEFAULT-OPTIONS.md) — BL-05 options, already costed
- Commit `cd6f8e5` — BL-22 steps 0–1 as shipped
