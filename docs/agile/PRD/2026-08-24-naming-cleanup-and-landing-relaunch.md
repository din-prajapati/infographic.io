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

### Real content risks in this mockup — bigger than the pricing mockup's, each with a proposed fix

The pricing mockup's only real issues were a repricing-looking number set and one PDF-export claim.
This one has several claims that need a decision **before** implementation, not after. Each item
below has a proposed remedial action — write `Approved` under an item to accept it as-is, or a
comment with what to change instead. Anything left blank at implementation time defaults to the
proposed action.

---

**1. Real competitor brand names in a "trust" marquee.**
The mockup's running marquee displays "SOTHEBY'S INTERNATIONAL REALTY," "KELLER WILLIAMS," "COMPASS
REAL ESTATE," "CENTURY 21," "RE/MAX PREMIER," "COLDWELL BANKER," "BERKSHIRE HATHAWAY" as if they're
customers or partners. No evidence anywhere in this codebase or its docs that any of these companies
has a relationship with Buildographic — displaying real trademarked brand names this way implies a
false endorsement/partnership, a real legal exposure, not a style question.
*Proposed remedial action:* Drop the named brands entirely. Replace with generic category/audience
text in the same marquee slot — e.g. "SOLO AGENTS" / "REAL ESTATE TEAMS" / "BROKERAGES" /
"PROPERTY MANAGERS" — the same pattern the pricing page's own marquee already uses (real-estate
*use-case* tags, never a named third party). If real, consenting customer logos exist later, that's
a separate, deliberate addition with actual permission on file, not a mockup default.
**Your decision:** _______________________________________________

---

**2. Fabricated customer-count claim.**
The bottom CTA says "Join hundreds of top realtors and brokerages" — `EPIC-PAY-05`'s own feasibility
analysis states the product has **zero paying customers to date**. False as written.
*Proposed remedial action:* Drop the count claim entirely. Replace with benefit-focused copy that
makes no numeric claim — e.g. "Ready to 10x your listing marketing?" (the mockup's own headline
right above it already does this correctly) followed by a supporting line that doesn't assert a
customer count, e.g. "Create stunning, on-brand marketing materials in seconds." If the beta-mode
banner is active (`VITE_BETA_MODE`), this section should stay consistent with that framing rather
than implying an established customer base.
**Your decision:** _______________________________________________

---

**3. Exposed unit-economics as a marketing number.**
"The Buildographic Way" comparison lists "Transparent output pricing starting from $0.29 per
design" — a real internal cost figure (Ideogram/GPT generation cost) surfaced as customer-facing
copy. `M-PAY-04`'s own milestone acceptance criteria for the pricing page explicitly banned this
exact category of claim ("No Ideogram/GPT/API cost language anywhere on the page").
*Proposed remedial action:* Replace with the same framing already locked in for `/pricing` —
"Your plan is based on marketing output — not per-seat software fees" — or similar, pointing at the
real plan pricing rather than an internal cost-per-unit number. No dollar-per-design figure anywhere
on the page.
**Your decision:** _______________________________________________

---

**4. Unverified "7-Day Solo Trial."**
The Solo tier's CTA says "Start 7-Day Solo Trial" — no trial-period field or mechanic exists
anywhere in `PLAN_CONFIG` or the subscription-creation flow today.
*Proposed remedial action:* Use real CTA wording matching the actual signup flow — "Choose Solo" /
"Get started with Solo," consistent with the button labels already shipped on `/pricing`. Do not
build a real trial mechanic as part of this (visual-only) pass — if a 7-day trial is wanted as a
real product feature, that's separate backend-scoped work (new `PLAN_CONFIG`/subscription fields,
webhook handling) for its own story later.
**Your decision:** _______________________________________________

---

**5. "100% Vector Editable" / "zero hallucinations" claims.**
The actual pipeline is Ideogram (raster background image) + GPT-4o (structured text/shape overlay
layout) — closer to "layered overlay objects on a raster image" than true vector graphics; "zero
hallucinations" is an absolute claim that's hard to stand behind.
*Proposed remedial action:* Reword to the term the product already uses elsewhere (`EPIC-EDIT-03`):
"Multi-layer Canvas Editor" / "fully editable text, colors, shapes & photos," not "vector." Drop
"zero hallucinations"; replace with an honest, softer claim about not needing manual redesign.
**Your decision:** _______________________________________________

---

**6. Fake pricing numbers again (USD, flat "Save 15%," implied currency toggle).**
Same pattern as the pricing mockup.
*Proposed remedial action:* Same locked decision as `US-PAY-112`, applied here: real `PLAN_CONFIG`
INR numbers via the existing `GET /api/v1/pricing` endpoint, kept to the current 3-tier
FREE/SOLO/TEAM teaser scope (not a full 5-tier grid), the real ×10 annual formula labeled "2 months
free" (not "15%"), no currency toggle — INR only, same `stripeEnabled`-gated pattern as `/pricing`.
This one already has precedent; listed for explicit sign-off rather than as an open question.
**Your decision:** _______________________________________________

---

**7. A fully interactive AI-generation prompt bar in the hero.**
The one structurally new thing here, not just a copy/number risk. The mockup's hero has a
real-looking input field + "Generate Marketing Design" button; in the mockup it's fake (a
`setTimeout` animation redirecting to an anchor).
*Proposed remedial action:* Keep it decorative/lead-in only for this pass — typing a prompt and
clicking "Generate" routes to `/auth` (same as every other CTA on the page), the same way the
existing hero's input fields already work. Do **not** build real anonymous/unauthenticated
generation as part of this visual pass — that needs rate-limiting, anonymous-quota handling, and
abuse prevention, and is real backend-scoped work for its own story if wanted later.
**Your decision:** _______________________________________________

---

**8. Invented product terminology ("Vibe Studio").**
A nav item and section id with no other reference anywhere in this codebase, docs, or prior
sessions.
*Proposed remedial action:* Rename the nav label to something already real in the product — e.g.
"AI Studio" or "Editor" — pointing at the actual AI chat/canvas-editor experience the mockup's
section 5 (prompt-driven refinement, direct visual canvas edit, brand kit sync) is describing.
Anchor id can stay whatever's convenient internally; the customer-facing label just needs to name a
real thing.
**Your decision:** _______________________________________________

---

**9. "Real Estate Model Intelligence 2.0" / "Status: All Systems Operational."**
Invented-sounding version and status claims with nothing backing them — no status page, no
versioned "model intelligence" branding used anywhere else in the product.
*Proposed remedial action:* Drop both from the footer. Replace with the same factual footer pattern
`/pricing` already uses — copyright line + a real, verifiable tagline (e.g. "Designed for real
estate professionals," already used on `/pricing`'s footer) — nothing that implies a version number
or uptime status that doesn't exist.
**Your decision:** _______________________________________________

---

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
