# Locale org-default persistence — options analysis (pending decision)

> **Status:** 🟡 Open — no decision taken. Parked deliberately during US-GEN-003.
> **Raised:** 2026-08-06, from US-GEN-003 finding **F1**.
> **Backlog ref:** [BL-05](../agile/BACKLOG.md)
> **Related story:** [US-GEN-003](../agile/epics/phase-0.5-foundation/EPIC-GEN-01/stories/US-GEN-003/STORY.md)

---

## The finding

US-GEN-003 shipped a four-rung locale resolution chain:

```
property.locale (override) → currency symbol the user typed → orgDefault → browser timezone → passthrough
```

`resolveLocale()` accepts `orgDefault` and its precedence is unit-tested, **but nothing populates
it.** There is no `Organization.defaultLocale` column, no migration, and no settings control. The
live chain is effectively:

```
override → typed symbol → timezone → passthrough
```

That is fully functional — an agent's first `₹` resolves the locale, and the per-property override
always wins. The rung was left plumbed-but-unfed rather than half-built.

---

## Does the rung earn its place?

It only fires when **all three** hold: no per-property override, **and** no currency symbol typed,
**and** the browser timezone is unhelpful.

Two things narrow that window further:

- US-GEN-003 AC7 made the price placeholder locale-aware, so an `en-IN` user now sees
  `₹85,00,000` and is actively nudged to type `₹` — which resolves via the typed-symbol rung.
- Most agents are physically located in the market they sell in, so timezone is usually right.

**Genuine remaining cases:** agents travelling or on a VPN, and brokerages wanting one setting
across many agents. Real, but narrow — which is the argument against spending four hours on it
immediately.

---

## Options

| | Cost | What it buys | Notes |
|---|---|---|---|
| **A — Persist on Organization** | ~3–4h | True org-wide default, shared across a brokerage's agents | Prisma column + migration + a new `PATCH /users/organization` endpoint (none exists today — `users.controller.ts` only has member invite/remove) + a select in the existing `OrganizationScreen.tsx` |
| **B — localStorage first** ⭐ | ~1h | The chosen locale sticks across sessions for that browser | No backend, no migration. Feeds the existing `orgDefault` slot |
| **C — Delete the rung** | ~15m | A clean 4-step chain, no dead plumbing | Throws away tested precedence that will be wanted back |

---

## Recommendation (not yet approved): **B now, A once TEAM/BROKERAGE has paying users**

1. **There is a direct precedent, and it is this exact call.** US-PANEL-01 explicitly listed
   *"Saving chosen palette per-user to database — localStorage is acceptable for Phase 1"* as Out
   of Scope, and `custom-brand-palettes` already persists that way. Same class of preference;
   reusing the same answer is consistent rather than ad hoc.
2. **A migration is badly timed right now.** Production is several commits behind `main`, has
   never been tagged `v1.0.0`, and Phase 0 HUMAN Task 3 is the sole blocker on the board. Adding a
   schema change to an already-overdue deploy is poor risk for a narrow-window feature.
3. **B converts dead plumbing into live code.** Today `orgDefault` is a tested parameter nothing
   feeds. Option B makes it real, so F1 stops reading as "half-built".

**If B is chosen,** rename the resolver input `orgDefault` → `savedDefault`, so the name stops
implying a database column that does not exist.

**What B does *not* give you:** brokerage-wide consistency. One agent's setting will not propagate
to their colleagues. That genuinely needs A, and genuinely can wait until TEAM/BROKERAGE tiers have
paying users — at which point A is also easier to justify, since the settings surface
(`OrganizationScreen.tsx`) already exists and only lacks a write path.

---

## Adjacent items found alongside this (also open)

- **`DEMO_MODE` price regex truncates Indian numbers.** `extractPriceFromPrompt`
  (`prompt-extractor.service.ts:300`) uses `/\$?(\d{1,3}(?:,\d{3})*(?:k|K)?)/` — `$`-only and
  Western 3-digit grouping. Against `₹85,00,000` the `(?:,\d{3})*` group fails on `,00,`, so it
  matches `85` and returns a price of **85**. Demo mode only, so it never reaches a paying user,
  but it is a real defect.
- **No sale/rent axis on `PropertyInfo`.** The extractor already returns
  `listingType: for_sale | for_rent | sold`, but the client property model has no equivalent, and
  rental pricing needs a period suffix (`₹45,000/month`). US-GEN-003 D5 ruled this out of scope.

---

*Analysis recorded 2026-08-06. No decision taken — revisit when scheduling locale follow-up work.*
