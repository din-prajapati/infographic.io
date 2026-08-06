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

## Follow-up A — currency as explicit UI state, not parsed text

**Raised by the story owner, 2026-08-06:** *"did we just allow the user to input the currency
within the price field?"*

**Clarification first:** the field was already free text. `PropertyInfo.price` has always been
`price: string`, and the placeholder has always been `$450,000`, so agents were already typing
symbols. US-GEN-003 did not widen the contract — it stopped *discarding* the symbol
(`formatPriceShort` used to strip it and hardcode `$`).

**Why the current shape holds:** no new required field, no added friction, and it works in AI chat
where there is no form at all — just free text like *"3BHK in Powai at ₹85 lakh"*. The chip makes
the inference visible and one click corrects it.

**The cleaner end-state:** treat currency as explicit UI state rather than parsed text — render the
resolved symbol as a fixed, non-editable prefix inside the input (`₹ [85,00,000]`), accept digits
only, and change currency via the chip.

| | Current (parse the typed symbol) | Proposed (symbol as prefix) |
|---|---|---|
| Ambiguity | Fuzzy — `Rs` / `₹` / `INR` all need mapping | None; currency is state, not text |
| Friction | Zero | Zero once resolved |
| Chat surface | Works — same helper reads the message | Needs a separate path; chat has no field |
| Unsupported markets | Passthrough echoes anything typed | Needs a currency picker or free-text escape |

**Not obviously a win.** It removes ambiguity in the form but loses the highest-precision signal we
have, and the chat surface still needs free-text parsing regardless. Worth doing only if we see
real evidence of agents mis-typing currency. **Estimated:** ~2h for the form; chat unchanged.

---

## Follow-up B — `₹85 lakh` (word magnitudes) is UNVERIFIED

If an agent types the price in words — `₹85 lakh`, `1.2 crore` — rather than digits, the raw text
reaches `PromptExtractorService`, which must interpret "85 lakh" as `8500000`. An LLM plausibly
does; if it instead returns `85`, the infographic prints **₹85**.

This is a realistic way an Indian agent writes a price, so it deserves a test rather than an
assumption. US-GEN-003 deliberately did not touch number extraction — the client-side symbol
reading is correct either way (it rejects `lakh`/`crore` as magnitude words, not currencies).

**Attempted verification 2026-08-06 — blocked.** Called the extraction-only endpoint
(`POST /api/v1/infographics/generations/extractions`, an LLM call with no image generation, so
negligible cost) with three Indian phrasings. All three returned:

```
429 You have no credits remaining  (OpenAI)
```

So the behaviour remains **unknown, not confirmed working**. Recipe for whoever picks this up:

```bash
TOK=$(curl -s -X POST localhost:5000/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"...","password":"..."}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
curl -s -X POST localhost:5000/api/v1/infographics/generations/extractions \
  -H 'Content-Type: application/json' -H "Authorization: Bearer $TOK" \
  -d '{"prompt":"3 BHK at Powai Mumbai listed at Rs 85 lakh, 2 bathrooms, 1450 sqft"}'
# PASS = "price": 8500000     FAIL = "price": 85
```

Also test `1.2 crore` → `12000000` and `85,00,000` → `8500000`.

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
