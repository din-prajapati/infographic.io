---
title: AI Differentiation, V3 Readiness and Pricing Strategy
type: research
status: draft-for-founder-review
created: 2026-11-14
owner: Dinesh
tags: [buildographic, strategy, ai, pricing, v3-editor, competition, unit-economics]
---

# AI Differentiation, V3 Readiness and Pricing Strategy

> **What this is:** a record of one strategy session (2026-11-14), covering five questions in order:
> 1. Where can AI beat Canva and similar tools?
> 2. Does that answer still hold if we ignore our own PRDs and start from agents' pain points?
> 3. Does the V3 editor branch deliver the "replace the freelancer" promise?
> 4. How should AI credits work now that the product is template + listing facts rather than image generation?
> 5. What are cost, revenue, per-asset economics and margin per plan?
>
> **Status:** analysis and recommendations only. Nothing here is approved scope. No code, schema, pricing or roadmap file was changed. Decisions needed are listed in §9.
>
> **Evidence base:** code reading on branch `codex/v3-listing-responsive-handoff` @ `b009539` (worktree `.codex-worktrees/v3-slice`), one executed probe of the V3 text importer, and a light web scan (mostly vendor pages and trade press, not independent studies). The app was **not** run. Where a claim is a hypothesis rather than evidence, it says so.

---

## 0. Executive summary

1. **Don't compete on image generation.** Canva's AI is general-purpose, and generating images is a commodity (Ideogram is our *supplier*). Our only lasting edge is AI that understands the listing, with **the Property record as the source of truth**.
2. **Design isn't scarce; leads and trust are.** Starting fresh from agents' pain points, the strongest gaps nobody fills are: making each creative trackable back to enquiries, compliance (MahaRERA QR + registration number), trust signals against cloned or fake listings, and turning WhatsApp input into something sendable. A better design tool for agents competes with Canva and ₹100–300/month poster apps on price.
3. **V3 isn't yet a freelancer replacement.** Its linking model, reviewed import, export checks and persistence are genuinely strong. But about 60% of the branch's code went into general editor features where Canva will always win. There are only 5 curated templates, one per format. Several template fields silently fail to link. **There is no AI in the V3 flow,** and the agent still does the work, one format at a time.
4. **Add AI where it replaces the freelancer's work:** reading messy WhatsApp text, picking and cropping photos, writing headlines (copy only, never facts), auto-fitting text, and producing a whole kit in one click. The first concrete step is an LLM layer on top of V3's existing rules-based importer (§5).
5. **The credit model measures the old product.** Today a credit is one Ideogram image. The V3 product (template, listing, export) is **unmetered and has no plan checks at all**, so after the V3 switch the Free tier would get the entire product. Replace this with **two limits: Listings/month (value) and AI image credits (cost guard).** Text AI gets a fair-use rate limit, not credits.
6. **Margins aren't the risk.** At 100% quota use every plan clears **about 82% contribution margin**, and about 92% at typical use. The risks are demand and price acceptance. **Solo beats a budget freelancer only at ≥ 2.75 listings a month,** which is why a ₹199 per-listing pass is recommended.

---

## 1. Round 1: where AI beats Canva (first answer, anchored to our PRD)

The first analysis read our own material: NORTH_STAR, ROADMAP, Property Campaign PRD v1.1 and its gap analysis, the AI epics for Phases 2–4, and the `ai-generation` module. Its main idea: Canva's AI doesn't know what a listing is. To Canva, "₹1.2 Cr, 3 BHK, Bandra West" is just text it can rewrite or make up. PRD invariant #1 ("Property and Contact are the factual authorities") is therefore more than a safety rule. It's the part competitors can't easily copy.

| # | Capability | Why Canva can't match it | Already planned? |
|---|---|---|---|
| 1 | AI that won't make up facts: a vision model reads the final render and checks it against Property fields, blocking export if they don't match | Canva has no source of truth to check against | Partly (KIT-01 "verified exact text", MVP-10) |
| 2 | Any input to Property: portal text, WhatsApp forward, PDF, voice note, photos | No listing concept | Pasted text only (MVP-02) |
| 3 | Smart photo handling: pick the main photo, crop per format, label enhancements | Generic editing only | Photo cleanup in EPIC-AI-04 |
| 4 | Campaigns that update themselves: a price change updates every asset, fixes text overflow, marks old exports out of date | Manual edits per design | Partly (PRD invariant 5, EPIC-AI-05) |
| 5 | Compliance check before export: RERA/QR, "artist's impression", fair-housing wording | Doesn't know the content is property advertising | **Not planned** |
| 6 | Local-language, market-aware copy (Marathi/Gujarati/Hindi/Hinglish, lakh/crore) | Literal translation | EPIC-MKT-01 (Phase 4), no regional languages |

**Self-critique:** this round started from a design-tool PRD, so it mostly confirmed decisions we'd already made. Round 2 corrects for that.

---

## 2. Round 2: fresh look at what agents struggle with and who already solves it

This round ignored the PRDs and epics and started from the agent's day: win the listing, market it, get leads, show the property, close, get referrals.

| Pain | How bad | Who already covers it | Gap? |
|---|---|---|---|
| **Getting leads** | Biggest pain: about 60% struggle; 82% get zero leads from paid digital channels | CRMs, portals, Meta ads | Crowded, but **nobody connects the creative itself to the lead** |
| Posting regularly | Real | Canva, cheap Indian "daily poster" apps, US realtor post apps (tidit, Mathi) | **Crowded.** Design is a commodity, and very cheap apps set the floor in India |
| Listing copy | Low | ChatGPT/Gemini, free | Commoditized |
| Photo enhancement | Medium | Canva, virtual staging, video tools (Editora, HeyGen) | Crowded |
| **WhatsApp inventory overload (India)** | High | Early, unproven startups (PropAI, BrokerDost, BrokerBrain) | **Early, not empty.** They output text, not something you can send to a client |
| **Ad compliance (India)** | Rising: MahaRERA requires registration number + QR (top-right) + website; fined 628 projects (₹88.9 lakh); working with ASCI on AI detection | **No creative tool found that enforces it** | **Open** |
| **Buyer trust / fake listings** | High: listings cloned from portals, AI-generated interiors used by scammers | Some verified-agent platforms (AgentKart) | **Open at the level of the creative** |
| Seller reports | Medium | Covered in the US (kvCORE, Rechat, Lofty) | None found for India (not searched specifically) |

### How Round 1's ideas held up

- ✅ **Any input to Property:** stronger than first thought. In India the real input is a WhatsApp forward or voice note, not a form.
- ✅ **Compliance check:** stronger. The rule is enforced, fined, and policed with AI.
- 🟡 **Local-language copy:** holds. Poster apps do regional languages for festival greetings, not property copy.
- 🟡 **Campaigns that update themselves:** real, but resale agents rarely feel it as pain.
- ⬇️ **AI that won't make up facts:** correct, but it's a baseline expectation, not a reason to buy.
- ⬇️ **Smart photo handling:** crowded market.

### Gaps found by starting fresh (hypotheses to test in B0 interviews)

1. **The creative goes nowhere after it's sent.** Posters get forwarded and their contact cropped out, and nobody knows which post produced an enquiry. The MahaRERA-mandated QR code could open a live listing page with call/WhatsApp buttons, so each forward becomes trackable ("14 scans, 3 enquiries"). This brings the design tool to the #1 pain, leads.
2. **Turn compliance into trust.** The same QR could show agent and project RERA numbers, whether photos are real or AI, and when the listing was last updated. A scammer can clone the image but not a verified link.
3. **Buyer requirement to a sendable shortlist.** "2BHK Andheri under 1.5 Cr" becomes one branded shortlist card built from the broker's inventory. WhatsApp startups stop at a text match.
4. **A pitch to win the listing (India).** Owners give the same property to several brokers, and the most professional-looking broker wins. A two-minute "how I'll market your property" deck. *This is reasoning about the market, not evidence.*

**Strategic implication:** as "a better design tool for agents," we compete with Canva and very cheap poster apps on price. As "the tool that makes every listing post compliant, trusted and bring back measurable leads," we compete with nobody found so far.

**Suggested B0 interview questions:** Where did your last poster end up? Do you know if it produced an enquiry? Has a forward ever lost you a lead? How do you win a listing against other brokers? Do you pay a designer, use Canva or poster apps, or skip design altogether?

---

## 3. Round 3: does V3 deliver "freelancer work in minutes"?

**Branch:** `codex/v3-listing-responsive-handoff` @ `b009539` (worktree `.codex-worktrees/v3-slice`; 10 uncommitted files, none touch extraction).

### Verdict

The pitch is right; the branch doesn't deliver it yet. Compared with Canva, its only real advantage is entering listing facts once and reusing them. A freelancer sells **no effort for the agent** and **good taste**. V3 still leaves the work to the agent, and doesn't have the template library to supply the taste.

### What's genuinely strong (the foundation of our advantage)

- **Linking model:** each element is a field, a compound of fields, or independent; per-design customizations, detach, pending/applied state with undo (`client/src/lib/v3ListingWorkflow.ts`).
- **Reviewed import:** every suggested fact shows the source line it came from; agent fields are never pre-selected; lakh/crore prices parse correctly (`shared/listingWorkflow.ts`).
- **Export check:** missing facts, leftover placeholders, out-of-date content, text overflow (`client/src/lib/v3ExportReview.ts`).
- Saved listings and profiles, R2 photo uploads, tested save/reopen round trips.

### Gaps

| # | Finding | Evidence |
|---|---|---|
| 1 | **Most effort went into rebuilding Canva.** About 4,600 lines of non-test code are general editor features (arrange, layers, gradient paint, lines, toolbar, emoji/icon library) vs about 3,000 for listing/template/facts. Most of the 36k-line diff is docs and evidence | `git diff --numstat main...HEAD` |
| 2 | **Only 5 curated templates, one per format** (Story, Square, A4 print, Email header, "MLS Listing Sheet"). No matching looks across formats; "MLS" is US terminology | `api/scripts/data/premium-templates.data.ts` |
| 3 | **Some template fields silently don't link.** Templates use `brand.accentColor` (×5), `openHouse.date`, `report.period`, `report.kpis`, `report.headline`, which aren't in `V3_SLOT_CATALOG`; `createListingSnapshot` drops them without warning. The Open House date and Market Report fields can't fill from the listing | grep: zero occurrences in V3 code |
| 4 | **No AI in the V3 flow.** No calls to OpenAI, Gemini, Ideogram or generation routes. Import is rules-based. This was **deliberate**: US-EDIT-020 Out of Scope says "Does not implement AI Assistant, generation changes…" | `shared/listingWorkflow.ts:156`; US-EDIT-020 STORY.md |
| 5 | **The agent does the work.** Choose template, enter or paste facts, Apply, pick the photo by hand (code: "no ranking fallback"), fix overflow by hand (detected but not fixed), review, export. Repeat for each format | `v3ListingWorkflow.ts` `resolveSlot` |
| 6 | **The mockup breaks the product's own rules.** The listing-workflow mockup uses an AI-generated villa as the "property photo" and has a squashed specs line (it's a concept, not the shipped render) | `Mockups/listing-workflow-v1/editor-preview.jpg` |
| 7 | **No plan checks anywhere in V3** (see §6) | grep: no `planTier` / `assertCan` / `PLAN_CONFIG` in designs, properties, storage or V3 |

### Where AI makes the freelancer pitch true

| A freelancer does... | AI equivalent | Builds on |
|---|---|---|
| Reads a messy brief | LLM extraction into the existing review screen, with source text per fact | `main`'s LLM routing + V3's review UI |
| Picks the best photo | Rank uploads, choose the hero shot, crop per format around the subject | New |
| Writes a headline for this listing | Headline/call-to-action generated from the facts; copy only, never facts | The linking model already separates independent copy |
| Makes it fit | Auto-shrink or reflow instead of only flagging overflow | Overflow detection in export review |
| Delivers the full set | **One click: listing → 4–6 finished formats in one style** | New. This is the actual product |

### Recommended order

1. **Freeze general editor work.** It's good enough.
2. **Fix the template fields that don't link** (add them to the catalog or remove them from templates); rename "MLS". Bug-sized.
3. **Build template families:** 3 looks × 4 formats, every field covered.
4. **LLM layer on top of the rules importer** (§5).
5. **One-click kit:** auto photo, auto-fit, AI headline copy.
6. **Test the claim:** 5 real listings, timed three ways (freelancer brief vs Canva vs Buildographic). Win on time *and* an export that needs no edits, or don't use the claim.

---

## 4. A note on the existing LLM extractor (`main`)

`api/src/modules/infographics/services/prompt-extractor.service.ts` exists on both branches; V3 doesn't call it. **It should not be reused as it is:**

1. Field names don't match `ListingRecord` (`price: number`, `sqft`, `listingType`; no headline, status, description, phone or licence).
2. It asks the model to convert "1.45 Cr" to a number. Scale words are a known model failure; `parseListingPrice` already does this correctly in code.
3. No source text per fact, which is V3's protection against invented facts.
4. `||` fallbacks treat valid zero values as empty.
5. It logs the first 100 characters of pasted text, which contains phone numbers. That breaks the observability rule against logging personal details.
6. It stores every call in the `Extraction` table, a chat-era behaviour V3 doesn't need.

---

## 5. Proposal: an LLM layer on top of V3's text importer

### What the current importer does: probe results (executed 2026-11-14)

`reviewListingText` (`shared/listingWorkflow.ts:156`), run in the V3 worktree:

| Input | Extracted | Missed |
|---|---|---|
| Emoji WhatsApp forward ("🏡 *READY TO MOVE 3BHK* / 📍 Baner, Pune… / 💰 1.45 Cr… / Call Rahul 98765 43210 — Sai Realty") | beds 3, baths 3, ₹1,45,00,000, 1450 sq ft ✅ | Address, headline, features, agent name, phone, agency; "carpet" area qualifier |
| Hinglish ("Kothrud me 2 bhk flat sale ke liye hai, 85 lakh…") | beds, baths, area, ₹85,00,000, type "flat" ✅ | Sale/rent (only the exact phrase "for sale" matches), locality, amenities, contact |
| Developer project post ("2 & 3 BHK starting 78 L… RERA P52100012345") | **Whole message rejected:** "Multiple properties detected" | Everything, including the RERA number |

**Conclusion:** the rules engine handles numbers well. What it misses is the prose fields agents most need on a poster: locality, headline, features and contact.

### Principle

**The model only finds facts and quotes where it found them. Code checks and normalises them, and the user approves.** The model is never the final authority.

### Changes, file by file (V3 branch)

| File | Change |
|---|---|
| `shared/listingWorkflow.ts` `reviewListingText` | **No change.** It stays the instant first pass and the fallback when the model call fails |
| `shared/listingWorkflow.ts` `applyReviewedFacts` | **No change.** It's the trust boundary (rejects facts changed during review; requires a choice between conflicting candidates) |
| `shared/listingWorkflow.ts`, **new** `mergeReviews(rules, llm)` | Where both agree, keep one fact (prefer rules evidence). Where they disagree, show both as ambiguous candidates, unselected. Model-only facts get added; agent fields stay unselected |
| `api/src/modules/properties/`, **new** `POST /properties/extract-facts` | JWT + `EmailVerifiedGuard` + per-user rate limit; ~8k-character input cap; routed via `openAiService.extractStructuredData` (keeps Gemini/GPT tier routing). The model returns `{path, raw, evidence}` only, with user text passed as a delimited block. **Server checks:** discard facts whose `evidence` isn't in the source text (after normalising whitespace and emoji); price via `parseListingPrice` (the model never produces the number); beds/baths/area via the existing checks; multiple-property and ambiguity rules applied. Returns `ListingTextReview`. **No raw-text logging** |
| `client/src/components/editor/v3/V3ListingPanel.tsx:1100` | Show the rules result instantly, call the endpoint at the same time ("Finding more details…"), merge when it returns; if it fails, keep the rules result and show a small notice |
| `api/tests/listing/listing-workflow.spec.ts` | Model-mocked contract tests: invented evidence dropped; `"1.45 Cr"` becomes `14500000 INR`; a model returning `"14.5 Cr"` against evidence of "1.45 Cr" is rejected; provider failure returns the rules result; agent facts never pre-selected. Plus a fixture set of ~30 real anonymised forwards measuring field recovery for rules alone vs rules + model |

**Size:** about one medium story. **Process:** a new story that explicitly reopens US-EDIT-020's Out of Scope decision.

**Open product decision:** developer project posts (unit types + "starting from" price) are rejected on purpose (the branch test `rejects mixed configurations`). Whether a project can be a listing is a decision about what `ListingRecord` should hold, not a parsing question.

---

## 6. AI credits: the current model and why it has to change

### How it works today (verified in code)

- **One credit = one Ideogram generation.** `UsageRecord` with `creditsUsed: 1` (`ai-orchestrator.service.ts:477`). The schema requires `infographicId @unique`, so **only image generations can be metered**.
- **Editable designs are a second limit** (`editableLimit`: Solo 10 / Pro 25 / Team 60 / Agency 150). The first editable version per generation is free; extra versions cost a credit (US-LAUNCH-015).
- **What the plans sell** (`shared/schema.ts:200-259`): "N AI Marketing Designs/month", "Editable designs", "All templates" vs "Basic templates", "Custom branding".
- **Costs per call** (`api/src/config/ai-models.config.ts`): image $0.03–0.08; LLM $0.0006 (Gemini Flash) to $0.0075 (GPT-4o). **Text calls are roughly 50–100× cheaper than images.**

### The problem

- **The V3 product has no plan checks.** Template use, listing filling, editing and PNG export cost zero credits and nothing limits them.
- After the V3 switch, **Free gets the whole product**; "Basic vs All templates" and "Custom branding" are pricing-page text, not rules in code; "Editable designs" means nothing because every V3 design is editable.
- Solo customers pay ₹5,499 for 50 Ideogram images, the commodity part we've decided not to make the core of the product. **We charge for the commodity and give away the value.**

### Recommended model: two limits

| Limit | What it counts | Why |
|---|---|---|
| **Listings per month** (value) | New Properties created in the billing cycle. Within a listing, everything is included: all formats, edits, re-exports, price updates | Agents understand it; it matches how freelancers charge ("per listing pack"); free updates encourage reuse |
| **AI image credits** (cost guard) | Only image-model calls: AI background, AI image generation, later photo cleanup/upscale; the old layerize step ($0.09) moves here | The only calls with real cost per use; the existing `UsageRecord` path |

**Everything else is included under fair-use rate limits, not credits:** text extraction, copy suggestions, photo ranking, template filling, export. (1,000 Gemini extractions cost about $0.60.)

### Starting numbers (reuse existing, already-authored values)

| Plan | Listings/mo | AI image credits/mo |
|---|---:|---:|
| Free | 1 | 3 (recommend 0–1, see §7.4) |
| Solo | 10 | 50 |
| Pro | 25 | 100 |
| Team | 60 | 200 |
| Agency | 150 | 400 |

The listing counts are today's `editableLimit` values; the credits are today's monthly limits. Validate in B0.

### Code changes (outline)

1. `PLAN_CONFIG`: add `listingLimit`; rewrite `features` text.
2. `properties.service.ts` create: check the listing limit on the server; typed 402 (same pattern as `EditableRequiresUpgradeException`). Count from the `Property` table with a date filter, so **no new usage table**.
3. `assertCanGenerate` for image calls only; retire the separate `editableLimit`.
4. Extraction endpoint: rate limit, not credits.
5. Pricing and usage pages: "listings + AI image credits".
6. Grandfather existing subscribers.

**Why count at creation, not export:** export happens in the browser (`client/src/lib/canvasExport.ts`), so the server can't reliably enforce it. Known risk: an agent overwrites one listing for a different property. Accept and monitor (e.g. flag when the address changes after an export).

---

## 7. Cost, revenue and margin matrix

### 7.1 Assumptions

| Input | Value | Source / note |
|---|---|---|
| Exchange rate | **₹94/$** | Early-Nov 2026 quotes 93.7–94.9. The August PRD used about ₹83, so AI costs in rupees are ~13% higher than it assumed |
| AI image credit | **₹15 worst case** (generation + layerize ≈ $0.16); **₹11.28 blended** ($0.12) | `ai-models.config.ts`; $0.1195 is the blended cost measured from 107 production `UsageRecord`s |
| Text AI per listing | **≈ ₹4** (GPT-4o worst case, ~6 calls); ≈ ₹0.35 on Gemini | Config costs |
| Storage per listing | **≈ ₹1** (~40 MB on R2) | $0.015/GB-month, no egress fees |
| **Variable cost per listing, no AI images** | **≈ ₹5** | Rows above combined |
| Payment fee | **2.36%** | Razorpay 2% + 18% GST on fee. Industry estimate, not our negotiated rate |
| Assets per listing | **4** (square, story, portrait, WhatsApp/flyer) | Assumption |
| Freelancer rate (India) | **₹500–1,500/post** (new freelancers ₹300–700); packages of 12–20 posts ₹8k–30k/mo | General Indian rate guides; nothing real-estate-specific found |
| Prices | Treated as **before GST** | See the GST note under 7.2 |

### 7.2 Margin per plan (monthly list price)

| Plan | Price | Listings | AI credits | Cost at 100% use | **Margin at 100% use** | Cost at typical use* | **Margin at typical use** | Margin with no AI images |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Free | ₹0 | 1 | 3 | ₹50 | **−₹50/user** | ₹25 | −₹25/user | −₹5/user |
| Launch Pass (per listing, PRD v1.1) | ₹199 | 1 | 2 | ₹40 | **80.1%** | ₹28 | 85.9% | 95.1% |
| Solo | ₹5,499 | 10 | 50 | ₹930 | **83.1%** | ₹442 | **92.0%** | 96.7% |
| Pro | ₹10,999 | 25 | 100 | ₹1,885 | **82.9%** | ₹899 | **91.8%** | 96.5% |
| Team | ₹21,999 | 60 | 200 | ₹3,819 | **82.6%** | ₹1,827 | **91.7%** | 96.3% |
| Agency | ₹43,999 | 150 | 400 | ₹7,788 | **82.3%** | ₹3,744 | **91.5%** | 95.9% |

\* Typical use = 60% of listings, 50% of AI credits at the blended ₹11.28. All costs include the Razorpay fee.

- **If prices include GST:** net revenue is about 15% lower. Solo at 100% use = **80.0%**; Launch Pass = **76.5%**.
- **Annual billing** (12 months for the price of 10): −16.7% revenue. Solo at 100% use ≈ 79.7%.

### 7.3 Cost per asset compared with a freelancer

| Plan | Assets/mo (full use) | Agent pays per asset | Our cost per asset (worst case) | Freelancer per asset | Same volume from a freelancer |
|---|---:|---:|---:|---:|---:|
| Launch Pass | 4 | ₹50 | ₹10 | ₹500–1,500 | ₹2,000–6,000 |
| Solo | 40 | ₹137 | ₹23 | ₹500–1,500 | ₹20,000–60,000 |
| Pro | 100 | ₹110 | ₹19 | ₹500–1,500 | ₹50,000–1,50,000 |
| Team | 240 | ₹92 | ₹16 | ₹500–1,500 | ₹1.2L–3.6L |
| Agency | 600 | ₹73 | ₹13 | ₹500–1,500 | ₹3L–9L |

**What this table hides: agents pay for the plan, not for what they use.**

| Solo agent's real listings/mo | Agent pays per listing kit | Freelancer kit (₹2k–6k) | Verdict |
|---:|---:|---:|---|
| 10 | ₹550 | ₹2,000–6,000 | Clearly better |
| 3 | ₹1,833 | ₹2,000–6,000 | Only just cheaper than a budget freelancer |
| 1 | ₹5,499 | ₹2,000–6,000 | **Costs the same or more** |

**Break-even against a budget freelancer ≈ 2.75 listings a month.** Against Canva Pro or poster apps, ₹5,499 is about 10–20× more expensive. (Canva India pricing is from memory, not verified this session.)

### 7.4 Contribution margin is not profit

| Cost | Estimate | Effect |
|---|---|---|
| Infrastructure (Railway, Neon, domain, email, Sentry) | Railway ~$10–20/mo today; assume ≈ ₹10k/mo as it grows | Covered by ~2–3 Solo customers |
| **Founder time** | Example: ₹1.5L/mo | **≈ 33 Solo customers** to break even, the real line |
| **Customer acquisition cost** | Unknown, never measured | At 8% monthly churn (a guess), lifetime contribution per Solo customer ≈ ₹57k, so up to ≈ ₹19k can be spent acquiring one at a 3:1 ratio |
| Support, GST filing, accounting | Unknown | Grows with customer count |
| **Free users** | ₹25–50 each per month | 1,000 free users ≈ ₹25–50k/mo. **Free AI image credits are the one place losses can grow.** Recommend 0–1 credit on Free |

### 7.5 Detailed plan economics, with and without GST (added later the same day)

**Two GST cases:**
- **GST exclusive:** the customer pays list price + 18%. We keep the list price and pass the GST to the government.
- **GST inclusive:** the customer pays the list price. We keep price ÷ 1.18.

The Razorpay fee (2.36%) is charged on the **amount the customer actually pays**. That's slightly more accurate than §7.2, which put the fee on list price, so GST-exclusive margins here are about 0.4 points lower.

**Usage cases:**
- **100% use** = every listing and every AI credit used, with credits at the worst-case ₹15.
- **Typical use** = 60% of listings, 50% of credits, credits at the blended ₹11.28.

Assumptions as in §7.1: ₹5 per listing, 4 assets per listing, freelancer ₹500–1,500 per asset.

#### Per subscriber per month, 100% use

| Plan | Listings / AI credits | List price | GST | Customer pays | Our net revenue | Payment fee | AI image cost | Listing cost | **Total cost** | **Profit / user** | **Margin %** | Cost / asset | Agent pays / asset | Freelancer for same assets |
|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Launch Pass† | 1 / 2 | ₹199 | Excl | ₹235 | ₹199 | ₹6 | ₹30 | ₹5 | ₹41 | ₹158 | **79.6%** | ₹10 | ₹59 | ₹2,000–6,000 |
| | | | Incl | ₹199 | ₹169 | ₹5 | ₹30 | ₹5 | ₹40 | ₹129 | **76.5%** | ₹10 | ₹50 | |
| Solo | 10 / 50 | ₹5,499 | Excl | ₹6,489 | ₹5,499 | ₹153 | ₹750 | ₹50 | ₹953 | ₹4,546 | **82.7%** | ₹24 | ₹162 | ₹20,000–60,000 |
| | | | Incl | ₹5,499 | ₹4,660 | ₹130 | ₹750 | ₹50 | ₹930 | ₹3,730 | **80.0%** | ₹23 | ₹137 | |
| Pro | 25 / 100 | ₹10,999 | Excl | ₹12,979 | ₹10,999 | ₹306 | ₹1,500 | ₹125 | ₹1,931 | ₹9,068 | **82.4%** | ₹19 | ₹130 | ₹50,000–1,50,000 |
| | | | Incl | ₹10,999 | ₹9,321 | ₹260 | ₹1,500 | ₹125 | ₹1,885 | ₹7,437 | **79.8%** | ₹19 | ₹110 | |
| Team | 60 / 200 | ₹21,999 | Excl | ₹25,959 | ₹21,999 | ₹613 | ₹3,000 | ₹300 | ₹3,913 | ₹18,086 | **82.2%** | ₹16 | ₹108 | ₹1.2L–3.6L |
| | | | Incl | ₹21,999 | ₹18,643 | ₹519 | ₹3,000 | ₹300 | ₹3,819 | ₹14,824 | **79.5%** | ₹16 | ₹92 | |
| Agency | 150 / 400 | ₹43,999 | Excl | ₹51,919 | ₹43,999 | ₹1,225 | ₹6,000 | ₹750 | ₹7,975 | ₹36,024 | **81.9%** | ₹13 | ₹87 | ₹3L–9L |
| | | | Incl | ₹43,999 | ₹37,287 | ₹1,038 | ₹6,000 | ₹750 | ₹7,788 | ₹29,499 | **79.1%** | ₹13 | ₹73 | |

† A one-time purchase per listing, not a subscription.

#### Per subscriber per month, typical use

| Plan | GST | Our net revenue | Total cost | **Profit / user** | **Margin %** |
|---|---|---:|---:|---:|---:|
| Launch Pass | Excl / Incl | ₹199 / ₹169 | ₹20 / ₹19 | ₹179 / ₹150 | **90.0% / 88.7%** |
| Solo | Excl / Incl | ₹5,499 / ₹4,660 | ₹465 / ₹442 | ₹5,034 / ₹4,218 | **91.5% / 90.5%** |
| Pro | Excl / Incl | ₹10,999 / ₹9,321 | ₹945 / ₹899 | ₹10,054 / ₹8,423 | **91.4% / 90.4%** |
| Team | Excl / Incl | ₹21,999 / ₹18,643 | ₹1,921 / ₹1,827 | ₹20,078 / ₹16,816 | **91.3% / 90.2%** |
| Agency | Excl / Incl | ₹43,999 / ₹37,287 | ₹3,931 / ₹3,744 | ₹40,068 / ₹33,543 | **91.1% / 90.0%** |

#### Compared with a freelancer (full use)

| Plan | Assets/mo | Agent pays (Excl / Incl) | Freelancer low (₹500) | Freelancer high (₹1,500) | Agent saves vs low (Excl) | **Listings/mo to beat a ₹2k freelancer kit** (Excl / Incl) |
|---|---:|---:|---:|---:|---:|---:|
| Launch Pass | 4 | ₹235 / ₹199 | ₹2,000 | ₹6,000 | ₹1,765 | 0.12 / 0.10 |
| Solo | 40 | ₹6,489 / ₹5,499 | ₹20,000 | ₹60,000 | ₹13,511 | **3.24 / 2.75** |
| Pro | 100 | ₹12,979 / ₹10,999 | ₹50,000 | ₹1,50,000 | ₹37,021 | 6.49 / 5.50 |
| Team | 240 | ₹25,959 / ₹21,999 | ₹1,20,000 | ₹3,60,000 | ₹94,041 | 12.98 / 11.00 |
| Agency | 600 | ₹51,919 / ₹43,999 | ₹3,00,000 | ₹9,00,000 | ₹2,48,081 | 25.96 / 22.00 |

#### Monthly profit by subscriber count (all subscribers on one plan, 100% use, after ₹10k infrastructure)

| Plan | GST | 50 | 100 | 150 | 200 | 250 |
|---|---|---:|---:|---:|---:|---:|
| Solo | Excl | ₹2,17,293 (79.0%) | ₹4,44,586 (80.8%) | ₹6,71,880 (81.5%) | ₹8,99,173 (81.8%) | ₹11,26,466 (81.9%) |
| | Incl | ₹1,76,520 (75.8%) | ₹3,63,039 (77.9%) | ₹5,49,559 (78.6%) | ₹7,36,079 (79.0%) | ₹9,22,598 (79.2%) |
| Pro | Excl | ₹4,43,385 (80.6%) | ₹8,96,770 (81.5%) | ₹13,50,155 (81.8%) | ₹18,03,540 (82.0%) | ₹22,56,925 (82.1%) |
| | Incl | ₹3,61,831 (77.6%) | ₹7,33,661 (78.7%) | ₹11,05,492 (79.1%) | ₹14,77,322 (79.2%) | ₹18,49,153 (79.4%) |
| Team | Excl | ₹8,94,319 (81.3%) | ₹17,98,637 (81.8%) | ₹27,02,956 (81.9%) | ₹36,07,274 (82.0%) | ₹45,11,593 (82.0%) |
| | Incl | ₹7,31,202 (78.4%) | ₹14,72,404 (79.0%) | ₹22,13,607 (79.2%) | ₹29,54,809 (79.2%) | ₹36,96,011 (79.3%) |
| Agency | Excl | ₹17,91,186 (81.4%) | ₹35,92,372 (81.6%) | ₹53,93,557 (81.7%) | ₹71,94,743 (81.8%) | ₹89,95,929 (81.8%) |
| | Incl | ₹14,64,946 (78.6%) | ₹29,39,891 (78.8%) | ₹44,14,837 (78.9%) | ₹58,89,782 (79.0%) | ₹73,64,728 (79.0%) |

With typical use, each figure rises by about 10 points (Solo, 50 subscribers: ₹2,41,693 GST-exclusive / ₹2,00,920 GST-inclusive).

#### Mixed portfolio (70% Solo / 20% Pro / 8% Team / 2% Agency), the more realistic view

| Subscribers | Mix (S/P/T/A) | **Conservative:** GST incl, 100% use<br>net revenue → profit after infra (margin) | **Optimistic:** GST excl, typical use<br>net revenue → profit after infra (margin) | Conservative after infra + ₹1.5L founder |
|---:|---|---:|---:|---:|
| 50 | 35/10/4/1 | ₹3,68,178 → ₹2,83,725 (77.1%) | ₹4,34,450 → ₹3,87,103 (89.1%) | ₹1,33,725 |
| 100 | 70/20/8/2 | ₹7,36,356 → ₹5,77,450 (78.4%) | ₹8,68,900 → ₹7,84,207 (90.3%) | ₹4,27,450 |
| 150 | 105/30/12/3 | ₹11,04,534 → ₹8,71,175 (78.9%) | ₹13,03,350 → ₹11,81,310 (90.6%) | ₹7,21,175 |
| 200 | 140/40/16/4 | ₹14,72,712 → ₹11,64,900 (79.1%) | ₹17,37,800 → ₹15,78,414 (90.8%) | ₹10,14,900 |
| 250 | 175/50/20/5 | ₹18,40,890 → ₹14,58,625 (79.2%) | ₹21,72,250 → ₹19,75,517 (90.9%) | ₹13,08,625 |

The 70/20/8/2 mix is an assumption, not data.

#### Free tier cost per month

| Free users | 3 AI credits each (current) | 1 AI credit each | 0 AI credits |
|---:|---:|---:|---:|
| 50 | ₹2,500 | ₹1,000 | ₹250 |
| 100 | ₹5,000 | ₹2,000 | ₹500 |
| 250 | ₹12,500 | ₹5,000 | ₹1,250 |
| 500 | ₹25,000 | ₹10,000 | ₹2,500 |
| 1,000 | ₹50,000 | ₹20,000 | ₹5,000 |

**Not included in any profit figure:** customer acquisition cost, support time, accounting/GST filing, income tax, refunds. The contribution figures are an upper bound.

### 7.6 Comparison with the plans in production (`main` @ `4334eab`)

**Three corrections found while comparing:**

1. **In production, one credit is not one image.** Both generate entry points send `variations: 3` (`client/src/components/ai-chat/AIChatBox.tsx:799`, `client/src/components/editor/RightSidebar.tsx:538`), and the DTO allows up to 5. The orchestrator records `creditsUsed: 1` but costs `getTotalCost(model, variations)` = $0.06 × variations + LLM. Production cost per credit: **₹17.3 (3 images), ₹28.6 (5 images)**, plus ₹8.46 if that generation is made editable (first editable version per generation is free on paid tiers).
2. **§7.2 and §7.5 price an AI credit at ₹15, which assumes 1 credit = 1 image** (+ layerize). That holds for the proposed model *only if* the credit definition changes. If it doesn't, proposed margins equal production's.
3. **The August pricing PRD's "90.3–91.5% at 100% utilization" priced one image per generation** ("generate $0.06 + $0.004 LLM ≈ ₹5.31"). The app requests three. **Real production worst case is about 68%, and about 56% at 5 images**, below the PRD's own 75–80% target. Typical use is about 90%. The risk is the heaviest users.

#### What each plan includes

| Plan | Price (monthly / annual) | Production today | Proposed |
|---|---|---|---|
| Free | ₹0 | 3 generations (= 9 images) + 1 lifetime editable trial; V3 template/listing/export flow has no limit once shipped | 1 listing, 0–1 AI image credit |
| Solo | ₹5,499 / ₹52,999 | 50 generations (= 150 images), editable extra cap 10; V3 has no limit | 10 listings + 50 credits (= 50 images) |
| Pro | ₹10,999 / ₹1,05,999 | 100 generations (300 images), cap 25 | 25 listings + 100 credits |
| Team | ₹21,999 / ₹2,10,999 | 200 generations (600 images), cap 60, 5 users | 60 listings + 200 credits |
| Agency | ₹43,999 / ₹4,21,999 | 400 generations (1,200 images), cap 150, unlimited users | 150 listings + 400 credits |
| Launch Pass | — | Doesn't exist | ₹199 per listing |

#### Margin per subscriber per month

Production's Razorpay plan amounts are what the customer pays in total, so production is the GST-inclusive case if GST-registered.

| Plan | Production, typical | Production, 100% (3 images) | Production, 100% (5 images) | Proposed (1 credit = 1 image), 100%, GST incl | Proposed, 100%, GST excl |
|---|---:|---:|---:|---:|---:|
| Solo | ₹4,218 · 90.5% | ₹3,193 · **68.5%** | ₹2,629 · **56.4%** | ₹3,757 · **80.6%** | ₹4,572 · **83.1%** |
| Pro | ₹8,423 · 90.4% | ₹6,361 · **68.2%** | ₹5,233 · **56.1%** | ₹7,489 · **80.3%** | ₹9,120 · **82.9%** |
| Team | ₹16,816 · 90.2% | ₹12,673 · **68.0%** | ₹10,417 · **55.9%** | ₹14,929 · **80.1%** | ₹18,191 · **82.7%** |
| Agency | ₹33,543 · 90.0% | ₹25,197 · **67.6%** | ₹20,685 · **55.5%** | ₹29,709 · **79.7%** | ₹36,233 · **82.4%** |

- **Production annual plans** cost about 9.6 months (≈20% off, not the PRD's 12-for-10). At 100% use with 3 images, annual margin ≈ **61%** on every tier (Solo profit ₹2,301/month).
- **Production Free** costs ≈ ₹52 per active user per month (9 images) + ₹8 lifetime trial, and includes the whole V3 product with no limit once shipped. Proposed: ₹5–19.

#### What the comparison shows

1. **Most of the margin gain comes from changing the credit definition to "1 credit = 1 AI image",** not from adding listings. If the definition stays as it is, proposed margins equal production's.
2. **Agents will see it as a cut** (Solo: 150 images → 50). Make it fair either by **defaulting V3 to 1 image per generation** ("more options" costs extra credits; AI images are an extra in a template-first product), or by **raising credits** (Solo 150 = 150 images, keeping the ≈68% worst case).
3. **Production gaps:** worst case 56–68% vs the claimed 90%; Free gets V3 without limit; annual worst case ≈61%. Nothing loses money today, but the heaviest users and annual customers are the least profitable.
4. **GST registration:** if not registered, production margins are about 3 points higher. Registration becomes mandatory at about ₹20L annual turnover, roughly **31 Solo subscribers**. GST-exclusive pricing also suits agents who are GST-registered and want an invoice they can claim back.

#### Recommendation

1. Change the definition to **1 AI credit = 1 generated image**; default V3 to 1 image per generation.
2. Add the listings limit and plan checks on V3.
3. Raise annual to about 10 months (e.g. Solo ₹54,990), or accept ≈61% worst case on annual.
4. Correct the August PRD's margin claim (1 image vs 3 per generation).

### 7.7 Taxes and the number of images per generation: how others do it

#### Taxes

| Who | Buyer | How the price is shown | Invoice |
|---|---|---|---|
| ChatGPT India | Consumer | ₹1,999/month GST included, one figure | Reported split ₹1,694 + ₹305 GST |
| ChatGPT Business (India) | Business | Price before GST; handled at checkout with a GST number | Tax invoice |
| Canva India | Consumer | ≈ ₹4,000/year, one figure | GST included |
| Canva India | Business with a GSTIN | Same price | No GST on the invoice; the business pays it under reverse charge |
| US SaaS | US buyer | Price before tax; state sales tax added at checkout | Tax as a separate line |
| EU / UK | Consumer | Must include VAT (consumer law) | VAT as a separate line |
| EU / UK | Business with a VAT number | Price before VAT | Reverse-charge note |

**Key difference:** Canva and OpenAI are foreign suppliers, so Indian business customers pay the GST themselves (reverse charge). **Buildographic is an Indian supplier. Once registered, it charges GST to everyone;** business customers claim it back. For an agent with a GST number: pays ₹5,499 incl. GST, claims ₹839 back, real cost ₹4,660.

**Current state:** there's no GSTIN field, tax breakdown or invoice generation in the code (searched). The international billing PRD (2026-08-26) covers currency only, not tax. Razorpay charges the plan amount as entered, so production is GST-inclusive in practice.

**Recommendation:**
- **India:** show one GST-inclusive price ("₹5,499/month incl. 18% GST"); add an optional GSTIN at checkout; invoices show the taxable value + CGST/SGST or IGST (use the existing unused `Invoice` model). Confirm registration with the CA (required above ₹20L/year, ≈ 31 Solo subscribers).
- **International, later:**
  - *Razorpay International:* exports with a LUT carry no Indian GST, but the seller becomes responsible for foreign consumer taxes (EU VAT via OSS, UK VAT, US state sales tax). Fine for a few, mostly business, foreign customers.
  - *Merchant of record* (Paddle, Stripe Managed Payments, Dodo Payments): they are the legal seller and handle all foreign tax. ≈ 5% + $0.50 per transaction.
  - Recommended: stay India-only until a foreign market proves itself, then use a merchant of record for foreign customers and keep Razorpay for India.
- *Not tax advice. Confirm registration, LUT, place of supply and foreign-tax rules with a CA.*

#### Images per generation

| Product | Images per prompt | Charging |
|---|---|---|
| Midjourney | Grid of 4 | GPU time per job; upscaling is separate |
| Adobe Firefly (standard) | Up to 4 | 1 credit per generation (Adobe's wording) |
| Adobe Firefly (premium, Image 4 Ultra) | 1 | 20 credits per generation |
| Ideogram | 4 in its app | Per image, by quality tier (e.g. 3/6/10 credits) |
| Leonardo | You choose 1–8 | Tokens per image |
| Canva Magic Media | Several | Capped uses per plan (≈ 50/month reported for Pro) |
| ChatGPT images | 1 | Included, rate limited |

Two patterns: **cheap previews, pay for the one you keep** (Midjourney, Firefly) and **pay per image** (Ideogram, Leonardo, premium models; the growing trend).

**V3 changes what images are for:** the template supplies layout and text, so an AI image is a background extra. The ₹8.46 "make editable" step isn't needed in V3.

| Option | Per credit | Our cost per credit | Solo margin at 100% (GST incl, V3 without the editable step) |
|---|---|---:|---:|
| A. Today: 3 images at default quality | 3 choices | ₹17.3 | 77.6% |
| B. 1 image at default quality | 1 image | ₹6.0 | 89.7% |
| **C. 3 Turbo previews ($0.03 each)** | **3 choices** | **₹8.8** | **86.7%** |

**Recommendation: C.**
1. One credit = 3 Turbo previews; pick one.
2. Optional "higher quality" (Default/Quality model, e.g. 2 credits) for print or A4.
3. "More options" costs another credit.
4. **Test Ideogram 4 Turbo on 10 real prompts first.** It's the only real risk in this option.

---

## 8. AI inspiration, backgrounds and layer extraction: conclusions (same session)

- **AI background:** keep as a minor, optional extra (no good photo, or a decorative backdrop behind the template). Never a replacement for the property photo (PRD invariant 8). Demand is unproven, so build the cheap version.
- **"Inspiration image → extract layers" as the way to create designs: retire it.**
  - It reconstructs facts and layout that V3 already has.
  - It's fragile: garbled text, guessed geometry and fonts, and `text-block.mapper.ts` has to delete invented contact details.
  - It's the biggest driver of margin loss (≈ ₹26 per credit with 3 images + layerize).
  - It makes invented content look authoritative.
  - PRD B1 already excludes raster-to-layer extraction.
- **Creating new templates is a different job, and AI does help there.** It's done by the founder (curated library) and by agencies and brokerages (brand templates). Preferred approaches:
  - **(C) Text-free AI background + automatic field placement:** a vision model finds clear areas and places linked fields with contrast-aware colours. About ₹6–8, no manual field placement.
  - **(D) AI generates the layout directly** as structured data with fields already linked, in all formats at once (building on `layout-planner.service.ts`).
  - Optional middle ground: use an inspiration image as a visual reference; a vision model reads only its *layout*, and clean linked layers are rebuilt from it.
- **Ideogram `layerize-text` works on any image** (JPEG/PNG/WebP up to 10 MB; our code uploads raw bytes), **but it extracts text only.** Photo, logo, headshot, icons and shapes stay baked into one flat background, so the photo can't be swapped and the result isn't a reusable template. Text meaning isn't returned (field linking is a separate step). It's BETA (stylised text may be missed; Indian scripts untested). **Our mapper's contact-dropping rule would delete a user's real phone number on imports.**
- **The legitimate use of layer extraction is "import my existing design"** (Team/Agency): layerize (≈ ₹8.5) + a vision call to cut the photo, logo and headshot into replaceable frames (≈ ₹1) + AI field linking with user review + a contact-keeping rule for imports + a rights checkbox. Test on 5 real Canva exports first.
- **Images per generation:** one credit = **3 Turbo previews + 1 final default-quality render** of the chosen one (Remix at high image weight keeps the composition). ≈ ₹14.5 per finished image vs ₹17.3 today. 500-user profit ≈ ₹29.6L/month at 100% use (80.3%), ₹32.6L typical (88.6%). Print/A4 needs upscaling whichever tier is used.

### 8.1 Profit for 500 subscribers (350 Solo / 100 Pro / 40 Team / 10 Agency, GST incl, net revenue ₹36.8L/month)

| Setup | Profit/mo at 100% use | Profit/mo at typical use |
|---|---:|---:|
| **Old (production):** 3 default images per credit + free editable version | ₹25.1L (68.2%) | ₹33.3L (90.4%) |
| 1 image, Turbo | ₹34.0L (92.4%) | ₹34.9L (94.7%) |
| 1 image, default quality | ₹32.9L (89.4%) | ₹34.3L (93.2%) |
| 3 Turbo previews | ₹31.8L (86.4%) | ₹33.8L (91.7%) |
| **3 Turbo previews + 1 final render (recommended)** | **₹29.6L (80.3%)** | **₹32.6L (88.6%)** |
| 3 default images (new model, no editable step) | ₹28.5L (77.3%) | ₹32.1L (87.1%) |

Before infrastructure (≈ ₹10k), customer acquisition and founder pay. The user mix is assumed. Free users are excluded (per 500 free users: old ≈ ₹26k/month, new ≈ ₹2.5–10k/month).

---

## 9. Action plan (supersedes the earlier recommendations list)

**Critical path:** D1, D2, D4 → B2 → B3 → B4 → B5. No build work starts until D1, D2 and D4 are decided; they change what B4 and B5 build.

### 9.1 Decisions only the founder can make (this week)

| # | Decision | Recommendation |
|---|---|---|
| D1 | What one AI credit means | **1 credit = 3 Turbo previews + 1 final default-quality render** |
| D2 | Plan limits | **Listings/month + AI image credits**; count a listing when it's created (enforceable on the server) |
| D3 | Free tier | 1 listing, 0–1 AI credit, optional "Made with Buildographic" mark |
| D4 | Retire "inspiration image → extract layers" from the generation flow | **Yes.** Keep layer extraction only for a future "import my design" feature |
| D5 | GST display | **One GST-inclusive price + optional GSTIN at checkout**; confirm registration status with the CA |
| D6 | Annual price | Raise to ≈ 10 months (Solo ≈ ₹54,990), or accept ≈ 61% worst-case annual margin |
| D7 | Developer projects ("2 & 3 BHK from 78L") | Decide whether a project can be a listing (`ListingRecord` scope) |
| D8 | ₹199 per-listing Launch Pass | Test it in the B0 pilot |
| D9 | Positioning | Stay a "freelancer-replacement design tool", or test the lead/trust/compliance angle (§2) in B0 |
| D10 | Reopen US-EDIT-020's "no AI" Out of Scope | Yes, through a new story for B3 |

### 9.2 Quick fixes (one session each, no decisions needed)

| # | Fix | Where |
|---|---|---|
| Q1 | **Template fields that don't link:** `brand.accentColor`, `openHouse.date`, `report.*`. Add to `V3_SLOT_CATALOG` or remove from templates. Rename "MLS Listing Sheet" | `client/src/lib/v3ListingWorkflow.ts`, `api/scripts/data/premium-templates.data.ts` |
| Q2 | **Stop logging pasted listing text** (contains phone numbers; breaks the logging rule) | `api/src/modules/infographics/services/prompt-extractor.service.ts` |
| Q3 | **Correct the August pricing PRD's margin claim** (assumed 1 image per generation; production makes 3) | `docs/agile/PRD/2026-08-21-pricing-relaunch.md` |

### 9.3 Cheap tests before building (≈ $1–2 of API cost in total)

| # | Test | Answers |
|---|---|---|
| T1 | 10 real listing prompts: Turbo vs default; Remix at high image weight on the chosen preview | Is Turbo good enough? Does the final render keep the composition? (D1) |
| T2 | 5 real agent Canva exports through `layerize-text` | Is all text caught? Can the photo be separated? (future import feature) |
| T3 | Collect ≈ 30 real anonymised WhatsApp forwards | Test set for B3 |
| T4 | Production `UsageRecord` query: plain generations vs editable versions | Who would notice the editable step being retired? (D4) |
| T5 | 5 real listings × (freelancer brief / Canva / Buildographic), timed | Does "freelancer work in minutes" hold? (marketing claim) |

### 9.4 Build in V3 (core product, in order)

| # | Work | Size | Depends on |
|---|---|---|---|
| B1 | **Freeze general editor work** (layers, paint, arrange are good enough) | — | — |
| B2 | **Template families:** 3 looks × 4 formats, every field covered | M | Q1 |
| B3 | **LLM layer on top of the rules importer:** the model quotes its source text, code checks every fact, rules keep handling numbers (§5) | M | D10, T3 |
| B4 | **Plan checks on V3 + listings limit + new credit definition;** pricing PRD amendment; grandfather existing subscribers | M | D1, D2, D3 |
| B5 | **One-click kit:** listing → 4 formats, automatic photo choice and crop, text that fits automatically, AI headline copy (copy only, never facts) | L | B2, B3 |
| B6 | **AI background** with preview → final render, priced in credits | S–M | D1, T1 |
| B7 | **Compliance check before export:** MahaRERA QR code + registration numbers | S–M | — |
| B8 | **GSTIN at checkout + GST invoice** (existing `Invoice` model) | S–M | D5 |

### 9.5 Discovery (alongside the build)

- **B0 pilot, ≈ 20 agents.** Measure **listings per agent per month** and **AI credits used per listing**; every margin and break-even figure depends on them.
- Test the trust and leads angle: "Do you know whether your last poster produced an enquiry? Has a forward ever lost you a lead? How do you win a listing against other brokers?"

### 9.6 Later, once there's evidence

| Item | Trigger |
|---|---|
| AI template builder (text-free background + automatic field placement). Internal first, then Team/Agency | After B2 shows template families are the bottleneck |
| AI layout generation (structured layouts, fields linked, all formats at once) | After the template builder proves useful |
| "Import my design" (layerize + photo separation + field linking + contact-keeping rule) | T2 passes, and Team/Agency customers ask for it |
| QR code to a live listing page with lead tracking | B0 interviews support the leads angle (D9) |
| International billing through a merchant of record | A foreign market shows real demand |

---

## 10. Limits of this analysis

- The app was not run; V3 findings come from code reading plus one executed probe of `reviewListingText`.
- Web sources are mostly vendor pages, rate guides and trade press; survey figures came from summaries, not full reports.
- Freelancer rates are general Indian figures, not real-estate-specific. The share of agents who actually pay freelancers is unknown.
- Infrastructure cost at real volume, the negotiated Razorpay fee, churn and acquisition cost are unmeasured.
- Paying-customer count: as far as is known, the only production charge was the refunded ₹5,499 test (US-LAUNCH-005 AC6). All revenue figures are models.

---

## Sources

**Agent pain and the market**
- [NAR: tech agents rely on most in 2026](https://www.nar.realtor/news/real-estate-news/technology/the-tech-real-estate-agents-rely-on-most-in-2026)
- [82% of agents get zero leads from paid channels (NowBam)](https://nowbam.com/?p=162378)
- [Challenges of new agents (NowBam)](https://nowbam.com/challenges-of-new-agents-and-how-to-combat-them/)
- [Constant Contact: Canadian agents' marketing balancing act](https://www.constantcontact.com/blog/canadian-real-estate-agents-face-a-marketing-balancing-act/)

**WhatsApp brokerage tools (India)**
- [PropAI (Peerlist)](https://peerlist.io/vishalojha_me/project/propai-live) · [BrokerBrain](https://brokerbrain.pages.dev/about/) · [Chakra: WhatsApp for brokers](https://chakrahq.com/article/whatsapp-for-real-estate-brokers) · [Periskope case study](https://periskope.app/case-studies/real-estate-whatsapp-case-study) · [Sell.do: India proptech gaps 2026](https://www.sell.do/blog/real-estate-startup-ideas-india-2026)

**Compliance**
- [MahaRERA QR + registration mandate (Realty Today)](https://therealtytoday.com/news/regulatory/maharera-makes-qr-code-registration-number-mandatory-in-ads-50000-penalty-for-violations/) · [MahaRERA fines 628 projects (Housing.com)](https://housing.com/news/maharera-fines-628-projects-for-not-displaying-qr-code-registration-number/) · [MahaRERA + ASCI (Free Press Journal)](https://www.freepressjournal.in/amp/mumbai/maharashtra-maharera-partners-with-asci-to-spot-non-compliant-real-estate-developers)

**AI marketing and poster tools**
- [Luxury Presence: AI tools for agents](https://www.luxurypresence.com/blogs/ai-tools-for-real-estate-agents/) · [Real Estate News: new AI marketing tools](https://www.realestatenews.com/2026/04/22/new-ai-marketing-tools-aim-to-produce-pro-quality-content) · [HeyGen: AI tools for agents](https://www.heygen.com/blog/ai-tools-for-real-estate-agents)
- [Mathi Broker](https://npowerx-web.pages.dev/products/mathi-broker) · [tidit Realtor Posts](https://apps.apple.com/us/app/tidit-realtor-posts/id6751514675) · [Poster Maker by Kaagaz](https://apps.apple.com/us/app/-/id6751322723)

**Seller reports**
- [Rechat seller report](https://help.rechat.com/guides/marketing/marketing-center/seller-report) · [kvCORE seller report](https://help.insiderealestate.com/en/articles/3330215-kvcore-seller-report-overview)

**Trust and fake listings**
- [Square Yards: fake property listings](https://www.squareyards.com/blog/fake-property-listings-scam) · [AgentKart launch (Tribune)](https://www.tribuneindia.com/news/business/agentkart-launches-in-ncr-a-privacy-first-real-estate-platform-with-verified-highly-rated-agents/)

**Freelancer rates**
- [India freelance rates guide (June 2026)](https://mitti-website-3wy.pages.dev/guide-freelance-rates-india) · [upGrowth: social media management pricing](https://upgrowth.in/social-media-management-pricing/) · [Fueler: graphic designer rates per project](https://fueler.io/blog/graphic-designer-rates-per-project-real-proposals) · [Freelance rate calculator: graphic designer](https://freelanceratesindia.pages.dev/calculator/freelance-rate/graphic-designer) · [Fiverr: real estate flyer designers](https://block.fiverr.com/hire/real-estate-flyer-design)

**Exchange rate**
- [HDFC Sky: rupee closes at 94.86 (2 Nov 2026)](https://hdfcsky.com/news/rupee-falls-10-paise-to-close-at-94-86-against-us-dollar) · [HDFC Sky: rupee at 93.74](https://hdfcsky.com/news/rupee-rises-24-paise-to-93-74-against-us-dollar-in-early-trade) · [NewKerala: rupee gains (9 Nov 2026)](https://www.newkerala.com/news/a/rupee-gains-25-paise-against-us-dollar-lower-482.htm)

**Internal references**
- `docs/agile/PRD/2026-10-27-buildographic-property-campaign-platform.md` (PRD v1.1) and its gap analysis
- `docs/agile/PRD/2026-08-21-pricing-relaunch.md` (pricing relaunch, margin validation)
- `docs/agile/ROADMAP.md`, `docs/NORTH_STAR.md`
- V3 branch `codex/v3-listing-responsive-handoff` @ `b009539`
