# MVP Phased System Design — InfographicAI
**Version:** 1.0 | **Date:** 2026-04-29  
**Scope:** Phase 0.5 → Phase 2 — MVP launch then iterate  
**References:** `ARCHITECTURE_GAP_ANALYSIS.md` (Lovart comparison) + `ARCHITECTURE_RECOMMENDATIONS.md` (Cal.com comparison)  
**Goal:** Synthesize both architecture analyses into a single MVP-feasible, low-effort, phase-wise system design

---

## Part 1: Source Document Reconciliation

The two reference documents approach the system from different angles. This document unifies them.

| Dimension | ARCHITECTURE_GAP_ANALYSIS.md (Lovart) | ARCHITECTURE_RECOMMENDATIONS.md (Cal.com) | This Document (Synthesis) |
|-----------|--------------------------------------|------------------------------------------|--------------------------|
| **Focus** | AI product features and UX gaps | Infrastructure, code quality, CI/CD | MVP shipping + iterate by feature value |
| **Urgency frame** | Phase 0.5 = "before shipping" | "This week before launch" | Combined into a single Phase 0.5 |
| **Primary risk** | Broken AI features (Socket.io unwired, wrong model IDs) | Ops risk (no CI/CD, no error tracking, billing bugs) | Both must be addressed before users touch the product |
| **Phase 1 focus** | ConversationAiService, real chat, model routing | Code quality, test coverage, Prisma migrations | AI chat is the growth driver; code quality enables safe iteration |
| **Phase 2 focus** | Canvas context, QuickEdit, asset storage | SSR for marketing pages, shared packages | Refine loop before SEO — users first |
| **Infrastructure** | BullMQ at scale, Redis, CDN | Railway deploy, Sentry, health check | Sentry + health check now; BullMQ only at >100 concurrent |
| **Model strategy** | Replace Ideogram with Nano Banana | Not covered | Phased model adoption: Nano Flash in Phase 1, Nano Pro in Phase 2 |

### 1.1 Conflicts Resolved

| Conflict | Resolution |
|----------|-----------|
| GAP_ANALYSIS says "fix GPT model ID (gpt-5 → gpt-4o)" | KEEP gpt-5 — it was released Aug 7 2025 and is the correct current model |
| GAP_ANALYSIS says "replace Ideogram in Phase 0.5" | DEFER to Phase 1 — fix prompts first, change models when prompts are verified |
| ARCH_RECOMMENDATIONS says "SSR for marketing pages" | DEFER to Phase 2+ — user retention via AI quality matters more than SEO at launch |
| GAP_ANALYSIS says "BullMQ async queue in Phase 1" | Use `p-limit` in Phase 1 (simpler, no Redis dependency), BullMQ only at Phase 4 |

---

## Part 2: MVP Definition

### What "MVP" Means for This Product

MVP is not feature-complete. MVP is the minimum that:
1. A real estate agent can open the chat and generate a real infographic in under 2 minutes
2. The image reflects their listing's property details, agent info, and brand colors
3. Usage is recorded against their account and limits are enforced
4. The system doesn't crash, lose data, or generate silent billing errors

**MVP is NOT:** Perfect image quality, conversational AI, model routing, canvas editing, or full brand customization. Those are Phase 1+.

---

## Part 3: Phase 0.5 — Pre-Launch (Before any user touches the product)

**Effort: ~22 hours | Deadline: Before launch**

### 3.1 Critical Bugs — Fix These First (from ARCHITECTURE_RECOMMENDATIONS.md)

These are billing and data integrity bugs. Ship with these unfixed = financial and trust damage.

| Fix | File | Hours | Risk if Skipped |
|----|------|-------|-----------------|
| PT-03: Old subscription not cancelled on upgrade | `payments.service.ts:214-228` | 2h | Orphaned ACTIVE subscriptions, double billing |
| PT-04: Subscription active before webhook confirms | `payments.service.ts`, Prisma schema | 1h | Users get plan access before payment completes |
| PT-05: Verify TEAM plan shows ₹6,999 in RazorPay | RazorPay Dashboard | 5min | Users see wrong amount, abandon checkout |

### 3.2 Broken AI Features — Fix These Second (from ARCHITECTURE_GAP_ANALYSIS.md + scope audit)

Without these, image generation is broken or silently wrong.

| Fix | File | Hours | Risk if Skipped |
|----|------|-------|-----------------|
| Wire Socket.io Gateway to AppModule | `api/src/app.module.ts` | 2h | Progress bar never updates — users think it's frozen |
| AgentInfoForm values not sent to generation API | `AIChatBox.tsx:567-572`, `api.ts` | 2h | Agent name/colors are always defaults |
| Property features silently dropped from prompt | `generations.service.ts:119-134` | 1h | Pool/gym never appear in image |
| Listing type (for_sale/for_rent) not in prompt | `openai.service.ts:55-64` | 0.5h | All listings sound identical |
| Brand colors as hex (Ideogram reads as text, not color) | `openai.service.ts:51` | 1h | Brand colors have no effect |
| Variations DB write has no try-catch | `ai-orchestrator.service.ts:192-209` | 1h | Split DB state: completed status but no images |
| UsageScreen shows hardcoded mock data | `UsageScreen.tsx:17-62` | 3h | Users see fake "148 projects" not real count |

### 3.3 Observability — Minimum Ops Floor (from ARCHITECTURE_RECOMMENDATIONS.md)

Without these, production crashes are invisible.

| Fix | File | Hours | Risk if Skipped |
|----|------|-------|-----------------|
| Sentry error tracking (NestJS + React) | `api/src/main.ts`, `client/src/main.tsx` | 1h | Flying blind in production |
| Health check endpoint (`GET /api/health`) | `api/src/modules/health/` | 0.5h | Deploy platform can't detect crashes |
| CI/CD pipeline (GitHub Actions → Railway) | `.github/workflows/deploy.yml` | 2h | Manual deploys, no rollback |

### 3.4 Prompt Engineering MVP Fixes (from PROMPT_ENGINEERING_STRATEGY.md Phase 0.5)

Minimum prompt quality to produce useful infographics.

| Fix | File | Hours | Impact |
|----|------|-------|--------|
| Add system prompt / role to `analyzeProperty()` | `openai.service.ts:41` | 0.5h | Better headlines |
| Pass all fields through to image prompt | `openai.service.ts:55-64` | 1h | Full data in image |
| Add negative prompting to Ideogram call | `ideogram.service.ts:22-28` | 0.5h | Cleaner outputs |
| Add listing type context to image prompt | `openai.service.ts:55` | 0.5h | for_rent ≠ for_sale |

### Phase 0.5 — Effort Summary

| Category | Hours |
|----------|-------|
| Billing bugs (PT-03/04/05) | 3h |
| Broken AI features | 10h |
| Observability + CI/CD | 3.5h |
| Prompt improvements | 2.5h |
| **Total Phase 0.5** | **19h** |

### Phase 0.5 — System State After Completion

```
User opens AIChatBox → types property prompt
  → Backend validates address + price (existing)
  → Creates infographic record (existing)
  → Socket.io emits progress steps (NOW WIRED)  ← fixed
  → Orchestrator calls OpenAI with role prompt  ← fixed
  → Agent data (name, brokerage, colors) in prompt  ← fixed
  → Features (pool, gym) in prompt  ← fixed
  → Listing type (for sale / for rent) in prompt  ← fixed
  → Ideogram generates 3 images with negative prompts  ← fixed
  → Variations saved to DB with try-catch  ← fixed
  → Socket.io emits "completed"  ← fixed
  → Frontend shows 3 real variation thumbnails
  → Usage recorded → UsageScreen shows real count  ← fixed
  → Account stays within plan limits

Sentry catches any crash → developer alerted  ← new
Railway auto-deploys on push to main  ← new
```

---

## Part 4: Phase 1 — Conversational AI Core (Months 1–2)

**Effort: ~40 hours | Trigger: After MVP confirmed working for first 20 users**

**Goal:** The chat feels like a real assistant, not a form. Users can have a natural conversation that builds toward generation. Different listings get different visual treatments.

### 4.1 AI Quality Improvements (from PROMPT_ENGINEERING_STRATEGY.md Phase 1)

| Feature | New Service / File | Hours | What it Enables |
|---------|------------------|-------|----------------|
| Price tier classification | `price-tier.util.ts` | 1h | 4 distinct prompt paths (LUXURY/PREMIUM/MID/ENTRY) |
| Listing type branching | `openai.service.ts` | 1h | for_sale vs for_rent vs for_lease tones |
| Stage 1 intelligence (structured JSON output) | `openai.service.ts` | 3h | Headline + persona + visualStyle before image prompt |
| Brand context assembly (hex → description) | `brand-context.util.ts` | 2h | Colors work in Ideogram |
| Stage 3: LLM-generated image prompt (not template) | `openai.service.ts` | 4h | AI designs the visual |
| Style guides (5 styles: editorial-luxury, warm-modern, etc.) | `style-guides.ts` | 2h | Style-driven composition |
| Nano Banana Flash model (replace Ideogram Turbo) | `ideogram.service.ts` → `nano-banana.service.ts` | 4h | Better text rendering, cheaper FREE tier |

### 4.2 Conversational AI (from ARCHITECTURE_GAP_ANALYSIS.md Phase 1)

| Feature | New Service / File | Hours | What it Enables |
|---------|------------------|-------|----------------|
| `ConversationAiService` with RE system prompt | `conversation-ai.service.ts` | 10h | AI replies in context, not regex validation |
| Intent classification (gather_info / generate / refine) | Inside ConversationAiService | 3h | Routes user input correctly |
| `POST /conversations/:id/chat` unified endpoint | `conversations.controller.ts` | 3h | Single endpoint for all chat interactions |
| Remove regex gate in AIChatBox → call chat endpoint | `AIChatBox.tsx` | 3h | Natural conversation flow |
| AI-generated suggestion chips (3-4 dynamic post-response) | ConversationAiService | 3h | Context-aware follow-up chips |

### 4.3 Code Quality — Milestone 1 (from ARCHITECTURE_RECOMMENDATIONS.md)

| Fix | File | Hours | Risk if Deferred |
|----|------|-------|-----------------|
| Delete `server/payments/` duplicate codebase | `server/payments/` → delete | 4h | Bugs fixed in NestJS silently missed in Express |
| Replace `prisma db push` with proper migrations | CI pipeline + `prisma migrate` | 2h | Schema drift, no rollback |
| Critical path unit tests (payments + generation) | `api/tests/` | 8h | CI/CD pipeline runs no tests |

### Phase 1 — Effort Summary

| Category | Hours |
|----------|-------|
| AI quality (prompt engineering Phase 1) | 17h |
| Conversational AI (Phase 1 from GAP_ANALYSIS) | 22h |
| Code quality (Milestone 1 from ARCH_RECOMMENDATIONS) | 14h |
| **Total Phase 1** | **~40h net** (parallel streams) |

### Phase 1 — System State After Completion

```
User types: "4BR luxury condo in Bandra, Mumbai listed at ₹8 crore"
  → POST /conversations/:id/chat
  → ConversationAiService: intent = ready_to_generate
  → Stage 1: classify LUXURY tier + for_sale
  → Stage 1 OpenAI call returns:
      { headline: "Sky-High Living in Bandra", 
        visualStyle: "editorial-luxury",
        emotionalTone: "aspirational",
        buyerPersona: "luxury-buyer" }
  → Stage 2: build brand context (hex → "deep navy blue, prestigious")
  → Stage 3: LLM writes image brief in editorial-luxury style
  → Nano Banana Flash generates 3 images (NOT Ideogram)
  → Socket.io streams 5 progress steps
  → Dynamic chips appear: [Create open house version] [Add luxury overlay] [Show in landscape]
  
User types: "2BR rental near office park, ₹45,000/month"
  → Stage 1: classify ENTRY tier + for_rent
  → Stage 1 returns: { visualStyle: "warm-modern", emotionalTone: "lifestyle" }
  → Stage 3: LLM writes completely different brief — lifestyle-forward, warm lighting
  → Different image generated automatically  ← never required user input
```

---

## Part 5: Phase 2 — Refine Loop & Quality (Months 3–5)

**Effort: ~50 hours | Trigger: After 100 active users confirmed using Phase 1**

**Goal:** Users can refine without full regeneration. Infographic images persist permanently (no URL expiry). Agent brand kit is stored per account.

### 5.1 Refinement UX (from ARCHITECTURE_GAP_ANALYSIS.md Phase 2)

| Feature | New Service / File | Hours | What it Enables |
|---------|------------------|-------|----------------|
| `QuickEditService` — preset refinements | `quick-edit.service.ts` | 8h | One-tap: "luxury style", "darker", "sold overlay" |
| Canvas state → AI context injection | `canvas-context-injector.ts` (frontend) | 4h | "Make the price section larger" works |
| Meaningful variation briefs (3 story types) | `ai-orchestrator.service.ts` | 3h | 3 structurally different compositions |
| Nano Banana Pro for TEAM/BROKERAGE tiers | Model router update | 4h | 2K/4K quality at premium tiers |
| Pre-generation task plan message | `ConversationAiService` | 3h | User sees what AI plans before credits are spent |

### 5.2 Data Persistence (from ARCHITECTURE_GAP_ANALYSIS.md Phase 2, ADR-003)

| Feature | New Service / File | Hours | What it Enables |
|---------|------------------|-------|----------------|
| Asset storage (Cloudflare R2) | `asset-storage.service.ts` | 10h | Generated images never expire |
| Agent Profile persistence (brand kit per account) | `agent-profile.service.ts` | 4h | Auto-fill name/brokerage/colors every generation |
| Output format selector (Social 1K / Print 4K) | Frontend UI + API | 4h | Right resolution for right use case |
| Property photo upload → reference in generation | Multer + R2 + API | 6h | Agent's own photos used in infographics |

### 5.3 What NOT to Build in Phase 2 (from ARCHITECTURE_GAP_ANALYSIS.md — explicitly deferred)

| Item | Decision | Reason |
|------|----------|--------|
| Semantic layer split (SAM 2) | Phase 3 only | Adds $0.02-0.05/edit cost; not justified until users demand layer editing |
| OCR text editing within images | Phase 3 only | Complex — Quick Edit covers 80% of the use case |
| BullMQ + Redis | Phase 4 only | `p-limit` with 4 concurrent handles <100 simultaneous generations |
| Infinite canvas (Konva.js) | Not this year | 60h+ migration, breaks existing canvas — not justified |
| SSR for marketing pages | Phase 2-3 only if organic SEO becomes acquisition channel | |
| Shared packages (Turborepo) | Phase 4 (B2B API) only | No benefit until second app exists |

### Phase 2 — Effort Summary

| Category | Hours |
|----------|-------|
| Refinement UX | 22h |
| Data persistence (R2, agent profile) | 24h |
| **Total Phase 2** | **~46h** |

---

## Part 6: Full Phase-Wise Effort Overview

| Phase | Timeframe | Effort | Goal | Key Deliverable |
|-------|-----------|--------|------|----------------|
| **0.5** | Before launch | 19h | Fix broken features + observability | Working generation + real usage data |
| **1** | Month 1–2 | ~40h | Real conversational AI + quality routing | Chat feels like an assistant |
| **2** | Month 3–5 | ~46h | Refine loop + persistence | Edit without full regen |
| **3** | Month 6–12 | ~130h | Semantic editing + campaigns | Power-user production suite |
| **4** | Month 12+ | ~130h | Infrastructure scale | 10K+ concurrent users |

---

## Part 7: Infrastructure Decision Matrix

This cross-references both architecture documents into a single authoritative decision table.

| Infrastructure Item | Source Doc | Decision | Phase | Trigger |
|--------------------|-----------|----------|-------|---------|
| Sentry error tracking | ARCH_RECOMMENDATIONS | ✅ Now | 0.5 | Before any user |
| Health check endpoint | ARCH_RECOMMENDATIONS | ✅ Now | 0.5 | Before any user |
| GitHub Actions CI/CD → Railway | ARCH_RECOMMENDATIONS | ✅ Now | 0.5 | Before any user |
| Socket.io Gateway wired to AppModule | GAP_ANALYSIS A-02 | ✅ Now | 0.5 | Before any user |
| Prisma migrations (replace db push) | ARCH_RECOMMENDATIONS | ✅ Phase 1 | 1 | Milestone 1 |
| Delete server/payments/ duplicate | ARCH_RECOMMENDATIONS | ✅ Phase 1 | 1 | Milestone 1 |
| `p-limit` concurrency control (4 max) | GAP_ANALYSIS ADR-002 | ✅ Phase 1 | 1 | With async queue |
| Nano Banana Flash (replace Ideogram Turbo) | GAP_ANALYSIS | ✅ Phase 1 | 1 | With model router |
| Nano Banana Pro (TEAM/BROKERAGE tier) | GAP_ANALYSIS | ✅ Phase 2 | 2 | With quality routing |
| Cloudflare R2 asset storage | GAP_ANALYSIS ADR-003 | ✅ Phase 2 | 2 | With refine loop |
| BullMQ + Redis job queue | GAP_ANALYSIS ADR-002 | 🔄 Phase 4 | 4 | >100 concurrent generations |
| Redis session cache | GAP_ANALYSIS D-01 | 🔄 Phase 4 | 4 | >1,000 concurrent users |
| CDN (Cloudflare) | GAP_ANALYSIS D-02 | 🔄 Phase 2 | 2 | With R2 storage |
| SSR for marketing pages | ARCH_RECOMMENDATIONS | 🔄 Phase 3 | 3 | Only if organic SEO matters |
| Shared packages (Turborepo) | ARCH_RECOMMENDATIONS | 🔄 Phase 4 | 4 | When B2B API begins |
| tRPC | ARCH_RECOMMENDATIONS | 🚫 Skip | — | Not until second internal service |
| Next.js migration | ARCH_RECOMMENDATIONS | 🚫 Never | — | Migration cost > benefit |
| Konva.js infinite canvas | GAP_ANALYSIS D-03 | 🚫 Defer | — | Not until canvas is primary surface |
| Python AI microservices | GAP_ANALYSIS | 🚫 Never | — | NestJS handles this |
| Model Select UI exposed to users | GAP_ANALYSIS | 🚫 Never | — | Model opacity is product identity |

---

## Part 8: AI Feature Adoption Matrix

Cross-references both documents for AI/product features only.

| AI Feature | Source | Decision | Phase | Effort | User Impact |
|-----------|--------|----------|-------|--------|-------------|
| Wire Socket.io progress | GAP_ANALYSIS A-02 | ✅ Now | 0.5 | 2h | Progress bar works |
| Full data into image prompt | PROMPT_ENG | ✅ Now | 0.5 | 2h | Features appear in image |
| System prompt + negative prompts | PROMPT_ENG | ✅ Now | 0.5 | 1h | Cleaner outputs |
| Agent form data → API call | Scope audit | ✅ Now | 0.5 | 2h | Real agent name/colors |
| Price tier branching (4 tiers) | PROMPT_ENG | ✅ Phase 1 | 1 | 4h | Different images by price |
| LLM-generated image prompt (not template) | PROMPT_ENG | ✅ Phase 1 | 1 | 7h | AI reasons visually |
| ConversationAiService (real chat) | GAP_ANALYSIS A-01 | ✅ Phase 1 | 1 | 13h | Chat works conversationally |
| AI-generated suggestion chips | GAP_ANALYSIS B-04 | ✅ Phase 1 | 1 | 3h | Dynamic follow-up |
| Pre-generation task plan | GAP_ANALYSIS B-05 | ✅ Phase 1 | 1 | 3h | No credit waste |
| Nano Banana Flash (FREE/SOLO) | GAP_ANALYSIS | ✅ Phase 1 | 1 | 4h | Better text rendering |
| 3 story-driven variation briefs | PROMPT_ENG | ✅ Phase 2 | 2 | 3h | Diverse variations |
| QuickEditService (preset refinements) | GAP_ANALYSIS B-02 | ✅ Phase 2 | 2 | 8h | Edit without full regen |
| Canvas state → AI context | GAP_ANALYSIS B-01 | ✅ Phase 2 | 2 | 4h | "Make price larger" works |
| Agent Profile brand kit (persistent) | PROMPT_ENG | ✅ Phase 2 | 2 | 4h | Auto-fill brand always |
| Nano Banana Pro (TEAM/BROKERAGE) | GAP_ANALYSIS | ✅ Phase 2 | 2 | 4h | 2K/4K quality |
| Property photo upload | GAP_ANALYSIS | ✅ Phase 2 | 2 | 6h | Agent's photos in image |
| Mark Mode / element-level edit | GAP_ANALYSIS B-03 | ✅ Phase 3 | 3 | 16h | Click price, change it |
| Campaign Mode (4-piece set) | GAP_ANALYSIS ADR-006 | ✅ Phase 3 | 3 | 24h | Full campaign in one click |
| Semantic layer split (SAM 2) | GAP_ANALYSIS C-01 | ✅ Phase 3 | 3 | 20h | Edit infographic layers |
| Market data enrichment (Gemini + search) | GAP_ANALYSIS | ✅ Phase 3 | 3 | 12h | Live neighborhood data |
| Background removal | GAP_ANALYSIS C-07 | ✅ Phase 3 | 3 | 6h | Clean property photos |
| Edit text within images (OCR + inpaint) | GAP_ANALYSIS C-02 | ✅ Phase 3 | 3 | 20h | Fix price without regen |
| Mockup generator (yard sign, billboard) | GAP_ANALYSIS C-06 | ✅ Phase 3 | 3 | 18h | Presentation mockups |

---

## Part 9: Recommended Iteration Loop

The product strategy is: **ship fast, observe, iterate on highest-friction points.**

```
Phase 0.5 → Launch → Observe 20 users → Phase 1 → Observe 100 users → Phase 2
    │                      │                               │
    ▼                      ▼                               ▼
Fix broken            What stops them       What makes them generate
foundation            from completing       more per month?
                      1st generation?
```

**User signals that trigger Phase transitions:**

| Signal | Trigger | Action |
|--------|---------|--------|
| >20% of sessions end with error on generation | Phase 0.5 incomplete | Fix before Phase 1 |
| >30% of users abandon after seeing the prompt input | Phase 1 ready | Add ConversationAiService |
| Users ask "can I change just the price?" in support | Phase 2 ready | Add QuickEditService |
| Average user generates >5/month | Phase 2 validated | Add agent profile persistence |
| Enterprise users request 4-piece campaign sets | Phase 3 ready | Add CampaignOrchestrator |
| >100 concurrent generations observed | Phase 4 ready | Upgrade to BullMQ + Redis |

---

## Part 10: What to Ignore From Both Source Documents

Both reference documents contain things that should not be in scope for InfographicAI's MVP trajectory.

| Item From Source Docs | Why It Doesn't Apply |
|-----------------------|----------------------|
| ARCH_RECOMMENDATIONS: tRPC | No second internal service; migration cost >> benefit at current scale |
| ARCH_RECOMMENDATIONS: Turborepo | No multiple apps yet |
| ARCH_RECOMMENDATIONS: SSR rewrite | Not an SEO product — users must log in; organic search irrelevant in Phase 1 |
| GAP_ANALYSIS: Konva.js infinite canvas | AI chat IS the product; canvas is a preview surface |
| GAP_ANALYSIS: 20+ video models routing | No RE video use case identified |
| GAP_ANALYSIS: 3D generation (Tripo) | No RE use case |
| GAP_ANALYSIS: Python microservices | NestJS handles all AI orchestration needed through Phase 3 |
| GAP_ANALYSIS: Lovart's dark theme system | Own design system already in place |
| GAP_ANALYSIS: @ Mention model lock | Model opacity is product identity — never expose model names |
| ARCH_RECOMMENDATIONS: Next.js migration | 80-120h with high breaking risk — not worth it for a logged-in SaaS |

---

*Related documents: `PROMPT_ENGINEERING_STRATEGY.md` | `ARCHITECTURE_GAP_ANALYSIS.md` | `ARCHITECTURE_RECOMMENDATIONS.md`*  
*Last Updated: 2026-04-29*
