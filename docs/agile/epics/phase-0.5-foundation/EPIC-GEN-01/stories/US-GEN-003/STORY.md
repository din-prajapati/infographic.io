# US-GEN-003 — Locale-Aware Output: Currency, Numbering, Area Unit, Room Vocabulary

> **Epic:** [EPIC-GEN-01](../../EPIC.md)
> **Milestone:** [M-GEN-02-output-localisation](../../milestones/M-GEN-02-output-localisation.md)
> **Size:** M · **Status:** ✅ Done · **Closed:** 2026-08-07 · **PR:** [#28](https://github.com/din-prajapati/infographic.io/pull/28)
> **Priority:** P0 — live defect in the primary market
> **Persona:** Listing agent or private seller marketing a property in any country
> **Branch:** `feat/gen/us-gen-003-locale-aware-output`

---

## User Story

*As an* agent marketing a property in my own country,
*I want* the price, area, and room description on my infographic to use my market's conventions,
*So that* what I publish is accurate — and not a number that reads as 85× wrong to anyone who sees it.

---

## Current Reality (verified 2026-08-06)

**There is no locale, country, or region field anywhere in the product.** Not on `User`, not on
`Organization`, not in `PropertyInfo`, not in the `ai-generation` module. The only `currency`
fields in `schema.prisma` are on payment models (`Subscription`, `Payment`, `Invoice`).

### The live defect

`api/src/modules/ai-generation/services/infographic-prompt.builder.ts:31-38`:

```ts
const num = ... price.replace(/[^0-9.]/g, '');   // strips the currency symbol
if (num >= 1_000_000) return `$${...}M`;         // then hardcodes "$"
```

An agent enters **₹85,00,000** (85 lakh, ≈ $100K):

1. The regex deletes `₹` and the commas → `"8500000"`
2. `>= 1_000_000` → renders **`$8.5M`**

The infographic advertises an ₹85 lakh flat as **$8.5 million**. Wrong symbol, and to a
dollar-reading viewer an ~85× overstatement — rasterised into the image.

**Two aggravating factors:**

- **The verify layer certifies the error.** `verifyAndRepairV4JsonPrompt` confirms `$8.5M`
  appears correctly on the output. Our correctness machinery guarantees the wrong number is
  rendered faithfully.
- **The UI teaches it.** Every placeholder is US-shaped: price `$450,000`, phone
  `(555) 123-4567`, address `123 Main Street, City, State`, licence `RE123456`. An Indian agent
  is actively prompted to type a dollar sign.

### What else is hardcoded

| Facet | Shipped behaviour | Location |
|---|---|---|
| Currency symbol | `$` always | `formatPriceShort` |
| Abbreviation | `K` / `M` only | `formatPriceShort` |
| Digit grouping | Western 3-3 (`8,500,000`) | `toLocaleString()` default |
| Area unit | `SQ FT` always | `formatSqft` |
| Room vocabulary | `3 BED \| 2 BATH` always | `derivePromptParts` |

### Decisions taken during analysis (2026-08-06)

- **D1 — India-first, but no locale may be a blocker.** Ship the mechanism with `en-IN` and
  `en-US` validated. Global users already transact today (Razorpay accepts international cards
  for INR charges), so an unrecognised market must degrade gracefully, never block.
- **D2 — Locale and billing are strictly decoupled.** Billing currency was initially considered a
  high-precision locale signal. It is **disqualified**: under the single INR gateway a Dubai
  agent pays ₹2,999, so billing would confidently report "INR" for a user whose listings are in
  AED. This does not improve when Stripe lands — provider routing reflects *where we can
  collect*, not *where the property is*. No code in this story may read a payment field.
- **D3 — The property owns locale; the org defaults it.** Mirrors the existing
  `Organization.brandColors` → per-design override pattern.
- **D4 — Inferred, never silently applied.** US-PANEL-01's D1 rule applies unchanged: never apply
  a default the agent did not choose to a paid generation. Inference is fine; invisible inference
  is not.
- **D5 — Rent is out of scope.** `PropertyType` has no sale/rent axis at all, and rentals need a
  period suffix (`₹45,000/month`). Logged as a separate gap.

---

## Harden findings (2026-08-06)

**The drafted AC1 was unimplementable.** It assumed the builder could read the currency symbol
from the typed price. It cannot — the symbol is destroyed two layers upstream.

**Traced the real path:** the client never sends structured property data. `handleGenerate` sends
a *text prompt* built by `buildPropertyPrompt`, which the server feeds to
`PromptExtractorService.extractPropertyData()` — an LLM call whose contract is explicit:

```
- price: numeric price value          // system prompt, prompt-extractor.service.ts:64
  "price": number | null,             // response schema, :76
  price?: number;                     // ExtractedPropertyData, :10
```

So by the time `derivePromptParts` runs, `propertyData.price` is a bare `number`. **There is no
currency information left to parse.** Drafting AC1 around builder-side symbol parsing would have
produced a story that compiles, passes, and changes nothing for any non-USD user.

**Corrected design — resolve locale client-side, carry it on the DTO.** The raw string the user
typed exists only in the client (`usePropertyStore.property.price`, or the chat message text).
Locale is resolved there and sent explicitly; the builder consumes `propertyData.locale` and does
no parsing at all. This is both correct and *smaller* — it leaves the LLM extraction contract
untouched.

**Second defect found, kept out of scope.** The demo-mode fallback
`extractPriceFromPrompt` (:300) uses `/\$?(\d{1,3}(?:,\d{3})*(?:k|K)?)/` — `$`-only, and Western
3-digit grouping. Against `₹85,00,000` the `(?:,\d{3})*` group fails on `,00,` so it matches
**`85`** and returns a price of **85**. Real damage, but `DEMO_MODE` only — logged as a separate
defect rather than widening this story.

**Third observation.** The extractor already returns `listingType: for_sale | for_rent | sold`,
so a rent concept exists server-side even though `PropertyInfo` has no sale/rent axis. Reinforces
D5 (rent is a genuine separate gap), no change here.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** ⚠️ *Delivered except step 3 — see F1.* A pure `resolveLocale()` in
      `shared/locale.ts` (moved from `client/src/lib/` during implementation so the server can
      read the same table) resolves **client-side, before the request is sent**, first match wins:
      **1.** `property.locale` (explicit override) →
      **2.** currency symbol parsed from the raw text the user typed (the price field, or the
      chat message) →
      **3.** `organization.defaultLocale` →
      **4.** browser timezone at first touch (seeds the org default only) →
      **5.** `null` → passthrough mode (AC4).
      The resolved value travels on the generation DTO as `locale`; `derivePromptParts` reads
      `propertyData.locale` and performs no parsing of its own. No payment or subscription field
      appears anywhere in this chain (D2).

- [x] **AC2 [happy-path]:** With locale `en-IN`, `derivePromptParts` renders
      `₹85,00,000` → **`₹85 Lakh`**, `₹1,20,00,000` → **`₹1.2 Cr`**, Indian 2-2-3 digit grouping,
      area as `SQ FT`, and rooms as **`3 BHK | 2 BATH`**.

- [x] **AC3 [regression]:** With locale `en-US`, `buildImagePrompt` output is **byte-identical to
      today** — the existing E3 contract test
      (`api/tests/ai-generation/infographic-prompt.builder.spec.ts`) passes unmodified.

- [x] **AC4 [null-input]:** When no locale resolves, the builder enters **passthrough**: it echoes
      the symbol the user typed (`AED 1,200,000` → `AED 1.2M`) and, when no symbol was typed,
      emits digits with **no invented symbol**. `$` is never substituted for an unresolved
      currency. Generation completes normally.

- [x] **AC5 [error-path]:** An unknown locale code, or a locale-table entry missing a required
      facet, falls back **per facet** to passthrough/default rather than failing — generation is
      never blocked and no exception reaches the user. A malformed price string that yields no
      digits omits the price line entirely, as today.

- [x] **AC6 [happy-path]:** The resolved locale is visible at the point of impact as a compact,
      clickable chip (e.g. `₹ INR · sq ft`) near the price field, reusing the US-PANEL-01 brand
      indicator pattern. Clicking it sets `property.locale`, overriding the resolution chain for
      that property only. No new required field is introduced.

- [x] **AC7 [happy-path]:** `PropertyDetailsForm` and `AgentInfoForm` placeholders derive from the
      resolved locale, so an `en-IN` user sees `₹85,00,000` rather than `$450,000` — the form
      stops coaching the wrong currency into the field that AC1 step 2 reads.

- [x] **AC8 [edge-case]:** A guard test asserts that the **output-formatting path** —
      `shared/locale.ts` and `infographic-prompt.builder.ts` — reads no payment or plan field,
      enforcing D2 against future drift.

      > **Corrected during implementation.** AC8 originally claimed *no module under
      > `ai-generation/`* may read `planTier`. That was factually wrong: `ai-orchestrator`
      > legitimately reads `planTier` to choose the text model (Gemini on some tiers, GPT-4o
      > otherwise) and passes it to `openai.service`. That is plan-based feature gating and has
      > nothing to do with locale. Writing the guard exposed it. The invariant worth protecting
      > is narrower — billing must never reach the strings printed on the image — so the guard
      > was scoped to the two files that produce them, with comments stripped before matching
      > since both *explain* D2 in prose.

**Coverage:** `happy-path` ✅ (AC1, AC2, AC6, AC7) · `error-path` ✅ (AC5) · plus `null-input`
(AC4), `regression` (AC3), `edge-case` (AC8). Required set for the default domain policy is met.

---

## Minimum shippable subset

If Task 3 go-live timing demands it, **AC3 + AC4 alone** are independently shippable as a hotfix:
passthrough stops the `$8.5M` misstatement using only what the agent typed, introduces no
invisible default (D4-compliant), and needs no schema change. AC1/AC2/AC6/AC7 then follow as the
full story.

---

## Depends On

- Nothing. `derivePromptParts` is already the single choke point for every on-image string.

## Out of Scope

- **UI translation / app i18n.** This story localises *generated output only*. Translating app
  chrome is a separate, far larger job — conflating them turns an M into an XL.
- **Rent/lease pricing** (period suffixes, `PropertyType` sale-vs-rent axis) — D5, separate gap.
- **Pricing-page and checkout currency display.** A global user seeing ₹2,999 at checkout is a
  billing-UX concern, not output formatting. Explicitly separate per D2.
- Compliance ID labelling (RERA / MLS / licence #) — US-KIT-006.
- Date formatting for Open House assets — US-KIT-004 AC3.
- Address-format localisation and IP geolocation.
- Locales beyond `en-IN` and `en-US` — the table must make adding one a **data change, not a code
  change**, but validating further markets is follow-up work.

---

## Design Behavior

### The locale table

A plain data map, one entry per locale, read by `derivePromptParts`:

```ts
interface LocaleConventions {
  currencySymbol: string;        // '₹'
  symbolPosition: 'before' | 'after';
  abbreviations: Array<{ threshold: number; suffix: string }>;
  digitGrouping: 'western' | 'indian';
  areaUnit: string;              // 'SQ FT' | 'm²'
  roomFormat: (beds: number, baths: number) => string;
}
```

| Facet | `en-US` | `en-IN` |
|---|---|---|
| Price | `$520K` | `₹85 Lakh` |
| Thresholds | 1e3 → K, 1e6 → M | 1e5 → Lakh, 1e7 → Cr |
| Grouping | `8,500,000` | `85,00,000` |
| Area | `SQ FT` | `SQ FT` |
| Rooms | `3 BED \| 2 BATH` | `3 BHK \| 2 BATH` |

> **Copy check needed:** `3 BHK | 2 BATH` keeps the bath count alongside the BHK convention.
> Indian listings vary between `3 BHK` alone and `3 BHK · 2 Baths`. Worth confirming with a real
> agent before locking the string.

### Why the placeholder fix (AC7) matters more than it looks

AC1 step 2 reads the symbol the agent typed. Today's placeholder literally shows `$450,000`,
which trains the wrong symbol into the highest-precision signal we have. Fixing the placeholder
closes the loop: an `en-IN` user sees `₹85,00,000`, types `₹`, and the symbol confirms the locale
rather than contradicting it.

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-GEN-003-01 | Unit | P0 | happy-path (AC2): `₹85,00,000` under `en-IN` → `₹85 Lakh`, never `$8.5M` | ✅ | |
| TC-GEN-003-02 | Unit | P0 | happy-path (AC2): `₹1,20,00,000` → `₹1.2 Cr`; Indian grouping applied | ✅ | |
| TC-GEN-003-03 | Unit | P0 | regression (AC3): full `en-US` E3 contract prompt byte-identical to today | ✅ | |
| TC-GEN-003-04 | Unit | P0 | null-input (AC4): `AED 1,200,000` with no locale → `AED 1.2M`; `$` never substituted | ✅ | |
| TC-GEN-003-05 | Unit | P0 | null-input (AC4): digits with no symbol and no locale → no invented symbol | ✅ | |
| TC-GEN-003-06 | Unit | P1 | error-path (AC5): unknown locale code → per-facet fallback, prompt still builds | ✅ | |
| TC-GEN-003-07 | Unit | P1 | error-path (AC5): locale entry missing `areaUnit` → area falls back, price still localised | ✅ | |
| TC-GEN-003-08 | Unit | P0 | happy-path (AC1): resolution order — property override beats typed symbol beats org default | ✅ | |
| TC-GEN-003-09 | Unit | P0 | edge-case (AC8): guard — no payment/currency/planTier read under `ai-generation/` | ✅ | |
| TC-GEN-003-10 | E2E | P1 | happy-path (AC6): locale chip shows resolved locale; clicking it overrides for that property only | ✅ | |
| TC-GEN-003-11 | E2E | P1 | happy-path (AC7): `en-IN` user sees `₹85,00,000` placeholder, not `$450,000` | ✅ | |
| TC-GEN-003-12 | E2E | P1 | null-input (AC4): unrecognised market generates successfully — no blocker | ✅ | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

### Findings

**F1 — AC1 step 3 (`organization.defaultLocale`) is plumbed but not persisted.** `resolveLocale`
accepts `orgDefault` and its precedence is unit-tested, but **nothing populates it**: there is no
`Organization.defaultLocale` column, no migration, no settings UI. In practice the live chain is
**override → typed symbol → timezone → passthrough**, which is fully functional — an agent's very
first `₹` resolves the locale, and the per-property override always wins. Adding the org default
is a schema migration plus a settings surface; it was not attempted rather than half-built. The
resolver needs no change when it lands.

**F2 — AC8 was factually wrong as drafted and was corrected.** It claimed no module under
`ai-generation/` may read `planTier`. Writing the guard proved otherwise: `ai-orchestrator` reads
`planTier` to select the text model (Gemini on some tiers, GPT-4o otherwise) — legitimate plan
gating, unrelated to locale. The guard was narrowed to the two files that actually produce
on-image strings. Detail recorded inline on AC8.

**F3 — `₹1.2Cr` shipped without a space on first run.** The word/letter separator keyed off
`suffix.length > 2`, so `Cr` (length 2) was treated as a letter magnitude like `K`. Caught by
TC-GEN-003-02, fixed in `shared/locale.ts` to `> 1`. Worth noting because it is exactly the kind
of thing no reviewer would catch by eye in a diff.

### Verification evidence

```
npm run check      → clean (tsc)
npm run test:unit  → 17 files, 193 tests passed  (was 164; +29)
playwright         → 3 passed (9.6s)  e2e/us-gen-003-locale.spec.ts
```

Confirmed visually in-browser at `Asia/Kolkata`: the price placeholder reads `₹85,00,000` and the
chip reads `₹ en-IN · sq ft (auto)`.

---

## Technical Notes

**Single choke point.** Every string that reaches the image flows through `derivePromptParts` in
`infographic-prompt.builder.ts`, which the file header already documents as the single source of
truth. The locale table is pure data read by that one function — no call-site changes.

**Why the resolver lives client-side.** See Harden findings: the LLM extraction contract types
`price` as `number`, so the currency symbol cannot survive to the server. The raw typed string
exists only in the client, so that is where the symbol must be read. One consequence worth
noting — the same helper serves both surfaces, since the right panel has
`property.price` and AI chat has the message text; neither needs a server contract change.

**Existing test cover is an asset.** The spec file already holds 35 tests including a byte-exact
E3 contract test. AC3 uses it unmodified as the `en-US` regression pin.

**Schema.** `Organization.defaultLocale String?` and `Infographic`/property-side `locale String?`
— both nullable, so existing rows need no migration and the passthrough path (AC4) is what
un-migrated data hits.

---

## Effort Estimate

| Task | Hours |
|------|-------|
| T1 — Locale table + `resolveLocale()` (pure, unit-testable) | 1.5h |
| T2 — Wire `derivePromptParts`; `en-US` + `en-IN` entries | 1.5h |
| T3 — Price symbol parsing + passthrough fallback (AC4/AC5) | 1.5h |
| T4 — `locale` fields: Prisma + property store + generation DTO | 1h |
| T5 — Locale chip + per-property override (AC6) | 1.5h |
| T6 — Locale-derived placeholders (AC7) | 0.5h |
| T7 — Unit tests incl. the D2 guard (TC-01…09) | 1.5h |
| T8 — Playwright (TC-10/11/12) + Gate 1 | 1h |
| **Total** | **~10h** |

---

*Story drafted: 2026-08-06 — analysis session. Not yet hardened; run `orion harden US-GEN-003`
before implementation.*
