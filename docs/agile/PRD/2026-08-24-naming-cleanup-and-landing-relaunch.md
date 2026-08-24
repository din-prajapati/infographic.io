---
title: PRD — Naming Cleanup (Option A) + Landing Page Relaunch
type: prd
tags: [orion, pay, branding, ui]
updated: 2026-08-24
---

# Naming Cleanup (Option A) + Landing Page Relaunch

> **Status:** Planning document — not yet scaffolded into an epic/story. Combines two pieces of work
> the user asked to plan together; see "Recommended split" at the end for why they should still
> execute as separate stories.
> **Source conversation:** 2026-08-24 session, following the `US-PAY-112` pricing-page visual
> relaunch (same session, same day).
> **Related:** [EPIC-PAY-05](../epics/phase-1-ai-core/EPIC-PAY-05/EPIC.md) (the pricing relaunch this
> follows the same playbook from), `design-preview-pricing.html` (the precedent mockup),
> `design-preview-landing.html` (this document's mockup, repo root).

---

## Part 1 — Option A: "Infographic" naming cleanup (cosmetic copy only)

### Why

The product was renamed **Buildographic** on 2026-07-17 (from the code name "InfographicAI"), but the
rebrand was never swept through the code — "Infographic" is still the DB model name, the NestJS
module name, and a lot of user-facing copy. This became visible when the new `/pricing` page (just
shipped) started saying "AI Marketing Designs" while the rest of the app still says "infographics" —
two names for the same thing depending on which screen you're on.

Option A is the **cosmetic-only** slice: user-facing text, nothing structural. It does not touch the
`Infographic` Prisma model, the `infographics` NestJS module, API URL paths, or TypeScript type names
— those are Option B (a real DB/backend rename), explicitly deferred, same category as the already-
flagged `brainwave_*` localStorage-key cleanup.

### Real surface area (counted, not estimated)

| Category | Count | In scope? |
|---|---|---|
| Real user-facing copy (toasts, labels, headings, placeholders) | ~52 occurrences / ~20 files | ✅ Yes |
| `PLAN_CONFIG.features` text (`"3 infographics/month"` × 6 tiers, `shared/schema.ts`) | 6 | ✅ Yes |
| Legal docs (`terms.json`, `privacy.json`, `refund.json`, `cookies.json`) | 18 across 4 files | ✅ Yes, but **gated on product/legal wording sign-off**, not mechanical |
| API URL path literals (`/infographics/generate`, `/infographics/${id}`, etc.) | ~25+ | ❌ No — real backend routes, renaming breaks the app without a matching backend change |
| Type/interface names (`Infographic`, `InfographicOrientation`, `GenerateInfographicInput`) | ~30+ | ❌ No — used as a type contract across 10+ files |
| Stray planning markdown docs sitting in `client/src` (`PHASE1-COMPLETE.md`, `CHANGELOG.md`, etc. — 12 files) | ~25 | ❌ Not shipped code — skip, or flag for deletion separately |
| Test fixture data (`testConversationsData.ts`) | 9 | ❌ Not user-facing, skip |

Worked example of the split: `AIChatBox.tsx` has 16 matches — ~10 are real toast/placeholder text
("Generating your infographic...", "Failed to generate infographic..."), the other 6 are the
`InfographicOrientation` type and the `/infographics/upload-photo` URL — untouchable under Option A.

### Effort

| Piece | Size | Notes |
|---|---|---|
| App-code copy sweep (~52 strings, ~20 files) + `PLAN_CONFIG` text (6 strings) | **S–M, one session** | Mechanical per-string edits with judgment calls on replacement wording; check for tests asserting exact strings |
| Legal docs (18 occurrences, 4 files) | **XS–S, blocked on wording approval** | Not mine to reword unilaterally — policy documents |
| Verification | included above | `npm run check`, `npm run test:unit:client`, visual scan of chat panel / usage dashboard / subscription card / landing page |

**Bottom line: one focused session for the app-code portion.** Legal docs are a separate, smaller
edit once wording is approved — recommend not bundling them into the same commit as the mechanical
sweep, since one has a review dependency and the other doesn't.

---

## Part 2 — Landing Page Relaunch (`design-preview-landing.html`)

### Why

Same motivation and same playbook as the pricing-page relaunch: a "final curated mockup" exists for
`/` (`design-preview-landing.html`, repo root), and the user wants `LandingPage.tsx` rebuilt to match
it, the same way `PricingPage.tsx` was. Read in full for this document — 1236 lines, same "Rocket"
light-theme design language as the pricing mockup, but a materially bigger scope: a full-bleed
autoplay video hero with a live-feeling AI prompt bar, a 3-pillar "how it works" section, a 3-mode
"creative control" section, a double-row template marquee, an old-vs-new workflow comparison, a
3-tier pricing snapshot, an FAQ, and a bottom CTA — 11 sections total vs. the pricing page's ~10.

### What already exists to reuse (checked, not assumed)

- `client/src/assets/videos/hero-background.mp4`, `attached_assets/Screen_Recording_2026-02-03_...mp4`,
  and `client/src/assets/images/carousel/property-{1,2,3}.jpg` — **all exist in the repo already**,
  confirmed via direct file check. The hero video and template-showcase images aren't a new-asset
  problem.
- `client/src/pages/LandingPage.tsx` already has a `showcaseTemplates` array + `<Marquee>`-based
  double-row showcase (lines 337-349) — close in shape to the mockup's template marquee, likely
  adaptable rather than a from-scratch build.
- `<Marquee>` component (`client/src/components/ui/marquee.tsx`) — already used once in this exact
  codebase (`LandingPage.tsx`) and again in the `PricingPage.tsx` relaunch — a proven, reusable piece.
- No shared `<Header>`/`<Nav>` component exists between pages (confirmed during the pricing-page
  research) — `LandingPage.tsx` will keep its own hand-rolled nav, consistent with the rest of the app.

### Real content risks in this mockup — bigger than the pricing mockup's

The pricing mockup's only real issues were a repricing-looking number set and one PDF-export claim.
This one has several claims that need a decision **before** implementation, not after:

1. **Real competitor brand names in a "trust" marquee.** The mockup's running marquee displays
   "SOTHEBY'S INTERNATIONAL REALTY," "KELLER WILLIAMS," "COMPASS REAL ESTATE," "CENTURY 21," "RE/MAX
   PREMIER," "COLDWELL BANKER," "BERKSHIRE HATHAWAY" as if they're customers or partners. There is no
   evidence anywhere in this codebase or its docs that any of these companies has a relationship with
   Buildographic. Displaying real trademarked brand names this way implies a false endorsement/
   partnership — a real legal exposure, not a style question. **This should not ship as literal
   company names without your explicit confirmation of a real relationship**, the same way the
   pricing page wouldn't ship a fake "X spots left" counter.
2. **Fabricated customer-count claim.** The bottom CTA says "Join hundreds of top realtors and
   brokerages" — `EPIC-PAY-05`'s own feasibility analysis states the product has **zero paying
   customers to date**. This is a false claim as written.
3. **Exposed unit-economics as a marketing number.** "The Buildographic Way" comparison lists
   "Transparent output pricing starting from $0.29 per design" — this is a real internal cost figure
   (Ideogram/GPT generation cost) being surfaced as customer-facing pricing copy. `M-PAY-04`'s own
   milestone acceptance criteria for the pricing page explicitly banned this exact category of claim
   ("No Ideogram/GPT/API cost language anywhere on the page") — this mockup violates that precedent.
4. **Unverified "7-Day Solo Trial."** The Solo tier's CTA says "Start 7-Day Solo Trial" — no trial-
   period field or mechanic exists anywhere in `PLAN_CONFIG` or the subscription-creation flow. Either
   this is a new product decision (needs scoping as real backend work, not a copy change) or the CTA
   needs different, honest text.
5. **"100% Vector Editable" / "zero hallucinations" claims.** The actual pipeline is Ideogram
   (raster background image) + GPT-4o (structured text/shape overlay layout) — closer to "layered
   overlay objects on a raster image" than true vector graphics. Worth a product read before shipping
   a specific technical claim like "vector" verbatim.
6. **Fake pricing numbers again**, same pattern as the pricing mockup: USD ($0/$19/$49), a flat
   "Save 15%" annual claim, and a currency toggle implied by the page's whole framing. Same locked
   decision from the pricing relaunch should apply here: real `PLAN_CONFIG` INR numbers (kept to the
   existing 3-tier FREE/SOLO/TEAM teaser scope `LandingPage.tsx` already uses, not a full 5-tier
   grid), the real ×10 annual formula ("2 months free," not "15%"), no live USD toggle.
7. **A fully interactive AI-generation prompt bar in the hero** — this is the one structurally new
   thing, not just a copy/number risk. The mockup's hero has a real-looking input field + "Generate
   Marketing Design" button. In the mockup it's fake (a `setTimeout` animation that redirects to an
   anchor). The real question: should this actually kick off generation (requires an auth/redirect
   flow — the app already gates generation behind login), or is it a decorative lead-in that always
   routes to `/auth`? This is a product-flow decision, not a rendering one — worth settling before
   building, same category as the pricing page's currency-toggle-gating decision.
8. **Invented product terminology.** "Vibe Studio" (a nav item and section id) doesn't appear
   anywhere else in this codebase — no other reference to it in the app, docs, or prior sessions. If
   it's meant to label the existing AI chat / editor flow under a new marketing name, that's fine, but
   it should map to something real, not a new anchor to nothing.
9. **"Real Estate Model Intelligence 2.0" / "Status: All Systems Operational"** — invented-sounding
   version and status claims with nothing backing them (no status page, no versioned model-intelligence
   branding used anywhere else). Likely fine as pure flavor text, but flagging since the pricing-page
   precedent was to keep every specific claim traceable to something real.

None of these are reasons not to do the redesign — they're exactly the kind of thing the pricing-page
relaunch caught and resolved through a few quick confirmations before implementing, not during a
messy correction pass afterward.

### Effort estimate

This is bigger than the pricing-page visual pass was, both because the mockup has more sections
(11 vs. ~10) and because it carries the 9 flagged decisions above — most of which need your input
before a line of code is written, not just mine to resolve unilaterally the way the PDF-export
correction was on the pricing page.

| Piece | Size | Why |
|---|---|---|
| Decisions/confirmations (the 9 items above) | — | Not engineering effort, but blocks starting — recommend resolving via a short Q&A pass before implementation, same pattern as the pricing page's currency-toggle and Enterprise-card decisions |
| Full visual re-skin of `LandingPage.tsx` (nav, video hero + prompt bar, 3-pillar section, 3-mode section, template marquee, comparison section, pricing snapshot, FAQ, CTA, footer) | **L**, likely 1 full pass + 1 correction pass (same shape as `PricingPage.tsx`'s T5+T6) | Direct precedent: the pricing page's equivalent pass took 2 commits (`381651d` full build, `7a31823` correction after mockup comparison) plus 2 more small fixups later. Expect similar here, possibly one more round given more sections. |
| Real-data wiring (3-tier teaser numbers, annual formula) | **XS**, bundled into the pass above | `LandingPage.tsx` already pulls from the same `GET /api/v1/pricing` endpoint `US-PAY-112` built — no new backend work, just reusing it in the new visual shell |
| Verification | included above | `npm run check`, `npm run test:unit:client`, local Playwright screenshot diff against the mockup (same method used for the pricing page) |

**Rough total: 2 sessions** (one build pass, one correction pass after a direct side-by-side mockup
comparison — this is exactly what happened on the pricing page and is worth planning for up front
rather than treating as a surprise).

---

## Recommended split

The user asked for this written up as one combined document, which this is — but per this project's
own sizing convention ("story = one Claude session ≤4h, larger → split"), **Option A and the Landing
Page relaunch should still execute as separate stories**:

1. **Story 1 — Option A naming cleanup** (S–M, one session). No dependency on Story 2. Can start
   immediately.
2. **Story 2 — Landing Page visual relaunch** (L, ~2 sessions). Should resolve the 9 flagged decisions
   above first (a short confirmation pass, same shape as the pricing page's clarifying questions),
   then implement in the same one-pass-plus-correction shape the pricing page used.

They're combined here because they were asked about together and both stem from the same underlying
theme (closing the gap between what the app says and what it actually is/does), not because one
depends on the other technically.

---

*Document created: 2026-08-24*
